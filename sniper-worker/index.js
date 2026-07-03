/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQI SOVEREIGN SNIPER — Consolidated Worker (v6)              ║
 * ║  Siddha Quantum Intelligence · Solana Memecoin Engine          ║
 * ║                                                                  ║
 * ║  v6 replaces the v5 split (Deno edge function does detection+  ║
 * ║  entry, this process does exit-only). That split cost 1-3s of ║
 * ║  latency per candidate: Helius webhook delivery (at-least-once,║
 * ║  200ms-2s) → Deno cold start → 2 blocking Supabase reads for   ║
 * ║  daily gates → DB-insert claim lock. None of that is needed    ║
 * ║  when detection and entry live in the SAME process as the      ║
 * ║  exit manager — the in-memory Set/Map that already existed     ║
 * ║  here for positions works exactly as well as a lock, with zero ║
 * ║  network round trips. This mirrors the proven Shreem Brzee     ║
 * ║  pattern: one Helius connection, one process, async Supabase   ║
 * ║  writes AFTER the decision, never blocking it.                 ║
 * ║                                                                  ║
 * ║  What did NOT change, on purpose: the mechanical filter chain  ║
 * ║  (bonding curve / holder / buy-velocity / rug-score RPC calls) ║
 * ║  is untouched, verbatim from the verified edge function. Same  ║
 * ║  for the exit logic below (TP1/TP2/SL/trail/dev-wallet-exit)   ║
 * ║  — unchanged from the verified v5 worker.                      ║
 * ║                                                                  ║
 * ║  What DID change from the first v6 pass: the Gemini AI veto is ║
 * ║  now dormant, not called. It only ever saw the same five signals║
 * ║  the deterministic rug/quality score already computed — no new ║
 * ║  information, just network latency and a fail-open failure mode║
 * ║  on top of it. Replaced with computeQualityScore(), a weighted ║
 * ║  formula over the same inputs. See its comment block for the   ║
 * ║  reasoning and how to re-enable aiVeto() if you later feed it  ║
 * ║  something the numbers can't see (token text, dev wallet       ║
 * ║  history).                                                       ║
 * ║                                                                  ║
 * ║  Concurrency note: this file is now the ONLY thing that can    ║
 * ║  enter a position. If you ever run two copies of this process  ║
 * ║  (blue/green deploy, etc.) you MUST go back to a DB-insert      ║
 * ║  claim lock — the in-memory Set only works because there is    ║
 * ║  exactly one process holding it.                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// ── ENV ──────────────────────────────────────────────────────────
const SUPABASE_URL       = process.env.SUPABASE_URL        || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_KEY || '';
const HELIUS_API_KEY     = process.env.HELIUS_API_KEY       || '';
const GEMINI_API_KEY     = process.env.GEMINI_API_KEY       || '';
const PAPER_MODE         = (process.env.PAPER_MODE || 'true') === 'true';
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY   || '';
const TELEGRAM_TOKEN     = process.env.TELEGRAM_TOKEN       || '';
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID     || '';

// ── ENTRY CONFIG (moved back here from the edge function's secrets) ──
const BUY_SOL             = parseFloat(process.env.BUY_AMOUNT_SOL       || '0.05');
const MAX_POSITIONS       = parseInt(process.env.MAX_OPEN_POSITIONS     || '5', 10);
const MAX_DAILY_TRADES    = parseInt(process.env.MAX_DAILY_TRADES       || '20', 10);
const MAX_DAILY_LOSS      = parseFloat(process.env.MAX_DAILY_LOSS_SOL   || '0.5');
const MIN_AI_SCORE        = parseInt(process.env.MIN_AI_SCORE           || '60', 10);
const AI_TIMEOUT_MS       = parseInt(process.env.AI_TIMEOUT_MS          || '350', 10);

// ── EXIT CONFIG (unchanged from v5) ─────────────────────────────
const TP1_X              = parseFloat(process.env.TAKE_PROFIT_X       || '3.0');
const TP2_X              = parseFloat(process.env.MOONBAG_X           || '10.0');
const SL_PCT             = parseFloat(process.env.STOP_LOSS_PCT       || '0.35');
const TRAIL_PCT          = parseFloat(process.env.TRAILING_STOP_PCT   || '0.25');
const TRAIL_ACTIVATE_PCT = parseFloat(process.env.TRAIL_ACTIVATE_PCT  || '0.20');
const MAX_HOLD_MIN       = parseInt(process.env.MAX_HOLD_MINUTES      || '30', 10);
const SLIPPAGE_BPS       = parseInt(process.env.SLIPPAGE_BPS          || '8000', 10);
const JITO_TIP           = parseFloat(process.env.JITO_TIP_SOL        || '0.001');
const MAX_IMPACT_FRACTION = parseFloat(process.env.MAX_PRICE_IMPACT_PCT || '15') / 100;

// ── CONSTANTS (verified June 2026 — see prior audit) ────────────
const SOL_MINT      = 'So11111111111111111111111111111111111111112';
const PUMP_PROGRAM  = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMP_DECIMALS = 6;
const JUP_URL        = 'https://api.jup.ag/swap/v1';
const JITO_URL       = 'https://mainnet.block-engine.jito.wtf/api/v1';
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const RPC_HTTP = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';
const RPC_WS = HELIUS_API_KEY
  ? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : undefined; // Connection derives wss:// from the http endpoint if unset

// ── CLIENTS ──────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const connection = new Connection(RPC_HTTP, { commitment: 'processed', wsEndpoint: RPC_WS });
let keypair = null;
if (WALLET_PRIVATE_KEY && !PAPER_MODE) {
  try { keypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY)); }
  catch { console.error('❌ Invalid WALLET_PRIVATE_KEY'); }
}

// ── STATE ────────────────────────────────────────────────────────
const positions = new Map();   // mint → position row (camelCased)
const devWatching = new Map();
const devTriggered = new Set();
const buying = new Set();      // mints currently mid-pipeline — THE lock, in-process only
const startTime = Date.now();
let dailyTrades = 0;
let dailyPnl = 0;
let dailyResetAt = nextUtcMidnight();

function nextUtcMidnight() {
  const d = new Date(); d.setUTCHours(24, 0, 0, 0); return d.getTime();
}

// ══════════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════════
const ts = () => new Date().toISOString().slice(11, 23);
const L = {
  info:  (m) => console.log(`[${ts()}] • ${m}`),
  win:   (m) => console.log(`[${ts()}] ✅ ${m}`),
  loss:  (m) => console.log(`[${ts()}] ❌ ${m}`),
  warn:  (m) => console.log(`[${ts()}] ⚠️  ${m}`),
  alert: (m) => console.log(`[${ts()}] 🚨 ${m}`),
};
async function tg(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}
}

// ══════════════════════════════════════════════════════════════════
// CHEAP, RPC-FREE PRE-FILTER — reject obvious junk before spending
// a single credit. Verbatim from the edge function.
// ══════════════════════════════════════════════════════════════════
const HONEY = ['airdrop', 'claim', 'official', 'presale', 'safe', 'guaranteed', '100x'];
function cheapReject(name, symbol) {
  const text = `${name}${symbol}`.toLowerCase();
  if (HONEY.some((k) => text.includes(k))) return 'honeypot-keyword';
  if (!symbol || symbol === '???' || symbol.length > 12) return 'bad-symbol';
  return null;
}

// ══════════════════════════════════════════════════════════════════
// PARSE — extract a pump.fun create event from onLogs payload.
// ══════════════════════════════════════════════════════════════════
function parseLaunch(logs, sig) {
  const isCreate = logs.some((l) =>
    l.includes('Instruction: Create') || l.includes('InitializeMint') || l.includes('CreatePool')
  );
  if (!isCreate) return null;

  let name = 'UNKNOWN', symbol = '???', uri = '', mint = '', creator = '';
  for (const line of logs) {
    if (!line.includes('Program log:')) continue;
    const raw = line.replace(/^.*Program log:\s*/, '').trim();
    if (raw.startsWith('{')) {
      try {
        const d = JSON.parse(raw);
        name = d.name ?? d.tokenName ?? name;
        symbol = d.symbol ?? d.tokenSymbol ?? symbol;
        uri = d.uri ?? d.metadataUri ?? uri;
        mint = d.mint ?? mint;
        creator = d.user ?? d.creator ?? creator;
      } catch { /* not JSON, skip */ }
    }
  }
  if (!mint) return null;
  return { mint, creator, name, symbol, uri, signature: sig };
}

// ══════════════════════════════════════════════════════════════════
// DAILY GATES — in-memory now (single process owns all state).
// Reset on UTC midnight tick; seeded from Supabase once at boot so a
// restart mid-day doesn't reopen a blown daily-loss limit.
// ══════════════════════════════════════════════════════════════════
function dailyGatesOk() {
  if (Date.now() >= dailyResetAt) { dailyTrades = 0; dailyPnl = 0; dailyResetAt = nextUtcMidnight(); }
  if (positions.size >= MAX_POSITIONS) return { ok: false, reason: `max positions (${MAX_POSITIONS})` };
  if (dailyTrades >= MAX_DAILY_TRADES) return { ok: false, reason: `max daily trades (${MAX_DAILY_TRADES})` };
  if (dailyPnl <= -MAX_DAILY_LOSS) return { ok: false, reason: `daily loss limit hit (${dailyPnl.toFixed(4)} SOL)` };
  return { ok: true };
}
async function seedDailyCountersFromDB() {
  try {
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { data } = await sb.from('sniper_trades').select('pnl_sol, created_at').gte('created_at', since.toISOString());
    dailyTrades = data?.length ?? 0;
    dailyPnl = (data ?? []).reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
    L.info(`✦ Seeded daily counters: ${dailyTrades} trades, ${dailyPnl.toFixed(4)} SOL PnL`);
  } catch (e) { L.warn(`Daily counter seed failed: ${e.message}`); }
}

// ══════════════════════════════════════════════════════════════════
// RPC HELPERS (verified pump.fun bonding-curve layout — verbatim)
// ══════════════════════════════════════════════════════════════════
async function rpc(method, params) {
  try {
    const r = await fetch(RPC_HTTP, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(4000),
    });
    return (await r.json()).result ?? null;
  } catch { return null; }
}

async function getBondingCurve(mint) {
  try {
    const mintPk = new PublicKey(mint);
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPk.toBuffer()],
      new PublicKey(PUMP_PROGRAM)
    );
    const bcAddress = bondingCurve.toBase58();
    const r = await rpc('getAccountInfo', [bcAddress, { encoding: 'base64' }]);
    if (!r?.value?.data?.[0]) return null;
    const buf = Buffer.from(r.value.data[0], 'base64');
    if (buf.length < 49) return null;
    const realTokenReserves = buf.readBigUInt64LE(24);
    const realSolReserves   = buf.readBigUInt64LE(32);
    const tokenTotalSupply  = buf.readBigUInt64LE(40);
    const tts = Number(tokenTotalSupply);
    return {
      bcAddress,
      solInCurve: Number(realSolReserves) / 1e9,
      bondingPct: tts > 0 ? (tts - Number(realTokenReserves)) / tts : 0,
      graduated: buf[48] === 1,
    };
  } catch (e) { L.warn(`[bonding-curve] ${e.message}`); return null; }
}
async function getHolders(mint) {
  const r = await rpc('getTokenLargestAccounts', [mint]);
  return r?.value ?? [];
}
async function getRecentSigs(address, limit = 5) {
  const r = await rpc('getSignaturesForAddress', [address, { limit }]);
  return r ?? [];
}
async function getBuyVelocity(bondingCurve) {
  const sigs = await getRecentSigs(bondingCurve, 20);
  return sigs.filter((s) => s.blockTime && Date.now() / 1000 - s.blockTime < 10).length;
}

// ══════════════════════════════════════════════════════════════════
// QUALITY SCORE — deterministic, in-process replacement for the
// Gemini veto below. It scores the SAME five signals the mechanical
// rug check already computed (devHoldPct, clusterPct, devTxCount,
// solInCurve, buyVelocity, uniqueBuyers) — no new information, so an
// LLM call added latency and a failure mode without adding filtering
// power. This is a straight weighted formula over those signals:
// dev-hold and holder concentration dominate (strongest rug
// predictors), thin liquidity and a fresh dev wallet subtract,
// buy velocity and buyer count add back as corroborating "organic
// interest" signals. Tune the weights against real sniper_trades
// outcomes once you have enough closed positions to see what
// actually predicted losses.
//
// Writes into the same `ai_score` column the old veto used, so the
// dashboard needs no schema change.
// ══════════════════════════════════════════════════════════════════
function computeQualityScore(token) {
  let score = 100;
  score -= (token.devHoldPct || 0) * 150;               // dominant weight — strongest rug predictor
  score -= (token.clusterPct || 0) * 60;                 // top-3 holder concentration
  score -= Math.max(0, 5 - (token.devTxCount || 0)) * 6; // fresh/unproven dev wallet
  score -= Math.max(0, 5 - (token.solInCurve || 0)) * 4; // thin liquidity
  score += Math.min((token.buyVelocity || 0) * 2, 20);   // organic buy pressure, capped bonus
  score += Math.min((token.uniqueBuyers || 0) * 1, 15);  // broad holder base, capped bonus
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ══════════════════════════════════════════════════════════════════
// AI VETO — DORMANT. Not called from filter() anymore (see
// computeQualityScore above). Kept here, working and untouched, for
// the case where you want to feed an LLM something the mechanical
// filter genuinely can't score — token name/description for
// scam-language patterns beyond the honeypot keyword list, or the
// dev wallet's prior launch history. As written below it only sees
// the same five numbers the quality score already uses, which is
// why it was removed from the hot path: no information advantage,
// plus network latency and a fail-open failure mode. To re-enable,
// call this instead of/alongside computeQualityScore in filter().
// ══════════════════════════════════════════════════════════════════
async function aiVeto(token) {
  if (!GEMINI_API_KEY) return { vetoed: false, score: null };
  const prompt = `Solana memecoin risk analysis. Score 0-100 (60+=enter, <60=skip).

Token: ${token.symbol}
Liquidity: ${token.solInCurve?.toFixed?.(2)} SOL
Bonding: ${(token.bondingPct * 100)?.toFixed?.(1)}%
Buyers: ${token.uniqueBuyers}
Dev hold: ${(token.devHoldPct * 100)?.toFixed?.(1)}%
Buy velocity (10s): ${token.buyVelocity}

JSON only: {"score":<0-100>}`;
  try {
    const r = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 40 } }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    if (r.ok) {
      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 50));
      return { vetoed: score < MIN_AI_SCORE, score };
    }
  } catch { /* timeout or error → fail open */ }
  return { vetoed: false, score: null };
}

// ══════════════════════════════════════════════════════════════════
// MECHANICAL FILTER — the real gate. Verbatim 12-signal logic.
// ══════════════════════════════════════════════════════════════════
async function filter(token) {
  const [bc, holders, sigs] = await Promise.all([
    getBondingCurve(token.mint),
    getHolders(token.mint),
    token.creator ? getRecentSigs(token.creator, 20) : Promise.resolve([]),
  ]);
  const velo = bc ? await getBuyVelocity(bc.bcAddress) : 0;

  if (bc) {
    token.solInCurve = bc.solInCurve;
    token.bondingPct = bc.bondingPct;
    if (bc.graduated) return { pass: false, reason: 'graduated' };
  }
  if ((token.solInCurve ?? 0) < 3) return { pass: false, reason: `liq ${token.solInCurve?.toFixed?.(2)}SOL` };
  if ((token.bondingPct ?? 0) > 0.5) return { pass: false, reason: `bond ${(token.bondingPct * 100).toFixed(0)}%` };

  token.uniqueBuyers = holders.length;
  token.devHoldPct = holders[0] ? Math.min(parseFloat(holders[0].uiAmount || 0) / 1e9, 1) : 0;
  const top3 = holders.slice(0, 3).reduce((s, h) => s + parseFloat(h.uiAmount || 0), 0);
  token.clusterPct = Math.min(top3 / 1e9, 1);
  token.buyVelocity = velo;
  token.devTxCount = sigs.length;

  let rug = 0;
  if (token.devHoldPct > 0.20) rug += 4; else if (token.devHoldPct > 0.10) rug += 2;
  if (sigs.length < 5) rug += 2;
  if (token.clusterPct > 0.50) rug += 3;
  if (token.solInCurve < 5) rug += 1;
  token.rugScore = rug;
  if (rug >= 7) return { pass: false, reason: `rug ${rug}/10` };

  const qualityScore = computeQualityScore(token);
  token.aiScore = qualityScore; // reuse field name → same Supabase column, dashboard unchanged
  if (qualityScore < MIN_AI_SCORE) return { pass: false, reason: `quality ${qualityScore}` };
  return { pass: true, reason: `rug:${rug}/10 q:${qualityScore}` };
}

// ══════════════════════════════════════════════════════════════════
// EXECUTION — buy side. Verbatim Jupiter+Jito+RPC-fallback logic.
// ══════════════════════════════════════════════════════════════════
async function executeBuy(mint, lamports) {
  if (!keypair) return { success: false, reason: 'no keypair (paper mode or unset key)' };
  try {
    const qp = new URLSearchParams({ inputMint: SOL_MINT, outputMint: mint, amount: lamports.toString(), slippageBps: SLIPPAGE_BPS.toString(), onlyDirectRoutes: 'false' });
    const qRes = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) });
    if (!qRes.ok) return { success: false, reason: `quote ${qRes.status}` };
    const quote = await qRes.json();
    if (quote.error) return { success: false, reason: quote.error };

    const impact = Math.abs(parseFloat(quote.priceImpactPct ?? '0'));
    if (impact > MAX_IMPACT_FRACTION) return { success: false, reason: `impact ${(impact * 100).toFixed(1)}% > cap` };

    const swapRes = await fetch(`${JUP_URL}/swap`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote, userPublicKey: keypair.publicKey.toBase58(), wrapAndUnwrapSol: true,
        prioritizationFeeLamports: { jitoTipLamports: Math.round(JITO_TIP * 1e9) },
        dynamicComputeUnitLimit: true, dynamicSlippage: { maxBps: SLIPPAGE_BPS },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!swapRes.ok) return { success: false, reason: `swap ${swapRes.status}` };
    const { swapTransaction } = await swapRes.json();
    if (!swapTransaction) return { success: false, reason: 'no swapTx' };

    const txBuf = Buffer.from(swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);
    const signed = Buffer.from(tx.serialize()).toString('base64');

    const jitoRes = await fetch(`${JITO_URL}/bundles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [[signed]] }),
      signal: AbortSignal.timeout(4000),
    });
    const jitoData = await jitoRes.json().catch(() => ({}));
    if (jitoData.result) return { success: true, method: 'jito', outAmount: quote.outAmount, inAmount: quote.inAmount };

    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return { success: true, method: 'rpc', sig, outAmount: quote.outAmount, inAmount: quote.inAmount };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// sell side — unchanged from v5, only renamed for symmetry with executeBuy
async function executeSell(mint, amountRaw) {
  if (!keypair) return { success: false, reason: 'no keypair (paper mode or unset key)' };
  try {
    const qp = new URLSearchParams({ inputMint: mint, outputMint: SOL_MINT, amount: amountRaw.toString(), slippageBps: SLIPPAGE_BPS.toString(), onlyDirectRoutes: 'false' });
    const qRes = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) });
    if (!qRes.ok) return { success: false, reason: `quote ${qRes.status}` };
    const quote = await qRes.json();
    if (quote.error) return { success: false, reason: quote.error };

    const impact = Math.abs(parseFloat(quote.priceImpactPct || '0'));
    if (impact > MAX_IMPACT_FRACTION) return { success: false, reason: `impact ${(impact * 100).toFixed(1)}% > cap` };

    const swapRes = await fetch(`${JUP_URL}/swap`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote, userPublicKey: keypair.publicKey.toBase58(), wrapAndUnwrapSol: true,
        prioritizationFeeLamports: { jitoTipLamports: Math.round(JITO_TIP * 1e9) },
        dynamicComputeUnitLimit: true, dynamicSlippage: { maxBps: SLIPPAGE_BPS },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!swapRes.ok) return { success: false, reason: `swap ${swapRes.status}` };
    const { swapTransaction } = await swapRes.json();
    if (!swapTransaction) return { success: false, reason: 'no swapTx' };

    const txBuf = Buffer.from(swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);
    const signed = Buffer.from(tx.serialize()).toString('base64');

    const jitoRes = await fetch(`${JITO_URL}/bundles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [[signed]] }),
      signal: AbortSignal.timeout(4000),
    });
    const jitoData = await jitoRes.json().catch(() => ({}));
    if (jitoData.result) return { success: true, outAmount: quote.outAmount };

    await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return { success: true, outAmount: quote.outAmount };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════
// PIPELINE — detect → cheap-reject → gates → in-memory claim →
// filter → buy → track. One process, one lock, no DB round trip
// until AFTER the decision is made.
// ══════════════════════════════════════════════════════════════════
async function processCandidate(token) {
  const pre = cheapReject(token.name, token.symbol);
  if (pre) return;

  const gates = dailyGatesOk();
  if (!gates.ok) { L.info(`[gate] ${token.symbol}: ${gates.reason}`); return; }

  if (buying.has(token.mint) || positions.has(token.mint)) return; // in-memory lock — no race, single process
  buying.add(token.mint);

  try {
    const result = await filter(token);
    if (!result.pass) { L.info(`[filter] ${token.symbol}: ${result.reason}`); return; }

    let outAmount, inAmount, execMethod = 'paper';
    const lamports = Math.round(BUY_SOL * 1e9);

    if (!PAPER_MODE && keypair) {
      const exec = await executeBuy(token.mint, lamports);
      if (!exec.success) { L.warn(`[buy-failed] ${token.symbol}: ${exec.reason}`); return; }
      outAmount = exec.outAmount; inAmount = exec.inAmount; execMethod = exec.method;
    } else {
      const qp = new URLSearchParams({ inputMint: SOL_MINT, outputMint: token.mint, amount: lamports.toString(), slippageBps: SLIPPAGE_BPS.toString() });
      const r = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) }).then((x) => x.json()).catch(() => null);
      if (!r?.outAmount) { L.warn(`[paper-quote-fail] ${token.symbol}`); return; }
      outAmount = r.outAmount; inAmount = r.inAmount;
    }

    const tokensHeld = Number(outAmount) / 10 ** PUMP_DECIMALS;
    const solSpent = Number(inAmount) / 1e9;
    const entryPrice = tokensHeld > 0 ? solSpent / tokensHeld : NaN;
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) { L.warn(`[bad-entry-price] ${token.symbol}`); return; }

    // Own the position in memory FIRST — the exit manager can start
    // tracking it on its very next 5s tick, no Supabase dependency.
    dailyTrades += 1;
    positions.set(token.mint, {
      mint: token.mint, symbol: token.symbol, launchpad: 'pump_fun',
      entryPrice, entryTime: Date.now(), tokensHeld,
      athPrice: entryPrice, tp1Hit: false, tp2Hit: false, trailArmed: false,
      realizedPnl: 0, creator: token.creator || null,
    });
    if (token.creator) devWatching.set(token.mint, { creator: token.creator, lastSig: null });

    L.win(`ENTERED ${PAPER_MODE ? 'PAPER' : 'LIVE'} $${token.symbol} | ${solSpent.toFixed(4)} SOL | rug:${token.rugScore} ai:${token.aiScore ?? 'n/a'} | ${execMethod}`);
    tg(`🎯 *${PAPER_MODE ? 'PAPER ' : ''}SNIPE ENTRY* \`${token.symbol}\`\n${solSpent.toFixed(4)} SOL | rug:${token.rugScore} ai:${token.aiScore ?? 'n/a'}`);

    // Fire-and-forget — dashboard/durability only, never blocks the pipeline.
    sb.from('sniper_trades').insert({
      mint: token.mint, symbol: token.symbol, launchpad: 'pump_fun',
      action: 'SNIPE_ENTRY', status: 'open', is_paper: PAPER_MODE,
      size_sol: solSpent, entry_price: entryPrice, tokens_held: tokensHeld,
      ath_price: entryPrice, ai_score: token.aiScore ?? null, rug_score: token.rugScore ?? null,
    }).then(({ error }) => { if (error) L.warn(`[log-insert] ${token.symbol}: ${error.message}`); });
  } catch (e) {
    L.warn(`[pipeline-error] ${token.symbol}: ${e.message}`);
  } finally {
    buying.delete(token.mint);
  }
}

// ══════════════════════════════════════════════════════════════════
// DETECTION — direct Helius WebSocket via Connection.onLogs. No
// webhook, no intermediary service. This is what "as few moving
// parts as possible" buys back in latency vs. the v5 architecture.
// ══════════════════════════════════════════════════════════════════
function startDetection() {
  const programId = new PublicKey(PUMP_PROGRAM);
  connection.onLogs(programId, (logInfo) => {
    if (logInfo.err) return;
    const launch = parseLaunch(logInfo.logs, logInfo.signature);
    if (launch) processCandidate(launch).catch((e) => L.warn(`[candidate] ${e.message}`));
  }, 'processed');
  L.info(`✦ Subscribed to pump.fun program logs (${PUMP_PROGRAM.slice(0, 8)}...) via WebSocket`);
}

// ══════════════════════════════════════════════════════════════════
// POSITION MANAGER (every 5s) — unchanged from v5.
// ══════════════════════════════════════════════════════════════════
async function getLivePrice(mint) {
  try {
    const oneToken = 10 ** PUMP_DECIMALS;
    const qp = new URLSearchParams({ inputMint: mint, outputMint: SOL_MINT, amount: oneToken.toString(), slippageBps: '500' });
    const r = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    const q = await r.json();
    if (!q.outAmount) return null;
    return Number(q.outAmount) / 1e9;
  } catch { return null; }
}

async function managePositions() {
  if (positions.size === 0) return;

  for (const [mint, pos] of [...positions.entries()]) {
    const currentPrice = await getLivePrice(mint);
    if (!currentPrice || currentPrice <= 0 || !Number.isFinite(pos.entryPrice) || pos.entryPrice <= 0) continue;

    const x = currentPrice / pos.entryPrice;
    const minElapsed = (Date.now() - pos.entryTime) / 60000;
    if (currentPrice > pos.athPrice) pos.athPrice = currentPrice;
    const drawFromAth = pos.athPrice > 0 ? (pos.athPrice - currentPrice) / pos.athPrice : 0;
    const gainFromEntry = x - 1;
    if (!pos.trailArmed && gainFromEntry >= TRAIL_ACTIVATE_PCT) pos.trailArmed = true;

    let exitPct = 0, exitAction = null;
    if (devTriggered.has(mint))                          { exitPct = 1.0;  exitAction = 'DEV_WALLET_EXIT'; }
    else if (!pos.tp1Hit && x >= TP1_X)                   { pos.tp1Hit = true; exitPct = 0.50; exitAction = 'TP1_EXIT'; }
    else if (pos.tp1Hit && !pos.tp2Hit && x >= TP2_X)     { pos.tp2Hit = true; exitPct = 0.40; exitAction = 'TP2_EXIT'; }
    else if (x <= (1 - SL_PCT))                           { exitPct = 1.0;  exitAction = 'SL_EXIT'; }
    else if (pos.trailArmed && drawFromAth >= TRAIL_PCT)  { exitPct = 1.0;  exitAction = 'TRAIL_EXIT'; }
    else if (minElapsed >= MAX_HOLD_MIN && !pos.tp1Hit)   { exitPct = 1.0;  exitAction = 'TIMEOUT_EXIT'; }

    if (!exitAction || exitPct <= 0) {
      sb.from('sniper_trades').update({ ath_price: pos.athPrice, trail_armed: pos.trailArmed }).eq('mint', mint).eq('status', 'open')
        .then(({ error }) => { if (error) L.warn(`[ath-sync] ${error.message}`); });
      continue;
    }

    const tokensToSell = pos.tokensHeld * exitPct;
    let pnl;

    if (!PAPER_MODE && keypair) {
      const sellRaw = Math.round(tokensToSell * 10 ** PUMP_DECIMALS);
      const exec = await executeSell(mint, sellRaw);
      if (!exec.success) { L.warn(`Sell failed ${pos.symbol}: ${exec.reason}`); continue; }
      const solReceived = Number(exec.outAmount) / 1e9;
      pnl = solReceived - (pos.entryPrice * tokensToSell);
    } else {
      pnl = (currentPrice - pos.entryPrice) * tokensToSell;
    }

    pos.realizedPnl = (pos.realizedPnl || 0) + pnl;
    pos.tokensHeld -= tokensToSell;
    const fullExit = exitPct >= 1.0 || pos.tokensHeld <= 1e-6;
    if (fullExit) dailyPnl += pos.realizedPnl;

    sb.from('sniper_trades').update({
      action: exitAction, exit_price: currentPrice,
      multiplier_x: parseFloat(x.toFixed(4)),
      pnl_sol: parseFloat(pos.realizedPnl.toFixed(8)),
      tokens_held: pos.tokensHeld, ath_price: pos.athPrice,
      tp1_hit: pos.tp1Hit, tp2_hit: pos.tp2Hit, trail_armed: pos.trailArmed,
      realized_pnl: pos.realizedPnl,
      status: fullExit ? (pos.realizedPnl > 0 ? 'won' : 'lost') : 'open',
    }).eq('mint', mint).eq('status', 'open').then(({ error }) => { if (error) L.warn(`[exit-log] ${error.message}`); });

    if (fullExit) { positions.delete(mint); devWatching.delete(mint); devTriggered.delete(mint); }

    const icon = pnl > 0 ? '✅' : '❌';
    L.info(`${icon} ${exitAction} ${pos.symbol} | ${x.toFixed(2)}x | PnL:${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL`);
    if (fullExit) tg(`${pnl > 0 ? '🟢' : '🔴'} *${PAPER_MODE ? 'PAPER ' : ''}${exitAction}* \`${pos.symbol}\`\n${x.toFixed(2)}x | PnL: \`${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL\``);
  }
}

// ══════════════════════════════════════════════════════════════════
// DEV WALLET MONITOR (every 5s) — unchanged from v5.
// ══════════════════════════════════════════════════════════════════
async function checkDevWallets() {
  for (const [mint, info] of devWatching.entries()) {
    if (!info.creator) continue;
    try {
      const sigs = await rpc('getSignaturesForAddress', [info.creator, { limit: 3 }]);
      if (sigs?.length > 0) {
        const latest = sigs[0];
        if (latest.signature !== info.lastSig && Date.now() / 1000 - (latest.blockTime || 0) < 30) {
          if (info.lastSig !== null) {
            devTriggered.add(mint);
            L.alert(`DEV WALLET MOVED: ${mint.slice(0, 8)}... — exit triggered`);
            tg(`🚨 *DEV WALLET MOVE*\n\`${mint.slice(0, 8)}...\` — instant exit queued`);
          }
          devWatching.set(mint, { ...info, lastSig: latest.signature });
        }
      }
    } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════
// SYNC — periodic reconciliation with Supabase. Not the source of
// truth anymore (this process is), just a safety net for manual DB
// edits and a crash-recovery seed on the NEXT restart, not this one.
// ══════════════════════════════════════════════════════════════════
async function syncOpenPositionsFromDB() {
  try {
    const { data, error } = await sb.from('sniper_trades').select('*').eq('status', 'open');
    if (error) { L.warn(`Sync error: ${error.message}`); return; }
    for (const row of data ?? []) {
      if (!positions.has(row.mint)) {
        positions.set(row.mint, {
          mint: row.mint, symbol: row.symbol, launchpad: row.launchpad,
          entryPrice: parseFloat(row.entry_price), entryTime: new Date(row.created_at).getTime(),
          tokensHeld: row.tokens_held != null ? parseFloat(row.tokens_held) : 0,
          athPrice: row.ath_price != null ? parseFloat(row.ath_price) : parseFloat(row.entry_price),
          tp1Hit: row.tp1_hit ?? false, tp2Hit: row.tp2_hit ?? false, trailArmed: row.trail_armed ?? false,
          realizedPnl: row.realized_pnl != null ? parseFloat(row.realized_pnl) : 0,
          creator: row.creator ?? null,
        });
        if (row.creator) devWatching.set(row.mint, { creator: row.creator, lastSig: null });
        L.info(`[sync] adopted ${row.symbol} (${row.mint.slice(0, 8)}...) from Supabase — restart recovery`);
      }
    }
  } catch (e) { L.warn(`Sync exception: ${e.message}`); }
}

// ══════════════════════════════════════════════════════════════════
// STATS (every 5 min)
// ══════════════════════════════════════════════════════════════════
async function printStats() {
  try {
    const { data } = await sb.from('sniper_trades').select('pnl_sol, status, multiplier_x').order('created_at', { ascending: false }).limit(1000);
    const all = data ?? [];
    const wins = all.filter((t) => t.status === 'won').length;
    const losses = all.filter((t) => t.status === 'lost').length;
    const pnl = all.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
    const wr = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '—';
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  SQI SOVEREIGN SNIPER — v6 CONSOLIDATED SNAPSHOT');
    console.log(`  Mode: ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Uptime: ${Math.round((Date.now() - startTime) / 60000)}min`);
    console.log(`  W/L: ${wins}/${losses} (${wr}%) | Net PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | Open: ${positions.size}/${MAX_POSITIONS}`);
    console.log(`  Today: ${dailyTrades}/${MAX_DAILY_TRADES} trades | ${dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(4)} SOL`);
    console.log('══════════════════════════════════════════════════════');
    console.log('');
  } catch (e) { L.warn(`Stats error: ${e.message}`); }
}

// ══════════════════════════════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════════════════════════════
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  SQI SNIPER — Consolidated Worker (v6)           ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Mode:   ${PAPER_MODE ? '📋 PAPER' : '⚡ LIVE'}`);
  console.log(`  Wallet: ${keypair ? keypair.publicKey.toBase58() : 'Not set (paper mode)'}`);
  console.log(`  Entry:  BUY:${BUY_SOL}SOL MaxPos:${MAX_POSITIONS} MaxDailyTrades:${MAX_DAILY_TRADES} MaxDailyLoss:${MAX_DAILY_LOSS}SOL MinQuality:${MIN_AI_SCORE} (deterministic, no LLM call — GEMINI_API_KEY unused)`);
  console.log(`  Exit:   TP1:${TP1_X}x(50%) TP2:${TP2_X}x(40%) SL:-${SL_PCT * 100}% Trail:${TRAIL_PCT * 100}%(arms@+${TRAIL_ACTIVATE_PCT * 100}%) MaxHold:${MAX_HOLD_MIN}min`);
  console.log(`  Detection: direct Helius WebSocket (onLogs) — no webhook, no edge function`);
  console.log(`  Supabase: ${SUPABASE_URL.slice(8, 28)}... (logging only, async)`);
  console.log('');

  if (!HELIUS_API_KEY) { L.alert('No HELIUS_API_KEY set — detection cannot start. Exiting.'); process.exit(1); }

  await seedDailyCountersFromDB();
  await syncOpenPositionsFromDB();
  L.info(`✦ Loaded ${positions.size} open position(s) from Supabase`);

  startDetection();
  setInterval(syncOpenPositionsFromDB, 8000);
  setInterval(managePositions, 5000);
  setInterval(checkDevWallets, 5000);
  setInterval(printStats, 300000);
  setTimeout(printStats, 30000);

  L.info('✦ Consolidated sniper online — detection, filter, entry, and exit all in one process.');
  tg(`🌟 *SNIPER v6 ONLINE*\nMode: \`${PAPER_MODE ? 'PAPER' : 'LIVE'}\`\nManaging ${positions.size} open position(s)`);
}

start().catch((e) => { console.error('Fatal:', e); process.exit(1); });
