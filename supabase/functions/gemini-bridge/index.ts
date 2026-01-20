import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeminiBridgeRequest {
  prompt: string;
  context?: string;
  model?: string; // 'flash', 'flash-lite', 'pro'
  feature?: string; // 'vedic_reading', 'guru_chat', 'ayurveda', 'translation', 'dosha', 'music'
  stream?: boolean;
  messages?: Array<{ role: string; content: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GeminiBridgeRequest = await req.json();
    const { prompt, context, model = "flash", feature, stream = false, messages } = body;

    if (!prompt && !messages?.length) {
      return new Response(
        JSON.stringify({ error: "Prompt or messages required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Model selection based on feature or explicit model choice
    // flash-lite for translations (cheapest), flash for most, pro for premium features
    let geminiModel = "gemini-2.0-flash";
    
    if (model === "pro" || feature === "vedic_reading" || feature === "guru_chat") {
      geminiModel = "gemini-1.5-pro-latest";
    } else if (model === "flash-lite" || feature === "translation") {
      geminiModel = "gemini-2.0-flash-lite-preview-02-05";
    } else if (model === "flash") {
      geminiModel = "gemini-2.0-flash";
    }

    console.log(`Using model: ${geminiModel} for feature: ${feature || 'general'}`);

    // Build the content parts
    let contents: any[] = [];
    
    if (messages && messages.length > 0) {
      // Chat mode - convert messages format
      contents = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : msg.role,
        parts: [{ text: msg.content }]
      }));
    } else {
      // Single prompt mode
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      contents = [{ role: "user", parts: [{ text: fullPrompt }] }];
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate response from Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      // Return streaming response
      return new Response(geminiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await geminiResponse.json();
    
    // Extract text from Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!responseText) {
      console.error("No response text from Gemini:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: responseText,
        model: geminiModel,
        feature: feature || 'general'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Gemini bridge error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
