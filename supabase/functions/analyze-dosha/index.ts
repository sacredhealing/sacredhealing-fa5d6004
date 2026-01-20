import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AyurvedaUserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
  currentChallenge: string;
  personalityTraits: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, action } = await req.json() as { 
      profile: AyurvedaUserProfile; 
      action: 'analyze' | 'daily-guidance';
    };
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (action === 'daily-guidance') {
      // Quick daily guidance
      const guidancePrompt = `You are a master Ayurvedic physician. Give a 2-sentence morning ritual blessing for someone in ${profile.location} currently facing: ${profile.currentChallenge}. Make it sound like a sacred blessing from an ancient tradition.`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: guidancePrompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get daily guidance");
      }

      const data = await response.json();
      const guidance = data.candidates?.[0]?.content?.parts?.[0]?.text || "May your path be clear and your heart light.";

      return new Response(JSON.stringify({ guidance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full Dosha Analysis
    const systemPrompt = `You are a master Ayurvedic physician and Vedic psychologist with 40+ years of experience. You specialize in constitutional analysis (Prakriti/Vikriti) and the intersection of physical doshas with mental constitution (Manas Prakriti: Sattva, Rajas, Tamas).

IMPORTANT: You MUST respond with valid JSON only, no markdown, no code blocks, just pure JSON.

Analyze the user's profile deeply and provide a comprehensive Ayurvedic assessment that bridges their physical constitution with their psychological and life situation.`;

    const userPrompt = `Analyze this person's Ayurvedic constitution:

Name: ${profile.name}
Birth Date: ${profile.birthDate}
Birth Time: ${profile.birthTime}
Current Location: ${profile.location}
Life Situation/Challenges: ${profile.currentChallenge}
Personality Traits: ${profile.personalityTraits}

You must return a structured analysis with this exact JSON format:
{
  "vata": number (0-100, percentage of Vata in constitution),
  "pitta": number (0-100, percentage of Pitta in constitution),
  "kapha": number (0-100, percentage of Kapha in constitution),
  "primary": "string - dominant dosha (e.g., 'Vata-Pitta', 'Kapha', 'Tridoshic')",
  "mentalConstitution": "string - Manas Prakriti analysis (Sattva/Rajas/Tamas balance)",
  "personalitySummary": "string - 2-3 sentences bridging their physical and mental traits",
  "lifeSituationAdvice": "string - specific healing path for their current challenges",
  "summary": "string - overall Prakriti summary in 2 sentences",
  "guidelines": {
    "diet": ["5 specific dietary recommendations for their dosha"],
    "lifestyle": ["5 specific lifestyle rituals"],
    "herbs": ["5 herbal/botanical recommendations with Sanskrit names"]
  }
}

Ensure vata + pitta + kapha = 100. Be specific and personalized based on their actual life situation.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
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
          maxOutputTokens: 2000,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to analyze dosha" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse the JSON response
    let doshaProfile;
    try {
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
      doshaProfile = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(JSON.stringify({ error: "Failed to parse analysis", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(doshaProfile), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Dosha analysis error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
