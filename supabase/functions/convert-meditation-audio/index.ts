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

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Server configuration error", details: "Missing environment variables" });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return json({ success: false, error: "Unauthorized. Please sign in.", details: authErr?.message ?? "" });
    }

    const user = auth.user;

    let body: {
      mode?: string;
      frequency_hz?: number;
      processing_mode?: "BINAURAL" | "TONE_TUNING";
      meditation_style?: string;
      sound_layers?: string[];
      duration?: number;
      audioUrl?: string;
      variants?: number;
      bpm_match?: boolean;
      keep_music_stem?: boolean;
      // Stem separation options
      enable_stem_separation?: boolean;
      stem_separation_type?: "2stems" | "4stems" | "5stems";
      keep_stems?: string[];
      remove_stems?: string[];
      // Audio processing options
      enable_noise_removal?: boolean;
      noise_reduction_level?: "light" | "medium" | "aggressive";
      enable_mastering?: boolean;
      mastering_preset?: "balanced" | "loud" | "warm" | "bright" | "punchy";
    } = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" });
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

    // Build payload for the worker
    const payload = {
      frequency_hz: body.frequency_hz ?? 432,
      processing_mode: body.processing_mode ?? "TONE_TUNING", // "BINAURAL" or "TONE_TUNING"
      meditation_style: body.meditation_style || "ocean-water",
      sound_layers: body.sound_layers || ["ocean_waves", "rain_soft", "handpan"],
      duration: body.duration || (mode === "demo" ? 10 : 30),
      audioUrl: body.audioUrl,
      variants: body.variants || (mode === "demo" ? 1 : 3),
      bpm_match: body.bpm_match ?? true,
      keep_music_stem: body.keep_music_stem ?? true,
      // Stem separation options
      enable_stem_separation: body.enable_stem_separation ?? false,
      stem_separation_type: body.stem_separation_type || "5stems",
      keep_stems: body.keep_stems || [],
      remove_stems: body.remove_stems || [],
      // Audio processing options
      enable_noise_removal: body.enable_noise_removal ?? false,
      noise_reduction_level: body.noise_reduction_level || "medium",
      enable_mastering: body.enable_mastering ?? false,
      mastering_preset: body.mastering_preset || "balanced",
      mode,
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
