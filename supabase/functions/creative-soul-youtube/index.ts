import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Get video info using YouTube oEmbed API (no API key needed)
async function getVideoInfo(videoId: string): Promise<{ title: string } | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl);
    if (response.ok) {
      const data = await response.json();
      return { title: data.title || "YouTube Video" };
    }
  } catch (e) {
    console.error("[YOUTUBE] oEmbed error:", e);
  }
  return { title: "YouTube Video" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: "Missing authorization header. Please sign in and try again.",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ 
          error: "User not authenticated. Please sign in and try again.",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if user is admin using user_roles table (admins bypass access checks)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;

    // Only check access if user is not admin
    if (!isAdmin) {
      const { data: toolAccess, error: accessError } = await supabaseAdmin
        .from('creative_tool_access')
        .select(`
          *,
          tool:creative_tools!inner(slug)
        `)
        .eq('user_id', user.id)
        .eq('tool.slug', 'creative-soul-studio')
        .limit(1);

      if (accessError) {
        console.error('[CREATIVE-SOUL-YOUTUBE] Access check error:', accessError);
        throw new Error("Failed to check access. Please try again.");
      }

      if (!toolAccess || toolAccess.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "You don't have access to Creative Soul Studio. Please purchase it first.",
            success: false
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { youtubeUrl, transcribe = true } = requestBody;

    if (!youtubeUrl || !youtubeUrl.trim()) {
      return new Response(
        JSON.stringify({ 
          error: "Missing YouTube URL",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Validate YouTube URL and extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid YouTube URL format. Please provide a valid YouTube video link.",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`[CREATIVE-SOUL-YOUTUBE] Processing video ${videoId} for user: ${user.id}`);

    // Get video info
    const videoInfo = await getVideoInfo(videoId);
    const videoTitle = videoInfo?.title || "YouTube Video";

    // Use cobalt.tools API for YouTube to MP3 conversion (no API key needed, generous free tier)
    console.log(`[YOUTUBE] Starting conversion with cobalt.tools for: ${youtubeUrl}`);
    
    const cobaltResponse = await fetch("https://co.wuk.sh/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: youtubeUrl,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        isAudioOnly: true,
        isNoTTWatermark: true,
        isTTFullAudio: true,
        disableMetadata: false,
      }),
    });

    const cobaltData = await cobaltResponse.json();
    console.log(`[YOUTUBE] Cobalt response status: ${cobaltData.status}`);

    if (cobaltData.status === "error") {
      // Try alternative service if cobalt fails
      console.log(`[YOUTUBE] Cobalt error: ${cobaltData.text}, trying alternative...`);
      
      // Try y2mate alternative
      const y2mateResponse = await fetch(`https://api.vevioz.com/api/button/mp3/${videoId}`);
      
      if (!y2mateResponse.ok) {
        throw new Error(cobaltData.text || "YouTube conversion failed. The video may be restricted or unavailable.");
      }
      
      const y2mateHtml = await y2mateResponse.text();
      
      // Extract download URL from response
      const urlMatch = y2mateHtml.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
      if (urlMatch && urlMatch[1]) {
        const mp3Url = urlMatch[1];
        console.log(`[YOUTUBE] Y2mate conversion successful`);
        
        return new Response(
          JSON.stringify({
            success: true,
            mp3Url: mp3Url,
            transcription: null,
            videoTitle: videoTitle,
            message: "YouTube video converted to MP3 successfully! Use the voice recording feature to transcribe the downloaded audio.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      throw new Error("Unable to convert this YouTube video. Please try a different video or use the voice recording feature.");
    }

    if (cobaltData.status !== "stream" && cobaltData.status !== "redirect" && cobaltData.status !== "tunnel") {
      throw new Error(`Unexpected response: ${cobaltData.status}. ${cobaltData.text || ""}`);
    }

    const mp3Url = cobaltData.url;
    console.log(`[YOUTUBE] Conversion successful, MP3 URL obtained`);

    // Optionally transcribe the audio using OpenAI
    let transcription: string | null = null;
    if (transcribe) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiApiKey) {
        try {
          console.log(`[YOUTUBE] Downloading audio for transcription...`);
          
          // Download the MP3 file
          const audioResponse = await fetch(mp3Url);
          if (!audioResponse.ok) {
            throw new Error("Failed to download audio for transcription");
          }
          
          const audioBlob = await audioResponse.blob();
          console.log(`[YOUTUBE] Audio downloaded: ${audioBlob.size} bytes`);
          
          // Check size limit (25MB for Whisper)
          if (audioBlob.size > 25 * 1024 * 1024) {
            console.log(`[YOUTUBE] Audio too large for transcription (${audioBlob.size} bytes), skipping`);
          } else {
            // Create form data for OpenAI
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.mp3");
            formData.append("model", "whisper-1");
            formData.append("response_format", "text");
            
            console.log(`[YOUTUBE] Sending to OpenAI Whisper...`);
            const transcribeResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
              },
              body: formData,
            });
            
            if (transcribeResponse.ok) {
              transcription = await transcribeResponse.text();
              console.log(`[YOUTUBE] Transcription completed: ${transcription.substring(0, 100)}...`);
            } else {
              const errorText = await transcribeResponse.text();
              console.error(`[YOUTUBE] Transcription failed: ${errorText}`);
            }
          }
        } catch (transcribeError) {
          console.error('[YOUTUBE] Transcription error:', transcribeError);
          // Continue without transcription - not a fatal error
        }
      } else {
        console.log('[YOUTUBE] OpenAI API key not configured, skipping transcription');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mp3Url: mp3Url,
        transcription: transcription,
        videoTitle: videoTitle,
        message: transcription 
          ? "YouTube video converted and transcribed successfully!" 
          : "YouTube video converted to MP3 successfully!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-YOUTUBE] Error:", message);
    
    // Provide more helpful error messages
    let userMessage = message;
    if (message.includes("timeout") || message.includes("timed out")) {
      userMessage = "Request timed out. Please try a shorter video.";
    } else if (message.includes("rate limit")) {
      userMessage = "Too many requests. Please wait a moment and try again.";
    } else if (message.includes("restricted") || message.includes("unavailable")) {
      userMessage = "This video cannot be converted. It may be private, age-restricted, or region-locked.";
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
