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

    // Try multiple YouTube conversion services
    let mp3Url: string | null = null;
    let conversionError: string | null = null;

    // Service 1: loader.to API
    try {
      console.log(`[YOUTUBE] Trying loader.to service...`);
      const loaderResponse = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(youtubeUrl)}`);
      
      if (loaderResponse.ok) {
        const loaderData = await loaderResponse.json();
        console.log(`[YOUTUBE] Loader.to response:`, JSON.stringify(loaderData));
        
        if (loaderData.success && loaderData.download_url) {
          mp3Url = loaderData.download_url;
          console.log(`[YOUTUBE] Loader.to success!`);
        } else if (loaderData.id) {
          // Need to poll for result
          const pollId = loaderData.id;
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const progressResponse = await fetch(`https://loader.to/ajax/progress.php?id=${pollId}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log(`[YOUTUBE] Poll ${i + 1}: ${progressData.progress || 0}%`);
              if (progressData.success === 1 && progressData.download_url) {
                mp3Url = progressData.download_url;
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("[YOUTUBE] Loader.to error:", e);
      conversionError = e instanceof Error ? e.message : "Loader.to failed";
    }

    // Service 2: savetube.pro if first failed
    if (!mp3Url) {
      try {
        console.log(`[YOUTUBE] Trying savetube.pro service...`);
        const savetubeResponse = await fetch("https://api.savetube.pro/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: youtubeUrl,
            format: "mp3"
          }),
        });
        
        if (savetubeResponse.ok) {
          const savetubeData = await savetubeResponse.json();
          if (savetubeData.url) {
            mp3Url = savetubeData.url;
            console.log(`[YOUTUBE] savetube.pro success!`);
          }
        }
      } catch (e) {
        console.error("[YOUTUBE] savetube.pro error:", e);
      }
    }

    // If all services fail, return helpful message
    if (!mp3Url) {
      console.log(`[YOUTUBE] All conversion services failed`);
      
      // Return info about the video at least, suggest manual approach
      return new Response(
        JSON.stringify({
          success: false,
          error: "YouTube conversion services are currently unavailable. Please try one of these alternatives:\n\n1. Use the Voice Recording feature to speak your content\n2. Download the YouTube video manually using a site like y2mate.com\n3. Try again in a few minutes",
          videoTitle: videoTitle,
          videoId: videoId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

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
