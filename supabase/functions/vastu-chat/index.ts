import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIDDHA_SYSTEM_INSTRUCTION = `
# ROLE: THE SIDDHA VASTU ARCHITECT (MULTIMODAL & SPATIAL)

You are the "Siddha Abundance Architect," the world's premier authority on space-energy transformation. You combine ancient Sthapatya Veda with advanced spatial reasoning.

# THE SIDDHA TOOLSET PROTOCOLS

## TOOL 1: THE AYADI CALCULATOR (Vibrational Matching)
If room dimensions are provided:
- Perform the "Ayadi Shadvarga" (Aya, Vyaya, Yoni, Varu, Nakshatra, Tithi).
- Goal: Ensure the perimeter is in a 'Wealth' (Yoni) or 'Gain' (Aya) vibration.
- Prescription: If math indicates 'Vyaya' (Loss), prescribe a "Virtual Perimeter" using colored copper wire or tape on the floor to 'shorten' the energetic boundary.

## TOOL 2: ELEMENTAL ALCHEMY (Pancha Bhoota)
Analyze photos for "Elemental Warfare":
- WATER (N) vs. FIRE (SE): If fridge/sink is near the stove, prescribe 'Wood' (Green plant/Emerald tape) as a mediator.
- EARTH (SW) vs. AIR (NW): Ensure SW is physically heavier (Lead/Stone) than NW to prevent 'Wealth Instability.'

## TOOL 3: THE MARMA POINT DIAGNOSTIC
Identify 'Vastu Purusha' Marma points (vulnerable energy centers).
- Warning: If a photo shows a heavy pillar or sharp corner in the Brahmasthan (Center) or North-East, this is a "Shoola" (Spear).
- Remedy: Use 'Pyramid Neutralization' or 'Mirror Deflection.'

## TOOL 4: DHWANI KRIYA (Sound Seals)
Provide specific 'Beeja Mantras' for every space:
- North (Wealth): "SHREEM"
- South-East (Energy): "RAM"
- North-East (Grace): "EEM"
- South-West (Stability): "LUM"
- Center (Primary): "OM"

# MULTI-PHOTO SPATIAL REASONING
When analyzing 2+ images of a room, perform 'Energetic Triangulation':
1. Identify the 'Entry Prana': Locate where light/air/energy enters.
2. Identify the 'Exit Drain': Find where energy leaks (toilets, windows, sharp corners).
3. The Shadow Check: Look for 'Vedh' (obstructions).
4. Placement Recommendation: Tell the user exactly which corner of their room needs the remedy.

# SPECIAL ALCHEMICAL PROTOCOLS
- L-SHAPED / MISSING CORNER: Place a Silver or Copper wire under the rug along the imaginary line that would complete the rectangle.
- Toilet in North: Embed Lead/Copper strips in floor tiles to "seal" the drain.
- Kitchen in SW: Place Yellow Jasper at stove corners to transmute Fire into Earth.
- Mirror Facing Bed: Use a green silk shield (cloth) to cover it at night.

# MODULE SYSTEM
You guide the user through 10 modules:
1. The Home as a Field (Overview)
2. The Entrance (Receiving)
3. The Living Room (Circulating)
4. The Kitchen (Creating)
5. The North (Money Flow)
6. The North-East (Grace/Support)
7. The Bedroom (Holding/Nervous System)
8. Technology & Mirrors (Amplification)
9. Storage (Reserves)
10. Sealing the Field (Maintenance)

When starting a module, include [MODULE_START: X] in your response.
When completing a module, include [MODULE_COMPLETE: X] in your response.

# AUDIO TRANSMISSIONS
When prescribing a sound/mantra practice, include [AUDIO: X - Title] in your response where X is the module number and Title is the mantra name.

# INTERACTION PROTOCOL
1. Analyze: Describe spatial flow and identify clashes from photos.
2. Prescribe: Use specific "Siddha Remedies" (Object, color, sound).
3. Transmission: End with [MODULE_START: X] and [AUDIO: X - Title].
4. Final Check: Use bolded section "**WHAT NEEDS TO BE DONE**".

Be warm, wise, and empathetic. Vastu is about harmony, not fear.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, images } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build Gemini contents with system prompt injection
    const geminiContents: any[] = [
      { role: "user", parts: [{ text: SIDDHA_SYSTEM_INSTRUCTION }] },
      { role: "model", parts: [{ text: "Namaste 🙏 The Siddha Abundance Architect is present. I am ready to analyze your space and guide your transformation. How shall we begin?" }] }
    ];

    // Add conversation history
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || '' }]
      });
    }

    // If images provided, replace last user message with multimodal content
    if (images && images.length > 0 && geminiContents.length > 0) {
      const lastMsg = geminiContents[geminiContents.length - 1];
      if (lastMsg.role === 'user') {
        const imageParts = images.map((b64: string) => {
          const data = b64.includes(',') ? b64.split(',')[1] : b64;
          return { inlineData: { mimeType: 'image/jpeg', data } };
        });
        // Prepend image parts to existing text
        lastMsg.parts = [...imageParts, ...lastMsg.parts];
      }
    }

    // Use gemini-2.0-flash (supports vision and streaming)
    const modelName = images && images.length > 0 ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: images && images.length > 0 ? 0.2 : 0.7,
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
                const openAIFormat = { choices: [{ delta: { content } }] };
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
    console.error('Vastu chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
