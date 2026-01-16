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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWorkerBaseUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveWorkerEndpoint(baseUrl: string) {
  const base = normalizeWorkerBaseUrl(baseUrl).replace(/\/$/, "");
  let workerEndpoint = base;

  try {
    const u = new URL(base);
    const p = u.pathname.replace(/\/$/, "");
    const alreadyEndpoint = ["/jobs", "/process", "/process-audio"].some((s) => p.endsWith(s));
    if (!alreadyEndpoint) workerEndpoint = `${base}/process-audio`;
  } catch {
    workerEndpoint = `${base}/process-audio`;
  }

  return workerEndpoint;
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
      return json(
        { success: false, error: "Server configuration error", details: "Missing environment variables" },
        500,
      );
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

    let body: { job_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const jobId = body.job_id;
    if (!jobId) return json({ success: false, error: "job_id is required" }, 400);

    // Read the job via user-scoped client (RLS ensures ownership)
    const { data: job, error: jobErr } = await supabase
      .from("creative_soul_jobs")
      .select("job_id, user_id, status, payload")
      .eq("job_id", jobId)
      .single();

    if (jobErr || !job) {
      return json({ success: false, error: "Job not found", details: jobErr?.message }, 404);
    }

    if (!AUDIO_WORKER_URL || !AUDIO_WORKER_API_KEY) {
      return json({ success: true, dispatched: false, job_id: jobId, message: "Audio worker not configured" });
    }

    const workerEndpoint = resolveWorkerEndpoint(AUDIO_WORKER_URL);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Worker-Key": AUDIO_WORKER_API_KEY,
    };

    const callbackUrl = `${SUPABASE_URL}/functions/v1/worker-callback`;

    // Best-effort retry (helps with cold starts)
    const maxAttempts = 3;
    let lastErr = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const res = await fetch(workerEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            job_id: jobId,
            user_id: job.user_id,
            mode: (job.payload as any)?.mode || "paid",
            payload: job.payload,
            respond_immediately: true,
            callback_url: callbackUrl,
            callback_api_key: AUDIO_WORKER_API_KEY,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const text = await res.text().catch(() => "");
        let parsed: any = {};
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          // ignore
        }

        if (res.ok) {
          await supabaseAdmin
            .from("creative_soul_jobs")
            .update({ status: "processing", progress: Math.max(5, (job as any).progress ?? 0), error_message: null })
            .eq("job_id", jobId);

          return json({
            success: true,
            dispatched: true,
            job_id: jobId,
            status: "processing",
            worker: { accepted: parsed?.accepted ?? parsed?.success ?? true },
          });
        }

        // Transient worker/proxy errors
        const isTransient = res.status >= 500 || res.status === 429 || res.status === 408;
        lastErr = `Worker error (${res.status}): ${text.slice(0, 200)}`;

        if (isTransient && attempt < maxAttempts) {
          await sleep(800 * attempt * attempt);
          continue;
        }

        break;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt < maxAttempts) {
          await sleep(800 * attempt * attempt);
          continue;
        }
      }
    }

    // Leave job queued so the client can keep polling and retry later.
    await supabaseAdmin
      .from("creative_soul_jobs")
      .update({ status: "queued", progress: 0, error_message: `Dispatch pending: ${lastErr.slice(0, 180)}` })
      .eq("job_id", jobId);

    return json({
      success: true,
      dispatched: false,
      job_id: jobId,
      status: "queued",
      message: "Renderer warming up. Retrying in background...",
    });
  } catch (err) {
    return json({ success: false, error: "RUNTIME_ERROR", details: String(err) }, 500);
  }
});
