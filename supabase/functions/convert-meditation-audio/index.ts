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

    // Build comprehensive payload for the worker
    const payload = {
      // Input sources
      input: {
        youtube_urls: inputSources.youtube_urls || [],
        direct_urls: inputSources.direct_urls || [],
        upload_storage_path: inputSources.upload_storage_path,
      },
      // Style configuration
      style_slug: styleSlug,
      frequency_hz: frequencyHz,
      // Binaural beats configuration
      binaural: {
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
      // Noise reduction
      noise_reduction: {
        enabled: noiseEnabled,
        mode: noiseMode,
        strength: noiseStrength,
      },
      // BPM matching
      bpm: {
        enabled: bpmEnabled,
        target_bpm: targetBpm,
      },
      // Mastering
      mastering: {
        enabled: masteringEnabled,
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
        payload,
      });

    if (insertErr) {
      console.error('[CONVERT-MEDITATION] Failed to create job:', insertErr);
      return json({ success: false, error: "Failed to create job", details: insertErr.message });
    }

    // --- Dispatch to worker (optional) ---
    // If no worker is configured or worker fails, the browser-based player handles audio generation
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      const base = AUDIO_WORKER_URL.trim().replace(/\/$/, "");
      let workerEndpoint = base;

      // If AUDIO_WORKER_URL is a base URL, default to our worker contract endpoint.
      try {
        const u = new URL(base);
        const p = u.pathname.replace(/\/$/, "");
        const alreadyEndpoint = ["/jobs", "/process", "/process-audio"].some((s) => p.endsWith(s));
        if (!alreadyEndpoint) workerEndpoint = `${base}/process-audio`;
      } catch {
        workerEndpoint = `${base}/process-audio`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Worker-Key": AUDIO_WORKER_API_KEY,
        "x-api-key": AUDIO_WORKER_API_KEY,
        "Authorization": `Bearer ${AUDIO_WORKER_API_KEY}`,
      };

      // RapidAPI headers (if URL is a RapidAPI gateway)
      try {
        const u = new URL(workerEndpoint);
        if (u.hostname.endsWith("rapidapi.com")) {
          headers["X-RapidAPI-Key"] = AUDIO_WORKER_API_KEY;
          headers["X-RapidAPI-Host"] = u.hostname;
        }
      } catch {
        // ignore
      }

      // Try to dispatch to worker, but don't fail if unavailable
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const workerRes = await fetch(workerEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            job_id: jobId,
            user_id: user.id,
            mode,
            payload,
            respond_immediately: true,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);

        if (workerRes.ok) {
          const workerJson = await workerRes.json().catch(() => ({}));
          
          if (workerJson?.accepted || workerJson?.status === "accepted") {
            console.log(`[CONVERT-MEDITATION] Job ${jobId} accepted by worker`);
            return json({
              success: true,
              mode,
              plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
              job_id: jobId,
              status: "processing",
              message: "Worker accepted job. Poll job status.",
            });
          }

          if (workerJson?.outputs) {
            await supabaseAdmin
              .from("creative_soul_jobs")
              .update({ 
                status: "completed", 
                result_url: typeof workerJson.outputs === "string" ? workerJson.outputs : JSON.stringify(workerJson.outputs),
                completed_at: new Date().toISOString(),
              })
              .eq("job_id", jobId);

            return json({
              success: true,
              mode,
              plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
              job_id: jobId,
              status: "completed",
              outputs: workerJson.outputs,
            });
          }
        } else {
          // Worker returned error - check for subscription issues
          const errorText = await workerRes.text().catch(() => "");
          console.log(`[CONVERT-MEDITATION] Worker error (${workerRes.status}): ${errorText.slice(0, 200)}`);
          
          // Check for RapidAPI subscription error
          if (isRapidApiSubscriptionError(workerRes.status, errorText)) {
            await supabaseAdmin
              .from("creative_soul_jobs")
              .update({ 
                status: "failed",
                error_message: "Audio processing service unavailable. RapidAPI subscription may be inactive or quota exceeded.",
              })
              .eq("job_id", jobId);
            
            return json({
              success: false,
              error: "RAPIDAPI_SUBSCRIPTION_INACTIVE",
              message: "Audio processing API subscription is inactive. Please check your RapidAPI subscriptions.",
              job_id: jobId,
            });
          }
        }
      } catch (e) {
        // Worker timeout or network error - log and continue
        const errStr = e instanceof Error ? e.message : String(e);
        console.log(`[CONVERT-MEDITATION] Worker dispatch failed: ${errStr.slice(0, 200)}`);
      }
    } else {
      console.log(`[CONVERT-MEDITATION] No worker configured`);
    }

    // Update job to indicate browser-based processing should be used
    await supabaseAdmin
      .from("creative_soul_jobs")
      .update({ 
        status: "browser_processing",
        progress: 100,
      })
      .eq("job_id", jobId);

    // Return success - browser player handles actual audio generation
    return json({
      success: true,
      mode,
      plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
      job_id: jobId,
      status: "browser_processing",
      message: "Settings saved. Use the Real-Time Meditation Player for instant audio generation.",
      browser_fallback: true,
    });
  } catch (err) {
    console.error('[CONVERT-MEDITATION] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});
