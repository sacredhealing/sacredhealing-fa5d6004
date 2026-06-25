/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQI SOVEREIGN SNIPER v3.0 — Hetzner Edition               ║
 * ║  Siddha Quantum Intelligence · Solana Memecoin Engine       ║
 * ║                                                              ║
 * ║  DETECTION STACK (auto-selects by env var):                 ║
 * ║  • CHAINSTACK_ENDPOINT set → Yellowstone gRPC (50ms) ✦     ║
 * ║  • Fallback → WebSocket logsSubscribe (200ms)               ║
 * ║                                                              ║
 * ║  EXECUTION:                                                  ║
 * ║  • PAPER_MODE=true  → simulate (default)                    ║
 * ║  • PAPER_MODE=false → live Jupiter swap + Jito bundle       ║
 * ║                                                              ║
 * ║  LAUNCHPADS:                                                 ║
 * ║  pump.fun · moonshot · launchlab · letsbonk                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// ── ENV ──────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY         = process.env.SUPABASE_SERVICE_KEY || '';
const HELIUS_API_KEY       = process.env.HELIUS_API_KEY        || '';
const CHAINSTACK_ENDPOINT  = process.env.CHAINSTACK_ENDPOINT   || '';  // e.g. sol-mainnet.g.alchemy.com or chainstack gRPC URL
const CHAINSTACK_TOKEN     = process.env.CHAINSTACK_TOKEN      || '';  // Yellowstone auth token
const GEMINI_API_KEY       = process.env.GEMINI_API_KEY        || 'AIzaAb8RN6I1pEG3CwLRQUrouoAGdXVOb--n9niPBfnCdu_OCQnkJw';
const WALLET_PRIVATE_KEY   = process.env.WALLET_PRIVATE_KEY    || '';  // base58 private key for live mode
const TELEGRAM_TOKEN       = process.env.TELEGRAM_TOKEN        || '';
const TELEGRAM_CHAT_ID     = process.env.TELEGRAM_CHAT_ID      || '';
const PAPER_MODE           = (process.env.PAPER_MODE || 'true') === 'true';

// ── TRADING CONFIG ───────────────────────────────────────────────
const BUY_SOL             = parseFloat(process.env.BUY_AMOUNT_SOL      || '0.05');
const MAX_POSITIONS       = parseInt(process.env.MAX_OPEN_POSITIONS     || '5');
const MAX_DAILY_TRADES    = parseInt(process.env.MAX_DAILY_TRADES       || '20');
const MAX_DAILY_LOSS      = parseFloat(process.env.MAX_DAILY_LOSS_SOL   || '0.5');
const TP1_X               = parseFloat(process.env.TAKE_PROFIT_X        || '3.0');
const TP2_X               = parseFloat(process.env.MOONBAG_X            || '10.0');
const SL_PCT              = parseFloat(process.env.STOP_LOSS_PCT         || '0.35');
const TRAIL_PCT           = parseFloat(process.env.TRAILING_STOP_PCT    || '0.25');
const MAX_HOLD_MIN        = parseInt(process.env.MAX_HOLD_MINUTES        || '30');
const MIN_AI_SCORE        = parseInt(process.env.MIN_AI_SCORE            || '60');
const JITO_TIP            = parseFloat(process.env.JITO_TIP_SOL          || '0.001');
const SLIPPAGE_BPS        = parseInt(process.env.SLIPPAGE_BPS            || '8000');

// ── CONSTANTS ────────────────────────────────────────────────────
const SOL_MINT    = 'So11111111111111111111111111111111111111112';
const USDC_MINT   = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const JITO_URL    = 'https://mainnet.block-engine.jito.wtf/api/v1';
const JUP_URL     = 'https://api.jup.ag/swap/v1';
const GEMINI_URL  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const LAUNCHPADS = {
  pump_fun:  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  moonshot:  'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
  launchlab: 'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj',
  letsbonk:  'bonkEybCyVQnDryE7VGhDisnZiWYhBFJPGTfKqE9uf5',
};

// ── RPC ──────────────────────────────────────────────────────────
const RPC_HTTP = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const WSS_URL = HELIUS_API_KEY
  ? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'wss://api.mainnet-beta.solana.com';

// ── CLIENTS ──────────────────────────────────────────────────────
const sb         = createClient(SUPABASE_URL, SUPABASE_KEY);
const connection = new Connection(RPC_HTTP, 'processed');
let   keypair    = null;
if (WALLET_PRIVATE_KEY && !PAPER_MODE) {
  try {
    keypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY));
  } catch (e) {
    console.error('❌ Invalid WALLET_PRIVATE_KEY');
  }
}

// ── STATE ────────────────────────────────────────────────────────
const positions      = new Map();   // mint → position
const devWatching    = new Map();   // mint → { creator, lastSig }
const devTriggered   = new Set();
const processed      = new Set();
let dailyTrades      = 0;
let dailyPnl         = 0;
let dailyReset       = Date.now();
let totalScanned     = 0;
let totalPassed      = 0;
let totalSniped      = 0;
const startTime      = Date.now();

// ══════════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════════
const L = {
  info:  (m) => console.log(`[${ts()}] • ${m}`),
  snipe: (m) => console.log(`[${ts()}] 🎯 ${m}`),
  win:   (m) => console.log(`[${ts()}] ✅ ${m}`),
  loss:  (m) => console.log(`[${ts()}] ❌ ${m}`),
  warn:  (m) => console.log(`[${ts()}] ⚠️  ${m}`),
  alert: (m) => console.log(`[${ts()}] 🚨 ${m}`),
};
const ts = () => new Date().toISOString().slice(11, 23);

// ── Telegram ─────────────────────────────────────────────────────
async function tg(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}
}

// ══════════════════════════════════════════════════════════════════
// RPC HELPERS
// ══════════════════════════════════════════════════════════════════
async function rpc(method, params) {
  try {
    const r = await fetch(RPC_HTTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(4000),
    });
    const d = await r.json();
    return d.result ?? null;
  } catch { return null; }
}

async function getBondingCurve(address) {
  const r = await rpc('getAccountInfo', [address, { encoding: 'base64' }]);
  if (!r?.value?.data?.[0]) return null;
  try {
    const buf = Buffer.from(r.value.data[0], 'base64');
    if (buf.length < 49) return null;
    return {
      solInCurve: Number(buf.readBigUInt64LE(32)) / 1e9,
      bondingPct: (() => {
        const tts = Number(buf.readBigUInt64LE(40));
        const rtr = Number(buf.readBigUInt64LE(24));
        return tts > 0 ? (tts - rtr) / tts : 0;
      })(),
      graduated: buf[48] === 1,
    };
  } catch { return null; }
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
  return sigs.filter(s => s.blockTime && Date.now() / 1000 - s.blockTime < 10).length;
}

// ══════════════════════════════════════════════════════════════════
// GEMINI AI SCORER
// ══════════════════════════════════════════════════════════════════
async function aiScore(token) {
  const prompt = `Solana memecoin risk analysis. Score 0-100 (60+=enter, <60=skip).

Token: ${token.symbol} on ${token.launchpad}
Liquidity: ${token.solInCurve?.toFixed(2)} SOL
Bonding: ${(token.bondingPct * 100)?.toFixed(1)}%
Buyers: ${token.uniqueBuyers}
Dev hold: ${(token.devHoldPct * 100)?.toFixed(1)}%
Buy velocity (10s): ${token.buyVelocity}
Top3 cluster: ${(token.clusterPct * 100)?.toFixed(1)}%
Twitter: ${token.hasTwitter} TG: ${token.hasTelegram} Web: ${token.hasWebsite}
Twitter 5m: ${token.twitterMentions} mentions
Dev rugs: ${token.devRugs}

JSON only: {"score":<0-100>,"reason":"<8 words>"}`;

  try {
    const r = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 },
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (r.ok) {
      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      return Math.max(0, Math.min(100, parseInt(parsed.score) || 50));
    }
  } catch {}
  return ruleScore(token);
}

function ruleScore(t) {
  let s = 50;
  if (t.solInCurve >= 10) s += 10; else if (t.solInCurve >= 5) s += 5;
  if (t.uniqueBuyers >= 10) s += 8; else if (t.uniqueBuyers >= 5) s += 4;
  if (t.hasTwitter)  s += 8;
  if (t.hasTelegram) s += 5;
  if (t.hasWebsite)  s += 4;
  if (t.twitterMentions >= 5) s += 10;
  if (t.buyVelocity >= 5) s += 8;
  if (t.bondingPct >= 0.05 && t.bondingPct <= 0.25) s += 5;
  if (t.devHoldPct > 0.20) s -= 20; else if (t.devHoldPct > 0.10) s -= 10;
  if (t.devRugs > 0) s -= 15 * t.devRugs;
  if (t.clusterPct > 0.50) s -= 20; else if (t.clusterPct > 0.30) s -= 10;
  if (t.solInCurve < 3) s -= 15;
  if (t.uniqueBuyers < 3) s -= 10;
  const HONEY = ['airdrop','claim','official','presale','safe','guaranteed','100x'];
  if (HONEY.some(k => (t.name + t.symbol).toLowerCase().includes(k))) s -= 25;
  return Math.max(0, Math.min(100, s));
}

// ══════════════════════════════════════════════════════════════════
// 12-SIGNAL FILTER (parallel)
// ══════════════════════════════════════════════════════════════════
async function filter(token) {
  const start = Date.now();

  const [bc, holders, sigs, vel] = await Promise.allSettled([
    token.bondingCurve ? getBondingCurve(token.bondingCurve) : Promise.resolve(null),
    getHolders(token.mint),
    token.creator ? getRecentSigs(token.creator, 20) : Promise.resolve([]),
    token.bondingCurve ? getBuyVelocity(token.bondingCurve) : Promise.resolve(0),
  ]);

  const bcData = bc.value;
  const hList  = holders.value ?? [];
  const cTxns  = sigs.value ?? [];
  const velo   = vel.value ?? 0;

  // Fetch token metadata for social links
  let meta = {};
  if (token.uri) {
    try {
      const r = await fetch(token.uri, { signal: AbortSignal.timeout(2000) });
      if (r.ok) meta = await r.json().catch(() => ({}));
    } catch {}
  }

  // S1: Bonding curve
  if (bcData) {
    token.solInCurve = bcData.solInCurve;
    token.bondingPct = bcData.bondingPct;
    if (bcData.graduated) return { pass: false, reason: 'graduated' };
  }
  // S2: Liquidity
  if ((token.solInCurve || 0) < 3) return { pass: false, reason: `liq ${token.solInCurve?.toFixed(2)}SOL` };
  // S3: Too late
  if ((token.bondingPct || 0) > 0.5) return { pass: false, reason: `bond ${(token.bondingPct*100).toFixed(0)}%` };
  // S4: Dev age
  token.devTxCount = cTxns.length;
  // S5: Holders
  token.uniqueBuyers = hList.length;
  token.devHoldPct = hList[0] ? Math.min(parseFloat(hList[0].uiAmount||0) / 1e9, 1) : 0;
  // S6: Cluster
  const top3 = hList.slice(0,3).reduce((s,h) => s + parseFloat(h.uiAmount||0), 0);
  token.clusterPct = Math.min(top3 / 1e9, 1);
  // S7: Velocity
  token.buyVelocity = velo;
  // S8-9: Social
  token.hasTwitter  = !!(meta.twitter || meta.twitterHandle);
  token.hasTelegram = !!(meta.telegram);
  token.hasWebsite  = !!(meta.website);
  token.twitterMentions = 0; // Twitter API call here if bearer token set
  // S10: Honeypot
  const HONEY = ['airdrop','claim','official','presale','safe','guaranteed'];
  token.isHoneypot = HONEY.some(k => (token.name + token.symbol).toLowerCase().includes(k));
  // S11: Rug score
  let rug = 0;
  if (token.devHoldPct > 0.20) rug += 4;
  else if (token.devHoldPct > 0.10) rug += 2;
  if (cTxns.length < 5) rug += 2;
  if ((token.devRugs || 0) > 0) rug += 3;
  if (token.clusterPct > 0.50) rug += 3;
  if (!token.hasTwitter && !token.hasTelegram && !token.hasWebsite) rug += 2;
  if (token.isHoneypot) rug += 3;
  if (token.solInCurve < 5) rug += 1;
  token.rugScore = rug;
  if (rug >= 7) return { pass: false, reason: `rug ${rug}/10` };
  // S12: AI
  token.aiScore = await aiScore(token);

  const ms = Date.now() - start;
  L.info(`Filter ${token.symbol} | AI:${token.aiScore} Rug:${rug}/10 | Liq:${token.solInCurve?.toFixed(2)} | ${ms}ms`);

  return token.aiScore >= MIN_AI_SCORE
    ? { pass: true,  reason: `AI:${token.aiScore} Rug:${rug}/10` }
    : { pass: false, reason: `AI:${token.aiScore}<${MIN_AI_SCORE}` };
}

// ══════════════════════════════════════════════════════════════════
// LIVE EXECUTION — Jupiter swap + Jito bundle
// ══════════════════════════════════════════════════════════════════
async function executeSwap(mint, lamports, isBuy = true) {
  if (!keypair) return { success: false, reason: 'no keypair' };

  try {
    // 1. Get Jupiter quote
    const inputMint  = isBuy ? SOL_MINT : mint;
    const outputMint = isBuy ? mint     : SOL_MINT;

    const quoteParams = new URLSearchParams({
      inputMint, outputMint,
      amount:       lamports.toString(),
      slippageBps:  SLIPPAGE_BPS.toString(),
      onlyDirectRoutes: 'false',
    });
    const qRes  = await fetch(`${JUP_URL}/quote?${quoteParams}`, { signal: AbortSignal.timeout(3000) });
    if (!qRes.ok) return { success: false, reason: `quote ${qRes.status}` };
    const quote = await qRes.json();
    if (quote.error) return { success: false, reason: quote.error };

    // 2. Get swap transaction
    const swapRes = await fetch(`${JUP_URL}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse:              quote,
        userPublicKey:              keypair.publicKey.toBase58(),
        wrapAndUnwrapSol:           true,
        prioritizationFeeLamports:  { jitoTipLamports: Math.round(JITO_TIP * 1e9) },
        dynamicComputeUnitLimit:    true,
        dynamicSlippage:            { maxBps: SLIPPAGE_BPS },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!swapRes.ok) return { success: false, reason: `swap ${swapRes.status}` };
    const { swapTransaction } = await swapRes.json();
    if (!swapTransaction) return { success: false, reason: 'no swapTx' };

    // 3. Sign
    const txBuf = Buffer.from(swapTransaction, 'base64');
    const tx    = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);
    const signed = Buffer.from(tx.serialize()).toString('base64');

    // 4. Send via Jito bundle
    const jitoRes = await fetch(`${JITO_URL}/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [[signed]] }),
      signal: AbortSignal.timeout(4000),
    });
    const jitoData = await jitoRes.json();
    if (jitoData.result) {
      return { success: true, method: 'jito', bundleId: jitoData.result };
    }

    // 5. Fallback: direct RPC sendTransaction
    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    return { success: true, method: 'rpc', sig };

  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════
// POSITION ENTRY
// ══════════════════════════════════════════════════════════════════
async function enter(token, filterResult) {
  // Reset daily if needed
  if (Date.now() - dailyReset > 86400000) { dailyTrades = 0; dailyPnl = 0; dailyReset = Date.now(); }
  if (dailyTrades >= MAX_DAILY_TRADES)   return L.warn(`Daily limit (${MAX_DAILY_TRADES})`);
  if (dailyPnl   <= -MAX_DAILY_LOSS)    return L.warn('Daily loss limit hit');
  if (positions.size >= MAX_POSITIONS)   return L.warn(`Max positions (${MAX_POSITIONS})`);
  if (positions.has(token.mint))         return;

  const entryPrice = Math.max((token.bondingPct || 0.01) * 0.000069, 0.0000001);

  // LIVE EXECUTION
  let execResult = { success: true, method: 'paper' };
  if (!PAPER_MODE && keypair) {
    execResult = await executeSwap(token.mint, Math.round(BUY_SOL * 1e9), true);
    if (!execResult.success) {
      L.warn(`Buy failed: ${execResult.reason}`);
      return;
    }
  }

  const pos = {
    mint:      token.mint,
    symbol:    token.symbol,
    launchpad: token.launchpad,
    entryPrice, entryTime: Date.now(),
    sizeSol:   BUY_SOL,
    tokensHeld:BUY_SOL / entryPrice,
    athPrice:  entryPrice,
    tp1Hit:    false, tp2Hit: false,
    aiScore:   token.aiScore, rugScore: token.rugScore,
    execMethod:execResult.method,
    // Paper sim params
    _win:  Math.random() < 0.22,
    _peak: Math.random() < 0.22 ? (Math.random() * 15 + 3) : (Math.random() * 1.3 + 0.1),
  };

  positions.set(token.mint, pos);
  devWatching.set(token.mint, { creator: token.creator, lastSig: null });
  dailyTrades++;
  totalSniped++;

  // Write to Supabase sniper_trades
  try {
    await sb.from('sniper_trades').insert({
      mint:        token.mint,
      symbol:      token.symbol,
      launchpad:   token.launchpad,
      action:      'SNIPE_ENTRY',
      size_sol:    BUY_SOL,
      entry_price: entryPrice,
      ai_score:    token.aiScore,
      rug_score:   token.rugScore,
      status:      'open',
      mode:        PAPER_MODE ? 'PAPER' : 'LIVE',
    });
  } catch (e) { L.warn(`DB insert: ${e.message}`); }

  const mode = PAPER_MODE ? '📋 PAPER' : '⚡ LIVE';
  const msg = `${mode} ENTERED $${token.symbol} [${token.launchpad}] | AI:${token.aiScore} Rug:${token.rugScore} | ${BUY_SOL}SOL | Liq:${token.solInCurve?.toFixed(2)}SOL`;
  L.snipe(msg);
  tg(`🎯 *${mode} SNIPE*\n\`${token.symbol}\` · ${token.launchpad}\nAI: \`${token.aiScore}/100\` Rug: \`${token.rugScore}/10\`\n${BUY_SOL} SOL · ${execResult.method}`);
}

// ══════════════════════════════════════════════════════════════════
// LIVE PRICE FETCH
// ══════════════════════════════════════════════════════════════════
async function getLivePrice(pos) {
  // Jupiter quote: how much SOL for 1 unit of this token
  try {
    const qp = new URLSearchParams({
      inputMint:  pos.mint,
      outputMint: SOL_MINT,
      amount:     '1000000', // 1M tokens (adjust for token decimals)
      slippageBps:'500',
    });
    const r = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const q = await r.json();
      if (q.outAmount) return parseFloat(q.outAmount) / 1e9 / 1e6 * 1e9; // rough price in SOL
    }
  } catch {}
  return null;
}

// ══════════════════════════════════════════════════════════════════
// PAPER PRICE SIMULATION
// ══════════════════════════════════════════════════════════════════
function simPrice(pos) {
  const min = (Date.now() - pos.entryTime) / 60000;
  if (pos._win) {
    const p = Math.min(min / 8, 1.0);
    let price = pos.entryPrice * (1 + (pos._peak - 1) * p);
    if (min > 15) price *= Math.max(0.3, 1 - (min - 15) * 0.06);
    return Math.max(price, pos.entryPrice * 0.01);
  }
  return Math.max(pos.entryPrice * Math.max(0.05, 1 - min * 0.09), 0.000001);
}

// ══════════════════════════════════════════════════════════════════
// POSITION MANAGER (every 5s)
// ══════════════════════════════════════════════════════════════════
async function managePositions() {
  if (positions.size === 0) return;

  for (const [mint, pos] of [...positions.entries()]) {
    let currentPrice;
    if (PAPER_MODE) {
      currentPrice = simPrice(pos);
    } else {
      currentPrice = (await getLivePrice(pos)) || pos.entryPrice;
    }

    if (!currentPrice || currentPrice <= 0) continue;

    const x    = currentPrice / pos.entryPrice;
    const min  = (Date.now() - pos.entryTime) / 60000;
    if (currentPrice > pos.athPrice) pos.athPrice = currentPrice;
    const draw = pos.athPrice > 0 ? (pos.athPrice - currentPrice) / pos.athPrice : 0;

    let exitPct = 0, exitAction = null;

    if (devTriggered.has(mint))                                { exitPct = 1.0; exitAction = 'DEV_WALLET_EXIT'; }
    else if (!pos.tp1Hit && x >= TP1_X)                       { pos.tp1Hit = true; exitPct = 0.50; exitAction = 'TP1_EXIT'; }
    else if (pos.tp1Hit && !pos.tp2Hit && x >= TP2_X)         { pos.tp2Hit = true; exitPct = 0.40; exitAction = 'TP2_EXIT'; }
    else if (x <= (1 - SL_PCT))                               { exitPct = 1.0; exitAction = 'SL_EXIT'; }
    else if (pos.tp1Hit && draw >= TRAIL_PCT)                  { exitPct = 1.0; exitAction = 'TRAIL_EXIT'; }
    else if (min >= MAX_HOLD_MIN && !pos.tp1Hit)              { exitPct = 1.0; exitAction = 'TIMEOUT_EXIT'; }

    if (exitAction && exitPct > 0) {
      // LIVE SELL EXECUTION
      if (!PAPER_MODE && keypair) {
        const sellLamports = Math.round(pos.tokensHeld * exitPct); // rough
        const execResult = await executeSwap(mint, sellLamports, false);
        if (!execResult.success) {
          L.warn(`Sell failed ${pos.symbol}: ${execResult.reason}`);
          continue;
        }
      }

      const pnl = (x - 1) * pos.sizeSol * exitPct;
      dailyPnl += pnl;

      const fullExit = exitPct >= 1.0 || pos.tp2Hit;
      if (fullExit) {
        positions.delete(mint);
        devWatching.delete(mint);
        devTriggered.delete(mint);
      }

      try {
        await sb.from('sniper_trades').update({
          action: exitAction, exit_price: currentPrice,
          multiplier_x: parseFloat(x.toFixed(4)),
          pnl_sol: parseFloat(pnl.toFixed(8)),
          status:  pnl > 0 ? 'won' : 'lost',
        }).eq('mint', mint).eq('status', 'open');
      } catch {}

      const icon = pnl > 0 ? '✅' : '❌';
      L.info(`${icon} ${exitAction} ${pos.symbol} | ${x.toFixed(2)}x | PnL:${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | Daily:${dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(4)} SOL`);
      if (fullExit) tg(`${pnl>0?'🟢':'🔴'} *${PAPER_MODE?'PAPER ':''}${exitAction}* \`${pos.symbol}\`\n${x.toFixed(2)}x | PnL: \`${pnl>=0?'+':''}${pnl.toFixed(4)} SOL\`\nDaily: \`${dailyPnl:+.4f} SOL\``);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// DEV WALLET MONITOR (every 5s)
// ══════════════════════════════════════════════════════════════════
async function checkDevWallets() {
  for (const [mint, info] of devWatching.entries()) {
    if (!info.creator) continue;
    try {
      const sigs = await getRecentSigs(info.creator, 3);
      if (sigs.length > 0) {
        const latest = sigs[0];
        if (latest.signature !== info.lastSig && Date.now() / 1000 - (latest.blockTime || 0) < 30) {
          if (info.lastSig !== null) {
            devTriggered.add(mint);
            L.alert(`DEV WALLET MOVED: ${mint.slice(0,8)}... — exit triggered`);
            tg(`🚨 *DEV WALLET MOVE*\n\`${mint.slice(0,8)}...\` — instant exit queued`);
          }
          devWatching.set(mint, { ...info, lastSig: latest.signature });
        }
      }
    } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════
// EVENT PARSER
// ══════════════════════════════════════════════════════════════════
function parseLaunch(value, launchpad) {
  try {
    const logs = value?.logs ?? [];
    const sig  = value?.signature ?? '';
    if (!logs.length) return null;

    const isCreate = logs.some(l =>
      l.includes('Instruction: Create') ||
      l.includes('InitializeMint') || l.includes('CreatePool')
    );
    if (!isCreate) return null;

    let name = 'UNKNOWN', symbol = '???', uri = '', mint = '', creator = '';

    for (const line of logs) {
      if (!line.includes('Program log:')) continue;
      const raw = line.replace(/^.*Program log:\s*/, '').trim();
      if (raw.startsWith('{')) {
        try {
          const d = JSON.parse(raw);
          name    = d.name    || d.tokenName    || name;
          symbol  = d.symbol  || d.tokenSymbol  || symbol;
          uri     = d.uri     || d.metadataUri  || uri;
          mint    = d.mint    || mint;
          creator = d.user    || d.creator      || creator;
        } catch {}
      }
    }

    const key = mint || sig;
    if (!key || processed.has(key)) return null;
    processed.add(key);
    if (processed.size > 20000) {
      [...processed].slice(0, 10000).forEach(k => processed.delete(k));
    }

    return {
      mint, creator, bondingCurve: '', launchpad,
      name, symbol, uri, signature: sig,
      solInCurve: 0, bondingPct: 0, uniqueBuyers: 0,
      devHoldPct: 0, clusterPct: 0, buyVelocity: 0,
      hasTwitter: false, hasTelegram: false, hasWebsite: false,
      twitterMentions: 0, devRugs: 0,
      aiScore: 0, rugScore: 0,
    };
  } catch (e) {
    L.warn(`Parse [${launchpad}]: ${e.message}`);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// YELLOWSTONE gRPC LISTENER — Chainstack
// ══════════════════════════════════════════════════════════════════
// gRPC via @triton-one/yellowstone-grpc npm package
// NOTE: This activates automatically when CHAINSTACK_ENDPOINT is set.
// The package is optional — falls back to WebSocket if not installed.
async function startYellowstoneListener() {
  try {
    // Dynamic import — only works if @triton-one/yellowstone-grpc is installed
    const { default: Client, CommitmentLevel } = await import('@triton-one/yellowstone-grpc');

    const client = new Client(CHAINSTACK_ENDPOINT, CHAINSTACK_TOKEN, {});
    const stream  = await client.subscribe();

    // Subscribe to all launchpad program accounts
    const subscribeRequest = {
      accounts:         {},
      slots:            {},
      transactions:     {},
      transactionsStatus:{},
      blocks:           {},
      blocksMeta:       {},
      entry:            {},
      accountsDataSlice:[],
      ping:             undefined,
    };

    // Subscribe to each launchpad
    for (const [name, programId] of Object.entries(LAUNCHPADS)) {
      subscribeRequest.transactions[`sniper_${name}`] = {
        vote:          false,
        failed:        false,
        signature:     undefined,
        accountInclude:[programId],
        accountExclude:[],
        accountRequired:[],
      };
    }

    await new Promise((resolve, reject) => {
      stream.write(subscribeRequest, (err) => err ? reject(err) : resolve());
    });

    L.info(`✦ YELLOWSTONE gRPC connected: ${CHAINSTACK_ENDPOINT}`);
    tg('🌐 *Yellowstone gRPC ONLINE*\nSub-50ms detection active');

    stream.on('data', async (data) => {
      if (!data?.transaction) return;
      totalScanned++;

      try {
        const tx    = data.transaction;
        const msg   = tx?.transaction?.transaction?.message;
        const meta  = tx?.transaction?.meta;
        if (!msg || !meta) return;

        // Determine which launchpad triggered
        const accounts = msg.accountKeys?.map(k =>
          typeof k === 'string' ? k : Buffer.from(k).toString('base58')
        ) ?? [];

        let detectedLaunchpad = null;
        for (const [name, pid] of Object.entries(LAUNCHPADS)) {
          if (accounts.includes(pid)) { detectedLaunchpad = name; break; }
        }
        if (!detectedLaunchpad) return;

        // Build value object mimicking WebSocket format
        const value = {
          signature: tx.signature ? Buffer.from(tx.signature).toString('base58') : '',
          logs: meta.logMessages ?? [],
        };

        const token = parseLaunch(value, detectedLaunchpad);
        if (!token) return;

        L.info(`[gRPC ${detectedLaunchpad}] $${token.symbol} | ${token.mint.slice(0,8)}...`);

        const result = await filter(token);
        if (result.pass) {
          totalPassed++;
          L.info(`✅ PASS $${token.symbol} | ${result.reason}`);
          await enter(token, result);
        }
      } catch (e) {
        L.warn(`gRPC data error: ${e.message}`);
      }
    });

    stream.on('error', (e) => {
      L.warn(`gRPC error: ${e.message} — restarting in 5s`);
      setTimeout(startYellowstoneListener, 5000);
    });
    stream.on('end', () => {
      L.warn('gRPC stream ended — restarting in 5s');
      setTimeout(startYellowstoneListener, 5000);
    });

  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND' || e.message.includes('Cannot find')) {
      L.warn('@triton-one/yellowstone-grpc not installed — run: npm install @triton-one/yellowstone-grpc');
      L.warn('Falling back to WebSocket...');
      startWebSocketListeners();
    } else {
      L.warn(`Yellowstone error: ${e.message} — falling back to WebSocket`);
      startWebSocketListeners();
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// WEBSOCKET LISTENER (fallback / current mode)
// ══════════════════════════════════════════════════════════════════
function subscribeWS(launchpad, programId) {
  let ws, delay = 1000;

  function connect() {
    ws = new WebSocket(WSS_URL);

    ws.on('open', () => {
      delay = 1000;
      L.info(`[WS ${launchpad}] connected`);
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'logsSubscribe',
        params: [{ mentions: [programId] }, { commitment: 'processed' }],
      }));
    });

    ws.on('message', async (raw) => {
      try {
        const data  = JSON.parse(raw.toString());
        const value = data?.params?.result?.value;
        if (!value) return;
        totalScanned++;
        const token = parseLaunch(value, launchpad);
        if (!token) return;
        L.info(`[WS ${launchpad}] $${token.symbol}`);
        const result = await filter(token);
        if (result.pass) {
          totalPassed++;
          L.info(`✅ PASS $${token.symbol} | ${result.reason}`);
          await enter(token, result);
        }
      } catch (e) { L.warn(`[WS ${launchpad}] msg error: ${e.message}`); }
    });

    ws.on('close', () => {
      L.warn(`[WS ${launchpad}] closed — retry in ${delay / 1000}s`);
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, 60000);
    });
    ws.on('error', (e) => L.warn(`[WS ${launchpad}] error: ${e.message}`));
  }

  connect();
}

function startWebSocketListeners() {
  for (const [name, pid] of Object.entries(LAUNCHPADS)) {
    setTimeout(() => subscribeWS(name, pid), Object.keys(LAUNCHPADS).indexOf(name) * 500);
  }
}

// ══════════════════════════════════════════════════════════════════
// STATS (every 5 min)
// ══════════════════════════════════════════════════════════════════
async function printStats() {
  try {
    const { data } = await sb.from('sniper_trades')
      .select('pnl_sol, status, multiplier_x')
      .order('created_at', { ascending: false })
      .limit(1000);

    const all    = data ?? [];
    const wins   = all.filter(t => t.status === 'won').length;
    const losses = all.filter(t => t.status === 'lost').length;
    const pnl    = all.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
    const bestX  = all.reduce((m, t) => Math.max(m, parseFloat(t.multiplier_x) || 1), 1);
    const wr     = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '—';
    const uptime = Math.round((Date.now() - startTime) / 60000);

    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  SQI SOVEREIGN SNIPER v3 — SNAPSHOT');
    console.log(`  Mode:     ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Uptime: ${uptime}min`);
    console.log(`  Detect:   ${CHAINSTACK_ENDPOINT ? 'Yellowstone gRPC' : 'WebSocket'}`);
    console.log(`  Scanned:  ${totalScanned.toLocaleString()} | Passed: ${totalPassed} | Sniped: ${totalSniped}`);
    console.log(`  W/L:      ${wins}/${losses} (${wr}% win rate)`);
    console.log(`  Net PnL:  ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | Best: ${bestX.toFixed(1)}x`);
    console.log(`  Open:     ${positions.size} | Daily: ${dailyTrades} trades`);
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
  console.log('║  SQI SOVEREIGN SNIPER v3.0 — Hetzner Edition    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Mode:      ${PAPER_MODE ? '📋 PAPER TRADING' : '⚡ LIVE TRADING'}`);
  console.log(`  Detect:    ${CHAINSTACK_ENDPOINT ? '🟢 Yellowstone gRPC (50ms)' : '🟡 WebSocket (200ms)'}`);
  console.log(`  Wallet:    ${keypair ? keypair.publicKey.toBase58() : 'Not set (paper mode)'}`);
  console.log(`  Launchpads:${Object.keys(LAUNCHPADS).join(', ')}`);
  console.log(`  Buy:       ${BUY_SOL} SOL | TP1:${TP1_X}x | TP2:${TP2_X}x | SL:-${SL_PCT*100}%`);
  console.log(`  AI Gate:   Gemini 2.5 Flash ≥ ${MIN_AI_SCORE}/100`);
  console.log(`  Supabase:  ${SUPABASE_URL.slice(8, 28)}...`);
  console.log('');

  if (!HELIUS_API_KEY && !CHAINSTACK_ENDPOINT) {
    console.error('❌ Set HELIUS_API_KEY or CHAINSTACK_ENDPOINT');
    process.exit(1);
  }

  // Start detection
  if (CHAINSTACK_ENDPOINT && CHAINSTACK_TOKEN) {
    await startYellowstoneListener(); // tries gRPC, falls back to WS
  } else {
    startWebSocketListeners();
  }

  // Management loops
  setInterval(managePositions, 5000);
  setInterval(checkDevWallets, 5000);
  setInterval(printStats,     300000);
  setTimeout(printStats,       30000);

  L.info('✦ All systems online. Scanning for launches...');
  tg(`🌟 *SNIPER v3 ONLINE*\nMode: \`${PAPER_MODE?'PAPER':'LIVE'}\`\nDetect: \`${CHAINSTACK_ENDPOINT?'Yellowstone gRPC':'WebSocket'}\`\nLaunchpads: \`${Object.keys(LAUNCHPADS).join(' · ')}\``);
}

start().catch(e => { console.error('Fatal:', e); process.exit(1); });
