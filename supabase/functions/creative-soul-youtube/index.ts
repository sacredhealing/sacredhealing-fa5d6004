import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import ytdl from "https://esm.sh/@distube/ytdl-core@4.16.2";
import OpenAI from "https://esm.sh/openai@4.28.0";

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

// Download YouTube audio as buffer
async function downloadYouTubeAudio(videoId: string): Promise<Uint8Array> {
  console.log(`[YOUTUBE] Starting download for video: ${videoId}`);
  
  const audioStream = ytdl(videoId, {
    quality: "lowestaudio",
    filter: "audioonly",
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(new Uint8Array(chunk));
  }

  // Combine all chunks into a single Uint8Array
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const audioBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    audioBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  console.log(`[YOUTUBE] Downloaded ${totalLength} bytes of audio`);
  return audioBuffer;
}

// Get video info (title, duration, etc.)
async function getVideoInfo(videoId: string): Promise<{ title: string; duration: number }> {
  try {
    const info = await ytdl.getInfo(videoId);
    return {
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds) || 0,
    };
  } catch (error) {
    console.error("[YOUTUBE] Error getting video info:", error);
    return { title: "Unknown", duration: 0 };
  }
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
            status: 403
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
    console.log(`[YOUTUBE] Video title: ${videoInfo.title}, duration: ${videoInfo.duration}s`);

    // Check video duration (limit to 30 minutes to avoid timeout)
    if (videoInfo.duration > 1800) {
      return new Response(
        JSON.stringify({ 
          error: "Video too long. Please use videos under 30 minutes.",
          success: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Download audio
    const audioBuffer = await downloadYouTubeAudio(videoId);

    // Convert to base64 for transcription and storage
    const audioBase64 = btoa(String.fromCharCode(...audioBuffer));

    // Upload to Supabase Storage
    const fileName = `creative-soul/${user.id}/${Date.now()}-${videoId}.mp3`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[YOUTUBE] Upload error:', uploadError);
      throw new Error("Failed to save audio file. Please try again.");
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('audio')
      .getPublicUrl(fileName);

    console.log(`[YOUTUBE] Audio uploaded to: ${publicUrl}`);

    // Optionally transcribe the audio
    let transcription: string | null = null;
    if (transcribe) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiApiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          
          // Create a File object for OpenAI - use spread to avoid ArrayBuffer type issues
          const audioFile = new File([new Uint8Array(audioBuffer)], "audio.mp3", { type: "audio/mpeg" });
          
          const transcriptionResult = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            response_format: "text",
          });
          
          transcription = String(transcriptionResult);
          console.log(`[YOUTUBE] Transcription completed: ${transcription.substring(0, 100)}...`);
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
        mp3Url: publicUrl,
        audioBase64: audioBase64.length > 1000000 ? null : audioBase64, // Only include if under 1MB
        transcription: transcription,
        videoTitle: videoInfo.title,
        videoDuration: videoInfo.duration,
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
    if (message.includes("Could not extract") || message.includes("No video id found")) {
      userMessage = "Could not process this YouTube video. It may be private, age-restricted, or unavailable.";
    } else if (message.includes("410")) {
      userMessage = "This video is not available for download. It may be restricted or removed.";
    } else if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      userMessage = "Request timed out. Please try a shorter video.";
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
