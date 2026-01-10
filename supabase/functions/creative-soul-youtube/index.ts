import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Check if user is admin (admins bypass access checks)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

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
            status: 200, // Return 200 with error in body for proper frontend handling
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

    const { youtubeUrl } = requestBody;

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

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      throw new Error("Invalid YouTube URL format");
    }

    // NOTE: Actual YouTube to MP3 conversion requires a backend service
    // This is a placeholder that returns a demo URL
    // In production, you would:
    // 1. Use yt-dlp or similar service (requires server-side processing)
    // 2. Download video, extract audio, convert to MP3
    // 3. Upload to Supabase Storage
    // 4. Return the public URL

    // For now, return a placeholder that simulates the process
    // In production, integrate with:
    // - A serverless function that has yt-dlp installed
    // - Or use a third-party API like RapidAPI YouTube Downloader
    // - Or process via a dedicated backend service

    console.log(`[CREATIVE-SOUL-YOUTUBE] Processing YouTube URL for user: ${user.id}`, youtubeUrl);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return placeholder response
    // TODO: Replace with actual YouTube processing logic
    return new Response(
      JSON.stringify({
        success: false,
        message: "YouTube processing requires backend service integration. Please use voice recording for now.",
        mp3Url: null,
        audioBase64: null,
        error: "YouTube processing not yet implemented. Please use voice recording feature."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 with error message for proper frontend handling
      }
    );

    /* Example of what the actual implementation would look like:
    
    // 1. Download video using yt-dlp (would need server with yt-dlp installed)
    const videoPath = await downloadYouTubeVideo(youtubeUrl);
    
    // 2. Extract audio to MP3
    const mp3Path = await extractAudioToMP3(videoPath);
    
    // 3. Enhance audio (optional)
    const enhancedPath = await enhanceAudio(mp3Path);
    
    // 4. Upload to Supabase Storage
    const fileName = `creative-soul/${user.id}/${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('creative-soul-audio')
      .upload(fileName, Deno.readFileSync(enhancedPath), {
        contentType: 'audio/mpeg',
        upsert: false,
      });
    
    if (uploadError) throw uploadError;
    
    // 5. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('creative-soul-audio')
      .getPublicUrl(fileName);
    
    // 6. Read audio for transcription
    const audioBytes = Deno.readFileSync(enhancedPath);
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));
    
    // 7. Clean up temp files
    Deno.remove(videoPath);
    Deno.remove(mp3Path);
    Deno.remove(enhancedPath);
    
    return new Response(
      JSON.stringify({
        success: true,
        mp3Url: publicUrl,
        audioBase64: audioBase64,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    */

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-YOUTUBE] Error:", message);
    return new Response(
      JSON.stringify({ 
        error: message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 with error in body for proper frontend handling
      }
    );
  }
});

