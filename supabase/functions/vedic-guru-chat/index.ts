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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limits reached. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
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
