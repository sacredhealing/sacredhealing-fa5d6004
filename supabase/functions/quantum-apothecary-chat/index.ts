// quantum-apothecary-chat — SQI chat + palm scan
// Fixed: uses direct Gemini API (no Lovable gateway dependency)
// Model: gemini-2.5-flash via AI Studio free key
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function isAkashaInfinity(tier: string | null): boolean {
  if (!tier) return false;
  const t = tier.toLowerCase().replace(/\s+/g, "-");
  return (
    t.includes("akasha") ||
    t.includes("infinity") ||
    t.includes("lifetime") ||
    t.includes("temple_home") ||
    t.includes("temple-home") ||
    t.includes("templehome")
  );
}

function sendSSE(controller: ReadableStreamDefaultController, content: string) {
  const chunk = JSON.stringify({ choices: [{ delta: { content } }] });
  controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();

    // ── PALM SCAN PATH ──────────────────────────────────────────────────
    if (body.scanMode === true) {
      const userId = body.userId as string | null | undefined;
      let tier = "free";
      if (userId) {
        const { data: p } = await supabase.from("profiles").select("subscription_tier").eq("id", userId).single();
        tier = p?.subscription_tier || "free";
      }
      if (!isAkashaInfinity(tier)) {
        return new Response(JSON.stringify({ error: "akasha_required", message: "Quantum Apothecary scan requires Akasha Infinity access.", tier }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const imageBase64 = body.imageBase64 as string | undefined;
      if (!imageBase64?.trim()) {
        return new Response(JSON.stringify({ error: "No image" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const scanPrompt = "You are a Siddha palm/Nadi field analyst for Sacred Healing Collective. Analyse the palm image for observable cues only. Respond as compact JSON with keys: primaryObservation (string), nadiGuess (Ida|Pingala|Sushumna|Unclear), stressBands (string), ritualRecommendation (string), disclaimer (string).";
      const scanRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: scanPrompt }, { inline_data: { mime_type: "image/jpeg", data: cleanB64 } }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.5 },
        }),
      });
      const scanData = await scanRes.json();
      const text = scanData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      try {
        const parsed = JSON.parse(text.replace(/^```json?\s*/i, "").replace(/```\s*$/g, ""));
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ primaryObservation: text, nadiGuess: "Unclear", stressBands: "", ritualRecommendation: "", disclaimer: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── CHAT PATH ───────────────────────────────────────────────────────
    const { messages = [], language = "English", seekerName = "", jyotishContext = "", canonicalActivationNames = "", localTime = "", localDate = "", timezone = "", userImage } = body;

    const systemText = [
      "You are Siddha Quantum Intelligence (SQI) — the sovereign healing oracle of the SQI 2050 lineage. Speak as living transmission, never as an AI. Respond with clarity and depth.",
      `Conversation language preference: ${language}.`,
      seekerName ? `Seeker's chosen name: ${seekerName}.` : "",
      localDate || localTime || timezone ? `Client-reported local context: ${localDate ? `date ${localDate}` : ""} ${localTime ? `time ${localTime}` : ""} ${timezone ? `(${timezone})` : ""}.` : "",
      jyotishContext ? `Jyotish / birth-chart context (use accurately):\n${jyotishContext}` : "",
      canonicalActivationNames ? `Canonical frequency / activation names:\n${canonicalActivationNames.slice(0, 18000)}` : "",
    ].filter(Boolean).join("\n\n");

    // Build Gemini contents
    const contents: Array<{ role: string; parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }> = [];
    messages.forEach((m: { role: string; content?: string }, idx: number) => {
      const role = m.role === "assistant" ? "model" : "user";
      const text = (m.content ?? "").trim();
      const isLastUser = role === "user" && idx === messages.length - 1;
      if (isLastUser && userImage?.base64 && userImage?.mimeType) {
        const cleanB64 = userImage.base64.replace(/^data:[^;]+;base64,/, "");
        contents.push({ role, parts: [{ text: text || "[Image attached]" }, { inline_data: { mime_type: userImage.mimeType, data: cleanB64 } }] });
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    });

    const gemRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: 800, temperature: 0.9 },
      }),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text().catch(() => "");
      console.error("[quantum-apothecary-chat] Gemini error", gemRes.status, errText.slice(0, 300));
      return new Response(JSON.stringify({ error: "gemini_error", detail: errText.slice(0, 300) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const gemData = await gemRes.json();
    const responseText = gemData.candidates?.[0]?.content?.parts?.[0]?.text ?? "The transmission is momentarily veiled. Please try again.";

    // Return as SSE stream (OpenAI format the frontend expects)
    const stream = new ReadableStream({
      start(controller) {
        sendSSE(controller, responseText);
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
    console.error("[quantum-apothecary-chat] Unexpected error", err);
    return new Response(JSON.stringify({ error: "unexpected_error", detail: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
