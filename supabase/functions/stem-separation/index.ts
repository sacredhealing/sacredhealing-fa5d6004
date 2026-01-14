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

// Map stem types to RapidAPI output types
const STEM_OUTPUT_MAP: Record<string, string> = {
  vocals: "VOCALS",
  drums: "DRUMS", 
  bass: "BASS",
  other: "OTHER",
  instrumental: "INSTRUMENTAL",
  accompaniment: "ACCOMPANIMENT",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed. Use POST." }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RAPIDAPI_STEMSPLIT_KEY = Deno.env.get("RAPIDAPI_STEMSPLIT_KEY");
    const AUDIO_WORKER_URL = Deno.env.get("AUDIO_WORKER_URL");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in." }, 401);
    }

    const user = auth.user;

    let body: {
      audioUrl?: string;
      youtubeUrl?: string;
      stems?: "2stems" | "4stems" | "5stems";
      keepStems?: string[];
      removeStems?: string[];
      outputType?: string;
      quality?: "FAST" | "BEST";
      outputFormat?: "MP3" | "WAV" | "FLAC";
    } = {};

    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    if (!body.audioUrl && !body.youtubeUrl) {
      return json({ success: false, error: "audioUrl or youtubeUrl is required" }, 400);
    }

    const jobId = crypto.randomUUID();
    const stems = body.stems || "5stems";
    const outputType = body.outputType || "VOCALS";
    const quality = body.quality || "FAST";
    const outputFormat = body.outputFormat || "MP3";

    // Create job record
    const { error: insertErr } = await supabaseAdmin
      .from("creative_soul_jobs")
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: "stem_separation",
        status: "queued",
        progress: 0,
        payload: {
          audioUrl: body.audioUrl,
          youtubeUrl: body.youtubeUrl,
          stems,
          keepStems: body.keepStems || [],
          removeStems: body.removeStems || [],
          outputType,
          quality,
          outputFormat,
        },
      });

    if (insertErr) {
      console.error('[STEM-SEPARATION] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message }, 500);
    }

    // Try RapidAPI StemSplit first (best quality)
    if (RAPIDAPI_STEMSPLIT_KEY) {
      try {
        console.log(`[STEM-SEPARATION] Using RapidAPI StemSplit for job ${jobId}`);
        
        const rapidApiPayload: Record<string, string> = {
          uploadKey: "",
          sourceUrl: body.youtubeUrl || body.audioUrl || "",
          outputType: STEM_OUTPUT_MAP[outputType.toLowerCase()] || outputType,
          quality,
          outputFormat,
        };

        const response = await fetch("https://stemsplit-ai-audio-stem-separation-youtube-to-stems2.p.rapidapi.com/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "stemsplit-ai-audio-stem-separation-youtube-to-stems2.p.rapidapi.com",
            "x-rapidapi-key": RAPIDAPI_STEMSPLIT_KEY,
          },
          body: JSON.stringify(rapidApiPayload),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[STEM-SEPARATION] RapidAPI job created:`, result);

          // Update job with external job ID for polling
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "processing",
              progress: 10,
              payload: {
                ...body,
                rapidApiJobId: result.jobId || result.id,
                provider: "rapidapi_stemsplit",
              },
            })
            .eq("job_id", jobId);

          return json({
            success: true,
            job_id: jobId,
            external_job_id: result.jobId || result.id,
            provider: "rapidapi_stemsplit",
            message: "Stem separation started with RapidAPI StemSplit. Processing...",
          });
        } else {
          const errorText = await response.text();
          console.error(`[STEM-SEPARATION] RapidAPI error: ${response.status}`, errorText);
          // Fall through to audio worker
        }
      } catch (apiErr) {
        console.error('[STEM-SEPARATION] RapidAPI exception:', apiErr);
        // Fall through to audio worker
      }
    }

    // Fallback to audio worker if configured
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;
        
        const workerResponse = await fetch(`${AUDIO_WORKER_URL}/stem-separation`, {
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
            youtube_url: body.youtubeUrl,
            stems,
            keep_stems: body.keepStems || [],
            remove_stems: body.removeStems || [],
          }),
        });

        if (workerResponse.ok) {
          console.log(`[STEM-SEPARATION] Job ${jobId} dispatched to audio worker`);
          
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({
              status: "processing",
              progress: 5,
              payload: { ...body, provider: "audio_worker" },
            })
            .eq("job_id", jobId);

          return json({
            success: true,
            job_id: jobId,
            provider: "audio_worker",
            message: "Stem separation queued. Processing will begin shortly.",
          });
        } else {
          const errorText = await workerResponse.text();
          console.error('[STEM-SEPARATION] Worker error:', workerResponse.status, errorText);
        }
      } catch (workerErr) {
        console.error('[STEM-SEPARATION] Worker exception:', workerErr);
      }
    }

    // No external processor available - mark for manual/browser processing
    await supabaseAdmin
      .from("creative_soul_jobs")
      .update({
        status: "pending_manual",
        error_message: "No stem separation service configured. Use browser-based processing.",
      })
      .eq("job_id", jobId);

    return json({
      success: true,
      job_id: jobId,
      status: "pending_manual",
      message: "Stem separation request saved. External processing unavailable - use browser-based tools.",
    });

  } catch (err) {
    console.error('[STEM-SEPARATION] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) }, 500);
  }
});

