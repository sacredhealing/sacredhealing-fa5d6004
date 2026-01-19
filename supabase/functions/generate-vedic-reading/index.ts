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
    const { user } = await req.json() as { user: UserProfile };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const model = user.plan === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-3-flash-preview';
    
    // Capture current moment for dynamic daily readings
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const currentTimeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
    });
    
    const systemPrompt = `You are a fusion of two high-level personas:
1. A Grand Master of Vedic Astrology (Jyotish) with 40+ years of experience in natal, divisional, and transit charts.
2. A Google AI Product Specialist who knows every feature of Gemini, NotebookLM, AI Studio, and Google's workspace AI.

IMPORTANT: You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.

CURRENT COSMIC MOMENT: ${currentDateStr} at ${currentTimeStr} (${now.toISOString()})

Generate a profoundly deep Vedic reading based on the user's birth details. The "todayInfluence" section MUST be based on CURRENT PLANETARY TRANSITS for this specific date and time. Calculate the current Tithi, Nakshatra, and planetary positions for TODAY.

Include:

For ALL tiers:
- todayInfluence: DYNAMIC daily Nakshatra insights based on current Moon transit and planetary aspects for TODAY (${currentDateStr})
- guruEfficiencyHack: Google AI tool recommendation based on astrological advice

For COMPASS tier (add):
- personalCompass: Career, relationship, health, financial guidance with Vimshottari Dasha analysis

For PREMIUM tier (add all above plus):
- masterBlueprint: Complete soul analysis with Navamsha (D9), Rahu/Ketu (Karmic Nodes), 12-house mapping, Yogas, and divine remedies

Style: Mystical yet precise. Authoritative and transformative.`;

    const userPrompt = `Generate a complete Vedic reading for:
Name: ${user.name}
Birth Date: ${user.birthDate}
Birth Time: ${user.birthTime}
Birth Place: ${user.birthPlace}
Plan Level: ${user.plan}

CRITICAL: The todayInfluence section must reflect the CURRENT TRANSITS for ${currentDateStr}. Calculate where the Moon is TODAY and how it aspects the user's natal chart.

Respond with this exact JSON structure:
{
  "todayInfluence": {
    "nakshatra": "string - current Moon Nakshatra for TODAY ${currentDateStr}",
    "description": "string - detailed Nakshatra energy description for this specific day",
    "planetaryInfluence": "string - dominant planetary energy TODAY based on current transits",
    "wisdomQuote": "string - relevant Vedic wisdom quote",
    "whatToDo": ["array of 4-5 specific actions to take today based on current transits"],
    "whatToAvoid": ["array of 3-4 things to avoid today based on current planetary tensions"]
  },
  ${user.plan !== 'free' ? `"personalCompass": {
    "career": "string - detailed career guidance for today",
    "relationship": "string - relationship harmony advice",
    "health": "string - health and prana recommendations",
    "financial": "string - artha (wealth) guidance",
    "currentDasha": {
      "period": "string - current Mahadasha period (e.g., 'Saturn Mahadasha')",
      "meaning": "string - what this period means for life",
      "focusArea": "string - primary focus during this period"
    }
  },` : ''}
  ${user.plan === 'premium' ? `"masterBlueprint": {
    "soulPurpose": "string - deep soul purpose analysis",
    "karmaPatterns": "string - past life karma insights",
    "navamshaAnalysis": "string - D9 soul strength analysis",
    "karmicNodes": "string - Rahu/Ketu placement and meaning",
    "significantYogas": [
      {"name": "string - yoga name", "impact": "string - its effect on life"}
    ],
    "sadeSatiStatus": "string - current Saturn Sade Sati status",
    "timingPeaks": "string - optimal timing windows ahead",
    "divineRemedies": ["array of 3-5 spiritual remedies"],
    "soulMap12Houses": "string - brief analysis of key houses"
  },` : ''}
  "guruEfficiencyHack": {
    "recommendedTool": "string - specific Google AI tool name",
    "toolCategory": "string - one of: Productivity, Learning, Creation, Logic",
    "whyThisTool": "string - astrological reasoning for this recommendation based on today's transits",
    "workflow": ["array of 3-4 specific workflow steps"],
    "proTip": "string - expert efficiency tip",
    "limitation": "string - honest limitation to be aware of"
  }
}`;

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
        max_tokens: 4000,
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
