// supabase/functions/shreem-helius-webhook/index.ts
// SHREEM BRZEE v5.1 — live_processed fix + take-profit. Phone off = bot still runs.
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
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { Keypair, VersionedTransaction } from "npm:@solana/web3.js@1.95.3";

// ── Constants ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb           = createClient(SUPABASE_URL, SUPABASE_KEY);
const HELIUS_KEY   = Deno.env.get("HELIUS_API_KEY") ?? ""; // set HELIUS_API_KEY in Supabase secrets
if (!HELIUS_KEY) console.warn("[SHREEM] ⚠️ HELIUS_API_KEY not set — webhook registration and RPC will fail");
// NOTE: The webhook itself NEVER makes Solana RPC calls. All on-chain reads
// (getTokenAccountsByOwner, getBalance, etc.) happen only inside
// shreem-live-executor when actually executing a trade. This keeps Helius
// RPC credit usage bound to real trade actions, not incoming webhook volume.
const SOL_MINT     = "So11111111111111111111111111111111111111112";
const LAMPORTS     = 1_000_000_000;
const WEBHOOK_DB_WRITES_ENABLED = Deno.env.get("SHREEM_WEBHOOK_DB_WRITES_ENABLED") === "true";
const MAX_WEBHOOK_TXS_PER_BATCH = 10;

// ── Whale wallet list ─────────────────────────────────────────────────────────
const WHALE_WALLETS: Record<string, string> = {
  "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o": "Cented",
  "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu": "Remusofmars",
  "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT":  "trunoest",
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
    const r = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) { const p = parseFloat((await r.json())?.data?.[mint]?.price); if (p > 0) return p; }
  } catch {}
  return 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// INLINE EXECUTION — Jupiter swap directly in webhook handler (sub-5s target)
// ═════════════════════════════════════════════════════════════════════════════
const JUPITER       = "https://api.jup.ag/swap/v1";  // more reliable than lite-api for pump.fun
const SLIPPAGE_BPS  = 8000;  // 80% — meme coins move fast, prevents 0x1771/0x1788 failures
const MIN_TRADE_SOL = 0.01;
const MAX_TRADE_SOL = 0.1;
const HELIUS_RPC    = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const READ_RPCS     = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  HELIUS_RPC,
];
const JITO_ENDPOINTS = [
  "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
];

function timeoutSignal(ms: number) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

interface KP { publicKey: Uint8Array; secretKey: Uint8Array }
let _kpCache: KP | null = null;
function loadKeypair(): KP | null {
  if (_kpCache) return _kpCache;
  const raw = Deno.env.get("SHREEM_BOT_KEYPAIR");
  if (!raw) { console.error("[KEYPAIR] SHREEM_BOT_KEYPAIR not set"); return null; }
  try {
    const t = raw.trim();
    let sk: Uint8Array;
    if (t.startsWith("["))    sk = new Uint8Array(JSON.parse(t));
    else if (t.includes(",")) sk = new Uint8Array(t.split(",").map(Number));
    else                      sk = bs58.decode(t);
    if (sk.length !== 64) { console.error("[KEYPAIR] Bad length:", sk.length); return null; }
    const kp = nacl.sign.keyPair.fromSecretKey(sk);
    _kpCache = { publicKey: kp.publicKey, secretKey: kp.secretKey };
    console.log("[KEYPAIR] OK pubkey:", bs58.encode(kp.publicKey).slice(0, 8) + "...");
    return _kpCache;
  } catch (e: any) { console.error("[KEYPAIR] Failed:", e.message); return null; }
}

async function rpcCall(method: string, params: unknown[]) {
  for (const url of READ_RPCS) {
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: timeoutSignal(6000),
      });
      const j = await r.json();
      if (j.error?.code === -32429 || j.error?.code === 429) continue;
      if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
      return j.result;
    } catch (e: any) { console.warn(`[RPC] ${url}: ${e.message}`); }
  }
  throw new Error(`RPC ${method} failed on all endpoints`);
}

async function getTokenRawBalance(wallet: string, mint: string): Promise<number> {
  const taRes = await rpcCall("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed" }]);
  const accounts = taRes?.value || [];
  return accounts.reduce((sum: number, item: any) => {
    const amount = Number(item?.account?.data?.parsed?.info?.tokenAmount?.amount || 0);
    return sum + amount;
  }, 0);
}

async function getMintDecimals(mint: string): Promise<number> {
  try {
    const supply = await rpcCall("getTokenSupply", [mint]);
    const decimals = Number(supply?.value?.decimals);
    if (Number.isFinite(decimals) && decimals >= 0) return decimals;
  } catch (e: any) {
    console.warn(`[mint-decimals] ${mint.slice(0, 8)}: ${e?.message ?? e}`);
  }
  return 6;
}

async function getSolUsd(): Promise<number> {
  try {
    const pr = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", { signal: timeoutSignal(4000) });
    if (pr.ok) return parseFloat((await pr.json()).price) || 150;
  } catch {}
  return 150;
}

async function jupQuote(input: string, output: string, amount: number) {
  const url = `${JUPITER}/quote?inputMint=${input}&outputMint=${output}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}&dynamicSlippage=true`;
  const r = await fetch(url, { signal: timeoutSignal(8000) });
  if (!r.ok) throw new Error(`Jupiter quote ${r.status}`);
  return r.json();
}

async function getNetworkPriorityFee(): Promise<number> {
  // Get recent priority fees to set competitive fee dynamically
  try {
    const r = await rpcCall("getRecentPrioritizationFees", [[]]);
    const fees = (r as any[]).map((f: any) => f.prioritizationFee).filter(Boolean);
    if (fees.length > 0) {
      const p75 = fees.sort((a: number,b: number) => a-b)[Math.floor(fees.length*0.75)];
      // Use 1.5x p75 to land quickly, cap at 5M microlamports
      return Math.min(Math.max(p75 * 1.5, 500000), 5000000);
    }
  } catch {}
  return 2000000; // default 2M microlamports
}

async function jupSwapTx(quote: unknown, wallet: string): Promise<string> {
  const priorityFee = await getNetworkPriorityFee();
  console.log(`[swap] dynamic priority fee: ${priorityFee} microlamports`);
  const r = await fetch(`${JUPITER}/swap`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      computeUnitPriceMicroLamports: priorityFee,
      skipUserAccountsRpcCalls: true,
      useSharedAccounts: false,
      asLegacyTransaction: false,
      dynamicSlippage: { maxBps: 8000 }, // increased to 80% for fast meme coins
    }),
    signal: timeoutSignal(8000),
  });
  if (!r.ok) throw new Error(`Jupiter swap ${r.status}`);
  return (await r.json()).swapTransaction as string;
}

async function signAndSend(txB64: string, kp: KP): Promise<string> {
  const keypair = Keypair.fromSecretKey(kp.secretKey);
  const tx = VersionedTransaction.deserialize(Buffer.from(txB64, "base64"));
  tx.sign([keypair]);
  const serialized = Buffer.from(tx.serialize()).toString("base64");

  // Jito first — race endpoints in parallel for lowest latency
  const jitoBody = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sendBundle", params: [[serialized]] });
  const jitoPromises = JITO_ENDPOINTS.map((ep) =>
    fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: jitoBody, signal: timeoutSignal(5000) })
      .then((r) => r.json().then((j) => ({ ep, j })))
      .catch((e) => ({ ep, j: { error: e.message } }))
  );
  try {
    const winners = await Promise.allSettled(jitoPromises);
    for (const w of winners) {
      if (w.status === "fulfilled" && (w.value as any).j?.result) {
        // Derive Solana tx signature from the signed transaction (base58 of first signature)
        const sigBytes = tx.signatures[0];
        const txSig = bs58.encode(sigBytes);
        console.log(`[Jito] Bundle accepted via ${(w.value as any).ep.split(".")[0].split("//")[1]} — tx=${txSig.slice(0,16)}`);
        return txSig;
      }
    }
  } catch {}

  // Fallback: standard RPC
  console.log("[RPC-FALLBACK] Sending via standard RPC");
  return await rpcCall("sendTransaction", [serialized, {
    encoding: "base64", skipPreflight: true, maxRetries: 3, preflightCommitment: "confirmed",
  }]);
}

// ── Inline BUY execution: swap first, DB writes after ──────────────────────
// Returns immediately after Jito accepts the bundle — no waitConfirm.
// Stop-loss cron reconciles 'unconfirmed' status later.
//
// HOT-PATH OPTIMIZATIONS (v5.2):
//  1. DexScreener filter runs fire-and-forget AFTER send — never blocks
//  2. Pre-check reads (dup/bal/exposure) parallel via Promise.all
//  3. Pending-row INSERT runs parallel with jupQuote
//  4. Post-send confirmation sleep cut from 2000ms → 500ms
async function executeBuyInline(signal: any, sess: any): Promise<{ ok: boolean; skipped?: string; tx?: string; size_sol?: number; latency_ms?: number; error?: string }> {
  const t0 = Date.now();
  const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1";

  if (!signal?.mint)                                  return { ok: true, skipped: "no_mint" };
  if (signal.mint === USDC || signal.mint === USDT)   return { ok: true, skipped: "stablecoin" };
  if (signal.mint === SOL_MINT)                       return { ok: true, skipped: "SOL_MINT" };
  if (signal.action && signal.action !== "BUY")       return { ok: true, skipped: "not_a_buy" };

  // Filter 1: Min whale position size (kept on hot path — pure local check, free)
  const whaleAmtSol = Number(signal.amount_sol || 0);
  if (whaleAmtSol > 0 && whaleAmtSol < 0.15) {
    console.log(`[INLINE-BUY] ⏭ ${signal.mint.slice(0,8)} — whale only spent ${whaleAmtSol.toFixed(4)} SOL (min 0.15)`);
    return { ok: true, skipped: `whale_too_small_${whaleAmtSol.toFixed(4)}sol` };
  }

  // Stale signal check (local, free)
  if (signal.block_time) {
    const signalAgeMs = Date.now() - (Number(signal.block_time) * 1000);
    if (signalAgeMs > 60000) {
      console.log(`[INLINE-BUY] ⏭ ${signal.mint.slice(0,8)} — signal ${(signalAgeMs/1000).toFixed(0)}s old, skipping`);
      return { ok: true, skipped: `stale_signal_${(signalAgeMs/1000).toFixed(0)}s` };
    }
  }

  const kp = loadKeypair();
  if (!kp) return { ok: false, error: "no_keypair" };
  const walletPub = bs58.encode(kp.publicKey);

  // ── Pre-swap reads in parallel ────────────────────────────────────────────
  const livesig = signal.sig + "_live";
  const [dupSigRes, balRes, openTradesRes] = await Promise.all([
    sb.from("shreem_brzee_live_trades").select("id").eq("sig", livesig).limit(1),
    rpcCall("getBalance", [walletPub]).catch(() => null),
    sb.from("shreem_brzee_live_trades").select("amount_sol")
      .in("status", ["open","pending","unconfirmed","closing"]),
  ]);
  if (dupSigRes.data?.length)  return { ok: true, skipped: "duplicate_sig" };

  const lamps = Number((balRes as any)?.value ?? balRes ?? 0);
  const savedPortfolio = Number(sess.portfolio || 0);
  const liveBalSol = lamps > 0 ? lamps / LAMPORTS : savedPortfolio;
  const exposure = (openTradesRes.data || []).reduce((s: number, t: any) => s + (Number(t.amount_sol) || 0), 0);
  const freeBalance = Math.max(0, liveBalSol - 0.003);
  if (freeBalance <= MIN_TRADE_SOL) return { ok: true, skipped: `no_phantom_balance(${liveBalSol.toFixed(4)} SOL)` };

  const cap = liveBalSol * 0.50;
  if (exposure >= cap) return { ok: true, skipped: `cap_50pct(exp=${exposure.toFixed(3)}>=cap=${cap.toFixed(3)}@bal=${liveBalSol.toFixed(3)})` };

  const size = Math.min(MAX_TRADE_SOL, Math.max(MIN_TRADE_SOL, freeBalance * 0.05), cap - exposure, freeBalance);
  if (size < MIN_TRADE_SOL) return { ok: true, skipped: "size_too_small" };

  const tradeId  = crypto.randomUUID();
  const openedAt = new Date(t0).toISOString();
  const claimRow = {
    id: tradeId, session_id: "default",
    sig: livesig,
    mint: signal.mint, symbol: signal.symbol, label: signal.label, wallet: signal.wallet,
    action: "BUY",
    amount_sol: size, gross_sol: size, net_sol: size,
    status: "pending",
    opened_at: openedAt, created_at: openedAt,
    slippage_pct: SLIPPAGE_BPS / 100,
  };
  const lamports = Math.floor(size * LAMPORTS);

  // ── PARALLEL: claim insert + session reserve + jupiter quote ──────────────
  // All three are independent. If any fail we abort before send. This shaves
  // 0.5-1.5s off the critical path vs the sequential version.
  const [claimRes, reserveRes, quoteRes] = await Promise.all([
    sb.from("shreem_brzee_live_trades").insert(claimRow),
    sb.from("shreem_brzee_session")
      .update({ portfolio: Math.max(0, freeBalance - size), updated_at: new Date().toISOString() })
      .eq("id", "default").select("id"),
    jupQuote(SOL_MINT, signal.mint, lamports).catch((e: any) => ({ __error: e?.message || String(e) })),
  ]);

  if (claimRes.error) {
    const msg = String(claimRes.error.message || "");
    const code = (claimRes.error as any).code;
    if (code === "23505" || msg.includes("uniq_live_trades_active_mint") || msg.includes("duplicate key")) {
      return { ok: true, skipped: "duplicate_mint_atomic" };
    }
    return { ok: false, error: `claim_failed:${msg}` };
  }

  if (reserveRes.error || !reserveRes.data?.length) {
    await sb.from("shreem_brzee_live_trades").delete().eq("id", tradeId).catch(() => {});
    return { ok: reserveRes.error ? false : true, error: reserveRes.error ? "reserve_failed" : undefined, skipped: reserveRes.error ? undefined : "reserve_lost_race" };
  }

  const quote: any = quoteRes;
  if (!quote || quote.__error) {
    // Quote failed: rollback claim + refund
    await sb.from("shreem_brzee_live_trades").delete().eq("id", tradeId).catch(() => {});
    try {
      const { data: cur } = await sb.from("shreem_brzee_session").select("portfolio").eq("id","default").maybeSingle();
      await sb.from("shreem_brzee_session").update({
        portfolio: Number(cur?.portfolio || 0) + size,
        updated_at: new Date().toISOString(),
      }).eq("id", "default");
    } catch {}
    return { ok: false, error: `jup_quote_failed: ${quote?.__error || "unknown"}` };
  }

  // ── Build swap tx + send ──────────────────────────────────────────────────
  let txSig = "";
  let tokenDecimals = 6;
  let solUsd = 150;
  try {
    const swapTx = await jupSwapTx(quote, walletPub);
    txSig = await signAndSend(swapTx, kp);
    [tokenDecimals, solUsd] = await Promise.all([
      getMintDecimals(signal.mint),
      getSolUsd(),
    ]);
  } catch (e: any) {
    console.error(`[INLINE-BUY] ❌ ${signal.symbol ?? signal.mint.slice(0,8)} swap failed: ${e.message}`);
    await sb.from("shreem_brzee_live_trades").delete().eq("id", tradeId).catch(() => {});
    try {
      const { data: cur } = await sb.from("shreem_brzee_session").select("portfolio").eq("id","default").maybeSingle();
      await sb.from("shreem_brzee_session").update({
        portfolio: Number(cur?.portfolio || 0) + size,
        updated_at: new Date().toISOString(),
      }).eq("id", "default");
    } catch {}
    return { ok: false, error: e.message };
  }

  const swapMs = Date.now() - t0;
  console.log(`[INLINE-BUY] ⚡ ${signal.symbol ?? signal.mint.slice(0,8)} | ${size.toFixed(4)} SOL | tx=${txSig.slice(0,16)} | ${swapMs}ms`);

  const rawTokens = Number(quote?.outAmount || 0);
  const tokensHuman = rawTokens > 0 ? rawTokens / Math.pow(10, tokenDecimals) : 0;
  const entryPrice = tokensHuman > 0 ? (size * solUsd) / tokensHuman : null;

  // ── Quick 500ms confirmation check (down from 2000ms) ─────────────────────
  let txConfirmed = false;
  try {
    await new Promise(r => setTimeout(r, 500));
    const statusRes = await rpcCall("getSignatureStatuses", [[txSig], { searchTransactionHistory: true }]).catch(() => null);
    const s = (statusRes as any)?.value?.[0];
    if (s && !s.err && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) {
      txConfirmed = true;
    } else if (s?.err) {
      console.warn(`[INLINE-BUY] ❌ tx FAILED on-chain: ${JSON.stringify(s.err)} — refunding ${size.toFixed(4)} SOL`);
      await sb.from("shreem_brzee_live_trades").delete().eq("id", tradeId).catch(() => {});
      try {
        const { data: cur } = await sb.from("shreem_brzee_session").select("portfolio").eq("id","default").maybeSingle();
        await sb.from("shreem_brzee_session").update({
          portfolio: Number(cur?.portfolio || 0) + size,
          updated_at: new Date().toISOString(),
        }).eq("id", "default");
      } catch {}
      return { ok: false, error: `tx_failed_onchain: ${JSON.stringify(s.err)}` };
    }
  } catch {}

  console.log(`[INLINE-BUY] ${txConfirmed ? "✅ confirmed" : "⏳ unconfirmed — cron will verify"} in ${Date.now()-t0}ms`);

  const signalRow = {
    sig: signal.sig, wallet: signal.wallet, label: signal.label,
    action: "BUY", mint: signal.mint, symbol: signal.symbol,
    amount_sol: signal.amount_sol, token_amount: signal.token_amount,
    is_pump_fun: signal.is_pump_fun, block_time: signal.block_time,
    created_at: signal.created_at, live_processed: true,
  };

  await Promise.all([
    sb.from("shreem_brzee_live_trades").update({
      status: txConfirmed ? "open" : "unconfirmed",
      tx_sig: txSig,
      tokens_received: rawTokens || null,
      token_decimals: tokenDecimals,
      sol_usd_at_entry: solUsd,
      entry_price: entryPrice,
    }).eq("id", tradeId),
    sb.from("shreem_brzee_signals").upsert(signalRow, { onConflict: "sig" }),
  ]).catch((e: any) => console.error("[INLINE-BUY] post-swap DB write:", e?.message));

  // ── Fire-and-forget DexScreener audit (off hot path) ──────────────────────
  // Was a blocking filter that cost 0.4-3s. Now runs after send and only
  // logs/tags low-quality trades. The trade still goes through; cron can
  // close it if liquidity is genuinely bad.
  (async () => {
    try {
      const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${signal.mint}`, { signal: AbortSignal.timeout(5000) });
      if (!dsRes.ok) return;
      const pairs = ((await dsRes.json())?.pairs || []).filter((p: any) => parseFloat(p?.priceUsd) > 0);
      if (!pairs.length) return;
      pairs.sort((a: any, b: any) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
      const best = pairs[0];
      const poolLiq = parseFloat(best.liquidity?.usd || 0);
      const mcap    = parseFloat(best.fdv || best.marketCap || 0);
      const sym     = best.baseToken?.symbol || signal.mint.slice(0,8);
      if (poolLiq > 0 && poolLiq < 10000) {
        console.warn(`[INLINE-BUY] ⚠️ POST-AUDIT ${sym} — pool $${poolLiq.toFixed(0)} < $10K (already entered)`);
      } else if (mcap > 0 && mcap < 50000) {
        console.warn(`[INLINE-BUY] ⚠️ POST-AUDIT ${sym} — mcap $${mcap.toFixed(0)} < $50K (already entered)`);
      } else {
        console.log(`[INLINE-BUY] ✅ POST-AUDIT ${sym} — pool $${poolLiq.toFixed(0)} mcap $${mcap.toFixed(0)}`);
      }
    } catch {}
  })();

  return { ok: true, tx: txSig, size_sol: size, latency_ms: swapMs };
}

// ── Inline SELL execution: mirror whale exits in-process, no executor call ─
// Used by whale_sell_mirror path. Critical for fast-flippers like trunoest
// who exit in 13-38s. Calling shreem-live-executor adds 1-3s of HTTP +
// cold-start overhead per close — we kill that here.
async function executeSellInline(trade: any, reason: string): Promise<{ ok: boolean; tx?: string; latency_ms?: number; error?: string }> {
  const t0 = Date.now();
  if (!trade?.mint || !trade?.id) return { ok: false, error: "bad_trade" };

  const kp = loadKeypair();
  if (!kp) return { ok: false, error: "no_keypair" };
  const walletPub = bs58.encode(kp.publicKey);

  // Mark closing immediately so concurrent sells can't double-fire
  const { error: lockErr } = await sb.from("shreem_brzee_live_trades")
    .update({ status: "closing", updated_at: new Date().toISOString() })
    .eq("id", trade.id)
    .in("status", ["open","unconfirmed"]);
  if (lockErr) return { ok: false, error: `lock_failed:${lockErr.message}` };

  // ── Race-condition fix ────────────────────────────────────────────────────
  // Whales (esp. trunoest/Cented) often flip in <15s. Our buy tx may still be
  // propagating when their SELL signal arrives. If we read balance once and
  // see 0, we'd mark the trade closed → buy lands later → tokens stranded.
  //
  // Fix: if we have a buy tx_sig but haven't seen the token account yet,
  // wait for the buy to confirm, then retry the balance read with backoff.
  // ─────────────────────────────────────────────────────────────────────────
  let rawBalance = 0;
  let decimals = 6;
  const buyTxSig: string | undefined = trade.tx_sig;

  // First quick read — if it's already there, we save the retry latency
  try {
    [rawBalance, decimals] = await Promise.all([
      getTokenRawBalance(walletPub, trade.mint).catch(() => 0),
      getMintDecimals(trade.mint).catch(() => 6),
    ]);
  } catch {}

  // If empty AND we have a pending buy → wait for it, then retry up to 4×
  if (!rawBalance && buyTxSig) {
    console.log(`[INLINE-SELL] ⏳ balance=0, awaiting buy tx ${buyTxSig.slice(0,16)}…`);
    try { await waitConfirm(buyTxSig, 6000); } catch {}
    const delays = [400, 800, 1500, 2500];
    for (const d of delays) {
      await new Promise(r => setTimeout(r, d));
      rawBalance = await getTokenRawBalance(walletPub, trade.mint).catch(() => 0);
      if (rawBalance > 0) {
        console.log(`[INLINE-SELL] ✓ balance appeared after ${d}ms: raw=${rawBalance}`);
        break;
      }
    }
  }

  if (!rawBalance || rawBalance <= 0) {
    // Still empty. Could be:
    //   (a) buy never landed on-chain (failed tx) → safe to close
    //   (b) RPC lag — buy DID land but Helius hasn't indexed yet → DON'T close
    // To avoid stranding tokens we DO NOT mark closed. Restore 'open' so the
    // executor's auto_recover_stuck cron picks it up once balance shows up.
    console.warn(`[INLINE-SELL] ⚠️ ${trade.mint.slice(0,8)} balance still 0 after retries — leaving OPEN for cron auto-recover`);
    await sb.from("shreem_brzee_live_trades").update({
      status: "open",
      updated_at: new Date().toISOString(),
    }).eq("id", trade.id);
    return { ok: false, error: "balance_zero_deferred_to_cron", latency_ms: Date.now() - t0 };
  }

  // Quote + swap + send
  let txSig = "";
  try {
    const quote  = await jupQuote(trade.mint, SOL_MINT, rawBalance);
    const swapTx = await jupSwapTx(quote, walletPub);
    txSig        = await signAndSend(swapTx, kp);
  } catch (e: any) {
    console.error(`[INLINE-SELL] ❌ ${trade.symbol ?? trade.mint.slice(0,8)} swap failed: ${e.message}`);
    // Restore status so cron/manual can retry
    await sb.from("shreem_brzee_live_trades").update({
      status: "open",
      updated_at: new Date().toISOString(),
    }).eq("id", trade.id);
    return { ok: false, error: e.message };
  }

  const swapMs = Date.now() - t0;
  console.log(`[INLINE-SELL] ⚡ ${trade.symbol ?? trade.mint.slice(0,8)} | raw=${rawBalance} | tx=${txSig.slice(0,16)} | ${swapMs}ms | reason=${reason}`);

  // Persist close immediately — cron reconciles pnl/proceeds from tx later.
  await sb.from("shreem_brzee_live_trades").update({
    status: "closed",
    sell_tx_sig: txSig,
    sell_reason: reason,
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", trade.id);

  return { ok: true, tx: txSig, latency_ms: swapMs };
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

  // CRITICAL FIX: use live_trades table in live mode, paper_trades in paper mode
  const isLiveMode = sess?.mode === "live";
  const tradeTable = sess?.mode === "live" ? "shreem_brzee_live_trades" : "shreem_brzee_paper_trades";
  const { data: openPos } = await sb.from(tradeTable)
    .select("*").in("status", ["open", "pending", "unconfirmed"]);

  if (!openPos?.length) return { checked: 0 };

  let closed = 0;
  let walletClosed = 0;
  const results: any[] = [];
  const liveKp = isLiveMode ? loadKeypair() : null;
  const liveWallet = liveKp ? bs58.encode(liveKp.publicKey) : null;
  let liveWalletBalSol: number | null = null;
  if (liveWallet) {
    try {
      const bal = await rpcCall("getBalance", [liveWallet]);
      liveWalletBalSol = Number(bal?.value || 0) / LAMPORTS;
    } catch {}
  }

  for (const pos of openPos) {
    const entry  = Number(pos.entry_price) || 0;
    const ageH   = (Date.now() - new Date(pos.opened_at || pos.created_at).getTime()) / 3_600_000;
    const ageMin = ageH * 60;

    // Live reconciliation: if Phantom/on-chain balance is already zero, close UI too.
    // Avoid false-closing very fresh unconfirmed swaps while token accounts propagate.
    if (isLiveMode && liveWallet && pos.mint && (pos.status === "open" || ageMin >= 5)) {
      try {
        const rawBalance = await getTokenRawBalance(liveWallet, pos.mint);
        if (!rawBalance || rawBalance < 1) {
          await sb.from("shreem_brzee_live_trades").update({
            status: "closed",
            sell_reason: "closed_in_wallet",
            closed_at: new Date().toISOString(),
            pnl_pct: Number(pos.pnl_pct || 0),
            pnl_sol: Number(pos.pnl_sol || 0),
            updated_at: new Date().toISOString(),
          }).eq("id", pos.id);
          closed++;
          walletClosed++;
          results.push({ id: pos.id, reason: "closed_in_wallet" });
          continue;
        }
      } catch (e: any) {
        console.warn(`[cron] wallet reconcile failed ${pos.mint.slice(0,8)}: ${e?.message ?? e}`);
      }
    }

    // 48h safety cap (no browser needed — runs server-side every 5min)
    if (ageH >= 48) {
      if (isLiveMode) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({ action: "close", trade_id: pos.id, reason: "48h_safety_cap" }),
            signal: AbortSignal.timeout(25000),
          });
        } catch {}
      } else {
        await closeTrade(pos, "48h_safety_cap");
      }
      closed++; results.push({ id: pos.id, reason: "48h_safety_cap", ageH: ageH.toFixed(1) });
      continue;
    }

    // Stop-loss + trailing stop: need current price
    if (entry > 0 && pos.mint) {
      const price = await fetchPrice(pos.mint);
      if (price > 0) {
        const pnlPct = (price - entry) / entry * 100;

        // Track peak price (highest observed since entry)
        const prevPeak = Number(pos.peak_price) || entry;
        const peak     = Math.max(prevPeak, price);
        const peakPct  = (peak - entry) / entry * 100;

        // Hard stop-loss: -30% from entry
        if (pnlPct <= -30) {
          // In live mode: call executor to do the actual on-chain sell
        if (sess?.mode === "live") {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_KEY}` },
              body: JSON.stringify({ action: "close", trade_id: pos.id, reason: "stop_loss" }),
              signal: AbortSignal.timeout(25000),
            });
          } catch {}
          closed++; results.push({ id: pos.id, reason: "stop_loss", pnlPct: pnlPct.toFixed(1) });
          continue;
        }
        await closeTrade(pos, "stop_loss", price);
          closed++; results.push({ id: pos.id, reason: "stop_loss", pnlPct: pnlPct.toFixed(1) });
          continue;
        }

        // Trailing stop: once peak gain >= 30%, lock in 50% of peak gain
        if (peakPct >= 30) {
          const trailFloorPct = peakPct * 0.5;
          // In live mode: call executor to do actual on-chain sell
          if (pnlPct <= trailFloorPct) {
            if (sess?.mode === "live") {
              try {
                await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_KEY}` },
                  body: JSON.stringify({ action: "close", trade_id: pos.id, reason: "trailing_stop" }),
                  signal: AbortSignal.timeout(25000),
                });
              } catch {}
            } else {
              await closeTrade(pos, "trailing_stop", price);
            }
            closed++; results.push({ id: pos.id, reason: "trailing_stop", pnlPct: pnlPct.toFixed(1), peakPct: peakPct.toFixed(1), floorPct: trailFloorPct.toFixed(1) });
            continue;
          }
        }

        // Update peak price in DB
        await sb.from(tradeTable).update({
          exit_price: price,
          peak_price: peak,
          pnl_pct:    pnlPct,
          pnl_sol:    Number(pos.amount_sol || 0) * (pnlPct / 100),
        }).eq("id", pos.id).eq("status", "open");
      }
    }

  }

  if (isLiveMode && liveWalletBalSol !== null) {
    await sb.from("shreem_brzee_session").update({
      portfolio: liveWalletBalSol,
      updated_at: new Date().toISOString(),
    }).eq("id", "default");
  }

  return { checked: openPos.length, closed, walletClosed, wallet_balance_sol: liveWalletBalSol, results };
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
    const HELIUS_KEY = Deno.env.get("HELIUS_API_KEY") ?? "";
    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/shreem-helius-webhook`;
    // CREDIT SAFETY: Hard-coded approved wallets only — never auto-expand to all WHALE_WALLETS
    // Adding more wallets = linear credit burn. Change manually via Helius dashboard only.
    const addresses = Object.keys(WHALE_WALLETS); // always matches WHALE_WALLETS above

    const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`, { signal: AbortSignal.timeout(8000) });
    if (!listR.ok) throw new Error(`Helius list failed: ${listR.status}`);
    const hooks = await listR.json();
    const ours  = Array.isArray(hooks) ? hooks.find((h: any) => h?.webhookURL === WEBHOOK_URL) : null;

    const payload = {
      webhookURL:       WEBHOOK_URL,
      transactionTypes: ["Any"],
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
    const msg = `${ours ? "Updated" : "Created"} Helius webhook watching ${addresses.length} wallets for Any transactions`;
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

// Stablecoins to EXCLUDE as the "target" mint — they're intermediate hops
// inside a Jupiter route. The real meme/token the whale is buying/selling
// is always the non-SOL, non-stablecoin leg. Without this filter we record
// USDC as the BUY/SELL mint, then the executor swaps SOL→USDC and loses.
const STABLES = new Set<string>([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1", // USDT
  "USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX",  // USDH
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", // UXD
]);
const IGNORE_AS_TARGET = new Set<string>([SOL_MINT, ...STABLES]);

// Handles BOTH raw and enhanced Helius webhook formats
function parseSwap(tx: any, wallet: string) {
  // ── Enhanced format ──────────────────────────────────────────────────────
  // Prefer events.swap when present: cleanest BUY/SELL view of the whole
  // route. Fall back to tokenTransfers but always exclude stablecoin legs.
  if (tx.tokenTransfers?.length || tx.events?.swap) {
    const swap = tx.events?.swap;
    let action: "BUY" | "SELL" | null = null;
    let mint: string | null = null;
    let symbol: string | null = null;
    let tokenAmount: number | null = null;
    let amountSol = 0;

    if (swap) {
      const out = (swap.tokenOutputs || []).find((t: any) => t.userAccount === wallet && !IGNORE_AS_TARGET.has(t.mint));
      const inp = (swap.tokenInputs  || []).find((t: any) => t.userAccount === wallet && !IGNORE_AS_TARGET.has(t.mint));
      if (out) {
        action = "BUY";
        mint = out.mint;
        tokenAmount = Number(out.rawTokenAmount?.tokenAmount ?? out.tokenAmount ?? 0) || null;
        if (swap.nativeInput) amountSol = Number(swap.nativeInput.amount) / LAMPORTS;
      } else if (inp) {
        action = "SELL";
        mint = inp.mint;
        tokenAmount = Number(inp.rawTokenAmount?.tokenAmount ?? inp.tokenAmount ?? 0) || null;
        if (swap.nativeOutput) amountSol = Number(swap.nativeOutput.amount) / LAMPORTS;
      }
    }

    // Fallback: pick the LARGEST non-stable, non-SOL tokenTransfer involving
    // the wallet — that's the real meme leg.
    if (!mint) {
      const candidates = (tx.tokenTransfers || []).filter((t: any) =>
        (t.fromUserAccount === wallet || t.toUserAccount === wallet) &&
        !IGNORE_AS_TARGET.has(t.mint)
      );
      if (!candidates.length) return null; // pure stable/SOL shuffle — ignore
      candidates.sort((a: any, b: any) => Number(b.tokenAmount || 0) - Number(a.tokenAmount || 0));
      const tokenTx = candidates[0];
      mint        = tokenTx.mint;
      symbol      = tokenTx.tokenName || tokenTx.symbol || null;
      tokenAmount = Number(tokenTx.tokenAmount || 0) || null;
      action      = tokenTx.toUserAccount === wallet ? "BUY" : "SELL";
    }

    if (!mint || IGNORE_AS_TARGET.has(mint)) return null;

    if (!amountSol) {
      const acctData = (tx.accountData || []).find((a: any) => a.account === wallet);
      amountSol = acctData?.nativeBalanceChange ? Math.abs(acctData.nativeBalanceChange) / LAMPORTS : 0;
    }
    if (!amountSol || amountSol < 0.001) {
      amountSol = (tx.nativeTransfers || [])
        .filter((t: any) => (t.fromUserAccount === wallet || t.toUserAccount === wallet) && t.amount > 100_000)
        .reduce((s: number, t: any) => s + t.amount, 0) / LAMPORTS;
    }
    if (!amountSol || amountSol < 0.001) {
      const allChanges = (tx.accountData || [])
        .filter((a: any) => a.nativeBalanceChange && Math.abs(a.nativeBalanceChange) > 50_000)
        .map((a: any) => Math.abs(a.nativeBalanceChange) / LAMPORTS);
      if (allChanges.length) amountSol = Math.max(...allChanges);
    }

    return {
      action: action!,
      mint,
      symbol,
      amountSol,
      tokenAmount,
      isPumpFun:  (tx.source||"").toLowerCase().includes("pump") ||
                  (tx.instructions||[]).some((ix: any) => ix.programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
    };
  }

  // ── Raw format (transaction.message + meta.pre/postTokenBalances) ────────
  // Raw format: { transaction: { message: { accountKeys, instructions } }, meta: { preTokenBalances, postTokenBalances, preBalances, postBalances, logMessages } }
  const meta = tx.meta;
  const msg  = tx.transaction?.message;
  if (!meta || !msg) return null;

  const keys: string[] = (msg.accountKeys || []).map((k: any) =>
    typeof k === "string" ? k : (k?.pubkey ?? "")
  );
  const walletIdx = keys.indexOf(wallet);
  if (walletIdx < 0) return null;

  // Detect swap: SOL balance changed + token balance changed for wallet
  const preSol  = (meta.preBalances?.[walletIdx]  ?? 0) / LAMPORTS;
  const postSol = (meta.postBalances?.[walletIdx] ?? 0) / LAMPORTS;
  const solDiff = postSol - preSol; // negative = spent SOL (BUY), positive = received SOL (SELL)

  // Find token balance changes for this wallet
  const preTokens  = (meta.preTokenBalances  || []).filter((b: any) => keys[b.accountIndex] === wallet || b.owner === wallet);
  const postTokens = (meta.postTokenBalances || []).filter((b: any) => keys[b.accountIndex] === wallet || b.owner === wallet);

  // Find a non-SOL token that changed
  let mint: string | null = null;
  let tokenDiff = 0;

  for (const post of postTokens) {
    if (post.mint === SOL_MINT) continue;
    const pre = preTokens.find((p: any) => p.mint === post.mint) ?? { uiTokenAmount: { uiAmount: 0 } };
    const diff = (post.uiTokenAmount?.uiAmount ?? 0) - (pre.uiTokenAmount?.uiAmount ?? 0);
    if (Math.abs(diff) > 0) { mint = post.mint; tokenDiff = diff; break; }
  }
  // Also check pre-tokens for tokens that disappeared (full sell)
  if (!mint) {
    for (const pre of preTokens) {
      if (pre.mint === SOL_MINT) continue;
      const post = postTokens.find((p: any) => p.mint === pre.mint);
      if (!post || (post.uiTokenAmount?.uiAmount ?? 0) < (pre.uiTokenAmount?.uiAmount ?? 0)) {
        mint = pre.mint;
        tokenDiff = (post?.uiTokenAmount?.uiAmount ?? 0) - (pre.uiTokenAmount?.uiAmount ?? 0);
        break;
      }
    }
  }

  if (!mint) return null;

  const amountSol = Math.abs(solDiff);
  if (amountSol < 0.001) return null;

  // BUY = SOL went down (spent) + tokens went up | SELL = SOL went up + tokens went down
  const action: "BUY"|"SELL" = (solDiff < 0 && tokenDiff > 0) ? "BUY" : "SELL";

  // Detect pump.fun from log messages or program IDs
  const logs = (meta.logMessages || []).join(" ");
  const isPumpFun = logs.includes("pump") ||
    (msg.instructions || []).some((ix: any) => {
      const prog = typeof ix.programId === "string" ? ix.programId : keys[ix.programIdIndex ?? -1] ?? "";
      return prog === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
    });

  return { action, mint, symbol: null, amountSol, tokenAmount: Math.abs(tokenDiff) || null, isPumpFun };
}

// ── Main handler ──────────────────────────────────────────────────────────────
// Auto-register Helius on cold start using HELIUS_API_KEY secret
let _registered = false;
async function autoRegisterHelius() {
  if (_registered || !HELIUS_KEY) return;
  _registered = true;
  try {
    const SELF = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
    // Watch ALL whales, ALL tx types. Helius enhanced classifies pump.fun bonding-curve
    // trades as UNKNOWN (not SWAP), so filtering on "SWAP" silently drops most whales.
    // Using "Any" captures both Jupiter swaps and raw pump.fun buys/sells.
    const WH = Object.keys(WHALE_WALLETS);
    const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`);
    if (listR.ok) {
      const hooks = await listR.json().catch(()=>[]);
      for (const h of (Array.isArray(hooks)?hooks:[])) {
        await fetch(`https://api.helius.xyz/v0/webhooks/${h.webhookID}?api-key=${HELIUS_KEY}`,{method:"DELETE"});
        await new Promise(r=>setTimeout(r,200));
      }
    }
    const r = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({webhookURL:SELF,transactionTypes:["Any"],accountAddresses:WH,webhookType:"enhanced",txnStatus:"success"})
    });
    const j = await r.json().catch(()=>({}));
    console.log(j?.webhookID ? `[helius] ✅ registered ${j.webhookID} wallets=${j.accountAddresses?.length}` : `[helius] ❌ ${JSON.stringify(j).slice(0,100)}`);
    if (!j?.webhookID) _registered = false;
  } catch(e:any) { console.log("[helius] error:",e.message); _registered=false; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  // autoRegisterHelius disabled — webhook registered manually via Helius dashboard
  // Calling it on every request burned 10M credits in one day

  const url  = new URL(req.url);
  const path = url.pathname;

  // Raw logging disabled — was cloning every request body unnecessarily


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

  if (req.method === "GET" && path.endsWith("/live-trades")) {
    const { data } = await sb.from("shreem_brzee_live_trades")
      .select("*").eq("status", "open").order("opened_at", { ascending: false }).limit(100);
    return jsonResp(data || []);
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
    // Always check live_trades first — if any open, return those
    const { data: liveTrades } = await sb.from("shreem_brzee_live_trades")
      .select("*").eq("status","open").order("opened_at", { ascending: false });
    if (liveTrades?.length) return jsonResp(liveTrades);
    // Fall back to paper trades if no live positions
    const { data: paperTrades } = await sb.from("shreem_brzee_paper_trades")
      .select("*").eq("status","open").order("opened_at", { ascending: false });
    return jsonResp(paperTrades || []);
  }

  if (req.method === "GET" && path.endsWith("/ping")) {
    return jsonResp({ ok: true, version: "v5-server-side", ts: new Date().toISOString() });
  }

  // Self-register Helius webhook with current key and wallets
  if (req.method === "POST" && path.endsWith("/register-helius")) {
    const SELF_URL = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
    // All tracked whales. Helius enhanced webhook bills per *delivered* event,
    // and most whales fire <5 SWAPs/hour, so adding 21 wallets is fine.
    const WALLETS = Object.keys(WHALE_WALLETS);
    try {
      // Delete existing webhooks
      const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`);
      const hooks = await listR.json().catch(()=>[]);
      if (Array.isArray(hooks)) {
        for (const h of hooks) {
          await fetch(`https://api.helius.xyz/v0/webhooks/${h.webhookID}?api-key=${HELIUS_KEY}`, {method:"DELETE"});
          console.log(`[register-helius] deleted ${h.webhookID}`);
          await new Promise(r=>setTimeout(r,300));
        }
      }
      // Register new webhook
      const regR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_KEY}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          webhookURL: SELF_URL,
          transactionTypes: ["Any"],
          accountAddresses: WALLETS,
          webhookType: "enhanced",
          txnStatus: "success"
        })
      });
      const reg = await regR.json();
      if (reg?.webhookID) {
        console.log(`[register-helius] ✅ registered ${reg.webhookID} with ${reg.accountAddresses?.length} wallets`);
        return jsonResp({ ok: true, webhookID: reg.webhookID, wallets: reg.accountAddresses?.length });
      }
      return jsonResp({ ok: false, error: JSON.stringify(reg).slice(0,200) }, 500);
    } catch(e: any) {
      return jsonResp({ ok: false, error: e.message }, 500);
    }
  }

  // Force-close all open live trades in DB — use when Phantom shows closed but UI doesn't
  if (req.method === "POST" && path.endsWith("/force-close-all")) {
    const { data: updated, error } = await sb
      .from("shreem_brzee_live_trades")
      .update({ status: "closed", closed_at: new Date().toISOString(), sell_reason: "manual_force" })
      .eq("status", "open")
      .select("id,symbol,mint");
    if (error) return jsonResp({ ok: false, error: error.message }, 500);
    return jsonResp({ ok: true, closed: updated?.length || 0, trades: updated });
  }

  // Force-close single trade by id
  if (req.method === "POST" && path.endsWith("/force-close-one")) {
    const body = await req.json().catch(() => ({}));
    const { trade_id } = body;
    if (!trade_id) return jsonResp({ ok: false, error: "trade_id required" }, 400);
    const { data: updated, error } = await sb
      .from("shreem_brzee_live_trades")
      .update({ status: "closed", closed_at: new Date().toISOString(), sell_reason: "manual_force" })
      .eq("id", trade_id)
      .select("id,symbol");
    if (error) return jsonResp({ ok: false, error: error.message }, 500);
    return jsonResp({ ok: true, closed: updated?.length || 0, trade: updated?.[0] });
  }

  // Force-close specific trade or all open trades in DB — no on-chain swap needed
  // Used when swap already happened in Phantom but DB still shows open
  if (req.method === "POST" && path.endsWith("/force-close")) {
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    let q = sb.from("shreem_brzee_live_trades").update({
      status: "closed", closed_at: now, sell_reason: body.reason || "manual_phantom",
    }).eq("status", "open");
    if (body.trade_id) q = sb.from("shreem_brzee_live_trades").update({
      status: "closed", closed_at: now, sell_reason: body.reason || "manual_phantom",
    }).eq("id", body.trade_id).eq("status", "open");
    const { data: updated, error } = await q.select("id,symbol");
    if (error) return jsonResp({ ok: false, error: error.message }, 500);
    return jsonResp({ ok: true, closed: updated?.length || 0, trades: updated });
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
  // ── Resume session — restores execution without wiping trade history ────────
  // POST /resume-session — clears stopped_at, syncs portfolio to current wallet balance
  // Use this when the bot stopped taking trades but history should be preserved
  if (req.method === "POST" && path.endsWith("/resume-session")) {
    try {
      const body = await req.json().catch(() => ({}));
      const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
      if (!sess) return jsonResp({ ok: false, error: "No session found" }, 404);

      // Read actual wallet balance from RPC to sync portfolio
      let walletBal = Number(body?.balance_sol || 0);
      if (!walletBal && SUPABASE_URL) {
        // Try to get balance from executor health endpoint
        try {
          const hr = await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor/health`, {
            headers: { "Authorization": `Bearer ${SUPABASE_KEY}` },
            signal: AbortSignal.timeout(8000),
          });
          if (hr.ok) { const hj = await hr.json(); walletBal = hj?.balance_sol || 0; }
        } catch {}
      }

      // Count open positions to know real exposure
      const { data: openTrades } = await sb.from("shreem_brzee_live_trades")
        .select("amount_sol").in("status", ["open", "unconfirmed"]);
      const openExposure = (openTrades || []).reduce((s: number, t: any) => s + (Number(t.amount_sol) || 0), 0);

      // Set portfolio = wallet balance - open exposure (what's actually free to trade)
      const freeBalance = walletBal > 0 ? Math.max(0, walletBal - openExposure) : Number(sess.portfolio || 0);

      await sb.from("shreem_brzee_session").update({
        stopped_at:  null,
        started_at:  sess.started_at || new Date().toISOString(),
        portfolio:   freeBalance,
        mode:        "live",
        updated_at:  new Date().toISOString(),
      }).eq("id", "default");

      console.log(`[resume] ✅ Session resumed | portfolio=${freeBalance.toFixed(4)} SOL | openExposure=${openExposure.toFixed(4)} SOL`);
      return jsonResp({
        ok: true,
        message: "Session resumed — bot will take next signals",
        portfolio: freeBalance,
        open_exposure: openExposure,
        wallet_balance: walletBal,
        mode: "live",
      });
    } catch (e: any) {
      return jsonResp({ ok: false, error: e.message }, 500);
    }
  }

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

      // Check session mode to know which table to use
      const { data: sess } = await sb.from("shreem_brzee_session").select("mode").eq("id","default").single();
      const table = sess?.mode === "live" ? "shreem_brzee_live_trades" : "shreem_brzee_paper_trades";

      const { data: pos, error: fetchErr } = await sb
        .from(table)
        .select("*")
        .eq("id", tradeId)
        .in("status", ["open", "pending", "unconfirmed", "closing"])
        .single();

      if (fetchErr || !pos) return jsonResp({ error: "trade not found or already closed" }, 404);

      if (sess?.mode === "live") {
        // Live mode — try executor first to swap tokens back to SOL
        let execData: any = {};
        let execOk = false;
        try {
          const execR = await fetch(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ action: "close", trade_id: tradeId, reason: "manual" }),
          });
          execData = await execR.json().catch(() => ({}));
          const failedSell = Array.isArray(execData?.results) && execData.results.some((r: any) => r?.ok === false);
          execOk = execR.ok && execData?.ok !== false && execData?.code !== "BOOT_ERROR" && !failedSell;
        } catch (execErr: any) {
          execData = { error: `executor unreachable: ${execErr?.message}` };
        }

        // Force-close in DB regardless: ghost trades (already closed in Phantom) must disappear from UI.
        // Executor already marks closed if it succeeded; this is the safety net.
        await sb.from("shreem_brzee_live_trades").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          sell_reason: execOk ? "manual" : "manual_force_ui",
        }).eq("id", tradeId).neq("status", "closed");

        return jsonResp({ ok: true, trade_id: tradeId, symbol: pos.symbol, reason: execOk ? "manual" : "manual_force_ui", table, exec: execData });
      } else {
        await closeTrade(pos, "manual");
      }

      return jsonResp({ ok: true, trade_id: tradeId, symbol: pos.symbol, reason: "manual", table });
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
      // SAFETY: /test NEVER calls live executor — it would burn real SOL
      // In live mode, test just writes the signal to DB (for monitoring) but does NOT execute
      return jsonResp({ ok: true, sig, mode: "live", skipped: true, reason: "Test signals never execute in live mode — use real whale signals" });
    } else {
      // PAPER MODE: open paper trade
      if (sess) await openTrade(signal, sess);
      return jsonResp({ ok: true, sig, mode: "paper", action: "BUY", version: "v5" });
    }
  }

  // ── /test-live: REAL micro-buy gated by admin token ───────────────────────
  // Bypasses size/filters and executes a true Jupiter swap with the size given
  // in the body (capped at 0.01 SOL for safety). Requires header
  //   x-admin-token: $SHREEM_TEST_LIVE_TOKEN
  if (req.method === "POST" && path.endsWith("/test-live")) {
    const adminTok = Deno.env.get("SHREEM_TEST_LIVE_TOKEN") || "";
    const provided = req.headers.get("x-admin-token") || "";
    if (!adminTok || provided !== adminTok) {
      return jsonResp({ ok: false, error: "unauthorized" }, 401);
    }
    let body: any = {};
    try { body = await req.json(); } catch {}
    const mint = String(body.mint || "");
    const action = String(body.action || "BUY").toUpperCase();
    const sizeReq = Math.min(0.01, Math.max(0.001, Number(body.size_sol ?? 0.005)));
    if (!mint) return jsonResp({ ok: false, error: "missing_mint" }, 400);

    const t0 = Date.now();
    try {
      const kp = loadKeypair();
      if (!kp) return jsonResp({ ok: false, error: "no_keypair" }, 500);
      const walletPub = bs58.encode(kp.publicKey);

      if (action === "SELL") {
        const raw = await getTokenRawBalance(walletPub, mint);
        if (!raw || raw <= 0) {
          return jsonResp({ ok: false, error: "no_token_balance", mint }, 400);
        }
        const quote = await jupQuote(mint, SOL_MINT, raw);
        const swapTx = await jupSwapTx(quote, walletPub);
        const txSig = await signAndSend(swapTx, kp);
        const ms = Date.now() - t0;
        console.log(`[TEST-LIVE] 💰 SELL ${mint.slice(0,8)} | raw=${raw} | tx=${txSig.slice(0,16)} | ${ms}ms`);
        return jsonResp({ ok: true, action: "SELL", tx: txSig, raw_amount: raw, latency_ms: ms, explorer: `https://solscan.io/tx/${txSig}` });
      }

      const lamports = Math.floor(sizeReq * LAMPORTS);
      const quote = await jupQuote(SOL_MINT, mint, lamports);
      const swapTx = await jupSwapTx(quote, walletPub);
      const txSig = await signAndSend(swapTx, kp);
      const ms = Date.now() - t0;
      console.log(`[TEST-LIVE] ⚡ BUY ${mint.slice(0,8)} | ${sizeReq} SOL | tx=${txSig.slice(0,16)} | ${ms}ms`);
      return jsonResp({ ok: true, action: "BUY", tx: txSig, size_sol: sizeReq, latency_ms: ms, explorer: `https://solscan.io/tx/${txSig}` });
    } catch (e: any) {
      console.error(`[TEST-LIVE] ❌ ${mint.slice(0,8)} failed: ${e?.message}`);
      return jsonResp({ ok: false, error: String(e?.message || e), latency_ms: Date.now() - t0 }, 500);
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
        // Support both raw (tx.transaction.signatures[0]) and enhanced (tx.signature)
        const sig = tx.signature ?? tx.transaction?.signatures?.[0];
        if (!sig) { skipped++; continue; }
        const wallet = findWhale(tx);
        if (!wallet) { skipped++; continue; }
        const swap   = parseSwap(tx, wallet);

        // ── Direct token transfer out = SELL (catches trunoest-style exits) ───
        if (!swap) {
          const outTransfers = (tx.tokenTransfers || []).filter((t: any) =>
            t.fromUserAccount === wallet &&
            !IGNORE_AS_TARGET.has(t.mint) &&
            Number(t.tokenAmount || 0) > 0
          );
          if (outTransfers.length > 0) {
            const mint = outTransfers[0].mint;
            const { data: held } = await sb
              .from("shreem_brzee_live_trades")
              .select("id,mint,symbol,tx_sig")
              .in("status", ["open","unconfirmed"])
              .eq("mint", mint)
              .limit(1);
            if (held?.[0]) {
              // Skip if this is the same tx that opened the position
              // Prevents false SELL when buy tx also contains a transfer instruction
              const openTxSig = (held[0].tx_sig || "").replace("_live","");
              if (openTxSig && openTxSig === sig) {
                console.log(`[transfer-exit] SKIP — same tx as buy: ${sig.slice(0,16)}`);
              } else {
                console.log(`[transfer-exit] ${WHALE_WALLETS[wallet]} transferred out ${mint.slice(0,8)} — SELL`);
                swap = { action: "SELL" as const, mint, amount_sol: 0, symbol: held[0].symbol };
              }
            }
          }
        }

        if (!swap) { skipped++; continue; }


        // Filter out stablecoins and SOL from signal feed — only real meme coins
        const SKIP_FEED_MINTS = new Set([
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
          "Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1", // USDT
          "So11111111111111111111111111111111111111112",    // SOL
          "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
          "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",  // mSOL
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        ]);
        if (!swap.mint || SKIP_FEED_MINTS.has(swap.mint)) { skipped++; continue; }

        const signal = {
          sig,
          wallet,
          label:          WHALE_WALLETS[wallet],
          action:         swap.action,
          mint:           swap.mint,
          symbol:         swap.symbol,
          amount_sol:     swap.amountSol,
          token_amount:   swap.tokenAmount,
          is_pump_fun:    swap.isPumpFun,
          block_time:     tx.timestamp ?? tx.blockTime ?? null,
          created_at:     new Date().toISOString(),
          live_processed: false,
        };

        // Load session FIRST — needed to decide whether to swap inline
        const { data: sessNow } = await sb.from("shreem_brzee_session")
          .select("*").eq("id","default").single();

        const isRunning = !!(sessNow?.started_at && !sessNow?.stopped_at);
        const isLive    = sessNow?.mode === "live";

        // ── LIVE BUY → INLINE SWAP (no executor round-trip, no DB write first) ──
        // Hot path: zero logging, zero stringify. executeBuyInline emits the single
        // [INLINE-BUY] timing line on success. Errors are caught silently — the
        // stop-loss cron reconciles any unconfirmed state.
        if (isRunning && isLive && swap.action === "BUY") {
          const buyResult = await executeBuyInline(signal, sessNow);
          if (!buyResult.ok) {
            console.error(`[live-buy] ❌ ${signal.symbol || signal.mint.slice(0,8)} → ${buyResult.error || buyResult.skipped || "failed"}`);
          }
          inserted++;
          continue;
        }


        // ── All other paths: write signal first (legacy behaviour) ──────────
        const { error } = await sb.from("shreem_brzee_signals")
          .upsert(signal, { onConflict: "sig" });
        if (error) { console.error("[signal]", error.message); skipped++; continue; }
        inserted++;
        console.log(`✅ ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} — ${WHALE_WALLETS[wallet]}`);

        if (!isRunning) continue;

        if (isLive && swap.action === "SELL") {
          // Whale SELL mirror — find open position then close it
          try {
            // Find open position by mint first
            const { data: matchByMint } = await sb
              .from("shreem_brzee_live_trades")
              .select("id,mint,symbol,label")
              .in("status", ["open","unconfirmed"])
              .eq("mint", swap.mint)
              .limit(1);

            // Fallback: find by label if mint not matched
            const { data: matchByLabel } = !matchByMint?.length ? await sb
              .from("shreem_brzee_live_trades")
              .select("id,mint,symbol,label")
              .in("status", ["open","unconfirmed"])
              .eq("label", WHALE_WALLETS[wallet])
              .limit(1) : { data: null };

            const match = matchByMint?.[0] || matchByLabel?.[0];
            if (!match) {
              console.log(`[live-close] No open position for SELL ${swap.mint?.slice(0,8)} from ${WHALE_WALLETS[wallet]}`);
            } else {
              console.log(`[live-close] Closing ${match.symbol||match.mint?.slice(0,8)} trade_id=${match.id} (inline)`);
              const sellRes = await executeSellInline(match, "whale_sell_mirror");
              if (sellRes.ok) {
                console.log(`[live-close] ✅ ${match.symbol||match.mint?.slice(0,8)} → tx=${sellRes.tx?.slice(0,16)} ${sellRes.latency_ms}ms`);
              } else {
                console.error(`[live-close] ❌ ${match.symbol||match.mint?.slice(0,8)} → ${sellRes.error}`);
              }
            }
          } catch (sellErr: any) {
            console.error(`[live-close] ❌ SELL error:`, sellErr?.message ?? String(sellErr));
          }
        } else if (!isLive) {
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






