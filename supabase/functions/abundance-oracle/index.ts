// Abundance Oracle — structured JSON guidance combining Jyotish + Ayurveda
// Uses Lovable AI Gateway (no API key required from user).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function hash(...parts: string[]): string {
  const str = parts.join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return "abund_" + Math.abs(h).toString(36);
}

interface AbundancePayload {
  birth_date?: string; birth_time?: string; birth_place?: string;
  moon_nakshatra?: string; current_dasha?: string;
  dosha?: string; vata?: number; pitta?: number; kapha?: number;
}

const SCHEMA = {
  type: "object",
  properties: {
    timing: { type: "string", description: "Current planetary timing window for wealth, 1-2 sentences." },
    investment_guidance: { type: "string", description: "Overall investment posture given the chart, 1-2 sentences." },
    quick_invest: { type: "string", description: "What kinds of quick / short-term plays suit this chart now." },
    long_term_invest: { type: "string", description: "Long-term wealth vehicles aligned with this chart and dosha." },
    do_not_invest: { type: "string", description: "When this person should sit out and not invest at all, with reason." },
    avoid: { type: "string", description: "Specific sectors / behaviours to avoid this period." },
    favorable_sectors: { type: "array", items: { type: "string" }, description: "5-8 sectors aligned with current dasha + nakshatra." },
    mantra: { type: "string", description: "Single Sanskrit activation mantra for wealth, with transliteration." },
    dosha_practice: { type: "string", description: "One concrete daily wealth practice tuned to their dosha." },
    affiliate_fit: {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["strongly_yes", "yes", "neutral", "not_now", "no"] },
        reason: { type: "string", description: "Why their chart + dosha favours/blocks affiliate work." },
        how: { type: "array", items: { type: "string" }, description: "3-5 concrete steps tailored to their constitution and current dasha." }
      },
      required: ["verdict", "reason", "how"]
    }
  },
  required: ["timing","investment_guidance","quick_invest","long_term_invest","do_not_invest","avoid","favorable_sectors","mantra","dosha_practice","affiliate_fit"]
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as AbundancePayload;
    const {
      birth_date = "", birth_time = "", birth_place = "",
      moon_nakshatra = "", current_dasha = "",
      dosha = "", vata = 0, pitta = 0, kapha = 0,
    } = body;

    if (!birth_date && !dosha && !moon_nakshatra) {
      return new Response(JSON.stringify({ error: "missing_context" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const cacheKey = hash(birth_date, birth_time, birth_place, moon_nakshatra, current_dasha, dosha, String(vata), String(pitta), String(kapha));

    const { data: cached } = await supabase
      .from("ai_response_cache")
      .select("response_text, id, hit_count")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (cached?.response_text) {
      try {
        const parsed = JSON.parse(cached.response_text);
        await supabase.from("ai_response_cache").update({ hit_count: (cached.hit_count || 0) + 1 }).eq("id", cached.id);
        return new Response(JSON.stringify({ ...parsed, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch { /* fallthrough */ }
    }

    const systemPrompt = `You are Maharishi Bhrigu giving precise wealth guidance.
You combine Vedic Jyotish (nakshatra, mahadasha) with Ayurveda (dosha balance) to give grounded, practical financial guidance.
Speak directly, no AI disclaimers, no hedging. Every field must be specific to THIS chart.`;

    const userPrompt = `Birth: ${birth_date} ${birth_time} ${birth_place}
Moon Nakshatra: ${moon_nakshatra || "unknown"}
Current Mahadasha: ${current_dasha || "unknown"}
Dosha: ${dosha || "unknown"} (Vata ${vata}% / Pitta ${pitta}% / Kapha ${kapha}%)

Give structured wealth + investment + affiliate guidance for this person right now.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: { name: "emit_abundance_reading", description: "Emit the structured abundance reading", parameters: SCHEMA },
        }],
        tool_choice: { type: "function", function: { name: "emit_abundance_reading" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("[abundance-oracle] AI error", aiRes.status, errText.slice(0, 400));
      return new Response(JSON.stringify({ error: "ai_error", status: aiRes.status, detail: errText.slice(0, 400) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      console.error("[abundance-oracle] empty tool call", JSON.stringify(data).slice(0, 400));
      return new Response(JSON.stringify({ error: "empty_response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const parsed = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;

    await supabase.from("ai_response_cache").upsert({
      cache_key: cacheKey,
      query_hash: cacheKey,
      response_text: JSON.stringify(parsed),
      function_name: "abundance-oracle",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hit_count: 0,
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify({ ...parsed, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[abundance-oracle] Unexpected", err);
    return new Response(JSON.stringify({ error: "oracle_failed", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
