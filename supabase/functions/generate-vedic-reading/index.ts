import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  plan: 'free' | 'compass' | 'premium';
}

interface RequestBody {
  user: UserProfile;
  timeOffset?: number;
  timezone?: string;
  timezoneOffsetMinutes?: number;
}

function formatTimeInTimezone(date: Date, timezone: string): { dateStr: string; timeStr: string } {
  try {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone,
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone,
    });
    return { dateStr, timeStr };
  } catch (e) {
    console.log(`Invalid timezone ${timezone}, falling back to UTC:`, e);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { dateStr, timeStr };
  }
}

// Only current, supported models — EOL models removed entirely.
// 2.5-flash is the primary (superior reasoning for astro calculations).
// 2.0-flash is the fallback (stable, fast, widely available).
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash'] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, timeOffset = 0, timezone = 'Europe/Stockholm' } = await req.json() as RequestBody;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const now = new Date();
    if (user.plan !== 'free' && timeOffset !== 0) {
      now.setMinutes(now.getMinutes() + timeOffset);
    }

    const { dateStr: currentDateStr, timeStr: currentTimeStr } = formatTimeInTimezone(now, timezone);

    const systemPrompt = `You are a Grand Master of Vedic Astrology (Jyotish) with 40+ years of experience.
IMPORTANT: You MUST respond with valid JSON only — no markdown, no code blocks, no commentary. Pure JSON.
CURRENT COSMIC MOMENT: ${currentDateStr} at ${currentTimeStr} (Timezone: ${timezone}, ISO: ${now.toISOString()})
Style: Mystical yet precise. Authoritative and transformative.`;

    // ── moonNakshatra is the single most important calculated field ──
    // It must be the Moon Nakshatra at BIRTH (not today).
    // It drives Vimshottari Dasha, all personalCompass fields, and the
    // entire soul-level transmission. Inaccuracy here breaks everything downstream.
    const moonNakshatraInstruction = `
CRITICAL CALCULATION — moonNakshatra (BIRTH):
  Using the exact birth data below, calculate the astronomical Moon Nakshatra
  at the MOMENT OF BIRTH — NOT today's Nakshatra.
  Birth: ${user.birthDate} ${user.birthTime} at ${user.birthPlace}

  Method:
    1. Calculate the Moon's sidereal longitude at that birth moment using Lahiri ayanamsa.
    2. Divide by 13°20' (800') to find which of the 27 Nakshatras the Moon occupied.
    3. Return ONLY the English name of that Nakshatra (e.g. "Anuradha", "Rohini", "Hasta").

  Validation rules:
    - Must be one of the 27 Nakshatras: Ashwini, Bharani, Krittika, Rohini, Mrigashira,
      Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta,
      Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha,
      Shravana, Dhanishtha, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, Revati.
    - Do NOT return "Unknown", null, or today's nakshatra.
    - Return the same value in BOTH personalCompass.moonNakshatra AND natalChart.moonNakshatra.`;

    const userPrompt = `Generate a complete Vedic reading with HORA WATCH for:
Name: ${user.name}
Birth Date: ${user.birthDate}
Birth Time: ${user.birthTime}
Birth Place: ${user.birthPlace}
Plan Level: ${user.plan}
Target Time: ${currentTimeStr} on ${currentDateStr}
${moonNakshatraInstruction}

Return this exact JSON structure (no extra keys, no markdown):
{
  "todayInfluence": {
    "nakshatra": "TODAY's Moon Nakshatra — ${currentDateStr} (NOT birth nakshatra)",
    "description": "string",
    "planetaryInfluence": "string",
    "wisdomQuote": "string",
    "whatToDo": ["4-5 specific actions"],
    "whatToAvoid": ["3-4 things to avoid"]
  },
  "horaWatch": {
    "currentHora": {
      "planet": "string",
      "ruler": "string",
      "energyType": "Auspicious" | "Neutral" | "Inauspicious",
      "successRating": 0-100,
      "bestFor": ["activities"],
      "description": "string",
      "startTime": "string",
      "endTime": "string"
    },
    "upcomingHoras": [
      {
        "planet": "string",
        "ruler": "string",
        "energyType": "Auspicious" | "Neutral" | "Inauspicious",
        "successRating": 0-100,
        "bestFor": ["activities"],
        "description": "string",
        "startTime": "string",
        "endTime": "string"
      }
    ]
  }${user.plan !== 'free' ? `,
  "personalCompass": {
    "moonNakshatra": "BIRTH Moon Nakshatra — Moon position at ${user.birthDate} ${user.birthTime} ${user.birthPlace} (Lahiri ayanamsa). One of the 27 Nakshatras by name only.",
    "career": "string — personalised based on moonNakshatra and birth chart",
    "relationship": "string",
    "health": "string",
    "financial": "string",
    "currentDasha": {
      "period": "string — current Vimshottari Mahadasha derived from moonNakshatra (e.g. Saturn Mahadasha)",
      "meaning": "string",
      "focusArea": "string"
    }
  },
  "natalChart": {
    "moonNakshatra": "SAME value as personalCompass.moonNakshatra — birth Moon Nakshatra",
    "moonSign": "string — Moon's sidereal zodiac sign at birth",
    "ascendant": "string — Lagna / Rising sign at birth"
  }` : ''}${user.plan === 'premium' ? `,
  "masterBlueprint": {
    "soulPurpose": "string",
    "karmaPatterns": "string",
    "navamshaAnalysis": "string",
    "karmicNodes": "string — Rahu/Ketu axis interpretation",
    "significantYogas": [{"name": "string", "impact": "string"}],
    "sadeSatiStatus": "string — current Saturn transit status",
    "timingPeaks": "string",
    "divineRemedies": ["string"],
    "soulMap12Houses": "string"
  }` : ''},
  "guruEfficiencyHack": {
    "recommendedTool": "string",
    "toolCategory": "Productivity" | "Learning" | "Creation" | "Logic",
    "whyThisTool": "string",
    "workflow": ["steps"],
    "proTip": "string",
    "limitation": "string"
  }
}

Include exactly 4 upcoming horas after the current one in upcomingHoras.`;

    let response: Response | null = null;
    let lastError = "";

    for (const model of MODEL_CHAIN) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const requestBody: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 6000,
          // Structured JSON output — disable safety truncation
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      };

      // gemini-2.5-flash supports thinking — give it budget for astro calculations
      if (model === 'gemini-2.5-flash') {
        (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
          thinkingBudget: 1024,
        };
      }

      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          console.log(`generate-vedic-reading: success with ${model}`);
          break;
        }

        if (response.status === 429) {
          await response.text();
          response = null;
          lastError = `${model}: rate limit`;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const errorText = await response.text();
        console.error(`generate-vedic-reading: ${model} failed (${response.status}):`, errorText);
        lastError = `${model}: ${errorText}`;
        response = null;
      } catch (fetchError) {
        lastError = `${model}: ${fetchError instanceof Error ? fetchError.message : "fetch failed"}`;
        console.error(`generate-vedic-reading fetch error (${model}):`, lastError);
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error("generate-vedic-reading: all models failed. Last error:", lastError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reading", detail: lastError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let reading;
    try {
      // Strip optional markdown fences (gemini-2.0-flash sometimes adds them
      // despite responseMimeType: "application/json")
      let clean = content.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```"))     clean = clean.slice(3);
      if (clean.endsWith("```"))       clean = clean.slice(0, -3);
      reading = JSON.parse(clean.trim());
    } catch (parseError) {
      console.error("generate-vedic-reading: JSON parse failed:", parseError, "\nRaw:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse reading", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(reading), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-vedic-reading: unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
