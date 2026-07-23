// Content Vault: return a short-lived signed URL for a paid item, gated by get_content_access().
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "content-vault";
const EXPIRES_IN = 60 * 10; // 10 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Auth check
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const body = (await req.json().catch(() => ({}))) as { contentId?: string };
    const contentId = body.contentId;
    if (!contentId) throw new Error("contentId is required");

    // Use the caller's session against RLS-aware RPC (SECURITY DEFINER reads auth.uid())
    const { data: accessRows, error: accessErr } = await userClient.rpc("get_content_access", {
      p_content_id: contentId,
    });
    if (accessErr) throw accessErr;

    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access || !access.has_access) {
      return new Response(
        JSON.stringify({
          error: "access_denied",
          reason: access?.reason ?? "unknown",
          price_cents: access?.price_cents ?? 0,
          currency: access?.currency ?? "eur",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!access.storage_path) throw new Error("Storage path missing");

    // Mint signed URL with service role
    const svc = createClient(supabaseUrl, serviceKey);
    const { data: signed, error: signErr } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(access.storage_path, EXPIRES_IN);

    if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Failed to sign URL");

    return new Response(
      JSON.stringify({
        url: signed.signedUrl,
        expires_in: EXPIRES_IN,
        title: access.title,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[get-content-signed-url] error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
