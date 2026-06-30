import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
          .eq("id", userId);

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

        await adminClient.from("admin_granted_access").delete().eq("user_id", userId);
        await adminClient.from("user_memberships").delete().eq("user_id", userId);
        await adminClient.from("shc_transactions").delete().eq("user_id", userId);
        await adminClient.from("user_balances").delete().eq("user_id", userId);
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        await adminClient.from("profiles").delete().eq("id", userId);

        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_membership": {
        if (!userId || !updates?.tier) throw new Error("userId and tier required");

        const validTiers = ["free", "prana_flow", "siddha_quantum", "akasha_infinity"];
        if (!validTiers.includes(updates.tier)) throw new Error("Invalid tier");

        const { error } = await adminClient
          .from("user_memberships")
          .upsert({
            user_id: userId,
            tier: updates.tier,
            updated_at: new Date().toISOString(),
            ...(updates.expires_at ? { expires_at: updates.expires_at } : {}),
          }, { onConflict: "user_id" });

        if (error) throw error;

        const hyphenTier = updates.tier.replace(/_/g, "-");
        await adminClient.from("profiles").update({ membership_tier: hyphenTier }).eq("id", userId);

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
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

        const { data: membership } = await adminClient
          .from("user_memberships")
          .select("id, stripe_subscription_id, expires_at, status")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let stripeResult: any = null;
        const subId = membership?.stripe_subscription_id;
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

        if (subId && stripeKey) {
          try {
            if (cancelImmediately) {
              const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${stripeKey}` },
              });
              stripeResult = await res.json();
              if (!res.ok) throw new Error(stripeResult?.error?.message || "Stripe cancel failed");
            } else {
              const params = new URLSearchParams();
              params.set("cancel_at_period_end", "true");
              const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${stripeKey}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
              });
              stripeResult = await res.json();
              if (!res.ok) throw new Error(stripeResult?.error?.message || "Stripe cancel failed");
            }
          } catch (e: any) {
            console.warn("Stripe cancel error:", e.message);
            stripeResult = { error: e.message };
          }
        }

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
            .eq("id", userId);
        }

        return new Response(JSON.stringify({
          success: true,
          stripe_subscription_id: subId || null,
          stripe_result: stripeResult,
          mode: cancelImmediately ? "immediate" : "period_end",
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
