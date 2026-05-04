// supabase/functions/akasha-codex-backfill/index.ts
// COST OPTIMIZED v2.0 — Gemini 2.5 Flash kept, but ONLY embeds NEW content
// Strict batch limit of 30 per run. redeployed: 2026-05-04

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function getEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 2000); // truncate to reduce token cost
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=' + GEMINI_API_KEY,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text: truncated }] } }) }
  );
  const data = await res.json();
  return data.embedding?.values || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    // COST GUARD: Only fetch rows that have NOT been embedded yet
    const { data: items } = await supabase
      .from('apothecary_messages')
      .select('id, content')
      .is('embedding', null)
      .order('created_at', { ascending: true })
      .limit(30); // max 30 per cron run — controls cost

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'No new content to embed. Cost: kr 0.00', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let processed = 0;
    for (const item of items) {
      if (!item.content || item.content.length < 50) { processed++; continue; }
      const embedding = await getEmbedding(item.content);
      if (embedding.length > 0) {
        await supabase.from('apothecary_messages').update({ embedding }).eq('id', item.id);
        processed++;
      }
      await new Promise(r => setTimeout(r, 500)); // rate limit delay
    }

    return new Response(JSON.stringify({ message: 'Backfill complete', processed, model: 'gemini-embedding-001' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backfill failed', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
