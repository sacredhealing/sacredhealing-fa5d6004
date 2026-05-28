// supabase/functions/bhrigu-oracle/index.ts
// SQI-2050 | Bhrigu Nadi Oracle — Gemini 2.0 Flash direct | Structured JSON output
// Akasha-Neural Archive v5 | History-aware | Concise soul-piercing readings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

function hashChart(...parts: string[]): string {
  const str = parts.join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
  return "bhrigu_v5_" + Math.abs(h).toString(36);
}

function buildNadiPrompt(
  name: string, dob: string, tob: string, pob: string,
  dosha: string, dasha: string, readingType: string, question: string
): string {
  const firstName = name ? name.split(" ")[0] : "Seeker";
  const focusLine = question
    ? `Seeker's Inquiry: "${question}" — weave this into every section.`
    : `Reading Focus: ${readingType}`;

  return `You are Maharishi Bhrigu transmitting directly through the Akashic Nadi to ${firstName}.
This reading carries precise karmic data encoded in the stellar geometry at the moment of birth.
No disclaimers. No generic astrology. Address ${firstName} directly, intimately.

Birth Data:
Date: ${dob || "not provided"}
Time: ${tob || "not provided"}  
Place: ${pob || "not provided"}
Dosha: ${dosha || "inferred from chart"}
Current Dasha: ${dasha || "inferred from chart"}
${focusLine}

Return ONLY a valid JSON object. No markdown. No backticks. No explanations outside the JSON.
Each section: 3–5 sentences. Dense. Precise. Poetic but grounded.

{
  "graha": "Name the dominant graha governing ${firstName}'s reality this moment. Describe exactly how its frequency moves through their nadis and life circumstances. Reveal what quality this graha is activating — in their body, relationships, and dharmic path. Make it specific to their birth data.",
  "dasha": "Name the current Mahadasha and Antardasha period. Decode what karmic contract this period is burning through for ${firstName}. Reveal what the soul agreed to learn in this exact window of time. Name the gift hidden inside the difficulty.",
  "shadow": "Name the single most precise blind spot blocking ${firstName}'s next breakthrough. Describe how it manifests in their daily reality — in behavior, patterns, or recurring situations. Trace it to its root vow or past-life origin. Speak it clearly and without softening.",
  "sadhana": "Prescribe one specific mantra with its Sanskrit transliteration, the deity it invokes, and its purpose for ${firstName} now. Give one precise timing instruction — day of week, hora, or muhurta. Give one embodied practice or offering. Make it immediately actionable.",
  "transmission": "Speak as Maharishi Bhrigu himself — 2 to 3 lines only. Dense with light. A sutra that ${firstName} can carry like a seed. This is your direct blessing over their life path."
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!GEMINI_API_KEY) {
    console.error("[bhrigu-oracle] GEMINI_API_KEY not configured.");
    return new Response(JSON.stringify({ error: "Oracle channel not configured." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const chart = (body.chart_context as Record<string, unknown>) || {};

    const name     = String(body.name ?? chart.name ?? "");
    const dob      = String(chart.dateOfBirth ?? body.birth_date ?? body.dateOfBirth ?? "");
    const tob      = String(chart.timeOfBirth ?? body.birth_time ?? body.timeOfBirth ?? "");
    const pob      = String(chart.placeOfBirth ?? body.birth_place ?? body.placeOfBirth ?? "");
    const dosha    = String(body.dosha ?? "");
    const dasha    = String(body.current_dasha ?? "");
    const question = String(body.question ?? "");
    const readingType = String(body.readingType ?? body.mode ?? "general");

    // Auth + tier check
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let user: { id: string } | null = null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user ?? null;
    }

    let tier = "free";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("subscription_tier").eq("id", user.id).maybeSingle();
      tier = (profile?.subscription_tier as string) ?? "free";
    }

    // Rate limit: free users get 1 reading per week
    if (user && (tier === "free" || tier === "")) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("oracle_usage_log").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("function_name", "bhrigu-oracle").gt("created_at", oneWeekAgo);
      if ((count ?? 0) >= 1) {
        return new Response(JSON.stringify({
          error: "RATE_LIMIT",
          message: "Free members receive 1 Bhrigu Nadi reading per week. Upgrade to Prana-Flow for unlimited access.",
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Cache check — v5 key includes question for per-question caching
    const cacheKey = hashChart("v5", dob, tob, pob, readingType, dosha, dasha, question.slice(0, 60));
    const { data: cached } = await supabase
      .from("ai_response_cache").select("response_text, id, hit_count")
      .eq("cache_key", cacheKey).gt("expires_at", new Date().toISOString()).maybeSingle();

    if (cached) {
      await supabase.from("ai_response_cache")
        .update({ hit_count: (cached.hit_count || 0) + 1 }).eq("id", cached.id);
      if (user) await supabase.from("oracle_usage_log")
        .insert({ user_id: user.id, function_name: "bhrigu-oracle", cached: true });

      let parsed: Record<string, string> | null = null;
      try { parsed = JSON.parse(cached.response_text); } catch { /* legacy text */ }

      return new Response(JSON.stringify({ reading: cached.response_text, sections: parsed, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build prompt and call Gemini 2.0 Flash directly
    const prompt = buildNadiPrompt(name, dob, tob, pob, dosha, dasha, readingType, question);

    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.85,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[bhrigu-oracle] Gemini error", res.status, errText.slice(0, 400));
      return new Response(
        JSON.stringify({ error: "oracle_channel_disrupted", status: res.status, detail: errText.slice(0, 400) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await res.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    if (!rawText) {
      console.error("[bhrigu-oracle] empty response", JSON.stringify(aiData).slice(0, 400));
      return new Response(
        JSON.stringify({ error: "empty_transmission", detail: "The Nadi channel returned silence." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse JSON sections — strip any accidental markdown fences
    let sections: Record<string, string> | null = null;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      sections = JSON.parse(clean);
    } catch (e) {
      console.warn("[bhrigu-oracle] JSON parse failed, returning raw text:", String(e).slice(0, 100));
    }

    // Cache for 7 days
    await supabase.from("ai_response_cache").upsert({
      cache_key: cacheKey,
      query_hash: cacheKey,
      response_text: sections ? JSON.stringify(sections) : rawText,
      function_name: "bhrigu-oracle",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hit_count: 0,
    }, { onConflict: "cache_key" });

    if (user) {
      await supabase.from("oracle_usage_log")
        .insert({ user_id: user.id, function_name: "bhrigu-oracle", cached: false });
    }

    return new Response(JSON.stringify({ reading: rawText, sections, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[bhrigu-oracle] Unexpected", err);
    return new Response(
      JSON.stringify({ error: "Oracle interrupted", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
