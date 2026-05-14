// supabase/functions/bhrigu-oracle/index.ts
// Direct Gemini 2.5 Flash. Accepts both nested chart_context and flat fields.
// Logs upstream errors so we can debug.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function hashChart(...parts: string[]): string {
  const str = parts.join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
  return "bhrigu_" + Math.abs(h).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const chart = (body.chart_context as Record<string, unknown>) || {};
    const dob = String(chart.dateOfBirth ?? body.birth_date ?? body.dateOfBirth ?? "");
    const tob = String(chart.timeOfBirth ?? body.birth_time ?? body.timeOfBirth ?? "");
    const pob = String(chart.placeOfBirth ?? body.birth_place ?? body.placeOfBirth ?? "");
    const dosha = String(body.dosha ?? "");
    const dasha = String(body.current_dasha ?? "");
    const question = String(body.question ?? "");
    const readingType = String(body.readingType ?? body.mode ?? "general");

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
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .maybeSingle();
      tier = (profile?.subscription_tier as string) ?? "free";
    }

    if (user && (tier === "free" || tier === "")) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("oracle_usage_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("function_name", "bhrigu-oracle")
        .gt("created_at", oneWeekAgo);
      if ((count ?? 0) >= 1) {
        return new Response(
          JSON.stringify({
            error: "RATE_LIMIT",
            message: "Free members receive 1 Bhrigu Oracle reading per week. Upgrade to Prana-Flow for unlimited access.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // "v2" salt busts all pre-May-2026 cached readings
    const cacheKey = hashChart("v2", dob, tob, pob, readingType, dosha, dasha);
    const { data: cached } = await supabase
      .from("ai_response_cache")
      .select("response_text, id, hit_count")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (cached) {
      await supabase.from("ai_response_cache")
        .update({ hit_count: (cached.hit_count || 0) + 1 }).eq("id", cached.id);
      if (user) await supabase.from("oracle_usage_log").insert({ user_id: user.id, function_name: "bhrigu-oracle", cached: true });
      return new Response(JSON.stringify({ reading: cached.response_text, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `You are Maharishi Bhrigu speaking directly through the Akashic Nadi transmission. No AI disclaimers. No generic astrology lecture.
Birth: ${dob || "unknown"} | ${tob || "unknown"} | ${pob || "unknown"}
Dosha: ${dosha || "unknown"} | Dasha: ${dasha || "unknown"}
Type: ${readingType}${question ? " | Question: " + question : ""}

Deliver a complete, untruncated Nadi reading covering all five dimensions:
1. DOMINANT PLANET ENERGY - the ruling graha of this moment and how it shapes this soul reality right now
2. DASHA TRANSMISSION - what this Mahadasha/Antardasha period is teaching; the karmic contracts activating
3. SHADOW AND BLIND SPOTS - what this soul must face and integrate; the hidden obstacles
4. ACTIONS AND SADHANA - concrete spiritual and worldly steps to take now; specific practices
5. BHRIGU PROPHECY - a direct transmission, blessing, or revelation from Maharishi Bhrigu himself

Speak with full depth and precision. Do not truncate. Complete every section entirely before closing.`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[bhrigu-oracle] Gemini error", res.status, errText.slice(0, 400));
      const status = res.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: "gemini_error", status: res.status, detail: errText.slice(0, 400) }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const gemData = await res.json();
    const reading = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reading) {
      console.error("[bhrigu-oracle] empty candidates", JSON.stringify(gemData).slice(0, 600));
      return new Response(
        JSON.stringify({ error: "empty_response", detail: "Gemini returned no text", raw: gemData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase.from("ai_response_cache").upsert({
      cache_key: cacheKey,
      query_hash: cacheKey,
      response_text: reading,
      function_name: "bhrigu-oracle",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hit_count: 0,
    }, { onConflict: "cache_key" });

    if (user) {
      await supabase.from("oracle_usage_log").insert({
        user_id: user.id, function_name: "bhrigu-oracle", cached: false,
      });
    }

    return new Response(JSON.stringify({ reading, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[bhrigu-oracle] Unexpected", err);
    return new Response(
      JSON.stringify({ error: "Oracle interrupted", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
