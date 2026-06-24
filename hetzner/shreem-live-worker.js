// shreem-live-worker.js — Shreem Brzee v12
// v12 — CLEAN: no websocket (Helius free plan blocks transactionSubscribe)
// BUY: handled by Helius webhook → Supabase edge function (inline, ~180ms)
// SELL mirror: poll every 10s for whale SELL signals
// Stop-loss: poll every 30s, -30% hard stop, trailing stop (peak>=30%, floor=50% of peak)
// Trailing stop also runs via Supabase pg_cron /cron endpoint every 5min as backup

const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const PORT         = 3001;
const SELL_POLL_MS = 7000;  // 7s — whale SELL mirror (tightened)
const STOP_POLL_MS = 5000;  // 5s — stop-loss + trailing stop (meme coins can crash in seconds)

if (!SUPABASE_KEY) { console.error('[shreem] FATAL: SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

console.log('[shreem] v12 CLEAN — sell poll + stop-loss, no websocket');
console.log('[shreem] SUPABASE_KEY prefix:', SUPABASE_KEY.slice(0,20) + '...');

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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sbGet   = (t, f)    => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HEADERS).then(r => Array.isArray(r.data) ? r.data : []);
const sbPatch = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);
const sbUpdate = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);

async function callExecutor(body) {
  const r = await httpReq(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, 'POST', body,
    { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
  return r.data;
}

// Price fetch — Jupiter v2 with DexScreener fallback
async function fetchPrice(mint) {
  // Try Jupiter first
  try {
    const r = await httpReq(`https://api.jup.ag/price/v2?ids=${mint}`);
    const price = parseFloat(Object.values(r.data?.data || {})[0]?.price || 0);
    if (price > 0) return price;
  } catch {}

  // DexScreener fallback
  try {
    const r = await httpReq(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = r.data?.pairs;
    if (pairs?.length) {
      const price = parseFloat(pairs[0].priceUsd || 0);
      if (price > 0) return price;
    }
  } catch {}

  return 0;
}

// ── SELL MIRROR POLL (every 10s) ──────────────────────────────────────────────
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

      console.log(`[pollSell] ${sig.label} SELL ${sig.symbol || sig.mint.slice(0,8)} — mirroring`);
      try {
        const result = await callExecutor({ action: 'close', trade_id: openTrades[0].id, mint: sig.mint, reason: 'whale_sell_mirror' });
        if (result?.ok) {
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
          console.log(`[pollSell] ✅ closed ${sig.symbol || sig.mint.slice(0,8)}`);
        } else {
          console.warn(`[pollSell] executor returned not-ok:`, JSON.stringify(result).slice(0,120));
        }
      } catch (e) { console.error('[pollSell] executor error:', e.message); }
    }
  } catch (e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── STOP-LOSS + TRAILING STOP POLL (every 30s) ────────────────────────────────
// Hard stop: -30% from entry
// Trailing stop: once peak gain >= 30%, floor = 50% of peak gain
//   e.g. peak = +100% → floor = +50% — if price drops to +50%, we sell
//   e.g. peak = +60%  → floor = +30% — if price drops to +30%, we sell
let stopBusy = false;
async function pollStopLoss() {
  if (stopBusy) return;
  stopBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    const openPos = await sbGet('shreem_brzee_live_trades',
      'status=eq.open&select=id,mint,symbol,entry_price,peak_price,opened_at,amount_sol');

    for (const pos of openPos) {
      if (!pos.entry_price || !pos.mint) continue;
      const entry = Number(pos.entry_price);
      if (entry <= 0) continue;

      // 48h safety cap
      if (pos.opened_at && (Date.now() - new Date(pos.opened_at).getTime()) > 48 * 3600000) {
        console.log(`[stopLoss] ${pos.symbol} 48h timeout — closing`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'timeout_48h' }); } catch {}
        continue;
      }

      const price = await fetchPrice(pos.mint);
      if (!price) {
        console.warn(`[stopLoss] ${pos.symbol || pos.mint.slice(0,8)} — no price, skipping`);
        continue;
      }

      const pnlPct  = (price - entry) / entry * 100;
      const prevPeak = Number(pos.peak_price) || entry;
      const peak     = Math.max(prevPeak, price);
      const peakPct  = (peak - entry) / entry * 100;

      // Always update peak + current pnl in DB
      await sbUpdate('shreem_brzee_live_trades', `id=eq.${pos.id}`, {
        exit_price: price,
        peak_price: peak,
        pnl_pct:   pnlPct,
        pnl_sol:   Number(pos.amount_sol || 0) * (pnlPct / 100),
      });

      // Hard stop-loss: -30%
      if (pnlPct <= -30) {
        console.log(`[stopLoss] 🛑 ${pos.symbol || pos.mint.slice(0,8)} hard stop — ${pnlPct.toFixed(1)}% — closing`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'stop_loss_30pct' }); } catch (e) {
          console.error('[stopLoss] executor error:', e.message);
        }
        continue;
      }

      // Trailing stop: peak >= 30%, floor = 50% of peak
      if (peakPct >= 30) {
        const trailFloor = peakPct * 0.5;
        if (pnlPct <= trailFloor) {
          console.log(`[trailStop] 🔒 ${pos.symbol || pos.mint.slice(0,8)} trail fired — peak ${peakPct.toFixed(1)}% → floor ${trailFloor.toFixed(1)}% — now ${pnlPct.toFixed(1)}% — closing`);
          try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'trailing_stop' }); } catch (e) {
            console.error('[trailStop] executor error:', e.message);
          }
          continue;
        } else {
          console.log(`[trailStop] ${pos.symbol || pos.mint.slice(0,8)} peak=${peakPct.toFixed(1)}% floor=${trailFloor.toFixed(1)}% now=${pnlPct.toFixed(1)}% — holding`);
        }
      }
    }
  } catch (e) { console.error('[pollStopLoss] error:', e.message); }
  finally { stopBusy = false; }
}

// ── Health endpoint ───────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:  'running',
    version: 'v12-clean',
    uptime:  Math.floor(process.uptime()),
    time:    new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

// ── Start ─────────────────────────────────────────────────────────────────────
setInterval(pollSell, SELL_POLL_MS);
setInterval(pollStopLoss, STOP_POLL_MS);
pollSell();
setTimeout(pollStopLoss, 5000); // stagger start by 5s

console.log('[shreem] v12 running — sell poll every 10s, stop-loss every 30s');
