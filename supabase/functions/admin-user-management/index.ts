import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// ── Stripe helper: resolve + cancel ALL open subscriptions for a user ──────
// Resolution order: user_memberships.stripe_subscription_id → stored customer
// IDs (memberships + profiles) → Stripe customer lookup by auth email.
async function cancelStripeSubsForUser(adminClient: any, userId: string, immediately: boolean) {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return { cancelled: [], errors: ["STRIPE_SECRET_KEY not configured"], found: 0 };
  const H = { Authorization: `Bearer ${stripeKey}` };
  const subIds = new Set<string>();
  const custIds = new Set<string>();

  const { data: m } = await adminClient.from("user_memberships")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (m?.stripe_subscription_id) subIds.add(m.stripe_subscription_id);
  if (m?.stripe_customer_id) custIds.add(m.stripe_customer_id);

  const { data: p } = await adminClient.from("profiles")
    .select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (p?.stripe_customer_id) custIds.add(p.stripe_customer_id);

  if (custIds.size === 0) {
    const { data: au } = await adminClient.auth.admin.getUserById(userId);
    const email = au?.user?.email;
    if (email) {
      const r = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=5`, { headers: H });
      const j = await r.json();
      for (const c of j?.data ?? []) custIds.add(c.id);
    }
  }

  const OPEN = ["active", "trialing", "past_due", "unpaid"];
  for (const cid of custIds) {
    const r = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${cid}&status=all&limit=20`, { headers: H });
    const j = await r.json();
    for (const s of j?.data ?? []) if (OPEN.includes(s.status)) subIds.add(s.id);
  }

  const cancelled: string[] = [];
  const errors: string[] = [];
  for (const sid of subIds) {
    try {
      const res = immediately
        ? await fetch(`https://api.stripe.com/v1/subscriptions/${sid}`, { method: "DELETE", headers: H })
        : await fetch(`https://api.stripe.com/v1/subscriptions/${sid}`, {
            method: "POST",
            headers: { ...H, "Content-Type": "application/x-www-form-urlencoded" },
            body: "cancel_at_period_end=true",
          });
      const j = await res.json();
      if (!res.ok) {
        // Stale stored ID pointing at an already-canceled/missing sub → not an error
        if (j?.error?.code === "resource_missing" || /canceled/i.test(j?.error?.message ?? "")) continue;
        throw new Error(j?.error?.message || `HTTP ${res.status}`);
      }
      cancelled.push(sid);
    } catch (e: any) { errors.push(`${sid}: ${e.message}`); }
  }
  return { cancelled, errors, found: subIds.size, customerIds: [...custIds] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Verify admin
    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, userId, updates } = body;

    switch (action) {

      // ── CREATE USER ────────────────────────────────────────────────────────
      case "create_user": {
        const { email, full_name, tier, send_invite } = body;
        if (!email) throw new Error("email required");

        const validTiers = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];
        const chosenTier = validTiers.includes(tier) ? tier : "free";

        // 1. Create auth user (invite flow – sends signup email automatically)
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: false,           // keeps user unconfirmed until they click the email
          user_metadata: { full_name: full_name || "" },
          ...(send_invite !== false && { // send invite/magic-link email
            app_metadata: {}
          })
        });
        if (createErr) throw createErr;

        const uid = newUser.user.id;

        // 2. Upsert profile row
        await adminClient.from("profiles").upsert({
          id: uid,
          full_name: full_name || null,
          membership_tier: chosenTier,
          created_at: new Date().toISOString(),
          onboarding_completed: false,
        }, { onConflict: "id" });

        // 3. Grant tier via admin_granted_access (if non-free)
        if (chosenTier !== "free") {
          await adminClient.from("admin_granted_access").insert({
            user_id: uid,
            access_type: "membership",
            tier: chosenTier,
            access_id: chosenTier,
            is_active: true,
            granted_by: user.id,
            granted_at: new Date().toISOString(),
          });
        }

        // 4. Send invite/signup email so the user can set their password
        //    generateLink type "invite" sends a proper "You're invited" email
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: "invite",
          email,
          options: {
            data: { full_name: full_name || "" },
          },
        });
        if (linkErr) {
          // Non-fatal — user is still created, just log the error
          console.error("generateLink error:", linkErr.message);
        }

        return new Response(JSON.stringify({
          success: true,
          user_id: uid,
          email,
          invite_link: linkData?.properties?.action_link || null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── LIST USERS ────────────────────────────────────────────────────────
      case "list_users": {
        const { data: authUsers, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;

        const uids = authUsers.users.map((u) => u.id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, avatar_url, created_at")
          .in("id", uids);

        const { data: memberships } = await adminClient
          .from("user_memberships")
          .select("user_id, tier, stripe_customer_id, affiliate_id, created_at, expires_at")
          .in("user_id", uids);

        const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
        const memberMap = Object.fromEntries((memberships || []).map((m) => [m.user_id, m]));

        const enriched = authUsers.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed: !!u.email_confirmed_at,
          banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
          profile: profileMap[u.id] || null,
          membership: memberMap[u.id] || null,
        }));

        return new Response(JSON.stringify({ users: enriched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_profile_tier": {
        if (!userId || !updates?.membership_tier) throw new Error("userId and membership_tier required");

        const validTiers = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];
        if (!validTiers.includes(updates.membership_tier)) throw new Error("Invalid tier");

        const { data: targetIsAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (targetIsAdmin && updates.membership_tier === "free") {
          throw new Error("Cannot set admin accounts to free tier");
        }

        const { error: profileErr } = await adminClient
          .from("profiles")
          .update({ membership_tier: updates.membership_tier })
          .eq("user_id", userId);

        if (profileErr) throw profileErr;

        const underscoreTier = updates.membership_tier.replace(/-/g, "_");
        await adminClient
          .from("user_memberships")
          .upsert({
            user_id: userId,
            tier: underscoreTier,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          .then(() => {});

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "delete_user": {
        if (!userId) throw new Error("userId required");
        const { data: targetIsAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (targetIsAdmin) throw new Error("Cannot delete admin accounts");

        // Cancel any open Stripe subscription BEFORE deleting, otherwise
        // billing continues after the account is gone. Abort on failure.
        const stripeDel = await cancelStripeSubsForUser(adminClient, userId, true);
        if (stripeDel.errors.length > 0) {
          throw new Error(`Deletion aborted — Stripe subscription could not be cancelled: ${stripeDel.errors.join("; ")}. Cancel it in the Stripe dashboard, then retry.`);
        }

        await adminClient.from("admin_granted_access").delete().eq("user_id", userId);
        await adminClient.from("user_memberships").delete().eq("user_id", userId);
        await adminClient.from("shc_transactions").delete().eq("user_id", userId);
        await adminClient.from("user_balances").delete().eq("user_id", userId);
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        await adminClient.from("profiles").delete().eq("user_id", userId);

        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_membership": {
        if (!userId || !updates?.tier) throw new Error("userId and tier required");

        const tierSlugMap: Record<string, string> = {
          free: "atma-seed",
          atma_seed: "atma-seed",
          prana_flow: "prana-flow",
          siddha_quantum: "siddha-quantum",
          akasha_infinity: "akasha-infinity",
        };
        const slug = tierSlugMap[updates.tier];
        if (!slug) throw new Error("Invalid tier");

        const { data: tierRow, error: tierErr } = await adminClient
          .from("membership_tiers").select("id").eq("slug", slug).maybeSingle();
        if (tierErr || !tierRow?.id) throw new Error(`Tier '${slug}' not found in membership_tiers`);

        // Lifetime tiers (akasha-infinity) never expire unless explicitly overridden.
        const isLifetimeTier = slug === "akasha-infinity";
        const expiresAt = updates.expires_at ?? (isLifetimeTier ? null : undefined);

        const { error } = await adminClient
          .from("user_memberships")
          .upsert({
            user_id: userId,
            tier_id: tierRow.id,
            status: "active",
            updated_at: new Date().toISOString(),
            ...(expiresAt !== undefined ? { expires_at: expiresAt } : {}),
            ...(updates.manual_grant ? {
              stripe_subscription_id: null,
              stripe_customer_id: null,
            } : {}),
          }, { onConflict: "user_id" });

        if (error) throw error;

        const hyphenTier = slug;
        await adminClient.from("profiles").update({ membership_tier: hyphenTier }).eq("user_id", userId);

        // Log manual grants distinctly from Stripe purchases so revenue reporting
        // and support history can tell the two apart later.
        if (updates.manual_grant) {
          try {
            await adminClient.from("admin_action_log").insert({
              action: "manual_membership_grant",
              target_user_id: userId,
              details: { tier: slug, note: updates.note ?? null, granted_amount: updates.granted_amount ?? null },
            });
          } catch { /* audit log is best-effort, never block the actual grant */ }
        }

        return new Response(JSON.stringify({ success: true, tier_id: tierRow.id, slug }), { headers: corsHeaders });
      }

      case "ban_user": {
        if (!userId) throw new Error("userId required");
        const { data: targetIsAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (targetIsAdmin) throw new Error("Cannot ban admin accounts");

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: updates?.unban ? "none" : "876600h",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "reset_password": {
        if (!userId) throw new Error("userId required");

        // Resolve auth user id — caller may pass either profiles.id or auth user_id.
        let authUserId = userId;
        let email: string | undefined;
        const { data: byAuth } = await adminClient.auth.admin.getUserById(userId);
        if (byAuth?.user?.email) {
          email = byAuth.user.email;
        } else {
          const { data: prof } = await adminClient
            .from("profiles")
            .select("user_id")
            .eq("id", userId)
            .maybeSingle();
          if (prof?.user_id) {
            authUserId = prof.user_id;
            const { data: byProf } = await adminClient.auth.admin.getUserById(authUserId);
            email = byProf?.user?.email ?? undefined;
          }
        }
        if (!email) throw new Error("User email not found");

        // Use the branded send-reset-email function (Resend, gold styling, localized)
        // instead of Supabase's default plain auth email.
        const { data: invokeData, error } = await adminClient.functions.invoke('send-reset-email', {
          body: { email },
        });
        if (error) throw error;
        if (invokeData?.error) throw new Error(invokeData.error);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "set_password": {
        if (!userId) throw new Error("userId required");
        const newPassword = body.password || updates?.password;
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
          throw new Error("password required (min 6 chars)");
        }

        // Resolve auth user id (caller may pass profiles.id)
        let authUserId = userId;
        const { data: byAuth } = await adminClient.auth.admin.getUserById(userId);
        if (!byAuth?.user) {
          const { data: prof } = await adminClient
            .from("profiles").select("user_id").eq("id", userId).maybeSingle();
          if (prof?.user_id) authUserId = prof.user_id;
        }

        const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
          password: newPassword,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }


      case "get_user": {
        if (!userId) throw new Error("userId required");
        const { data, error } = await adminClient.auth.admin.getUserById(userId);
        if (error) throw error;
        return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── CANCEL SUBSCRIPTION ──────────────────────────────────────────────
      case "cancel_subscription": {
        if (!userId) throw new Error("userId required");
        const cancelImmediately = body.immediately === true;

        // Cancel in Stripe FIRST — hard-fail if Stripe cancellation errors,
        // so the admin is never shown success while billing continues.
        const stripe = await cancelStripeSubsForUser(adminClient, userId, cancelImmediately);
        if (stripe.errors.length > 0) {
          return new Response(JSON.stringify({
            error: `Stripe cancellation FAILED — user may still be billed. ${stripe.errors.join("; ")}`,
            stripe,
          }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: membership } = await adminClient
          .from("user_memberships")
          .select("id, expires_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membership?.id) {
          await adminClient
            .from("user_memberships")
            .update({
              status: cancelImmediately ? "canceled" : "active",
              canceled_at: new Date().toISOString(),
            })
            .eq("id", membership.id);
        }

        if (cancelImmediately) {
          await adminClient
            .from("admin_granted_access")
            .update({ is_active: false })
            .eq("user_id", userId)
            .eq("access_type", "membership");
          await adminClient
            .from("profiles")
            .update({ membership_tier: "free" })
            .eq("user_id", userId);
        }

        return new Response(JSON.stringify({
          success: true,
          mode: cancelImmediately ? "immediate" : "period_end",
          stripe_found: stripe.found,
          stripe_cancelled: stripe.cancelled.length,
          stripe_subscription_ids: stripe.cancelled,
          warning: stripe.found === 0
            ? "No open Stripe subscription found for this user — verify in the Stripe dashboard."
            : null,
          expires_at: membership?.expires_at || null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── SEND CUSTOM MESSAGE (upgrade nudge, any admin note) ──────────────
      case "send_message": {
        if (!userId) throw new Error("userId required");
        const subject = body.subject || "A message from Sacred Healing";
        const message = body.message;
        if (!message) throw new Error("message required");

        const { data: invokeData, error } = await adminClient.functions.invoke("send-to-user", {
          body: {
            target_user_id: userId,
            email_type: "custom",
            custom_subject: subject,
            custom_body: message,
          },
        });
        if (error) throw error;
        if (invokeData?.error) throw new Error(invokeData.error);
        return new Response(JSON.stringify({ success: true, result: invokeData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
