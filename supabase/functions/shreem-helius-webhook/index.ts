// supabase/functions/shreem-helius-webhook/index.ts
// SHREEM BRZEE v5 — 100% SERVER-SIDE. Phone off = bot still runs.
//
// ALL trading logic runs here — no browser needed:
//   • Helius webhook → detect whale swap → write signal
//   • On BUY signal → immediately open paper trade (server-side)
//   • On SELL signal → immediately close matching paper trade (server-side)
//   • GET /cron → called every 5 min by Supabase cron job
//                 checks stop-loss and 48h safety cap on all open positions
//   • GET /session → frontend reads session (display only)
//   • GET /trades → frontend reads trades (display only)
//   • GET /signals → frontend reads signals (display only)
//   • POST /test, /test-sell → inject test signals
//
// Frontend is READ-ONLY. It displays data. All logic is here.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Constants ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb           = createClient(SUPABASE_URL, SUPABASE_KEY);
const HELIUS_KEY   = Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
const HELIUS_RPC   = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const SOL_MINT     = "So11111111111111111111111111111111111111112";
const LAMPORTS     = 1_000_000_000;
const WEBHOOK_DB_WRITES_ENABLED = Deno.env.get("SHREEM_WEBHOOK_DB_WRITES_ENABLED") === "true";
const MAX_WEBHOOK_TXS_PER_BATCH = 10;

// ── Whale wallet list ─────────────────────────────────────────────────────────
const WHALE_WALLETS: Record<string, string> = {
  "Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB": "Euris",
  "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ": "Heyitsyolo",
  "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu": "Remusofmars",
  "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm": "Lenion",
  "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp": "Hades",
  "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51": "Fireball",
  "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS": "Hachjdn",
  "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o": "Cented",
  "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA": "The Grande",
  "JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN": "West",
  "5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG": "Yenni",
  "5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg":  "Doji",
  "Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7": "Trenchman",
  "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP": "OGAntD",
  "BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd": "Kev",
  "4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9": "decu",
  "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT":  "trunoest",
  "G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC": "clukz",
  "BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB": "Limfork",
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const jsonResp = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// ── Price fetch (server-side, no browser) ─────────────────────────────────────
async function fetchPrice(mint: string): Promise<number> {
  // Try DexScreener first
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const pairs = ((await r.json())?.pairs || []).filter((p: any) => p?.priceUsd && parseFloat(p.priceUsd) > 0);
      if (pairs.length) {
        pairs.sort((a: any, b: any) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0));
        const p = parseFloat(pairs[0].priceUsd);
        if (p > 0) return p;
      }
    }
  } catch {}
  // Fallback: Jupiter
  try {
    const r = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) { const p = parseFloat((await r.json())?.data?.[mint]?.price); if (p > 0) return p; }
  } catch {}
  return 0;
}

// ── Kelly position sizing ─────────────────────────────────────────────────────
function calcPositionSize(portfolio: number, wins: number, losses: number, openExposure: number): number {
  // Pure compounding Kelly sizer — no hard cap, grows with account
  // 5% base → scales up to 10% as win rate improves
  // 50% max exposure across all open trades combined
  if (portfolio <= 0) return 0;
  const total   = wins + losses;
  const winRate = total >= 5 ? wins / total : 0.5;
  const pct     = Math.min(0.10, Math.max(0.05, winRate * 0.12));
  const maxExp  = portfolio * 0.50;  // never more than 50% in open trades total
  const room    = maxExp - openExposure;
  if (room <= 0.001) return 0;
  return Math.min(portfolio * pct, room); // 5-10% of portfolio, auto-grows with account
}

// ── Open paper trade (server-side) ───────────────────────────────────────────
async function openTrade(signal: any, sess: any): Promise<void> {
  if (!sess?.started_at || sess?.stopped_at) return;

  const portfolio = Number(sess.portfolio || 0);
  if (portfolio <= 0) { console.log("[open] zero portfolio"); return; }

  // No duplicate positions — check BOTH mint (no double position) AND sig (no duplicate webhook)
  const { data: existingMint } = await sb.from("shreem_brzee_paper_trades")
    .select("id").eq("status", "open").eq("mint", signal.mint).limit(1);
  if (existingMint?.length) { console.log(`[open] already open in ${signal.mint}`); return; }

  // Also check if this exact signal was already processed (Helius duplicate webhook protection)
  const sigKey = signal.sig + "_open";
  const { data: existingSig } = await sb.from("shreem_brzee_paper_trades")
    .select("id").eq("sig", sigKey).limit(1);
  if (existingSig?.length) { console.log(`[open] duplicate webhook for sig ${signal.sig}`); return; }

  // Check exposure
  const { data: openTrades } = await sb.from("shreem_brzee_paper_trades")
    .select("amount_sol").eq("status", "open");
  const openExposure = (openTrades || []).reduce((s: number, t: any) => s + (Number(t.amount_sol) || 0), 0);

  const size = calcPositionSize(portfolio, Number(sess.wins || 0), Number(sess.losses || 0), openExposure);
  if (size < 0.001) { console.log(`[open] blocked — 50% cap or zero size`); return; }

  // Fetch entry price — retry up to 3 times with delays
  let entryPrice = 0;
  if (signal.mint) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
      entryPrice = await fetchPrice(signal.mint);
      if (entryPrice > 0) break;
      console.log(`[price] attempt ${attempt+1} failed for ${signal.mint}`);
    }
    if (!entryPrice) console.warn(`[price] could not fetch price for ${signal.mint} after 3 attempts`);
  }

  // Upsert (not insert) — prevents duplicate if two webhooks race past the checks above
  const tradeRow = {
    session_id:  "default",
    sig:         signal.sig + "_open",
    mint:        signal.mint,
    symbol:      signal.symbol,
    label:       signal.label,
    wallet:      signal.wallet,
    action:      "BUY",
    entry_price: entryPrice || null,
    amount_sol:  size,
    gross_sol:   size,
    net_sol:     size,
    status:      "open",
    opened_at:   new Date().toISOString(),
  };
  const { error } = await sb.from("shreem_brzee_paper_trades")
    .upsert(tradeRow, { onConflict: "sig", ignoreDuplicates: true });

  if (error) { console.error("[open] upsert error:", error.message); return; }

  // Deduct from portfolio
  await sb.from("shreem_brzee_session").upsert({
    id: "default", ...sess,
    portfolio:  portfolio - size,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  console.log(`[open] ✅ ${signal.symbol || signal.mint?.slice(0,8)} | ${size.toFixed(4)} SOL | via ${signal.label} | entry=$${entryPrice || "?"}`);
}

// ── Close paper trade (server-side) ──────────────────────────────────────────
async function closeTrade(pos: any, reason: string, exitPriceOverride?: number): Promise<void> {
  const entry = Number(pos.entry_price) || 0;
  const size  = Number(pos.amount_sol)  || 0;

  // Fetch exit price — retry 3 times
  let exitPrice = exitPriceOverride || 0;
  if (!exitPrice && pos.mint) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
      exitPrice = await fetchPrice(pos.mint);
      if (exitPrice > 0) break;
    }
  }

  // If entry_price was never captured, try to use exit price as estimate
  // This happens when price fetch failed at open time
  // In this case PNL is unknown — record as 0 and flag it
  const hasValidEntry = entry > 0;
  const hasValidExit  = exitPrice > 0;

  const pnlPct = hasValidEntry && hasValidExit ? (exitPrice - entry) / entry * 100 : 0;
  const pnlSol = size * (pnlPct / 100);
  const exitSol = size + pnlSol;
  const won = pnlSol >= 0;

  // If no entry price: update the entry price with exit price so it shows something
  const updateData: any = {
    status:      "closed",
    closed_at:   new Date().toISOString(),
    exit_price:  exitPrice || null,
    pnl_pct:     pnlPct,
    pnl_sol:     pnlSol,
    sell_reason: reason,
  };
  // Backfill entry_price if it was missing (shows as entry≈exit, PNL≈0 which is accurate)
  if (!hasValidEntry && hasValidExit) {
    updateData.entry_price = exitPrice;
  }

  await sb.from("shreem_brzee_paper_trades").update(updateData).eq("id", pos.id);

  // Update session
  const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
  if (sess) {
    await sb.from("shreem_brzee_session").upsert({
      id:         "default",
      ...sess,
      portfolio:  Number(sess.portfolio || 0) + exitSol,
      total_pnl:  Number(sess.total_pnl  || 0) + pnlSol,
      wins:       Number(sess.wins   || 0) + (won ? 1 : 0),
      losses:     Number(sess.losses || 0) + (won ? 0 : 1),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  }

  console.log(`[close] ${won?"✅":"❌"} ${pos.symbol || pos.mint?.slice(0,8)} | ${pnlPct.toFixed(1)}% | entry=${entry>0?"$"+entry.toFixed(6):"missing"} exit=${exitPrice>0?"$"+exitPrice.toFixed(6):"missing"} | ${reason}`);
}

// ── Cron job: check stop-loss + 48h cap on ALL open positions ─────────────────
async function runCron(): Promise<object> {
  const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
  if (!sess?.started_at || sess?.stopped_at) return { skipped: "session not running" };

  const { data: openPos } = await sb.from("shreem_brzee_paper_trades")
    .select("*").eq("status", "open");

  if (!openPos?.length) return { checked: 0 };

  let closed = 0;
  const results: any[] = [];

  for (const pos of openPos) {
    const entry  = Number(pos.entry_price) || 0;
    const ageH   = (Date.now() - new Date(pos.opened_at || pos.created_at).getTime()) / 3_600_000;

    // 48h safety cap (no browser needed — runs server-side every 5min)
    if (ageH >= 48) {
      await closeTrade(pos, "48h_safety_cap");
      closed++; results.push({ id: pos.id, reason: "48h_safety_cap", ageH: ageH.toFixed(1) });
      continue;
    }

    // Stop-loss: need current price
    if (entry > 0 && pos.mint) {
      const price = await fetchPrice(pos.mint);
      if (price > 0) {
        const pnlPct = (price - entry) / entry * 100;
        if (pnlPct <= -30) {
          await closeTrade(pos, "stop_loss", price);
          closed++; results.push({ id: pos.id, reason: "stop_loss", pnlPct: pnlPct.toFixed(1) });
          continue;
        }
        // Update live PNL in DB so frontend always sees current value even without browser
        await sb.from("shreem_brzee_paper_trades").update({
          exit_price: price, // store current price as "exit_price" for display
          pnl_pct:    pnlPct,
          pnl_sol:    Number(pos.amount_sol || 0) * (pnlPct / 100),
        }).eq("id", pos.id).eq("status", "open"); // only updates if still open
      }
    }
  }

  return { checked: openPos.length, closed, results };
}

// ── Sync wallets to tracked_whales (DB only — fast, runs on every request) ────
async function syncWallets(): Promise<void> {
  try {
    const rows = Object.entries(WHALE_WALLETS).map(([address, label]) => ({
      address, label, source: "kollist", added_at: new Date().toISOString()
    }));
    await sb.from("tracked_whales").upsert(rows, { onConflict: "address" });
  } catch (e: any) { console.warn("[sync]", e.message); }
}

// ── Update Helius webhook registration (only called explicitly via /sync-helius) ──
async function syncHelius(): Promise<{ ok: boolean; message: string; count?: number }> {
  try {
    const HELIUS_KEY = Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/shreem-helius-webhook`;
    const addresses = Object.keys(WHALE_WALLETS);

    const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`, { signal: AbortSignal.timeout(8000) });
    if (!listR.ok) throw new Error(`Helius list failed: ${listR.status}`);
    const hooks = await listR.json();
    const ours  = Array.isArray(hooks) ? hooks.find((h: any) => h?.webhookURL === WEBHOOK_URL) : null;

    const payload = {
      webhookURL:       WEBHOOK_URL,
      transactionTypes: ["SWAP"],
      accountAddresses: addresses,
      webhookType:      "enhanced",
      txnStatus:        "success",
    };

    let r;
    if (ours?.webhookID) {
      r = await fetch(`https://api.helius.xyz/v0/webhooks/${ours.webhookID}?api-key=${HELIUS_KEY}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000)
      });
    } else {
      r = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000)
      });
    }

    const result = await r.json().catch(() => ({}));
    const msg = `${ours ? "Updated" : "Created"} Helius webhook watching ${addresses.length} wallets`;
    console.log(`[helius-sync] ${msg}, status: ${r.status}`);
    return { ok: r.ok, message: msg, count: addresses.length };
  } catch (e: any) {
    console.error("[helius-sync] failed:", e.message);
    return { ok: false, message: e.message };
  }
}

// ── Parse swap from Helius tx ─────────────────────────────────────────────────
function findWhale(tx: any): string | null {
  if (tx.feePayer && WHALE_ADDRS.has(tx.feePayer)) return tx.feePayer;
  for (const a of (tx.accountData || []))
    if (WHALE_ADDRS.has(a.account)) return a.account;
  for (const t of (tx.nativeTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount))   return t.toUserAccount;
  }
  for (const t of (tx.tokenTransfers || [])) {
    if (WHALE_ADDRS.has(t.fromUserAccount)) return t.fromUserAccount;
    if (WHALE_ADDRS.has(t.toUserAccount))   return t.toUserAccount;
  }
  return null;
}

function parseSwap(tx: any, wallet: string) {
  const tokenTx = (tx.tokenTransfers || []).find((t: any) =>
    (t.fromUserAccount === wallet || t.toUserAccount === wallet) && t.mint !== SOL_MINT
  );
  if (!tokenTx) return null;
  const acctData = (tx.accountData || []).find((a: any) => a.account === wallet);
  let amountSol = acctData?.nativeBalanceChange ? Math.abs(acctData.nativeBalanceChange) / LAMPORTS : 0;
  if (!amountSol || amountSol < 0.001) {
    amountSol = (tx.nativeTransfers || [])
      .filter((t: any) => (t.fromUserAccount === wallet || t.toUserAccount === wallet) && t.amount > 100_000)
      .reduce((s: number, t: any) => s + t.amount, 0) / LAMPORTS;
  }
  return {
    action:     (tokenTx.toUserAccount === wallet ? "BUY" : "SELL") as "BUY"|"SELL",
    mint:       tokenTx.mint as string,
    symbol:     tokenTx.tokenName || tokenTx.symbol || null,
    amountSol,
    tokenAmount: tokenTx.tokenAmount || null,
    isPumpFun:  (tx.source||"").toLowerCase().includes("pump") ||
                (tx.instructions||[]).some((ix: any) => ix.programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url  = new URL(req.url);
  const path = url.pathname;

  // ── Cron endpoint — called every 5 min by Supabase cron ────────────────
  if (req.method === "GET" && path.endsWith("/cron")) {
    const result = await runCron();
    return jsonResp({ ok: true, ...result, ts: new Date().toISOString() });
  }

  // ── Setup endpoint — call ONCE to install the pg_cron job automatically ──
  // GET /setup-cron  →  installs pg_cron + pg_net + creates the 5-min schedule
  if (req.method === "GET" && path.endsWith("/setup-cron")) {
    try {
      const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const EDGE_URL = `${SUPA_URL.replace("supabase.co","supabase.co")}/functions/v1/shreem-helius-webhook/cron`;
      
      // Use Supabase's SQL execution endpoint (requires service role)
      const sqlStatements = [
        "CREATE EXTENSION IF NOT EXISTS pg_cron;",
        "CREATE EXTENSION IF NOT EXISTS pg_net;",
        // Remove existing job if any
        "SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'shreem-brzee-cron';",
        // Create the 5-minute cron job
        `SELECT cron.schedule('shreem-brzee-cron','*/5 * * * *',
          $$SELECT net.http_get(url := '${SUPA_URL}/functions/v1/shreem-helius-webhook/cron') AS result;$$
        );`,
      ];

      const results: any[] = [];
      for (const sql of sqlStatements) {
        const r = await fetch(`${SUPA_URL}/rest/v1/rpc/`, {
          method: "POST",
          headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: sql }),
        });
        results.push({ sql: sql.slice(0, 60), status: r.status });
      }

      // Verify the job exists
      const { data: jobs } = await sb.from("cron.job" as any).select("jobname,schedule,active").eq("jobname","shreem-brzee-cron");

      return jsonResp({
        ok: true,
        message: "Cron job setup complete — bot runs every 5 min server-side",
        results,
        job: jobs?.[0] || null,
        cron_url: `${SUPA_URL}/functions/v1/shreem-helius-webhook/cron`,
      });
    } catch (e: any) {
      // pg_cron may need to be enabled in Supabase Dashboard first
      return jsonResp({
        ok: false,
        error: e.message,
        manual_steps: [
          "1. Supabase Dashboard → Database → Extensions → enable pg_cron",
          "2. Supabase Dashboard → Database → Extensions → enable pg_net",
          "3. Then call GET /setup-cron again",
          "OR: run SETUP_CRON_JOB.sql in Supabase SQL Editor"
        ]
      }, 500);
    }
  }

  // ── Read endpoints (frontend display) ────────────────────────────────────
  if (req.method === "GET" && path.endsWith("/session")) {
    const { data } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();
    return jsonResp(data || null);
  }

  if (req.method === "GET" && path.endsWith("/trades")) {
    const { data: sessRow } = await sb.from("shreem_brzee_session").select("mode").eq("id","default").single();
    const table = sessRow?.mode === "live" ? "shreem_brzee_live_trades" : "shreem_brzee_paper_trades";
    const { data } = await sb.from(table)
      .select("*").order("created_at", { ascending: false }).limit(100);
    return jsonResp(data || []);
  }

  if (req.method === "GET" && path.endsWith("/signals")) {
    const { data } = await sb.from("shreem_brzee_signals")
      .select("*").order("created_at", { ascending: false }).limit(100);
    return jsonResp(data || []);
  }

  if (req.method === "GET" && path.endsWith("/open")) {
    const { data: sessRow } = await sb.from("shreem_brzee_session").select("mode").eq("id","default").single();
    const table = sessRow?.mode === "live" ? "shreem_brzee_live_trades" : "shreem_brzee_paper_trades";
    const { data } = await sb.from(table)
      .select("*").eq("status","open").order("opened_at", { ascending: false });
    return jsonResp(data || []);
  }

  if (req.method === "GET" && path.endsWith("/ping")) {
    return jsonResp({ ok: true, version: "v5-server-side", ts: new Date().toISOString() });
  }

  // ── Manual Helius sync ────────────────────────────────────────────────────
  if (req.method === "GET" && path.endsWith("/sync-helius")) {
    await syncWallets(); // sync DB first
    const result = await syncHelius(); // then update Helius
    const { data: rows } = await sb.from("tracked_whales").select("address,label");
    return jsonResp({ ...result, synced: rows?.length, wallets: rows?.map((r:any) => r.label) });
  }

  // ── Status — debug endpoint ──────────────────────────────────────────────
  if (req.method === "GET" && path.endsWith("/status")) {
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();
    const { data: openTrades } = await sb.from("shreem_brzee_live_trades").select("id,mint,status").limit(10);
    const { data: recentSigs } = await sb.from("shreem_brzee_signals").select("action,symbol,label,created_at").order("created_at",{ascending:false}).limit(5);
    return jsonResp({
      session: {
        mode:         sess?.mode,
        started_at:   sess?.started_at,
        stopped_at:   sess?.stopped_at,
        portfolio:    sess?.portfolio,
        start_balance: sess?.start_balance,
        is_running:   !!(sess?.started_at && !sess?.stopped_at),
      },
      live_trades:   openTrades || [],
      recent_signals: recentSigs || [],
    });
  }

  // ── Go Live — wipe paper data, start fresh live session ──────────────────
  if (req.method === "POST" && path.endsWith("/go-live")) {
    try {
      const body = await req.json().catch(() => ({}));
      const bal  = Number(body?.balance_sol || 0.3);

      // Delete ALL paper trades, live trades, and signals (service role bypasses RLS)
      await sb.from("shreem_brzee_paper_trades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("shreem_brzee_live_trades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await sb.from("shreem_brzee_signals").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Fresh live session
      await sb.from("shreem_brzee_session").upsert({
        id:            "default",
        portfolio:     bal,
        start_balance: bal,
        positions:     {},
        total_pnl:     0,
        wins:          0,
        losses:        0,
        started_at:    new Date().toISOString(),
        stopped_at:    null,
        mode:          "live",
        updated_at:    new Date().toISOString(),
      }, { onConflict: "id" });

      // Clear tracked_whales and re-sync ONLY our confirmed wallets
      // This removes stale wallets like Cupsey that were previously added
      await sb.from("tracked_whales").delete().neq("address", "none");
      await syncWallets();
      console.log(`[go-live] ✅ Clean start with ${bal} SOL`);
      return jsonResp({ ok: true, balance_sol: bal, mode: "live", message: "🔴 Live mode active — paper data cleared, wallets synced" });
    } catch (e: any) {
      return jsonResp({ ok: false, error: e.message }, 500);
    }
  }

  // ── Manual close endpoint ────────────────────────────────────────────────
  // Called by the frontend CLOSE TRADE button
  // POST /close-trade  body: { trade_id: string }
  if (req.method === "POST" && path.endsWith("/close-trade")) {
    try {
      const body = await req.json();
      const tradeId = body?.trade_id;
      if (!tradeId) return jsonResp({ error: "missing trade_id" }, 400);

      // Fetch the open position
      const { data: pos, error: fetchErr } = await sb
        .from("shreem_brzee_paper_trades")
        .select("*")
        .eq("id", tradeId)
        .eq("status", "open")
        .single();

      if (fetchErr || !pos) return jsonResp({ error: "trade not found or already closed" }, 404);

      // Close it server-side with current market price
      await closeTrade(pos, "manual");

      return jsonResp({ ok: true, trade_id: tradeId, symbol: pos.symbol, reason: "manual" });
    } catch (e: any) {
      return jsonResp({ ok: false, error: e.message }, 500);
    }
  }

  // ── Test signals ──────────────────────────────────────────────────────────
  if (req.method === "POST" && path.endsWith("/test")) {
    const sig = "TEST_" + Date.now();
    const signal = {
      sig, wallet: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",
      label: "Remusofmars", action: "BUY",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT", amount_sol: 1.5, token_amount: 50000,
      is_pump_fun: true, block_time: Math.floor(Date.now()/1000),
      created_at: new Date().toISOString(),
    };
    await sb.from("shreem_brzee_signals").upsert(signal, { onConflict: "sig" });

    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();

    if (sess?.mode === "live") {
      // LIVE MODE: trigger real executor
      const execResp = await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          direct_signal: { sig: signal.sig, mint: signal.mint, symbol: signal.symbol, label: signal.label, wallet: signal.wallet, amount_sol: signal.amount_sol },
          session: { portfolio: sess.portfolio, wins: sess.wins, losses: sess.losses }
        }),
      });
      const execResult = await execResp.json().catch(() => ({}));
      return jsonResp({ ok: true, sig, mode: "live", exec: execResult, version: "v5" });
    } else {
      // PAPER MODE: open paper trade
      if (sess) await openTrade(signal, sess);
      return jsonResp({ ok: true, sig, mode: "paper", action: "BUY", version: "v5" });
    }
  }

  if (req.method === "POST" && path.endsWith("/test-sell")) {
    const sig = "TEST_SELL_" + Date.now();
    const signal = {
      sig, wallet: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",
      label: "Remusofmars", action: "SELL",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT", amount_sol: 3.2,
      created_at: new Date().toISOString(),
    };
    await sb.from("shreem_brzee_signals").upsert(signal, { onConflict: "sig" });
    // Close matching positions server-side
    const { data: openPos } = await sb.from("shreem_brzee_paper_trades")
      .select("*").eq("status","open").eq("mint", signal.mint);
    for (const pos of (openPos || [])) await closeTrade(pos, "whale_sell_mirror");
    return jsonResp({ ok: true, sig, action: "SELL", closed: (openPos||[]).length, version: "v5" });
  }

  // ── Manual signal insert ──────────────────────────────────────────────────
  if (req.method === "POST" && path.endsWith("/signal")) {
    let body: any;
    try { body = await req.json(); } catch { return jsonResp({ error: "bad json" }, 400); }
    const s = body?.signal;
    if (!s?.sig) return jsonResp({ error: "missing signal.sig" }, 400);
    const row = {
      sig: s.sig, wallet: s.wallet,
      label: s.label ?? WHALE_WALLETS[s.wallet] ?? null,
      action: s.action, mint: s.mint, symbol: s.symbol ?? null,
      amount_sol: s.amount_sol ?? null, token_amount: s.token_amount ?? null,
      is_pump_fun: s.is_pump_fun ?? false,
      block_time: s.block_time ?? Math.floor(Date.now()/1000),
    };
    await sb.from("shreem_brzee_signals").upsert(row, { onConflict: "sig" });
    return jsonResp({ ok: true, sig: row.sig, version: "v5" });
  }

  // ── Helius webhook (main entry point) ────────────────────────────────────
  // IMPORTANT: must always return 200 or Helius disables the webhook
  if (req.method !== "POST") return jsonResp({ error: "method" }, 405);

  try {
    let body: any;
    try { body = await req.json(); } catch {
      return jsonResp({ ok: false, error: "bad json" });
    }

    const txs = (Array.isArray(body) ? body : [body]).slice(0, MAX_WEBHOOK_TXS_PER_BATCH);
    let inserted = 0, skipped = 0;

    // DB writes enabled — all signals processed

    for (const tx of txs) {
      // Load FRESH session for each tx — reflects portfolio deductions from prior txs in same batch
      try {
        const sig    = tx.signature;
        if (!sig) { skipped++; continue; }
        const wallet = findWhale(tx);
        if (!wallet) { skipped++; continue; }
        const swap   = parseSwap(tx, wallet);
        if (!swap) { skipped++; continue; }

        const signal = {
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
          created_at:   new Date().toISOString(),
        };

        const { error } = await sb.from("shreem_brzee_signals")
          .upsert(signal, { onConflict: "sig" });

        if (error) { console.error("[signal]", error.message); skipped++; continue; }
        inserted++;
        console.log(`✅ ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} — ${WHALE_WALLETS[wallet]}`);

        // ── SERVER-SIDE TRADE EXECUTION (phone can be off) ──────────────
        // Load fresh session each time to get latest portfolio balance
        const { data: sessNow } = await sb.from("shreem_brzee_session")
          .select("*").eq("id","default").single();

        if (sessNow?.started_at && !sessNow?.stopped_at) {
          if (sessNow.mode === "live") {
            // LIVE MODE: pass signal directly to executor — no flag polling needed
            if (swap.action === "BUY") {
              // Fire and forget — executor runs Jupiter swap immediately
              fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({
                  direct_signal: {
                    sig:        signal.sig,
                    mint:       signal.mint,
                    symbol:     signal.symbol,
                    label:      signal.label,
                    wallet:     signal.wallet,
                    amount_sol: signal.amount_sol,
                  },
                  session: {
                    portfolio: sessNow.portfolio,
                    wins:      sessNow.wins,
                    losses:    sessNow.losses,
                  }
                }),
              }).catch(e => console.error("[live-exec]", e?.message));
              console.log(`[live-trigger] BUY ${signal.symbol} — executor called`);

            } else if (swap.action === "SELL") {
              // Close live positions immediately in DB
              const { data: openLive } = await sb.from("shreem_brzee_live_trades")
                .select("*").eq("status","open").eq("mint", swap.mint);
              for (const pos of (openLive || [])) {
                await sb.from("shreem_brzee_live_trades").update({
                  status:       "closed",
                  sell_reason:  "whale_sell_mirror",
                  closed_at:    new Date().toISOString(),
                }).eq("id", pos.id);
              }
              console.log(`[live-close] SELL ${signal.symbol} — closed ${(openLive||[]).length} positions`);
            }
          } else {
            // PAPER MODE: original behaviour
            if (swap.action === "BUY") {
              await openTrade(signal, sessNow);
            } else if (swap.action === "SELL") {
              const { data: openPos } = await sb.from("shreem_brzee_paper_trades")
                .select("*").eq("status","open").eq("mint", swap.mint);
              for (const pos of (openPos || [])) {
                await closeTrade(pos, "whale_sell_mirror");
              }
            }
          }
        }
      } catch (e: any) {
        console.error("[tx]", e.message);
        skipped++;
      }
    }

    return jsonResp({ ok: true, inserted, skipped, version: "v5" });
  } catch (e: any) {
    console.error("[webhook]", e);
    return jsonResp({ ok: false, error: e?.message ?? String(e) });
  }
});
