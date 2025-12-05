import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded channel ID for @kritagyadas
const CHANNEL_ID = "UCd_aXYgDxXLU6J-XUc2FLVg";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Fetch 4 latest videos directly from the channel
    const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet&type=video&order=date&maxResults=4`;

    console.log("[FETCH-YOUTUBE] Fetching 4 latest videos from channel");
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("[FETCH-YOUTUBE] YouTube API error:", JSON.stringify(data.error));
      throw new Error(data.error.message || "YouTube API error");
    }

    const videos = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
    }));

    console.log("[FETCH-YOUTUBE] Videos fetched:", videos.length);

    return new Response(JSON.stringify({ videos, nextPageToken: null }), {
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