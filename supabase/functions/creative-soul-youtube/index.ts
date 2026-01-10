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

// Poll for conversion status
async function pollForResult(jobId: string, apiKey: string, apiHost: string, maxAttempts = 30): Promise<{ downloadUrl: string; title: string } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`[YOUTUBE] Polling attempt ${i + 1}/${maxAttempts} for job ${jobId}`);
    
    const response = await fetch(`https://${apiHost}/status/${jobId}`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
    });

    const data = await response.json();
    console.log(`[YOUTUBE] Poll status: ${data.status}`);

    if (data.status === "AVAILABLE" && data.downloadUrl) {
      return { downloadUrl: data.downloadUrl, title: data.title || "YouTube Audio" };
    }

    if (data.status === "CONVERSION_ERROR" || data.status === "EXPIRED") {
      throw new Error(`Conversion failed: ${data.status}`);
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error("Conversion timed out. Please try a shorter video.");
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

    // Check for RapidAPI key
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "YouTube conversion service not configured. Please contact support.",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const apiHost = "youtube-to-mp315.p.rapidapi.com";

    // Step 1: Start the conversion
    console.log(`[YOUTUBE] Starting conversion for: ${youtubeUrl}`);
    const startResponse = await fetch(`https://${apiHost}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": apiHost,
      },
      body: JSON.stringify({
        url: youtubeUrl,
        format: "mp3",
        quality: 0,
      }),
    });

    const startData = await startResponse.json();
    console.log(`[YOUTUBE] Start response:`, JSON.stringify(startData));

    if (!startData.id) {
      throw new Error(startData.message || "Failed to start YouTube conversion");
    }

    // Step 2: Poll for result
    const result = await pollForResult(startData.id, rapidApiKey, apiHost);
    
    if (!result) {
      throw new Error("Conversion failed - no result received");
    }

    console.log(`[YOUTUBE] Conversion complete: ${result.downloadUrl}`);

    // Step 3: Optionally transcribe the audio using OpenAI
    let transcription: string | null = null;
    if (transcribe) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiApiKey) {
        try {
          console.log(`[YOUTUBE] Downloading audio for transcription...`);
          
          // Download the MP3 file
          const audioResponse = await fetch(result.downloadUrl);
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
        mp3Url: result.downloadUrl,
        transcription: transcription,
        videoTitle: result.title,
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
