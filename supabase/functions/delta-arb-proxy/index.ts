import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase provides these automatically to all edge functions
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://fjdzhrdpioxdeyyfogep.supabase.co";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url      = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") ?? "health";
  const limit    = parseInt(url.searchParams.get("limit") ?? "20");

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false }
    });

    if (endpoint === "health") {
      const { data: trades, error } = await sb
        .from("delta_arb_trades")
        .select("status, mode, size_usd, pnl_usdc, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const all    = trades ?? [];
      const wins   = all.filter(t => t.status === "won").length;
      const losses = all.filter(t => t.status === "lost").length;
      const total  = wins + losses;
      const totalPnl = all.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);

      return new Response(JSON.stringify({
        status:      "running",
        bot:         "SQI Delta-Arb Bot v1.1",
        mode:        all[0]?.mode ?? "PAPER",
        balance:     Math.round((100 + totalPnl) * 100) / 100,
        signalCount: all.length,
        tradeCount:  total,
        winRate:     total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "—",
        uptime:      0,
        lastScan:    new Date().toISOString(),
        error:       error?.message ?? null,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (endpoint === "trades") {
      const { data: trades } = await sb
        .from("delta_arb_trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      return new Response(JSON.stringify(trades ?? []), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown endpoint" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({
      status: "running", bot: "SQI Delta-Arb Bot v1.1", mode: "PAPER",
      balance: 100, signalCount: 0, tradeCount: 0, winRate: "—",
      uptime: 0, lastScan: new Date().toISOString(),
      debug: String(e),
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
