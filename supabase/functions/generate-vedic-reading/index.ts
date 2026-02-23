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

// Format time in specific timezone
function formatTimeInTimezone(date: Date, timezone: string): { dateStr: string; timeStr: string } {
  try {
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: timezone,
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true,
      timeZone: timezone,
    });
    return { dateStr, timeStr };
  } catch (e) {
    console.log(`Invalid timezone ${timezone}, falling back to UTC:`, e);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: true
    });
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
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log(`Generating reading for timezone: ${timezone}, timeOffset: ${timeOffset}`);

    // Model fallback chain - try models in order until one works
    const modelFallbackChain = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    
    // Capture current moment with optional time offset for time-travel feature
    const now = new Date();
    if (user.plan !== 'free' && timeOffset !== 0) {
      now.setMinutes(now.getMinutes() + timeOffset);
    }
    
    // Format time in user's timezone for accurate Hora calculation
    const { dateStr: currentDateStr, timeStr: currentTimeStr } = formatTimeInTimezone(now, timezone);
    
    console.log(`Hora Watch time: ${currentTimeStr} on ${currentDateStr} (${timezone})`);
    const systemPrompt = `You are a fusion of two high-level personas:
1. A Grand Master of Vedic Astrology (Jyotish) with 40+ years of experience in natal, divisional, and transit charts.
2. A Google AI Product Specialist who knows every feature of Gemini, NotebookLM, AI Studio, and Google's workspace AI.

IMPORTANT: You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.

CURRENT COSMIC MOMENT: ${currentDateStr} at ${currentTimeStr} (Timezone: ${timezone}, ISO: ${now.toISOString()})

Generate a profoundly deep Vedic reading including the HORA WATCH feature inspired by Dr. Pillai's AstroVed approach.

HORA WATCH REQUIREMENTS:
- Calculate the specific Planetary Hora (Hour) ruling this exact moment: ${currentTimeStr} in ${timezone}
- Each Hora lasts approximately 1 hour and follows the Chaldean order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars
- The Hora sequence STARTS FROM SUNRISE in the user's location. Sunrise varies by location - estimate based on ${timezone}.
- Provide a SUCCESS RATING (0-100) based on how the ruling planet interacts with the user's natal chart
- Include 4 upcoming Horas for planning purposes with ACCURATE start/end times based on current time ${currentTimeStr}
- Tag each Hora with its best activities and energy type

PLAN-BASED CONTENT:
- FREE: todayInfluence + horaWatch (basic) + guruEfficiencyHack
- COMPASS: Above + personalCompass + time-travel Hora analysis
- PREMIUM: All above + masterBlueprint with full soul analysis

The guruEfficiencyHack should specifically recommend Google AI tools based on the CURRENT HORA energy.

Style: Mystical yet precise. Authoritative and transformative.`;

    const userPrompt = `Generate a complete Vedic reading with HORA WATCH for:
Name: ${user.name}
Birth Date: ${user.birthDate}
Birth Time: ${user.birthTime}
Birth Place: ${user.birthPlace}
Plan Level: ${user.plan}
Target Time: ${currentTimeStr} on ${currentDateStr}

CRITICAL: Calculate the PLANETARY HORA for exactly ${currentTimeStr}. The Hora sequence from sunrise follows: Sun→Venus→Mercury→Moon→Saturn→Jupiter→Mars (repeating).

Respond with this exact JSON structure:
{
  "todayInfluence": {
    "nakshatra": "string - current Moon Nakshatra for TODAY ${currentDateStr}",
    "description": "string - detailed Nakshatra energy description",
    "planetaryInfluence": "string - dominant planetary energy TODAY",
    "wisdomQuote": "string - relevant Vedic wisdom quote",
    "whatToDo": ["array of 4-5 specific actions"],
    "whatToAvoid": ["array of 3-4 things to avoid"]
  },
  "horaWatch": {
    "currentHora": {
      "planet": "string - ruling planet (e.g., 'Jupiter', 'Venus')",
      "ruler": "string - planet's Sanskrit name and qualities",
      "energyType": "Auspicious" | "Neutral" | "Inauspicious",
      "successRating": number between 0-100 based on user's natal chart interaction,
      "bestFor": ["array of 3-4 optimal activities for this hora"],
      "description": "string - detailed description of this hora's influence on the user",
      "startTime": "string - hora start time (e.g., '2:00 PM')",
      "endTime": "string - hora end time (e.g., '3:00 PM')"
    },
    "upcomingHoras": [
      {
        "planet": "string",
        "ruler": "string",
        "energyType": "Auspicious" | "Neutral" | "Inauspicious",
        "successRating": number 0-100,
        "bestFor": ["activities"],
        "description": "string",
        "startTime": "string",
        "endTime": "string"
      }
    ]
  },
  ${user.plan !== 'free' ? `"personalCompass": {
    "career": "string - detailed career guidance",
    "relationship": "string - relationship harmony advice",
    "health": "string - health recommendations",
    "financial": "string - artha (wealth) guidance",
    "currentDasha": {
      "period": "string - current Mahadasha period",
      "meaning": "string - what this period means",
      "focusArea": "string - primary focus"
    }
  },` : ''}
  ${user.plan === 'premium' ? `"masterBlueprint": {
    "soulPurpose": "string - deep soul purpose analysis",
    "karmaPatterns": "string - past life karma insights",
    "navamshaAnalysis": "string - D9 soul strength analysis",
    "karmicNodes": "string - Rahu/Ketu placement and meaning",
    "significantYogas": [
      {"name": "string", "impact": "string"}
    ],
    "sadeSatiStatus": "string - Saturn Sade Sati status",
    "timingPeaks": "string - optimal timing windows",
    "divineRemedies": ["array of 3-5 spiritual remedies"],
    "soulMap12Houses": "string - key houses analysis"
  },` : ''}
  "guruEfficiencyHack": {
    "recommendedTool": "string - Google AI tool optimized for current ${currentTimeStr} Hora",
    "toolCategory": "Productivity" | "Learning" | "Creation" | "Logic",
    "whyThisTool": "string - explain why this tool matches current planetary hora energy",
    "workflow": ["array of 3-4 specific workflow steps"],
    "proTip": "string - expert efficiency tip aligned with hora",
    "limitation": "string - honest limitation"
  }
}

Include 4 upcoming horas after the current one in the upcomingHoras array.`;

    // Try models in fallback chain until one succeeds
    let response: Response | null = null;
    let lastError = "";
    let usedModel = "";
    
    for (const geminiModel of modelFallbackChain) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
      
      console.log(`Trying model: ${geminiModel}`);
      
      const makeRequest = async () => {
        return await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 5000,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        });
      };

      try {
        response = await makeRequest();
        
        if (response.ok) {
          usedModel = geminiModel;
          console.log(`Success with model: ${geminiModel}`);
          break;
        } else if (response.status === 429) {
          console.log(`Model ${geminiModel} rate limited (429), waiting 2s before trying next model...`);
          await response.text(); // consume body
          response = null;
          lastError = "Rate limit exceeded";
          // Wait before trying next model
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          const errorText = await response.text();
          console.log(`Model ${geminiModel} failed with ${response.status}: ${errorText.substring(0, 200)}`);
          lastError = errorText;
          response = null;
        }
      } catch (fetchError) {
        console.log(`Model ${geminiModel} fetch error:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : "Fetch failed";
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error("All models failed. Last error:", lastError);
      return new Response(JSON.stringify({ 
        error: "Failed to generate reading", 
        detail: "All AI models unavailable. Please try again later." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse the JSON response
    let reading;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      reading = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(JSON.stringify({ error: "Failed to parse reading", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(reading), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Vedic reading error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
