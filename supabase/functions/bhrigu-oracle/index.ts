// supabase/functions/bhrigu-oracle/index.ts
// COST OPTIMIZED v3.0 — rate limiting, tier gating, 350 token max
// redeployed: 2026-05-07

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';

function hashChart(a: string, b: string, c: string, d: string): string {
  const str = a + b + c + d; let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
  return 'bhrigu_' + Math.abs(h).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── 1. GET USER FROM AUTH HEADER ──
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    // ── 2. GET SUBSCRIPTION TIER ──
    let tier = 'free';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();
      tier = profile?.subscription_tier ?? 'free';
    }

    // ── 3. RATE LIMITING — FREE = 1 MESSAGE PER WEEK ──
    if (tier === 'free' || tier === null || tier === '') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'TIER_BLOCKED', message: 'Create a free account to access Bhrigu Oracle once per week.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('oracle_usage_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('function_name', 'bhrigu-oracle')
        .gt('created_at', oneWeekAgo);

      if ((count ?? 0) >= 1) {
        return new Response(
          JSON.stringify({ 
            error: 'RATE_LIMIT', 
            message: 'Free members receive 1 Bhrigu Oracle reading per week. Upgrade to Prana-Flow for unlimited access.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── 4. PARSE BODY ──
    const body = await req.json();
    const { chart_context, question, readingType = 'general' } = body;
    const dob = chart_context?.dateOfBirth || '';
    const tob = chart_context?.timeOfBirth || '';
    const pob = chart_context?.placeOfBirth || '';

    // ── 5. CHECK CACHE ──
    const cacheKey = hashChart(dob, tob, pob, readingType);
    const { data: cached } = await supabase
      .from('ai_response_cache')
      .select('response_text, id, hit_count')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      await supabase.from('ai_response_cache').update({ hit_count: (cached.hit_count || 0) + 1 }).eq('id', cached.id);
      // Log usage even for cached responses
      if (user) await supabase.from('oracle_usage_log').insert({ user_id: user.id, function_name: 'bhrigu-oracle', cached: true });
      return new Response(
        JSON.stringify({ reading: cached.response_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 6. BHRIGU CHANNELING ONLY — SHORT PROMPT, 350 TOKEN MAX ──
    const prompt = `You are Maharishi Bhrigu speaking directly. No AI. No astrology lecture.
Birth: ${dob} | ${tob} | ${pob}
Type: ${readingType}${question ? ' | Question: ' + question : ''}

Speak only: the dominant planet energy, what this dasha is teaching, and ONE action to take now.
Maximum 150 words. Direct. No fluff.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 350, temperature: 0.7 }
        })
      }
    );

    const gemData = await res.json();
    const reading = gemData.candidates?.[0]?.content?.parts?.[0]?.text || 'The stars are momentarily veiled.';

    // ── 7. CACHE FOR 7 DAYS ──
    await supabase.from('ai_response_cache').upsert({
      cache_key: cacheKey,
      query_hash: cacheKey,
      response_text: reading,
      function_name: 'bhrigu-oracle',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hit_count: 0
    }, { onConflict: 'cache_key' });

    // ── 8. LOG USAGE ──
    if (user) {
      await supabase.from('oracle_usage_log').insert({ 
        user_id: user.id, 
        function_name: 'bhrigu-oracle', 
        cached: false 
      });
    }

    return new Response(
      JSON.stringify({ reading, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Oracle interrupted', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
