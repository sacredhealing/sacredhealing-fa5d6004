// shreem-live-worker.js — Shreem Brzee Signal Poller v10
// v10 — KEYLESS ARCHITECTURE: worker only polls signals and calls executor edge function
// The executor (Supabase) holds the keypair and signs all transactions
// Worker needs ONLY: SUPABASE_SERVICE_ROLE_KEY (already in PM2 ecosystem)
// No BOT_KEYPAIR needed here. One place signs = no key sprawl.

const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT         = 3001;
const POLL_MS      = 20000;  // Check unprocessed BUY signals every 20s
const SELL_POLL_MS = 15000;  // Check unprocessed SELL signals every 15s

if (!SUPABASE_KEY) {
  console.error('[shreem] FATAL: SUPABASE_SERVICE_ROLE_KEY not set. Exiting.');
  process.exit(1);
}

console.log('[shreem] v10 KEYLESS — delegates all signing to executor edge function');
console.log('[shreem] SUPABASE_KEY prefix:', SUPABASE_KEY.slice(0, 20) + '...');

const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sbGet = (table, filter) =>
  httpReq(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, 'GET', null, SB_HEADERS).then(r => r.data);

const sbPatch = (table, filter, body) =>
  httpReq(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, 'PATCH', body, SB_HEADERS);

// ── Call executor edge function ───────────────────────────────────────────────
async function callExecutor(body) {
  const r = await httpReq(
    `${SUPABASE_URL}/functions/v1/shreem-live-executor`,
    'POST',
    body,
    { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` }
  );
  return r.data;
}

// ── BUY POLL ─────────────────────────────────────────────────────────────────
// Catches any signals the webhook's direct executor call missed (fallback path)
let buyBusy = false;
async function pollBuy() {
  if (buyBusy) return;
  buyBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const cutoff = new Date(Date.now() - 30000).toISOString();

    // Pick up signals not yet processed: false OR null (pre-v5.1 signals)
    const signals = await sbGet('shreem_brzee_signals',
      `action=eq.BUY&or=(live_processed.eq.false,live_processed.is.null)&created_at=lt.${cutoff}&order=created_at.asc&limit=5`);

    for (const sig of signals) {
      if (sig.mint === USDC) { await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true }); continue; }
      if (!sig.mint) { await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true }); continue; }

      // Mark processing (prevent double-pick) — will revert if executor fails
      await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });

      console.log(`[pollBuy] Sending to executor: ${sig.label} → ${sig.symbol || sig.mint.slice(0,8)} | ${sig.amount_sol} SOL`);

      try {
        const result = await callExecutor({
          direct_signal: {
            sig:        sig.sig,
            mint:       sig.mint,
            symbol:     sig.symbol,
            label:      sig.label,
            wallet:     sig.wallet,
            amount_sol: sig.amount_sol,
          }
        });

        if (result?.ok && !result?.skipped) {
          console.log(`[pollBuy] ✅ ${sig.symbol || sig.mint.slice(0,8)} executed by executor | tx:${result.tx?.slice(0,16)}`);
        } else if (result?.skipped) {
          console.log(`[pollBuy] skipped: ${result.reason}`);
        } else {
          // Executor failed — revert so next cycle retries
          console.error(`[pollBuy] ❌ executor error: ${result?.error} — reverting live_processed`);
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: false });
        }
      } catch (e) {
        console.error(`[pollBuy] ❌ executor call failed: ${e.message} — reverting`);
        await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: false });
      }
    }
  } catch (e) { console.error('[pollBuy] error:', e.message); }
  finally { buyBusy = false; }
}

// ── SELL POLL ─────────────────────────────────────────────────────────────────
// Whale SELL mirror + stop-loss via executor
let sellBusy = false;
async function pollSell() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    // ── 1. Whale SELL mirror ─────────────────────────────────────────────────
    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&or=(live_processed.eq.false,live_processed.is.null)&order=created_at.asc&limit=10');

    for (const sig of sellSignals) {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `status=eq.open&mint=eq.${sig.mint}&select=id,symbol`);

      if (!openTrades.length) {
        await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
        continue;
      }

      console.log(`[pollSell] ${sig.label} SELL ${sig.symbol || sig.mint.slice(0,8)} — calling executor to close`);

      try {
        const result = await callExecutor({ action: 'close', mint: sig.mint, reason: 'whale_sell_mirror' });

        if (result?.ok) {
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
          console.log(`[pollSell] ✅ closed ${sig.symbol || sig.mint.slice(0,8)}`);
        } else {
          console.warn(`[pollSell] ⚠️ executor returned !ok — leaving unprocessed for retry`);
        }
      } catch (e) {
        console.error(`[pollSell] ❌ executor call failed: ${e.message}`);
      }
    }

    // ── 2. Stop-loss + take-profit via executor cron ─────────────────────────
    // The executor's /cron-stoploss handles this server-side every 5 min
    // Worker just does a quick price check as supplementary coverage
    const openAll = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=id,mint,symbol,entry_price,opened_at,amount_sol');
    const now = Date.now();

    for (const pos of openAll) {
      // 48h timeout
      if (pos.opened_at && (now - new Date(pos.opened_at).getTime()) > 48 * 3600000) {
        console.log(`[timeout] ${pos.symbol} held 48h — calling executor to close`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'timeout_48h' }); } catch {}
        continue;
      }

      if (!pos.entry_price || !pos.mint) continue;

      // Price check
      let price = 0;
      try {
        const r = await httpReq(`https://lite-api.jup.ag/price/v3?ids=${pos.mint}`);
        if (r.data && typeof r.data === 'object') {
          const entry = Object.values(r.data)[0];
          price = parseFloat(entry?.usdPrice || entry?.price || 0);
        }
      } catch {}

      if (!price) continue;

      const changePct = ((price - Number(pos.entry_price)) / Number(pos.entry_price)) * 100;

      if (changePct <= -25) {
        console.log(`[stoploss] ${pos.symbol} down ${changePct.toFixed(1)}% — executor close`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'stoploss_25pct' }); } catch {}
      } else if (changePct >= 50) {
        console.log(`[takeprofit] ${pos.symbol} up ${changePct.toFixed(1)}% — executor close`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'takeprofit_50pct' }); } catch {}
      }
    }

  } catch (e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── Health check ─────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  let execHealth = {};
  try {
    const r = await httpReq(
      `${SUPABASE_URL}/functions/v1/shreem-live-executor/health`,
      'GET', null,
      { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` }
    );
    execHealth = r.data;
  } catch {}

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:    'running',
    version:   'v10-keyless',
    uptime:    Math.floor(process.uptime()),
    sb_key_ok: !!SUPABASE_KEY,
    executor:  execHealth,
    time:      new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

setInterval(pollBuy,  POLL_MS);
setInterval(pollSell, SELL_POLL_MS);
pollBuy();
pollSell();
