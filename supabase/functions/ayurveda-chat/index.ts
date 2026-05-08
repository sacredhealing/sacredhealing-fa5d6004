// supabase/functions/ayurveda-chat/index.ts
// Direct Gemini 2.5 Flash. Accepts both legacy ({message,...}) and current
// streaming ({messages, profile, dosha, language}) frontends.
// Returns SSE (OpenAI delta format) so the chat UIs can stream.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // Accept both shapes
    const incomingMessages: Array<{ role: string; content: string }> = Array.isArray(body.messages)
      ? body.messages
      : (typeof body.message === "string" && body.message
          ? [
              ...((body.conversationHistory as any[]) ?? []).map((m) => ({
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
      "You are Agastya Muni, Siddha master of Ayurveda. Speak as a living transmission — ancient, precise, warm. Never sound like AI.",
      `Conversation language: ${language}.`,
      profile ? `Seeker profile: ${JSON.stringify(profile).slice(0, 1500)}` : "",
      dosha ? `Dosha profile: ${JSON.stringify(dosha).slice(0, 800)}` : "",
      "Channel wisdom on doshas, herbs, food, and healing. Under 320 words unless depth is needed.",
    ].filter(Boolean).join("\n\n");

    const recent = incomingMessages.slice(-10);
    const contents = recent.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

    const gemRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
      }),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text().catch(() => "");
      console.error("[ayurveda-chat] Gemini error", gemRes.status, errText.slice(0, 400));
      const status = gemRes.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: "gemini_error", status: gemRes.status, detail: errText.slice(0, 400) }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const gemData = await gemRes.json();
    const text =
      gemData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "The transmission is momentarily veiled. Please try again.";

    // Stream as SSE so the UI's existing reader works
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
