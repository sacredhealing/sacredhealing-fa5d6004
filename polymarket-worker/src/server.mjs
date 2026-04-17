/**
 * Polymarket HFT Worker — Bot 1 (24/7 Railway)
 * ═══════════════════════════════════════════════
 * Whale Mirror + Latency Arb + Volatility Scalper
 * Mirrors PolymarketBotDetail.tsx strategies server-side
 *
 * Env vars:
 *   BOT_PRIVATE_KEY       — 64-char hex wallet key
 *   POLYGON_RPC_URL       — Alchemy Polygon RPC
 *   SUPABASE_URL          — https://ssygukfdbtehvtndandn.supabase.co
 *   SUPABASE_SERVICE_KEY  — service role key
 *   PAPER_MODE            — true (default) | false
 *   RISK_PCT              — 0.05 (default = 5%)
 *   PORT                  — 8080 (default)
 */

import 'dotenv/config';
import express from 'express';
import { ethers } from 'ethers';

const PORT = Number(process.env.PORT || 8080);
const PAPER_MODE = String(process.env.PAPER_MODE ?? 'true').toLowerCase() === 'true';
const RISK_PCT = parseFloat(process.env.RISK_PCT || '0.05');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || '';
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CTF_EXCHANGE = '0x4bFb41d9539d67a68D6FB09be3c29aE0dC14dc3a';
const WHALE_WALLET = '0x63ce342161250d705dc0b16df89036c8e5f9ba9a';

// ─── State ────────────────────────────────────────────────────────────────────
let balance = 10;
let tradeCount = 0;
let scanCount = 0;
let lastScan = null;
const priceHistory = new Map();
const processedSigs = new Set();
const recentTrades = [];

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function dbGet(table, filter = '') {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

async function dbInsert(table, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function dbUpdate(table, filter, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ─── Load balance ─────────────────────────────────────────────────────────────
async function loadBalance() {
  const rows = await dbGet('polymarket_bot_settings', 'limit=1');
  if (rows?.length) balance = parseFloat(rows[0].paper_balance) || 10;
}

// ─── Calculate 5% trade size ──────────────────────────────────────────────────
function tradeSize() {
  return Math.min(50, Math.max(0.5, parseFloat((balance * RISK_PCT).toFixed(2))));
}

// ─── Record paper trade ───────────────────────────────────────────────────────
async function recordTrade(signal, strategy) {
  const size = tradeSize();
  const fee = size * 0.0005;
  const cost = signal.direction === 'buy' ? size + fee : fee;

  if (signal.direction === 'buy' && cost > balance) {
    console.log(`[SKIP] balance €${balance.toFixed(2)} < cost €${cost.toFixed(2)}`);
    return false;
  }

  const newBal = signal.direction === 'buy' ? balance - cost : balance + size - fee;
  const txHash = `railway-hft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const ok = await dbInsert('polymarket_trades', {
    market_id: signal.marketId || 'unknown',
    market_question: signal.reason || signal.marketId,
    outcome: signal.outcome,
    token_id: signal.tokenId || txHash,
    direction: signal.direction,
    shares: size / (signal.currentPrice || 0.5),
    entry_price: signal.currentPrice || 0.5,
    amount_usdc: size,
    tx_hash: txHash,
    strategy,
    is_paper: true,
    status: 'open',
  });

  if (ok) {
    await dbUpdate('polymarket_bot_settings', 'limit=1', {
      paper_balance: parseFloat(newBal.toFixed(4)),
    });
    balance = newBal;
    tradeCount++;
    recentTrades.unshift({
      time: new Date().toLocaleTimeString(),
      strategy,
      direction: signal.direction,
      outcome: signal.outcome,
      size,
      price: signal.currentPrice,
      balance: newBal,
    });
    if (recentTrades.length > 50) recentTrades.pop();

    console.log(
      `[TRADE] ${strategy} | ${signal.direction.toUpperCase()} ${signal.outcome}` +
        ` | €${size.toFixed(2)} @ ${((signal.currentPrice || 0.5) * 100).toFixed(1)}%` +
        ` | bal: €${newBal.toFixed(2)} | #${tradeCount}`
    );
    return true;
  }
  return false;
}

// ─── Fetch markets ────────────────────────────────────────────────────────────
async function fetchMarkets() {
  try {
    const r = await fetch(`${GAMMA_API}/markets?limit=50&active=true&closed=false`);
    if (!r.ok) return [];
    const data = await r.json();
    return data.map((m) => {
      const names = JSON.parse(m.outcomes || '["Yes","No"]');
      const prices = JSON.parse(m.outcomePrices || '[0.5,0.5]');
      const tokenIds = JSON.parse(m.clobTokenIds || '["",""]');
      return {
        id: m.id,
        question: m.question,
        liquidity: parseFloat(m.liquidity) || 0,
        volume: parseFloat(m.volume) || 0,
        closed: m.closed,
        outcomes: names.map((name, i) => ({
          name,
          price: parseFloat(prices[i]) || 0.5,
          tokenId: tokenIds[i] || '',
        })),
      };
    });
  } catch {
    return [];
  }
}

// ─── Strategy 1: Latency Arb ──────────────────────────────────────────────────
function latencyArb(markets) {
  const now = Date.now();
  const cutoff = now - 30000;
  const signals = [];

  for (const m of markets
    .filter((m) => m.liquidity > 5000 && !m.closed)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)) {
    const yes = m.outcomes.find((o) => o.name.toLowerCase() === 'yes');
    const no = m.outcomes.find((o) => o.name.toLowerCase() === 'no');
    if (!yes || !no) continue;

    const hist = priceHistory.get(m.id) || [];
    hist.push({ price: yes.price, ts: now });
    const fresh = hist.filter((s) => s.ts >= cutoff);
    priceHistory.set(m.id, fresh);
    if (fresh.length < 3) continue;

    const move = (yes.price - fresh[0].price) / fresh[0].price;
    const abs = Math.abs(move);
    if (abs < 0.03) continue;

    const sigId = `lat-${m.id}-${Math.floor(now / 60000)}`;
    if (processedSigs.has(sigId)) continue;
    processedSigs.add(sigId);

    const outcome = move > 0 ? yes : no;
    signals.push({
      marketId: m.id,
      direction: 'buy',
      outcome: outcome.name,
      tokenId: outcome.tokenId,
      confidence: Math.min(90, 60 + abs * 100 * 3),
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

    const key = `vol-${m.id}`;
    const hist = priceHistory.get(key) || [];
    hist.push(yes.price);
    if (hist.length > 20) hist.shift();
    priceHistory.set(key, hist);
    if (hist.length < 10) continue;

    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    const std = Math.sqrt(hist.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / hist.length);
    const vol = std / mean;
    if (vol < 0.05) continue;

    const sigId = `scalp-${m.id}-${Math.floor(Date.now() / 120000)}`;
    if (processedSigs.has(sigId)) continue;
    processedSigs.add(sigId);

    if (yes.price > mean * 0.97) continue; // only buy dips
    signals.push({
      marketId: m.id,
      direction: 'buy',
      outcome: 'Yes',
      tokenId: yes.tokenId,
      confidence: Math.min(85, 50 + vol * 200),
      reason: `[SCALP] ${m.question} | vol=${(vol * 100).toFixed(1)}%`,
      currentPrice: yes.price,
    });
  }
  return signals;
}

// ─── Strategy 3: Whale Mirror ─────────────────────────────────────────────────
async function startWhaleMirror(provider) {
  console.log(`[WHALE] Monitoring ${WHALE_WALLET.slice(0, 10)}...`);
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
        console.log(`[WHALE] Trade detected block ${blockNumber}`);
        try {
          const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          if (!decoded) continue;
          const order = decoded.args[0];
          const price = Number(order.takerAmount) / Number(order.makerAmount);
          await recordTrade(
            {
              marketId: '',
              direction: order.side === 0 ? 'buy' : 'sell',
              outcome: order.side === 0 ? 'Yes' : 'No',
              tokenId: order.tokenId.toString(),
              reason: `[WHALE] ${WHALE_WALLET.slice(0, 10)}...`,
              currentPrice: price,
            },
            'whale_mirror'
          );
        } catch {
          /* not a fillOrder */
        }
      }
    } catch (e) {
      console.error('[WHALE] block error:', e?.message);
    }
  });
}

// ─── Main scan loop ───────────────────────────────────────────────────────────
async function scanLoop() {
  setInterval(async () => {
    try {
      await loadBalance();
      const markets = await fetchMarkets();
      if (!markets.length) return;

      scanCount++;
      lastScan = new Date();
      console.log(
        `[SCAN #${scanCount}] ${markets.length} markets | bal: €${balance.toFixed(2)} | size: €${tradeSize().toFixed(2)}`
      );

      const signals = [...latencyArb(markets), ...volScalper(markets)].sort(
        (a, b) => b.confidence - a.confidence
      );

      for (const sig of signals) {
        await recordTrade(sig, sig.reason.startsWith('[SCALP]') ? 'volatility_scalp' : 'latency_arb');
        await new Promise((r) => setTimeout(r, 300));
      }

      if (processedSigs.size > 1000) {
        [...processedSigs].slice(0, 500).forEach((s) => processedSigs.delete(s));
      }
    } catch (e) {
      console.error('[SCAN] error:', e?.message);
    }
  }, 15000);
}

// ─── Express health server ────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({
    status: 'running',
    bot: 'HFT Bot 1',
    mode: PAPER_MODE ? 'PAPER' : 'LIVE',
    balance,
    tradeCount,
    scanCount,
    riskPct: `${RISK_PCT * 100}%`,
    tradeSize: tradeSize(),
    lastScan: lastScan?.toISOString(),
    uptime: process.uptime(),
  })
);

app.get('/trades', (_req, res) => res.json({ trades: recentTrades, count: tradeCount }));
app.get('/', (_req, res) => res.type('text').send('SQI-2050 HFT Bot 1 — GET /health'));

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('SQI-2050 HFT Bot 1 — Railway Worker');
  console.log(`Mode: ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Risk: ${RISK_PCT * 100}%`);
  console.log('Strategies: Whale Mirror + Latency Arb + Vol Scalper');
  console.log('═══════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    process.exit(1);
  }

  await loadBalance();
  console.log(`[BOOT] Balance loaded: €${balance.toFixed(2)} | Trade size: €${tradeSize().toFixed(2)}`);

  // Start whale mirror if private key provided
  if (PRIVATE_KEY) {
    try {
      const rpc = process.env.POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com';
      const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      await startWhaleMirror(provider);
    } catch (e) {
      console.warn('[WHALE] Failed to start:', e?.message);
    }
  } else {
    console.warn('[WHALE] No BOT_PRIVATE_KEY — whale mirror disabled');
  }

  await scanLoop();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTP] Health server on port ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
