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
    const AUDIO_WORKER_URL = Deno.env.get("AUDIO_WORKER_URL");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");
    const AUDIO_ANALYSIS_API_URL = Deno.env.get("AUDIO_ANALYSIS_API_URL"); // Optional: external analysis API
    const AUDIO_ANALYSIS_API_KEY = Deno.env.get("AUDIO_ANALYSIS_API_KEY");

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
      trackId?: string; // Optional: if analyzing existing track
      analyzeBPM?: boolean;
      analyzeKey?: boolean;
      analyzeTempo?: boolean;
      analyzeLoudness?: boolean;
    } = {};

    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" });
    }

    if (!body.audioUrl && !body.trackId) {
      return json({ success: false, error: "audioUrl or trackId is required" });
    }

    const jobId = crypto.randomUUID();

    // Create job record
    const { error: insertErr } = await supabaseAdmin
      .from("creative_soul_jobs")
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: "audio_analysis",
        status: "queued",
        progress: 0,
        payload: {
          audioUrl: body.audioUrl,
          trackId: body.trackId,
          analyzeBPM: body.analyzeBPM ?? true,
          analyzeKey: body.analyzeKey ?? true,
          analyzeTempo: body.analyzeTempo ?? true,
          analyzeLoudness: body.analyzeLoudness ?? true,
        },
      });

    if (insertErr) {
      console.error('[AUDIO-ANALYSIS] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message });
    }

    // If external analysis API is configured, use it directly
    if (AUDIO_ANALYSIS_API_URL && AUDIO_ANALYSIS_API_KEY && body.audioUrl) {
      try {
        const response = await fetch(`${AUDIO_ANALYSIS_API_URL}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AUDIO_ANALYSIS_API_KEY}`,
          },
          body: JSON.stringify({
            audio_url: body.audioUrl,
            analyze_bpm: body.analyzeBPM ?? true,
            analyze_key: body.analyzeKey ?? true,
            analyze_tempo: body.analyzeTempo ?? true,
            analyze_loudness: body.analyzeLoudness ?? true,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update job as completed
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "completed",
              progress: 100,
              result_url: JSON.stringify(result),
              completed_at: new Date().toISOString(),
            })
            .eq("job_id", jobId);

          // If trackId provided, update the track
          if (body.trackId) {
            await supabaseAdmin
              .from("music_tracks")
              .update({
                bpm: result.bpm,
                key: result.key,
                tempo: result.tempo,
                loudness: result.loudness,
                analysis_data: result,
              })
              .eq("id", body.trackId);
          }

          return json({
            success: true,
            job_id: jobId,
            analysis: result,
          });
        }
      } catch (apiErr) {
        console.error('[AUDIO-ANALYSIS] External API error:', apiErr);
      }
    }

    // Otherwise, dispatch to audio worker
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;
        
        const workerResponse = await fetch(`${AUDIO_WORKER_URL}/audio-analysis`, {
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
            track_id: body.trackId,
            analyze_bpm: body.analyzeBPM ?? true,
            analyze_key: body.analyzeKey ?? true,
            analyze_tempo: body.analyzeTempo ?? true,
            analyze_loudness: body.analyzeLoudness ?? true,
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

        console.log(`[AUDIO-ANALYSIS] Job ${jobId} dispatched to worker`);
      } catch (workerErr) {
        console.error('[AUDIO-ANALYSIS] Worker error:', workerErr);
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "queued",
            error_message: `Worker temporarily unavailable: ${String(workerErr)}`,
          })
          .eq("job_id", jobId);
      }
    } else {
      console.log(`[AUDIO-ANALYSIS] No worker configured - job ${jobId} will wait for manual processing`);
    }

    return json({
      success: true,
      job_id: jobId,
      message: "Audio analysis queued. Processing will begin shortly.",
    });
  } catch (err) {
    console.error('[AUDIO-ANALYSIS] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});

