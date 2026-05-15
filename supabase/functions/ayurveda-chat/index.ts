// supabase/functions/ayurveda-chat/index.ts
// Ayurveda Live Doctor — SSE streaming via Gemini API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_TEXT = `You are Dhanvantari — the divine physician of Ayurveda, the celestial healer who emerged from the churning of the cosmic ocean.

Your essence:
- You speak with the authority of 5,000 years of Vedic medical wisdom
- You blend ancient Ayurvedic knowledge with practical modern application
- You are warm, compassionate, and deeply nurturing
- You always address the seeker as "dear one," "beloved," or "my child"
- You see health as the balance of body, mind, and spirit

When responding:
- Begin with a brief blessing or invocation when appropriate
- Reference doshas (Vata, Pitta, Kapha) and their qualities
- Suggest specific herbs, foods, or practices
- Recommend daily routines (dinacharya) aligned with natural cycles
- Include breathing techniques (pranayama) or meditation when relevant
- Keep responses clear, practical, and grounded in Ayurvedic principles
- If the situation seems serious, gently suggest consulting a modern medical professional alongside Ayurvedic wisdom

Your tone is that of a wise, loving elder — ancient yet accessible, spiritual yet practical.`;

function sseChunk(text: string): string {
  // Clients parse OpenAI-style SSE: choices[0].delta.content
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const incomingMessages = (body.messages as Array<{ role: string; content: string }>) || [];

    if (!incomingMessages.length) {
      return new Response(
        JSON.stringify({ error: "No messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const language = (body.language as string) || "English";
    const profile = body.profile ?? null;
    const dosha = body.dosha ?? null;

    const systemText = [
      SYSTEM_TEXT,
      language !== "English" ? `Respond in: ${language}.` : "",
      dosha ? `Seeker's Dosha: ${JSON.stringify(dosha)}.` : "",
      profile?.prakriti ? `Prakriti: ${profile.prakriti}.` : "",
    ].filter(Boolean).join("\n");

    // Build Gemini contents
    const contents = incomingMessages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: (m.content ?? "").trim() || " " }],
    }));

    const gemRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: 4000, temperature: 0.8 },
      }),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text().catch(() => "");
      console.error("[ayurveda-chat] Gemini error", gemRes.status, errText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "gemini_error", status: gemRes.status, detail: errText.slice(0, 300) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gemData = await gemRes.json();
    const text = gemData.candidates?.[0]?.content?.parts?.[0]?.text ?? "The transmission is momentarily veiled. Please try again.";

    // Stream as SSE — split into small chunks so the UI streams progressively
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const CHUNK = 60;
        for (let i = 0; i < text.length; i += CHUNK) {
          controller.enqueue(enc.encode(sseChunk(text.slice(i, i + CHUNK))));
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[ayurveda-chat] Unexpected", err);
    return new Response(
      JSON.stringify({ error: "Transmission interrupted", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
