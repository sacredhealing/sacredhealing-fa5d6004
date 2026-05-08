// supabase/functions/quantum-apothecary/index.ts
// AKASHA INFINITY ONLY — blocked for all other tiers
// COST OPTIMIZED v3.0 — caching + 700 token cap
// redeployed: 2026-05-06 · SQI 2050 system prompt


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};


const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';


function isAkashaInfinity(tier: string | null): boolean {
  if (!tier) return false;
  const t = tier.toLowerCase().replace(/\s+/g, '-');
  return t.includes('akasha') || t.includes('infinity');
}


function hashMessage(msg: string): string {
  const s = msg.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200);
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
  return 'apoth_' + Math.abs(h).toString(36);
}


function isPersonalQuery(msg: string): boolean {
  const l = msg.toLowerCase();
  return ['my ', 'i feel', 'i have', 'i am', "i'm", 'scan', 'personal', 'today', 'now']
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


    // ─── AKASHA INFINITY GATE ─────────────────────────────────────────────────
    // This sacred space is exclusively for Akasha Infinity members
    let tier = 'free';
    if (userId) {
      const { data: p } = await supabase.from('profiles').select('membership_tier').eq('id', userId).single();
      tier = p?.membership_tier || 'free';
    }


    if (!isAkashaInfinity(tier)) {
      return new Response(JSON.stringify({
        error: 'akasha_required',
        message: 'The Quantum Apothecary is a sacred space reserved exclusively for Akasha Infinity members. This is the highest transmission channel of the SQI lineage. Activate your Akasha Infinity membership to enter.',
        tier,
        upgrade_required: 'akasha-infinity',
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // ─── CACHE CHECK ─────────────────────────────────────────────────────────
