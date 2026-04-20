/**
 * SQI SOVEREIGN BOT — Railway 24/7 Worker
 * Polls BTC/USD from Gemini every 15s
 * Calculates RSI + MACD + Bollinger Bands
 * Fires BUY/SELL signals → writes to Supabase via Edge Function
 */

const GEMINI_URL = 'https://api.gemini.com/v1/pubticker/btcusd';
const CANDLES_URL = 'https://api.gemini.com/v2/candles/btcusd/1m';
const SUPABASE_URL = process.env.SUPABASE_URL;
const BOT_USER_ID = process.env.BOT_USER_ID;
const BOT_WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/record-bot-trade`;

// Strategy params
const RSI_PERIOD = 14;
const RSI_OVERSOLD = 32;
const RSI_OVERBOUGHT = 68;
const BB_PERIOD = 20;
const BB_STD = 2;
const EMA_FAST = 9;
const EMA_SLOW = 21;
const MACD_SIGNAL = 9;
const POSITION_SIZE_PCT = 0.92;
const SEED_BALANCE = 10;
const SCAN_INTERVAL_MS = 15000;

// State
let priceHistory = [];
let currentPosition = null; // { entryPrice, sizeUsd, tradeId }
let portfolioValue = SEED_BALANCE;
let sessionId = null;
let tradeCount = 0;
let wins = 0;
let losses = 0;

// ── MATHS ──────────────────────────────────────────────────

function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRSI(prices) {
  if (prices.length < RSI_PERIOD + 1) return 50;
  const changes = prices.slice(-RSI_PERIOD - 1).map((p, i, arr) =>
    i === 0 ? 0 : p - arr[i - 1]
  ).slice(1);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses_ = changes.map(c => c < 0 ? Math.abs(c) : 0);
  const avgGain = gains.reduce((a, b) => a + b, 0) / RSI_PERIOD;
  const avgLoss = losses_.reduce((a, b) => a + b, 0) / RSI_PERIOD;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calcBollingerBands(prices) {
  const slice = prices.slice(-BB_PERIOD);
  if (slice.length < BB_PERIOD) return { upper: 0, mid: 0, lower: 0 };
  const mid = slice.reduce((a, b) => a + b, 0) / BB_PERIOD;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / BB_PERIOD;
  const std = Math.sqrt(variance);
  return { upper: mid + BB_STD * std, mid, lower: mid - BB_STD * std };
}

function calcMACD(prices) {
  if (prices.length < EMA_SLOW + MACD_SIGNAL) return { macd: 0, signal: 0, hist: 0 };
  const fast = calcEMA(prices, EMA_FAST);
  const slow = calcEMA(prices, EMA_SLOW);
  const macd = fast - slow;
  // Simplified signal line
  const macdValues = prices.slice(-MACD_SIGNAL - 5).map((_, i, arr) => {
    const sub = arr.slice(0, i + 1);
    return sub.length >= EMA_SLOW ? calcEMA(sub, EMA_FAST) - calcEMA(sub, EMA_SLOW) : 0;
  }).slice(-MACD_SIGNAL);
  const signal = macdValues.reduce((a, b) => a + b, 0) / MACD_SIGNAL;
  return { macd, signal, hist: macd - signal };
}

// ── SIGNAL LOGIC ──────────────────────────────────────────

function generateSignal(price) {
  const prices = priceHistory.map(p => p.close);
  if (prices.length < BB_PERIOD + 5) return 'SCANNING';

  const rsi = calcRSI(prices);
  const bb = calcBollingerBands(prices);
  const macd = calcMACD(prices);

  // BUY: RSI oversold + price at/below BB lower + MACD turning up
  if (rsi < RSI_OVERSOLD && price <= bb.lower * 1.002 && macd.hist > macd.signal - 5) {
    return 'BUY';
  }
  // SELL: RSI overbought + price at/above BB upper + MACD turning down
  if (rsi > RSI_OVERBOUGHT && price >= bb.upper * 0.998 && macd.hist < 0) {
    return 'SELL';
  }
  return 'HOLD';
}

// ── SUPABASE EDGE FUNCTION CALLER ────────────────────────

async function recordTrade(payload) {
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_WEBHOOK_SECRET,
      },
      body: JSON.stringify({ ...payload, user_id: BOT_USER_ID }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log(`✅ Trade recorded: ${payload.action} @ $${payload.entry_price || payload.exit_price} | id: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error('❌ Edge function error:', err.message);
    return null;
  }
}

// ── PRICE FETCH ──────────────────────────────────────────

async function fetchPrice() {
  const res = await fetch(GEMINI_URL);
  const data = await res.json();
  return parseFloat(data.last);
}

async function fetchCandles() {
  try {
    const res = await fetch(CANDLES_URL);
    const data = await res.json();
    // Gemini returns [timestamp, open, high, low, close, volume]
    return data.slice(0, 100).reverse().map(c => ({
      ts: c[0], open: c[1], high: c[2], low: c[3], close: c[4], vol: c[5]
    }));
  } catch {
    return [];
  }
}

// ── MAIN LOOP ────────────────────────────────────────────

async function tick() {
  try {
    const price = await fetchPrice();

    // Refresh candles every 5 ticks (~75s), or on first run
    if (priceHistory.length === 0 || Date.now() % (SCAN_INTERVAL_MS * 5) < SCAN_INTERVAL_MS) {
      const candles = await fetchCandles();
      if (candles.length > 0) priceHistory = candles;
    }

    // Add latest price as synthetic candle if no candle yet
    if (priceHistory.length > 0) {
      priceHistory[priceHistory.length - 1].close = price;
    }

    const signal = generateSignal(price);
    const rsi = priceHistory.length >= RSI_PERIOD + 1
      ? calcRSI(priceHistory.map(p => p.close)).toFixed(1)
      : '—';

    console.log(`[${new Date().toISOString()}] BTC: $${price.toFixed(0)} | RSI: ${rsi} | Signal: ${signal} | Portfolio: $${portfolioValue.toFixed(2)} | Position: ${currentPosition ? 'OPEN' : 'NONE'}`);

    // OPEN position on BUY signal
    if (signal === 'BUY' && !currentPosition) {
      const sizeUsd = portfolioValue * POSITION_SIZE_PCT;
      console.log(`🟢 BUY signal fired @ $${price} | Size: $${sizeUsd.toFixed(2)}`);
      const tradeId = await recordTrade({
        strategy: 'micro-scalper',
        action: 'BUY',
        entry_price: price,
        size_usd: sizeUsd,
        status: 'open',
        seed_balance: SEED_BALANCE,
      });
      if (tradeId) {
        currentPosition = { entryPrice: price, sizeUsd, tradeId };
        tradeCount++;
      }
    }

    // CLOSE position on SELL signal
    else if (signal === 'SELL' && currentPosition) {
      const { entryPrice, sizeUsd, tradeId } = currentPosition;
      const pnlPct = ((price - entryPrice) / entryPrice) * 100;
      const pnlUsd = sizeUsd * (pnlPct / 100);
      portfolioValue += pnlUsd;
      pnlUsd >= 0 ? wins++ : losses++;

      console.log(`🔴 SELL signal fired @ $${price} | PnL: ${pnlPct.toFixed(2)}% ($${pnlUsd.toFixed(2)}) | Portfolio: $${portfolioValue.toFixed(2)}`);

      await recordTrade({
        strategy: 'micro-scalper',
        action: 'SELL',
        entry_price: entryPrice,
        exit_price: price,
        size_usd: sizeUsd,
        pnl_usd: pnlUsd,
        pnl_pct: pnlPct,
        status: 'closed',
        seed_balance: SEED_BALANCE,
      });
      currentPosition = null;
    }

  } catch (err) {
    console.error('⚠️ Tick error:', err.message);
  }
}

// ── STARTUP ──────────────────────────────────────────────

async function start() {
  console.log('');
  console.log('⚡ SQI SOVEREIGN BOT — ONLINE');
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  console.log(`👤 User: ${BOT_USER_ID}`);
  console.log(`🔑 Secret: ${BOT_WEBHOOK_SECRET ? '✅ set' : '❌ MISSING'}`);
  console.log(`⏱  Scan interval: ${SCAN_INTERVAL_MS / 1000}s`);
  console.log('─────────────────────────────────────────────');

  if (!SUPABASE_URL || !BOT_USER_ID || !BOT_WEBHOOK_SECRET) {
    console.error('❌ Missing env vars. Set SUPABASE_URL, BOT_USER_ID, BOT_WEBHOOK_SECRET');
    process.exit(1);
  }

  // Initial candle load
  console.log('🔄 Loading BTC candles...');
  priceHistory = await fetchCandles();
  console.log(`✅ ${priceHistory.length} candles loaded`);

  // First tick immediately
  await tick();

  // Then every 15 seconds
  setInterval(tick, SCAN_INTERVAL_MS);
}

start();
