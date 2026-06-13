/**
 * SQI DELTA-ARB BOT v5.0 — Hetzner 24/7
 * 12 pairs | 0.05% threshold | 1m+3m windows | 2% dynamic sizing
 */

const https  = require('https');
const http   = require('http');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── ENV ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BINANCE_KEY   = process.env.BINANCE_API_KEY    || '';
const BINANCE_SEC   = process.env.BINANCE_API_SECRET || '';
const MODE          = (process.env.BOT_MODE || 'PAPER').toUpperCase();
const PORT          = parseInt(process.env.PORT || '8081');
const RISK_PCT      = parseFloat(process.env.RISK_PCT || '0.02');      // 2% per trade
const DELTA_THRESH  = parseFloat(process.env.DELTA_THRESHOLD || '0.0005'); // 0.05%
const SCAN_MS       = parseInt(process.env.SCAN_INTERVAL_MS || '5000');    // 5s scan

// ── 12 PAIRS ─────────────────────────────────────────────────────────────────
const SYMBOLS = [
  'BTCUSDC','ETHUSDC','SOLUSDC','BNBUSDC','XRPUSDC',
  'DOGEUSDC','ADAUSDC','AVAXUSDC','DOTUSDC','LINKUSDC',
  'UNIUSDC','MATICUSDC'
];
const ASSETS = {};
SYMBOLS.forEach(s => { ASSETS[s] = s.replace('USDC',''); });

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ────────────────────────────────────────────────────────────────────
const prices     = {};   // { BTCUSDC: [{price, ts}] }
const openTrades = {};   // { BTCUSDC: {id, entry, direction, ts, size} }
const lastSignal = {};   // debounce per symbol+direction
let   tradeCount = 0;
let   wsConn     = null;
const startTime  = Date.now();

SYMBOLS.forEach(s => { prices[s] = []; });

// ── BINANCE WEBSOCKET ────────────────────────────────────────────────────────
function connectWS() {
  const streams = SYMBOLS.map(s => `${s.toLowerCase()}@aggTrade`).join('/');
  const url     = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  const WebSocket = require('ws');
  wsConn = new WebSocket(url);

  wsConn.on('open', () => console.log(`[SQI] WS connected — ${SYMBOLS.length} pairs`));
  wsConn.on('error', e  => console.error('[SQI] WS error:', e.message));
  wsConn.on('close', () => { console.log('[SQI] WS closed — reconnecting 3s'); setTimeout(connectWS, 3000); });

  wsConn.on('message', raw => {
    try {
      const data = JSON.parse(raw).data || JSON.parse(raw);
      if (!data.s || !data.p) return;
      const sym   = data.s;
      const price = parseFloat(data.p);
      const ts    = Date.now();
      if (!prices[sym]) return;
      prices[sym].push({ price, ts });
      // Keep 5 minutes of ticks
      const cutoff = ts - 5 * 60 * 1000;
      prices[sym] = prices[sym].filter(p => p.ts >= cutoff);
    } catch(e) {}
  });
}

// ── DELTA CALCULATION ────────────────────────────────────────────────────────
function getDelta(sym, windowMs) {
  const arr = prices[sym];
  if (!arr || arr.length < 2) return null;
  const now  = Date.now();
  const past = arr.find(p => p.ts >= now - windowMs);
  if (!past) return null;
  const current = arr[arr.length - 1].price;
  return (current - past.price) / past.price;
}

// ── LIVE USDC BALANCE ────────────────────────────────────────────────────────
async function getLiveBalance() {
  if (!BINANCE_KEY || !BINANCE_SEC) return 100; // paper fallback
  try {
    const ts  = Date.now();
    const qs  = `timestamp=${ts}&recvWindow=5000`;
    const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
    const data = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.binance.com/api/v3/account?${qs}&signature=${sig}`,
        { headers: { 'X-MBX-APIKEY': BINANCE_KEY } },
        res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>resolve(JSON.parse(b))); }
      );
      req.on('error', reject); req.end();
    });
    const usdc = data.balances?.find(b => b.asset === 'USDC');
    return usdc ? parseFloat(usdc.free) : 0;
  } catch(e) {
    console.error('[SQI] Balance error:', e.message);
    return 0;
  }
}

// ── SIGNAL SCANNER ───────────────────────────────────────────────────────────
async function scan() {
  for (const sym of SYMBOLS) {
    const asset = ASSETS[sym];
    const d1m   = getDelta(sym, 1 * 60 * 1000);   // 1m window
    const d3m   = getDelta(sym, 3 * 60 * 1000);   // 3m window

    if (d1m === null && d3m === null) continue;

    const best      = [d1m, d3m].filter(x => x !== null).reduce((a,b) => Math.abs(a) > Math.abs(b) ? a : b);
    const absDelta  = Math.abs(best);
    const direction = best > 0 ? 'UP' : 'DOWN';
    const debounce  = `${sym}_${direction}`;
    const now       = Date.now();

    // Debounce: same symbol+direction can only fire every 90s
    if (lastSignal[debounce] && now - lastSignal[debounce] < 90 * 1000) continue;

    // Close opposite open trade
    if (openTrades[sym] && openTrades[sym].direction !== direction && absDelta >= DELTA_THRESH) {
      await closeTrade(sym, asset);
    }

    // Open new trade
    if (!openTrades[sym] && absDelta >= DELTA_THRESH) {
      const deltaStr = `${best >= 0 ? '+' : ''}${(best * 100).toFixed(4)}%`;
      lastSignal[debounce] = now;
      await openTrade(sym, asset, direction, deltaStr);
    }
  }
}

// ── OPEN TRADE ───────────────────────────────────────────────────────────────
async function openTrade(sym, asset, signal, delta) {
  const currentPrice = prices[sym]?.[prices[sym].length - 1]?.price;
  if (!currentPrice) return;

  const balance   = await getLiveBalance();
  const tradeSize = Math.max(0.10, Math.round(balance * RISK_PCT * 100) / 100);

  console.log(`[SQI] ⚡ SIGNAL ${asset} ${signal} | delta=${delta} | size=$${tradeSize.toFixed(2)} | balance=$${balance.toFixed(2)}`);

  let orderId = null;
  if (MODE === 'LIVE' && BINANCE_KEY && BINANCE_SEC) {
    try {
      orderId = await binanceOrder(sym, signal === 'UP' ? 'BUY' : 'SELL', tradeSize);
      console.log(`[SQI] ✅ Binance order placed: ${orderId}`);
    } catch(e) {
      console.error('[SQI] ❌ Order failed:', e.message);
      return;
    }
  }

  const { data, error } = await supabase.from('bot_trades').insert({
    asset, signal, delta,
    size_usd:    tradeSize,
    entry_price: currentPrice,
    status:      'open',
    pnl_usdc:    0,
    mode:        MODE,
    order_id:    orderId,
  }).select('id').single();

  if (error) { console.error('[SQI] DB error:', error.message); return; }

  openTrades[sym] = { id: data.id, entry: currentPrice, direction: signal, ts: now, size: tradeSize };
  tradeCount++;
}

// ── CLOSE TRADE ──────────────────────────────────────────────────────────────
async function closeTrade(sym, asset) {
  const trade = openTrades[sym];
  if (!trade) return;
  const currentPrice = prices[sym]?.[prices[sym].length - 1]?.price;
  if (!currentPrice) return;

  const pnl    = trade.direction === 'UP'
    ? ((currentPrice - trade.entry) / trade.entry) * trade.size
    : ((trade.entry - currentPrice) / trade.entry) * trade.size;
  const status = pnl >= 0 ? 'won' : 'lost';

  await supabase.from('bot_trades').update({
    status,
    pnl_usdc: Math.round(pnl * 10000) / 10000,
  }).eq('id', trade.id);

  console.log(`[SQI] 🔒 CLOSE ${asset} | ${status.toUpperCase()} | PnL=${pnl >= 0 ? '+' : ''}$${pnl.toFixed(4)}`);
  delete openTrades[sym];
}

// ── AUTO-CLOSE stale > 15min ──────────────────────────────────────────────────
async function autoClose() {
  const now = Date.now();
  for (const sym of SYMBOLS) {
    if (openTrades[sym] && now - openTrades[sym].ts > 15 * 60 * 1000) {
      console.log(`[SQI] ⏰ Auto-closing stale ${ASSETS[sym]}`);
      await closeTrade(sym, ASSETS[sym]);
    }
  }
}

// ── BINANCE ORDER ─────────────────────────────────────────────────────────────
async function binanceOrder(symbol, side, quoteQty) {
  const ts  = Date.now();
  const qs  = `symbol=${symbol}&side=${side}&type=MARKET&quoteOrderQty=${quoteQty}&timestamp=${ts}&recvWindow=5000`;
  const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.binance.com/api/v3/order?${qs}&signature=${sig}`,
      { method: 'POST', headers: { 'X-MBX-APIKEY': BINANCE_KEY } },
      res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>{
        const j = JSON.parse(b);
        if (j.code) reject(new Error(j.msg)); else resolve(j.orderId?.toString());
      }); }
    );
    req.on('error', reject); req.end();
  });
}

// ── HEALTH SERVER ─────────────────────────────────────────────────────────────
http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status:    'running',
      bot:       'SQI Delta-Arb v5.0',
      mode:      MODE,
      pairs:     SYMBOLS.length,
      threshold: `${(DELTA_THRESH * 100).toFixed(2)}%`,
      windows:   '1m + 3m',
      risk:      '2% per trade',
      trades:    tradeCount,
      open:      Object.keys(openTrades).length,
      uptime:    `${Math.floor(uptime/60)}m ${uptime%60}s`,
      ticks:     Object.fromEntries(SYMBOLS.map(s => [ASSETS[s], prices[s]?.length || 0])),
      ts:        new Date().toISOString(),
    }));
  } else { res.writeHead(404); res.end('nf'); }
}).listen(PORT, () => console.log(`[SQI] Health :${PORT}`));

// ── BOOT ──────────────────────────────────────────────────────────────────────
console.log('');
console.log('⚡ SQI DELTA-ARB BOT v5.0 — ONLINE');
console.log(`📊 Pairs: ${SYMBOLS.length} | Threshold: ${(DELTA_THRESH*100).toFixed(2)}% | Windows: 1m+3m | Risk: 2%`);
console.log(`🔑 Mode: ${MODE} | Binance: ${BINANCE_KEY ? 'configured' : 'MISSING'}`);
console.log('─────────────────────────────────────────────────────');

try { require('ws'); } catch(e) { console.error('Missing: ws — run npm install'); process.exit(1); }

connectWS();
setInterval(scan, SCAN_MS);
setInterval(autoClose, 60 * 1000);
setInterval(() => {
  const open   = Object.keys(openTrades).map(s => ASSETS[s]).join(',') || 'none';
  const ticks  = SYMBOLS.map(s => `${ASSETS[s]}:${prices[s]?.length||0}`).join(' ');
  console.log(`[SQI] 💚 ${new Date().toISOString()} | trades:${tradeCount} | open:[${open}] | ${ticks}`);
}, 5 * 60 * 1000);
