import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHANNEL_URL = "https://www.youtube.com/@kritagyadas/videos";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[FETCH-YOUTUBE] Scraping channel page:", CHANNEL_URL);

    const response = await fetch(CHANNEL_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status}`);
    }

    const html = await response.text();
    console.log("[FETCH-YOUTUBE] Page fetched, length:", html.length);

    const videos: Array<{
      id: string;
      title: string;
      thumbnail: string;
      url: string;
      publishedAt: string;
      channelTitle: string;
    }> = [];

    // Try to find ytInitialData JSON - contains ALL videos on the page
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    
    if (ytInitialDataMatch) {
      try {
        const ytData = JSON.parse(ytInitialDataMatch[1]);
        console.log("[FETCH-YOUTUBE] Found ytInitialData");
        
        // Navigate to the video list
        const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        
        for (const tab of tabs) {
          const tabContent = tab?.tabRenderer?.content?.richGridRenderer?.contents || [];
          
          for (const item of tabContent) {
            const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
            
            if (videoRenderer) {
              const videoId = videoRenderer.videoId;
              if (!videoId) continue;
              
              const title = videoRenderer.title?.runs?.[0]?.text || "Untitled";
              const thumbnail = videoRenderer.thumbnail?.thumbnails?.slice(-1)[0]?.url || 
                               `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || "Kritagya Das";
              const publishedText = videoRenderer.publishedTimeText?.simpleText || "";
              
              videos.push({
                id: videoId,
                title,
                thumbnail,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                publishedAt: publishedText,
                channelTitle,
              });
            }
          }
        }
      } catch (parseError) {
        console.error("[FETCH-YOUTUBE] Error parsing ytInitialData:", parseError);
      }
    }

    // Fallback: regex extraction
    if (videos.length === 0) {
      console.log("[FETCH-YOUTUBE] Trying fallback regex extraction");
      
      const videoIdPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
      const foundIds = new Set<string>();
      let match;
      
      while ((match = videoIdPattern.exec(html)) !== null) {
        foundIds.add(match[1]);
      }
      
      if (foundIds.size === 0) {
        const altPattern = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
        while ((match = altPattern.exec(html)) !== null) {
          foundIds.add(match[1]);
        }
      }

      for (const videoId of foundIds) {
        const titlePattern = new RegExp(`"videoId":"${videoId}"[^}]*"title":\\{"runs":\\[\\{"text":"([^"]+)"`, 's');
        const titleMatch = html.match(titlePattern);
        const title = titleMatch ? titleMatch[1] : `Video ${videoId}`;
        
        videos.push({
          id: videoId,
          title: title.replace(/\\u0026/g, '&').replace(/\\"/g, '"'),
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt: "",
          channelTitle: "Kritagya Das",
        });
      }
    }

    console.log("[FETCH-YOUTUBE] Total videos extracted:", videos.length);

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[FETCH-YOUTUBE] Error:", message);
    return new Response(JSON.stringify({ error: message, videos: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
