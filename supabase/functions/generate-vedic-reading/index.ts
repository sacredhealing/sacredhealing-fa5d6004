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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, timeOffset = 0 } = await req.json() as { user: UserProfile; timeOffset?: number };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const model = user.plan === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-3-flash-preview';
    
    // Capture current moment with optional time offset for time-travel feature
    const now = new Date();
    if (user.plan !== 'free' && timeOffset !== 0) {
      now.setMinutes(now.getMinutes() + timeOffset);
    }
    
    const currentDateStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const currentTimeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    
    const systemPrompt = `You are a fusion of two high-level personas:
1. A Grand Master of Vedic Astrology (Jyotish) with 40+ years of experience in natal, divisional, and transit charts.
2. A Google AI Product Specialist who knows every feature of Gemini, NotebookLM, AI Studio, and Google's workspace AI.

IMPORTANT: You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.

CURRENT COSMIC MOMENT: ${currentDateStr} at ${currentTimeStr} (${now.toISOString()})

Generate a profoundly deep Vedic reading including the HORA WATCH feature inspired by Dr. Pillai's AstroVed approach.

HORA WATCH REQUIREMENTS:
- Calculate the specific Planetary Hora (Hour) ruling this exact moment: ${currentTimeStr}
- Each Hora lasts approximately 1 hour and follows the Chaldean order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars
- Provide a SUCCESS RATING (0-100) based on how the ruling planet interacts with the user's natal chart
- Include 4 upcoming Horas for planning purposes
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate reading" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
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