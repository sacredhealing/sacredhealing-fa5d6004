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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Binaural beats frequency configurations
const BINAURAL_CONFIGS = {
  delta: { carrier: 100, beat: 2, description: "Deep sleep, healing (0.5-4 Hz)" },
  theta: { carrier: 200, beat: 6, description: "Deep meditation, creativity (4-8 Hz)" },
  alpha: { carrier: 300, beat: 10, description: "Relaxation, light meditation (8-13 Hz)" },
  beta: { carrier: 400, beat: 20, description: "Focus, alertness (13-30 Hz)" },
  gamma: { carrier: 500, beat: 40, description: "Higher cognition, insight (30-100 Hz)" },
};

// Healing frequency configurations
const HEALING_FREQUENCIES = {
  "174": { hz: 174, description: "Pain relief, grounding" },
  "285": { hz: 285, description: "Tissue healing, safety" },
  "396": { hz: 396, description: "Liberation from fear" },
  "417": { hz: 417, description: "Facilitating change" },
  "432": { hz: 432, description: "Universal harmony" },
  "528": { hz: 528, description: "DNA repair, miracles" },
  "639": { hz: 639, description: "Harmonious relationships" },
  "741": { hz: 741, description: "Awakening intuition" },
  "852": { hz: 852, description: "Spiritual order" },
  "963": { hz: 963, description: "Divine consciousness" },
};

// Meditation style audio configurations
const MEDITATION_STYLES = {
  "ocean-water": { 
    ambient: ["ocean_waves", "water_flow"], 
    intensity: 0.6,
    description: "Calming ocean and water sounds" 
  },
  "forest-nature": { 
    ambient: ["birds", "wind_leaves", "stream"], 
    intensity: 0.5,
    description: "Immersive forest atmosphere" 
  },
  "tibetan": { 
    ambient: ["singing_bowls", "temple_bells", "chanting"], 
    intensity: 0.7,
    description: "Traditional Tibetan meditation sounds" 
  },
  "space-cosmic": { 
    ambient: ["space_drone", "cosmic_pad", "stars"], 
    intensity: 0.4,
    description: "Ethereal cosmic soundscape" 
  },
  "rain-thunder": { 
    ambient: ["rain_heavy", "thunder_distant", "rain_on_leaves"], 
    intensity: 0.65,
    description: "Stormy rain atmosphere" 
  },
  "crystal-bowls": { 
    ambient: ["crystal_singing", "harmonic_resonance"], 
    intensity: 0.55,
    description: "Crystal bowl healing tones" 
  },
  "zen-garden": { 
    ambient: ["bamboo_fountain", "wind_chimes", "koto"], 
    intensity: 0.45,
    description: "Japanese zen garden ambiance" 
  },
};

// New payload structure (v2)
interface PayloadV2 {
  input?: {
    youtube_urls?: string[];
    direct_urls?: string[];
    upload_storage_path?: string;
  };
  style_slug?: string;
  frequency_hz?: number;
  binaural?: {
    enabled?: boolean;
    beat_hz?: number;
    carrier_hz?: number;
  };
  noise_reduction?: {
    enabled?: boolean;
    mode?: string;
    strength?: string;
  };
  bpm?: {
    enabled?: boolean;
    target_bpm?: number;
  };
  mastering?: {
    enabled?: boolean;
    provider?: string;
    preset?: string;
  };
  stem?: {
    pre?: {
      enabled?: boolean;
      action?: "keep_both" | "voice_only" | "remove_music";
    };
    post?: {
      enabled?: boolean;
      stems?: string[];
    };
  };
  // Legacy fields
  meditation_style?: string;
  music_tags?: string[];
  sound_layers?: string[];
  auto_music_enabled?: boolean;
  music_source?: string;
  keep_original_music?: boolean;
  variants?: number;
}

interface RequestBody {
  mode?: string;
  user_id?: string;
  payload?: PayloadV2;
  // Legacy fields for backward compatibility
  binaural_type?: "delta" | "theta" | "alpha" | "beta" | "gamma";
  binaural_enabled?: boolean;
  binaural_volume?: number;
  frequency_hz?: number;
  frequency_enabled?: boolean;
  frequency_volume?: number;
  processing_mode?: "BINAURAL" | "TONE_TUNING" | "BOTH";
  meditation_style?: string;
  sound_layers?: string[];
  ambient_volume?: number;
  audioUrl?: string;
  source_volume?: number;
  duration?: number;
  target_bpm?: number;
  enable_stem_separation?: boolean;
  stem_separation_type?: "2stems" | "4stems" | "5stems";
  keep_stems?: string[];
  remove_stems?: string[];
  enable_noise_removal?: boolean;
  noise_reduction_level?: "light" | "medium" | "aggressive";
  enable_mastering?: boolean;
  mastering_preset?: "balanced" | "loud" | "warm" | "bright" | "punchy";
  variants?: number;
  output_format?: "mp3" | "wav" | "flac";
  output_quality?: "standard" | "high" | "lossless";
  // Vocal recording flag for mobile uploads (enables auto stereo balancing and noise reduction)
  is_vocal_recording?: boolean;
}

// ============ WORKER HEALTH CHECK ============
async function checkWorkerHealth(workerBaseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const healthUrl = workerBaseUrl.replace(/\/process-audio$/, "") + "/health";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: { "X-Worker-Key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    return res.ok;
  } catch {
    return false;
  }
}

// ============ DIRECT LANDR MASTERING ============
function normalizeLandrPreset(raw?: string | null): "balanced" | "loud" | "warm" | "bright" | "punchy" {
  const p = (raw || "").toLowerCase();
  if (p.includes("loud")) return "loud";
  if (p.includes("bright")) return "bright";
  if (p.includes("punch")) return "punchy";
  if (p.includes("warm")) return "warm";
  return "balanced";
}

async function masterWithLandr(
  audioUrl: string,
  preset: string,
  rapidApiKey: string,
  supabaseAdmin: any,
  jobId: string,
): Promise<{ success: boolean; resultUrl?: string; error?: string }> {
  console.log(`[LANDR] Starting mastering for job ${jobId}`);

  // Update progress
  await supabaseAdmin
    .from("creative_soul_jobs")
    .update({ progress: 70, progress_step: "Mastering with LANDR…" })
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
      console.error(`[LANDR] Submit failed (${submitRes.status}): ${errText}`);
      
      if (isRapidApiSubscriptionError(submitRes.status, errText)) {
        return { success: false, error: "LANDR subscription inactive" };
      }
      return { success: false, error: `LANDR error: ${submitRes.status}` };
    }

    const submitData = await submitRes.json();
    const externalJobId = submitData.jobId || submitData.id || submitData.job_id;
    console.log(`[LANDR] Job submitted: ${externalJobId}`);

    // Poll for completion (max 3 minutes)
    const pollUrl = `https://landr-mastering-v1.p.rapidapi.com/status/${externalJobId}`;
    const maxPollTime = 180000; // 3 minutes
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
      await sleep(pollInterval);

      try {
        const statusRes = await fetch(pollUrl, {
          method: "GET",
          headers: {
            "x-rapidapi-host": "landr-mastering-v1.p.rapidapi.com",
            "x-rapidapi-key": rapidApiKey,
          },
        });

        if (!statusRes.ok) {
          console.log(`[LANDR] Status check failed, retrying...`);
          continue;
        }

        const statusData = await statusRes.json();
        console.log(`[LANDR] Status: ${statusData.status}`);

        if (statusData.status === "completed" || statusData.status === "done") {
          const resultUrl = statusData.download_url || statusData.result_url || statusData.url;
          if (resultUrl) {
            console.log(`[LANDR] Mastering complete: ${resultUrl}`);
            return { success: true, resultUrl };
          }
        }

        if (statusData.status === "failed" || statusData.status === "error") {
          return { success: false, error: statusData.error || "LANDR mastering failed" };
        }

        // Update progress based on time elapsed
        const elapsed = Date.now() - startTime;
        const progress = Math.min(95, 70 + Math.floor((elapsed / maxPollTime) * 25));
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({ progress, progress_step: "Mastering in progress…" })
          .eq("job_id", jobId);

      } catch (pollErr) {
        console.error(`[LANDR] Poll error:`, pollErr);
      }
    }

    return { success: false, error: "LANDR mastering timed out" };
  } catch (err) {
    console.error(`[LANDR] Exception:`, err);
    return { success: false, error: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed. Use POST." }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const AUDIO_WORKER_URL = Deno.env.get("AUDIO_WORKER_URL");
    const AUDIO_WORKER_API_KEY = Deno.env.get("AUDIO_WORKER_API_KEY");
    const RAPIDAPI_LANDR_KEY = Deno.env.get("RAPIDAPI_LANDR_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error", details: "Missing environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in.", details: authErr?.message ?? "" }, 401);
    }

    const user = auth.user;

    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const mode = body?.mode === "paid" ? "paid" : "demo";

    // Check if user is admin (admins bypass all access checks)
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;

    // Ensure usage row exists
    await supabaseAdmin.from("creative_soul_usage").upsert({ user_id: user.id }, { onConflict: "user_id" });

    // DEMO: allow exactly once (unless admin)
    if (mode === "demo") {
      if (!isAdmin) {
        const { data: usage, error: usageErr } = await supabaseAdmin
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

        const { error: markErr } = await supabaseAdmin
          .from("creative_soul_usage")
          .update({ demo_used: true, demo_used_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (markErr) {
          return json({ success: false, error: "Failed to mark demo used", details: markErr.message });
        }
      }
    } else {
      // PAID: admins have full access, otherwise check tool access
      if (!isAdmin) {
        const { data: toolAccess, error: accessErr } = await supabaseAdmin
          .from('creative_tool_access')
          .select(`
            *,
            tool:creative_tools!inner(slug)
          `)
          .eq('user_id', user.id)
          .eq('tool.slug', 'creative-soul-meditation')
          .limit(1);

        if (accessErr) {
          console.error('[CONVERT-MEDITATION] Access check error:', accessErr);
          return json({ success: false, error: "Access check failed", details: accessErr.message });
        }

        if (!toolAccess || toolAccess.length === 0) {
          return json({ success: false, error: "Full access required. Please purchase to unlock all features." });
        }
      }
    }

    // Generate job ID
    const jobId = crypto.randomUUID();

    // Extract from nested payload or use flat body (backward compat)
    const payloadData = (body.payload || {}) as PayloadV2;
    
    // Get binaural config
    const binauralEnabled = payloadData.binaural?.enabled ?? body.binaural_enabled ?? true;
    const binauralBeatHz = payloadData.binaural?.beat_hz || 6;
    const binauralCarrierHz = payloadData.binaural?.carrier_hz || 200;
    const binauralType = body.binaural_type || "theta";
    const binauralConfig = BINAURAL_CONFIGS[binauralType] || BINAURAL_CONFIGS.theta;
    
    // Get healing frequency config
    const frequencyHz = payloadData.frequency_hz || body.frequency_hz || 432;
    const frequencyKey = String(frequencyHz);
    const frequencyConfig = HEALING_FREQUENCIES[frequencyKey as keyof typeof HEALING_FREQUENCIES] || { hz: frequencyHz, description: "Custom frequency" };
    
    // Get meditation style config
    const styleSlug = payloadData.style_slug || payloadData.meditation_style || body.meditation_style || "ocean-water";
    const styleConfig = MEDITATION_STYLES[styleSlug as keyof typeof MEDITATION_STYLES] || MEDITATION_STYLES["ocean-water"];

    // Get input sources
    const inputSources = payloadData.input || {};
    const hasYoutubeUrls = inputSources.youtube_urls && inputSources.youtube_urls.length > 0;
    const hasDirectUrls = inputSources.direct_urls && inputSources.direct_urls.length > 0;
    const hasUpload = !!inputSources.upload_storage_path;

    // Get stem separation config
    const preStemConfig = payloadData.stem?.pre || {};
    const postStemConfig = payloadData.stem?.post || {};

    // Get noise reduction config
    const noiseConfig = payloadData.noise_reduction || {};
    const noiseEnabled = noiseConfig.enabled ?? body.enable_noise_removal ?? false;
    const noiseMode = noiseConfig.mode || body.noise_reduction_level || "voice_clean";
    const noiseStrength = noiseConfig.strength || "medium";

    // Get BPM config
    const bpmConfig = payloadData.bpm || {};
    const bpmEnabled = bpmConfig.enabled ?? true;
    const targetBpm = bpmConfig.target_bpm || body.target_bpm || 60;

    // Get mastering config
    const masteringConfig = payloadData.mastering || {};
    const masteringEnabled = masteringConfig.enabled ?? body.enable_mastering ?? false;
    const masteringProvider = masteringConfig.provider || "landr";
    const masteringPreset = masteringConfig.preset || body.mastering_preset || "meditation_warm";

    // Build comprehensive payload for the worker (compatible with Railway worker)
    const payload = {
      // Input sources
      input: {
        youtube_urls: inputSources.youtube_urls || [],
        direct_urls: inputSources.direct_urls || [],
        upload_storage_path: inputSources.upload_storage_path,
      },
      // Style configuration
      style_slug: styleSlug,
      style: styleSlug, // Railway worker expects 'style'
      frequency_hz: frequencyHz,
      // Binaural beats configuration (Railway worker format)
      binaural: binauralEnabled ? binauralType : "none",
      binaural_config: {
        enabled: binauralEnabled,
        beat_hz: binauralBeatHz,
        carrier_hz: binauralCarrierHz,
        type: binauralType,
        volume: body.binaural_volume ?? 0.3,
        description: binauralConfig.description,
      },
      // Healing frequency configuration
      healing_frequency: {
        enabled: body.frequency_enabled ?? true,
        hz: frequencyConfig.hz,
        volume: body.frequency_volume ?? 0.2,
        description: frequencyConfig.description,
      },
      // Noise reduction (Railway worker format)
      noise_reduction_level: noiseEnabled ? noiseStrength : null,
      noise_reduction: {
        enabled: noiseEnabled,
        mode: noiseMode,
        strength: noiseStrength,
      },
      // Vocal recording flag - enables automatic noise reduction and stereo balancing for mobile recordings
      // Automatically set to true if audio is uploaded (likely from mobile) or explicitly set
      is_vocal_recording: body.is_vocal_recording ?? (!!body.audioUrl || !!inputSources.upload_storage_path),
      // BPM matching
      bpm: {
        enabled: bpmEnabled,
        target_bpm: targetBpm,
      },
      // Mastering (Railway worker format) - SKIP if we'll do it in-edge
      mastering_enabled: false, // We'll handle mastering in edge function
      mastering_preset: masteringPreset,
      mastering: {
        enabled: false, // Disable worker mastering
        provider: masteringProvider,
        preset: masteringPreset,
      },
      // Stem separation
      stem: {
        pre: {
          enabled: preStemConfig.enabled ?? false,
          action: preStemConfig.action || "voice_only",
        },
        post: {
          enabled: postStemConfig.enabled ?? false,
          stems: postStemConfig.stems || ["vocals", "music"],
        },
      },
      // Processing mode
      processing_mode: body.processing_mode ?? "BOTH",
      // Meditation style and ambient sounds
      meditation_style: styleSlug,
      ambient: {
        sounds: payloadData.sound_layers || body.sound_layers || styleConfig.ambient,
        intensity: styleConfig.intensity,
        volume: body.ambient_volume ?? 0.5,
      },
      // Source audio configuration
      source: {
        url: body.audioUrl,
        volume: body.source_volume ?? 0.7,
        target_bpm: targetBpm,
      },
      audioUrl: body.audioUrl, // Railway worker expects this
      youtube_urls: inputSources.youtube_urls || [],
      direct_urls: inputSources.direct_urls || [],
      // Duration and variants
      duration: body.duration || (mode === "demo" ? 60 : 300),
      variants: payloadData.variants || body.variants || (mode === "demo" ? 1 : 3),
      // Output configuration
      output: {
        format: body.output_format || "mp3",
        quality: body.output_quality || "high",
      },
      // Mode info
      mode,
      is_demo: mode === "demo",
      // Music settings
      auto_music_enabled: payloadData.auto_music_enabled ?? true,
      music_source: payloadData.music_source || "library",
      keep_original_music: payloadData.keep_original_music ?? false,
      music_tags: payloadData.music_tags || [],
      // Edge-function mastering flag
      _edge_mastering: masteringEnabled && RAPIDAPI_LANDR_KEY,
      _mastering_preset: masteringPreset,
    };

    // Create job record in database
    const { error: insertErr } = await supabaseAdmin
      .from("creative_soul_jobs")
      .insert({
        user_id: user.id,
        job_id: jobId,
        action: "meditation_generate",
        status: "queued",
        progress: 0,
        progress_step: "Initializing…",
        payload: payload,
      });

    if (insertErr) {
      console.error('[CONVERT-MEDITATION] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message });
    }

    // ============ DISPATCH TO AUDIO WORKER ============
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      const normalizeWorkerBaseUrl = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return trimmed;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
      };

      const base = normalizeWorkerBaseUrl(AUDIO_WORKER_URL).replace(/\/$/, "");
      let workerEndpoint = base;

      // Determine the correct endpoint path
      try {
        const u = new URL(base);
        const p = u.pathname.replace(/\/$/, "");
        const alreadyEndpoint = ["/jobs", "/process", "/process-audio"].some((s) => p.endsWith(s));
        if (!alreadyEndpoint) workerEndpoint = `${base}/process-audio`;
      } catch {
        workerEndpoint = `${base}/process-audio`;
      }

      // Check worker health first
      const workerHealthy = await checkWorkerHealth(base, AUDIO_WORKER_API_KEY);
      console.log(`[CONVERT-MEDITATION] Worker health: ${workerHealthy ? "healthy" : "unhealthy"}`);

      // Build headers - supports both self-hosted worker and RapidAPI
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Worker-Key": AUDIO_WORKER_API_KEY,
      };

      // Add RapidAPI headers if URL is a RapidAPI gateway
      let isRapidApi = false;
      try {
        const u = new URL(workerEndpoint);
        if (u.hostname.endsWith("rapidapi.com")) {
          isRapidApi = true;
          headers["X-RapidAPI-Key"] = AUDIO_WORKER_API_KEY;
          headers["X-RapidAPI-Host"] = u.hostname;
        }
      } catch {
        // ignore URL parse errors
      }

      console.log(`[CONVERT-MEDITATION] Dispatching job ${jobId} to worker at ${workerEndpoint.split('?')[0]}`);

      const markQueuedPending = async (message: string) => {
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({
            status: "queued",
            progress: 0,
            progress_step: "Warming up renderer…",
            error_message: message.slice(0, 250),
          })
          .eq("job_id", jobId);
      };

      // If worker is unhealthy, skip dispatch and queue for later
      if (!workerHealthy) {
        console.log(`[CONVERT-MEDITATION] Worker unhealthy, queueing job for auto-retry`);
        await markQueuedPending("Worker warming up...");
        
        return json({
          success: true,
          mode,
          plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
          job_id: jobId,
          status: "queued",
          dispatched: false,
          worker_healthy: false,
          message: "Renderer is warming up. Processing will start automatically.",
        });
      }

      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;

        // Retries help with cold-starting workers
        const maxAttempts = 4;
        let lastErrorText = "";

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

            await supabaseAdmin
              .from("creative_soul_jobs")
              .update({ progress_step: attempt > 1 ? `Connecting to renderer (attempt ${attempt})…` : "Connecting to renderer…" })
              .eq("job_id", jobId);

            const workerRes = await fetch(workerEndpoint, {
              method: "POST",
              headers,
              body: JSON.stringify({
                job_id: jobId,
                user_id: user.id,
                mode,
                payload,
                respond_immediately: true,
                callback_url: callbackUrl,
                callback_api_key: AUDIO_WORKER_API_KEY,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeout);

            const rawText = await workerRes.text().catch(() => "");
            let workerJson: any = {};
            try {
              workerJson = rawText ? JSON.parse(rawText) : {};
            } catch {
              // ignore parse errors
            }

            if (workerRes.ok) {
              // Worker accepted job for async processing
              if (workerJson?.accepted || workerJson?.status === "accepted" || workerJson?.success) {
                console.log(`[CONVERT-MEDITATION] Job ${jobId} accepted by worker`);

                await supabaseAdmin
                  .from("creative_soul_jobs")
                  .update({ status: "processing", progress: 5, progress_step: "Processing audio…", error_message: null })
                  .eq("job_id", jobId);

                return json({
                  success: true,
                  mode,
                  plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
                  job_id: jobId,
                  status: "processing",
                  worker_healthy: true,
                  message: "Audio generation started. This may take a few minutes.",
                });
              }

              // Worker completed immediately (rare but handle it)
              if (workerJson?.outputs || workerJson?.result_url) {
                let resultUrl = workerJson.result_url ||
                  (typeof workerJson.outputs === "string" ? workerJson.outputs : JSON.stringify(workerJson.outputs));

                // Apply LANDR mastering if enabled and we have a result
                if (masteringEnabled && RAPIDAPI_LANDR_KEY && resultUrl && !resultUrl.startsWith("{")) {
                  const landrResult = await masterWithLandr(resultUrl, masteringPreset, RAPIDAPI_LANDR_KEY, supabaseAdmin, jobId);
                  if (landrResult.success && landrResult.resultUrl) {
                    resultUrl = landrResult.resultUrl;
                    console.log(`[CONVERT-MEDITATION] LANDR mastering applied: ${resultUrl}`);
                  } else {
                    console.log(`[CONVERT-MEDITATION] LANDR mastering skipped/failed: ${landrResult.error}`);
                  }
                }

                await supabaseAdmin
                  .from("creative_soul_jobs")
                  .update({
                    status: "completed",
                    result_url: resultUrl,
                    progress: 100,
                    progress_step: "Complete!",
                    completed_at: new Date().toISOString(),
                    error_message: null,
                  })
                  .eq("job_id", jobId);

                return json({
                  success: true,
                  mode,
                  plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
                  job_id: jobId,
                  status: "completed",
                  result_url: resultUrl,
                  outputs: workerJson.outputs,
                });
              }

              // Worker returned success but no clear status - assume processing
              console.log(`[CONVERT-MEDITATION] Worker response unclear, assuming processing`);

              await supabaseAdmin
                .from("creative_soul_jobs")
                .update({ status: "processing", progress: 5, progress_step: "Processing audio…", error_message: null })
                .eq("job_id", jobId);

              return json({
                success: true,
                mode,
                plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
                job_id: jobId,
                status: "processing",
                message: "Audio generation started.",
              });
            }

            // Worker returned error
            const errorText = rawText || "Unknown error";
            console.error(`[CONVERT-MEDITATION] Worker error (${workerRes.status}): ${errorText.slice(0, 500)}`);

            // Check for subscription/auth issues
            if (isRapidApi && isRapidApiSubscriptionError(workerRes.status, errorText)) {
              await supabaseAdmin
                .from("creative_soul_jobs")
                .update({
                  status: "failed",
                  progress_step: "Service unavailable",
                  error_message: "Audio processing service unavailable. RapidAPI subscription may be inactive.",
                })
                .eq("job_id", jobId);

              return json({
                success: false,
                error: "WORKER_SUBSCRIPTION_ERROR",
                message: "Audio processing API subscription is inactive. Please check your API subscriptions.",
                job_id: jobId,
              });
            }

            // Treat 5xx/timeout-like errors as transient
            const transient = workerRes.status >= 500 || workerRes.status === 429 || workerRes.status === 408;
            lastErrorText = `Worker error (${workerRes.status}): ${errorText.slice(0, 200)}`;

            if (transient && attempt < maxAttempts) {
              await sleep(800 * attempt * attempt);
              continue;
            }

            // Non-transient error: keep queued for auto-retry
            await markQueuedPending(`Dispatch pending: ${lastErrorText}`);
            return json({
              success: true,
              mode,
              plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
              job_id: jobId,
              status: "queued",
              dispatched: false,
              message: "Renderer is warming up. Retrying automatically...",
            });
          } catch (e) {
            const errStr = e instanceof Error ? e.message : String(e);
            console.error(`[CONVERT-MEDITATION] Worker dispatch attempt ${attempt} failed: ${errStr}`);
            lastErrorText = errStr;

            if (attempt < maxAttempts) {
              await sleep(800 * attempt * attempt);
              continue;
            }

            await markQueuedPending(`Dispatch pending: ${lastErrorText}`);
            return json({
              success: true,
              mode,
              plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
              job_id: jobId,
              status: "queued",
              dispatched: false,
              message: "Renderer is warming up. Retrying automatically...",
            });
          }
        }

        // Fallback
        await markQueuedPending(`Dispatch pending: ${lastErrorText || "Unknown dispatch error"}`);
        return json({
          success: true,
          mode,
          plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
          job_id: jobId,
          status: "queued",
          dispatched: false,
          message: "Renderer is warming up. Retrying automatically...",
        });
      } catch (err) {
        const errStr = err instanceof Error ? err.message : String(err);
        console.error(`[CONVERT-MEDITATION] Dispatch runtime error: ${errStr}`);

        await markQueuedPending(`Dispatch pending: ${errStr}`);

        return json({
          success: true,
          mode,
          plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
          job_id: jobId,
          status: "queued",
          dispatched: false,
          message: "Renderer is warming up. Retrying automatically...",
        });
      }
    }

    // No worker configured - return error with setup instructions
    console.log(`[CONVERT-MEDITATION] No audio worker configured (AUDIO_WORKER_URL or AUDIO_WORKER_API_KEY missing)`);
    
    await supabaseAdmin
      .from("creative_soul_jobs")
      .update({ 
        status: "failed",
        progress_step: "Configuration error",
        error_message: "Audio processing service not configured. Please set up the audio worker.",
      })
      .eq("job_id", jobId);
    
    return json({
      success: false,
      error: "WORKER_NOT_CONFIGURED",
      message: "Audio processing service is not configured. Please deploy the audio-worker and configure AUDIO_WORKER_URL.",
      job_id: jobId,
    });

  } catch (err) {
    console.error('[CONVERT-MEDITATION] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});
