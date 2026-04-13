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

const PRIMARY_MODEL  = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: GeminiBridgeRequest = await req.json();
    const { prompt, context, feature, stream = false, messages, imageBase64, imageMimeType } = body;

    if (!prompt && !messages?.length) {
      return new Response(JSON.stringify({ error: "Prompt or messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let contents: unknown[] = [];

    if (messages && messages.length > 0) {
      contents = messages.map(msg => {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.audio?.data && msg.audio?.mimeType) {
          parts.push({ inlineData: { mimeType: msg.audio.mimeType, data: msg.audio.data } });
        }
        return { role: msg.role === "assistant" ? "model" : msg.role, parts: parts.length ? parts : [{ text: "" }] };
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
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
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
      console.log(`gemini-bridge: trying ${model} for feature:${feature || "general"}`);

      try {
        geminiResponse = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
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
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (stream) {
      return new Response(geminiResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const data = await geminiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!responseText) {
      console.error(`gemini-bridge: empty response from ${usedModel}:`, JSON.stringify(data));
      return new Response(JSON.stringify({ error: "No response generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Return both 'response' (legacy) and 'text' (new) so all consumers work
    return new Response(
      JSON.stringify({ response: responseText, text: responseText, model: usedModel, feature: feature || "general" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("gemini-bridge: unhandled error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
