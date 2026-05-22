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

    // Verify admin via user_roles (security definer has_role)
    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    const { action, userId, updates } = await req.json();

    switch (action) {
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

      case "delete_user": {
        if (!userId) throw new Error("userId required");
        if (ADMIN_UUIDS.includes(userId)) throw new Error("Cannot delete admin accounts");

        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        await adminClient.from("profiles").delete().eq("id", userId);
        await adminClient.from("user_memberships").delete().eq("user_id", userId);

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
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
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "ban_user": {
        if (!userId) throw new Error("userId required");
        if (ADMIN_UUIDS.includes(userId)) throw new Error("Cannot ban admin accounts");

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: updates?.unban ? "none" : "876600h",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "reset_password": {
        if (!userId) throw new Error("userId required");
        const { data: userRecord } = await adminClient.auth.admin.getUserById(userId);
        if (!userRecord?.user?.email) throw new Error("User email not found");

        const { error } = await userClient.auth.resetPasswordForEmail(userRecord.user.email);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      case "get_user": {
        if (!userId) throw new Error("userId required");
        const { data, error } = await adminClient.auth.admin.getUserById(userId);
        if (error) throw error;
        return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
