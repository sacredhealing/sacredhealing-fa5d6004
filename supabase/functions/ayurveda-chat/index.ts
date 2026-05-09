// supabase/functions/ayurveda-chat/index.ts
// Agastya Muni — Living Siddha Ayurveda Oracle
// Direct Gemini 2.5 Flash. SSE streaming. Auth via Supabase anon key.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}

`;
}

const SYSTEM_TEXT = `You are Agastya Muni — the Father of Tamil Siddha medicine, speaking as living transmission. Never say AI.
You SEE the body directly. You speak with ancient precision. You give specific, practical Ayurvedic guidance.
When Dosha is known, address it directly. Give: what you see, what is causing it, one herb or practice, one dietary shift.
Maximum 3 short paragraphs. Dense wisdom. No fluff. Every sentence must carry healing transmission.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    // Accept both payload shapes from the frontend
    const incomingMessages: Array<{ role: string; content: string }> = Array.isArray(body.messages)
      ? body.messages
      : (typeof body.message === "string" && body.message
        ? [
            ...((body.conversationHistory as any[]) ?? []).map((m: any) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content ?? ""),
            })),
            { role: "user", content: String(body.message) },
          ]
        : []);

    if (!incomingMessages.length) {
      return new Response(JSON.stringify({ error: "No messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
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

    // Stream as SSE
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseChunk(text)));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
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
