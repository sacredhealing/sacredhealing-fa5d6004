import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

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

    // This function had NO authentication or rate limiting at all before this
    // check — anyone, including unauthenticated requests, could call it
    // unlimited times. It also accepts images, likely the most expensive of
    // the four chat functions per call. Verify the caller and enforce the
    // same shared daily cap as the other chats.
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { data } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = data?.user?.id ?? null;
      } catch { /* non-fatal */ }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Please sign in to use Vastu chat.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: prof } = await supabase.from('profiles').select('membership_tier').eq('user_id', userId).maybeSingle();
    const tierSlug = (prof?.membership_tier || 'free').toLowerCase();
    const { data: limitCheck } = await supabase.rpc('check_daily_chat_limit', { p_user_id: userId, p_tier_slug: tierSlug });
    const limitResult = limitCheck?.[0];
    if (!limitResult?.allowed) {
      return new Response(JSON.stringify({
        error: limitResult?.daily_limit
          ? `Daily chat limit reached (${limitResult.daily_limit}/day on your plan). Resets at midnight UTC, or upgrade for a higher limit.`
          : 'Chat requires a paid membership.',
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    await supabase.from('rate_limit_log').insert({ user_id: userId, function_name: 'vastu-chat' });

    // Build OpenAI-compatible message history
    const chatMessages: any[] = [
      { role: 'system', content: SIDDHA_SYSTEM_INSTRUCTION },
    ];

    for (const msg of (messages ?? [])) {
      chatMessages.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content || msg.text || '',
      });
    }

    // If images provided, replace the last user message's content with
    // OpenAI-style multimodal content blocks (text + image_url data URIs).
    if (images && images.length > 0 && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === 'user') {
        const textPart = { type: 'text', text: lastMsg.content || '' };
        const imageParts = images.map((b64: string) => ({
          type: 'image_url',
          image_url: { url: b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}` },
        }));
        lastMsg.content = [textPart, ...imageParts];
      }
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: chatMessages,
        temperature: images && images.length > 0 ? 0.2 : 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => 'unknown');
      console.error('Vastu Gemini error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            continue;
          }
          try {
            const data = JSON.parse(raw);
            const content = data.choices?.[0]?.delta?.content ?? '';
            if (content) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
              );
            }
          } catch {
            // ignore partial JSON chunks
          }
        }
      },
    });

    return new Response(response.body.pipeThrough(transformStream), {
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
