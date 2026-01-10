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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LANDR_API_KEY = Deno.env.get("LANDR_API_KEY");
    const LANDR_API_SECRET = Deno.env.get("LANDR_API_SECRET");
    const AUDIO_WORKER_URL = Deno.env.get("AUDIO_WORKER_URL");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");

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
      preset?: "balanced" | "loud" | "warm" | "bright" | "punchy";
      format?: "wav" | "mp3";
      sampleRate?: 44100 | 48000 | 96000;
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
        action: "landr_mastering",
        status: "queued",
        progress: 0,
        payload: {
          audioUrl: body.audioUrl,
          preset: body.preset || "balanced",
          format: body.format || "wav",
          sampleRate: body.sampleRate || 44100,
        },
      });

    if (insertErr) {
      console.error('[LANDR-MASTERING] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message });
    }

    // If LANDR API is configured, use it directly
    if (LANDR_API_KEY && LANDR_API_SECRET) {
      try {
        // LANDR API authentication (OAuth 2.0)
        const authResponse = await fetch("https://api.landr.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: LANDR_API_KEY,
            client_secret: LANDR_API_SECRET,
          }),
        });

        if (!authResponse.ok) {
          throw new Error("LANDR authentication failed");
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // Submit mastering job to LANDR
        const masteringResponse = await fetch("https://api.landr.com/v1/mastering", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: body.audioUrl,
            preset: body.preset || "balanced",
            format: body.format || "wav",
            sample_rate: body.sampleRate || 44100,
          }),
        });

        if (masteringResponse.ok) {
          const result = await masteringResponse.json();
          
          // Update job as processing (LANDR processes asynchronously)
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "processing",
              progress: 50,
              payload: {
                ...body,
                landr_job_id: result.job_id,
                landr_status_url: result.status_url,
              },
            })
            .eq("job_id", jobId);

          return json({
            success: true,
            job_id: jobId,
            landr_job_id: result.job_id,
            status_url: result.status_url,
            message: "Mastering job submitted to LANDR. Processing...",
          });
        }
      } catch (apiErr) {
        console.error('[LANDR-MASTERING] LANDR API error:', apiErr);
      }
    }

    // Otherwise, dispatch to audio worker
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;
        
        const workerResponse = await fetch(`${AUDIO_WORKER_URL}/landr-mastering`, {
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
            preset: body.preset || "balanced",
            format: body.format || "wav",
            sample_rate: body.sampleRate || 44100,
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

        console.log(`[LANDR-MASTERING] Job ${jobId} dispatched to worker`);
      } catch (workerErr) {
        console.error('[LANDR-MASTERING] Worker error:', workerErr);
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "queued",
            error_message: `Worker temporarily unavailable: ${String(workerErr)}`,
          })
          .eq("job_id", jobId);
      }
    } else {
      console.log(`[LANDR-MASTERING] No worker configured - job ${jobId} will wait for manual processing`);
    }

    return json({
      success: true,
      job_id: jobId,
      message: "Mastering queued. Processing will begin shortly.",
    });
  } catch (err) {
    console.error('[LANDR-MASTERING] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});

