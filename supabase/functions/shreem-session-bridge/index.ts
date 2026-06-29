// shreem-session-bridge: lets the Hetzner worker read/write session mode
// without direct DB access. No auth — callable from the private worker.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("shreem_brzee_session")
        .select("mode, started_at, stopped_at")
        .eq("id", "default")
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json(data ?? { mode: "stopped", started_at: null, stopped_at: null });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const mode = body?.mode;
      if (mode !== "live" && mode !== "stopped") {
        return json({ error: "mode must be 'live' or 'stopped'" }, 400);
      }
      const now = new Date().toISOString();
      const row: Record<string, unknown> = {
        id: "default",
        mode,
        updated_at: now,
      };
      if (mode === "live") {
        row.started_at = now;
        row.stopped_at = null;
      } else {
        row.stopped_at = now;
      }
      const { data, error } = await supabase
        .from("shreem_brzee_session")
        .upsert(row, { onConflict: "id" })
        .select("mode, started_at, stopped_at")
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, session: data });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
