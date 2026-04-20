/**
 * SQI Sovereign Bot — Railway worker
 * Polls Gemini BTC/USD every 15s, same TA as the web UI, persists paper trades (service role).
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SQI_BOT_USER_ID (uuid)
 * Optional: SQI_BOT_MODE (scalp|trend|compound|arb, default scalp)
 */
import { createClient } from '@supabase/supabase-js';

const START_BALANCE = 10;
const TICK_MS = 15_000;

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const botUserId = process.env.SQI_BOT_USER_ID;
const mode = process.env.SQI_BOT_MODE || 'scalp';

if (!url || !serviceKey || !botUserId) {
  console.error('[sqi-bot-worker] Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or SQI_BOT_USER_ID');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ema(arr, n) {
  if (arr.length < n) return arr[arr.length - 1] || 0;
  const k = 2 / (n + 1);
  let e = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function rsi(arr, n = 14) {
  if (arr.length < n + 1) return 50;
  let g = 0;
  let l = 0;
  for (let i = arr.length - n; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  return 100 - 100 / (1 + g / (l || 1e-9));
}

function bollinger(arr, n = 20) {
  if (arr.length < n) {
    const p = arr[arr.length - 1] || 0;
    return { upper: p * 1.02, mid: p, lower: p * 0.98 };
  }
  const sl = arr.slice(-n);
  const m = sl.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / n);
  return { upper: m + 2 * sd, mid: m, lower: m - 2 * sd };
}

function macdCalc(arr) {
  if (arr.length < 26) return { val: 0, sig: 0, bull: true };
  const fast = ema(arr, 12);
  const slow = ema(arr, 26);
  const val = fast - slow;
  return { val, sig: val * 0.9, bull: val > val * 0.9 };
}

function getSignal(prices, m) {
  if (prices.length < 30) return 'SCANNING';
  const r = rsi(prices);
  const { bull } = macdCalc(prices);
  const { upper, lower } = bollinger(prices);
  const p = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const mom = ((p - prev) / prev) * 100;

  if (m === 'scalp') {
    if (r < 32 && p <= lower * 1.002 && mom > -0.1) return 'BUY';
    if (r > 68 && p >= upper * 0.998 && mom < 0.1) return 'SELL';
  }
  if (m === 'trend') {
    const e9 = ema(prices, 9);
    const e21 = ema(prices, 21);
    if (e9 > e21 && macdCalc(prices).bull && r < 72) return 'BUY';
    if (e9 < e21 && !macdCalc(prices).bull && r > 28) return 'SELL';
  }
  if (m === 'compound') {
    if (r < 38 && bull && p < lower * 1.005) return 'BUY';
    if (r > 62 && !bull && p > upper * 0.995) return 'SELL';
  }
  if (m === 'arb') {
    const seed = Math.sin(Date.now() / 60000) * 0.5 + 0.5;
    if (seed > 0.82) return 'BUY';
    if (seed < 0.18) return 'SELL';
  }
  return 'HOLD';
}

async function fetchPubticker() {
  const r = await fetch('https://api.gemini.com/v1/pubticker/btcusd');
  if (!r.ok) throw new Error(`pubticker ${r.status}`);
  const d = await r.json();
  return parseFloat(d.last);
}

async function seedPricesFromCandles() {
  const r = await fetch('https://api.gemini.com/v2/candles/btcusd/1m');
  if (!r.ok) throw new Error(`candles ${r.status}`);
  const d = await r.json();
  const sorted = [...d].sort((a, b) => a[0] - b[0]).slice(-120);
  return sorted.map((c) => c[4]);
}

let prices = [];
let bal = START_BALANCE;
let held = 0;
let entry = 0;
let openTradeId = null;
let sessionId = null;
let stats = { wins: 0, losses: 0, total: 0 };

async function startSession() {
  const { data, error } = await supabase
    .from('bot_sessions')
    .insert({ user_id: botUserId, seed_balance: START_BALANCE })
    .select('id')
    .single();
  if (error) {
    console.error('[sqi-bot-worker] session insert', error);
    return null;
  }
  return data?.id ?? null;
}

async function endSession() {
  if (!sessionId) return;
  const last = prices.length ? prices[prices.length - 1] : 0;
  const equity = bal + held * last;
  const { error } = await supabase
    .from('bot_sessions')
    .update({
      ended_at: new Date().toISOString(),
      trades_count: stats.total,
      wins: stats.wins,
      losses: stats.losses,
      final_portfolio_value: equity,
    })
    .eq('id', sessionId);
  if (error) console.error('[sqi-bot-worker] session update', error);
  sessionId = null;
}

async function persistBuy(price, nowIso) {
  const portfolioValue = bal;
  const amount = portfolioValue * 0.92;
  const fee = amount * 0.001;
  const btcBought = amount / price;
  const { data, error } = await supabase
    .from('bot_trades')
    .insert({
      user_id: botUserId,
      session_id: sessionId,
      action: 'BUY',
      entry_price: price,
      size_usd: amount,
      status: 'open',
      strategy: mode,
      seed_balance: START_BALANCE,
      btc_amount: btcBought,
      fee_usd: fee,
    })
    .select('id')
    .single();
  if (error) {
    console.error('[sqi-bot-worker] BUY insert', error);
    return;
  }
  openTradeId = data?.id ?? null;
  bal -= amount + fee;
  held = btcBought;
  entry = price;
  stats.total++;
  console.log('[sqi-bot-worker] BUY', { price, amount, id: openTradeId, at: nowIso });
}

async function persistSell(price, nowIso) {
  if (!openTradeId) return;
  const value = held * price;
  const fee = value * 0.001;
  const pnl = value - held * entry;
  const notional = held * entry;
  const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;
  const { error } = await supabase
    .from('bot_trades')
    .update({
      exit_price: price,
      pnl_usd: pnl,
      pnl_pct: pnlPct,
      status: 'closed',
      closed_at: nowIso,
    })
    .eq('id', openTradeId);
  if (error) {
    console.error('[sqi-bot-worker] SELL update', error);
    return;
  }
  if (pnl > 0) stats.wins++;
  else stats.losses++;
  stats.total++;
  bal += value - fee;
  held = 0;
  entry = 0;
  openTradeId = null;
  console.log('[sqi-bot-worker] SELL', { price, pnl, at: nowIso });
}

async function tick() {
  const nowIso = new Date().toISOString();
  let price;
  try {
    price = await fetchPubticker();
  } catch (e) {
    console.error('[sqi-bot-worker] price fetch', e.message);
    return;
  }
  prices = [...prices.slice(-400), price];
  const sig = getSignal(prices, mode);

  if (sig === 'BUY' && held === 0 && bal >= 0.5) {
    await persistBuy(price, nowIso);
  } else if (sig === 'SELL' && held > 0) {
    await persistSell(price, nowIso);
  }
}

async function main() {
  console.log('[sqi-bot-worker] starting', { mode, botUserId: botUserId.slice(0, 8) + '…' });
  try {
    prices = await seedPricesFromCandles();
    console.log('[sqi-bot-worker] seeded', prices.length, 'closes');
  } catch (e) {
    console.error('[sqi-bot-worker] candle seed failed', e.message);
    prices = [];
  }
  sessionId = await startSession();
  if (!sessionId) {
    console.error('[sqi-bot-worker] no session; exiting');
    process.exit(1);
  }
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error('[sqi-bot-worker] tick', e));
  }, TICK_MS);
}

async function shutdown() {
  console.log('[sqi-bot-worker] shutdown');
  await endSession();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((e) => {
  console.error('[sqi-bot-worker] fatal', e);
  process.exit(1);
});
