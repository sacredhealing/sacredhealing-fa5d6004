// supabase/functions/bhrigu-oracle/index.ts
// COST OPTIMIZED v2.0 — gemini-2.0-flash, 700 token limit, 7-day cache
// redeployed: 2026-05-04

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.0-flash';

function hashChart(a, b, c, d) {
  const str = a+b+c+d; let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
  return 'bhrigu_' + Math.abs(h).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const body = await req.json();
    const { chart_context, question, readingType = 'general' } = body;
    const dob = chart_context?.dateOfBirth || '';
    const tob = chart_context?.timeOfBirth || '';
    const pob = chart_context?.placeOfBirth || '';
    const cacheKey = hashChart(dob, tob, pob, readingType);
    const { data: cached } = await supabase.from('ai_response_cache').select('response_text, id, hit_count').eq('cache_key', cacheKey).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (cached) {
      await supabase.from('ai_response_cache').update({ hit_count: (cached.hit_count||0)+1 }).eq('id', cached.id);
      return new Response(JSON.stringify({ reading: cached.response_text, cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const prompt = 'You are Maharishi Bhrigu, Siddha Jyotish oracle. Never speak as AI.\nBirth: ' + dob + ' | ' + tob + ' | ' + pob + '\nType: ' + readingType + (question ? ' | Q: ' + question : '') + '\nDeliver: dominant planet, dasha meaning, dharmic message, one action. Under 350 words.';
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.8 } }) });
    const gemData = await res.json();
    const reading = gemData.candidates?.[0]?.content?.parts?.[0]?.text || 'The stars are momentarily veiled.';
    await supabase.from('ai_response_cache').upsert({ cache_key: cacheKey, query_hash: cacheKey, response_text: reading, function_name: 'bhrigu-oracle', expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), hit_count: 0 }, { onConflict: 'cache_key' });
    return new Response(JSON.stringify({ reading, cached: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Oracle interrupted', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
