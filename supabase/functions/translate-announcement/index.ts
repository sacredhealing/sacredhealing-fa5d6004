import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGES = [
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian Bokmål" },
  { code: "es", name: "Spanish" },
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { announcement_id, title, content } = await req.json();
    if (!announcement_id || !title || !content) {
      return new Response(JSON.stringify({ error: "announcement_id, title, and content are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translations: Record<string, { title: string; content: string }> = {};

    // Translate to each language in parallel
    const results = await Promise.all(
      LANGUAGES.map(async (lang) => {
        const prompt = `Translate the following title and content from English to ${lang.name}. Return ONLY a JSON object like {"title":"...","content":"..."} with no markdown, no code fences, no extra text.

Title: ${title}

Content: ${content}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a translator. Return only valid JSON, no markdown." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`Translation to ${lang.code} failed:`, response.status);
          return { code: lang.code, title, content };
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content ?? "";
        
        // Extract JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return { code: lang.code, title: parsed.title || title, content: parsed.content || content };
          } catch {
            console.error(`Failed to parse ${lang.code} translation JSON:`, raw);
            return { code: lang.code, title, content };
          }
        }
        return { code: lang.code, title, content };
      })
    );

    // Build update object
    const updateData: Record<string, string> = {};
    for (const r of results) {
      updateData[`title_${r.code}`] = r.title;
      updateData[`content_${r.code}`] = r.content;
    }

    // Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from("announcements")
      .update(updateData)
      .eq("id", announcement_id);

    if (error) {
      console.error("Failed to save translations:", error);
      return new Response(JSON.stringify({ error: "Failed to save translations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, translations: updateData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("translate-announcement error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
