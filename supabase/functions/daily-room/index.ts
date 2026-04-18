// deployed: 2026-04-18
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonRecord = Record<string, unknown>;

function respond(payload: JsonRecord) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function rankFromTier(tier: string | null | undefined) {
  const value = (tier || "").toLowerCase();
  if (!value) return 0;
  if (value.includes("akasha") || value.includes("life")) return 3;
  if (value.includes("siddha")) return 2;
  if (
    value.includes("prana") ||
    value.includes("premium") ||
    value.includes("month") ||
    value.includes("annual") ||
    value.includes("year")
  ) {
    return 1;
  }
  return 0;
}

function extractMembershipSlug(row: { membership_tiers?: { slug?: string } | { slug?: string }[] | null }) {
  const tierValue = row.membership_tiers;
  if (Array.isArray(tierValue)) return tierValue[0]?.slug ?? null;
  return tierValue?.slug ?? null;
}

async function isAdminUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) {
    return { ok: false, error: "Role check failed", details: error.message };
  }

  return { ok: true, value: data === true };
}

async function getUserRank(supabase: SupabaseClient, userId: string) {
  let bestRank = 0;

  const { data: memberships, error: membershipError } = await supabase
    .from("user_memberships")
    .select("membership_tiers(slug)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    console.warn("[daily-room] membership rank check failed:", membershipError.message);
  } else {
    for (const row of (memberships as { membership_tiers?: { slug?: string } | { slug?: string }[] | null }[] | null) || []) {
      bestRank = Math.max(bestRank, rankFromTier(extractMembershipSlug(row)));
    }
  }

  const { data: adminGrants, error: grantError } = await supabase
    .from("admin_granted_access")
    .select("tier")
    .eq("user_id", userId)
    .eq("access_type", "membership")
    .eq("is_active", true)
    .or("expires_at.is.null,expires_at.gt.now()");

  if (grantError) {
    console.warn("[daily-room] admin grant rank check failed:", grantError.message);
  } else {
    for (const row of (adminGrants as { tier?: string | null }[] | null) || []) {
      bestRank = Math.max(bestRank, rankFromTier(row.tier ?? null));
    }
  }

  return bestRank;
}

async function verifyStargateMembership(supabaseUrl: string, authHeader: string, anonKey: string) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/check-stargate-membership`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    const bodyText = await res.text();
    const payload = bodyText ? JSON.parse(bodyText) : {};

    if (!res.ok || payload?.error) {
      return {
        ok: false,
        error: payload?.error || `Membership check failed (${res.status})`,
      };
    }

    return { ok: payload?.hasStargateMembership === true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

async function assertCanCreateSession(params: {
  supabase: SupabaseClient;
  supabaseUrl: string;
  authHeader: string;
  anonKey?: string;
  userId: string;
  channelId: string;
  source: string;
}) {
  const { supabase, supabaseUrl, authHeader, anonKey, userId, channelId, source } = params;

  const adminResult = await isAdminUser(supabase, userId);
  if (!adminResult.ok) return adminResult;
  const isAdmin = adminResult.value === true;

  if (source === "feed") {
    return isAdmin
      ? { ok: true }
      : {
          ok: false,
          error: "Admin only",
          details: "Only admins can start a feed-wide live session.",
        };
  }

  if (channelId.startsWith("dm-")) {
    return { ok: true };
  }

  if (isAdmin) {
    return { ok: true };
  }

  if (channelId === "andlig-transformation") {
    return {
      ok: false,
      error: "Admin only",
      details: "This private group only allows admin-hosted live sessions.",
    };
  }

  if (channelId === "stargate") {
    if (!anonKey?.trim()) {
      return {
        ok: false,
        error: "Server misconfigured",
        details: "SUPABASE_ANON_KEY is required to verify Stargate access.",
      };
    }

    const membership = await verifyStargateMembership(supabaseUrl, authHeader, anonKey);
    return membership.ok
      ? { ok: true }
      : {
          ok: false,
          error: "Stargate membership required",
          details: membership.error || "Only Stargate members can go live in this group.",
        };
  }

  const requiredRank = channelId === "bhakti-algorithm-lab" ? 3 : channelId === "siddha-masters" ? 2 : 0;
  if (requiredRank === 0) {
    return { ok: true };
  }

  const userRank = await getUserRank(supabase, userId);
  if (userRank >= requiredRank) {
    return { ok: true };
  }

  return {
    ok: false,
    error: requiredRank >= 3 ? "Akasha Infinity required" : "Siddha Quantum required",
    details: "Your current membership does not allow live sessions in this specific group.",
  };
}

async function assertCanEndSession(supabase: SupabaseClient, userId: string, sessionId: string) {
  const adminResult = await isAdminUser(supabase, userId);
  if (!adminResult.ok) return adminResult;
  if (adminResult.value === true) return { ok: true };

  const { data, error } = await supabase
    .from("community_live_sessions")
    .select("host_user_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify session", details: error.message };
  }

  if (data?.host_user_id === userId) {
    return { ok: true };
  }

  return {
    ok: false,
    error: "Forbidden",
    details: "Only the host or an admin can end this live session.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const dailyKey = Deno.env.get("DAILY_API_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || undefined;

    if (!supabaseUrl || !serviceRoleKey) {
      return respond({ ok: false, error: "Server misconfigured", details: "Missing backend credentials." });
    }

    if (!dailyKey.trim()) {
      return respond({ ok: false, error: "Live video is not configured", details: "DAILY_API_KEY is missing." });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return respond({ ok: false, error: "No auth" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return respond({ ok: false, error: "Unauthorized", details: authError?.message });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return respond({ ok: false, error: "Invalid JSON body" });
    }

    const { action, channel_id, title, description, session_id, source } = body as Record<string, unknown>;

    if (action === "create") {
      const effectiveChannelId = source === "feed"
        ? "feed"
        : (typeof channel_id === "string" && channel_id.trim()) || "divine-sangha";

      const permission = await assertCanCreateSession({
        supabase,
        supabaseUrl,
        authHeader,
        anonKey,
        userId: user.id,
        channelId: effectiveChannelId,
        source: typeof source === "string" ? source : "channel",
      });

      if (!permission.ok) {
        return respond(permission);
      }

      const recordingMode = Deno.env.get("DAILY_RECORDING")?.trim() || "";
      const validModes = ["cloud", "cloud-audio-only", "local", "raw-tracks"];
      const enableRecording = validModes.includes(recordingMode) ? recordingMode : null;
      const roomSlug = `sh${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;

      const basePayload = {
        name: roomSlug,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          ...(enableRecording ? { enable_recording: enableRecording } : {}),
          exp: Math.floor(Date.now() / 1000) + 3600 * 4,

        },
      };

      let roomRes = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dailyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basePayload),
      });

      if (!roomRes.ok && enableRecording === "cloud") {
        const props = { ...(basePayload.properties as Record<string, unknown>) };
        delete props.enable_recording;
        const retryPayload = {
          ...basePayload,
          properties: props,
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
        return respond({
          ok: false,
          error: "Daily.co could not create a room",
          details: await roomRes.text(),
          hint: "Set DAILY_API_KEY in Supabase Edge secrets. Omit DAILY_RECORDING to disable recording, or set cloud | cloud-audio-only | local | raw-tracks per Daily.co docs.",
        });
      }

      const room = (await roomRes.json()) as { url?: string; name?: string };
      if (!room.url) {
        return respond({
          ok: false,
          error: "Daily.co response missing room URL",
          details: JSON.stringify(room),
        });
      }

      const { data: session, error: insertError } = await supabase
        .from("community_live_sessions")
        .insert({
          channel_id: effectiveChannelId,
          host_user_id: user.id,
          title: (typeof title === "string" && title.trim()) || "Live Session",
          description: typeof description === "string" ? description : "",
          room_url: room.url,
          room_name: room.name ?? roomSlug,
          status: "active",
        })
        .select()
        .single();

      if (insertError) {
        return respond({ ok: false, error: "Failed to save live session", details: insertError.message });
      }

      return respond({ ok: true, success: true, session, room_url: room.url });
    }

    if (action === "end") {
      if (typeof session_id !== "string" || !session_id) {
        return respond({ ok: false, error: "session_id required" });
      }

      const permission = await assertCanEndSession(supabase, user.id, session_id);
      if (!permission.ok) {
        return respond(permission);
      }

      const { data: sessionRow, error: sessionError } = await supabase
        .from("community_live_sessions")
        .select("room_name, channel_id, title")
        .eq("id", session_id)
        .maybeSingle();

      if (sessionError) {
        return respond({ ok: false, error: "Failed to load session", details: sessionError.message });
      }

      const { error: updateError } = await supabase
        .from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session_id);

      if (updateError) {
        return respond({ ok: false, error: "Failed to end session", details: updateError.message });
      }

      if (sessionRow?.room_name) {
        try {
          const recordingRes = await fetch(`https://api.daily.co/v1/rooms/${sessionRow.room_name}/recordings`, {
            headers: { Authorization: `Bearer ${dailyKey}` },
          });

          if (recordingRes.ok) {
            const recordingPayload = await recordingRes.json();
            const recordings = recordingPayload?.data || recordingPayload || [];
            const latestRecording = Array.isArray(recordings) ? recordings[0] : null;
            const recordingUrl = latestRecording?.download_link || latestRecording?.s3_key;

            if (recordingUrl) {
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
        } catch (error) {
          console.error("[daily-room] recording fetch failed:", error);
        }
      }

      return respond({ ok: true, success: true });
    }

    return respond({ ok: false, error: "Invalid action" });
  } catch (error) {
    console.error("[daily-room] unexpected error:", error);
    return respond({ ok: false, error: toErrorMessage(error) });
  }
});
