import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  NADI SCAN — DEDICATED EDGE FUNCTION                           ║
// ║                                                                  ║
// ║  This is SEPARATE from the SQI chat function.                  ║
// ║  NO SQI personality. NO memory injection. NO system prompt.    ║
// ║  Pure Gemini Vision → honest palm reading → JSON numbers.      ║
// ║                                                                  ║
// ║  Once scanned, results are saved to nadi_baselines table.      ║
// ║  The user's baseline does NOT change unless they rescan.       ║
// ║  The SQI reads FROM this baseline in every chat response.      ║
// ╚══════════════════════════════════════════════════════════════════╝

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, imageMimeType, userId, planetaryAlign, herbOfToday } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    if (!imageBase64)    throw new Error("No image provided");

    // ══════════════════════════════════════════════════════════════
    // THE SCAN PROMPT — pure vision, no SQI personality
    // Gemini reads the actual palm honestly and returns JSON.
    // ══════════════════════════════════════════════════════════════
    const prompt = `You are a Siddha biofield vision analyser. Your ONLY job is to analyse this palm image and return a precise JSON reading.

SIDDHA NADI SCIENCE:
The human biofield has two channel systems:
- GROSS NADIS: 72,000 main energy channels. Range: 0–72,000 active.
- SUBTLE SUB-NADIS: 350,000 fine branches. Range: 0–350,000 active.

Healthy spiritual practitioner: 60,000–71,000 gross, 200,000–300,000 subtle.
Stressed or blocked: 8,000–30,000 gross, 30,000–100,000 subtle.
Severely depleted: 2,000–8,000 gross, 5,000–30,000 subtle.

STEP 1 — Is there a visible palm or hand in the image?
If NO hand visible → return ONLY: {"handDetected":false}

STEP 2 — Read the palm HONESTLY. Base your numbers on what you actually observe:

GROSS NADI INDICATORS (examine carefully):
- Line depth and clarity: deep clear lines = high activity (65,000–71,000)
- Skin tone: warm pink/rosy = energised (60,000+), pale/grey = depleted (<20,000)  
- Vein visibility: visible healthy veins = good flow
- Skin texture: firm and supple = active, dry/papery = restricted
- Palm colour uniformity: even warm tone = balanced, patchy/mottled = blocked

SUB-NADI INDICATORS (examine micro-texture):
- Fine skin texture lines: dense fine lines = more sub-Nadis active
- Capillary flush: visible micro-circulation = high sub-Nadi activity
- Moisture and suppleness: moist = sub-Nadis flowing, dry = restricted

DOSHA READING FROM PALM:
- Vata: dry, thin, prominent bones, light colour, irregular lines
- Pitta: reddish/pinkish, medium build, sharp clear lines, warm
- Kapha: moist, full/padded, deep clear lines, cool, even tone

IMPORTANT RULES:
- Do NOT default to high numbers just to seem positive
- Do NOT give the same numbers as a previous reading — read THIS specific image
- A slightly different lighting or angle genuinely changes the reading
- Be precise and specific to what you observe in THIS image

Today planetary alignment: ${planetaryAlign || "Not specified"}
Today herb: ${herbOfToday || "Not specified"}

RESPOND ONLY with this exact JSON — no other text, no markdown, no explanation:
{
  "handDetected": true,
  "activeNadis": <integer 0-72000>,
  "activeSubNadis": <integer 0-350000>,
  "blockagePercentage": <integer 0-100>,
  "dominantDosha": "<Vata|Pitta|Kapha>",
  "primaryBlockage": "<specific Nadi name, e.g. Heart/Anahata Nadi>",
  "planetaryAlignment": "<planet>",
  "herbOfToday": "<herb>",
  "remedies": ["<name1>","<name2>","<name3>","<name4>","<name5>"],
  "bioReading": "<3-4 sentences describing exactly what you see in this specific palm — skin tone, line depth, colour, texture — and what it means for this person's biofield right now>"
}`;

    // ── Call Gemini Vision directly — NO system prompt, NO SQI personality ──
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inline_data: { mime_type: imageMimeType || "image/jpeg", data: imageBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            temperature: 0.1,   // LOW temperature = consistent, precise output
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 512,
          },
          // No safetySettings overrides needed — this is pure data analysis
        }),
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error("Gemini vision error:", geminiResp.status, errText);
      throw new Error(`Gemini error: ${geminiResp.status}`);
    }

    const geminiData = await geminiResp.json();
    const rawText    = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Gemini response: " + rawText.slice(0, 200));

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch { throw new Error("Invalid JSON from Gemini: " + jsonMatch[0].slice(0, 200)); }

    // No hand detected
    if (!parsed.handDetected) {
      return new Response(JSON.stringify({ handDetected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Validate and clamp values ──
    const result = {
      handDetected:     true,
      activeNadis:      Math.max(0, Math.min(72000,  Math.round(Number(parsed.activeNadis)      || 0))),
      activeSubNadis:   Math.max(0, Math.min(350000, Math.round(Number(parsed.activeSubNadis)   || 0))),
      blockagePercentage: Math.max(0, Math.min(100,  Math.round(Number(parsed.blockagePercentage) || 0))),
      dominantDosha:    String(parsed.dominantDosha    || "Vata"),
      primaryBlockage:  String(parsed.primaryBlockage  || "Heart/Anahata Nadi"),
      planetaryAlignment: String(parsed.planetaryAlignment || planetaryAlign || ""),
      herbOfToday:      String(parsed.herbOfToday       || herbOfToday      || ""),
      remedies:         Array.isArray(parsed.remedies) ? (parsed.remedies as string[]).slice(0, 5) : [],
      bioReading:       String(parsed.bioReading        || ""),
      scannedAt:        new Date().toISOString(),
    };

    // ── Save to nadi_baselines table (upsert — one record per user) ──
    if (userId) {
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await sb.from("nadi_baselines").upsert(
          {
            user_id:         userId,
            active_nadis:    result.activeNadis,
            active_sub_nadis: result.activeSubNadis,
            blockage_pct:    result.blockagePercentage,
            dominant_dosha:  result.dominantDosha,
            primary_blockage: result.primaryBlockage,
            planetary_align: result.planetaryAlignment,
            herb_of_today:   result.herbOfToday,
            bio_reading:     result.bioReading,
            remedies:        result.remedies,
            scanned_at:      result.scannedAt,
            updated_at:      result.scannedAt,
          },
          { onConflict: "user_id" }
        );
      } catch (dbErr) {
        // Log but don't fail the response — scan result is still returned
        console.error("Failed to save nadi baseline:", dbErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("nadi-scan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
