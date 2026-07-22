import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeminiBridgeRequest {
  prompt: string;
  context?: string;
  model?: string;
  feature?: string;
  stream?: boolean;
  messages?: Array<{ role: string; content: string; audio?: { data: string; mimeType: string } }>;
  imageBase64?: string;
  imageMimeType?: string;
}

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";

const FEATURE_TOKEN_LIMITS: Record<string, number> = {
  // Short utility calls
  temple_home:           400,   // anchoring transmission ~1 paragraph
  food_photo_analysis:   300,   // yes/no + brief dosha note
  soul_scan:             600,   // quick scan summary
  vedic_translation:     500,   // translation output, not prose
  gita_translation:     4000,   // full multi-paragraph teaching passages, not short verses
  // Medium outputs
  soul_vault:           2200,   // soul vault reading: 3 rich paragraphs + kosha map
  transformation_doc:   1500,   // transformation narrative
  // Longer admin/content tasks
  academy_curriculum:   3000,   // module/lesson generation — genuinely long
  // Vision / multimodal
  vision_analysis:       800,   // image-based analysis
};

const DEFAULT_TOKEN_LIMIT = 2048;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { data: { user }, error: authError } = await adminClient.auth.getUser(
        authHeader.split(" ")[1]
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GeminiBridgeRequest = await req.json();
    const { prompt, context, feature, stream = false, messages, imageBase64, imageMimeType } = body;

    if (!prompt && !messages?.length) {
      return new Response(JSON.stringify({ error: "Prompt or messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxOutputTokens = feature && FEATURE_TOKEN_LIMITS[feature]
      ? FEATURE_TOKEN_LIMITS[feature]
      : DEFAULT_TOKEN_LIMIT;

    let contents: unknown[] = [];

    if (messages && messages.length > 0) {
      contents = messages.map(msg => {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.audio?.data && msg.audio?.mimeType) {
          parts.push({ inlineData: { mimeType: msg.audio.mimeType, data: msg.audio.data } });
        }
        return {
          role: msg.role === "assistant" ? "model" : msg.role,
          parts: parts.length ? parts : [{ text: "" }],
        };
      });
    } else {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: fullPrompt }];
      if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
      }
      contents = [{ role: "user", parts }];
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    let geminiResponse: Response | null = null;
    let usedModel = PRIMARY_MODEL;

    for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      usedModel = model;
      const endpoint = stream ? "streamGenerateContent" : "generateContent";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${GEMINI_API_KEY}`;
      console.log(`gemini-bridge: trying ${model} for feature:${feature || "general"} (maxTokens:${maxOutputTokens})`);

      try {
        geminiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (geminiResponse.ok) break;
        if (geminiResponse.status === 429) {
          console.warn(`gemini-bridge: ${model} rate-limited, trying fallback.`);
          geminiResponse = null;
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        const errText = await geminiResponse.text();
        console.error(`gemini-bridge: ${model} error (${geminiResponse.status}): ${errText}`);
        geminiResponse = null;
      } catch (fetchErr) {
        console.error(`gemini-bridge: fetch error on ${model}:`, fetchErr);
        geminiResponse = null;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(geminiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await geminiResponse.json();
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const responseText = responseParts.map((p: any) => p.text ?? "").join("");

    if (!responseText) {
      console.error(`gemini-bridge: empty response from ${usedModel}:`, JSON.stringify(data));
      return new Response(JSON.stringify({ error: "No response generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ response: responseText, text: responseText, model: usedModel, feature: feature || "general" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("gemini-bridge: unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
