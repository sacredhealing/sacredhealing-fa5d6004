// gemini-health: diagnostic edge function — tests GEMINI_API_KEY in this Supabase project
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  const keyPresent = key.length > 0;
  const keyLength = key.length;
  const keyPrefix = keyPresent ? key.slice(0, 6) + "..." : "MISSING";

  let geminiStatus = "not_tested";
  let geminiError = "";
  let model = "";

  if (keyPresent) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        model = data.modelVersion ?? "gemini-2.5-flash";
        geminiStatus = text ? "ok" : "empty_response";
      } else {
        geminiStatus = "api_error";
        geminiError = `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`;
      }
    } catch (e) {
      geminiStatus = "fetch_error";
      geminiError = String(e);
    }
  }

  return new Response(
    JSON.stringify({
      project: Deno.env.get("SUPABASE_URL")?.split(".")[0].split("//")[1] ?? "unknown",
      keyPresent,
      keyLength,
      keyPrefix,
      geminiStatus,
      geminiError,
      model,
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
