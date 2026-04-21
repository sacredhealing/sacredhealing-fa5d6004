// Webhook receiver for Daily.co recording events.
// Daily fires `recording.ready-to-download` once cloud recording finishes
// processing. We download the MP4 from Daily's signed link and re-upload to
// our Supabase Storage `call-recordings` bucket, then mark the matching
// `call_recordings` row as ready.
//
// Daily webhook docs: https://docs.daily.co/reference/rest-api/webhooks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

function ok(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const dailyKey = Deno.env.get("DAILY_API_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey || !dailyKey) {
      return ok({ error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return ok({ error: "invalid body" }, 400);
    }

    console.log("[daily-recording-webhook] received:", JSON.stringify(body));

    // Daily payload shape:
    // { type: "recording.ready-to-download", payload: { recording_id, room_name, duration, ... } }
    const eventType = (body as any).type as string | undefined;
    const payload = (body as any).payload || body;
    const roomName: string | undefined = payload?.room_name;
    const recordingId: string | undefined = payload?.recording_id;
    const duration: number | undefined = payload?.duration;

    if (!roomName) {
      return ok({ error: "missing room_name" }, 400);
    }

    // Only act on ready/finished events
    const acceptedTypes = [
      "recording.ready-to-download",
      "recording.finished",
    ];
    if (eventType && !acceptedTypes.includes(eventType)) {
      console.log("[daily-recording-webhook] ignoring event:", eventType);
      return ok({ ok: true, ignored: eventType });
    }

    // Find matching recording row
    const { data: rec, error: recErr } = await supabase
      .from("call_recordings")
      .select("id, host_user_id, status")
      .eq("room_name", roomName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recErr) {
      console.error("[daily-recording-webhook] lookup err:", recErr);
      return ok({ error: recErr.message }, 500);
    }

    if (!rec) {
      console.warn("[daily-recording-webhook] no row for room", roomName);
      return ok({ ok: true, note: "no row found" });
    }

    // Mark processing
    await supabase
      .from("call_recordings")
      .update({ status: "processing", duration_seconds: duration ?? null })
      .eq("id", rec.id);

    // 1. Get download link from Daily
    let downloadUrl: string | null = null;
    try {
      const linkRes = await fetch(
        `https://api.daily.co/v1/recordings/${recordingId}/access-link`,
        { headers: { Authorization: `Bearer ${dailyKey}` } },
      );
      if (linkRes.ok) {
        const j = await linkRes.json();
        downloadUrl = j?.download_link || null;
      }
    } catch (e) {
      console.error("[daily-recording-webhook] access-link err:", e);
    }

    // Fallback: list recordings for the room and grab newest
    if (!downloadUrl) {
      try {
        const listRes = await fetch(
          `https://api.daily.co/v1/recordings?room_name=${encodeURIComponent(roomName)}`,
          { headers: { Authorization: `Bearer ${dailyKey}` } },
        );
        if (listRes.ok) {
          const list = await listRes.json();
          const items = list?.data || [];
          const latest = items[0];
          if (latest?.id) {
            const lk = await fetch(
              `https://api.daily.co/v1/recordings/${latest.id}/access-link`,
              { headers: { Authorization: `Bearer ${dailyKey}` } },
            );
            if (lk.ok) {
              const j = await lk.json();
              downloadUrl = j?.download_link || null;
            }
          }
        }
      } catch (e) {
        console.error("[daily-recording-webhook] list err:", e);
      }
    }

    if (!downloadUrl) {
      await supabase
        .from("call_recordings")
        .update({
          status: "failed",
          error_message: "Could not fetch Daily download link",
        })
        .eq("id", rec.id);
      return ok({ error: "no download link" }, 500);
    }

    // 2. Stream from Daily into Supabase Storage
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok || !fileRes.body) {
      await supabase
        .from("call_recordings")
        .update({
          status: "failed",
          error_message: `Daily download HTTP ${fileRes.status}`,
        })
        .eq("id", rec.id);
      return ok({ error: "download failed" }, 500);
    }

    const blob = await fileRes.blob();
    const storagePath = `${rec.host_user_id}/${rec.id}.mp4`;

    const { error: uploadErr } = await supabase.storage
      .from("call-recordings")
      .upload(storagePath, blob, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[daily-recording-webhook] upload err:", uploadErr);
      await supabase
        .from("call_recordings")
        .update({
          status: "failed",
          error_message: uploadErr.message,
        })
        .eq("id", rec.id);
      return ok({ error: uploadErr.message }, 500);
    }

    // 3. Mark ready (the public-facing video_url is generated as a signed URL on demand)
    const { error: updateErr } = await supabase
      .from("call_recordings")
      .update({
        status: "ready",
        storage_path: storagePath,
        video_url: storagePath, // store path; client requests signed URL
        duration_seconds: duration ?? null,
        ended_at: new Date().toISOString(),
      })
      .eq("id", rec.id);

    if (updateErr) {
      console.error("[daily-recording-webhook] final update err:", updateErr);
      return ok({ error: updateErr.message }, 500);
    }

    return ok({ ok: true, id: rec.id, storage_path: storagePath });
  } catch (e) {
    console.error("[daily-recording-webhook] fatal:", e);
    return ok({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
