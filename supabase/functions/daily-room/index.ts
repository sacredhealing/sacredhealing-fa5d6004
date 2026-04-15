import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function requireAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<Response | null> {
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr) {
    return new Response(
      JSON.stringify({ error: "Role check failed", details: roleErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    );
  }
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

async function verifyStargateMembership(
  supabaseUrl: string,
  authHeader: string,
  anonKey: string,
): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/functions/v1/check-stargate-membership`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) return false;
  const j = await res.json().catch(() => ({}));
  return j.hasStargateMembership === true;
}

/** Non-admin live: only DM threads or Stargate (verified server-side). */
async function assertNonAdminCreateAllowed(
  supabaseUrl: string,
  authHeader: string,
  effectiveChannelId: string,
  anonKey: string | undefined,
): Promise<Response | null> {
  if (effectiveChannelId.startsWith("dm-")) {
    return null;
  }
  if (effectiveChannelId === "stargate") {
    if (!anonKey?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Server misconfigured: SUPABASE_ANON_KEY is required for Stargate live video",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      );
    }
    const ok = await verifyStargateMembership(supabaseUrl, authHeader, anonKey);
    if (!ok) {
      return new Response(
        JSON.stringify({
          error: "Stargate membership required",
          details: "Only Stargate members can start a live session in this channel.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      );
    }
    return null;
  }
  return new Response(
    JSON.stringify({
      error: "Live creation not allowed",
      details:
        "Without admin privileges, live video is only available for direct messages or the Stargate channel.",
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
  );
}

/** End session: admin or the host who created the room. */
async function assertCanEndSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<Response | null> {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (isAdmin === true) return null;

  const { data: row, error } = await supabase
    .from("community_live_sessions")
    .select("host_user_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: "Could not verify session", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (row?.host_user_id === userId) return null;

  return new Response(
    JSON.stringify({
      error: "Forbidden",
      details: "Only the host or an admin can end this live session.",
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dailyKey = Deno.env.get("DAILY_API_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      );
    }
    if (!dailyKey?.trim()) {
      return new Response(
        JSON.stringify({
          error:
            "Live video is not configured: set DAILY_API_KEY in Supabase Edge Function secrets (Daily.co API key).",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, channel_id, title, description, session_id, allow_non_admin, source } = body as Record<
      string,
      unknown
    >;

    if (action === "create") {
      const effectiveChannelId = source === "feed" ? "feed" : (typeof channel_id === "string" && channel_id) || "divine-sangha";

      if (!allow_non_admin) {
        const denied = await requireAdmin(supabase, user.id);
        if (denied) return denied;
      } else {
        const denied = await assertNonAdminCreateAllowed(supabaseUrl, authHeader, effectiveChannelId, anonKey);
        if (denied) return denied;
      }

      const recordingMode = Deno.env.get("DAILY_RECORDING")?.trim() || "off";
      const validRecording = ["off", "local", "cloud"].includes(recordingMode) ? recordingMode : "off";

      const roomSlug = `sh${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;

      const roomPayload: Record<string, unknown> = {
        name: roomSlug,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: validRecording,
          exp: Math.floor(Date.now() / 1000) + 3600 * 4,
          metadata: { source: source || "channel", channel_id: effectiveChannelId },
        },
      };

      let roomRes = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dailyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomPayload),
      });

      if (!roomRes.ok && validRecording === "cloud") {
        const retryPayload = {
          ...roomPayload,
          properties: { ...(roomPayload.properties as object), enable_recording: "off" },
        };
        roomRes = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${dailyKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(retryPayload),
        });
      }

      if (!roomRes.ok) {
        const errText = await roomRes.text();
        return new Response(
          JSON.stringify({
            error: "Daily.co could not create a room",
            details: errText,
            hint: "Set DAILY_API_KEY in Supabase Edge secrets. Use DAILY_RECORDING=off if cloud recording is not enabled on your Daily plan.",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        );
      }

      const room = await roomRes.json() as { url?: string; name?: string };

      const roomUrl = room.url;
      if (!roomUrl) {
        return new Response(
          JSON.stringify({
            error: "Daily.co response missing room URL",
            details: JSON.stringify(room),
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        );
      }

      const { data: session, error: dbError } = await supabase
        .from("community_live_sessions")
        .insert({
          channel_id: effectiveChannelId,
          host_user_id: user.id,
          title: (typeof title === "string" && title) || "Live Session",
          description: (typeof description === "string" && description) || "",
          room_url: roomUrl,
          room_name: room.name ?? roomSlug,
          status: "active",
        })
        .select()
        .single();

      if (dbError) {
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ session, room_url: roomUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "end") {
      if (typeof session_id !== "string" || !session_id) {
        return new Response(JSON.stringify({ error: "session_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const denied = await assertCanEndSession(supabase, user.id, session_id);
      if (denied) return denied;

      const { data: sessionRow } = await supabase
        .from("community_live_sessions")
        .select("room_name, channel_id, title")
        .eq("id", session_id)
        .single();

      await supabase
        .from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session_id);

      if (sessionRow?.room_name) {
        try {
          const recRes = await fetch(
            `https://api.daily.co/v1/rooms/${sessionRow.room_name}/recordings`,
            { headers: { Authorization: `Bearer ${dailyKey}` } },
          );
          if (recRes.ok) {
            const recData = await recRes.json();
            const recordings = recData?.data || recData || [];
            const latestRec = Array.isArray(recordings) ? recordings[0] : null;
            if (latestRec?.download_link || latestRec?.s3_key) {
              const recordingUrl = latestRec.download_link || latestRec.s3_key;

              try {
                const { data: stargateCourse } = await supabase
                  .from("courses")
                  .select("id")
                  .ilike("title", "%Stargate%")
                  .limit(1)
                  .maybeSingle();

                const stargateCourseId = (stargateCourse as { id?: string })?.id as string | undefined;
                if (stargateCourseId) {
                  const { data: existingLesson } = await supabase
                    .from("course_lessons")
                    .select("id")
                    .eq("video_url", recordingUrl)
                    .maybeSingle();

                  if (!existingLesson) {
                    await supabase.from("course_lessons").insert({
                      title: sessionRow.title || "Live Session",
                      video_url: recordingUrl,
                      audio_url: null,
                      course_id: stargateCourseId,
                      section: "healing-chamber",
                    });
                  }
                }
              } catch (courseErr) {
                console.error("Failed to insert recording into course_lessons:", courseErr);
              }
              await supabase
                .from("community_posts")
                .update({
                  video_url: recordingUrl,
                  post_type: "video",
                  content: `📹 Recording: ${sessionRow.title || "Live Session"}`,
                })
                .eq("post_type", "live")
                .eq("user_id", user.id)
                .like("content", `%${sessionRow.title || "Live Session"}%`);
            }
          }
        } catch (recErr) {
          console.error("Failed to fetch recording:", recErr);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
