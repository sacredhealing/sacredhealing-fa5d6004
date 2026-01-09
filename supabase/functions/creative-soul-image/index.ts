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

    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      throw new Error("Missing prompt");
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

    // Generate image using DALL·E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.substring(0, 1000), // DALL-E 3 has 1000 char limit
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    console.log(`[CREATIVE-SOUL-IMAGE] Generated image for user: ${user.id}`);

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-IMAGE] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

