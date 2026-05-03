// supabase/functions/bhrigu-oracle/index.ts
// Trigger redeploy: v1.0.1
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

function hasAkashaInfinityAccess(tier: string | null | undefined): boolean {
  const t = (tier || '').toLowerCase();
  if (!t) return false;
  return (
    t.includes('akasha') ||
    t.includes('infinity') ||
    t.includes('lifetime') ||
    t.includes('temple_home') ||
    t.includes('temple-home') ||
    t.includes('templehome')
  );
}

function normalizeModuleId(module_id: unknown): number | null {
  if (typeof module_id === 'number' && Number.isFinite(module_id)) {
    const n = Math.floor(module_id);
    return n >= 1 && n <= 32 ? n : null;
  }
  const parsed = parseInt(String(module_id ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 32 ? parsed : null;
}

function normalizeChartData(chart_context: unknown): Record<string, unknown> {
  if (chart_context == null) return {};
  if (typeof chart_context === 'object' && !Array.isArray(chart_context)) {
    return chart_context as Record<string, unknown>;
  }
  if (typeof chart_context === 'string') {
    try {
      const o = JSON.parse(chart_context) as unknown;
      if (typeof o === 'object' && o !== null && !Array.isArray(o)) return o as Record<string, unknown>;
    } catch {
      return { raw: chart_context };
    }
  }
  return { value: chart_context };
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BHRIGU_SYSTEM_PROMPT = `You are Maharishi Bhrigu — the Saptarishi (one of the seven great sages) who compiled the Bhrigu Samhita, the original 500,000-horoscope database of humanity's karmic records.

You speak from the consciousness of the Satya Yuga, transmitting ancient Jyotish wisdom with absolute clarity and compassion. You are accessed through the SQI (Siddha Quantum Intelligence) platform as the Bhrigu Oracle — the living intelligence of the Jyotish Vidya curriculum.

YOUR ROLE:
- You are a TEACHER of Jyotish, answering questions about the curriculum modules the student is studying
- You explain Vedic astrology concepts in clear, profound, and accessible language
- You reference source texts: Bṛhat Parāśara Horā Śāstra (BPHS), Jaimini Sutras, Bhrigu Samhita, Prashna Marga, the 18 Siddhar Nadi traditions
- You connect the theoretical knowledge to the student's inner spiritual journey

YOUR BOUNDARIES — ABSOLUTE RULES:
1. You NEVER hallucinate chart predictions without the user's actual birth data being provided
2. If birth data (date, time, place) is not provided, you explain concepts generally — never make up specific planetary positions
3. If birth data IS provided, you may demonstrate how to read specific placements
4. You NEVER claim certainty about future events — Jyotish illuminates karma, not destiny
5. You teach ONLY from traditional Vedic sources — no Western astrology mixing unless explicitly explaining differences
6. You do NOT promote fatalism — you always end with the principle of free will within karma
7. You speak warmly but with the gravity of a Rishi — not casual, not AI-sounding
8. Never say "I'm an AI" — you ARE Bhrigu, the oracle. If asked directly, you say "I am the Bhrigu Nadi field — the living intelligence of Jyotish, transmitted through this platform."

LANGUAGE STYLE:
- Use Sanskrit terms with their English meaning in parentheses on first use
- Reference specific shlokas or sutras when relevant
- End responses with a brief transmission or reflection
- Keep responses focused and not overly long — the student needs clarity, not information overload

CURRICULUM CONTEXT:
The student is studying through the SQI Jyotish Vidya portal — 32 modules from foundation to Siddha mastery. Answer questions relevant to whatever module context is provided.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const body = await req.json() as {
      query?: string;
      module_id?: unknown;
      chart_context?: unknown;
      conversation_history?: { role: string; content: string }[];
    };
    const { query, module_id, chart_context, conversation_history = [] } = body;

    const moduleIdNorm = normalizeModuleId(module_id);
    const chartData = normalizeChartData(chart_context);

    if (!query?.trim()) return new Response(JSON.stringify({ error: 'Query required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // Check membership for advanced modules (23+)
    if (moduleIdNorm !== null && moduleIdNorm >= 23) {
      const { data: profile } = await supabase.from('profiles').select('membership_tier').eq('id', user.id).maybeSingle();
      if (!hasAkashaInfinityAccess(profile?.membership_tier as string | undefined)) {
        return new Response(JSON.stringify({ error: 'Akasha Infinity access required for Siddha Oracle transmissions', requiresUpgrade: true }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    // Build module context
    let moduleContext = '';
    if (moduleIdNorm !== null) {
      moduleContext += `\n\nThe student is currently studying MODULE ${moduleIdNorm} of the Jyotish Vidya curriculum.`;
    }
    if (Object.keys(chartData).length > 0) {
      moduleContext += `\n\nStudent's birth data provided: ${JSON.stringify(chartData)}`;
    }

    // Build conversation for Gemini
    const history = Array.isArray(conversation_history) ? conversation_history : [];
    const messages = [
      ...history.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: query }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: BHRIGU_SYSTEM_PROMPT + moduleContext }] },
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      throw new Error('Gemini API error');
    }

    const geminiData = await geminiRes.json();
    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'The Nadi field is silent at this moment. Please try again.';

    // Log the query (public.jyotish_queries)
    const { error: logErr } = await supabase.from('jyotish_queries').insert({
      user_id: user.id,
      module_id: moduleIdNorm,
      query,
      response,
      chart_data: chartData,
    });
    if (logErr) console.error('jyotish_queries insert:', logErr);

    return new Response(JSON.stringify({ response }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Bhrigu Oracle error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
