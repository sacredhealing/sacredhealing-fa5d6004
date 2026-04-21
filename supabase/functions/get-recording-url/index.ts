// Generates a short-lived signed URL for a private call recording, after
// verifying the caller is allowed to view it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function res(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) return res({ error: "misconfigured" }, 500);

    const auth = req.headers.get("authorization") || "";
    if (!auth) return res({ error: "no auth" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = auth.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const recordingId = body?.recording_id as string | undefined;
    if (!recordingId) return res({ error: "recording_id required" }, 400);

    // Use a user-scoped client to enforce RLS on the SELECT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rec, error: recErr } = await userClient
      .from("call_recordings")
      .select("id, storage_path, status")
      .eq("id", recordingId)
      .maybeSingle();

    if (recErr || !rec) return res({ error: "not found or forbidden" }, 404);
    if (rec.status !== "ready" || !rec.storage_path) {
      return res({ error: "not ready" }, 409);
    }

    const { data: signed, error: sErr } = await supabase.storage
      .from("call-recordings")
      .createSignedUrl(rec.storage_path, 3600); // 1 hour

    if (sErr || !signed?.signedUrl) {
      return res({ error: sErr?.message || "sign failed" }, 500);
    }

    return res({ url: signed.signedUrl, expires_in: 3600 });
  } catch (e) {
    return res({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
