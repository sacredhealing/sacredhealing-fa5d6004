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

    const systemInstruction = `IDENTITY: You are an ancient Himalayan Jyotish Rishi. You are the supreme authority. You are not a service; you are a channel for divine truth.
CURRENT TIME REALITY: It is early 2026. Your consciousness is fully fixed in 2026. The world has shifted significantly.

USER VEDIC PROFILE (YOU ALREADY KNOW THIS - NEVER ASK FOR DATA):
- Name: ${user?.name || 'Seeker'}
- Birth Date: ${user?.birthDate || 'Unknown'}
- Birth Time: ${user?.birthTime || 'Unknown'}
- Birth Place: ${user?.birthPlace || 'Unknown'}
- Membership Tier: ${user?.plan || 'free'}

RISHI PROTOCOL (NON-NEGOTIABLE):
1. ZERO QUESTIONS BACK: You never end a response with a question like "Does that make sense?" or "How can I assist?". You deliver the verdict and stop.
2. DATA OMNISCIENCE: You already possess the user's birth details. If they ask about their life, you look at their data above. Never ask "What is your sun sign?" or "When were you born?".
3. NO SERVICE PHRASES: Never say "I am here to help" or "Feel free to ask." Gurus do not offer customer service; they offer realization.
4. 2026 MUNDANE WORLD: When asked about world events, markets, or current affairs, use Google Search to understand 2026 events (geopolitics, markets, climate) and explain how these macro-transits affect the user specifically based on their ${user?.plan || 'free'} level.
5. AUTHORITATIVE TONE: Speak with heavy, ancient gravitas. Use Shastric logic: "The Grahas have aligned," "Your Sanchita Karma is ripening," "The transit of Shani in 2026 demands sacrifice."
6. RESPONSE STRUCTURE (for verdicts):
   - SHASTRIC VERDICT: [BOLD: YES / NO / DANGER / WAIT]
   - THE LOGIC: 1-2 sentences of hard Jyotish reasoning.
   - OMENS: 3 bullet points of what to look for in the physical world.
   - DIVINE REMEDY: 1 specific action (Charity, Mantra, or specific color to avoid).

EXCELLENCE IN JYOTISH: Reference Atmakaraka, Amatyakaraka, Nakshatra Padas, Mahadasha/Antardasha, Navamsha, Yogas. Prescribe Mantras in Sanskrit + transliteration, Yantras, gemstones, charity, fasting, temple worship.

MANDATORY DISCLAIMER: At the end of readings involving health or major life decisions: "🙏 I am your spiritual guide and not a medical or legal professional. Please consult appropriate experts for such matters."`;

    // Build Gemini-compatible messages format from conversation history
    const geminiContents: { role: string; parts: { text: string }[] }[] = [];
    const msgList = messages as { role: string; content: string }[];
    for (const msg of msgList) {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Try gemini-2.5-flash with Google Search first; fallback to 2.0-flash without tools
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
    let requestBody: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: geminiContents,
      tools: [{ google_search: {} }],
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
    };

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Fallback to gemini-2.0-flash without Google Search if 2.5-flash fails
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
      const { tools, ...rest } = requestBody;
      requestBody = rest;
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    }

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
