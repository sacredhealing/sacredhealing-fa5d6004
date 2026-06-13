/**
 * SQI DELTA-ARB BOT — Hetzner 24/7 Engine
 * Strategy: Binance WebSocket oracle-lag detection
 * BTC/ETH/SOL — 5m + 15m delta threshold 0.12%+
 * Writes to Supabase bot_trades table (mode: PAPER | LIVE)
 */

const https = require('https');
const http  = require('http');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── ENV ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BINANCE_KEY   = process.env.BINANCE_API_KEY    || '';
const BINANCE_SEC   = process.env.BINANCE_API_SECRET || '';
const MODE          = (process.env.BOT_MODE || 'PAPER').toUpperCase();
const PORT          = parseInt(process.env.PORT || '8081');
const DELTA_THRESH  = parseFloat(process.env.DELTA_THRESHOLD || '0.0012'); // 0.12%
const SIZE_USD      = parseFloat(process.env.TRADE_SIZE_USD || '10');
const SCAN_MS       = parseInt(process.env.SCAN_INTERVAL_MS || '15000');

const SYMBOLS = ['BTCUSDC', 'ETHUSDC', 'SOLUSDC'];
const ASSETS  = { BTCUSDC: 'BTC', ETHUSDC: 'ETH', SOLUSDC: 'SOL' };

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ────────────────────────────────────────────────────────────────────
const prices   = {}; // { BTCUSDT: [{ price, ts }] }
let   tradeCount  = 0;
let   openTrades  = {}; // { BTCUSDT: { id, entry, ts } }
let   lastSignal  = {}; // debounce
const startTime   = Date.now();

SYMBOLS.forEach(s => { prices[s] = []; });

// ── BINANCE PUBLIC WS ────────────────────────────────────────────────────────
function connectBinanceWS() {
  const streams = SYMBOLS.map(s => `${s.toLowerCase()}@aggTrade`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  const ws = new (require('ws'))(url);

  ws.on('open', () => console.log('[SQI] Binance WebSocket CONNECTED'));
  ws.on('error', e => console.error('[SQI] WS error:', e.message));
  ws.on('close', () => {
    console.log('[SQI] WS closed — reconnecting in 5s');
    setTimeout(connectBinanceWS, 5000);
  });

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      const data = msg.data || msg;
      if (!data.s || !data.p) return;
      const sym   = data.s;
      const price = parseFloat(data.p);
      const ts    = Date.now();

      if (!prices[sym]) return;
      prices[sym].push({ price, ts });
      // Keep last 15 min of ticks (~900 at 1/sec)
      const cutoff = ts - 15 * 60 * 1000;
      prices[sym] = prices[sym].filter(p => p.ts >= cutoff);
    } catch(e) {}
  });
}

// ── DELTA CALC ───────────────────────────────────────────────────────────────
function getDelta(sym, windowMs) {
  const arr = prices[sym];
  if (!arr || arr.length < 2) return null;
  const now  = Date.now();
  const past = arr.find(p => p.ts >= now - windowMs);
  if (!past) return null;
  const current = arr[arr.length - 1].price;
  return (current - past.price) / past.price; // signed %
}

// ── SIGNAL ENGINE ────────────────────────────────────────────────────────────
async function scanAndTrade() {
  for (const sym of SYMBOLS) {
    const asset = ASSETS[sym];
    const d5m   = getDelta(sym, 5 * 60 * 1000);
    const d15m  = getDelta(sym, 15 * 60 * 1000);

    if (d5m === null || d15m === null) continue;

    const avgDelta  = (Math.abs(d5m) + Math.abs(d15m)) / 2;
    const direction = d5m > 0 ? 'UP' : 'DOWN';
    const debounceKey = `${sym}_${direction}`;
    const now = Date.now();

    // Skip if signal fired in last 3 min for same direction
    if (lastSignal[debounceKey] && now - lastSignal[debounceKey] < 3 * 60 * 1000) continue;

    // Close opposite open trade
    if (openTrades[sym] && openTrades[sym].direction !== direction && avgDelta >= DELTA_THRESH) {
      await closeTrade(sym, asset, direction);
    }

    // Fire new signal if threshold hit and no open trade
    if (!openTrades[sym] && avgDelta >= DELTA_THRESH) {
      const deltaStr = `${d5m >= 0 ? '+' : ''}${(d5m * 100).toFixed(4)}%`;
      lastSignal[debounceKey] = now;
      await openTrade(sym, asset, direction, deltaStr, avgDelta);
    }
  }
}

// ── TRADE EXECUTION ──────────────────────────────────────────────────────────
async function openTrade(sym, asset, signal, delta, deltaRaw) {
  const currentPrice = prices[sym]?.[prices[sym].length - 1]?.price;
  if (!currentPrice) return;

  let orderId = null;

  if (MODE === 'LIVE' && BINANCE_KEY && BINANCE_SEC) {
    try {
      orderId = await binanceOrder(sym, signal === 'UP' ? 'BUY' : 'SELL', SIZE_USD);
    } catch(e) {
      console.error('[SQI] Binance order failed:', e.message);
      return;
    }
  }

  const { data, error } = await supabase.from('bot_trades').insert({
    asset,
    signal,
    delta,
    size_usd: SIZE_USD,
    entry_price: currentPrice,
    status: 'open',
    pnl_usdc: 0,
    mode: MODE,
    order_id: orderId,
  }).select('id').single();

  if (error) { console.error('[SQI] Insert error:', error.message); return; }

  openTrades[sym] = { id: data.id, entry: currentPrice, direction: signal, ts: Date.now() };
  tradeCount++;
  console.log(`[SQI] ⚡ OPEN ${asset} ${signal} | delta=${delta} | $${currentPrice.toFixed(2)} | mode=${MODE} | id=${data.id}`);
}

async function closeTrade(sym, asset, newDirection) {
  const trade = openTrades[sym];
  if (!trade) return;
  const currentPrice = prices[sym]?.[prices[sym].length - 1]?.price;
  if (!currentPrice) return;

  const pnl = trade.direction === 'UP'
    ? ((currentPrice - trade.entry) / trade.entry) * SIZE_USD
    : ((trade.entry - currentPrice) / trade.entry) * SIZE_USD;

  const status = pnl >= 0 ? 'won' : 'lost';

  await supabase.from('bot_trades').update({
    status,
    pnl_usdc: Math.round(pnl * 10000) / 10000,
  }).eq('id', trade.id);

  console.log(`[SQI] 🔒 CLOSE ${asset} | ${status.toUpperCase()} | PnL=${pnl >= 0 ? '+' : ''}$${pnl.toFixed(4)} | exit=$${currentPrice.toFixed(2)}`);
  delete openTrades[sym];
}

// ── AUTO-CLOSE stale trades > 30min ─────────────────────────────────────────
async function autoCloseStaleTrades() {
  const now = Date.now();
  for (const sym of SYMBOLS) {
    if (openTrades[sym] && now - openTrades[sym].ts > 30 * 60 * 1000) {
      const asset = ASSETS[sym];
      console.log(`[SQI] ⏰ Auto-closing stale ${asset} trade`);
      await closeTrade(sym, asset, null);
    }
  }
}

// ── BINANCE SIGNED ORDER ─────────────────────────────────────────────────────
async function binanceOrder(symbol, side, quoteOrderQty) {
  const ts  = Date.now();
  const qs  = `symbol=${symbol}&side=${side}&type=MARKET&quoteOrderQty=${quoteOrderQty}&timestamp=${ts}&recvWindow=5000`;
  const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
  const url = `https://api.binance.com/api/v3/order?${qs}&signature=${sig}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { 'X-MBX-APIKEY': BINANCE_KEY } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j.code) reject(new Error(j.msg || body));
          else resolve(j.orderId?.toString());
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── HEALTH SERVER ────────────────────────────────────────────────────────────
http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
    const status = {
      status:   'running',
      bot:      'SQI Delta-Arb Bot',
      mode:     MODE,
      symbols:  SYMBOLS.map(s => ({
        asset:   ASSETS[s],
        ticks:   prices[s]?.length || 0,
        lastPrice: prices[s]?.[prices[s].length - 1]?.price?.toFixed(2) || '—',
        open:    !!openTrades[s],
      })),
      trades:      tradeCount,
      threshold:   `${(DELTA_THRESH * 100).toFixed(2)}%`,
      uptime:      `${Math.floor(uptimeSec/60)}m ${uptimeSec%60}s`,
      binance:     BINANCE_KEY ? 'configured' : 'not set',
      ts:          new Date().toISOString(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  } else {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, () => console.log(`[SQI] Health server on :${PORT}`));

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('');
console.log('⚡ SQI DELTA-ARB BOT — HETZNER ENGINE ONLINE');
console.log(`📡 Mode: ${MODE} | Threshold: ${(DELTA_THRESH*100).toFixed(2)}% | Size: $${SIZE_USD}`);
console.log(`🔑 Binance: ${BINANCE_KEY ? '✅ configured' : '❌ MISSING — PAPER only'}`);
console.log(`🗄  Supabase: ${SUPABASE_URL}`);
console.log('──────────────────────────────────────────────');

// ws dependency check
try {
  require('ws');
} catch(e) {
  console.error('[SQI] ws package missing — run: npm install ws');
  process.exit(1);
}

connectBinanceWS();
setInterval(scanAndTrade, SCAN_MS);
setInterval(autoCloseStaleTrades, 5 * 60 * 1000);

// Health log every 10min
setInterval(() => {
  const ticks = SYMBOLS.map(s => `${ASSETS[s]}:${prices[s]?.length||0}`).join(' | ');
  console.log(`[SQI] 💚 alive | ${new Date().toISOString()} | ticks: ${ticks} | trades: ${tradeCount} | mode: ${MODE}`);
}, 10 * 60 * 1000);
