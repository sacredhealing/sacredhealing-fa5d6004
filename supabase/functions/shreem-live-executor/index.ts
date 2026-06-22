// supabase/functions/shreem-live-executor/index.ts
// SHREEM BRZEE — Safe Live Executor v3.5
// v3 changes:
//   • SELL close: marks trade status='closing' before swap, then 'closed'/'failed' after
//     → if executor crashes mid-swap, trade stays 'closing' not stuck 'open'
//   • resolveTokenAmount: on-chain first → stored fallback → retry on-chain after 3s
//     → handles propagation delay and missing tokens_received
//   • BUY filter: amount_sol=0 with valid mint ALWAYS passes (Cented/clukz WSOL trades)
//   • Stop-loss cron endpoint for server-side checks without Hetzner
//   • All safety limits unchanged

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { Keypair, VersionedTransaction } from "npm:@solana/web3.js@1.95.3";

const HELIUS_KEY = Deno.env.get("HELIUS_API_KEY") ?? "";
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUPITER   = "https://lite-api.jup.ag/swap/v1";
const SOL_MINT  = "So11111111111111111111111111111111111111112";
const LAMPORTS  = 1_000_000_000;

// ── SAFETY LIMITS ─────────────────────────────────────────────────────────────
const MAX_POSITIONS   = 20;
const MIN_TRADE_SOL   = 0.01;
const MIN_SIGNAL_SOL  = 0.1;
const STOP_LOSS_PCT   = -25;
const SLIPPAGE_BPS    = 1500;  // 15% — pump.fun snipes need room, avoids 0x1788 without sandwich bot risk

function timeoutSignal(ms: number) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const jsonResp = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// ── KEYPAIR ───────────────────────────────────────────────────────────────────
interface SolanaKeypair { publicKey: Uint8Array; secretKey: Uint8Array; }

function loadKeypair(): SolanaKeypair | null {
  const raw = Deno.env.get("SHREEM_BOT_KEYPAIR");
  if (!raw) { console.error("[KEYPAIR] SHREEM_BOT_KEYPAIR not set"); return null; }
  try {
    const t = raw.trim();
    let sk: Uint8Array;
    if (t.startsWith("["))     sk = new Uint8Array(JSON.parse(t));
    else if (t.includes(","))  sk = new Uint8Array(t.split(",").map(Number));
    else                       sk = bs58.decode(t);
    if (sk.length !== 64) { console.error("[KEYPAIR] Bad length:", sk.length); return null; }
    const kp = nacl.sign.keyPair.fromSecretKey(sk);
    console.log("[KEYPAIR] OK pubkey:", bs58.encode(kp.publicKey).slice(0, 8) + "...");
    return { publicKey: kp.publicKey, secretKey: kp.secretKey };
  } catch (e: any) { console.error("[KEYPAIR] Failed:", e.message); return null; }
}

// ── RPC ───────────────────────────────────────────────────────────────────────
const READ_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
];
const SEND_RPCS = [...READ_RPCS, HELIUS_RPC];

async function rpc(method: string, params: unknown[]) {
  const urls = (method === "sendTransaction") ? SEND_RPCS : READ_RPCS;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: timeoutSignal(8000),
      });
      const j = await r.json();
      if (j.error?.code === -32429 || j.error?.code === 429) { console.warn(`[RPC] ${url} rate-limited`); continue; }
      if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
      return j.result;
    } catch (e: any) { console.warn(`[RPC] ${url} failed: ${e.message}`); }
  }
  throw new Error(`RPC ${method} failed on all endpoints`);
}

// ── Jupiter ───────────────────────────────────────────────────────────────────
async function jupQuote(inputMint: string, outputMint: string, amount: number, slippage = SLIPPAGE_BPS) {
  const url = `${JUPITER}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}`;
  const r = await fetch(url, { signal: timeoutSignal(10000) });
  if (!r.ok) throw new Error(`Jupiter quote ${r.status}: ${await r.text()}`);
  return r.json();
}

async function jupSwapTx(quote: unknown, wallet: string) {
  const r = await fetch(`${JUPITER}/swap`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote, userPublicKey: wallet, wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true, computeUnitPriceMicroLamports: 1000000,
    }),
    signal: timeoutSignal(12000),
  });
  if (!r.ok) throw new Error(`Jupiter swap ${r.status}: ${await r.text()}`);
  return (await r.json()).swapTransaction as string;
}

async function signAndSend(txB64: string, kp: SolanaKeypair) {
  const keypair = Keypair.fromSecretKey(kp.secretKey);
  const tx = VersionedTransaction.deserialize(Buffer.from(txB64, "base64"));
  tx.sign([keypair]);
  const serialized = Buffer.from(tx.serialize()).toString("base64");
  return await rpc("sendTransaction", [serialized, {
    encoding: "base64",
    skipPreflight: true,
    maxRetries: 3,
    preflightCommitment: "confirmed",
  }]);
}

async function waitConfirm(sig: string, ms = 30000): Promise<boolean> {
  const deadline = Date.now() + ms;
  await new Promise(r => setTimeout(r, 8000));
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 6000));
    try {
      const res = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: true }]);
      const s = res?.value?.[0];
      if (s?.err) return false;
      if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") return true;
    } catch {}
  }
  return false;
}

// ── Resolve token amount for sell ─────────────────────────────────────────────
// v3: on-chain → stored → retry on-chain (handles WSOL propagation delay)
async function resolveTokenAmount(wallet: string, mint: string, tokensReceivedRaw: number | null): Promise<{ rawAmount: number; decimals: number }> {
  let rawAmount = 0;
  let decimals = 6;

  // Attempt 1: on-chain
  try {
    const taRes = await rpc("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed" }]);
    const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
    if (acct) { decimals = Number(acct.decimals); rawAmount = Number(acct.amount); }
  } catch (e: any) { console.warn("[resolveTokenAmount] on-chain read 1:", e.message); }

  // Attempt 2: stored DB value
  if (!rawAmount && tokensReceivedRaw) {
    rawAmount = Math.floor(Number(tokensReceivedRaw));
    console.log(`[resolveTokenAmount] Using stored tokens_received: ${rawAmount}`);
  }

  // Attempt 3: retry on-chain after delay (propagation lag)
  if (!rawAmount) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const taRes2 = await rpc("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed" }]);
      const acct2 = taRes2?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
      if (acct2) { decimals = Number(acct2.decimals); rawAmount = Number(acct2.amount); }
      if (rawAmount) console.log(`[resolveTokenAmount] Retry on-chain: ${rawAmount}`);
    } catch {}
  }

  return { rawAmount, decimals };
}

// ── SELL position ─────────────────────────────────────────────────────────────
// v3: marks status='closing' before swap so no position gets stuck 'open' on crash
async function sellPosition(pos: any, kp: SolanaKeypair, wallet: string, reason: string): Promise<{ ok: boolean; solOut: number; error?: string }> {
  console.log(`[SELL] Starting: ${pos.symbol} | reason=${reason} | id=${pos.id}`);

  // v3: mark 'closing' BEFORE swap — prevents stuck-open on crash
  await sb.from("shreem_brzee_live_trades").update({ status: "closing" }).eq("id", pos.id);

  const { rawAmount, decimals } = await resolveTokenAmount(wallet, pos.mint, pos.tokens_received);

  if (!rawAmount || rawAmount < 1) {
    console.log(`[SELL] No tokens for ${pos.symbol} after 3 attempts — marking closed`);
    await sb.from("shreem_brzee_live_trades").update({
      status: "closed", sell_reason: reason + "_no_balance", closed_at: new Date().toISOString(),
    }).eq("id", pos.id);
    return { ok: true, solOut: 0 };
  }

  try {
    const quote = await jupQuote(pos.mint, SOL_MINT, rawAmount, 500); // 5% slippage on sell
    const swapTx = await jupSwapTx(quote, wallet);
    const txSig = await signAndSend(swapTx, kp);
    const confirmed = await waitConfirm(txSig);
    const solOut = Number(quote.outAmount) / LAMPORTS;
    const sizeIn = Number(pos.amount_sol) || 0;
    const pnlSol = solOut - sizeIn;
    const pnlPct = sizeIn > 0 ? (pnlSol / sizeIn) * 100 : 0;

    await sb.from("shreem_brzee_live_trades").update({
      status: confirmed ? "closed" : "unconfirmed_close",
      sell_reason: reason, exit_price: null,
      pnl_sol: pnlSol, pnl_pct: pnlPct,
      closed_at: new Date().toISOString(),
      tx_sig_close: txSig,
    }).eq("id", pos.id);

    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
    if (sess) {
      await sb.from("shreem_brzee_session").update({
        portfolio:  Number(sess.portfolio ?? 0) + solOut,
        wins:   Number(sess.wins ?? 0)   + (pnlSol > 0 ? 1 : 0),
        losses: Number(sess.losses ?? 0) + (pnlSol <= 0 ? 1 : 0),
        updated_at: new Date().toISOString(),
      }).eq("id", "default");
    }

    console.log(`[SELL] ✅ ${pos.symbol} pnl=${pnlPct.toFixed(1)}% sol_out=${solOut.toFixed(4)} tx=${txSig.slice(0,16)} confirmed=${confirmed}`);
    return { ok: true, solOut };
  } catch (e: any) {
    console.error(`[SELL] ❌ ${pos.symbol} failed: ${e.message}`);
    // v3: revert to 'open' if swap failed so next cron cycle can retry
    await sb.from("shreem_brzee_live_trades").update({ status: "open" }).eq("id", pos.id).eq("status", "closing");
    return { ok: false, solOut: 0, error: e.message };
  }
}

// ── Price fetch ───────────────────────────────────────────────────────────────
async function fetchPriceUsd(mint: string): Promise<number> {
  try {
    const r = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`, { signal: timeoutSignal(5000) });
    if (r.ok) {
      const j = await r.json();
      const entry: any = Object.values(j || {})[0];
      const p = parseFloat(entry?.usdPrice || entry?.price || 0);
      if (p > 0) return p;
    }
  } catch {}
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { signal: timeoutSignal(6000) });
    if (r.ok) {
      const pairs = ((await r.json())?.pairs || []).filter((p: any) => p?.priceUsd && parseFloat(p.priceUsd) > 0);
      if (pairs.length) {
        pairs.sort((a: any, b: any) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0));
        const p = parseFloat(pairs[0].priceUsd);
        if (p > 0) return p;
      }
    }
  } catch {}
  return 0;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname;

  // ── HEALTH CHECK ────────────────────────────────────────────────────────────
  if (req.method === "GET" && path.endsWith("/health")) {
    const kp = loadKeypair();
    if (!kp) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not set" });
    const wallet = bs58.encode(kp.publicKey);
    let balance = 0;
    try { const r = await rpc("getBalance", [wallet]); balance = r.value / LAMPORTS; } catch {}
    const { data: open } = await sb.from("shreem_brzee_live_trades").select("id,symbol,amount_sol,status").in("status", ["open","pending","unconfirmed","closing"]);
    return jsonResp({ ok: true, wallet, balance_sol: balance, open_positions: open?.length ?? 0, open, version: "v3.5", limits: { min_signal_sol: MIN_SIGNAL_SOL, min_trade_sol: MIN_TRADE_SOL, stop_loss_pct: STOP_LOSS_PCT } });
  }

  // ── CRON — stop-loss check without Hetzner ──────────────────────────────────
  // Called by Supabase cron every 5 min as server-side fallback
  // Auth: CRON_SECRET env var — set in Supabase secrets, passed by pg_cron
  // Falls back to service role key check if CRON_SECRET not set
  if (req.method === "GET" && path.endsWith("/cron-stoploss")) {
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const validSecret = CRON_SECRET ? token === CRON_SECRET : token === SERVICE_ROLE;
    if (!validSecret) {
      console.warn("[cron-stoploss] Unauthorized call — bad or missing secret");
      return jsonResp({ ok: false, error: "unauthorized" }, 401);
    }
    const kp = loadKeypair();
    if (!kp) return jsonResp({ ok: false, error: "no keypair" });
    const wallet = bs58.encode(kp.publicKey);

    const { data: openPos } = await sb.from("shreem_brzee_live_trades")
      .select("*").in("status", ["open","unconfirmed"]);

    if (!openPos?.length) return jsonResp({ ok: true, checked: 0 });

    let closed = 0;
    const results: any[] = [];
    const now = Date.now();

    for (const pos of openPos) {
      // 48h timeout
      const ageH = (now - new Date(pos.opened_at || pos.created_at).getTime()) / 3_600_000;
      if (ageH >= 48) {
        const r = await sellPosition(pos, kp, wallet, "timeout_48h");
        closed++; results.push({ id: pos.id, reason: "timeout_48h", ok: r.ok });
        continue;
      }

      if (!pos.entry_price || !pos.mint) continue;

      const currentPrice = await fetchPriceUsd(pos.mint);
      if (!currentPrice) continue;

      const changePct = ((currentPrice - Number(pos.entry_price)) / Number(pos.entry_price)) * 100;
      if (changePct <= STOP_LOSS_PCT) {
        console.log(`[cron-stoploss] ${pos.symbol} down ${changePct.toFixed(1)}% — stop-loss`);
        const r = await sellPosition(pos, kp, wallet, "stoploss_25pct");
        closed++; results.push({ id: pos.id, reason: "stoploss", pnlPct: changePct.toFixed(1), ok: r.ok });
      }
      // No take-profit — follow whale SELL mirror only. They know when to exit.
    }

    return jsonResp({ ok: true, checked: openPos.length, closed, results, ts: new Date().toISOString() });
  }

  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const kp = loadKeypair();
  if (!kp) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not configured" }, 400);
  const wallet = bs58.encode(kp.publicKey);

  // ── CLOSE / SELL ────────────────────────────────────────────────────────────
  if (body?.action === "close" || body?.action === "sell") {
    const reason = body?.reason ?? "manual";
    // v3: also look for 'closing' status trades (crash recovery)
    let q = sb.from("shreem_brzee_live_trades").select("*").in("status", ["open","pending","unconfirmed","closing"]);
    if (body?.trade_id) q = q.eq("id", body.trade_id);
    else if (body?.mint)  q = q.eq("mint", body.mint);

    const { data: trades, error: qErr } = await q;
    if (qErr) return jsonResp({ ok: false, error: qErr.message }, 500);
    if (!trades?.length) return jsonResp({ ok: true, skipped: true, reason: "no matching open trade" });

    const results = [];
    for (const pos of trades) {
      const r = await sellPosition(pos, kp, wallet, reason);
      results.push({ symbol: pos.symbol, ...r });
    }
    return jsonResp({ ok: true, closed: results.length, results });
  }

  // ── BUY — called by webhook on whale BUY signal ────────────────────────────
  try {
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
    if (!sess)           return jsonResp({ ok: false, error: "No session" });
    if (sess.stopped_at) return jsonResp({ ok: false, skipped: true, reason: "Session stopped" });
    if (sess.mode !== "live") return jsonResp({ ok: false, skipped: true, reason: "Not in live mode" });

    const sig = body?.direct_signal;
    if (!sig?.mint) return jsonResp({ ok: true, skipped: true, reason: "No signal" });

    // ── SAFETY CHECKS ──────────────────────────────────────────────────────────
    // v3: amount_sol=0 WITH valid mint = WSOL/Jupiter trade (Cented, clukz) — ALWAYS execute
    // Only skip if no mint AND amount too small (true spam with no token info)
    if (!sig.mint && Number(sig.amount_sol ?? 0) < MIN_SIGNAL_SOL) {
      console.log(`[BUY] SKIP — no mint and signal too small: ${sig.amount_sol} SOL`);
      return jsonResp({ ok: true, skipped: true, reason: "No mint and signal too small" });
    }

    const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    if (sig.mint === USDC) return jsonResp({ ok: true, skipped: true, reason: "USDC — not trading" });

    const { data: openTrades } = await sb.from("shreem_brzee_live_trades").select("id,mint,amount_sol,symbol").in("status", ["open","pending","unconfirmed","closing"]);
    const openExposureSol = (openTrades ?? []).reduce((s: number, t: any) => s + (Number(t.amount_sol) || 0), 0);
    const balForCap = (await rpc("getBalance", [wallet])).value / LAMPORTS;
    const maxExposure = balForCap * 0.50;
    if (openExposureSol >= maxExposure) {
      console.log(`[BUY] SKIP — 50% cap: ${openExposureSol.toFixed(4)}/${maxExposure.toFixed(4)} SOL in ${openTrades?.length} trades`);
      return jsonResp({ ok: true, skipped: true, reason: `50% cap (${openTrades?.length} open, ${openExposureSol.toFixed(3)} SOL)` });
    }

    const dupMint = openTrades?.find(t => t.mint === sig.mint);
    if (dupMint) return jsonResp({ ok: true, skipped: true, reason: "Already have position in this token" });

    const { data: dupSig } = await sb.from("shreem_brzee_live_trades").select("id").eq("sig", sig.sig + "_live").limit(1);
    if (dupSig?.length) return jsonResp({ ok: true, skipped: true, reason: "Signal already executed" });

    const balRes = await rpc("getBalance", [wallet]);
    const balSol = balRes.value / LAMPORTS;
    console.log(`[BUY] Wallet balance: ${balSol} SOL | signal: ${sig.symbol ?? sig.mint.slice(0,8)} | amount_sol=${sig.amount_sol}`);

    if (balSol < MIN_TRADE_SOL + 0.003) {
      return jsonResp({ ok: false, error: `Insufficient balance: ${balSol.toFixed(4)} SOL` });
    }

    const size = Math.min(0.1, Math.max(0.01, balSol * 0.05));
    if (size < MIN_TRADE_SOL) {
      return jsonResp({ ok: false, error: `Trade size ${size.toFixed(4)} below minimum ${MIN_TRADE_SOL}` });
    }

    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[BUY] Executing: ${sig.symbol ?? sig.mint.slice(0,8)} | ${size.toFixed(4)} SOL | wallet=${wallet.slice(0,8)}`);

    // STEP 1: Write intent
    const tradeId = crypto.randomUUID();
    const intentRecord = {
      id:         tradeId,
      session_id: "default",
      sig:        sig.sig + "_live",
      mint:       sig.mint,
      symbol:     sig.symbol ?? null,
      label:      sig.label ?? null,
      wallet:     sig.wallet ?? null,
      action:     "BUY",
      amount_sol: size,
      status:     "open",
      opened_at:  new Date().toISOString(),
      slippage_pct: SLIPPAGE_BPS / 100,
    };

    const { error: intentErr } = await sb.from("shreem_brzee_live_trades").upsert(intentRecord, { onConflict: "sig" });
    if (intentErr) console.error("[BUY] DB intent write failed:", intentErr.message);
    else console.log("[BUY] Intent recorded:", tradeId);

    // STEP 2: Quote
    const quote = await jupQuote(SOL_MINT, sig.mint, lamports);
    // Slippage guard removed — with 10% SLIPPAGE_BPS, this check is never needed
    // and was causing valid meme coin trades to be rejected

    // STEP 3: Execute
    const swapTx = await jupSwapTx(quote, wallet);
    const txSig  = await signAndSend(swapTx, kp);
    console.log(`[BUY] Tx sent: ${txSig.slice(0, 20)}...`);
    const confirmed = await waitConfirm(txSig);

    // STEP 4: Fetch token decimals
    let tokenDecimals = 6;
    try {
      const metaR = await fetch(`https://lite-api.jup.ag/price/v3?ids=${sig.mint}`, { signal: timeoutSignal(5000) });
      if (metaR.ok) {
        const metaJ = await metaR.json();
        const d = (Object.values(metaJ || {})[0] as any)?.decimals;
        if (d != null) tokenDecimals = Number(d);
      }
    } catch {}

    const tokensHuman = Number(quote.outAmount) / Math.pow(10, tokenDecimals);
    let solUsd = 150;
    try {
      const pr = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", { signal: timeoutSignal(4000) });
      if (pr.ok) { solUsd = parseFloat((await pr.json()).price) || 150; }
    } catch {}

    const entryPrice = tokensHuman > 0 ? (size * solUsd) / tokensHuman : null;

    // STEP 5: Update DB
    const { error: updateErr } = await sb.from("shreem_brzee_live_trades").update({
      tx_sig:          txSig,
      entry_price:     entryPrice,
      tokens_received: Number(quote.outAmount), // raw units from Jupiter
      token_decimals:  tokenDecimals,
      sol_usd_at_entry: solUsd,
      status:          "open",
    }).eq("id", tradeId);

    if (updateErr) {
      console.error("[BUY] ⚠️ DB update failed after swap:", updateErr.message);
      console.error("[BUY] SWAP EXECUTED — tx:", txSig, "size:", size, "token:", sig.symbol);
    }

    await sb.from("shreem_brzee_session").update({
      portfolio:  Number(sess.portfolio ?? 0) - size,
      updated_at: new Date().toISOString(),
    }).eq("id", "default");

    console.log(`[BUY] ✅ ${sig.symbol ?? sig.mint.slice(0,8)} | ${size.toFixed(4)} SOL | tx: ${txSig.slice(0,16)} | confirmed: ${confirmed}`);
    return jsonResp({ ok: true, confirmed, tx: txSig, symbol: sig.symbol, amount_sol: size, wallet, version: "v3.5" });

  } catch (e: any) {
    console.error("[BUY] ❌ Error:", e.message);
    try {
      const sig = body?.direct_signal;
      if (sig?.sig) {
        await sb.from("shreem_brzee_live_trades").update({ status: "failed", sell_reason: "execution_error" })
          .eq("sig", sig.sig + "_live").not("status", "eq", "closed");
      }
    } catch {}
    return jsonResp({ ok: false, error: e.message }, 500);
  }
});




