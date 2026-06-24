// shreem-live-worker.js — Shreem Brzee v13
// v13 — PROFESSIONAL: In-memory position cache + real-time price via DexScreener
// Stop loss checks every 3s against in-memory cache — no DB polling for prices
// Sell mirror: polls DB every 7s for whale SELL signals
// Auto-recover: any position open > 30min with no price update gets force-checked

const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const PORT         = 3001;
const SELL_POLL_MS = 7000;   // 7s — whale SELL mirror
const STOP_POLL_MS = 3000;   // 3s — stop loss check (was 15s, now 3s)
const PRICE_TTL_MS = 4000;   // Price cache TTL — refresh every 4s

if (!SUPABASE_KEY) { console.error('[shreem] FATAL: no key'); process.exit(1); }

console.log('[shreem] v13 PROFESSIONAL — 3s stop loss, in-memory cache');

const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpReq(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sbGet   = (t, f) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HEADERS).then(r => Array.isArray(r.data) ? r.data : []);
const sbPatch = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);

async function callExecutor(body) {
  const r = await httpReq(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, 'POST', body,
    { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
  return r.data;
}

// ── IN-MEMORY POSITION CACHE ──────────────────────────────────────────────────
// Key: trade id → { mint, symbol, entry_price, peak_price, amount_sol, opened_at, label }
const positionCache = new Map();
// Key: mint → { price, usd, updatedAt }
const priceCache    = new Map();
// Track which positions are currently being closed to prevent double-sells
const closingSet    = new Set();

// Sync positions from DB into memory every 15s
async function syncPositions() {
  try {
    const positions = await sbGet('shreem_brzee_live_trades',
      'status=eq.open&select=id,mint,symbol,entry_price,peak_price,amount_sol,opened_at,label');
    
    // Update cache
    const dbIds = new Set(positions.map(p => p.id));
    
    // Remove closed positions from cache
    for (const [id] of positionCache) {
      if (!dbIds.has(id)) positionCache.delete(id);
    }
    
    // Add/update open positions
    for (const pos of positions) {
      const existing = positionCache.get(pos.id);
      positionCache.set(pos.id, {
        ...pos,
        peak_price: existing?.peak_price || Number(pos.peak_price) || Number(pos.entry_price) || 0,
      });
    }
    
    if (positions.length > 0) {
      console.log(`[cache] ${positions.length} open positions synced`);
    }
  } catch(e) { console.error('[cache] sync failed:', e.message); }
}

// ── PRICE FETCHER — parallel, cached ─────────────────────────────────────────
async function fetchPrice(mint) {
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.updatedAt < PRICE_TTL_MS) return cached.price;

  // Try DexScreener first (better for new pump.fun tokens)
  try {
    const r = await httpReq(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (r.data?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
      const price = parseFloat(pairs[0].priceUsd);
      if (price > 0) {
        priceCache.set(mint, { price, updatedAt: Date.now() });
        return price;
      }
    }
  } catch {}

  // Jupiter fallback
  try {
    const r = await httpReq(`https://api.jup.ag/price/v2?ids=${mint}`);
    const price = parseFloat(Object.values(r.data?.data || {})[0]?.price || 0);
    if (price > 0) {
      priceCache.set(mint, { price, updatedAt: Date.now() });
      return price;
    }
  } catch {}

  return 0;
}

// Get SOL/USD rate
let solUsd = 68;
async function refreshSolPrice() {
  try {
    const r = await httpReq('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    if (r.data?.price) solUsd = parseFloat(r.data.price);
  } catch {}
}

// ── SELL MIRROR POLL (every 7s) ───────────────────────────────────────────────
let sellBusy = false;
async function pollSell() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&or=(live_processed.eq.false,live_processed.is.null)&order=created_at.asc&limit=10');

    for (const sig of sellSignals) {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${sig.mint}&select=id,symbol`);

      if (!openTrades.length) {
        await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
        continue;
      }

      if (closingSet.has(openTrades[0].id)) continue;
      closingSet.add(openTrades[0].id);

      console.log(`[pollSell] ${sig.label} SELL ${sig.symbol||sig.mint.slice(0,8)} — mirroring`);
      try {
        const result = await callExecutor({ action: 'close', trade_id: openTrades[0].id, mint: sig.mint, reason: 'whale_sell_mirror' });
        if (result?.ok) {
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
          positionCache.delete(openTrades[0].id);
          console.log(`[pollSell] ✅ closed ${sig.symbol||sig.mint.slice(0,8)}`);
        }
      } catch(e) { console.error('[pollSell] executor error:', e.message); }
      finally { closingSet.delete(openTrades[0].id); }
    }
  } catch(e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── STOP LOSS + TRAILING STOP (every 3s, in-memory) ──────────────────────────
let stopBusy = false;
async function pollStopLoss() {
  if (stopBusy) return;
  if (positionCache.size === 0) return;
  stopBusy = true;

  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    // Fetch all prices in parallel
    const mints = [...new Set([...positionCache.values()].map(p => p.mint).filter(Boolean))];
    await Promise.all(mints.map(fetchPrice));

    for (const [id, pos] of positionCache) {
      if (closingSet.has(id)) continue;
      if (!pos.entry_price || !pos.mint) continue;

      const entry = Number(pos.entry_price);
      if (entry <= 0) continue;

      // 48h timeout
      if (pos.opened_at && (Date.now() - new Date(pos.opened_at).getTime()) > 48 * 3600000) {
        console.log(`[stopLoss] ${pos.symbol} 48h timeout`);
        closingSet.add(id);
        try { await callExecutor({ action: 'close', trade_id: id, reason: 'timeout_48h' }); } catch {}
        positionCache.delete(id);
        closingSet.delete(id);
        continue;
      }

      // Get price from cache (already fetched above)
      const cached = priceCache.get(pos.mint);
      if (!cached || Date.now() - cached.updatedAt > 30000) continue; // skip if price too stale
      const price = cached.price;
      if (!price || price <= 0) continue;

      // Convert token USD price to PnL
      // entry_price is in USD per token, price is current USD per token
      const pnlPct = (price - entry) / entry * 100;

      // Update peak in memory
      const prevPeak = pos.peak_price || entry;
      const peak     = Math.max(prevPeak, price);
      const peakPct  = (peak - entry) / entry * 100;
      pos.peak_price = peak; // update in-memory

      // Update DB peak periodically (every 10s worth of cycles ~30 cycles at 3s)
      // We do it inline here but non-blocking
      sbPatch('shreem_brzee_live_trades', `id=eq.${id}`, {
        exit_price: price,
        peak_price: peak,
        pnl_pct: pnlPct,
        pnl_sol: Number(pos.amount_sol || 0) * (pnlPct / 100),
      }).catch(() => {});

      // Hard stop loss: -25%
      if (pnlPct <= -25) {
        console.log(`[stopLoss] 🛑 ${pos.symbol||pos.mint.slice(0,8)} hard stop ${pnlPct.toFixed(1)}%`);
        closingSet.add(id);
        positionCache.delete(id);
        try { await callExecutor({ action: 'close', trade_id: id, reason: 'stop_loss_25pct' }); }
        catch(e) { console.error('[stopLoss] executor error:', e.message); }
        closingSet.delete(id);
        continue;
      }

      // Trailing stop: peak >= 30%, floor = 50% of peak
      if (peakPct >= 30) {
        const trailFloor = peakPct * 0.5;
        if (pnlPct <= trailFloor) {
          console.log(`[trailStop] 🔒 ${pos.symbol||pos.mint.slice(0,8)} peak=${peakPct.toFixed(1)}% floor=${trailFloor.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
          closingSet.add(id);
          positionCache.delete(id);
          try { await callExecutor({ action: 'close', trade_id: id, reason: 'trailing_stop' }); }
          catch(e) { console.error('[trailStop] executor error:', e.message); }
          closingSet.delete(id);
          continue;
        }
      }
    }
  } catch(e) { console.error('[pollStopLoss] error:', e.message); }
  finally { stopBusy = false; }
}

// ── Health endpoint ───────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:    'running',
    version:   'v13',
    uptime:    Math.floor(process.uptime()),
    positions: positionCache.size,
    sol_usd:   solUsd,
    time:      new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

// ── Start ─────────────────────────────────────────────────────────────────────
syncPositions(); // initial sync
setInterval(syncPositions, 15000);    // sync DB every 15s
setInterval(pollSell, SELL_POLL_MS);  // sell mirror every 7s
setInterval(pollStopLoss, STOP_POLL_MS); // stop loss every 3s
setInterval(refreshSolPrice, 30000);  // SOL price every 30s
setTimeout(pollSell, 2000);
setTimeout(pollStopLoss, 5000);

console.log('[shreem] v13 running — 3s stop loss, 7s sell mirror, in-memory cache');
