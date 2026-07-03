/**
 * SQI-2050 Shiesty Signal Oracle — Railway Worker v3
 * Hardened: crash guards, safe JSON parse, fetch timeouts,
 * processedSigs memory cap, self-healing restart, watchdog
 */

import 'dotenv/config';
import express from 'express';
import { ethers } from 'ethers';

// ─── Global crash guard (must be first) ──────────────────────────────────────
process.on('uncaughtException', (e) => {
  console.error('[CRASH GUARD] uncaughtException:', e?.message ?? e);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH GUARD] unhandledRejection:', reason?.message ?? reason);
});

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT           = Number(process.env.PORT || 8080);
const PAPER_MODE     = String(process.env.PAPER_MODE ?? 'true').toLowerCase() === 'true';
const RISK_PCT       = Math.min(0.2, Math.max(0.001, parseFloat(process.env.RISK_PCT || '0.05')));
const SUPABASE_URL   = process.env.SUPABASE_URL || '';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || '';
const PRIVATE_KEY    = process.env.BOT_PRIVATE_KEY || '';
const POLY_API_KEY   = process.env.POLY_API_KEY || '';
const POLY_API_SEC   = process.env.POLY_API_SECRET || '';
const POLY_PASS      = process.env.POLY_API_PASSPHRASE || '';
const WHALE_MIN_WR     = Math.min(1, Math.max(0, parseFloat(process.env.WHALE_MIN_WR    || '0.55')));
const WHALE_MIN_TRADES = Math.max(1, parseInt(process.env.WHALE_MIN_TRADES  || '5'));
const MAX_POSITIONS    = Math.max(1, parseInt(process.env.MAX_POSITIONS     || '20'));

const GAMMA_API    = 'https://gamma-api.polymarket.com';
const CLOB_API     = 'https://clob.polymarket.com';
const CTF_EXCHANGE = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';

// ─── State ───────────────────────────────────────────────────────────────────
let balance       = 10;
let tradeCount    = 0;
let scanCount     = 0;
let lastScan      = null;
let liveEnabled   = false;
let openPositions = 0;
let scanLoopAlive = false;
let lastScanTime  = Date.now();

const priceHistory  = new Map();
let diagStats = { maxMove: 0, maxVol: 0, maxMoveQ: '', maxVolQ: '', latDebug: '', samplePrice: '' };
const processedSigs = new Set();
const recentTrades  = [];
const errors        = [];
const whaleRegistry = new Map();
const endDateCache  = new Map();

// ─── Logger ──────────────────────────────────────────────────────────────────
const ts   = () => new Date().toISOString().slice(11, 19);
const log  = (tag, msg) => console.log(`[${ts()}][${tag}] ${msg}`);
const warn = (tag, msg) => console.warn(`[WARN][${tag}] ${msg}`);
function logErr(tag, msg) {
  const m = String(msg ?? 'unknown error');
  console.error(`[ERR][${tag}] ${m}`);
  errors.unshift({ time: new Date().toISOString(), tag, msg: m });
  if (errors.length > 30) errors.pop();
}

// ─── Safe helpers ────────────────────────────────────────────────────────────
function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function safeFloat(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeInt(v, fallback = 0) {
  const n = parseInt(v);
  return Number.isFinite(n) ? n : fallback;
}

// Proxy support for bypassing Cloudflare datacenter blocks
const PROXY_URL = process.env.PROXY_URL || '';
let proxyAgent = null;

async function getProxyAgent() {
  if (!PROXY_URL || proxyAgent) return proxyAgent;
  try {
    // Format: http://user:pass@host:port OR host:port:user:pass
    let proxyStr = PROXY_URL;
    if (!proxyStr.startsWith('http')) {
      const parts = proxyStr.split(':');
      if (parts.length === 4) {
        proxyStr = `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
      } else if (parts.length === 2) {
        proxyStr = `http://${parts[0]}:${parts[1]}`;
      }
    }
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    proxyAgent = new HttpsProxyAgent(proxyStr);
    log('PROXY', `Residential proxy configured: ${proxyStr.replace(/:([^:@]+)@/, ':***@')}`);
  } catch (e) {
    warn('PROXY', `Could not init proxy: ${e?.message}`);
  }
  return proxyAgent;
}

async function safeFetch(url, opts = {}, timeoutMs = 10000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Use proxy for Polymarket URLs to bypass Cloudflare
    const agent = (url.includes('polymarket.com') || url.includes('poly.market'))
      ? await getProxyAgent()
      : null;
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      ...(agent ? { dispatcher: agent } : {}),
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error(`Timeout after ${timeoutMs}ms: ${url}`);
    throw e;
  }
}

// ─── Supabase helpers ────────────────────────────────────────────────────────
async function dbGet(table, filter = '') {
  try {
    const r = await safeFetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function dbInsert(table, data) {
  try {
    const r = await safeFetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch { return false; }
}

async function dbUpdate(table, filter, data) {
  try {
    const r = await safeFetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch { return false; }
}

// ─── Load balance ────────────────────────────────────────────────────────────
async function loadBalance() {
  try {
    const [open, won, lost] = await Promise.all([
      dbGet('polymarket_trades', 'status=eq.open&is_paper=eq.true&select=id,amount_usdc'),
      dbGet('polymarket_trades', 'status=eq.won&is_paper=eq.true&select=pnl_usdc'),
      dbGet('polymarket_trades', 'status=eq.lost&is_paper=eq.true&select=amount_usdc'),
    ]);
    openPositions = safeInt(open?.length, 0);
    if (open || won || lost) {
      const spent    = (open  || []).reduce((s, t) => s + safeFloat(t.amount_usdc), 0);
      const winnings = (won   || []).reduce((s, t) => s + safeFloat(t.pnl_usdc),   0);
      const losses   = (lost  || []).reduce((s, t) => s + safeFloat(t.amount_usdc), 0);
      balance = Math.max(0, 10 - spent - losses + winnings);
    }
  } catch { /* keep in-memory balance */ }
}

const tradeSize = () =>
  Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));

// ─── Whale win rate ──────────────────────────────────────────────────────────
async function fetchWhaleWR(address) {
  const cached = whaleRegistry.get(address);
  if (cached && Date.now() - cached.lastUpdated < 3_600_000) return cached;
  try {
    const r = await safeFetch(
      `${CLOB_API}/trades?maker_address=${address}&limit=50`,
      { headers: { Accept: 'application/json' } }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const trades = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    if (trades.length < WHALE_MIN_TRADES) return null;

    let wins = 0, losses = 0;
    for (const t of trades) {
      if (t.market_status === 'resolved') {
        if (t.maker_won === true  || t.outcome_won === true)  wins++;
        if (t.maker_won === false || t.outcome_won === false) losses++;
      }
    }
    const total = wins + losses;
    const wr    = total > 0 ? wins / total : null;
    const record = { wins, losses, total, wr, rawTrades: trades.length, lastUpdated: Date.now() };
    whaleRegistry.set(address, record);
    return record;
  } catch (e) {
    warn('WR', `${address.slice(0, 8)}: ${e?.message}`);
    return null;
  }
}

async function isWhaleApproved(address) {
  try {
    // Known elite whales are pre-approved — bypass CLOB gate
    // These were verified by on-chain PnL scan (June 2026)
    if (KNOWN_WHALES.includes(address.toLowerCase())) {
      log('GATE', `${address.slice(0,8)} PRE-APPROVED (elite whitelist)`);
      return true;
    }
    // Unknown wallets still go through WR gate
    const record = await fetchWhaleWR(address);
    if (!record || record.rawTrades < WHALE_MIN_TRADES) return false;
    if (record.total < 3) return false;
    if (record.wr !== null && record.wr < WHALE_MIN_WR) return false;
    return true;
  } catch { return false; }
}

// ─── Fetch market end date ───────────────────────────────────────────────────
async function fetchEndDate(marketId) {
  if (!marketId || marketId === 'unknown') return null;
  if (endDateCache.has(marketId)) return endDateCache.get(marketId);
  try {
    const r = await safeFetch(`${GAMMA_API}/markets/${marketId}`);
    if (!r.ok) return null;
    const m = await r.json();
    const endDate = m.endDate || m.end_date_iso || null;
    if (endDate) endDateCache.set(marketId, endDate);
    return endDate;
  } catch { return null; }
}

// ─── Fetch market by token ID (human-readable labeling for whale mirrors) ────
const marketByTokenCache = new Map();
async function fetchMarketByToken(tokenId) {
  if (!tokenId) return null;
  if (marketByTokenCache.has(tokenId)) return marketByTokenCache.get(tokenId);
  try {
    const r = await safeFetch(`${GAMMA_API}/markets?clob_token_ids=${tokenId}&limit=1`);
    if (!r.ok) return null;
    const arr = await r.json();
    const m = Array.isArray(arr) ? arr[0] : null;
    const result = m ? { id: m.id, question: m.question || '' } : null;
    if (result) marketByTokenCache.set(tokenId, result);
    return result;
  } catch { return null; }
}

// ─── Live order execution ────────────────────────────────────────────────────
async function executeLiveOrder(signal) {
  if (!POLY_API_KEY || !POLY_API_SEC || !POLY_PASS) return null;
  if (!signal?.tokenId) return null;
  const size = tradeSize();
  const body = {
    orderType: 'GTC',
    tokenID: signal.tokenId,
    price: Math.min(0.99, Math.max(0.01, safeFloat(signal.currentPrice, 0.5))),
    side: signal.direction === 'buy' ? 'BUY' : 'SELL',
    size: parseFloat(size.toFixed(2)),
    feeRateBps: 0,
    nonce: Date.now(),
    expiration: Math.floor(Date.now() / 1000) + 3600,
  };
  try {
    const resp = await safeFetch(`${CLOB_API}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'POLY_ADDRESS': new ethers.Wallet(PRIVATE_KEY).address,
        'POLY_API_KEY': POLY_API_KEY, 'POLY_SECRET': POLY_API_SEC,
        'POLY_PASSPHRASE': POLY_PASS,
        'POLY_TIMESTAMP': String(Math.floor(Date.now() / 1000)),
        'POLY_NONCE': '0', 'POLY_SIGNATURE': '',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) { logErr('LIVE', `CLOB ${resp.status}`); return null; }
    return await resp.json();
  } catch (e) { logErr('LIVE', e?.message); return null; }
}

// ─── Record trade ────────────────────────────────────────────────────────────
async function recordTrade(signal, strategy) {
  try {
    if (openPositions >= MAX_POSITIONS) return false;
    if (!signal || typeof signal !== 'object') return false;

    const size = tradeSize();
    const fee  = size * 0.0005;

    if (!PAPER_MODE && liveEnabled) {
      const order   = await executeLiveOrder(signal);
      const txHash  = order?.orderId || order?.id || `live-${Date.now()}`;
      const endDate = await fetchEndDate(signal.marketId);
      await dbInsert('polymarket_trades', {
        user_id: 'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
        market_id: signal.marketId || 'unknown',
        market_question: signal.reason || '',
        outcome: signal.outcome,
        token_id: signal.tokenId || txHash,
        direction: signal.direction,
        shares: size / (safeFloat(signal.currentPrice, 0.5)),
        entry_price: safeFloat(signal.currentPrice, 0.5),
        amount_usdc: size, tx_hash: txHash, strategy,
        is_paper: false, status: order ? 'open' : 'failed',
        market_end_date: endDate,
      });
      openPositions++;
      tradeCount++;
      recentTrades.unshift({ time: new Date().toLocaleTimeString(), strategy, mode: 'LIVE', size, ...signal });
      if (recentTrades.length > 50) recentTrades.pop();
      return !!order;
    }

    // Paper path
    const cost   = signal.direction === 'buy' ? size + fee : fee;
    if (signal.direction === 'buy' && cost > balance) return false;

    const newBal = signal.direction === 'buy' ? balance - cost : balance + size - fee;
    const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const endDate = await fetchEndDate(signal.marketId);

    const ok = await dbInsert('polymarket_trades', {
      user_id: 'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
      market_id: signal.marketId || 'unknown',
      market_question: signal.reason || '',
      outcome: signal.outcome,
      token_id: signal.tokenId || txHash,
      direction: signal.direction,
      shares: size / safeFloat(signal.currentPrice, 0.5),
      entry_price: safeFloat(signal.currentPrice, 0.5),
      amount_usdc: size, tx_hash: txHash, strategy,
      is_paper: true, status: 'open',
      market_end_date: endDate,
    });

    if (ok) {
      balance = newBal;
      openPositions++;
      tradeCount++;
      // Copy this signal to all active member wallets
      copyTradeToMembers(signal, strategy).catch(() => {});
      recentTrades.unshift({
        time: new Date().toLocaleTimeString(), strategy, mode: 'PAPER',
        direction: signal.direction, outcome: signal.outcome,
        size, price: safeFloat(signal.currentPrice, 0.5), balance: newBal,
      });
      if (recentTrades.length > 50) recentTrades.pop();
      log('TRADE', `${strategy} | ${signal.direction.toUpperCase()} ${signal.outcome} | $${size.toFixed(2)} @ ${(safeFloat(signal.currentPrice, 0.5) * 100).toFixed(1)}% | bal $${newBal.toFixed(2)} | pos ${openPositions}/${MAX_POSITIONS}`);
      return true;
    }
    return false;
  } catch (e) {
    logErr('TRADE', e?.message);
    return false;
  }
}

// ─── Fetch markets ────────────────────────────────────────────────────────────
async function fetchMarkets() {
  try {
    const r = await safeFetch(`${GAMMA_API}/markets?limit=200&active=true&closed=false`);
    if (!r.ok) return [];
    const data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.map((m) => {
      const names    = safeParseJSON(m.outcomes,      ['Yes', 'No']);
      const prices   = safeParseJSON(m.outcomePrices, [0.5, 0.5]);
      const tokenIds = safeParseJSON(m.clobTokenIds,  ['', '']);
      return {
        id: m.id, question: String(m.question || ''),
        liquidity: safeFloat(m.liquidityNum ?? m.liquidity),
        volume:    safeFloat(m.volumeNum ?? m.volume),
        closed:    !!m.closed,
        outcomes: (Array.isArray(names) ? names : ['Yes', 'No']).map((name, i) => ({
          name: String(name),
          price:   safeFloat(Array.isArray(prices)   ? prices[i]   : 0.5, 0.5),
          tokenId: String(Array.isArray(tokenIds) ? tokenIds[i] : ''),
        })),
      };
    }).sort((a, b) => b.volume - a.volume);
  } catch (e) { logErr('MARKETS', e?.message); return []; }
}

// ─── Strategy 1: Latency Arb ──────────────────────────────────────────────────
function latencyArb(markets) {
  const now = Date.now();
  const signals = [];
  let skippedNoOutcome = 0, skippedHistory = 0, evaluated = 0, nanCount = 0;
  try {
    for (const m of markets.filter(m => m.liquidity > 5000 && !m.closed && m.outcomes.length === 2).sort((a, b) => b.volume - a.volume).slice(0, 25)) {
      const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
      const no  = m.outcomes.find(o => o.name.toLowerCase() === 'no');
      if (!yes || !no) { skippedNoOutcome++; continue; }
      const hist = priceHistory.get(m.id) || [];
      hist.push({ price: yes.price, ts: now });
      const fresh = hist.filter(s => s.ts >= now - 180000);
      priceHistory.set(m.id, fresh);
      if (fresh.length < 2) { skippedHistory++; continue; }
      evaluated++;
      const move = (yes.price - fresh[0].price) / (fresh[0].price || 0.001);
      const abs  = Math.abs(move);
      if (Number.isNaN(abs)) { nanCount++; continue; }
      if (abs > diagStats.maxMove) { diagStats.maxMove = abs; diagStats.maxMoveQ = m.question?.slice(0, 40); }
      if (abs < 0.015) continue;
      const sigId = `lat-${m.id}-${Math.floor(now / 60000)}`;
      if (processedSigs.has(sigId)) continue;
      processedSigs.add(sigId);
      const outcome = move > 0 ? yes : no;
      signals.push({
        marketId: m.id, direction: 'buy',
        outcome: outcome.name, tokenId: outcome.tokenId,
        confidence: Math.min(90, 60 + abs * 300),
        reason: `[LATENCY] ${m.question} | ${(move * 100).toFixed(1)}% move`,
        currentPrice: outcome.price,
      });
    }
    diagStats.latDebug = `noOutcome=${skippedNoOutcome} noHistory=${skippedHistory} evaluated=${evaluated} nanCount=${nanCount}`;
    if (evaluated > 0 && !diagStats.samplePrice) {
      const dbgM = markets.filter(m => m.liquidity > 5000 && !m.closed && m.outcomes.length === 2)[0];
      const dbgYes = dbgM?.outcomes.find(o => o.name.toLowerCase() === 'yes');
      diagStats.samplePrice = `rawPrice=${dbgYes?.price} type=${typeof dbgYes?.price}`;
    }
  } catch (e) { logErr('LATARB', e?.message); }
  return signals;
}

// ─── Strategy 2: Volatility Scalper ──────────────────────────────────────────
function volScalper(markets) {
  const signals = [];
  try {
    for (const m of markets.filter(m => m.liquidity > 100000 && !m.closed).slice(0, 30)) {
      const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
      if (!yes) continue;
      const key  = `vol-${m.id}`;
      const hist = priceHistory.get(key) || [];
      hist.push(yes.price);
      if (hist.length > 20) hist.shift();
      priceHistory.set(key, hist);
      if (hist.length < 10) continue;
      const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
      const std  = Math.sqrt(hist.reduce((s, p) => s + (p - mean) ** 2, 0) / hist.length);
      const vol  = mean > 0 ? std / mean : 0;
      if (vol > diagStats.maxVol) { diagStats.maxVol = vol; diagStats.maxVolQ = m.question?.slice(0, 40); }
      if (vol < 0.025) continue;
      const sigId = `scalp-${m.id}-${Math.floor(Date.now() / 120000)}`;
      if (processedSigs.has(sigId)) continue;
      processedSigs.add(sigId);
      if (yes.price > mean * 0.99) continue;
      signals.push({
        marketId: m.id, direction: 'buy',
        outcome: 'Yes', tokenId: yes.tokenId,
        confidence: Math.min(85, 50 + vol * 200),
        reason: `[SCALP] ${m.question} | vol=${(vol * 100).toFixed(1)}%`,
        currentPrice: yes.price,
      });
    }
  } catch (e) { logErr('SCALPER', e?.message); }
  return signals;
}

// ─── Whale Mirror ─────────────────────────────────────────────────────────────
async function startWhaleMirror(provider) {
  log('WHALE', `Block listener active | min WR ${(WHALE_MIN_WR * 100).toFixed(0)}% | min trades ${WHALE_MIN_TRADES}`);
  const iface = new ethers.Interface([
    'function fillOrder((uint256 salt,address maker,address signer,address taker,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint256 expiration,uint256 nonce,uint256 feeRateBps,uint8 side,uint8 signatureType) order,bytes signature,uint256 fillAmount)',
  ]);

  provider.on('block', async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block?.prefetchedTransactions) return;
      for (const tx of block.prefetchedTransactions) {
        if (tx.to?.toLowerCase() !== CTF_EXCHANGE.toLowerCase()) continue;
        // NOTE: tx.from is Polymarket's operator/relayer wallet, NOT the trader —
        // Polymarket orders are signed off-chain and settled on-chain by the
        // operator, so the real trader identity only exists inside the decoded
        // order struct (order.maker). Gating on tx.from never matches real whales.
        let decoded, order;
        try {
          decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          if (!decoded) continue;
          order = decoded.args[0];
        } catch { continue; /* not a fillOrder */ }
        const whaleAddr = order.maker?.toLowerCase();
        if (!whaleAddr) continue;
        // Fast path: check known elites first (no CLOB lookup needed)
        const isKnown = KNOWN_WHALES.includes(whaleAddr);
        if (!isKnown) {
          const approved = await isWhaleApproved(whaleAddr);
          if (!approved) continue;
        }
        log('WHALE', `${isKnown ? '⭐ ELITE' : '✅ NEW'} whale ${whaleAddr.slice(0,8)} detected on block ${blockNumber}`);
        try {
          const price = Number(order.takerAmount) / (Number(order.makerAmount) || 1);
          const tokenIdStr = order.tokenId?.toString() || '';
          const market = await fetchMarketByToken(tokenIdStr);
          const label = market?.question
            ? `[WHALE] ${whaleAddr.slice(0, 8)} | ${market.question.slice(0, 80)}`
            : `[WHALE] ${whaleAddr.slice(0, 8)} block:${blockNumber}`;
          await recordTrade({
            marketId: market?.id || '', direction: order.side === 0 ? 'buy' : 'sell',
            outcome: order.side === 0 ? 'Yes' : 'No',
            tokenId: tokenIdStr,
            reason: label,
            currentPrice: Math.min(0.99, Math.max(0.01, price)),
          }, 'whale_mirror');
        } catch { /* not a fillOrder */ }
      }
    } catch (e) { logErr('WHALE', `block ${e?.message}`); }
  });
}

// ─── Scan loop with watchdog ──────────────────────────────────────────────────
async function runOneScan() {
  try {
    await loadBalance();
    const markets = await fetchMarkets();
    if (!markets.length) { warn('SCAN', 'No markets returned'); return; }

    scanCount++;
    lastScan     = new Date();
    lastScanTime = Date.now();
    log('SCAN', `#${scanCount} | ${markets.length} mkts | bal $${balance.toFixed(2)} | pos ${openPositions}/${MAX_POSITIONS} | size $${tradeSize().toFixed(2)}`);

    if (scanCount % 10 === 1) {
      const latCandidates = markets.filter(m => m.liquidity > 5000 && !m.closed).length;
      const binaryCandidates = markets.filter(m => m.liquidity > 5000 && !m.closed && m.outcomes.length === 2).length;
      const volCandidates = markets.filter(m => m.liquidity > 100000 && !m.closed).length;
      const sampleLiq = markets.slice(0, 3).map(m => m.liquidity.toFixed(0)).join(', ');
      log('DIAG', `latArb-eligible=${latCandidates} (binary=${binaryCandidates}) volScalp-eligible=${volCandidates} | sample liquidity=[${sampleLiq}]`);
      log('DIAG', `maxMove(since last)=${(diagStats.maxMove*100).toFixed(2)}% [${diagStats.maxMoveQ}] | need 1.50% | maxVol=${(diagStats.maxVol*100).toFixed(2)}% [${diagStats.maxVolQ}] | need 2.50%`);
      log('DIAG', `latArb breakdown (last scan): ${diagStats.latDebug} | ${diagStats.samplePrice}`);
      diagStats = { maxMove: 0, maxVol: 0, maxMoveQ: '', maxVolQ: '', latDebug: '', samplePrice: '' };
    }

    if (openPositions >= MAX_POSITIONS) return;

    const signals = [
      ...latencyArb(markets),
      ...volScalper(markets),
    ].sort((a, b) => b.confidence - a.confidence).slice(0, 2);

    for (const sig of signals) {
      const strat = sig.reason.startsWith('[SCALP]') ? 'volatility_scalp' : 'latency_arb';
      await recordTrade(sig, strat);
      await new Promise(r => setTimeout(r, 500));
    }

    // Cap processedSigs memory
    if (processedSigs.size > 2000) {
      const toDelete = [...processedSigs].slice(0, 1000);
      toDelete.forEach(s => processedSigs.delete(s));
    }

    // Cap priceHistory memory
    if (priceHistory.size > 500) {
      const toDelete = [...priceHistory.keys()].slice(0, 200);
      toDelete.forEach(k => priceHistory.delete(k));
    }
  } catch (e) {
    logErr('SCAN', e?.message);
  }
}

function startScanLoop() {
  if (scanLoopAlive) return;
  scanLoopAlive = true;
  log('SCAN', 'Scan loop started');

  const loop = async () => {
    await runOneScan();
    setTimeout(loop, 15000);
  };
  setTimeout(loop, 1000); // first scan after 1s
}

// ─── Watchdog: restart scan loop if stuck > 2 minutes ────────────────────────
setInterval(() => {
  const stale = Date.now() - lastScanTime > 120_000;
  if (stale) {
    warn('WATCHDOG', 'Scan loop appears stuck — restarting');
    scanLoopAlive = false;
    startScanLoop();
  }
}, 30_000);

// ─── Resolution engine ────────────────────────────────────────────────────────
async function resolveOpenTrades() {
  try {
    const open = await dbGet(
      'polymarket_trades',
      'status=eq.open&market_id=neq.unknown&select=id,user_id,market_id,outcome,direction,entry_price,amount_usdc,shares,is_paper,market_end_date'
    );
    if (!open?.length) return;

    const now      = Date.now();
    let   resolved = 0;

    for (const trade of open) {
      try {
        if (trade.market_end_date) {
          const endMs = new Date(trade.market_end_date).getTime();
          if (endMs > now - 3_600_000) continue;
        }

        const mktRes = await safeFetch(`${GAMMA_API}/markets/${trade.market_id}`).catch(() => null);
        if (!mktRes?.ok) continue;
        const mkt = await mktRes.json().catch(() => null);
        if (!mkt) continue;
        if (!mkt.closed && !mkt.resolved) continue;

        const names    = safeParseJSON(mkt.outcomes,      ['Yes', 'No']);
        const prices   = safeParseJSON(mkt.outcomePrices, [0.5,   0.5]);
        const winnerIdx = prices.findIndex(p => safeFloat(p) >= 0.99);
        const winner    = winnerIdx >= 0 ? names[winnerIdx] : null;
        if (!winner) continue;

        const tradeWon  = trade.outcome?.toLowerCase() === winner.toLowerCase();
        const exitPrice = tradeWon ? 1.0 : 0.0;
        const shares    = safeFloat(trade.shares);
        const spent     = safeFloat(trade.amount_usdc);
        const pnl       = tradeWon ? (shares * exitPrice) - spent : -spent;
        const pnlPct    = spent > 0 ? (pnl / spent) * 100 : 0;

        await dbUpdate('polymarket_trades', `id=eq.${trade.id}`, {
          status:            tradeWon ? 'won' : 'lost',
          exit_price:        exitPrice,
          pnl_usdc:          parseFloat(pnl.toFixed(4)),
          pnl_pct:           parseFloat(pnlPct.toFixed(2)),
          winning_outcome:   winner,
          resolved_at:       new Date().toISOString(),
          resolution_source: 'gamma_api',
        });

        if (trade.is_paper && tradeWon) {
          const winnings = shares * exitPrice;
          // Check if this is a master trade or member trade
          const isMasterTrade = trade.user_id === 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
          if (isMasterTrade) {
            balance = Math.max(0, balance + winnings);
          }
          // Process platform fee for member trades
          if (!isMasterTrade && trade.id) {
            processMemberFee(trade.id, trade.user_id, winnings).catch(() => {});
          }
          log('RESOLVE', `✅ WON ${trade.outcome} | +$${winnings.toFixed(2)} | bal $${balance.toFixed(2)}`);
        } else {
          log('RESOLVE', `❌ LOST ${trade.outcome} | -$${spent.toFixed(2)} | winner: ${winner}`);
        }
        resolved++;
        openPositions = Math.max(0, openPositions - 1);
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        logErr('RESOLVE_TRADE', e?.message);
      }
    }
    if (resolved > 0) log('RESOLVE', `Settled ${resolved} trades`);
  } catch (e) {
    logErr('RESOLVE', e?.message);
  }
}

setInterval(resolveOpenTrades, 5 * 60 * 1000);
setTimeout(resolveOpenTrades, 30_000);

// ─── Express API ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  try {
    res.json({
      status: 'running',
      bot: 'SQI-2050 CLAWBOT v3',
      mode: PAPER_MODE ? 'PAPER' : 'LIVE',
      liveEnabled,
      balance: parseFloat(balance.toFixed(2)),
      tradeCount, scanCount, openPositions,
      maxPositions: MAX_POSITIONS,
      whaleFilter: { minWR: `${(WHALE_MIN_WR * 100).toFixed(0)}%`, minTrades: WHALE_MIN_TRADES },
      approvedWhales: [...whaleRegistry.entries()]
        .filter(([, v]) => v.wr === null || v.wr >= WHALE_MIN_WR)
        .map(([addr, v]) => ({
          addr: addr.slice(0, 10),
          wr: v.wr !== null ? `${(v.wr * 100).toFixed(0)}%` : 'new',
          trades: v.rawTrades,
        })),
      riskPct: `${(RISK_PCT * 100).toFixed(1)}%`,
      tradeSize: tradeSize(),
      lastScan: lastScan?.toISOString() || null,
      uptime: Math.round(process.uptime()),
      recentErrors: errors.slice(0, 5),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e?.message });
  }
});

app.get('/whales', (_req, res) => {
  try {
    const list = [...whaleRegistry.entries()].map(([addr, v]) => ({
      address: addr, shortAddr: addr.slice(0, 10),
      wr: v.wr !== null ? parseFloat((v.wr * 100).toFixed(1)) : null,
      wins: v.wins, losses: v.losses, total: v.total,
      rawTrades: v.rawTrades,
      approved: v.rawTrades >= WHALE_MIN_TRADES && (v.wr === null || v.wr >= WHALE_MIN_WR),
      lastUpdated: new Date(v.lastUpdated).toISOString(),
    }));
    res.json({ count: list.length, minWR: WHALE_MIN_WR, minTrades: WHALE_MIN_TRADES, whales: list });
  } catch (e) { res.status(500).json({ error: e?.message }); }
});

app.get('/members', (_req, res) => {
  try {
    res.json({
      count: memberRegistry.length,
      platformWallet: platformWallet || 'not_set',
      members: memberRegistry.map(m => ({
        wallet: m.wallet.slice(0, 10) + '…',
        tier: m.tier,
        feePct: m.feePct,
        paperMode: m.paperMode,
      })),
    });
  } catch (e) { res.status(500).json({ error: e?.message }); }
});

app.get('/trades', (_req, res) => {
  try { res.json({ trades: recentTrades, count: tradeCount }); }
  catch (e) { res.status(500).json({ error: e?.message }); }
});

app.post('/control', (req, res) => {
  try {
    const { action } = req.body || {};
    if (action === 'pause')  { liveEnabled = false; log('CTRL', 'Paused'); }
    if (action === 'resume') { liveEnabled = true;  log('CTRL', 'Resumed'); }
    res.json({ liveEnabled, mode: PAPER_MODE ? 'PAPER' : 'LIVE' });
  } catch (e) { res.status(500).json({ error: e?.message }); }
});

app.get('/', (_req, res) =>
  res.type('text').send('SQI-2050 Shiesty v3 — GET /health | /whales | /trades')
);

// ─── Boot ─────────────────────────────────────────────────────────────────────

// ─── 9 Confirmed Elite Whale Addresses (verified June 2026) ─────────────────
// Ranked by PnL | Top 3: BAA2BC (Iran Insider), ED107A (NO Machine), A7A8C1 (World Cup)
const KNOWN_WHALES = [
  '0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73',
  '0x06dc51826bc524d9a83770e7de9dd7e005b04524',
  '0xed107a85a4585a381e48c7f7ca4144909e7dd2e5',
  '0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c',
  '0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786',
  '0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6',
  '0x204f72f35326db932158cba6adff0b9a1da95e14',
  '0xa77105bb4d2d4d200b0133a2036222353831162d',
  '0xfea31bc088000ff909be1dfd8d0e3f2c7ef2d227',
];

async function seedWhaleRegistry() {
  log('WHALE', `Seeding ${KNOWN_WHALES.length} known elite whale addresses...`);
  for (const addr of KNOWN_WHALES) {
    if (!whaleRegistry.has(addr)) {
      // Pre-register with null WR so they show in dashboard immediately
      // Real WR will be fetched on first block or CLOB query
      whaleRegistry.set(addr, {
        wins: 0, losses: 0, total: 0, wr: null,
        rawTrades: 0, lastUpdated: Date.now()
      });
    }
  }
  log('WHALE', `Registry seeded. Fetching win rates in background...`);
  // Fetch WR for each in background, staggered to avoid rate limits
  for (let i = 0; i < KNOWN_WHALES.length; i++) {
    setTimeout(async () => {
      try { await fetchWhaleWR(KNOWN_WHALES[i]); } catch {}
    }, i * 3000); // 3s apart
  }
}


// ─── Member registry + Profit Share System ───────────────────────────────────
let memberRegistry = [];
let platformWallet = '';

async function loadMembers() {
  try {
    const members = await dbGet(
      'clawbot_members',
      'is_active=eq.true&select=user_id,poly_wallet_address,tier,platform_fee_pct,paper_mode,balance_usdc'
    );
    const config = await dbGet('clawbot_platform_config', 'select=platform_wallet');
    memberRegistry = (members || []).map(m => ({
      userId:   m.user_id,
      wallet:   m.poly_wallet_address,
      tier:     m.tier,
      feePct:   parseFloat(m.platform_fee_pct || 50),
      paperMode: m.paper_mode !== false,
      balance:  parseFloat(m.balance_usdc || 0),
    }));
    platformWallet = config?.[0]?.platform_wallet || '';
    log('MEMBERS', `${memberRegistry.length} active members | Platform wallet: ${platformWallet ? platformWallet.slice(0,10)+'...' : 'NOT SET'}`);
  } catch (e) { logErr('MEMBERS', e?.message); }
}

setInterval(loadMembers, 5 * 60 * 1000);

async function copyTradeToMembers(signal, strategy) {
  if (!memberRegistry.length) return;
  for (const member of memberRegistry) {
    try {
      const size = Math.max(0.50, Math.min(50, member.balance * 0.02));
      if (size < 0.50) continue;
      const txHash = `paper-member-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      await dbInsert('polymarket_trades', {
        user_id:         member.userId,
        market_id:       signal.marketId || 'unknown',
        market_question: signal.reason || '',
        outcome:         signal.outcome,
        token_id:        signal.tokenId || txHash,
        direction:       signal.direction,
        shares:          size / safeFloat(signal.currentPrice, 0.5),
        entry_price:     safeFloat(signal.currentPrice, 0.5),
        amount_usdc:     size,
        tx_hash:         txHash,
        strategy,
        is_paper:        member.paperMode,
        status:          'open',
      });
      log('MEMBER', `Copied → ${member.wallet.slice(0,8)} $${size.toFixed(2)} tier:${member.tier} fee:${member.feePct}%`);
    } catch (e) { logErr('MEMBER_COPY', e?.message); }
  }
}

async function processMemberFee(tradeId, userId, grossPnl) {
  try {
    const member = memberRegistry.find(m => m.userId === userId);
    if (!member || grossPnl <= 0) return;
    const feeUsdc = parseFloat((grossPnl * member.feePct / 100).toFixed(4));
    const netPnl  = parseFloat((grossPnl - feeUsdc).toFixed(4));
    await dbInsert('clawbot_fee_ledger', {
      user_id:         userId,
      trade_id:        tradeId,
      tier:            member.tier,
      gross_pnl_usdc:  grossPnl,
      fee_pct:         member.feePct,
      fee_usdc:        feeUsdc,
      net_pnl_usdc:    netPnl,
      platform_wallet: platformWallet || 'not_set',
    });
    log('FEE', `${member.wallet.slice(0,8)} gross $${grossPnl.toFixed(2)} → fee $${feeUsdc.toFixed(2)} → net $${netPnl.toFixed(2)}`);

    // Process 2-tier affiliate commissions on this win
    processAffiliateCommissions(tradeId, userId, grossPnl, member.tier).catch(() => {});
  } catch (e) { logErr('FEE', e?.message); }
}


// ─── Affiliate 2-tier commission on trading wins ──────────────────────────────
async function processAffiliateCommissions(tradeId, userId, grossPnl, tier) {
  try {
    if (grossPnl <= 0) return;

    // Get commission rates for this tier
    const rates = await dbGet('clawbot_affiliate_rates', `tier=eq.${tier}&select=l1_pct,l2_pct`);
    if (!rates?.length) return;
    const { l1_pct, l2_pct } = rates[0];

    // Get user's referred_by (their L1 referrer affiliate code)
    const profile = await dbGet('profiles', `id=eq.${userId}&select=referred_by`);
    const l1Code = profile?.[0]?.referred_by;
    if (!l1Code) return; // no referrer — skip

    // Get L1 referrer user_id
    const l1Aff = await dbGet('affiliate_profiles', `affiliate_code=eq.${l1Code}&select=user_id,affiliate_code`);
    if (!l1Aff?.length) return;
    const l1UserId = l1Aff[0].user_id;

    // L1 commission
    const l1Amount = parseFloat((grossPnl * l1_pct / 100).toFixed(4));
    if (l1Amount > 0) {
      await dbInsert('affiliate_commissions', {
        affiliate_user_id:  l1UserId,
        referred_user_id:   userId,
        gross_amount:        grossPnl,
        commission_amount:   l1Amount,
        commission_rate:     l1_pct / 100,
        currency:            'USD',
        status:              'approved',
        source:              'trading_l1',
        clawbot_trade_id:    tradeId,
        level:               1,
      });

      // Update affiliate profile total_earnings
      const l1Profile = await dbGet('affiliate_profiles', `user_id=eq.${l1UserId}&select=total_earnings`);
      const currentL1 = parseFloat(l1Profile?.[0]?.total_earnings || 0);
      // Use PATCH to increment
      try {
        const patchReq = { total_earnings: currentL1 + l1Amount, pending_balance: currentL1 + l1Amount };
        const r = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_profiles?user_id=eq.${l1UserId}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(patchReq),
        });
        if (r.ok) log('AFFILIATE', `L1 ${l1Code} +$${l1Amount.toFixed(2)} (${l1_pct}% of $${grossPnl.toFixed(2)})`);
      } catch {}
    }

    // Get L2 referrer (L1's own referrer)
    const l1Profile2 = await dbGet('profiles', `id=eq.${l1UserId}&select=referred_by`);
    const l2Code = l1Profile2?.[0]?.referred_by;
    if (!l2Code || l2_pct <= 0) return;

    const l2Aff = await dbGet('affiliate_profiles', `affiliate_code=eq.${l2Code}&select=user_id`);
    if (!l2Aff?.length) return;
    const l2UserId = l2Aff[0].user_id;

    const l2Amount = parseFloat((grossPnl * l2_pct / 100).toFixed(4));
    if (l2Amount > 0) {
      await dbInsert('affiliate_commissions', {
        affiliate_user_id:  l2UserId,
        referred_user_id:   userId,
        gross_amount:        grossPnl,
        commission_amount:   l2Amount,
        commission_rate:     l2_pct / 100,
        currency:            'USD',
        status:              'approved',
        source:              'trading_l2',
        clawbot_trade_id:    tradeId,
        level:               2,
      });
      log('AFFILIATE', `L2 ${l2Code} +$${l2Amount.toFixed(2)} (${l2_pct}% of $${grossPnl.toFixed(2)})`);
    }
  } catch (e) { logErr('AFFILIATE', e?.message); }
}

async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 🦈 CLAWBOT v3 — Hetzner');
  console.log(`  Mode: ${PAPER_MODE ? '📋 PAPER' : '🔴 LIVE'} | Risk: ${(RISK_PCT*100).toFixed(1)}% | Max pos: ${MAX_POSITIONS}`);
  console.log(`  Whale gate: min ${(WHALE_MIN_WR*100).toFixed(0)}% WR | min ${WHALE_MIN_TRADES} trades`);
  console.log('══════════════════════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    process.exit(1);
  }

  await loadBalance();
  await loadMembers();
  await seedWhaleRegistry();
  log('BOOT', `Balance: $${balance.toFixed(2)} | Open: ${openPositions}/${MAX_POSITIONS}`);

  if (!PAPER_MODE && POLY_API_KEY && POLY_API_SEC && POLY_PASS) {
    liveEnabled = true;
    log('LIVE', 'CLOB credentials loaded — LIVE trading ACTIVE');
  }

  // Whale mirror is read-only block listening — it only needs an RPC endpoint.
  // BOT_PRIVATE_KEY is for signing live orders later (gated separately in
  // executeLiveOrder), not for watching the chain, so it must not block startup.
  if (process.env.POLYGON_RPC_URL) {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.POLYGON_RPC_URL, undefined, { staticNetwork: true }
      );
      await provider.getBlockNumber();
      await startWhaleMirror(provider);
      if (!PRIVATE_KEY) warn('WHALE', 'Mirroring in detect-only mode — no BOT_PRIVATE_KEY set, live execution will no-op on any signal until one is added');
    } catch (e) {
      warn('WHALE', `RPC failed — whale mirror disabled: ${e?.message}`);
    }
  } else {
    warn('WHALE', 'No POLYGON_RPC_URL — whale mirror disabled');
  }

  lastScanTime = Date.now();
  startScanLoop();

  app.listen(PORT, '0.0.0.0', () => log('HTTP', `Port ${PORT} ready`));
}

main().catch((e) => {
  console.error('[BOOT FATAL]', e?.message ?? e);
  process.exit(1);
});
