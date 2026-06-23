// shreem-live-worker.js — Shreem Brzee v11
// v11 — HELIUS WEBSOCKET: persistent connection streams whale txs in real time
// BUY detection: Helius WS → parse swap inline → call webhook to execute
// SELL detection: poll signals every 10s + Helius WS SELL detection
// Latency: ~100-300ms from whale buy to our buy (vs 2-5min before)

const https  = require('https');
const http   = require('http');
const WS     = require('ws'); // pre-installed on Hetzner

const SUPABASE_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const HELIUS_KEY    = process.env.HELIUS_API_KEY || '7de253c3-49e2-42be-9672-23a761260f86';
const WEBHOOK_URL   = `${SUPABASE_URL}/functions/v1/shreem-helius-webhook`;
const PORT          = 3001;
const SELL_POLL_MS  = 10000; // Check SELL signals every 10s

const WHALE_WALLETS = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT':  'trunoest',
  'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm': 'gake',
};

if (!SUPABASE_KEY) { console.error('[shreem] FATAL: SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }
if (!HELIUS_KEY)   { console.warn('[shreem] WARNING: HELIUS_API_KEY not set — websocket disabled'); }

console.log('[shreem] v11 WEBSOCKET — real-time whale detection');
console.log('[shreem] SUPABASE_KEY prefix:', SUPABASE_KEY.slice(0,20) + '...');
console.log('[shreem] HELIUS_KEY prefix:', (HELIUS_KEY||'').slice(0,8) + '...');

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

const sbGet   = (t, f) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HEADERS).then(r => r.data);
const sbPatch = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);

async function callExecutor(body) {
  const r = await httpReq(`${SUPABASE_URL}/functions/v1/shreem-live-executor`, 'POST', body,
    { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
  return r.data;
}

// ── Forward tx to webhook for processing ─────────────────────────────────────
// The webhook has all the parsing logic — we just forward the raw tx
async function forwardToWebhook(txData) {
  try {
    const r = await httpReq(WEBHOOK_URL, 'POST', [txData],
      { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
    console.log(`[ws→webhook] forwarded tx → ${JSON.stringify(r.data).slice(0,80)}`);
  } catch (e) {
    console.error('[ws→webhook] failed:', e.message);
  }
}

// ── Helius Websocket ──────────────────────────────────────────────────────────
let wsConn = null;
let wsReconnectTimer = null;
let wsAlive = false;

function connectHeliusWS() {
  if (!HELIUS_KEY) return;
  if (wsConn) { try { wsConn.terminate(); } catch {} }

  const wsUrl = `wss://atlas-mainnet.helius-rpc.com?api-key=${HELIUS_KEY}`;
  console.log('[ws] Connecting to Helius websocket...');

  wsConn = new WS(wsUrl);

  wsConn.on('open', () => {
    wsAlive = true;
    console.log('[ws] ✅ Connected to Helius');

    // Subscribe to all whale wallet account updates
    const wallets = Object.keys(WHALE_WALLETS);
    const subMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'transactionSubscribe',
      params: [
        {
          accountInclude: wallets,
          failed: false,
        },
        {
          commitment: 'confirmed',
          encoding: 'jsonParsed',
          transactionDetails: 'full',
          maxSupportedTransactionVersion: 0,
        }
      ]
    };
    wsConn.send(JSON.stringify(subMsg));
    console.log(`[ws] Subscribed to ${wallets.length} whale wallets`);
  });

  wsConn.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Subscription confirmation
      if (msg.result !== undefined && msg.id === 1) {
        console.log(`[ws] Subscription confirmed: ${msg.result}`);
        return;
      }

      // Transaction notification
      if (msg.method === 'transactionNotification') {
        const tx = msg.params?.result?.transaction;
        const sig = msg.params?.result?.signature;
        if (!tx || !sig) return;

        // Find which whale triggered this
        const acctKeys = tx.transaction?.message?.accountKeys?.map(k =>
          typeof k === 'string' ? k : k?.pubkey
        ) || [];

        const whale = acctKeys.find(k => WHALE_WALLETS[k]);
        if (!whale) return;

        console.log(`[ws] 🔱 ${WHALE_WALLETS[whale]} tx detected: ${sig.slice(0,16)} — forwarding instantly`);

        // Forward immediately to webhook for execution
        // Webhook has all parsing logic — no duplication needed here
        const txPayload = {
          ...tx,
          signature: sig,
          feePayer: whale,
          timestamp: Math.floor(Date.now() / 1000),
        };

        // Fire and forget — don't await, need to process next tx immediately
        forwardToWebhook(txPayload);
      }
    } catch (e) {
      console.error('[ws] message parse error:', e.message);
    }
  });

  wsConn.on('ping', () => wsConn.pong());

  wsConn.on('error', (e) => {
    console.error('[ws] error:', e.message);
    wsAlive = false;
  });

  wsConn.on('close', (code) => {
    wsAlive = false;
    console.log(`[ws] disconnected (${code}) — reconnecting in 5s`);
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    wsReconnectTimer = setTimeout(connectHeliusWS, 5000);
  });
}

// Keep websocket alive with ping every 30s
setInterval(() => {
  if (wsConn && wsConn.readyState === WS.OPEN) {
    wsConn.ping();
  }
}, 30000);

// ── SELL POLL ─────────────────────────────────────────────────────────────────
let sellBusy = false;
async function pollSell() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    // Whale SELL mirror
    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&or=(live_processed.eq.false,live_processed.is.null)&order=created_at.asc&limit=10');

    for (const sig of sellSignals) {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${sig.mint}&select=id,symbol`);

      if (!openTrades.length) {
        await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
        continue;
      }

      console.log(`[pollSell] ${sig.label} SELL ${sig.symbol||sig.mint.slice(0,8)} — closing`);
      try {
        const result = await callExecutor({ action: 'close', trade_id: openTrades[0].id, mint: sig.mint, reason: 'whale_sell_mirror' });
        if (result?.ok) {
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
          console.log(`[pollSell] ✅ closed ${sig.symbol||sig.mint.slice(0,8)}`);
        }
      } catch (e) { console.error('[pollSell] executor failed:', e.message); }
    }

    // Stop-loss check
    const openAll = await sbGet('shreem_brzee_live_trades',
      'status=eq.open&select=id,mint,symbol,entry_price,opened_at,amount_sol');

    for (const pos of openAll) {
      // 48h timeout
      if (pos.opened_at && (Date.now() - new Date(pos.opened_at).getTime()) > 48*3600000) {
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'timeout_48h' }); } catch {}
        continue;
      }
      if (!pos.entry_price || !pos.mint) continue;

      // Price check — use DexScreener (not dead lite-api)
      let price = 0;
      try {
        const r = await httpReq(`https://api.jup.ag/price/v2?ids=${pos.mint}`);
        if (r.data?.data) price = parseFloat(Object.values(r.data.data)[0]?.price||0);
      } catch {}

      if (!price) continue;
      const changePct = ((price - Number(pos.entry_price)) / Number(pos.entry_price)) * 100;
      if (changePct <= -30) {
        console.log(`[stoploss] ${pos.symbol} down ${changePct.toFixed(1)}% — closing`);
        try { await callExecutor({ action: 'close', trade_id: pos.id, reason: 'stoploss_30pct' }); } catch {}
      }
    }

  } catch (e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── Health check ──────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  let execHealth = {};
  try {
    const r = await httpReq(`${SUPABASE_URL}/functions/v1/shreem-live-executor/health`,
      'GET', null, { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
    execHealth = r.data;
  } catch {}

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:    'running',
    version:   'v11-websocket',
    uptime:    Math.floor(process.uptime()),
    sb_key_ok: !!SUPABASE_KEY,
    helius_key_ok: !!HELIUS_KEY,
    ws_connected: wsAlive,
    executor:  execHealth,
    time:      new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

// ── Start ─────────────────────────────────────────────────────────────────────
connectHeliusWS();
setInterval(pollSell, SELL_POLL_MS);
pollSell();

console.log('[shreem] v11 running — websocket + sell poll active');
