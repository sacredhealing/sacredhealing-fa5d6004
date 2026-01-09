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

    const { text } = await req.json();

    if (!text || !text.trim()) {
      throw new Error("Missing text input");
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

    // Generate creative ideas using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative assistant that helps transform ideas into actionable, inspiring creative concepts. Provide detailed, practical, and imaginative suggestions.",
        },
        {
          role: "user",
          content: `Based on this input, generate creative and inspiring ideas:\n\n${text}\n\nProvide 3-5 detailed creative ideas with actionable steps. Format them clearly with bullet points.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 1000,
    });

    const ideas = completion.choices[0]?.message?.content || "No ideas generated.";

    console.log(`[CREATIVE-SOUL-IDEAS] Generated ideas for user: ${user.id}`);

    return new Response(
      JSON.stringify({ ideas }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-IDEAS] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

