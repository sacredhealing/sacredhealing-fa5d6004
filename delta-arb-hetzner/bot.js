/**
 * SQI DELTA-ARB BOT v5.1 — Hetzner 24/7
 * 12 pairs | 0.05% threshold | 1m+3m windows | 2% dynamic sizing
 */
'use strict';
const https  = require('https');
const http   = require('http');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const NodeWS = require('ws'); // Node 20 lacks native WebSocket; supabase-js realtime client needs one even though we never use realtime features

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BINANCE_KEY   = process.env.BINANCE_API_KEY    || '';
const BINANCE_SEC   = process.env.BINANCE_API_SECRET || '';
const MODE          = (process.env.BOT_MODE || 'PAPER').toUpperCase();
const PORT          = parseInt(process.env.PORT || '8081');
const RISK_PCT      = parseFloat(process.env.RISK_PCT || '0.02');
const DELTA_THRESH  = parseFloat(process.env.DELTA_THRESHOLD || '0.0005');
const SCAN_MS       = parseInt(process.env.SCAN_INTERVAL_MS || '5000');

const SYMBOLS = ['BTCUSDC','ETHUSDC','SOLUSDC','BNBUSDC','XRPUSDC','DOGEUSDC','ADAUSDC','AVAXUSDC','DOTUSDC','LINKUSDC','UNIUSDC','MATICUSDC'];
const ASSETS  = {};
SYMBOLS.forEach(s => { ASSETS[s] = s.replace('USDC',''); });

const supabase   = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { transport: NodeWS } });
const prices     = {};
const openTrades = {};
const lastSignal = {};
let   tradeCount = 0;
const startTime  = Date.now();
SYMBOLS.forEach(s => { prices[s] = []; });

console.log('');
console.log('==================================================');
console.log(' SQI DELTA-ARB BOT v5.1 — STARTING');
console.log(` Mode: ${MODE} | Pairs: ${SYMBOLS.length} | Threshold: ${(DELTA_THRESH*100).toFixed(3)}%`);
console.log(` Supabase: ${SUPABASE_URL}`);
console.log(` Binance key: ${BINANCE_KEY ? BINANCE_KEY.slice(0,8)+'...' : 'NOT SET'}`);
console.log('==================================================');

// ── WEBSOCKET ────────────────────────────────────────────
function connectWS() {
  let WebSocket;
  try { WebSocket = require('ws'); } catch(e) { console.error('FATAL: ws not installed — run: npm install ws'); process.exit(1); }
  
  const streams = SYMBOLS.map(s => s.toLowerCase() + '@aggTrade').join('/');
  const ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streams);
  
  ws.on('open', () => console.log('[WS] Connected to Binance — ' + SYMBOLS.length + ' pairs'));
  ws.on('error', e => console.error('[WS] Error:', e.message));
  ws.on('close', () => { console.log('[WS] Closed — reconnecting in 3s'); setTimeout(connectWS, 3000); });
  ws.on('message', raw => {
    try {
      const d = JSON.parse(raw);
      const t = d.data || d;
      if (!t.s || !t.p) return;
      const ts = Date.now();
      if (!prices[t.s]) return;
      prices[t.s].push({ price: parseFloat(t.p), ts });
      const cutoff = ts - 5 * 60 * 1000;
      prices[t.s] = prices[t.s].filter(p => p.ts >= cutoff);
    } catch(e) {}
  });
}

// ── DELTA ────────────────────────────────────────────────
function getDelta(sym, ms) {
  const arr = prices[sym];
  if (!arr || arr.length < 2) return null;
  const now  = Date.now();
  const past = arr.find(p => p.ts >= now - ms);
  if (!past) return null;
  const cur = arr[arr.length - 1].price;
  return (cur - past.price) / past.price;
}

// ── BALANCE ──────────────────────────────────────────────
async function getLiveBalance() {
  if (!BINANCE_KEY || !BINANCE_SEC || MODE === 'PAPER') return 100;
  try {
    const ts  = Date.now();
    const qs  = 'timestamp=' + ts + '&recvWindow=5000';
    const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
    const data = await new Promise((resolve, reject) => {
      const req = https.request('https://api.binance.com/api/v3/account?' + qs + '&signature=' + sig,
        { headers: { 'X-MBX-APIKEY': BINANCE_KEY } },
        res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{resolve(JSON.parse(b));}catch(e){reject(e);} }); }
      );
      req.on('error', reject); req.end();
    });
    const usdc = (data.balances||[]).find(b => b.asset === 'USDC');
    const bal  = usdc ? parseFloat(usdc.free) : 0;
    console.log('[BAL] USDC balance: $' + bal.toFixed(2));
    return bal;
  } catch(e) {
    console.error('[BAL] Error:', e.message);
    return 100;
  }
}

// ── BINANCE ORDER ────────────────────────────────────────
async function binanceOrder(symbol, side, quoteQty) {
  const ts  = Date.now();
  const qs  = 'symbol='+symbol+'&side='+side+'&type=MARKET&quoteOrderQty='+quoteQty+'&timestamp='+ts+'&recvWindow=5000';
  const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.binance.com/api/v3/order?' + qs + '&signature=' + sig,
      { method: 'POST', headers: { 'X-MBX-APIKEY': BINANCE_KEY } },
      res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ const j=JSON.parse(b); j.code?reject(new Error(j.msg)):resolve(String(j.orderId||'')); }); }
    );
    req.on('error', reject); req.end();
  });
}

// ── OPEN TRADE ───────────────────────────────────────────
async function openTrade(sym, asset, signal, deltaStr) {
  const now          = Date.now();
  const currentPrice = (prices[sym]||[]).slice(-1)[0]?.price;
  if (!currentPrice) return;

  const balance   = await getLiveBalance();
  const tradeSize = Math.max(0.10, Math.round(balance * RISK_PCT * 100) / 100);
  
  console.log('[OPEN] ' + asset + ' ' + signal + ' | delta=' + deltaStr + ' | $' + tradeSize.toFixed(2) + ' | entry=$' + currentPrice.toFixed(4));

  let orderId = null;
  if (MODE === 'LIVE' && BINANCE_KEY && BINANCE_SEC) {
    try {
      orderId = await binanceOrder(sym, signal === 'UP' ? 'BUY' : 'SELL', tradeSize);
      console.log('[ORDER] Placed: ' + orderId);
    } catch(e) {
      console.error('[ORDER] Failed:', e.message);
      return;
    }
  }

  try {
    const { data, error } = await supabase.from('bot_trades').insert({
      asset, signal, delta: deltaStr,
      size_usd: tradeSize, entry_price: currentPrice,
      status: 'open', pnl_usdc: 0, mode: MODE, order_id: orderId,
    }).select('id').single();

    if (error) { console.error('[DB] Insert error:', error.message); return; }

    openTrades[sym] = { id: data.id, entry: currentPrice, direction: signal, ts: now, size: tradeSize };
    tradeCount++;
    console.log('[OPEN] Saved to DB | id=' + data.id + ' | total trades=' + tradeCount);
  } catch(e) {
    console.error('[DB] Exception:', e.message);
  }
}

// ── CLOSE TRADE ──────────────────────────────────────────
async function closeTrade(sym, asset) {
  const trade = openTrades[sym];
  if (!trade) return;
  const currentPrice = (prices[sym]||[]).slice(-1)[0]?.price;
  if (!currentPrice) return;

  const pnl    = trade.direction === 'UP'
    ? ((currentPrice - trade.entry) / trade.entry) * trade.size
    : ((trade.entry - currentPrice) / trade.entry) * trade.size;
  const status = pnl >= 0 ? 'won' : 'lost';

  try {
    await supabase.from('bot_trades').update({ status, pnl_usdc: Math.round(pnl*10000)/10000 }).eq('id', trade.id);
    console.log('[CLOSE] ' + asset + ' ' + status.toUpperCase() + ' | PnL=' + (pnl>=0?'+':'') + '$' + pnl.toFixed(4));
  } catch(e) {
    console.error('[DB] Close error:', e.message);
  }
  delete openTrades[sym];
}

// ── SCANNER ───────────────────────────────────────────────
async function scan() {
  for (const sym of SYMBOLS) {
    try {
      const asset = ASSETS[sym];
      const d1m   = getDelta(sym, 60 * 1000);
      const d3m   = getDelta(sym, 3 * 60 * 1000);

      if (d1m === null && d3m === null) continue;

      const vals    = [d1m, d3m].filter(x => x !== null);
      const best    = vals.reduce((a,b) => Math.abs(a) > Math.abs(b) ? a : b);
      const absD    = Math.abs(best);
      const dir     = best > 0 ? 'UP' : 'DOWN';
      const key     = sym + '_' + dir;
      const now     = Date.now();

      if (lastSignal[key] && now - lastSignal[key] < 90000) continue;
      if (absD < DELTA_THRESH) continue;

      if (openTrades[sym] && openTrades[sym].direction !== dir) await closeTrade(sym, asset);
      if (!openTrades[sym]) {
        const deltaStr = (best >= 0 ? '+' : '') + (best * 100).toFixed(4) + '%';
        lastSignal[key] = now;
        await openTrade(sym, asset, dir, deltaStr);
      }
    } catch(e) {
      console.error('[SCAN] Error on ' + sym + ':', e.message);
    }
  }
}

// ── AUTO-CLOSE ────────────────────────────────────────────
async function autoClose() {
  const now = Date.now();
  for (const sym of SYMBOLS) {
    if (openTrades[sym] && now - openTrades[sym].ts > 15 * 60 * 1000) {
      console.log('[AUTO] Closing stale ' + ASSETS[sym]);
      await closeTrade(sym, ASSETS[sym]);
    }
  }
}

// ── HEALTH ────────────────────────────────────────────────
http.createServer((req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const tickCounts = {};
  SYMBOLS.forEach(s => { tickCounts[ASSETS[s]] = (prices[s]||[]).length; });
  res.writeHead(200, {'Content-Type':'application/json'});
  res.end(JSON.stringify({
    status:'running', version:'5.1', mode:MODE,
    pairs:SYMBOLS.length, threshold:(DELTA_THRESH*100).toFixed(3)+'%',
    trades:tradeCount, open:Object.keys(openTrades).length,
    uptime:Math.floor(uptime/60)+'m '+uptime%60+'s',
    ticks: tickCounts, ts: new Date().toISOString()
  }, null, 2));
}).listen(PORT, () => console.log('[HEALTH] Listening on :' + PORT));

// ── START ─────────────────────────────────────────────────
connectWS();
setInterval(scan, SCAN_MS);
setInterval(autoClose, 60000);
setInterval(() => {
  const open  = Object.keys(openTrades).map(s=>ASSETS[s]).join(',') || 'none';
  const ticks = SYMBOLS.slice(0,3).map(s=>ASSETS[s]+':'+(prices[s]||[]).length).join(' ');
  console.log('[ALIVE] ' + new Date().toISOString() + ' | trades:' + tradeCount + ' | open:[' + open + '] | ticks:' + ticks + '...');
}, 300000);

process.on('uncaughtException', e => console.error('[UNCAUGHT]', e.message, e.stack));
process.on('unhandledRejection', e => console.error('[UNHANDLED]', e));
