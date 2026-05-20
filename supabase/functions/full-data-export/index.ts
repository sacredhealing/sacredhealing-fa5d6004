import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: tables } = await supabase.rpc("get_public_tables").catch(() => ({ data: null }));

  const tableNames = tables ? tables.map((t: any) => t.table_name) : [
    "profiles","memberships","orders","subscriptions","products","prices",
    "affiliate_links","affiliate_conversions","healing_sessions","quantum_frequencies",
    "frequency_purchases","user_frequencies","sacred_sites","virtual_pilgrimages",
    "pilgrimage_activations","scalar_sessions","akashic_codex","codex_entries",
    "codex_embeddings","akashic_transmissions","community_posts","community_comments",
    "community_groups","group_members","direct_messages","dm_threads","notifications",
    "video_calls","audio_tracks","audio_playlists","user_audio_history",
    "living_portraits","portrait_sessions","jyotish_charts","vedic_readings",
    "bhrigu_readings","ayurveda_profiles","dosha_assessments",
    "quantum_apothecary_sessions","shakti_cycle_logs","hormonal_alchemy_sessions",
    "social_tokens","social_posts","manychat_events","stripe_webhooks","payment_logs",
    "user_preferences","user_streaks","meditation_logs","practitioner_certifications",
    "siddha_transmissions"
  ];

  const result: any = {};
  for (const table of tableNames) {
    try {
      const { data, count } = await supabase.from(table).select("*", { count: "exact" }).limit(10000);
      result[table] = { count: count ?? 0, rows: data ?? [] };
    } catch(e: any) {
      result[table] = { count: 0, rows: [], error: e.message };
    }
  }

  return new Response(JSON.stringify({ exported_at: new Date().toISOString(), tables: result }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
