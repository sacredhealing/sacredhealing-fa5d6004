import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SHARED_SECRET = Deno.env.get("WORKER_BRIDGE_SECRET") ?? "shreem2026";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const headers = { ...corsHeaders, "Content-Type": "application/json" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-worker-secret",
      },
    });
  }

  if (req.headers.get("x-worker-secret") !== SHARED_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: any = {};
  try {
    if (req.method === "POST") body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const url = new URL(req.url);
  const action = body.action ?? url.searchParams.get("action");

  try {
    switch (action) {
      case "get_keypair": {
        const { data, error } = await supabase
          .from("bot_secrets")
          .select("value")
          .eq("name", "SHREEM_BOT_KEYPAIR")
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ keypair: data?.value ?? null });
      }

      case "insert_trade": {
        const row = body.trade;
        if (!row || typeof row !== "object") {
          return json({ error: "missing trade object" }, 400);
        }
        const { data, error } = await supabase
          .from("shreem_brzee_live_trades")
          .insert(row)
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ trade: data });
      }

      case "update_trade": {
        const { id, patch } = body;
        if (!id || !patch) return json({ error: "missing id or patch" }, 400);
        const { data, error } = await supabase
          .from("shreem_brzee_live_trades")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ trade: data });
      }

      case "open_positions": {
        const { data, error } = await supabase
          .from("shreem_brzee_live_trades")
          .select("*")
          .in("status", ["open", "pending", "unconfirmed", "closing"])
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        return json({ positions: data ?? [] });
      }

      default:
        return json(
          {
            error: "unknown action",
            actions: ["get_keypair", "insert_trade", "update_trade", "open_positions"],
          },
          400,
        );
    }
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
