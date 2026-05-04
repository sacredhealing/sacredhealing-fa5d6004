// supabase/functions/ayurveda-chat/index.ts
// COST OPTIMIZED v3.0 — Tier limits + caching + 600 token cap
// redeployed: 2026-05-04
// FREE: 3/day | PRANA-FLOW: 30/day | SIDDHA-QUANTUM+: unlimited

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

const DAILY_LIMITS: Record<string, number> = {
  'akasha-infinity': 99999,
  'akasha_infinity': 99999,
  'siddha-quantum': 99999,
  'siddha_quantum': 99999,
  'prana-flow': 30,
  'prana_flow': 30,
  'free': 3,
};

function getTierLimit(tier: string | null): number {
  if (!tier) return 3;
  return DAILY_LIMITS[tier.toLowerCase().replace(/\s+/g, '-')] ?? 3;
}

function hashMessage(msg: string): string {
  const s = msg.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200);
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
  return 'ayur_' + Math.abs(h).toString(36);
}

function isPersonalQuery(msg: string): boolean {
  const l = msg.toLowerCase();
  return ['my ', 'i feel', 'i have', 'i am', "i'm", 'scan', 'personal', 'today', 'right now']
    .some(w => l.includes(w));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { message, userId, conversationHistory = [] } = await req.json();

    if (!message) return new Response(JSON.stringify({ error: 'No message' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    // ─── GET TIER ────────────────────────────────────────────────────────────
    let tier = 'free';
    if (userId) {
      const { data: p } = await supabase.from('profiles').select('membership_tier').eq('id', userId).single();
      tier = p?.membership_tier || 'free';
    }

    const limit = getTierLimit(tier);
    const unlimited = limit >= 99999;

    // ─── RATE LIMIT ──────────────────────────────────────────────────────────
    if (!unlimited && userId) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase.from('ai_usage_limits')
        .select('call_count').eq('user_id', userId).eq('function_name', 'ayurveda-chat').eq('date', today).maybeSingle();

      const count = usage?.call_count || 0;
      if (count >= limit) {
        return new Response(JSON.stringify({
          error: 'daily_limit_reached',
          message: tier === 'free'
            ? `You have used your ${limit} free Ayurvedic transmissions today. Upgrade to Prana-Flow for 30/day or Siddha-Quantum for unlimited access.`
            : `You have used your ${limit} daily transmissions. Upgrade to Siddha-Quantum for unlimited Ayurvedic guidance.`,
          tier, limit, used: count,
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('ai_usage_limits').upsert(
        { user_id: userId, function_name: 'ayurveda-chat', date: today, call_count: count + 1 },
        { onConflict: 'user_id,function_name,date' }
      );
    }

    // ─── CACHE CHECK ─────────────────────────────────────────────────────────
    const cacheable = !isPersonalQuery(message);
    if (cacheable) {
      const key = hashMessage(message);
      const { data: cached } = await supabase.from('ai_response_cache')
        .select('response_text, id, hit_count').eq('cache_key', key)
        .gt('expires_at', new Date().toISOString()).maybeSingle();

      if (cached) {
        await supabase.from('ai_response_cache').update({ hit_count: (cached.hit_count || 0) + 1 }).eq('id', cached.id);
        return new Response(JSON.stringify({ response: cached.response_text, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ─── GEMINI CALL — max 6 history messages to save tokens ─────────────────
    const history = conversationHistory.slice(-6).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          systemInstruction: {
            parts: [{ text: 'You are Agastya Muni, Siddha master of Ayurveda. Speak as a living transmission — ancient, precise, warm. Never sound like AI. Channel wisdom on doshas, herbs, food, and healing. Under 280 words unless depth is needed.' }]
          },
          generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
        }),
      }
    );

    const gemData = await res.json();
    const response = gemData.candidates?.[0]?.content?.parts?.[0]?.text || 'The transmission is momentarily veiled.';

    // ─── SAVE TO CACHE ────────────────────────────────────────────────────────
    if (cacheable) {
      const key = hashMessage(message);
      await supabase.from('ai_response_cache').upsert({
        cache_key: key, query_hash: key, response_text: response,
        function_name: 'ayurveda-chat',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hit_count: 0,
      }, { onConflict: 'cache_key' });
    }

    return new Response(JSON.stringify({ response, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Transmission interrupted', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
