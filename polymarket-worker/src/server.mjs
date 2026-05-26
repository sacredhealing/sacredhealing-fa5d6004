/**
 * SQI-2050 Shiesty Signal Oracle — Railway Worker
 * ═══════════════════════════════════════════════════════
 * Whale Mirror + Latency Arb + Volatility Scalper
 *
 * WHALE FILTERS (v2):
 *   - Min win rate: 55% (WHALE_MIN_WR env, default 0.55)
 *   - Min trades for stats: 5 (WHALE_MIN_TRADES env)
 *   - Max open positions: 20 (MAX_POSITIONS env)
 *   - Win rate sourced from Polymarket CLOB + our own trade history
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, POLYGON_RPC_URL
 *   PAPER_MODE=true|false, RISK_PCT=0.05
 *
 * Live mode extras:
 *   POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE, BOT_PRIVATE_KEY
 *
 * Whale tuning:
 *   WHALE_MIN_WR=0.55       (min 55% win rate to copy)
 *   WHALE_MIN_TRADES=5      (min trades before we trust the WR)
 *   MAX_POSITIONS=20        (max open positions at any time)
 */

import 'dotenv/config';
import express from 'express';
import { ethers } from 'ethers';

// ─── Config ────────────────────────────────────────────────────────────────────
const PORT           = Number(process.env.PORT || 8080);
const PAPER_MODE     = String(process.env.PAPER_MODE ?? 'true').toLowerCase() === 'true';
const RISK_PCT       = parseFloat(process.env.RISK_PCT || '0.05');
const SUPABASE_URL   = process.env.SUPABASE_URL || '';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || '';
const PRIVATE_KEY    = process.env.BOT_PRIVATE_KEY || '';
const POLY_API_KEY   = process.env.POLY_API_KEY || '';
const POLY_API_SEC   = process.env.POLY_API_SECRET || '';
const POLY_PASS      = process.env.POLY_API_PASSPHRASE || '';

// ─── Whale filter thresholds ──────────────────────────────────────────────────
const WHALE_MIN_WR     = parseFloat(process.env.WHALE_MIN_WR    || '0.55'); // 55%
const WHALE_MIN_TRADES = parseInt(process.env.WHALE_MIN_TRADES  || '5');    // need 5+ trades
const MAX_POSITIONS    = parseInt(process.env.MAX_POSITIONS     || '20');   // hard cap

const GAMMA_API     = 'https://gamma-api.polymarket.com';
const CLOB_API      = 'https://clob.polymarket.com';
const CTF_EXCHANGE  = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';

// ─── State ────────────────────────────────────────────────────────────────────
let balance      = 10;
let tradeCount   = 0;
let scanCount    = 0;
let lastScan     = null;
let liveEnabled  = false;
let openPositions = 0;

const priceHistory  = new Map();
const processedSigs = new Set();
const recentTrades  = [];
const errors        = [];

// ─── Whale Win Rate Registry ──────────────────────────────────────────────────
// Map<whaleAddress, { wins, losses, total, lastUpdated }>
const whaleRegistry = new Map();

// ─── Logger ───────────────────────────────────────────────────────────────────
const ts  = () => new Date().toISOString().slice(11, 19);
const log  = (tag, msg) => console.log(`[${ts()}][${tag}] ${msg}`);
const warn = (tag, msg) => console.warn(`[WARN][${tag}] ${msg}`);
function err(tag, msg) {
  console.error(`[ERR][${tag}] ${msg}`);
  errors.unshift({ time: new Date().toISOString(), tag, msg });
  if (errors.length > 20) errors.pop();
}

// ─── Supabase helpers ──────────────────────────────────────────────────────────
async function dbGet(table, filter = '') {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function dbInsert(table, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
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

// ─── Load balance + open position count ───────────────────────────────────────
async function loadBalance() {
  // Compute balance from trades: starting $10 minus spent + winnings
  // No global settings row exists — settings are per-user, worker tracks its own state
  try {
    const open   = await dbGet('polymarket_trades', 'status=eq.open&is_paper=eq.true&select=id,amount_usdc');
    const won    = await dbGet('polymarket_trades', 'status=eq.won&is_paper=eq.true&select=pnl_usdc');
    const lost   = await dbGet('polymarket_trades', 'status=eq.lost&is_paper=eq.true&select=amount_usdc');

    openPositions = open?.length || 0;

    // Only recalculate if we have trade history, otherwise keep in-memory balance
    if (open || won || lost) {
      const spent    = (open  || []).reduce((s, t) => s + (parseFloat(t.amount_usdc) || 0), 0);
      const winnings = (won   || []).reduce((s, t) => s + (parseFloat(t.pnl_usdc)   || 0), 0);
      const losses   = (lost  || []).reduce((s, t) => s + (parseFloat(t.amount_usdc)|| 0), 0);
      balance = Math.max(0, 10 - spent - losses + winnings);
    }
  } catch { /* keep in-memory balance on error */ }
}

// ─── Trade size: 5% of balance, $0.50–$50 ─────────────────────────────────────
const tradeSize = () => Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));

// ─── Whale Win Rate: fetch from Polymarket CLOB API ───────────────────────────
async function fetchWhaleWR(address) {
  // Check registry first (cache 1 hour)
  const cached = whaleRegistry.get(address);
  if (cached && Date.now() - cached.lastUpdated < 3_600_000) return cached;

  try {
    // Polymarket CLOB: get trade history for this address
    const r = await fetch(
      `${CLOB_API}/trades?maker_address=${address}&limit=50`,
      { headers: { Accept: 'application/json' } }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const trades = data?.data || data || [];

    if (!Array.isArray(trades) || trades.length < WHALE_MIN_TRADES) {
      log('WR', `${address.slice(0,8)} — only ${trades.length} trades (need ${WHALE_MIN_TRADES})`);
      return null; // not enough history
    }

    // Count resolved wins vs losses
    let wins = 0, losses = 0;
    for (const t of trades) {
      if (t.status === 'CONFIRMED' || t.status === 'MATCHED') {
        // A "win" = bought outcome that later resolved YES
        // We use price as a proxy: if they bought at <0.5 and market resolved >0.8, it's a win
        // More accurately: check if outcome_index matches winning side
        const outcome = t.outcome_index ?? t.side;
        const price   = parseFloat(t.price) || 0.5;
        // Simple heuristic: trade is profitable if price < 0.9 (wasn't a near-certainty)
        // We'll track by matching tokenId resolution — for now use CLOB outcome data
        if (t.market_status === 'resolved') {
          if (t.maker_won === true  || t.outcome_won === true)  wins++;
          if (t.maker_won === false || t.outcome_won === false) losses++;
        }
      }
    }

    // Also pull from our own Supabase polymarket_trades history for this whale
    const ourTrades = await dbGet(
      'polymarket_trades',
      `market_id=like.*${address.slice(0,8).toLowerCase()}*&select=status,direction`
    );
    // Count confirmed wins from our records
    const ourWins   = ourTrades?.filter(t => t.status === 'won').length  || 0;
    const ourLosses = ourTrades?.filter(t => t.status === 'lost').length || 0;
    wins   += ourWins;
    losses += ourLosses;

    const total = wins + losses;
    const wr    = total > 0 ? wins / total : null;

    const record = { wins, losses, total, wr, rawTrades: trades.length, lastUpdated: Date.now() };
    whaleRegistry.set(address, record);

    log('WR', `${address.slice(0,8)} — ${wins}W/${losses}L | WR: ${wr !== null ? (wr*100).toFixed(0)+'%' : 'unresolved'} | ${trades.length} trades`);
    return record;
  } catch (e) {
    warn('WR', `Failed to fetch WR for ${address.slice(0,8)}: ${e?.message}`);
    return null;
  }
}

// ─── Whale approval gate ───────────────────────────────────────────────────────
async function isWhaleApproved(address) {
  const record = await fetchWhaleWR(address);

  // Not enough data → reject (safe default)
  if (!record || record.rawTrades < WHALE_MIN_TRADES) {
    warn('GATE', `${address.slice(0,8)} REJECTED — insufficient history (${record?.rawTrades || 0} trades)`);
    return false;
  }

  // No resolved trades yet → reject
  if (record.total < 3) {
    warn('GATE', `${address.slice(0,8)} REJECTED — only ${record.total} resolved trades`);
    return false;
  }

  // Win rate below threshold → reject
  if (record.wr !== null && record.wr < WHALE_MIN_WR) {
    warn('GATE', `${address.slice(0,8)} REJECTED — WR ${(record.wr*100).toFixed(0)}% < ${(WHALE_MIN_WR*100).toFixed(0)}% threshold`);
    return false;
  }

  log('GATE', `${address.slice(0,8)} APPROVED — WR ${record.wr !== null ? (record.wr*100).toFixed(0)+'%' : 'NEW'} | ${record.rawTrades} trades`);
  return true;
}

// ─── LIVE: CLOB order execution ───────────────────────────────────────────────
async function executeLiveOrder(signal) {
  if (!POLY_API_KEY || !POLY_API_SEC || !POLY_PASS) {
    warn('LIVE', 'Missing CLOB credentials — skipping live order');
    return null;
  }
  if (!signal.tokenId) { warn('LIVE', 'No tokenId — skipping'); return null; }

  const size = tradeSize();
  const body = {
    orderType: 'GTC',
    tokenID: signal.tokenId,
    price: Math.min(0.99, Math.max(0.01, parseFloat(signal.currentPrice.toFixed(4)))),
    side: signal.direction === 'buy' ? 'BUY' : 'SELL',
    size: parseFloat(size.toFixed(2)),
    feeRateBps: 0,
    nonce: Date.now(),
    expiration: Math.floor(Date.now() / 1000) + 3600,
  };

  try {
    const resp = await fetch(`${CLOB_API}/order`, {
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
    if (!resp.ok) { err('LIVE', `CLOB ${resp.status}: ${(await resp.text()).slice(0,200)}`); return null; }
    const result = await resp.json();
    log('LIVE', `Order placed: ${result.orderId || result.id}`);
    return result;
  } catch (e) { err('LIVE', e?.message); return null; }
}

// ─── Fetch market end date from Gamma ─────────────────────────────────────────
const endDateCache = new Map();
async function fetchEndDate(marketId) {
  if (!marketId || marketId === 'unknown') return null;
  if (endDateCache.has(marketId)) return endDateCache.get(marketId);
  try {
    const r = await fetch(`${GAMMA_API}/markets/${marketId}`);
    if (!r.ok) return null;
    const m = await r.json();
    const endDate = m.endDate || m.end_date_iso || null;
    if (endDate) endDateCache.set(marketId, endDate);
    return endDate;
  } catch { return null; }
}

// ─── Record trade (paper or live) ─────────────────────────────────────────────
async function recordTrade(signal, strategy) {
  // ── POSITION CAP ──────────────────────────────────────────────────────────
  if (openPositions >= MAX_POSITIONS) {
    log('CAP', `Max positions reached (${openPositions}/${MAX_POSITIONS}) — skipping`);
    return false;
  }

  const size = tradeSize();
  const fee  = size * 0.0005;

  if (!PAPER_MODE && liveEnabled) {
    log('LIVE', `${signal.direction.toUpperCase()} ${signal.outcome} $${size} @ ${(signal.currentPrice*100).toFixed(1)}%`);
    const order = await executeLiveOrder(signal);
    const txHash = order?.orderId || order?.id || `live-${Date.now()}`;
    const endDate = await fetchEndDate(signal.marketId);
    await dbInsert('polymarket_trades', {
      user_id:         'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
      market_id:       signal.marketId || 'unknown',
      market_question: signal.reason || '',
      outcome:         signal.outcome,
      token_id:        signal.tokenId || txHash,
      direction:       signal.direction,
      shares:          size / (signal.currentPrice || 0.5),
      entry_price:     signal.currentPrice || 0.5,
      amount_usdc:     size,
      tx_hash:         txHash,
      strategy,
      is_paper:        false,
      status:          order ? 'open' : 'failed',
      market_end_date: endDate,
    });
    openPositions++;
    tradeCount++;
    recentTrades.unshift({ time: new Date().toLocaleTimeString(), strategy, mode: 'LIVE', ...signal, size });
    if (recentTrades.length > 50) recentTrades.pop();
    return !!order;
  }

  // ── PAPER PATH ────────────────────────────────────────────────────────────
  const cost = signal.direction === 'buy' ? size + fee : fee;
  if (signal.direction === 'buy' && cost > balance) {
    log('SKIP', `balance $${balance.toFixed(2)} < cost $${cost.toFixed(2)}`);
    return false;
  }

  const newBal = signal.direction === 'buy' ? balance - cost : balance + size - fee;
  const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

  const endDate = await fetchEndDate(signal.marketId);
  const ok = await dbInsert('polymarket_trades', {
    user_id:         'bd0b21c9-577a-450b-bb1e-21c9d0423f17',
    market_id:       signal.marketId || 'unknown',
    market_question: signal.reason || '',
    outcome:         signal.outcome,
    token_id:        signal.tokenId || txHash,
    direction:       signal.direction,
    shares:          size / (signal.currentPrice || 0.5),
    entry_price:     signal.currentPrice || 0.5,
    amount_usdc:     size,
    tx_hash:         txHash,
    strategy,
    is_paper:        true,
    status:          'open',
    market_end_date: endDate,
  });

  if (ok) {
    balance = newBal; // balance tracked in-memory, recomputed from trades on reload
    openPositions++;
    tradeCount++;
    recentTrades.unshift({
      time: new Date().toLocaleTimeString(), strategy, mode: 'PAPER',
      direction: signal.direction, outcome: signal.outcome,
      size, price: signal.currentPrice, balance: newBal,
    });
    if (recentTrades.length > 50) recentTrades.pop();
    log('TRADE', `${strategy} | ${signal.direction.toUpperCase()} ${signal.outcome} | $${size.toFixed(2)} @ ${((signal.currentPrice||0.5)*100).toFixed(1)}% | bal $${newBal.toFixed(2)} | pos ${openPositions}/${MAX_POSITIONS}`);
    return true;
  }
  return false;
}

// ─── Fetch markets ─────────────────────────────────────────────────────────────
async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=50&active=true&closed=false`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.map((m) => {
      const names    = JSON.parse(m.outcomes      || '["Yes","No"]');
      const prices   = JSON.parse(m.outcomePrices || '[0.5,0.5]');
      const tokenIds = JSON.parse(m.clobTokenIds  || '["",""]');
      return {
        id: m.id, question: m.question,
        liquidity: parseFloat(m.liquidity) || 0,
        volume:    parseFloat(m.volume)    || 0,
        closed:    m.closed,
        outcomes:  names.map((name, i) => ({
          name, price: parseFloat(prices[i]) || 0.5, tokenId: tokenIds[i] || '',
        })),
      };
    });
  } catch (e) { err('MARKETS', e?.message); return []; }
}

// ─── Strategy 1: Latency Arb ──────────────────────────────────────────────────
function latencyArb(markets) {
  const now = Date.now();
  const signals = [];
  for (const m of markets.filter(m => m.liquidity > 5000 && !m.closed).sort((a,b) => b.volume - a.volume).slice(0,10)) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no  = m.outcomes.find(o => o.name.toLowerCase() === 'no');
    if (!yes || !no) continue;
    const hist = priceHistory.get(m.id) || [];
    hist.push({ price: yes.price, ts: now });
    const fresh = hist.filter(s => s.ts >= now - 30000);
    priceHistory.set(m.id, fresh);
    if (fresh.length < 3) continue;
    const move = (yes.price - fresh[0].price) / fresh[0].price;
    const abs  = Math.abs(move);
    if (abs < 0.03) continue;
    const sigId = `lat-${m.id}-${Math.floor(now/60000)}`;
    if (processedSigs.has(sigId)) continue;
    processedSigs.add(sigId);
    const outcome = move > 0 ? yes : no;
    signals.push({
      marketId: m.id, direction: 'buy',
      outcome: outcome.name, tokenId: outcome.tokenId,
      confidence: Math.min(90, 60 + abs * 300),
      reason: `[LATENCY] ${m.question} | ${(move*100).toFixed(1)}% move`,
      currentPrice: outcome.price,
    });
  }
  return signals;
}

// ─── Strategy 2: Volatility Scalper ──────────────────────────────────────────
function volScalper(markets) {
  const signals = [];
  for (const m of markets.filter(m => m.liquidity > 100000 && !m.closed).slice(0,15)) {
    const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
    if (!yes) continue;
    const key  = `vol-${m.id}`;
    const hist = priceHistory.get(key) || [];
    hist.push(yes.price);
    if (hist.length > 20) hist.shift();
    priceHistory.set(key, hist);
    if (hist.length < 10) continue;
    const mean = hist.reduce((a,b) => a+b, 0) / hist.length;
    const std  = Math.sqrt(hist.reduce((s,p) => s + (p-mean)**2, 0) / hist.length);
    const vol  = std / mean;
    if (vol < 0.05) continue;
    const sigId = `scalp-${m.id}-${Math.floor(Date.now()/120000)}`;
    if (processedSigs.has(sigId)) continue;
    processedSigs.add(sigId);
    if (yes.price > mean * 0.97) continue;
    signals.push({
      marketId: m.id, direction: 'buy',
      outcome: 'Yes', tokenId: yes.tokenId,
      confidence: Math.min(85, 50 + vol * 200),
      reason: `[SCALP] ${m.question} | vol=${(vol*100).toFixed(1)}%`,
      currentPrice: yes.price,
    });
  }
  return signals;
}

// ─── Strategy 3: Whale Mirror — WITH WIN RATE GATE ────────────────────────────
async function startWhaleMirror(provider) {
  log('WHALE', `Block listener active | min WR ${(WHALE_MIN_WR*100).toFixed(0)}% | min trades ${WHALE_MIN_TRADES}`);
  const iface = new ethers.Interface([
    'function fillOrder((uint256 salt,address maker,address signer,address taker,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint256 expiration,uint256 nonce,uint256 feeRateBps,uint8 side,uint8 signatureType) order,bytes signature,uint256 fillAmount)',
  ]);

  provider.on('block', async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block?.prefetchedTransactions) return;

      for (const tx of block.prefetchedTransactions) {
        if (tx.to?.toLowerCase() !== CTF_EXCHANGE.toLowerCase()) continue;
        const whaleAddr = tx.from?.toLowerCase();
        if (!whaleAddr) continue;

        // ── WIN RATE GATE ──────────────────────────────────────────────────
        const approved = await isWhaleApproved(whaleAddr);
        if (!approved) continue;
        // ──────────────────────────────────────────────────────────────────

        log('WHALE', `✅ Approved whale ${whaleAddr.slice(0,8)} | block ${blockNumber} | tx ${tx.hash?.slice(0,10)}`);
        try {
          const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          if (!decoded) continue;
          const order = decoded.args[0];
          const price = Number(order.takerAmount) / (Number(order.makerAmount) || 1);

          const wrInfo = whaleRegistry.get(whaleAddr);
          await recordTrade({
            marketId: '', direction: order.side === 0 ? 'buy' : 'sell',
            outcome: order.side === 0 ? 'Yes' : 'No',
            tokenId: order.tokenId.toString(),
            reason: `[WHALE] ${whaleAddr.slice(0,8)} WR:${wrInfo?.wr !== null && wrInfo?.wr !== undefined ? (wrInfo.wr*100).toFixed(0)+'%' : 'new'} block:${blockNumber}`,
            currentPrice: Math.min(0.99, Math.max(0.01, price)),
          }, 'whale_mirror');
        } catch { /* not a fillOrder */ }
      }
    } catch (e) { err('WHALE', `block ${e?.message}`); }
  });
}

// ─── Main scan loop (every 15s) ───────────────────────────────────────────────
async function scanLoop() {
  setInterval(async () => {
    try {
      await loadBalance();
      const markets = await fetchMarkets();
      if (!markets.length) { warn('SCAN', 'No markets returned'); return; }

      scanCount++;
      lastScan = new Date();
      log('SCAN', `#${scanCount} | ${markets.length} mkts | bal $${balance.toFixed(2)} | pos ${openPositions}/${MAX_POSITIONS} | size $${tradeSize().toFixed(2)}`);

      // Stop signal generation if at position cap
      if (openPositions >= MAX_POSITIONS) {
        log('CAP', `Position cap hit (${openPositions}/${MAX_POSITIONS}) — waiting for resolutions`);
        return;
      }

      const signals = [
        ...latencyArb(markets),
        ...volScalper(markets),
      ].sort((a,b) => b.confidence - a.confidence).slice(0, 2); // max 2 per scan

      for (const sig of signals) {
        const strat = sig.reason.startsWith('[SCALP]') ? 'volatility_scalp' : 'latency_arb';
        await recordTrade(sig, strat);
        await new Promise(r => setTimeout(r, 500));
      }

      if (processedSigs.size > 1000) {
        [...processedSigs].slice(0, 500).forEach(s => processedSigs.delete(s));
      }
    } catch (e) { err('SCAN', e?.message); }
  }, 15000);
}

// ─── Express API ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({
  status: 'running',
  bot: 'SQI-2050 Shiesty Signal Oracle v2',
  mode: PAPER_MODE ? 'PAPER' : 'LIVE',
  liveEnabled,
  balance: parseFloat(balance.toFixed(2)),
  tradeCount, scanCount,
  openPositions, maxPositions: MAX_POSITIONS,
  whaleFilter: { minWR: `${(WHALE_MIN_WR*100).toFixed(0)}%`, minTrades: WHALE_MIN_TRADES },
  approvedWhales: [...whaleRegistry.entries()]
    .filter(([,v]) => v.wr === null || v.wr >= WHALE_MIN_WR)
    .map(([addr,v]) => ({ addr: addr.slice(0,10), wr: v.wr !== null ? `${(v.wr*100).toFixed(0)}%` : 'new', trades: v.rawTrades })),
  riskPct: `${RISK_PCT*100}%`,
  tradeSize: tradeSize(),
  lastScan: lastScan?.toISOString() || null,
  uptime: Math.round(process.uptime()),
  recentErrors: errors.slice(0,3),
}));

app.get('/whales', (_req, res) => {
  const list = [...whaleRegistry.entries()].map(([addr, v]) => ({
    address: addr, shortAddr: addr.slice(0,10),
    wr: v.wr !== null ? parseFloat((v.wr*100).toFixed(1)) : null,
    wins: v.wins, losses: v.losses, total: v.total,
    rawTrades: v.rawTrades,
    approved: v.rawTrades >= WHALE_MIN_TRADES && (v.wr === null || v.wr >= WHALE_MIN_WR),
    lastUpdated: new Date(v.lastUpdated).toISOString(),
  }));
  res.json({ count: list.length, minWR: WHALE_MIN_WR, minTrades: WHALE_MIN_TRADES, whales: list });
});

app.get('/trades', (_req, res) => res.json({ trades: recentTrades, count: tradeCount }));

app.post('/control', (req, res) => {
  const { action } = req.body || {};
  if (action === 'pause')  { liveEnabled = false; log('CTRL', 'Live trading PAUSED'); }
  if (action === 'resume') { liveEnabled = true;  log('CTRL', 'Live trading RESUMED'); }
  res.json({ liveEnabled, mode: PAPER_MODE ? 'PAPER' : 'LIVE' });
});

app.get('/', (_req, res) => res.type('text').send('SQI-2050 Shiesty v2 — GET /health | /whales | /trades'));

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle v2 — Railway');
  console.log(`  Mode: ${PAPER_MODE ? '📋 PAPER' : '🔴 LIVE'} | Risk: ${RISK_PCT*100}% | Max pos: ${MAX_POSITIONS}`);
  console.log(`  Whale gate: min ${(WHALE_MIN_WR*100).toFixed(0)}% WR | min ${WHALE_MIN_TRADES} trades`);
  console.log('══════════════════════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    process.exit(1);
  }

  await loadBalance();
  log('BOOT', `Balance: $${balance.toFixed(2)} | Open positions: ${openPositions}/${MAX_POSITIONS}`);

  if (!PAPER_MODE) {
    if (!POLY_API_KEY || !POLY_API_SEC || !POLY_PASS) {
      warn('LIVE', 'CLOB credentials missing — live orders disabled');
    } else {
      liveEnabled = true;
      log('LIVE', 'CLOB credentials loaded — LIVE trading ACTIVE');
    }
  }

  if (PRIVATE_KEY && process.env.POLYGON_RPC_URL) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL, undefined, { staticNetwork: true });
      await provider.getBlockNumber();
      await startWhaleMirror(provider);
    } catch (e) { warn('WHALE', `RPC failed — whale mirror disabled: ${e?.message}`); }
  } else {
    warn('WHALE', 'No BOT_PRIVATE_KEY or POLYGON_RPC_URL — whale mirror disabled (strategies still active)');
  }

  await scanLoop();
  app.listen(PORT, '0.0.0.0', () => log('HTTP', `Port ${PORT}`));
}

main().catch(e => { console.error(e); process.exit(1); });

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLUTION ENGINE — checks open trades against Polymarket API every 5 min
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchMarketDetail(marketId) {
  try {
    const r = await fetch(`${GAMMA_API}/markets/${marketId}`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function resolveOpenTrades() {
  try {
    // Get all open trades that have an end date
    const open = await dbGet(
      'polymarket_trades',
      'status=eq.open&market_id=neq.unknown&select=id,market_id,outcome,direction,entry_price,amount_usdc,shares,is_paper,market_end_date'
    );
    if (!open?.length) return;

    const now = Date.now();
    let resolved = 0;

    for (const trade of open) {
      // Skip if market end date is in the future (with 1hr buffer)
      if (trade.market_end_date) {
        const endMs = new Date(trade.market_end_date).getTime();
        if (endMs > now - 3_600_000) continue; // not expired yet
      }

      const market = await fetchMarketDetail(trade.market_id);
      if (!market) continue;
      if (!market.closed && !market.resolved) continue; // still live

      // Find the winning outcome
      const names    = JSON.parse(market.outcomes      || '["Yes","No"]');
      const prices   = JSON.parse(market.outcomePrices || '[0.5,0.5]');
      const winnerIdx = prices.findIndex(p => parseFloat(p) >= 0.99);
      const winner    = winnerIdx >= 0 ? names[winnerIdx] : null;

      if (!winner) continue; // not fully resolved yet

      const tradeWon   = trade.outcome?.toLowerCase() === winner.toLowerCase();
      const exitPrice  = tradeWon ? 1.0 : 0.0;
      const shares     = parseFloat(trade.shares) || 0;
      const spent      = parseFloat(trade.amount_usdc) || 0;
      const pnl        = tradeWon ? (shares * exitPrice) - spent : -spent;
      const pnlPct     = spent > 0 ? (pnl / spent) * 100 : 0;

      await dbUpdate('polymarket_trades', `id=eq.${trade.id}`, {
        status:            tradeWon ? 'won' : 'lost',
        exit_price:        exitPrice,
        pnl_usdc:          parseFloat(pnl.toFixed(4)),
        pnl_pct:           parseFloat(pnlPct.toFixed(2)),
        winning_outcome:   winner,
        resolved_at:       new Date().toISOString(),
        resolution_source: 'gamma_api',
      });

      // Update paper balance if won
      if (trade.is_paper && tradeWon) {
        const winnings = shares * exitPrice;
        balance = Math.max(0, balance + winnings); // recomputed from trades on next loadBalance()
        log('RESOLVE', `✅ WON ${trade.outcome} | +$${winnings.toFixed(2)} | new bal $${newBal.toFixed(2)}`);
      } else {
        log('RESOLVE', `❌ LOST ${trade.outcome} | -$${spent.toFixed(2)} | winner was ${winner}`);
      }
      resolved++;
      openPositions = Math.max(0, openPositions - 1);
      await new Promise(r => setTimeout(r, 300));
    }

    if (resolved > 0) log('RESOLVE', `Settled ${resolved} trades`);
  } catch (e) { err('RESOLVE', e?.message); }
}

// Run resolution check every 5 minutes
setInterval(resolveOpenTrades, 5 * 60 * 1000);
// Also run once on boot after 30s
setTimeout(resolveOpenTrades, 30_000);
