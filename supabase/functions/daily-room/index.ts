import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dailyKey = Deno.env.get("DAILY_API_KEY")!;

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, channel_id, title, description, session_id, allow_non_admin, source } = body;

    // Admin check (DM video calls set allow_non_admin=true)
    if (!allow_non_admin) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "create") {
      // Create Daily.co room
      const effectiveChannelId = source === "feed" ? "feed" : (channel_id || "divine-sangha");
      const roomRes = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dailyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            enable_recording: "cloud",
            exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
            // Metadata for recording webhook: source + channel_id
            metadata: JSON.stringify({ source: source || "channel", channel_id: effectiveChannelId }),
          },
        }),
      });

      if (!roomRes.ok) {
        const errText = await roomRes.text();
        return new Response(JSON.stringify({ error: "Daily.co error", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const room = await roomRes.json();

      // Save to DB: source='feed' -> channel_id='feed'; source='channel' -> channel_id from request (for recordings context)
      const { data: session, error: dbError } = await supabase
        .from("community_live_sessions")
        .insert({
          channel_id: effectiveChannelId,
          host_user_id: user.id,
          title: title || "Live Session",
          description: description || "",
          room_url: room.url,
          room_name: room.name,
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

      return new Response(JSON.stringify({ session, room_url: room.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "end") {
      // Fetch session to get room_name before ending
      const { data: sessionRow } = await supabase
        .from("community_live_sessions")
        .select("room_name, channel_id, title")
        .eq("id", session_id)
        .single();

      // End session in DB
      await supabase
        .from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session_id);

      // Try to fetch recording from Daily.co and update the feed post
      if (sessionRow?.room_name) {
        try {
          const recRes = await fetch(
            `https://api.daily.co/v1/rooms/${sessionRow.room_name}/recordings`,
            { headers: { Authorization: `Bearer ${dailyKey}` } }
          );
          if (recRes.ok) {
            const recData = await recRes.json();
            const recordings = recData?.data || recData || [];
            const latestRec = Array.isArray(recordings) ? recordings[0] : null;
            if (latestRec?.download_link || latestRec?.s3_key) {
              const recordingUrl = latestRec.download_link || latestRec.s3_key;
              // Update the live feed post with the recording URL
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
