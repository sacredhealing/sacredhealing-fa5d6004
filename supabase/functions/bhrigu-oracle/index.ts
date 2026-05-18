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
        .eq("function
