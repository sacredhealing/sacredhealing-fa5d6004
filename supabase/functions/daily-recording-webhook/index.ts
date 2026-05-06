// Webhook receiver for Daily.co recording events.
// Daily fires `recording.ready-to-download` once cloud recording finishes
// processing. We download the MP4 from Daily's signed link and re-upload to
// our Supabase Storage `call-recordings` bucket, then mark the matching
// `call_recordings` row as ready.
//
// Stargate Bhagavad Gita / Healing Chamber recordings also attach to the
// Stargate Membership course lesson slots (see STARGATE_COURSE_ID).
//
// Daily webhook docs: https://docs.daily.co/reference/rest-api/webhooks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

/** Stargate Membership course — Bhagavad Gita + Healing Chamber lesson videos */
const STARGATE_COURSE_ID = "3e6d68be-eda8-4f0a-8727-be1837d468b9";
const SG_RECORDING_PREFIX = "sg-recording:";

function ok(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function attachStargateRecordingToCourse(
  supabase: ReturnType<typeof createClient>,
  recordingId: string,
  category: string,
) {
  if (category !== "bhagavad-gita" && category !== "healing-chamber") return;

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", STARGATE_COURSE_ID)
    .order("order_index", { ascending: true });

  if (error || !lessons?.length) {
    console.warn("[daily-recording-webhook] lessons lookup failed:", error?.message);
    return;
  }

  let lesson: { id: string } | undefined;
  if (category === "bhagavad-gita") {
    lesson = lessons.find((l) => /bhagavad|gita/i.test(l.title || ""));
    if (!lesson) lesson = lessons[0];
  } else {
    lesson = lessons.find((l) =>
      /healing/i.test(l.title || "") && /chamber/i.test(l.title || "")
    );
    if (!lesson) lesson = lessons.find((l) => /healing|chamber/i.test(l.title || ""));
    if (!lesson) lesson = lessons[lessons.length - 1];
  }

  if (!lesson?.id) return;

  const marker = `${SG_RECORDING_PREFIX}${recordingId}`;
  const { error: upErr } = await supabase
    .from("lessons")
    .update({ content_url: marker, content_type: "video" })
    .eq("id", lesson.id);

  if (upErr) {
    console.error("[daily-recording-webhook] lesson update err:", upErr);
  } else {
    console.log("[daily-recording-webhook] attached recording to lesson", lesson.id, category);
  }
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

    const eventType = (body as Record<string, unknown>).type as string | undefined;
    const payload = ((body as Record<string, unknown>).payload || body) as Record<string, unknown>;
    const roomName = payload?.room_name as string | undefined;
    const recordingId = payload?.recording_id as string | undefined;
    const duration = payload?.duration as number | undefined;

    if (!roomName) {
      return ok({ error: "missing room_name" }, 400);
    }

    const acceptedTypes = [
      "recording.ready-to-download",
      "recording.finished",
    ];
    if (eventType && !acceptedTypes.includes(eventType)) {
      console.log("[daily-recording-webhook] ignoring event:", eventType);
      return ok({ ok: true, ignored: eventType });
    }

    const { data: rec, error: recErr } = await supabase
      .from("call_recordings")
      .select("id, host_user_id, status, stargate_category, call_type")
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

    await supabase
      .from("call_recordings")
      .update({ status: "processing", duration_seconds: duration ?? null })
      .eq("id", rec.id);

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

    const { error: updateErr } = await supabase
      .from("call_recordings")
      .update({
        status: "ready",
        storage_path: storagePath,
        video_url: storagePath,
        duration_seconds: duration ?? null,
        ended_at: new Date().toISOString(),
      })
      .eq("id", rec.id);

    if (updateErr) {
      console.error("[daily-recording-webhook] final update err:", updateErr);
      return ok({ error: updateErr.message }, 500);
    }

    if (rec.call_type === "stargate" && rec.stargate_category) {
      await attachStargateRecordingToCourse(
        supabase,
        rec.id,
        rec.stargate_category as string,
      );
    }

    return ok({ ok: true, id: rec.id, storage_path: storagePath });
  } catch (e) {
    console.error("[daily-recording-webhook] fatal:", e);
    return ok({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
