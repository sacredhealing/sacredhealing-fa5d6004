import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200, // ALWAYS return 200 - errors are in JSON body
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed. Use POST." });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ success: false, error: "Server configuration error", details: "SUPABASE_URL or SUPABASE_ANON_KEY not set" });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in.", details: authErr?.message ?? "" });
    }

    const user = auth.user;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" });
    }

    const mode = body?.mode === "paid" ? "paid" : "demo"; // default demo

    // Ensure usage row exists
    await supabase.from("creative_soul_usage").upsert({ user_id: user.id }, { onConflict: "user_id" });

    // DEMO: allow exactly once
    if (mode === "demo") {
      const { data: usage, error: usageErr } = await supabase
        .from("creative_soul_usage")
        .select("demo_used")
        .eq("user_id", user.id)
        .single();

      if (usageErr) {
        return json({ success: false, error: "Usage lookup failed", details: usageErr.message });
      }

      if (usage?.demo_used) {
        return json({ success: false, error: "Demo already used. Please purchase to unlock all features." });
      }

      const { error: markErr } = await supabase
        .from("creative_soul_usage")
        .update({ demo_used: true, demo_used_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (markErr) {
        return json({ success: false, error: "Failed to mark demo used", details: markErr.message });
      }

      // IMPORTANT: Do not process audio here. Just return a job id.
      return json({
        success: true,
        mode: "demo",
        job_id: crypto.randomUUID(),
        message: "Demo generation queued. Processing will begin shortly.",
      });
    }

    // PAID: must have entitlement
    const { data: ent, error: entErr } = await supabase
      .from("creative_soul_entitlements")
      .select("has_access, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (entErr) {
      return json({ success: false, error: "Entitlement lookup failed", details: entErr.message });
    }

    if (!ent?.has_access) {
      return json({ success: false, error: "Full access required. Please purchase to unlock all features." });
    }

    return json({
      success: true,
      mode: "paid",
      plan: ent.plan ?? "unknown",
      job_id: crypto.randomUUID(),
      message: "Generation queued. Processing will begin shortly.",
    });
  } catch (err) {
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});
