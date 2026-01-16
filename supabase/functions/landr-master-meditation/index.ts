import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizeLandrPreset(raw?: string | null): "balanced" | "loud" | "warm" | "bright" | "punchy" {
  const p = (raw || "").toLowerCase();
  if (p.includes("loud")) return "loud";
  if (p.includes("bright")) return "bright";
  if (p.includes("punch")) return "punchy";
  if (p.includes("warm")) return "warm";
  return "balanced";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RAPIDAPI_LANDR_KEY = Deno.env.get("RAPIDAPI_LANDR_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    // Auth check
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    // Parse body
    let body: { job_id?: string; audio_url?: string; preset?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON" }, 400);
    }

    const { job_id, audio_url, preset } = body;

    if (!audio_url) {
      return json({ success: false, error: "audio_url required" }, 400);
    }

    // If no LANDR key, return original URL
    if (!RAPIDAPI_LANDR_KEY) {
      console.log("[LANDR-MASTER] No RAPIDAPI_LANDR_KEY configured, returning original");
      
      // Update job if exists
      if (job_id) {
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "completed",
            progress: 100,
            progress_step: "Complete (unmastered)",
            result_url: audio_url,
            completed_at: new Date().toISOString(),
            error_message: "LANDR not configured",
          })
          .eq("job_id", job_id);
      }

      return json({
        success: true,
        result_url: audio_url,
        mastered: false,
        message: "LANDR not configured, returning original",
      });
    }

    const landrPreset = normalizeLandrPreset(preset);
    console.log(`[LANDR-MASTER] Starting mastering: ${audio_url} with preset ${landrPreset}`);

    // Update job progress
    if (job_id) {
      await supabaseAdmin
        .from("creative_soul_jobs")
        .update({
          status: "processing",
          progress: 70,
          progress_step: "Mastering with LANDR…",
        })
        .eq("job_id", job_id);
    }

    // Submit to LANDR RapidAPI
    const submitRes = await fetch("https://landr-mastering-v1.p.rapidapi.com/master", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "landr-mastering-v1.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_LANDR_KEY,
      },
      body: JSON.stringify({
        audio_url: audio_url,
        preset: landrPreset,
        format: "mp3",
        intensity: "medium",
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error(`[LANDR-MASTER] Submit failed (${submitRes.status}): ${errText}`);

      // Return original on failure
      if (job_id) {
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "completed",
            progress: 100,
            progress_step: "Complete (unmastered)",
            result_url: audio_url,
            completed_at: new Date().toISOString(),
            error_message: `LANDR error: ${submitRes.status}`,
          })
          .eq("job_id", job_id);
      }

      return json({
        success: true,
        result_url: audio_url,
        mastered: false,
        message: `LANDR failed (${submitRes.status}), returning original`,
      });
    }

    const submitData = await submitRes.json();
    const externalJobId = submitData.jobId || submitData.id || submitData.job_id;
    console.log(`[LANDR-MASTER] Job submitted: ${externalJobId}`);

    // Poll for completion (max 3 minutes)
    const pollUrl = `https://landr-mastering-v1.p.rapidapi.com/status/${externalJobId}`;
    const maxPollTime = 180000;
    const pollInterval = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
      await sleep(pollInterval);

      try {
        const statusRes = await fetch(pollUrl, {
          method: "GET",
          headers: {
            "x-rapidapi-host": "landr-mastering-v1.p.rapidapi.com",
            "x-rapidapi-key": RAPIDAPI_LANDR_KEY,
          },
        });

        if (!statusRes.ok) {
          console.log(`[LANDR-MASTER] Status check failed (${statusRes.status}), retrying...`);
          continue;
        }

        const statusData = await statusRes.json();
        console.log(`[LANDR-MASTER] Status: ${statusData.status}`);

        if (statusData.status === "completed" || statusData.status === "done") {
          const resultUrl = statusData.download_url || statusData.result_url || statusData.url;
          
          if (resultUrl) {
            console.log(`[LANDR-MASTER] Mastering complete: ${resultUrl}`);

            if (job_id) {
              await supabaseAdmin
                .from("creative_soul_jobs")
                .update({
                  status: "completed",
                  progress: 100,
                  progress_step: "Complete!",
                  result_url: resultUrl,
                  completed_at: new Date().toISOString(),
                  error_message: null,
                })
                .eq("job_id", job_id);
            }

            return json({
              success: true,
              result_url: resultUrl,
              mastered: true,
            });
          }
        }

        if (statusData.status === "failed" || statusData.status === "error") {
          console.error(`[LANDR-MASTER] Mastering failed: ${statusData.error}`);
          break;
        }

        // Update progress
        if (job_id) {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(95, 70 + Math.floor((elapsed / maxPollTime) * 25));
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({ progress, progress_step: "Mastering in progress…" })
            .eq("job_id", job_id);
        }
      } catch (pollErr) {
        console.error(`[LANDR-MASTER] Poll error:`, pollErr);
      }
    }

    // Timeout or failure - return original
    console.log(`[LANDR-MASTER] Mastering timed out or failed, returning original`);

    if (job_id) {
      await supabaseAdmin
        .from("creative_soul_jobs")
        .update({
          status: "completed",
          progress: 100,
          progress_step: "Complete (unmastered)",
          result_url: audio_url,
          completed_at: new Date().toISOString(),
          error_message: "LANDR mastering timed out",
        })
        .eq("job_id", job_id);
    }

    return json({
      success: true,
      result_url: audio_url,
      mastered: false,
      message: "LANDR timed out, returning original",
    });

  } catch (err) {
    console.error("[LANDR-MASTER] Runtime error:", err);
    return json({ success: false, error: String(err) }, 500);
  }
});
