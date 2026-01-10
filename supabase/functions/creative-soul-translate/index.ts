import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import OpenAI from "https://deno.land/x/openai@v4.20.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
});

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

    // Check if user is admin (admins bypass access checks)
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
      const { data: toolAccess } = await supabaseAdmin
        .from('creative_tool_access')
        .select(`
          *,
          tool:creative_tools!inner(slug)
        `)
        .eq('user_id', user.id)
        .eq('tool.slug', 'creative-soul-studio')
        .limit(1);

      if (!toolAccess || toolAccess.length === 0) {
        throw new Error("You don't have access to Creative Soul Studio. Please purchase it first.");
      }
    }

    const { text, targetLanguage } = await req.json();

    if (!text || !text.trim()) {
      throw new Error("Missing text to translate");
    }

    if (!targetLanguage) {
      throw new Error("Missing target language");
    }

    const languageMap: Record<string, string> = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
    };

    const targetLangName = languageMap[targetLanguage] || targetLanguage;

    console.log(`[CREATIVE-SOUL-TRANSLATE] Translating text for user: ${user.id} to ${targetLangName}`);

    // Use OpenAI to translate
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLangName}. Maintain the original meaning, tone, and style. Return only the translated text without any explanations or additional text.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error("Translation failed - no response from AI");
    }

    // Track translation usage (optional)
    try {
      await supabaseAdmin
        .from('creative_tool_usage')
        .insert({
          user_id: user.id,
          tool_slug: 'creative-soul-studio',
          action_type: 'translate',
          metadata: { target_language: targetLanguage },
        });
    } catch (err: unknown) {
      console.error('Failed to track usage:', err);
    }

    console.log(`[CREATIVE-SOUL-TRANSLATE] Translation complete for user: ${user.id}`);

    return new Response(
      JSON.stringify({ translatedText }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-SOUL-TRANSLATE] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

