// supabase/functions/shreem-helius-webhook/index.ts
// SHREEM BRZEE — Helius Webhook + Paper Trade Relay
// Redeployed: 2026-06-17T15:12:37.009163
// Deployed to: ssygukfdbtehvtndandn (live Supabase)
// Routes:
//   POST /                        → Helius enhanced webhook (whale swap)
//   POST /shreem-helius-webhook/paper    → Hetzner paper server writes
//   GET  /shreem-helius-webhook/session  → Hetzner paper server reads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOL_MINT = "So11111111111111111111111111111111111111112";

const WHALE_WALLETS: Record<string, string> = {
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Cupsey",
  "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ": "Heyitsyolo",
  "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu": "Remusofmars",
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5": "Orange",
  "HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt": "Shreem Brzee",
  "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm": "Lenion",
  "gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw":  "Boredboar",
  "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp": "Hades",
  "AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm":  "Kubera 72",
  "JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k": "Brzee God",
  "9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm": "GBack",
  "GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f": "Tuna",
  "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51": "Fireball",
  "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS": "Hachjdn",
  "5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc": "Crypto Circle",
  "2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv": "Crocodile",
  "4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3": "Snow Spirit",
  "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o": "Cented",
  "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA": "The Grande",
  "Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW": "A Milly",
  "J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG": "J2ANNaq",
};

const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function findWhale(tx: any): string | null {
  if (tx.feePayer && WHALE_ADDRS.has(tx.feePayer)) return tx.feePayer;
  for (const a of (tx.accountData || [])) {
    if (WHALE_ADDRS.has(a.account)) return a.account;
  }
  for (const t of (tx.nativeTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount)) return t.toUserAccount;
  }
  for (const t of (tx.tokenTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount)) return t.toUserAccount;
  }
  return null;
}

function parseSwap(tx: any, wallet: string) {
  const tokenTx = (tx.tokenTransfers || []).find((t: any) =>
    (t.fromUserAccount === wallet || t.toUserAccount === wallet) &&
    t.mint !== SOL_MINT
  );
  if (!tokenTx) return null;

  const solTx = (tx.nativeTransfers || []).find((t: any) =>
    t.fromUserAccount === wallet || t.toUserAccount === wallet
  );

  return {
    action: (tokenTx.toUserAccount === wallet ? "BUY" : "SELL") as "BUY" | "SELL",
    mint: tokenTx.mint as string,
    symbol: (tokenTx.tokenName || tokenTx.symbol || null) as string | null,
    amountSol: solTx ? (solTx.amount || 0) / 1_000_000_000 : null,
    tokenAmount: (tokenTx.tokenAmount || null) as number | null,
    isPumpFun: (tx.source || "").toLowerCase().includes("pump") ||
      (tx.instructions || []).some((ix: any) =>
        ix.programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
      ),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // GET /session
  if (req.method === "GET" && path.endsWith("/session")) {
    const { data, error } = await sb
      .from("shreem_brzee_session")
      .select("*")
      .eq("id", "default")
      .single();
    if (error && error.code !== "PGRST116") {
      return jsonResp({ error: error.message }, 500);
    }
    return jsonResp(data || null);
  }

  // GET /ping — version check
  if (req.method === "GET" && path.endsWith("/ping")) {
    return jsonResp({ ok: true, version: "v3", timestamp: new Date().toISOString() });
  }

  // POST /test — inject a test signal using service key (bypasses RLS)
  if (req.method === "POST" && path.endsWith("/test")) {
    const sig = "TEST_" + Date.now();
    const testRow = {
      sig,
      wallet: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",
      label: "Remusofmars",
      action: "BUY",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      amount_sol: 1.5,
      token_amount: 50000,
      is_pump_fun: true,
      block_time: Math.floor(Date.now() / 1000),
      created_at: new Date().toISOString(),
    };
    const { error } = await sb.from("shreem_brzee_signals").upsert(testRow, { onConflict: "sig" });
    if (error) return jsonResp({ error: error.message, version: "v3" }, 500);
    return jsonResp({ ok: true, sig, version: "v3" });
  }

  // POST /paper
  if (req.method === "POST" && path.endsWith("/paper")) {
    let body: any;
    try { body = await req.json(); } catch { return jsonResp({ error: "bad json" }, 400); }
    const { type, trade, session } = body;
    try {
      if ((type === "trade" || type === "both") && trade) {
        await sb.from("shreem_brzee_paper_trades").insert(trade);
      }
      if ((type === "session" || type === "both") && session) {
        await sb.from("shreem_brzee_session").upsert({
          id: "default", ...session, updated_at: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      console.error("[paper]", e.message);
      return jsonResp({ error: e.message }, 500);
    }
    return jsonResp({ ok: true });
  }

  // POST / — Helius webhook
  if (req.method !== "POST") return jsonResp({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return jsonResp({ error: "bad json" }, 400); }

  const txs = Array.isArray(body) ? body : [body];
  let inserted = 0, skipped = 0;

  for (const tx of txs) {
    try {
      const sig = tx.signature;
      if (!sig) { skipped++; continue; }
      const wallet = findWhale(tx);
      if (!wallet) { skipped++; continue; }
      const swap = parseSwap(tx, wallet);
      if (!swap) { skipped++; continue; }

      const { error } = await sb.from("shreem_brzee_signals").upsert({
        sig,
        wallet,
        label:        WHALE_WALLETS[wallet],
        action:       swap.action,
        mint:         swap.mint,
        symbol:       swap.symbol,
        amount_sol:   swap.amountSol,
        token_amount: swap.tokenAmount,
        is_pump_fun:  swap.isPumpFun,
        block_time:   tx.timestamp || null,
      }, { onConflict: "sig" });

      if (error) { console.error("[signal]", error.message); skipped++; }
      else {
        inserted++;
        console.log(`✅ ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} — ${WHALE_WALLETS[wallet]}`);
      }
    } catch (e: any) {
      console.error("[tx]", e.message);
      skipped++;
    }
  }

  return jsonResp({ ok: true, inserted, skipped });
});
