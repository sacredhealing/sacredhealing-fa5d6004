/**
 * SQI DELTA-ARB BOT v5.1 — Hetzner 24/7
 * 12 pairs | 0.05% threshold | 1m+3m windows | 2% dynamic sizing
 */
'use strict';
const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

// DB writes go through the clawbot-bridge edge function so Hetzner never touches the
// Supabase service_role key directly — matches the pattern used by sniper-live/clawbot,
// and sidesteps the legacy-API-key deprecation (June 19) that broke direct service-role auth.
const BRIDGE_URL    = process.env.BRIDGE_URL    || 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/clawbot-bridge';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'clawbot-bridge-2026';

function bridgeRequest(method, table, body, query) {
  return new Promise((resolve, reject) => {
    const qs = query ? '?' + query : '';
    const payload = body ? JSON.stringify(body) : undefined;
    const headers = { apikey: BRIDGE_SECRET, 'Content-Type': 'application/json' };
    if (method === 'POST') headers['Prefer'] = 'return=representation';
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const req = https.request(BRIDGE_URL + '/' + table + qs, { method, headers }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        if (res.statusCode >= 400) { reject(new Error('Bridge ' + res.statusCode + ': ' + b)); return; }
        try { resolve(b ? JSON.parse(b) : null); } catch (e) { resolve(null); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const BINANCE_KEY   = process.env.BINANCE_API_KEY    || '';
const BINANCE_SEC   = process.env.BINANCE_API_SECRET || '';
const MODE          = (process.env.BOT_MODE || 'PAPER').toUpperCase();
const PORT          = parseInt(process.env.PORT || '8081');
const RISK_PCT      = parseFloat(process.env.RISK_PCT || '0.02');
const DELTA_THRESH  = parseFloat(process.env.DELTA_THRESHOLD || '0.0005');
// Data-driven tune from 987 PAPER trades (2026-07-04/05, ~18h window):
// DOWN signals: 46.0% WR, +0.2108 total PnL. UP signals: 41.0% WR, -0.0860 total PnL.
// Best delta bucket was 0.20-0.30% (48.7% WR, 3x the avg return of the 0.15-0.20% bucket).
// UNI/AVAX/DOT/BTC were net losers across the sample; ADA/BNB/SOL/ETH were net winners.
// CAVEAT: 18h of data from one market regime — this is a tune, not a proven fix. Treat the
// next run as an out-of-sample validation, not a confirmation.
const UP_THRESH_MULT = parseFloat(process.env.UP_THRESH_MULTIPLIER || '1.6'); // require stronger moves before trading UP
const EXCLUDED_ASSETS = (process.env.EXCLUDED_ASSETS || 'UNI,AVAX,DOT,BTC').split(',').map(s=>s.trim()).filter(Boolean);
const SCAN_MS       = parseInt(process.env.SCAN_INTERVAL_MS || '5000');

const SYMBOLS = ['BTCUSDC','ETHUSDC','SOLUSDC','BNBUSDC','XRPUSDC','DOGEUSDC','ADAUSDC','AVAXUSDC','DOTUSDC','LINKUSDC','UNIUSDC','MATICUSDC'];
const ASSETS  = {};
SYMBOLS.forEach(s => { ASSETS[s] = s.replace('USDC',''); });

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
console.log(` DB bridge: ${BRIDGE_URL}`);
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
// NOTE: no DB write here anymore. bot_trades has a broken trigger that 500s on
// any UPDATE or DELETE (confirmed — INSERT/SELECT work fine, mutation doesn't).
// Until that's fixed at the database level, we track opens purely in memory and
// write ONE complete INSERT when the trade closes. Tradeoff: in-flight "open"
// trades won't show in the DB/frontend until they resolve — but PnL/win-rate
// data will finally be honest and complete instead of silently vanishing.
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

  openTrades[sym] = { entry: currentPrice, direction: signal, ts: now, size: tradeSize, deltaStr, orderId };
  tradeCount++;
  console.log('[OPEN] Tracking in-memory | total opened=' + tradeCount);
}

// ── CLOSE TRADE ──────────────────────────────────────────
const FEE_PCT_ROUNDTRIP = parseFloat(process.env.FEE_PCT_ROUNDTRIP || '0.002'); // 0.1% taker each side, no BNB discount — conservative default

async function closeTrade(sym, asset) {
  const trade = openTrades[sym];
  if (!trade) return;
  const currentPrice = (prices[sym]||[]).slice(-1)[0]?.price;
  if (!currentPrice) return;

  const grossPnl = trade.direction === 'UP'
    ? ((currentPrice - trade.entry) / trade.entry) * trade.size
    : ((trade.entry - currentPrice) / trade.entry) * trade.size;
  const fee = trade.size * FEE_PCT_ROUNDTRIP;
  const pnl = grossPnl - fee; // net of real round-trip trading fees — this is the honest number
  const status = pnl >= 0 ? 'won' : 'lost';

  try {
    const rows = await bridgeRequest('POST', 'bot_trades', {
      asset, signal: trade.direction, delta: trade.deltaStr,
      size_usd: trade.size, entry_price: trade.entry, exit_price: currentPrice,
      status, pnl_usdc: Math.round(pnl*10000)/10000, mode: MODE, order_id: trade.orderId,
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    console.log('[CLOSE] ' + asset + ' ' + status.toUpperCase() + ' | Gross=' + (grossPnl>=0?'+':'') + '$' + grossPnl.toFixed(4) + ' | Fee=-$' + fee.toFixed(4) + ' | Net=' + (pnl>=0?'+':'') + '$' + pnl.toFixed(4) + (row&&row.id ? ' | id='+row.id : ''));
  } catch(e) {
    console.error('[DB] Close-insert error:', e.message);
  }
  delete openTrades[sym];
}

// ── SCANNER ───────────────────────────────────────────────
async function scan() {
  for (const sym of SYMBOLS) {
    try {
      const asset = ASSETS[sym];
      if (EXCLUDED_ASSETS.includes(asset)) continue;
      const d1m   = getDelta(sym, 60 * 1000);
      const d3m   = getDelta(sym, 3 * 60 * 1000);

      if (d1m === null && d3m === null) continue;

      const vals    = [d1m, d3m].filter(x => x !== null);
      const best    = vals.reduce((a,b) => Math.abs(a) > Math.abs(b) ? a : b);
      const absD    = Math.abs(best);
      const dir     = best > 0 ? 'UP' : 'DOWN';
      const key     = sym + '_' + dir;
      const now     = Date.now();
      const effectiveThresh = dir === 'UP' ? DELTA_THRESH * UP_THRESH_MULT : DELTA_THRESH;

      if (lastSignal[key] && now - lastSignal[key] < 90000) continue;
      if (absD < effectiveThresh) continue;

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

// ── REAL BALANCE (always live, independent of PAPER/LIVE trading mode) ────
async function getRealBalance() {
  if (!BINANCE_KEY || !BINANCE_SEC) return { ok: false, error: 'No Binance keys configured' };
  try {
    const priceData = await new Promise((resolve, reject) => {
      https.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', res => {
        let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{resolve(JSON.parse(b));}catch(e){reject(e);} });
      }).on('error', reject);
    });
    const btcPrice = parseFloat(priceData?.price ?? '0');

    const ts  = Date.now();
    const qs  = 'timestamp=' + ts + '&recvWindow=10000';
    const sig = crypto.createHmac('sha256', BINANCE_SEC).update(qs).digest('hex');
    const data = await new Promise((resolve, reject) => {
      const req = https.request('https://api.binance.com/api/v3/account?' + qs + '&signature=' + sig,
        { headers: { 'X-MBX-APIKEY': BINANCE_KEY } },
        res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>{ try{resolve(JSON.parse(b));}catch(e){reject(e);} }); }
      );
      req.on('error', reject); req.end();
    });
    if (!data.balances) return { ok: false, error: JSON.stringify(data).slice(0, 200), btcPrice };
    const get = (a) => { const b = data.balances.find(x => x.asset === a); return b ? parseFloat(b.free) + parseFloat(b.locked) : 0; };
    const usdt = get('USDT'), usdc = get('USDC'), btc = get('BTC');
    return {
      ok: true,
      usdt: Math.round(usdt * 100) / 100,
      usdc: Math.round(usdc * 100) / 100,
      btc: Math.round(btc * 1e8) / 1e8,
      btcPrice: Math.round(btcPrice * 100) / 100,
      totalUsd: Math.round((usdt + usdc + btc * btcPrice) * 100) / 100,
      canTrade: !!data.canTrade,
      accountType: data.accountType ?? null,
      ts: new Date().toISOString()
    };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ── HEALTH ────────────────────────────────────────────────
http.createServer((req, res) => {
  if (req.url === '/balance') {
    getRealBalance().then(bal => {
      res.writeHead(200, {'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify(bal));
    });
    return;
  }
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
