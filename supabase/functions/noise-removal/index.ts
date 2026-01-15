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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed. Use POST." });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AUDIO_WORKER_URL = Deno.env.get("AUDIO_WORKER_URL");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_NOISE_CANCELLER_KEY");
    const RAPIDAPI_HOST = "noise-canceller.p.rapidapi.com";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error" });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in." });
    }

    const user = auth.user;

    let body: {
      audioUrl?: string;
      noiseReductionLevel?: "light" | "medium" | "aggressive";
      removeHiss?: boolean;
      removeHum?: boolean;
      removeClicks?: boolean;
      preserveVoice?: boolean;
    } = {};

    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" });
    }

    if (!body.audioUrl) {
      return json({ success: false, error: "audioUrl is required" });
    }

    const jobId = crypto.randomUUID();

    // Create job record
    const { error: insertErr } = await supabaseAdmin
      .from("creative_soul_jobs")
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: "noise_removal",
        status: "queued",
        progress: 0,
        payload: {
          audioUrl: body.audioUrl,
          noiseReductionLevel: body.noiseReductionLevel || "medium",
          removeHiss: body.removeHiss ?? true,
          removeHum: body.removeHum ?? true,
          removeClicks: body.removeClicks ?? true,
          preserveVoice: body.preserveVoice ?? true,
        },
      });

    if (insertErr) {
      console.error('[NOISE-REMOVAL] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message });
    }

    // Use RapidAPI Noise Canceller if configured
    if (RAPIDAPI_KEY) {
      try {
        // RapidAPI expects form-data with audio file URL or base64
        const response = await fetch("https://noise-canceller.p.rapidapi.com/api/noiseCanceller", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
          body: JSON.stringify({
            url: body.audioUrl,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // RapidAPI may return different field names - handle both
          const outputUrl = result.outputUrl || result.output_url || result.url || result.downloadUrl || result.download_url;
          
          if (!outputUrl) {
            console.error('[NOISE-REMOVAL] RapidAPI response missing output URL:', result);
            throw new Error("No output URL in RapidAPI response");
          }
          
          // Update job as completed
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "completed",
              progress: 100,
              result_url: outputUrl,
              completed_at: new Date().toISOString(),
            })
            .eq("job_id", jobId);

          return json({
            success: true,
            job_id: jobId,
            output_url: outputUrl,
            noise_reduction_applied: true,
          });
        } else {
          const errorText = await response.text();
          console.error('[NOISE-REMOVAL] RapidAPI error:', response.status, errorText);
          
          // Check for subscription errors specifically
          if (isRapidApiSubscriptionError(response.status, errorText)) {
            await supabaseAdmin
              .from("creative_soul_jobs")
              .update({
                status: "failed",
                error_message: "Noise removal service unavailable. RapidAPI subscription may be inactive or quota exceeded.",
                completed_at: new Date().toISOString(),
              })
              .eq("job_id", jobId);
            
            return json({
              success: false,
              error: "RAPIDAPI_SUBSCRIPTION_INACTIVE",
              message: "Noise removal API subscription is inactive. Please check your RapidAPI subscriptions.",
              job_id: jobId,
            });
          }
          
          // For other 4xx errors (client errors like invalid API key), don't fall back to worker
          if (response.status >= 400 && response.status < 500) {
            await supabaseAdmin
              .from("creative_soul_jobs")
              .update({
                status: "failed",
                error_message: `RapidAPI error (${response.status}): ${errorText.substring(0, 200)}`,
                completed_at: new Date().toISOString(),
              })
              .eq("job_id", jobId);
            
            return json({
              success: false,
              error: `RapidAPI request failed (${response.status})`,
              job_id: jobId,
              details: errorText.substring(0, 200),
            });
          }
          
          // For 5xx errors or other server errors, update job and fall through to worker
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "queued", // Reset to queued for worker fallback
              error_message: `RapidAPI server error (${response.status}), trying worker fallback`,
            })
            .eq("job_id", jobId);
          
          // Fall through to worker for server errors
        }
      } catch (apiErr) {
        console.error('[NOISE-REMOVAL] RapidAPI exception:', apiErr);
        // Fall through to worker if RapidAPI fails
      }
    }

    // Otherwise, dispatch to audio worker
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;
        
        const workerResponse = await fetch(`${AUDIO_WORKER_URL}/noise-removal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": AUDIO_WORKER_API_KEY,
          },
          body: JSON.stringify({
            job_id: jobId,
            callback_url: callbackUrl,
            callback_api_key: AUDIO_WORKER_API_KEY,
            audio_url: body.audioUrl,
            noise_reduction_level: body.noiseReductionLevel || "medium",
            remove_hiss: body.removeHiss ?? true,
            remove_hum: body.removeHum ?? true,
            remove_clicks: body.removeClicks ?? true,
            preserve_voice: body.preserveVoice ?? true,
          }),
        });

        if (!workerResponse.ok) {
          const errorText = await workerResponse.text();
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "failed",
              error_message: `Worker error: ${errorText}`,
              completed_at: new Date().toISOString(),
            })
            .eq("job_id", jobId);

          return json({ success: false, error: "Failed to dispatch job", job_id: jobId });
        }

        console.log(`[NOISE-REMOVAL] Job ${jobId} dispatched to worker`);
      } catch (workerErr) {
        console.error('[NOISE-REMOVAL] Worker error:', workerErr);
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "queued",
            error_message: `Worker temporarily unavailable: ${String(workerErr)}`,
          })
          .eq("job_id", jobId);
      }
    } else {
      console.log(`[NOISE-REMOVAL] No worker configured - job ${jobId} will wait for manual processing`);
    }

    return json({
      success: true,
      job_id: jobId,
      message: "Noise removal queued. Processing will begin shortly.",
    });
  } catch (err) {
    console.error('[NOISE-REMOVAL] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});

