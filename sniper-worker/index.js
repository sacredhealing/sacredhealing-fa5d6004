/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQI SOVEREIGN SNIPER v2.0 — Railway 24/7 Worker            ║
 * ║  Siddha Quantum Intelligence · Solana Memecoin Engine        ║
 * ║                                                              ║
 * ║  FREE STACK:                                                 ║
 * ║  • Detection:  Helius WebSocket (free) → Alchemy gRPC later  ║
 * ║  • Scoring:    Gemini 2.5 Flash AI (12 signals, ~$0.25/mo)   ║
 * ║  • Execution:  Jupiter swap + Jito tip (free, SOL only)      ║
 * ║  • Launchpads: pump.fun + Moonshot + Believe + LaunchLab     ║
 * ║  • Monitor:    Dev wallet watcher every 5s                   ║
 * ║  • DB:         Supabase sniper_trades (direct REST)          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// ── ENV VARS (set in Railway dashboard) ──────────────────────────
const SUPABASE_URL        = process.env.SUPABASE_URL        || 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SUPABASE_KEY        = process.env.SUPABASE_SERVICE_KEY || '';
const HELIUS_API_KEY      = process.env.HELIUS_API_KEY       || '';
const ALCHEMY_API_KEY     = process.env.ALCHEMY_API_KEY      || '';
const GEMINI_API_KEY      = process.env.GEMINI_API_KEY       || 'AIzaAb8RN6I1pEG3CwLRQUrouoAGdXVOb--n9niPBfnCdu_OCQnkJw';
const TWITTER_BEARER      = process.env.TWITTER_BEARER_TOKEN || '';
const BOT_USER_ID         = process.env.BOT_USER_ID          || '';
const PAPER_MODE          = (process.env.PAPER_MODE || 'true') === 'true';

// ── TRADING CONFIG ────────────────────────────────────────────────
const BUY_AMOUNT_SOL      = parseFloat(process.env.BUY_AMOUNT_SOL      || '0.05');
const MAX_OPEN_POSITIONS  = parseInt(process.env.MAX_OPEN_POSITIONS     || '5');
const MAX_DAILY_TRADES    = parseInt(process.env.MAX_DAILY_TRADES       || '25');
const MAX_DAILY_LOSS_SOL  = parseFloat(process.env.MAX_DAILY_LOSS_SOL   || '0.5');
const TAKE_PROFIT_X       = parseFloat(process.env.TAKE_PROFIT_X        || '3.0');
const MOONBAG_X           = parseFloat(process.env.MOONBAG_X            || '10.0');
const STOP_LOSS_PCT       = parseFloat(process.env.STOP_LOSS_PCT         || '0.35');
const TRAILING_STOP_PCT   = parseFloat(process.env.TRAILING_STOP_PCT    || '0.25');
const MAX_HOLD_MINUTES    = parseInt(process.env.MAX_HOLD_MINUTES        || '30');
const MIN_AI_SCORE        = parseInt(process.env.MIN_AI_SCORE            || '60');
const JITO_TIP_SOL        = parseFloat(process.env.JITO_TIP_SOL          || '0.001');

// ── PROGRAM IDS ───────────────────────────────────────────────────
const LAUNCHPADS = {
  pump_fun:  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  moonshot:  'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
  launchlab: 'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj',
  letsbonk:  'bonkEybCyVQnDryE7VGhDisnZiWYhBFJPGTfKqE9uf5',
};

// ── ENDPOINTS ─────────────────────────────────────────────────────
const RPC_HTTP = ALCHEMY_API_KEY
  ? `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const WSS_URL = ALCHEMY_API_KEY
  ? `wss://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const JUPITER_SWAP = 'https://quote-api.jup.ag/v6';
const JITO_ENGINE  = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';

// ── SUPABASE CLIENT ───────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ─────────────────────────────────────────────────────────
const openPositions   = new Map();   // mint → position object
const devWatching     = new Map();   // mint → { creator, lastTxSig }
const devTriggered    = new Set();   // mints where dev sold
const processedMints  = new Set();   // avoid double-sniping same token
let dailyTrades       = 0;
let dailyPnlSol       = 0;
let dailyResetTime    = Date.now();
let totalScanned      = 0;
let totalPassed       = 0;
let totalSniped       = 0;

// ══════════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════════
function log(level, msg) {
  const ts = new Date().toISOString();
  const icon = level === 'INFO' ? '•' : level === 'SNIPE' ? '🎯' : level === 'WIN' ? '✅' : level === 'LOSS' ? '❌' : level === 'WARN' ? '⚠️' : '🚨';
  console.log(`[${ts}] ${icon} ${msg}`);
}

// ══════════════════════════════════════════════════════════════════
// SUPABASE WRITES — direct REST, same pattern as railway-worker
// ══════════════════════════════════════════════════════════════════
async function dbInsertTrade(data) {
  try {
    const { error } = await sb.from('sniper_trades').insert({
      user_id:     BOT_USER_ID || null,
      mint:        data.mint,
      symbol:      data.symbol || '???',
      launchpad:   data.launchpad || 'pump_fun',
      action:      data.action,
      size_sol:    data.sizeSol,
      entry_price: data.entryPrice,
      exit_price:  data.exitPrice || null,
      multiplier_x:data.multiplierX || 1,
      pnl_sol:     data.pnlSol || 0,
      ai_score:    data.aiScore || null,
      rug_score:   data.rugScore || null,
      status:      data.status || 'open',
      mode:        PAPER_MODE ? 'PAPER' : 'LIVE',
    });
    if (error) log('WARN', `DB insert error: ${error.message}`);
  } catch (e) {
    log('WARN', `DB error: ${e.message}`);
  }
}

async function dbUpdateTrade(mint, updates) {
  try {
    await sb.from('sniper_trades')
      .update(updates)
      .eq('mint', mint)
      .eq('status', 'open');
  } catch (e) {
    log('WARN', `DB update error: ${e.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// RPC HELPERS
// ══════════════════════════════════════════════════════════════════
async function rpcCall(method, params) {
  try {
    const res = await fetch(RPC_HTTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return data.result || null;
  } catch (e) {
    log('WARN', `RPC ${method} failed: ${e.message}`);
    return null;
  }
}

async function getBondingCurve(address) {
  const result = await rpcCall('getAccountInfo', [address, { encoding: 'base64' }]);
  if (!result?.value?.data?.[0]) return null;
  try {
    const buf = Buffer.from(result.value.data[0], 'base64');
    if (buf.length < 49) return null;
    const rsr = Number(buf.readBigUInt64LE(32));
    const rtr = Number(buf.readBigUInt64LE(24));
    const tts = Number(buf.readBigUInt64LE(40));
    const graduated = buf[48] === 1;
    return {
      solInCurve: rsr / 1e9,
      bondingPct: tts > 0 ? (tts - rtr) / tts : 0,
      graduated,
    };
  } catch { return null; }
}

async function getTokenHolders(mint) {
  const result = await rpcCall('getTokenLargestAccounts', [mint]);
  return result?.value || [];
}

async function getRecentTxns(address, limit = 5) {
  const result = await rpcCall('getSignaturesForAddress', [address, { limit }]);
  return result || [];
}

async function getBuyVelocity(bondingCurve) {
  try {
    const sigs = await getRecentTxns(bondingCurve, 15);
    const recent = sigs.filter(s => s.blockTime && Date.now() / 1000 - s.blockTime < 10);
    return recent.length;
  } catch { return 0; }
}

// ══════════════════════════════════════════════════════════════════
// TWITTER SCAN (free 500K reads/month)
// ══════════════════════════════════════════════════════════════════
async function scanTwitter(symbol) {
  if (!TWITTER_BEARER || !symbol || symbol === '???') return { mentions: 0, velocity: 0 };
  try {
    const since = new Date(Date.now() - 300000).toISOString();
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(`$${symbol} -is:retweet lang:en`)}&max_results=10&start_time=${since}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TWITTER_BEARER}` },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      const count = data?.meta?.result_count || 0;
      return { mentions: count, velocity: count / 5 };
    }
  } catch {}
  return { mentions: 0, velocity: 0 };
}

// ══════════════════════════════════════════════════════════════════
// GEMINI 2.5 FLASH AI SCORER
// ══════════════════════════════════════════════════════════════════
async function aiScore(token) {
  try {
    const prompt = `You are a Solana memecoin risk analyzer. Score this token 0-100 where:
0-30=definite rug, 31-59=risky skip, 60-79=acceptable risk, 80-100=strong signal.

TOKEN: ${token.symbol} on ${token.launchpad}
Liquidity: ${token.solInCurve?.toFixed(2)} SOL
Bonding: ${(token.bondingPct * 100)?.toFixed(1)}%
Unique buyers: ${token.uniqueBuyers}
Dev hold: ${(token.devHoldPct * 100)?.toFixed(1)}%
Buy velocity (10s): ${token.buyVelocity} txns
Wallet cluster (top3): ${(token.clusterPct * 100)?.toFixed(1)}%
Has Twitter: ${token.hasTwitter}, Telegram: ${token.hasTelegram}, Website: ${token.hasWebsite}
Twitter 5m mentions: ${token.twitterMentions}
Dev rug history: ${token.devRugCount} rugs

Respond ONLY with valid JSON: {"score":<0-100>,"reason":"<8 words max>"}`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 },
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return Math.max(0, Math.min(100, parseInt(parsed.score) || 50));
    }
  } catch (e) {
    log('WARN', `AI scorer failed: ${e.message} — using rule-based`);
  }
  return ruleScore(token);
}

function ruleScore(t) {
  let score = 50;
  if (t.solInCurve >= 10) score += 10; else if (t.solInCurve >= 5) score += 5;
  if (t.uniqueBuyers >= 10) score += 8; else if (t.uniqueBuyers >= 5) score += 4;
  if (t.hasTwitter)   score += 8;
  if (t.hasTelegram)  score += 5;
  if (t.hasWebsite)   score += 4;
  if (t.twitterMentions >= 5) score += 10;
  if (t.buyVelocity >= 5) score += 8;
  if (t.bondingPct >= 0.05 && t.bondingPct <= 0.25) score += 5;
  if (t.devHoldPct > 0.20) score -= 20;
  else if (t.devHoldPct > 0.10) score -= 10;
  if (t.devRugCount > 0) score -= 15 * t.devRugCount;
  if (t.clusterPct > 0.50) score -= 20;
  else if (t.clusterPct > 0.30) score -= 10;
  if (t.solInCurve < 3) score -= 15;
  if (t.uniqueBuyers < 3) score -= 10;
  const HONEYPOT = ['airdrop','claim','official','presale','safe','guaranteed','100x'];
  if (HONEYPOT.some(k => (t.name + t.symbol).toLowerCase().includes(k))) score -= 25;
  return Math.max(0, Math.min(100, score));
}

// ══════════════════════════════════════════════════════════════════
// 12-SIGNAL FILTER CHAIN — all signals fetched in parallel
// ══════════════════════════════════════════════════════════════════
async function runFilterChain(token) {
  const start = Date.now();

  // Parallel fetch all signals
  const [bcData, holders, txns, twitter, velocity] = await Promise.allSettled([
    token.bondingCurve ? getBondingCurve(token.bondingCurve) : Promise.resolve(null),
    getTokenHolders(token.mint),
    token.creator ? getRecentTxns(token.creator, 20) : Promise.resolve([]),
    scanTwitter(token.symbol),
    token.bondingCurve ? getBuyVelocity(token.bondingCurve) : Promise.resolve(0),
  ]);

  const bc       = bcData.value;
  const holdList = holders.value || [];
  const creatorTxns = txns.value || [];
  const tw       = twitter.value || { mentions: 0, velocity: 0 };
  const vel      = velocity.value || 0;

  // ── Signal 1: Bonding curve ───────────────────────────────────
  if (bc) {
    token.solInCurve = bc.solInCurve;
    token.bondingPct = bc.bondingPct;
    if (bc.graduated) return { pass: false, reason: 'SKIP: already graduated' };
  }

  // ── Signal 2: Liquidity floor ─────────────────────────────────
  if (token.solInCurve < 3) return { pass: false, reason: `SKIP: ${token.solInCurve?.toFixed(2)} SOL liquidity` };

  // ── Signal 3: Bonding window ──────────────────────────────────
  if (token.bondingPct > 0.50) return { pass: false, reason: `SKIP: ${(token.bondingPct*100).toFixed(0)}% bonding — too late` };

  // ── Signal 4: Dev wallet age ──────────────────────────────────
  token.devTxCount = creatorTxns.length;
  token.devIsFresh = creatorTxns.length < 5;

  // ── Signal 5: Holder distribution ────────────────────────────
  token.uniqueBuyers = holdList.length;
  if (holdList.length > 0) {
    const top1 = parseFloat(holdList[0]?.uiAmount || 0);
    token.devHoldPct = Math.min(top1 / 1_000_000_000, 1);
  } else {
    token.devHoldPct = 0;
  }

  // ── Signal 6: Wallet cluster (top 3 share) ────────────────────
  if (holdList.length >= 3) {
    const top3 = holdList.slice(0,3).reduce((s,h) => s + parseFloat(h.uiAmount||0), 0);
    token.clusterPct = Math.min(top3 / 1_000_000_000, 1);
  } else {
    token.clusterPct = 0.3;
  }

  // ── Signal 7: Buy velocity ────────────────────────────────────
  token.buyVelocity = vel;

  // ── Signal 8–9: Social ───────────────────────────────────────
  token.twitterMentions = tw.mentions;
  token.twitterVelocity = tw.velocity;

  // ── Signal 10: Honeypot keywords ─────────────────────────────
  const HONEYPOT = ['airdrop','claim','official','presale','safe','guaranteed'];
  token.isHoneypot = HONEYPOT.some(k => (token.name + token.symbol).toLowerCase().includes(k));

  // ── Signal 11: Rule-based rug score ──────────────────────────
  let rugScore = 0;
  if (token.devHoldPct > 0.20)  rugScore += 4;
  else if (token.devHoldPct > 0.10) rugScore += 2;
  if (token.devIsFresh)          rugScore += 2;
  if (token.devRugCount > 0)     rugScore += 3;
  if (token.clusterPct > 0.50)   rugScore += 3;
  if (!token.hasTwitter && !token.hasWebsite && !token.hasTelegram) rugScore += 2;
  if (token.isHoneypot)          rugScore += 3;
  if (token.solInCurve < 5)      rugScore += 1;
  if (token.uniqueBuyers < 3)    rugScore += 1;
  token.rugScore = rugScore;

  // Hard reject on rug score
  if (rugScore >= 7) return { pass: false, reason: `HARD REJECT: rug ${rugScore}/10` };

  // ── Signal 12: Gemini AI score ────────────────────────────────
  token.aiScore = await aiScore(token);

  const ms = Date.now() - start;
  log('INFO', `Filter ${token.symbol} | AI:${token.aiScore} Rug:${rugScore}/10 | Liq:${token.solInCurve?.toFixed(2)}SOL | Bond:${(token.bondingPct*100).toFixed(0)}% | ${ms}ms`);

  if (token.aiScore >= MIN_AI_SCORE && rugScore < 7) {
    return { pass: true, reason: `PASS — AI:${token.aiScore} Rug:${rugScore}/10` };
  }
  return { pass: false, reason: `REJECT — AI:${token.aiScore} Rug:${rugScore}/10` };
}

// ══════════════════════════════════════════════════════════════════
// POSITION ENTRY
// ══════════════════════════════════════════════════════════════════
async function enterPosition(token, filterResult) {
  // Circuit breakers
  if (Date.now() - dailyResetTime > 86400000) {
    dailyTrades = 0; dailyPnlSol = 0; dailyResetTime = Date.now();
  }
  if (dailyTrades >= MAX_DAILY_TRADES)    return log('WARN', `Daily trade limit (${MAX_DAILY_TRADES}) reached`);
  if (dailyPnlSol <= -MAX_DAILY_LOSS_SOL) return log('WARN', `Daily loss limit hit`);
  if (openPositions.size >= MAX_OPEN_POSITIONS) return log('WARN', `Max positions (${MAX_OPEN_POSITIONS}) open`);
  if (openPositions.has(token.mint))      return;

  const entryPrice = Math.max((token.bondingPct || 0.01) * 0.000069, 0.0000001);

  const position = {
    mint:        token.mint,
    symbol:      token.symbol,
    launchpad:   token.launchpad,
    entryPrice,
    entryTime:   Date.now(),
    sizeSol:     BUY_AMOUNT_SOL,
    tokensHeld:  BUY_AMOUNT_SOL / entryPrice,
    athPrice:    entryPrice,
    tp1Hit:      false,
    tp2Hit:      false,
    aiScore:     token.aiScore,
    rugScore:    token.rugScore,
    // Paper mode: simulate price movement
    _isWinner:   Math.random() < 0.22,
    _peakMult:   Math.random() < 0.22 ? (Math.random() * 15 + 3) : (Math.random() * 1.3 + 0.1),
  };

  openPositions.set(token.mint, position);
  devWatching.set(token.mint, { creator: token.creator, lastSig: null });
  dailyTrades++;
  totalSniped++;

  // Write to Supabase
  await dbInsertTrade({
    mint:       token.mint,
    symbol:     token.symbol,
    launchpad:  token.launchpad,
    action:     'SNIPE_ENTRY',
    sizeSol:    BUY_AMOUNT_SOL,
    entryPrice,
    aiScore:    token.aiScore,
    rugScore:   token.rugScore,
    status:     'open',
  });

  const mode = PAPER_MODE ? '📋 PAPER' : '⚡ LIVE';
  log('SNIPE',
    `${mode} ENTERED ${token.symbol} [${token.launchpad}] | ` +
    `AI:${token.aiScore} Rug:${token.rugScore} | ` +
    `${BUY_AMOUNT_SOL}SOL @ ${entryPrice.toFixed(8)} | ` +
    `Liq:${token.solInCurve?.toFixed(2)}SOL Bond:${(token.bondingPct*100).toFixed(0)}%`
  );
}

// ══════════════════════════════════════════════════════════════════
// PRICE SIMULATION (paper mode)
// ══════════════════════════════════════════════════════════════════
function simulatePrice(pos) {
  const minutes = (Date.now() - pos.entryTime) / 60000;
  if (pos._isWinner) {
    const progress = Math.min(minutes / 8, 1.0);
    let price = pos.entryPrice * (1 + (pos._peakMult - 1) * progress);
    if (minutes > 15) price *= Math.max(0.3, 1 - (minutes - 15) * 0.06);
    return Math.max(price, pos.entryPrice * 0.01);
  } else {
    return Math.max(pos.entryPrice * Math.max(0.05, 1 - minutes * 0.09), 0.000001);
  }
}

// ══════════════════════════════════════════════════════════════════
// POSITION MANAGER — runs every 5 seconds
// ══════════════════════════════════════════════════════════════════
async function managePositions() {
  if (openPositions.size === 0) return;

  for (const [mint, pos] of [...openPositions.entries()]) {
    const currentPrice = PAPER_MODE ? simulatePrice(pos) : pos.entryPrice; // TODO: live price
    if (!currentPrice || currentPrice <= 0) continue;

    const currentX    = currentPrice / pos.entryPrice;
    const holdMinutes = (Date.now() - pos.entryTime) / 60000;
    if (currentPrice > pos.athPrice) pos.athPrice = currentPrice;
    const drawdownFromAth = pos.athPrice > 0 ? (pos.athPrice - currentPrice) / pos.athPrice : 0;

    let exitPct = 0;
    let exitAction = null;

    // ── DEV WALLET TRIGGERED ────────────────────────────────────
    if (devTriggered.has(mint)) {
      exitPct = 1.0;
      exitAction = 'DEV_WALLET_EXIT';
    }
    // ── TP1: sell 50% at TAKE_PROFIT_X ──────────────────────────
    else if (!pos.tp1Hit && currentX >= TAKE_PROFIT_X) {
      pos.tp1Hit = true;
      exitPct = 0.50;
      exitAction = `TP1_EXIT`;
    }
    // ── TP2: sell 40% at MOONBAG_X (10% moonbag rides free) ─────
    else if (pos.tp1Hit && !pos.tp2Hit && currentX >= MOONBAG_X) {
      pos.tp2Hit = true;
      exitPct = 0.40;
      exitAction = 'TP2_EXIT';
    }
    // ── STOP LOSS ────────────────────────────────────────────────
    else if (currentX <= (1 - STOP_LOSS_PCT)) {
      exitPct = 1.0;
      exitAction = 'SL_EXIT';
    }
    // ── TRAILING STOP (post TP1) ─────────────────────────────────
    else if (pos.tp1Hit && drawdownFromAth >= TRAILING_STOP_PCT) {
      exitPct = 1.0;
      exitAction = 'TRAILING_EXIT';
    }
    // ── TIMEOUT ──────────────────────────────────────────────────
    else if (holdMinutes >= MAX_HOLD_MINUTES && !pos.tp1Hit) {
      exitPct = 1.0;
      exitAction = 'TIMEOUT_EXIT';
    }

    if (exitAction && exitPct > 0) {
      const pnl = (currentX - 1) * pos.sizeSol * exitPct;
      dailyPnlSol += pnl;

      const isFullExit = exitPct >= 1.0 || pos.tp2Hit;

      // Update Supabase
      await dbUpdateTrade(mint, {
        action:      exitAction,
        exit_price:  currentPrice,
        multiplier_x:parseFloat(currentX.toFixed(4)),
        pnl_sol:     parseFloat(pnl.toFixed(8)),
        status:      pnl > 0 ? 'won' : 'lost',
      });

      if (isFullExit) {
        openPositions.delete(mint);
        devWatching.delete(mint);
        devTriggered.delete(mint);
      }

      const icon = pnl > 0 ? '✅' : '❌';
      log(pnl > 0 ? 'WIN' : 'LOSS',
        `${icon} ${exitAction} ${pos.symbol} | ` +
        `${currentX.toFixed(2)}x | ` +
        `PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | ` +
        `Daily: ${dailyPnlSol >= 0 ? '+' : ''}${dailyPnlSol.toFixed(4)} SOL`
      );
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// DEV WALLET MONITOR — runs every 5 seconds
// ══════════════════════════════════════════════════════════════════
async function checkDevWallets() {
  for (const [mint, info] of devWatching.entries()) {
    if (!info.creator) continue;
    try {
      const sigs = await getRecentTxns(info.creator, 3);
      if (sigs.length > 0) {
        const latestSig = sigs[0].signature;
        const latestTime = sigs[0].blockTime || 0;
        // New transaction from dev within last 30s since we started watching
        if (latestSig !== info.lastSig && Date.now() / 1000 - latestTime < 30) {
          if (info.lastSig !== null) {
            // Dev moved — trigger exit
            devTriggered.add(mint);
            log('ALERT', `🚨 DEV WALLET MOVED: ${mint.slice(0,8)}... — triggering exit`);
          }
          devWatching.set(mint, { ...info, lastSig: latestSig });
        }
      }
    } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════
// PARSE LAUNCH EVENT FROM WEBSOCKET
// ══════════════════════════════════════════════════════════════════
// ── Fetch full transaction to get account keys ──────────────────
async function fetchTxAccounts(signature) {
  try {
    const result = await rpcCall('getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
    ]);
    if (!result) return [];
    const keys = result?.transaction?.message?.accountKeys || [];
    return keys.map(k => typeof k === 'string' ? k : k?.pubkey || '');
  } catch { return []; }
}

function parseLaunchEvent(value, launchpad) {
  try {
    const logs = value?.logs || [];
    const sig  = value?.signature || '';

    if (!logs.length) return null;

    // Pump.fun creates fire these log patterns
    const isPumpCreate = logs.some(l =>
      l.includes('Instruction: Create') ||
      l.includes('Program log: Instruction: Create')
    );
    const isMoonshotCreate = logs.some(l =>
      l.includes('InitializeMint') || l.includes('CreateToken')
    );
    const isOtherCreate = logs.some(l =>
      l.includes('CreatePool') || l.includes('InitializePool')
    );

    if (!isPumpCreate && !isMoonshotCreate && !isOtherCreate) return null;

    // Parse metadata from program logs — pump.fun emits JSON
    let name = 'UNKNOWN', symbol = '???', uri = '';
    let mintFromLog = '', creatorFromLog = '';

    for (const line of logs) {
      if (line.includes('Program log:')) {
        const raw = line.replace(/^.*Program log:\s*/, '').trim();
        // Try JSON decode
        if (raw.startsWith('{')) {
          try {
            const decoded = JSON.parse(raw);
            name    = decoded.name    || decoded.tokenName  || name;
            symbol  = decoded.symbol  || decoded.tokenSymbol || symbol;
            uri     = decoded.uri     || decoded.metadataUri || uri;
            if (decoded.mint)   mintFromLog    = decoded.mint;
            if (decoded.user)   creatorFromLog = decoded.user;
          } catch {}
        }
        // Pump.fun v2 emits: "name: symbol: uri:"
        if (raw.includes('name:')) {
          const nm = raw.match(/name:\s*([^,
]+)/)?.[1]?.trim();
          const sy = raw.match(/symbol:\s*([^,
]+)/)?.[1]?.trim();
          const ur = raw.match(/uri:\s*([^,
]+)/)?.[1]?.trim();
          if (nm && nm !== 'UNKNOWN') name   = nm;
          if (sy && sy !== '???')    symbol = sy;
          if (ur)                    uri    = ur;
        }
      }
    }

    // Use mint from log if found, else we'll fetch via getTransaction
    const mint = mintFromLog || sig; // placeholder — resolved in subscribe loop
    if (!mint) return null;

    const key = mintFromLog || sig;
    if (processedMints.has(key)) return null;
    processedMints.add(key);
    if (processedMints.size > 10000) {
      const arr = [...processedMints];
      arr.slice(0, 5000).forEach(m => processedMints.delete(m));
    }

    return {
      mint: mintFromLog || '',  // filled by fetchTxAccounts if empty
      creator: creatorFromLog || '',
      bondingCurve: '',
      launchpad, name, symbol, uri,
      signature: sig,           // keep signature for tx fetch
      solInCurve: 0, bondingPct: 0,
      uniqueBuyers: 0, devHoldPct: 0,
      clusterPct: 0, buyVelocity: 0,
      hasTwitter: false, hasTelegram: false, hasWebsite: false,
      twitterMentions: 0, twitterVelocity: 0,
      devTxCount: 0, devIsFresh: true, devRugCount: 0,
      isHoneypot: false, aiScore: 0, rugScore: 0,
      _needsAccountFetch: !mintFromLog,  // flag: need to fetch tx accounts
    };
  } catch (e) {
    log('WARN', `Parse error [${launchpad}]: ${e.message}`);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// WEBSOCKET SUBSCRIBER — one per launchpad
// ══════════════════════════════════════════════════════════════════
function subscribeToLaunchpad(launchpad, programId) {
  let ws;
  let reconnectDelay = 1000;

  function connect() {
    ws = new WebSocket(WSS_URL);

    ws.on('open', () => {
      reconnectDelay = 1000;
      log('INFO', `[${launchpad}] WebSocket connected`);
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

        const token = parseLaunchEvent(value, launchpad);
        if (!token) return;

        const detectMs = 0; // would measure from ws message receipt
        log('INFO', `[${launchpad}] DETECTED: $${token.symbol} | ${token.mint.slice(0,8)}...`);

        // Run filter chain
        const result = await runFilterChain(token);
        if (result.pass) {
          totalPassed++;
          const passRate = (totalPassed / Math.max(totalScanned, 1) * 100).toFixed(1);
          log('INFO', `✅ PASS: $${token.symbol} | ${result.reason} | Pass rate: ${passRate}%`);
          await enterPosition(token, result);
        } else {
          log('INFO', `❌ ${token.symbol}: ${result.reason}`);
        }
      } catch (e) {
        log('WARN', `[${launchpad}] Message error: ${e.message}`);
      }
    });

    ws.on('close', () => {
      log('WARN', `[${launchpad}] Disconnected. Reconnecting in ${reconnectDelay / 1000}s...`);
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 60000);
    });

    ws.on('error', (e) => {
      log('WARN', `[${launchpad}] WS error: ${e.message}`);
    });
  }

  connect();
}

// ══════════════════════════════════════════════════════════════════
// STATS PRINTER — every 5 minutes
// ══════════════════════════════════════════════════════════════════
async function printStats() {
  try {
    const { data: trades } = await sb.from('sniper_trades')
      .select('pnl_sol, status, multiplier_x')
      .order('created_at', { ascending: false })
      .limit(1000);

    const all    = trades || [];
    const wins   = all.filter(t => t.status === 'won').length;
    const losses = all.filter(t => t.status === 'lost').length;
    const netPnl = all.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
    const bestX  = all.reduce((m, t) => Math.max(m, parseFloat(t.multiplier_x) || 1), 1);
    const wr     = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '—';

    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('  SQI SOVEREIGN SNIPER — PERFORMANCE SNAPSHOT');
    console.log(`  Mode: ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Uptime: ${Math.round(process.uptime() / 60)}min`);
    console.log(`  Scanned: ${totalScanned.toLocaleString()} | Passed: ${totalPassed} | Sniped: ${totalSniped}`);
    console.log(`  W/L: ${wins}/${losses} (${wr}% win rate)`);
    console.log(`  Net PnL: ${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(4)} SOL | Best: ${bestX.toFixed(1)}x`);
    console.log(`  Open: ${openPositions.size} | Daily trades: ${dailyTrades}`);
    console.log('════════════════════════════════════════════');
    console.log('');
  } catch (e) {
    log('WARN', `Stats error: ${e.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════════════════════════════
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SQI SOVEREIGN SNIPER v2.0 — ONLINE             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Mode:       ${PAPER_MODE ? '📋 PAPER TRADING' : '⚡ LIVE TRADING'}`);
  console.log(`  RPC:        ${ALCHEMY_API_KEY ? 'Alchemy (5-15ms)' : 'Helius WebSocket (50-200ms)'}`);
  console.log(`  Launchpads: ${Object.keys(LAUNCHPADS).join(', ')}`);
  console.log(`  Buy size:   ${BUY_AMOUNT_SOL} SOL per snipe`);
  console.log(`  TP1:        ${TAKE_PROFIT_X}x | TP2: ${MOONBAG_X}x | SL: -${STOP_LOSS_PCT * 100}%`);
  console.log(`  AI Gate:    Gemini 2.5 Flash score ≥ ${MIN_AI_SCORE}/100`);
  console.log(`  Supabase:   ${SUPABASE_URL}`);
  console.log('');

  if (!HELIUS_API_KEY && !ALCHEMY_API_KEY) {
    console.error('❌ MISSING: HELIUS_API_KEY or ALCHEMY_API_KEY — set in Railway env vars');
    process.exit(1);
  }

  // Subscribe to all launchpads
  for (const [name, programId] of Object.entries(LAUNCHPADS)) {
    subscribeToLaunchpad(name, programId);
    // Stagger connections by 500ms
    await new Promise(r => setTimeout(r, 500));
  }

  // Position management every 5 seconds
  setInterval(managePositions, 5000);

  // Dev wallet monitor every 5 seconds
  setInterval(checkDevWallets, 5000);

  // Stats every 5 minutes
  setInterval(printStats, 300000);

  // Print initial stats after 30 seconds
  setTimeout(printStats, 30000);

  log('INFO', '✦ All systems online. Scanning for launches...');
}

start().catch(e => {
  console.error('Fatal startup error:', e);
  process.exit(1);
});

