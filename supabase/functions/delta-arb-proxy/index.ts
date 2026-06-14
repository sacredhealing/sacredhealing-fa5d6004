import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://ssygukfdbtehvtndandn.supabase.co";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";

const LIVE_START  = 10;   // POLYGRAM EXTREME starting balance
const PAPER_START = 100;  // Paper sim starting balance

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url      = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") ?? "health";
  const limit    = parseInt(url.searchParams.get("limit") ?? "200");
  const mode     = url.searchParams.get("mode") ?? null; // optional filter

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    if (endpoint === "health") {
      const { data: trades, error } = await sb
        .from("bot_trades")
        .select("status, mode, size_usd, pnl_usdc, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      const all      = trades ?? [];
      const live     = all.filter(t => t.mode === "LIVE");
      const paper    = all.filter(t => t.mode === "PAPER");
      
      const calcStats = (arr: any[], startBal: number) => {
        const wins   = arr.filter(t => t.status === "won").length;
        const losses = arr.filter(t => t.status === "lost").length;
        const total  = wins + losses;
        const pnl    = arr.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
        return {
          balance:  Math.round((startBal + pnl) * 100) / 100,
          wins, losses, total,
          winRate: total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "—",
          pnl:    Math.round(pnl * 100) / 100,
        };
      };

      const liveStats  = calcStats(live,  LIVE_START);
      const paperStats = calcStats(paper, PAPER_START);

      return new Response(JSON.stringify({
        status:      "running",
        bot:         "SQI Delta-Arb Bot",
        mode:        live.length > 0 ? "LIVE" : "PAPER",
        live:        liveStats,
        paper:       paperStats,
        // Top-level for backward compat
        balance:     liveStats.balance,
        winRate:     liveStats.winRate,
        tradeCount:  liveStats.total,
        signalCount: all.length,
        lastScan:    new Date().toISOString(),
        dbError:     error?.message ?? null,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (endpoint === "trades") {
      let query = sb
        .from("bot_trades")
        .select("id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (mode) query = query.eq("mode", mode);

      const { data: trades, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" }
        });
      }

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
      status: "running", bot: "SQI Delta-Arb Bot",
      balance: LIVE_START, winRate: "—", tradeCount: 0,
      lastScan: new Date().toISOString(), debug: String(e),
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
