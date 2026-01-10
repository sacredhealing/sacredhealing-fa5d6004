import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    // Verify worker API key
    const workerApiKey = req.headers.get("x-worker-api-key");
    if (!AUDIO_WORKER_API_KEY || workerApiKey !== AUDIO_WORKER_API_KEY) {
      console.error("[WORKER-CALLBACK] Invalid or missing API key");
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let body: {
      job_id?: string;
      status?: string;
      progress?: number;
      result_url?: string;
      error?: string;
    } = {};

    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { job_id, status, progress, result_url, error } = body;

    if (!job_id) {
      return json({ success: false, error: "job_id is required" }, 400);
    }

    // Validate status
    const validStatuses = ["queued", "processing", "completed", "failed"];
    if (status && !validStatuses.includes(status)) {
      return json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, 400);
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (status) updateData.status = status;
    if (typeof progress === "number") updateData.progress = Math.min(100, Math.max(0, progress));
    if (result_url) updateData.result_url = result_url;
    if (error) updateData.error_message = error;
    
    if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    console.log(`[WORKER-CALLBACK] Updating job ${job_id}:`, updateData);

    const { data: job, error: updateErr } = await supabaseAdmin
      .from("creative_soul_jobs")
      .update(updateData)
      .eq("job_id", job_id)
      .select()
      .single();

    if (updateErr) {
      console.error("[WORKER-CALLBACK] Update error:", updateErr);
      return json({ success: false, error: "Failed to update job", details: updateErr.message }, 500);
    }

    if (!job) {
      return json({ success: false, error: "Job not found" }, 404);
    }

    console.log(`[WORKER-CALLBACK] Job ${job_id} updated successfully`);

    return json({ success: true, job_id });
  } catch (err) {
    console.error("[WORKER-CALLBACK] Runtime error:", err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) }, 500);
  }
});
