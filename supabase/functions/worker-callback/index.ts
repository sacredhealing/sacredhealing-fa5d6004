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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helper to detect RapidAPI subscription errors
function isRapidApiSubscriptionError(status: number, text: string): boolean {
  const lowerText = text.toLowerCase();
  return (
    status === 403 ||
    status === 401 ||
    lowerText.includes("not subscribed") ||
    lowerText.includes("subscription") ||
    lowerText.includes("exceeded the rate limit") ||
    lowerText.includes("quota")
  );
}

function normalizeLandrPreset(raw?: string | null): "balanced" | "loud" | "warm" | "bright" | "punchy" {
  const p = (raw || "").toLowerCase();
  if (p.includes("loud")) return "loud";
  if (p.includes("bright")) return "bright";
  if (p.includes("punch")) return "punchy";
  if (p.includes("warm")) return "warm";
  // Most of our app presets are like "meditation_warm" → warm; fallback to balanced
  return "balanced";
}

async function masterWithLandr(
  audioUrl: string,
  preset: string,
  rapidApiKey: string,
  supabaseAdmin: any,
  jobId: string,
): Promise<{ success: boolean; resultUrl?: string; error?: string }> {
  console.log(`[WORKER-CALLBACK][LANDR] Starting mastering for job ${jobId}`);

  await supabaseAdmin
    .from("creative_soul_jobs")
    .update({
      status: "processing",
      progress: 75,
      progress_step: "Mastering with LANDR…",
    })
    .eq("job_id", jobId);

  try {
    const landrPreset = normalizeLandrPreset(preset);

    // Submit to LANDR RapidAPI
    const submitRes = await fetch("https://landr-mastering-v1.p.rapidapi.com/master", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "landr-mastering-v1.p.rapidapi.com",
        "x-rapidapi-key": rapidApiKey,
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        preset: landrPreset,
        format: "mp3",
        intensity: "medium",
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error(`[WORKER-CALLBACK][LANDR] Submit failed (${submitRes.status}): ${errText}`);
      if (isRapidApiSubscriptionError(submitRes.status, errText)) {
        return { success: false, error: "LANDR subscription inactive" };
      }
      return { success: false, error: `LANDR submit error: ${submitRes.status}` };
    }

    const submitData = await submitRes.json();
    const externalJobId = submitData.jobId || submitData.id || submitData.job_id;

    if (!externalJobId) return { success: false, error: "LANDR did not return a job id" };

    // Poll for completion (max 3 minutes)
    const pollUrl = `https://landr-mastering-v1.p.rapidapi.com/status/${externalJobId}`;
    const maxPollTime = 180000;
    const pollInterval = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
      await sleep(pollInterval);

      const statusRes = await fetch(pollUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "landr-mastering-v1.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const s = String(statusData.status || "").toLowerCase();

      if (s === "completed" || s === "done") {
        const resultUrl = statusData.download_url || statusData.result_url || statusData.url;
        if (resultUrl) return { success: true, resultUrl };
        return { success: false, error: "LANDR completed but no download URL returned" };
      }

      if (s === "failed" || s === "error") {
        return { success: false, error: statusData.error || "LANDR mastering failed" };
      }

      // Progress updates: 75 → 95
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, 75 + Math.floor((elapsed / maxPollTime) * 20));
      await supabaseAdmin
        .from("creative_soul_jobs")
        .update({ progress, progress_step: "Mastering in progress…" })
        .eq("job_id", jobId);
    }

    return { success: false, error: "LANDR mastering timed out" };
  } catch (err) {
    console.error("[WORKER-CALLBACK][LANDR] Exception:", err);
    return { success: false, error: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");
    const RAPIDAPI_LANDR_KEY = Deno.env.get("RAPIDAPI_LANDR_KEY");

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

    // If worker reports completion and this job requested LANDR mastering, do it here before finalizing.
    if (status === "completed" && result_url && /^https?:\/\//i.test(result_url) && RAPIDAPI_LANDR_KEY) {
      const { data: jobRow } = await supabaseAdmin
        .from("creative_soul_jobs")
        .select("payload")
        .eq("job_id", job_id)
        .maybeSingle();

      const payload = (jobRow?.payload || {}) as Record<string, any>;
      const shouldMaster = payload?._edge_mastering === true;

      if (shouldMaster) {
        const preset = payload?._mastering_preset || "balanced";

        const landr = await masterWithLandr(result_url, preset, RAPIDAPI_LANDR_KEY, supabaseAdmin, job_id);

        if (landr.success && landr.resultUrl) {
          const updateData = {
            status: "completed",
            progress: 100,
            progress_step: "Complete!",
            result_url: landr.resultUrl,
            error_message: null,
            completed_at: new Date().toISOString(),
          };

          console.log(`[WORKER-CALLBACK] Job ${job_id} mastered via LANDR.`);

          const { error: updateErr } = await supabaseAdmin
            .from("creative_soul_jobs")
            .update(updateData)
            .eq("job_id", job_id);

          if (updateErr) {
            console.error("[WORKER-CALLBACK] Update error after LANDR:", updateErr);
            return json({ success: false, error: "Failed to update job", details: updateErr.message }, 500);
          }

          return json({ success: true, job_id });
        }

        // LANDR failed: keep the unmastered audio but persist the reason.
        const updateData = {
          status: "completed",
          progress: 100,
          progress_step: "Complete (unmastered)",
          result_url,
          error_message: `LANDR mastering failed: ${landr.error || "unknown error"}`.slice(0, 250),
          completed_at: new Date().toISOString(),
        };

        console.warn(`[WORKER-CALLBACK] LANDR mastering failed for job ${job_id}: ${landr.error}`);

        const { error: updateErr } = await supabaseAdmin
          .from("creative_soul_jobs")
          .update(updateData)
          .eq("job_id", job_id);

        if (updateErr) {
          console.error("[WORKER-CALLBACK] Update error after LANDR failure:", updateErr);
          return json({ success: false, error: "Failed to update job", details: updateErr.message }, 500);
        }

        return json({ success: true, job_id });
      }
    }

    // Default: write whatever the worker sent.
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
