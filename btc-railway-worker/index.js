require('dotenv').config();
const { createClient }    = require('@supabase/supabase-js');
const BinanceClient       = require('./binance');
const { generateSignal }  = require('./ta');
const { RiskManager }     = require('./risk');

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
REQUIRED.forEach(k => { if (!process.env[k]) { console.error('Missing: ' + k); process.exit(1); } });

const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BINANCE_KEY    = process.env.BINANCE_API_KEY    || 'PAPER';
const BINANCE_SECRET = process.env.BINANCE_API_SECRET || '';
const BOT_USER_ID    = process.env.BOT_USER_ID || 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
const STRATEGY       = process.env.BOT_STRATEGY || 'scalp';
const PAPER_MODE     = BINANCE_KEY === 'PAPER' || process.env.PAPER_MODE === 'true';
const SCAN_INTERVAL  = parseInt(process.env.SCAN_INTERVAL_MS || '15000');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const exchange = new BinanceClient(BINANCE_KEY, BINANCE_SECRET);
const risk     = new RiskManager();

const MAX_CANDLES = 100;
let priceHistory  = [];
let currentPrice  = 0;
let portfolio     = {
  usd: parseFloat(process.env.START_BALANCE_USD || '10'),
  btc: 0, totalTrades: 0, wins: 0, losses: 0,
};

async function loadPriceHistory() {
  try {
    const closes = await exchange.getCandles('1m', MAX_CANDLES);
    priceHistory  = closes;
    currentPrice  = priceHistory[priceHistory.length - 1];
    console.log('Loaded ' + priceHistory.length + ' candles | Price: $' + currentPrice.toFixed(2));
  } catch (err) { console.error('loadPriceHistory error:', err.message); }
}

async function recordTrade(trade) {
  try {
    await supabase.from('btc_trades').insert({
      user_id: BOT_USER_ID, strategy: STRATEGY,
      side: trade.side, entry_price: trade.entryPrice,
      exit_price: trade.exitPrice || null, btc_amount: trade.amount,
      usd_size: trade.usdSize, pnl: trade.pnl || null,
      pnl_pct: trade.pnlPct || null, exit_reason: trade.exitReason || null,
      paper_mode: PAPER_MODE, gemini_order_id: trade.orderId || null,
      duration_ms: trade.durationMs || null,
      opened_at: new Date(trade.openedAt).toISOString(),
      closed_at: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
    });
  } catch (err) { console.error('recordTrade error:', err.message); }
}

async function saveBotState() {
  try {
    await supabase.from('btc_bot_state').upsert({
      user_id: BOT_USER_ID, strategy: STRATEGY, paper_mode: PAPER_MODE,
      usd_balance: portfolio.usd, btc_balance: portfolio.btc,
      total_trades: portfolio.totalTrades, wins: portfolio.wins, losses: portfolio.losses,
      win_rate: portfolio.totalTrades > 0 ? portfolio.wins / portfolio.totalTrades : 0,
      current_price: currentPrice, daily_pnl: risk.dailyPnL,
      is_halted: risk.halted, has_position: !!risk.openPosition,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (err) { console.error('saveBotState error:', err.message); }
}

async function executeBuy(signal) {
  const usdSize = risk.kellySize(portfolio.usd, signal.confidence);
  if (usdSize < 1) return;
  const position = risk.openTrade('buy', currentPrice, usdSize, signal.confidence);
  const order    = await exchange.placeOrder('BUY', position.amount, currentPrice);
  const fill     = parseFloat(order.fills?.[0]?.price || order.price || currentPrice);
  position.entryPrice = fill;
  position.orderId    = order.orderId;
  portfolio.usd -= usdSize;
  portfolio.btc += position.amount;
  await recordTrade({ ...position, side: 'buy', orderId: order.orderId });
  console.log('BUY ' + position.amount.toFixed(6) + ' BTC @ $' + fill.toFixed(2) + ' | ' + signal.reason);
}

async function executeSell(exitReason) {
  const pos = risk.openPosition;
  if (!pos) return;
  const order = await exchange.placeOrder('SELL', pos.amount, currentPrice);
  const fill  = parseFloat(order.fills?.[0]?.price || order.price || currentPrice);
  const trade = risk.closeTrade(fill, exitReason);
  portfolio.usd += pos.usdSize + trade.pnl;
  portfolio.btc  = Math.max(0, portfolio.btc - pos.amount);
  portfolio.totalTrades++;
  if (trade.pnl >= 0) portfolio.wins++; else portfolio.losses++;
  await recordTrade({ ...trade, orderId: order.orderId, side: 'sell' });
  await saveBotState();
  console.log('SELL @ $' + fill.toFixed(2) + ' | ' + exitReason + ' | PnL: ' + trade.pnl.toFixed(4));
}

async function scan() {
  try {
    const ticker = await exchange.getTicker();
    currentPrice = parseFloat(ticker.last || ticker.price);
    priceHistory.push(currentPrice);
    if (priceHistory.length > MAX_CANDLES) priceHistory.shift();
    risk.resetDailyIfNeeded(portfolio.usd + portfolio.btc * currentPrice);
    if (risk.openPosition) {
      const exit = risk.checkExitConditions(currentPrice);
      if (exit) { await executeSell(exit.reason); return; }
      const unreal = (currentPrice - risk.openPosition.entryPrice) * risk.openPosition.amount;
      console.log('OPEN | $' + currentPrice.toFixed(2) + ' | Unrealized: ' + (unreal>=0?'+':'') + '$' + unreal.toFixed(4));
      return;
    }
    if (risk.halted) { console.log('HALTED today'); return; }
    const signal = generateSignal(priceHistory, STRATEGY);
    if (signal.action === 'HOLD') {
      console.log('HOLD | RSI:' + signal.indicators?.rsi?.toFixed(1) + ' | $' + currentPrice.toFixed(2));
      return;
    }
    console.log('SIGNAL: ' + signal.action + ' | ' + (signal.confidence*100).toFixed(0) + '% | ' + signal.reason);
    if (!risk.canTrade(portfolio.usd)) return;
    if (signal.action === 'BUY') await executeBuy(signal);
    else if (signal.action === 'SELL' && portfolio.btc > 0) await executeSell('SIGNAL');
  } catch (err) { console.error('scan error:', err.message); }
}

function logHealth() {
  const total = portfolio.usd + portfolio.btc * currentPrice;
  const roi   = ((total - parseFloat(process.env.START_BALANCE_USD || '10')) / parseFloat(process.env.START_BALANCE_USD || '10') * 100);
  const wr    = portfolio.totalTrades > 0 ? (portfolio.wins / portfolio.totalTrades * 100).toFixed(0) : '--';
  console.log('HEALTH | $' + total.toFixed(4) + ' | ROI:' + (roi>=0?'+':'') + roi.toFixed(2) + '% | Trades:' + portfolio.totalTrades + ' | WR:' + wr + '% | BTC:$' + currentPrice.toFixed(0) + ' | Mode:' + (PAPER_MODE?'PAPER':'LIVE'));
}

(async () => {
  console.log('SQI BTC SOVEREIGN BOT — BINANCE ENGINE ONLINE');
  console.log('Strategy: ' + STRATEGY.toUpperCase() + ' | Mode: ' + (PAPER_MODE ? 'PAPER' : 'LIVE') + ' | Balance: $' + portfolio.usd.toFixed(2));
  await loadPriceHistory();
  setInterval(loadPriceHistory, 5 * 60 * 1000);
  setInterval(scan, SCAN_INTERVAL);
  await scan();
  setInterval(logHealth, 10 * 60 * 1000);
  logHealth();
})();
