import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { search, pageToken } = await req.json();
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    console.log("[FETCH-YOUTUBE] Fetching channels from database");

    // Get active channels from database
    const { data: channels, error: channelsError } = await supabase
      .from("youtube_channels")
      .select("channel_id, channel_name")
      .eq("is_active", true);

    if (channelsError) throw channelsError;
    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ videos: [], nextPageToken: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[FETCH-YOUTUBE] Found channels:", channels.length);

    const allVideos: YouTubeVideo[] = [];
    let nextPageToken: string | null = null;

    // Fetch videos from each channel
    for (const channel of channels) {
      let url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channel.channel_id}&part=snippet&type=video&order=date&maxResults=10`;
      
      if (search) {
        url += `&q=${encodeURIComponent(search)}`;
      }
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      console.log("[FETCH-YOUTUBE] Fetching from channel:", channel.channel_name);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("[FETCH-YOUTUBE] YouTube API error:", data.error);
        continue;
      }

      if (data.items) {
        for (const item of data.items) {
          allVideos.push({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
          });
        }
      }

      // Use the last channel's nextPageToken
      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken;
      }
    }

    // Sort by published date and limit
    allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    console.log("[FETCH-YOUTUBE] Total videos fetched:", allVideos.length);

    return new Response(JSON.stringify({ 
      videos: allVideos,
      nextPageToken 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[FETCH-YOUTUBE] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});