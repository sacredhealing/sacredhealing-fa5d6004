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
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { user, timeOffset = 0, timezone = 'Europe/Stockholm' } = await req.json() as RequestBody;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    const modelFallbackChain = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    const now = new Date();
    if (user.plan !== 'free' && timeOffset !== 0) {
      now.setMinutes(now.getMinutes() + timeOffset);
    }
    const { dateStr: currentDateStr, timeStr: currentTimeStr } = formatTimeInTimezone(now, timezone);
    const systemPrompt = `You are a Grand Master of Vedic Astrology (Jyotish) with 40+ years of experience.
IMPORTANT: You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.
CURRENT COSMIC MOMENT: ${currentDateStr} at ${currentTimeStr} (Timezone: ${timezone}, ISO: ${now.toISOString()})
Style: Mystical yet precise. Authoritative and transformative.`;
    const userPrompt = `Generate a complete Vedic reading with HORA WATCH for:
Name: ${user.name}
Birth Date: ${user.birthDate}
Birth Time: ${user.birthTime}
Birth Place: ${user.birthPlace}
Plan Level: ${user.plan}
Target Time: ${currentTimeStr} on ${currentDateStr}
CRITICAL FIELD — moonNakshatra:
Calculate the Moon's Nakshatra at the EXACT MOMENT OF BIRTH (${user.birthDate} ${user.birthTime} ${user.birthPlace}).
This is NOT today's nakshatra. This is the nakshatra the Moon occupied at birth.
This field is used for Vimshottari Dasha calculation and MUST be astronomically accurate.
Return it in BOTH personalCompass.moonNakshatra and natalChart.moonNakshatra.
Examples of valid values: "Anuradha", "Rohini", "Hasta", "Chitra", "Ashwini" (just the name, no suffix).
Respond with this exact JSON structure:
{
  "todayInfluence": {
    "nakshatra": "string - current Moon Nakshatra for TODAY ${currentDateStr} (NOT birth nakshatra)",
    "description": "string",
    "planetaryInfluence": "string",
    "wisdomQuote": "string",
    "whatToDo": ["array of 4-5 actions"],
    "whatToAvoid": ["array of 3-4 things"]
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
  },
  ${user.plan !== 'free' ? `"personalCompass": {
    "moonNakshatra": "BIRTH Moon nakshatra — the nakshatra the Moon occupied at birth on ${user.birthDate} ${user.birthTime} ${user.birthPlace}. Just the name e.g. Anuradha",
    "career": "string",
    "relationship": "string",
    "health": "string",
    "financial": "string"
  },
  "natalChart": {
    "moonNakshatra": "BIRTH Moon nakshatra — same value as personalCompass.moonNakshatra",
    "moonSign": "string - Moon's zodiac sign at birth",
    "ascendant": "string - Rising sign at birth"
  },` : ''}
  ${user.plan === 'premium' ? `"masterBlueprint": {
    "soulPurpose": "string",
    "karmaPatterns": "string",
    "navamshaAnalysis": "string",
    "karmicNodes": "string",
    "significantYogas": [{"name": "string", "impact": "string"}],
    "sadeSatiStatus": "string",
    "timingPeaks": "string",
    "divineRemedies": ["string"],
    "soulMap12Houses": "string"
  },` : ''}
  "guruEfficiencyHack": {
    "recommendedTool": "string",
    "toolCategory": "Productivity" | "Learning" | "Creation" | "Logic",
    "whyThisTool": "string",
    "workflow": ["steps"],
    "proTip": "string",
    "limitation": "string"
  }
}
Include 4 upcoming horas after the current one in upcomingHoras.`;
    let response: Response | null = null;
    let lastError = "";
    for (const geminiModel of modelFallbackChain) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 5000 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        });
        if (response.ok) break;
        if (response.status === 429) {
          await response.text();
          response = null;
          lastError = "Rate limit exceeded";
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        const errorText = await response.text();
        lastError = errorText;
        response = null;
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Fetch failed";
        response = null;
      }
    }
    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to generate reading", detail: "All AI models unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let reading;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
      reading = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse reading", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify(reading), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vedic reading error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
