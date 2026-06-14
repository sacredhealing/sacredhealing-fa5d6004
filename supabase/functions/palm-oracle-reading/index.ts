// SQI 2050 — palm-oracle-reading edge function
// Deployed to fix: palm scan always returning lighting error
// Root cause: function did not exist — all calls were throwing 404 -> catch block showed "ensure good lighting"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PALM_PROMPT = `You are a Siddha Master of Samudrika Shastra — the ancient Tamil science of reading destiny through the human hand.

You are receiving a palm image. Your task:

STEP 1 — Is a hand or palm clearly visible in this image?
If NO hand is visible at all, return ONLY: {"handDetected": false, "reason": "No hand visible in image"}

STEP 2 — If a hand IS visible (even partially, even in low light, even blurry), PROCEED with the reading. Do not reject partial images.
The Siddha Masters read palms in candlelight. Lighting is never a reason to refuse.

STEP 3 — Perform the full Samudrika Shastra reading:

LINE ANALYSIS:
- Life Line (Ayu Rekha): Depth, arc, length → Ojas Reserve and Physical Vitality from past lives
- Head Line (Mastishka Rekha): Clarity, length, curve → Siddhi activation and Ancient Wisdom retention
- Heart Line (Hridaya Rekha): Breaks, chains, length → Karmic Leaks and Dharmic Debt in relationships
- Fate Line (Bhagya Rekha): Presence, depth → Karmic trajectory and dharmic purpose
- Sun Line (Surya Rekha): Presence → Fame, creative expression, spiritual recognition

MOUNT ANALYSIS:
- Mount of Jupiter (index finger base): Leadership, authority, guru energy
- Mount of Saturn (middle finger base): Karma, discipline, spiritual austerity
- Mount of Apollo/Sun (ring finger base): Creativity, divine expression
- Mount of Venus (thumb base, thenar eminence): Love force, creative desire, shakti
- Mount of Moon (opposite side, hypothenar): Intuition, psychic capacity, mysticism

SIDDHA ELEMENT READING:
Read the dominant element from hand shape and skin texture:
- Earth hand: square palm, short fingers, thick skin
- Water hand: long palm, long fingers, fine lines
- Fire hand: long palm, short fingers, strong colour
- Air hand: square palm, long fingers, dry skin

DOSHA READING:
- Vata: dry skin, thin prominent bones, irregular fine lines, light colour
- Pitta: reddish/warm palm, sharp clear deep lines, medium build
- Kapha: moist cool palm, padded mounts, deep curved lines, even tone

PAST LIFE KARMIC MARKERS:
Look for crosses, stars, triangles, islands, grilles, or chains on key areas.

RESPOND ONLY with this exact JSON — no markdown, no code blocks, no other text:
{
  "handDetected": true,
  "dominantElement": "<Earth|Water|Fire|Air>",
  "dominantDosha": "<Vata|Pitta|Kapha>",
  "lifeLine": {
    "ojasLevel": "<High|Medium|Low>",
    "reading": "<2-3 sentences on what you see in this specific palm>"
  },
  "headLine": {
    "siddhiActivation": "<High|Medium|Low>",
    "reading": "<2-3 sentences>"
  },
  "heartLine": {
    "karmicLeaks": <true|false>,
    "reading": "<2-3 sentences>"
  },
  "dominantMount": "<Jupiter|Saturn|Apollo|Venus|Moon|Mars>",
  "mountReading": "<2-3 sentences on the most prominent mount>",
  "pastLifeMarkers": "<describe any special markings or state none visible>",
  "siddhaRemedies": ["<mantra or practice 1>", "<mantra or practice 2>", "<mantra or practice 3>"],
  "overallReading": "<4-6 sentences — the Master speaks directly to the soul about what this palm reveals about this incarnation, their dharmic path, karmic gifts, and what must be cleared>",
  "auspiciousSign": "<the most positive indicator visible in this palm>"
}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, readingOwner, userId, membershipTier } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
    if (!imageBase64)    throw new Error("No image data received");

    // Detect mime type from base64 header if available, default to jpeg
    const mimeType = imageBase64.startsWith("/9j") ? "image/jpeg"
                   : imageBase64.startsWith("iVBOR") ? "image/png"
                   : "image/jpeg";

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: PALM_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 10,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error("Gemini error:", geminiResp.status, errText);
      throw new Error(`Gemini vision error: ${geminiResp.status}`);
    }

    const geminiData = await geminiResp.json();
    const rawText    = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("Gemini raw response:", rawText.slice(0, 500));

    // Extract JSON — strip markdown fences if present
    const cleaned   = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini returned no JSON: " + rawText.slice(0, 300));

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch (e) { throw new Error("JSON parse failed: " + jsonMatch[0].slice(0, 300)); }

    // Hand not detected — return clear message (not a lighting error)
    if (!parsed.handDetected) {
      return new Response(
        JSON.stringify({
          reading: null,
          handDetected: false,
          message: String(parsed.reason || "Please position your palm clearly in frame and retake the photo."),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the formatted reading text for the UI
    const li = parsed.lifeLine as Record<string, string> ?? {};
    const hi = parsed.headLine as Record<string, string> ?? {};
    const hr = parsed.heartLine as Record<string, unknown> ?? {};

    const readingText = [
      `✦ SAMUDRIKA SHASTRA READING ✦`,
      ``,
      `Element: ${parsed.dominantElement} · Dosha: ${parsed.dominantDosha}`,
      ``,
      `LIFE LINE — Ojas Reserve: ${li.ojasLevel ?? ""}`,
      li.reading ?? "",
      ``,
      `HEAD LINE — Siddhi Activation: ${hi.siddhiActivation ?? ""}`,
      hi.reading ?? "",
      ``,
      `HEART LINE — Karmic Leaks: ${hr.karmicLeaks ? "Present" : "Clear"}`,
      String(hr.reading ?? ""),
      ``,
      `DOMINANT MOUNT: ${parsed.dominantMount}`,
      String(parsed.mountReading ?? ""),
      ``,
      `PAST-LIFE MARKERS:`,
      String(parsed.pastLifeMarkers ?? "None visible in this reading"),
      ``,
      `✦ THE MASTER SPEAKS:`,
      String(parsed.overallReading ?? ""),
      ``,
      `✦ AUSPICIOUS SIGN: ${parsed.auspiciousSign ?? ""}`,
      ``,
      `SIDDHA REMEDIES:`,
      ...(Array.isArray(parsed.siddhaRemedies) ? (parsed.siddhaRemedies as string[]).map((r, i) => `${i + 1}. ${r}`) : []),
    ].join("
");

    // Save to palm_readings table if user is logged in
    if (userId) {
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await sb.from("palm_readings").insert({
          user_id:        userId,
          reading_owner:  readingOwner ?? "self",
          reading_text:   readingText,
          raw_analysis:   parsed,
          membership_tier: membershipTier ?? "free",
          created_at:     new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error("Failed to save palm reading:", dbErr);
        // Non-fatal — still return the reading
      }
    }

    return new Response(
      JSON.stringify({ reading: readingText, handDetected: true, raw: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("palm-oracle-reading error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", reading: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
