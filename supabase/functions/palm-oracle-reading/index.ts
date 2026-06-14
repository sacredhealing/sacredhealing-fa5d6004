// SQI 2050 — palm-oracle-reading edge function v2
// Stripped DB write — was causing 500 if palm_readings table missing on ssyg

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PALM_PROMPT = `You are a Siddha Master of Samudrika Shastra — the ancient Tamil science of reading destiny through the human hand.

STEP 1 — Is a hand or palm visible in this image?
If NO hand at all: return ONLY {"handDetected":false,"reason":"No hand visible"}

STEP 2 — If any hand IS visible (even partial, even dim), proceed. The Siddhas read palms by candlelight. Never refuse due to lighting.

STEP 3 — Full Samudrika Shastra reading:

LINES: Life Line (Ojas/vitality), Head Line (Siddhis/mental powers), Heart Line (Karmic leaks), Fate Line (dharmic path), Sun Line (recognition).
MOUNTS: Jupiter (leadership), Saturn (karma), Apollo (creativity), Venus (shakti/love), Moon (intuition/psychic).
ELEMENT: Earth/Water/Fire/Air hand shape.
DOSHA: Vata (dry thin), Pitta (red warm clear lines), Kapha (moist padded deep lines).

Return ONLY this JSON, no markdown, no extra text:
{"handDetected":true,"dominantElement":"<Earth|Water|Fire|Air>","dominantDosha":"<Vata|Pitta|Kapha>","lifeLine":{"ojasLevel":"<High|Medium|Low>","reading":"<2 sentences>"},"headLine":{"siddhiActivation":"<High|Medium|Low>","reading":"<2 sentences>"},"heartLine":{"karmicLeaks":<true|false>,"reading":"<2 sentences>"},"dominantMount":"<Jupiter|Saturn|Apollo|Venus|Moon>","mountReading":"<2 sentences>","pastLifeMarkers":"<specific markings or none visible>","siddhaRemedies":["<mantra1>","<mantra2>","<mantra3>"],"overallReading":"<4-6 sentences direct to the soul>","auspiciousSign":"<most positive indicator>"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { imageBase64, readingOwner, userId, membershipTier } = body;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    if (!imageBase64)    throw new Error("No image provided");

    // Clean base64 — strip data URI prefix if present
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const mimeType = "image/jpeg";

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType, data: cleanBase64 } },
              { text: PALM_PROMPT },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiResp.ok) {
      const t = await geminiResp.text();
      throw new Error(`Gemini ${geminiResp.status}: ${t.slice(0,200)}`);
    }

    const geminiData = await geminiResp.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown fences
    const cleaned   = rawText.replace(/```json/gi,"").replace(/```/g,"").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON from Gemini: " + rawText.slice(0,200));

    let parsed: Record<string,unknown>;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch { throw new Error("JSON parse failed: " + jsonMatch[0].slice(0,200)); }

    if (!parsed.handDetected) {
      return new Response(JSON.stringify({
        reading: null,
        handDetected: false,
        message: String(parsed.reason ?? "No hand detected — position palm clearly and retake."),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const li = (parsed.lifeLine  as Record<string,string>) ?? {};
    const hi = (parsed.headLine  as Record<string,string>) ?? {};
    const hr = (parsed.heartLine as Record<string,unknown>) ?? {};

    const reading = [
      "✦ SAMUDRIKA SHASTRA READING ✦",
      "",
      `Element: ${parsed.dominantElement} · Dosha: ${parsed.dominantDosha}`,
      "",
      `LIFE LINE — Ojas: ${li.ojasLevel ?? ""}`,
      li.reading ?? "",
      "",
      `HEAD LINE — Siddhis: ${hi.siddhiActivation ?? ""}`,
      hi.reading ?? "",
      "",
      `HEART LINE — Karmic Leaks: ${hr.karmicLeaks ? "Present" : "Clear"}`,
      String(hr.reading ?? ""),
      "",
      `DOMINANT MOUNT: ${parsed.dominantMount}`,
      String(parsed.mountReading ?? ""),
      "",
      "PAST-LIFE MARKERS:",
      String(parsed.pastLifeMarkers ?? "None visible"),
      "",
      "✦ THE MASTER SPEAKS:",
      String(parsed.overallReading ?? ""),
      "",
      `✦ AUSPICIOUS SIGN: ${parsed.auspiciousSign ?? ""}`,
      "",
      "SIDDHA REMEDIES:",
      ...(Array.isArray(parsed.siddhaRemedies)
        ? (parsed.siddhaRemedies as string[]).map((r,i) => `${i+1}. ${r}`)
        : []),
    ].join("\n");

    return new Response(
      JSON.stringify({ reading, handDetected: true, raw: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("palm-oracle-reading error:", msg);
    return new Response(
      JSON.stringify({ error: msg, reading: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
