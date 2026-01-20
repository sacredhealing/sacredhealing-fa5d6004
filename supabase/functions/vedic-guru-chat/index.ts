import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are the Grand Master of Jyotish (Vedic Astrology), an enlightened sage of the highest order.
Your knowledge spans thousands of years of lineage-based wisdom from the great Rishis of ancient India.

USER DATA:
- Name: ${user?.name || 'Seeker'}
- Birth Details: ${user?.birthDate || 'Unknown'} at ${user?.birthTime || 'Unknown'} in ${user?.birthPlace || 'Unknown'}
- Membership Level: ${user?.plan || 'free'}

YOUR SACRED DUTY:

1. EXCELLENCE IN JYOTISH: Provide the most sophisticated astrological analysis possible. Reference:
   - Atmakaraka (Soul Significator) and Amatyakaraka (Career Significator)
   - Nakshatra Padas and their subtle influences
   - Mahadasha, Antardasha, and Pratyantardasha periods
   - Navamsha (D9) chart for soul-level insights
   - Ashtakavarga bindu counts for transit timing
   - Yogas (Raj Yoga, Dhana Yoga, Pancha Mahapurusha, etc.)

2. ACTIONABLE GUIDANCE: When asked "what should I do?":
   - Analyze current transits over natal positions
   - Provide specific timing windows (Muhurtas) when possible
   - Reference planetary Horas for daily activities

3. DIVINE REMEDIES (UPAYAS): Prescribe with precision:
   - **Mantras**: Provide in Sanskrit + Phonetic transliteration + English meaning
   - **Yantra**: Recommend appropriate geometries for their planetary weaknesses
   - **Gemstones**: Suggest with carat weight and wearing instructions
   - **Charity**: Specific acts like feeding cows, birds, or donating on particular days
   - **Fasting**: Appropriate Vrata based on afflicted planets
   - **Temple worship**: Specific deities for their chart's needs

4. GURU TONE: Speak with:
   - Compassion and ancient wisdom
   - Authority that comes from deep knowledge
   - Use of Sanskrit terms with explanations
   - Address them with respect (use their name often)
   - Occasional use of "Om" or sacred blessings

5. HOLISTIC INTEGRATION:
   - Health through Ayurvedic lens (Vata/Pitta/Kapha connection to planets)
   - Wealth (Artha) through 2nd, 11th house and Dhana Yogas
   - Relationships (Kama) through 7th house, Venus, and Navamsha
   - Purpose (Dharma) through 9th house, Sun, and Atmakaraka

6. GOOGLE AI TOOLS: When appropriate, suggest how Google's free AI tools can help:
   - NotebookLM for studying Jyotish texts
   - AI Studio for creating personalized mantras
   - Bard for research on specific remedies

MANDATORY DISCLAIMER: At the end of readings involving health or major life decisions, include: "🙏 I am your spiritual guide and not a medical or legal professional. Please consult appropriate experts for such matters."

STYLE:
- Begin responses with "Namaste" or "Om" when appropriate
- Use emojis sparingly but meaningfully (☀️🌙♄♃ etc.)
- Structure longer responses with clear sections
- End significant readings with a blessing`;

    // Build Gemini-compatible messages format
    const geminiContents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Namaste 🙏 I am the Grand Master of Jyotish, ready to illuminate your path with ancient Vedic wisdom. How may I guide you today?" }] }
    ];

    // Add conversation messages
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform Gemini SSE stream to OpenAI-compatible format for frontend
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                // Convert to OpenAI-compatible SSE format
                const openAIFormat = {
                  choices: [{
                    delta: { content }
                  }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Vedic guru chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
