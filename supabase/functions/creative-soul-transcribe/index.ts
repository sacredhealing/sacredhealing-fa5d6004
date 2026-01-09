import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import OpenAI from "https://deno.land/x/openai@v4.20.0/mod.ts";

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
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      throw new Error("Missing audioBase64");
    }

    // Check user has access to Creative Soul tool
    const { data: toolAccess } = await supabaseClient
      .from('user_creative_tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (!toolAccess || toolAccess.length === 0) {
      throw new Error("You don't have access to Creative Soul. Please purchase it first.");
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Convert base64 to Uint8Array
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    
    // Create a Blob and File for OpenAI API
    const audioBlob = new Blob([audioBytes], { type: mimeType || 'audio/webm' });
    const audioFile = new File([audioBlob], "audio.webm", { type: mimeType || 'audio/webm' });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Optional: specify language for better accuracy
    });

    console.log(`[CREATIVE-SOUL-TRANSCRIBE] Transcribed audio for user: ${user.id}`);

    return new Response(
      JSON.stringify({ text: transcription.text }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-TRANSCRIBE] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

