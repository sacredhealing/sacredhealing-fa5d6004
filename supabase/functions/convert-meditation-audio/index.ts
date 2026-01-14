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

interface RequestBody {
  mode?: string;
  // Binaural beats
  binaural_type?: "delta" | "theta" | "alpha" | "beta" | "gamma";
  binaural_enabled?: boolean;
  binaural_volume?: number;
  // Healing frequencies
  frequency_hz?: number;
  frequency_enabled?: boolean;
  frequency_volume?: number;
  processing_mode?: "BINAURAL" | "TONE_TUNING" | "BOTH";
  // Meditation style
  meditation_style?: string;
  sound_layers?: string[];
  ambient_volume?: number;
  // Audio source
  audioUrl?: string;
  source_volume?: number;
  duration?: number;
  target_bpm?: number;
  // Processing options
  enable_stem_separation?: boolean;
  stem_separation_type?: "2stems" | "4stems" | "5stems";
  keep_stems?: string[];
  remove_stems?: string[];
  enable_noise_removal?: boolean;
  noise_reduction_level?: "light" | "medium" | "aggressive";
  enable_mastering?: boolean;
  mastering_preset?: "balanced" | "loud" | "warm" | "bright" | "punchy";
  // Output options
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

    // Get binaural config if enabled
    const binauralType = body.binaural_type || "theta";
    const binauralConfig = BINAURAL_CONFIGS[binauralType] || BINAURAL_CONFIGS.theta;
    
    // Get healing frequency config
    const frequencyHz = body.frequency_hz || 432;
    const frequencyKey = String(frequencyHz);
    const frequencyConfig = HEALING_FREQUENCIES[frequencyKey as keyof typeof HEALING_FREQUENCIES] || { hz: frequencyHz, description: "Custom frequency" };
    
    // Get meditation style config
    const meditationStyle = body.meditation_style || "ocean-water";
    const styleConfig = MEDITATION_STYLES[meditationStyle as keyof typeof MEDITATION_STYLES] || MEDITATION_STYLES["ocean-water"];

    // Build comprehensive payload for the worker
    const payload = {
      // Binaural beats configuration
      binaural: {
        enabled: body.binaural_enabled ?? true,
        type: binauralType,
        carrier_frequency: binauralConfig.carrier,
        beat_frequency: binauralConfig.beat,
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
      // Processing mode
      processing_mode: body.processing_mode ?? "BOTH", // "BINAURAL", "TONE_TUNING", or "BOTH"
      // Meditation style and ambient sounds
      meditation_style: meditationStyle,
      ambient: {
        sounds: body.sound_layers || styleConfig.ambient,
        intensity: styleConfig.intensity,
        volume: body.ambient_volume ?? 0.5,
      },
      // Source audio configuration
      source: {
        url: body.audioUrl,
        volume: body.source_volume ?? 0.7,
        target_bpm: body.target_bpm,
      },
      // Duration and variants
      duration: body.duration || (mode === "demo" ? 60 : 300), // 1 min demo, 5 min paid
      variants: body.variants || (mode === "demo" ? 1 : 3),
      // Stem separation options
      stem_separation: {
        enabled: body.enable_stem_separation ?? false,
        type: body.stem_separation_type || "5stems",
        keep_stems: body.keep_stems || ["vocals", "other"],
        remove_stems: body.remove_stems || [],
      },
      // Audio processing options
      noise_removal: {
        enabled: body.enable_noise_removal ?? false,
        level: body.noise_reduction_level || "medium",
      },
      mastering: {
        enabled: body.enable_mastering ?? false,
        preset: body.mastering_preset || "balanced",
      },
      // Output configuration
      output: {
        format: body.output_format || "mp3",
        quality: body.output_quality || "high",
      },
      // Mode info
      mode,
      is_demo: mode === "demo",
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

    // If worker is configured, dispatch the job
    if (AUDIO_WORKER_URL && AUDIO_WORKER_API_KEY) {
      try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;
        
        const workerResponse = await fetch(`${AUDIO_WORKER_URL}/process-audio`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": AUDIO_WORKER_API_KEY,
          },
          body: JSON.stringify({
            job_id: jobId,
            callback_url: callbackUrl,
            callback_api_key: AUDIO_WORKER_API_KEY,
            ...payload,
          }),
        });

        if (!workerResponse.ok) {
          const errorText = await workerResponse.text();
          console.error('[CONVERT-MEDITATION] Worker dispatch failed:', errorText);
          
          // Update job to failed
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({ 
              status: "failed", 
              error_message: `Worker error: ${errorText}`,
              completed_at: new Date().toISOString(),
            })
            .eq("job_id", jobId);

          return json({ 
            success: false, 
            error: "Failed to dispatch job to worker", 
            job_id: jobId 
          });
        }

        console.log(`[CONVERT-MEDITATION] Job ${jobId} dispatched to worker`);
      } catch (workerErr) {
        console.error('[CONVERT-MEDITATION] Worker connection error:', workerErr);
        
        // Update job status but don't fail - worker might pick it up later
        await supabaseAdmin
          .from("creative_soul_jobs")
          .update({ 
            status: "queued",
            error_message: `Worker temporarily unavailable: ${String(workerErr)}`,
          })
          .eq("job_id", jobId);
      }
    } else {
      console.log(`[CONVERT-MEDITATION] No worker configured - job ${jobId} will wait for manual processing`);
    }

    return json({
      success: true,
      mode,
      plan: isAdmin ? "admin" : (mode === "demo" ? "demo" : "purchased"),
      job_id: jobId,
      message: "Generation queued. Processing will begin shortly.",
    });
  } catch (err) {
    console.error('[CONVERT-MEDITATION] Runtime error:', err);
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) });
  }
});
