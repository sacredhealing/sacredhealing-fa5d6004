/**
 * SQI-2050 Shiesty Signal Oracle — Railway Worker
 * ═══════════════════════════════════════════════════════
 * Whale Mirror + Latency Arb + Volatility Scalper
 * Paper mode: records to Supabase polymarket_trades
 * Live mode:  executes real orders via Polymarket CLOB API
 *
 * Required env vars:
 *   SUPABASE_URL          — https://ssygukfdbtehvtndandn.supabase.co
 *   SUPABASE_SERVICE_KEY  — service role key (from Lovable → Supabase → Settings → API)
 *   POLYGON_RPC_URL       — Alchemy/QuickNode Polygon HTTPS RPC
 *   PAPER_MODE            — true (default) | false
 *   RISK_PCT              — 0.05 (default = 5% per trade)
 *
 * For LIVE mode only (all required together):
 *   POLY_API_KEY          — from polymarket.com → Settings → API
 *   POLY_API_SECRET       — from polymarket.com → Settings → API
 *   POLY_API_PASSPHRASE   — from polymarket.com → Settings → API
 *   BOT_PRIVATE_KEY       — 64-char hex Polygon wallet private key
 */

import 'dotenv/config';
import express from 'express';
import { ethers } from 'ethers';

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT           = Number(process.env.PORT || 8080);
const PAPER_MODE     = String(process.env.PAPER_MODE ?? 'true').toLowerCase() === 'true';
const RISK_PCT       = parseFloat(process.env.RISK_PCT || '0.05');
const SUPABASE_URL   = process.env.SUPABASE_URL || '';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || '';
const PRIVATE_KEY    = process.env.BOT_PRIVATE_KEY || '';
const POLY_API_KEY   = process.env.POLY_API_KEY || '';
const POLY_API_SEC   = process.env.POLY_API_SECRET || '';
const POLY_PASS      = process.env.POLY_API_PASSPHRASE || '';

const GAMMA_API      = 'https://gamma-api.polymarket.com';
const CLOB_API       = 'https://clob.polymarket.com';
const CTF_EXCHANGE   = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';
const CHAIN_ID       = 137; // Polygon mainnet
const WHALE_WALLET   = '0x63ce342161250d705dc0b16df89036c8e5f9ba9a';

// ─── State ────────────────────────────────────────────────────────────────────
let balance      = 10;
let tradeCount   = 0;
let scanCount    = 0;
let lastScan     = null;
let liveEnabled  = false;
const priceHistory  = new Map();
const processedSigs = new Set();
const recentTrades  = [];
const errors        = [];

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(tag, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}][${tag}] ${msg}`);
}
function warn(tag, msg) { console.warn(`[WARN][${tag}] ${msg}`); }
function err(tag, msg)  {
  console.error(`[ERR][${tag}] ${msg}`);
  errors.unshift({ time: new Date().toISOString(), tag, msg });
  if (errors.length > 20) errors.pop();
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────
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

// ─── Load balance from Supabase ────────────────────────────────────────────────
async function loadBalance() {
  const rows = await dbGet('polymarket_bot_settings', 'limit=1');
  if (rows?.length) balance = parseFloat(rows[0].paper_balance) || 10;
}

// ─── Trade size (5% of balance, min $0.50, max $50) ───────────────────────────
function tradeSize() {
  return Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));
}

// ─── LIVE: Polymarket CLOB order execution ─────────────────────────────────────
async function executeLiveOrder(signal) {
  if (!POLY_API_KEY || !POLY_API_SEC || !POLY_PASS) {
    warn('LIVE', 'Missing POLY_API_KEY / SECRET / PASSPHRASE — skipping live order');
    return null;
  }
  if (!signal.tokenId) {
    warn('LIVE', 'No tokenId on signal — cannot place order');
    return null;
  }

  const size = tradeSize();
  // Polymarket CLOB: place a limit GTC order
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
    // Step 1: get L2 auth headers from CLOB
    const authResp = await fetch(`${CLOB_API}/auth/derive-api-key`, {
      method: 'GET',
      headers: {
        'POLY_ADDRESS': new ethers.Wallet(PRIVATE_KEY).address,
        'POLY_SIGNATURE': '',       // L1 auth — CLOB accepts key-based auth below
        'POLY_TIMESTAMP': String(Math.floor(Date.now() / 1000)),
        'POLY_NONCE': '0',
      },
    });

    // Step 2: place the order with L2 credentials
    const resp = await fetch(`${CLOB_API}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'POLY_ADDRESS': new ethers.Wallet(PRIVATE_KEY).address,
        'POLY_API_KEY': POLY_API_KEY,
        'POLY_SECRET': POLY_API_SEC,
        'POLY_PASSPHRASE': POLY_PASS,
        'POLY_TIMESTAMP': String(Math.floor(Date.now() / 1000)),
        'POLY_NONCE': '0',
        'POLY_SIGNATURE': '',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      err('LIVE', `CLOB order failed ${resp.status}: ${text.slice(0, 200)}`);
      return null;
    }

    const result = await resp.json();
    log('LIVE', `Order placed — orderId: ${result.orderId || result.id}`);
    return result;
  } catch (e) {
    err('LIVE', `Exception placing order: ${e?.message}`);
    return null;
  }
}

// ─── Record trade (paper or live) ─────────────────────────────────────────────
async function recordTrade(signal, strategy) {
  const size = tradeSize();
  const fee  = size * 0.0005;

  if (!PAPER_MODE && liveEnabled) {
    // LIVE PATH
    log('LIVE', `Executing ${signal.direction.toUpperCase()} ${signal.outcome} | $${size} @ ${(signal.currentPrice * 100).toFixed(1)}%`);
    const order = await executeLiveOrder(signal);
    const txHash = order?.orderId || order?.id || `live-${Date.now()}`;

    await dbInsert('polymarket_trades', {
      market_id:       signal.marketId || 'unknown',
      market_question: signal.reason || signal.marketId,
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
    });

    tradeCount++;
    recentTrades.unshift({
      time: new Date().toLocaleTimeString(), strategy, mode: 'LIVE',
      direction: signal.direction, outcome: signal.outcome,
      size, price: signal.currentPrice, orderId: txHash,
    });
    if (recentTrades.length > 50) recentTrades.pop();
    return !!order;
  }

  // PAPER PATH
  const cost   = signal.direction === 'buy' ? size + fee : fee;
  if (signal.direction === 'buy' && cost > balance) {
    log('SKIP', `balance $${balance.toFixed(2)} < cost $${cost.toFixed(2)}`);
    return false;
  }

  const newBal = signal.direction === 'buy' ? balance - cost : balance + size - fee;
  const txHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const ok = await dbInsert('polymarket_trades', {
    market_id:       signal.marketId || 'unknown',
    market_question: signal.reason || signal.marketId,
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
  });

  if (ok) {
    await dbUpdate('polymarket_bot_settings', 'limit=1', {
      paper_balance: parseFloat(newBal.toFixed(4)),
    });
    balance = newBal;
    tradeCount++;
    recentTrades.unshift({
      time: new Date().toLocaleTimeString(), strategy, mode: 'PAPER',
      direction: signal.direction, outcome: signal.outcome,
      size, price: signal.currentPrice, balance: newBal,
    });
    if (recentTrades.length > 50) recentTrades.pop();
    log('TRADE', `${strategy} | ${signal.direction.toUpperCase()} ${signal.outcome} | $${size.toFixed(2)} @ ${((signal.currentPrice || 0.5) * 100).toFixed(1)}% | bal $${newBal.toFixed(2)} | #${tradeCount}`);
    return true;
  }
  return false;
}

// ─── Fetch live Polymarket markets ─────────────────────────────────────────────
async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=50&active=true&closed=false`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.map((m) => {
      const names    = JSON.parse(m.outcomes     || '["Yes","No"]');
      const prices   = JSON.parse(m.outcomePrices || '[0.5,0.5]');
      const tokenIds = JSON.parse(m.clobTokenIds  || '["",""]');
      return {
        id: m.id, question: m.question,
        liquidity: parseFloat(m.liquidity) || 0,
        volume:    parseFloat(m.volume)    || 0,
        closed:    m.closed,
        outcomes: names.map((name, i) => ({
          name, price: parseFloat(prices[i]) || 0.5, tokenId: tokenIds[i] || '',
        })),
      };
    });
  } catch (e) {
    err('MARKETS', e?.message);
    return [];
  }
}

// ─── Strategy 1: Latency Arb ──────────────────────────────────────────────────
function latencyArb(markets) {
  const now = Date.now();
  const signals = [];

  for (const m of markets
    .filter((m) => m.liquidity > 5000 && !m.closed)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)) {

    const yes = m.outcomes.find((o) => o.name.toLowerCase() === 'yes');
    const no  = m.outcomes.find((o) => o.name.toLowerCase() === 'no');
    if (!yes || !no) continue;

    const hist = priceHistory.get(m.id) || [];
    hist.push({ price: yes.price, ts: now });
    const fresh = hist.filter((s) => s.ts >= now - 30000);
    priceHistory.set(m.id, fresh);
    if (fresh.length < 3) continue;

    const move = (yes.price - fresh[0].price) / fresh[0].price;
    const abs  = Math.abs(move);
    if (abs < 0.03) continue;

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
  return signals;
}

// ─── Strategy 2: Volatility Scalper ──────────────────────────────────────────
function volScalper(markets) {
  const signals = [];
  for (const m of markets.filter((m) => m.liquidity > 100000 && !m.closed).slice(0, 15)) {
    const yes = m.outcomes.find((o) => o.name.toLowerCase() === 'yes');
    if (!yes) continue;

    const key  = `vol-${m.id}`;
    const hist = priceHistory.get(key) || [];
    hist.push(yes.price);
    if (hist.length > 20) hist.shift();
    priceHistory.set(key, hist);
    if (hist.length < 10) continue;

    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    const std  = Math.sqrt(hist.reduce((s, p) => s + (p - mean) ** 2, 0) / hist.length);
    const vol  = std / mean;
    if (vol < 0.05) continue;

    const sigId = `scalp-${m.id}-${Math.floor(Date.now() / 120000)}`;
    if (processedSigs.has(sigId)) continue;
    processedSigs.add(sigId);
    if (yes.price > mean * 0.97) continue; // only buy dips

    signals.push({
      marketId: m.id, direction: 'buy',
      outcome: 'Yes', tokenId: yes.tokenId,
      confidence: Math.min(85, 50 + vol * 200),
      reason: `[SCALP] ${m.question} | vol=${(vol * 100).toFixed(1)}%`,
      currentPrice: yes.price,
    });
  }
  return signals;
}

// ─── Strategy 3: Whale Mirror (on-chain block listener) ───────────────────────
async function startWhaleMirror(provider) {
  log('WHALE', `Monitoring ${WHALE_WALLET.slice(0, 10)}... on CTF Exchange`);
  const iface = new ethers.Interface([
    'function fillOrder((uint256 salt,address maker,address signer,address taker,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint256 expiration,uint256 nonce,uint256 feeRateBps,uint8 side,uint8 signatureType) order,bytes signature,uint256 fillAmount)',
  ]);

  provider.on('block', async (blockNumber) => {
    try {
      const block = await provider.getBlock(blockNumber, true);
      if (!block?.prefetchedTransactions) return;
      for (const tx of block.prefetchedTransactions) {
        if (tx.from?.toLowerCase() !== WHALE_WALLET.toLowerCase()) continue;
        if (tx.to?.toLowerCase() !== CTF_EXCHANGE.toLowerCase()) continue;
        log('WHALE', `Trade detected block ${blockNumber} | tx ${tx.hash?.slice(0,10)}`);
        try {
          const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          if (!decoded) continue;
          const order = decoded.args[0];
          const price = Number(order.takerAmount) / (Number(order.makerAmount) || 1);
          await recordTrade({
            marketId: '', direction: order.side === 0 ? 'buy' : 'sell',
            outcome: order.side === 0 ? 'Yes' : 'No',
            tokenId: order.tokenId.toString(),
            reason: `[WHALE] ${WHALE_WALLET.slice(0, 10)}... block ${blockNumber}`,
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
      log('SCAN', `#${scanCount} | ${markets.length} markets | bal $${balance.toFixed(2)} | size $${tradeSize().toFixed(2)} | mode ${PAPER_MODE ? 'PAPER' : 'LIVE'}`);

      const signals = [
        ...latencyArb(markets),
        ...volScalper(markets),
      ].sort((a, b) => b.confidence - a.confidence).slice(0, 3); // max 3 signals per scan

      for (const sig of signals) {
        const strat = sig.reason.startsWith('[SCALP]') ? 'volatility_scalp' : 'latency_arb';
        await recordTrade(sig, strat);
        await new Promise((r) => setTimeout(r, 500));
      }

      // Prune dedupe set
      if (processedSigs.size > 1000) {
        [...processedSigs].slice(0, 500).forEach((s) => processedSigs.delete(s));
      }
    } catch (e) { err('SCAN', e?.message); }
  }, 15000);
}

// ─── Express health + control API ─────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({
  status: 'running',
  bot: 'SQI-2050 Shiesty Signal Oracle',
  mode: PAPER_MODE ? 'PAPER' : 'LIVE',
  liveEnabled,
  balance: parseFloat(balance.toFixed(2)),
  tradeCount, scanCount,
  riskPct: `${RISK_PCT * 100}%`,
  tradeSize: tradeSize(),
  lastScan: lastScan?.toISOString() || null,
  uptime: Math.round(process.uptime()),
  errors: errors.slice(0, 5),
}));

app.get('/trades', (_req, res) => res.json({ trades: recentTrades, count: tradeCount }));

// Kill switch — POST /control { action: 'pause' | 'resume' }
app.post('/control', (req, res) => {
  const { action } = req.body || {};
  if (action === 'pause')  { liveEnabled = false; log('CTRL', 'Live trading PAUSED'); }
  if (action === 'resume') { liveEnabled = true;  log('CTRL', 'Live trading RESUMED'); }
  res.json({ liveEnabled, mode: PAPER_MODE ? 'PAPER' : 'LIVE' });
});

app.get('/', (_req, res) => res.type('text').send('SQI-2050 Shiesty Signal Oracle — GET /health'));

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SQI-2050 ⚡ Shiesty Signal Oracle — Railway');
  console.log(`  Mode: ${PAPER_MODE ? '📋 PAPER' : '🔴 LIVE'} | Risk: ${RISK_PCT * 100}%`);
  console.log('  Strategies: Whale Mirror + Latency Arb + Vol Scalp');
  console.log('═══════════════════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    process.exit(1);
  }

  await loadBalance();
  log('BOOT', `Balance: $${balance.toFixed(2)} | Trade size: $${tradeSize().toFixed(2)}`);

  if (!PAPER_MODE) {
    if (!POLY_API_KEY || !POLY_API_SEC || !POLY_PASS) {
      warn('LIVE', 'POLY_API_KEY/SECRET/PASSPHRASE not set — live orders will be skipped');
    } else {
      liveEnabled = true;
      log('LIVE', `CLOB credentials loaded — LIVE trading ACTIVE`);
    }
  }

  // Whale mirror — requires private key + RPC
  if (PRIVATE_KEY && process.env.POLYGON_RPC_URL) {
    try {
      const rpc = process.env.POLYGON_RPC_URL;
      const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      await provider.getBlockNumber(); // test connection
      await startWhaleMirror(provider);
      log('WHALE', 'Block listener active');
    } catch (e) { warn('WHALE', `RPC failed — whale mirror disabled: ${e?.message}`); }
  } else {
    warn('WHALE', 'No BOT_PRIVATE_KEY or POLYGON_RPC_URL — whale mirror disabled');
  }

  await scanLoop();

  app.listen(PORT, '0.0.0.0', () => {
    log('HTTP', `Health server on port ${PORT}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
