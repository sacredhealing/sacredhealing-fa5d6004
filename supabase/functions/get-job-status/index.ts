import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
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
      return json({ success: false, error: "Server configuration error" });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in." });
    }

    let body: { job_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" });
    }

    const { job_id } = body;
    if (!job_id) {
      return json({ success: false, error: "job_id is required" });
    }

    // Query the job - RLS ensures user can only see their own jobs
    const { data: job, error: jobErr } = await supabase
      .from("creative_soul_jobs")
      .select("*")
      .eq("job_id", job_id)
      .single();

    if (jobErr || !job) {
      return json({ success: false, error: "Job not found", details: jobErr?.message });
    }

    return json({
      success: true,
      job: {
        job_id: job.job_id,
        action: job.action,
        status: job.status,
        progress: job.progress,
        result_url: job.result_url,
        error_message: job.error_message,
        created_at: job.created_at,
        completed_at: job.completed_at,
      },
    });
  } catch (err) {
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});
