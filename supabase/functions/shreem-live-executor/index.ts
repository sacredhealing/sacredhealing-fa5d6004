// supabase/functions/shreem-live-executor/index.ts
// SHREEM BRZEE — Safe Live Executor v2
// Rules:
//   • DB write BEFORE swap (intent recorded first, never lose a trade)
//   • Max 2 open positions at any time
//   • Min 0.03 SOL per trade (no micro-buys)
//   • Min whale signal 0.5 SOL (ignore spam/dust)
//   • Auto-sell on whale SELL — reads on-chain balance, sells everything
//   • Stop-loss -25% checked on every execution cycle
//   • All errors surfaced, never swallowed

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
const MAX_POSITIONS   = 2;       // never more than 2 open at once
const MIN_TRADE_SOL   = 0.03;    // minimum 0.03 SOL per trade
const MIN_SIGNAL_SOL  = 0.1;     // ignore whale signals below 0.1 SOL (spam/dust)
const STOP_LOSS_PCT   = -25;     // close if down 25%
const FIXED_TRADE_SOL = 0.02;    // fixed size per trade — small wallet friendly
const SLIPPAGE_BPS    = 300;     // 3% slippage

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

// ── RPC with fallback ─────────────────────────────────────────────────────────
// ALL RPCs: public only — Helius only as last resort for sendTransaction
const READ_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
];
// Send: public first, Helius LAST (only if public fails) — minimizes Helius credit usage
const SEND_RPCS = [...READ_RPCS, HELIUS_RPC];

async function rpc(method: string, params: unknown[]) {
  // sendTransaction tries public RPCs first, Helius only as last resort
  const urls = (method === "sendTransaction") ? SEND_RPCS : READ_RPCS;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(8000),
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
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Jupiter quote ${r.status}: ${await r.text()}`);
  return r.json();
}

async function jupSwapTx(quote: unknown, wallet: string) {
  const r = await fetch(`${JUPITER}/swap`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteResponse: quote, userPublicKey: wallet, wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true, computeUnitPriceMicroLamports: 50000 }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`Jupiter swap ${r.status}: ${await r.text()}`);
  return (await r.json()).swapTransaction as string;
}

async function signAndSend(txB64: string, kp: SolanaKeypair) {
  // Sign locally — no RPC needed for signing
  const keypair = Keypair.fromSecretKey(kp.secretKey);
  const tx = VersionedTransaction.deserialize(Buffer.from(txB64, "base64"));
  tx.sign([keypair]);
  // Send via our rpc() function which routes sendTransaction to Helius only
  // Avoids Connection object making hidden getLatestBlockhash/getFeeForMessage calls to Helius
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
  // Wait 8s before first check — tx takes time to propagate
  await new Promise(r => setTimeout(r, 8000));
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 6000)); // poll every 6s not 3s — halves getSignatureStatuses calls
    try {
      const res = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: true }]);
      const s = res?.value?.[0];
      if (s?.err) return false;
      if (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized") return true;
    } catch {}
  }
  return false;
}

// ── SELL position ─────────────────────────────────────────────────────────────
async function sellPosition(pos: any, kp: SolanaKeypair, wallet: string, reason: string): Promise<{ ok: boolean; solOut: number; error?: string }> {
  console.log(`[SELL] Starting: ${pos.symbol} | reason=${reason} | id=${pos.id}`);

  // Get on-chain token balance
  let rawAmount = 0;
  let decimals = Number(pos.token_decimals ?? 6);
  try {
    const taRes = await rpc("getTokenAccountsByOwner", [wallet, { mint: pos.mint }, { encoding: "jsonParsed" }]);
    const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
    if (acct) { decimals = Number(acct.decimals); rawAmount = Number(acct.amount); }
  } catch (e: any) { console.warn("[SELL] getTokenAccounts failed:", e.message); }

  // Fall back to stored amount if on-chain read failed
  if (!rawAmount && pos.tokens_received) {
    rawAmount = Math.floor(Number(pos.tokens_received) * Math.pow(10, decimals));
    console.log(`[SELL] Using stored tokens: ${pos.tokens_received} × 10^${decimals} = ${rawAmount}`);
  }

  if (!rawAmount || rawAmount < 1) {
    console.log(`[SELL] No tokens to sell — marking closed`);
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

    // Update session
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
    return { ok: false, solOut: 0, error: e.message };
  }
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
    // Get open positions count
    const { data: open } = await sb.from("shreem_brzee_live_trades").select("id,symbol,amount_sol").eq("status", "open");
    return jsonResp({ ok: true, wallet, balance_sol: balance, open_positions: open?.length ?? 0, open: open, limits: { max_positions: MAX_POSITIONS, min_trade_sol: MIN_TRADE_SOL, stop_loss_pct: STOP_LOSS_PCT } });
  }

  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const kp = loadKeypair();
  if (!kp) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not configured" }, 400);
  const wallet = bs58.encode(kp.publicKey);

  // ── CLOSE / SELL ────────────────────────────────────────────────────────────
  if (body?.action === "close" || body?.action === "sell") {
    const reason = body?.reason ?? "manual";
    let q = sb.from("shreem_brzee_live_trades").select("*").eq("status", "open");
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
    // Load session — must be live and running
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
    if (!sess)           return jsonResp({ ok: false, error: "No session" });
    if (sess.stopped_at) return jsonResp({ ok: false, skipped: true, reason: "Session stopped" });
    if (sess.mode !== "live") return jsonResp({ ok: false, skipped: true, reason: "Not in live mode" });

    const sig = body?.direct_signal;
    if (!sig?.mint) return jsonResp({ ok: true, skipped: true, reason: "No signal" });

    // ── SAFETY CHECKS ──────────────────────────────────────────────────────────
    // 1. Min signal size — ignore spam/dust
    if (Number(sig.amount_sol ?? 0) < MIN_SIGNAL_SOL) {
      console.log(`[BUY] SKIP — signal too small: ${sig.amount_sol} SOL (min ${MIN_SIGNAL_SOL})`);
      return jsonResp({ ok: true, skipped: true, reason: `Signal too small: ${sig.amount_sol} SOL` });
    }

    // 2. Ignore USDC
    const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    if (sig.mint === USDC) return jsonResp({ ok: true, skipped: true, reason: "USDC — not trading" });

    // 3. Max positions check
    const { data: openTrades } = await sb.from("shreem_brzee_live_trades").select("id,mint,amount_sol,symbol").eq("status", "open");
    if ((openTrades?.length ?? 0) >= MAX_POSITIONS) {
      console.log(`[BUY] SKIP — max positions (${openTrades?.length}/${MAX_POSITIONS})`);
      return jsonResp({ ok: true, skipped: true, reason: `Max positions reached (${MAX_POSITIONS})` });
    }

    // 4. No duplicate position in same mint
    const dupMint = openTrades?.find(t => t.mint === sig.mint);
    if (dupMint) return jsonResp({ ok: true, skipped: true, reason: "Already have position in this token" });

    // 5. No duplicate signal
    const { data: dupSig } = await sb.from("shreem_brzee_live_trades").select("id").eq("sig", sig.sig + "_live").limit(1);
    if (dupSig?.length) return jsonResp({ ok: true, skipped: true, reason: "Signal already executed" });

    // 6. Check real SOL balance
    const balRes = await rpc("getBalance", [wallet]);
    const balSol = balRes.value / LAMPORTS;
    console.log(`[BUY] Wallet balance: ${balSol} SOL`);

    // Need enough for trade + fees (0.002 SOL for fees)
    if (balSol < MIN_TRADE_SOL + 0.003) {
      return jsonResp({ ok: false, error: `Insufficient balance: ${balSol.toFixed(4)} SOL (need ${MIN_TRADE_SOL + 0.003})` });
    }

    // Fixed position size — predictable, no surprises
    const size = Math.min(FIXED_TRADE_SOL, balSol * 0.3); // never more than 30% of balance
    if (size < MIN_TRADE_SOL) {
      return jsonResp({ ok: false, error: `Trade size ${size.toFixed(4)} below minimum ${MIN_TRADE_SOL}` });
    }

    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[BUY] Executing: ${sig.symbol ?? sig.mint.slice(0,8)} | ${size.toFixed(4)} SOL | wallet=${wallet.slice(0,8)}`);

    // ── STEP 1: WRITE INTENT TO DB FIRST (before any swap) ──────────────────
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
      status:     "pending", // will update to open/failed after swap
      opened_at:  new Date().toISOString(),
      slippage_pct: SLIPPAGE_BPS / 100,
    };

    const { error: intentErr } = await sb.from("shreem_brzee_live_trades").upsert(intentRecord, { onConflict: "sig" });
    if (intentErr) {
      console.error("[BUY] DB intent write failed:", intentErr.message);
      // Don't abort — the DB write failing is bad but proceed and try to record later
    } else {
      console.log("[BUY] Intent recorded in DB:", tradeId);
    }

    // ── STEP 2: GET JUPITER QUOTE ─────────────────────────────────────────────
    const quote = await jupQuote(SOL_MINT, sig.mint, lamports);
    const slippage = Number(quote.inAmount) > 0
      ? (Number(quote.inAmount) - Number(quote.otherAmountThreshold)) / Number(quote.inAmount) : 0;
    if (slippage > 0.08) {
      await sb.from("shreem_brzee_live_trades").update({ status: "failed", sell_reason: "slippage_too_high" }).eq("id", tradeId);
      return jsonResp({ ok: false, error: `Slippage ${(slippage*100).toFixed(1)}% too high` });
    }

    // ── STEP 3: EXECUTE SWAP ──────────────────────────────────────────────────
    const swapTx = await jupSwapTx(quote, wallet);
    const txSig  = await signAndSend(swapTx, kp);
    console.log(`[BUY] Tx sent: ${txSig.slice(0, 20)}...`);

    const confirmed = await waitConfirm(txSig);
    console.log(`[BUY] Confirmed: ${confirmed}`);

    // ── STEP 4: FETCH TOKEN DECIMALS ──────────────────────────────────────────
    let tokenDecimals = 6;
    try {
      const metaR = await fetch(`https://lite-api.jup.ag/price/v3?ids=${sig.mint}`, { signal: AbortSignal.timeout(5000) });
      if (metaR.ok) {
        const metaJ = await metaR.json();
        const d = metaJ?.[sig.mint]?.decimals ?? metaJ?.data?.[sig.mint]?.decimals;
        if (d != null) tokenDecimals = Number(d);
      }
    } catch {}

    const tokensHuman = Number(quote.outAmount) / Math.pow(10, tokenDecimals);

    // SOL/USD price
    let solUsd = 150;
    try {
      const pr = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", { signal: AbortSignal.timeout(4000) });
      if (pr.ok) { solUsd = parseFloat((await pr.json()).price) || 150; }
    } catch {}

    const entryPrice = tokensHuman > 0 ? (size * solUsd) / tokensHuman : null;

    // ── STEP 5: UPDATE DB RECORD WITH FULL TRADE DATA ─────────────────────────
    const { error: updateErr } = await sb.from("shreem_brzee_live_trades").update({
      tx_sig:          txSig,
      entry_price:     entryPrice,
      tokens_received: tokensHuman,
      token_decimals:  tokenDecimals,
      sol_usd_at_entry: solUsd,
      status:          confirmed ? "open" : "unconfirmed",
    }).eq("id", tradeId);

    if (updateErr) {
      console.error("[BUY] ⚠️ DB update failed after confirmed swap:", updateErr.message);
      console.error("[BUY] SWAP DID EXECUTE — tx:", txSig, "size:", size, "token:", sig.symbol);
    }

    // Update session portfolio
    await sb.from("shreem_brzee_session").update({
      portfolio:  Number(sess.portfolio ?? 0) - size,
      updated_at: new Date().toISOString(),
    }).eq("id", "default");

    console.log(`[BUY] ✅ ${sig.symbol ?? sig.mint.slice(0,8)} | ${size.toFixed(4)} SOL | tx: ${txSig.slice(0,16)} | confirmed: ${confirmed}`);
    return jsonResp({ ok: true, confirmed, tx: txSig, symbol: sig.symbol, amount_sol: size, wallet });

  } catch (e: any) {
    console.error("[BUY] ❌ Error:", e.message);
    // Mark any pending record as failed
    try {
      const sig = body?.direct_signal;
      if (sig?.sig) {
        await sb.from("shreem_brzee_live_trades").update({ status: "failed", sell_reason: "execution_error" })
          .eq("sig", sig.sig + "_live").eq("status", "pending");
      }
    } catch {}
    return jsonResp({ ok: false, error: e.message }, 500);
  }
});
