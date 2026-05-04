// supabase/functions/akasha-codex-curator/index.ts
// COST OPTIMIZED v2.0 — Gemini 2.5 Flash, 300 token output limit, only NEW content
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
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { data: messages } = await supabase
      .from('apothecary_messages')
      .select('id, content, role')
      .eq('role', 'assistant')
      .is('curated', null)
      .order('created_at', { ascending: true })
      .limit(20);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: 'Nothing to curate. Cost: kr 0.00', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let processed = 0;
    for (const msg of messages) {
      if (!msg.content || msg.content.length < 80) {
        await supabase.from('apothecary_messages').update({ curated: true }).eq('id', msg.id);
        continue;
      }
      const prompt = 'Siddha Curator. Extract from: ' + msg.content.slice(0, 500) + '. JSON only: {chapter, subject, codex_entry (80 words max), portrait_insight (60 words max)}';
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.3 } }) });
      const gemData = await res.json();
      const text = gemData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed = { chapter: 'Akashic Records', subject: 'wisdom', codex_entry: '', portrait_insight: '' };
      try { parsed = JSON.parse(text.replace(/```[a-z]*/g, '').replace(/```/g, '').trim()); } catch(_) {}
      await supabase.from('apothecary_messages').update({ curated: true, chapter: parsed.chapter, subject: parsed.subject, codex_entry: parsed.codex_entry, portrait_insight: parsed.portrait_insight }).eq('id', msg.id);
      processed++;
      await new Promise(r => setTimeout(r, 500));
    }
    return new Response(JSON.stringify({ message: 'Curation complete', processed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Curator failed', details: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
