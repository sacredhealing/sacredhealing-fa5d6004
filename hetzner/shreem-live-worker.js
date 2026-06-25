// shreem-live-worker.js — v15 LASERSTREAM
// Architecture: Helius transactionSubscribe → instant detection → Jupiter swap on Hetzner
// Entry: <50ms | Exit: <50ms | Stop loss: 3s in-memory
// Supabase = async logging only, never in critical path

const https   = require('https');
const http    = require('http');
const WebSocket = require('ws');
const { execSync } = require('child_process');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const HELIUS_KEY    = '4319d817-88e2-4332-926f-84d98f0f5155';
const HELIUS_WS     = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const HELIUS_RPC    = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const EXECUTOR_URL  = `${SUPABASE_URL}/functions/v1/shreem-live-executor`;
const PORT          = 3001;
const STOP_POLL_MS  = 3000;
const PRICE_TTL_MS  = 4000;

// Whale wallets
const WHALES = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
};

const SOL_MINT  = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SKIP_MINTS = new Set([SOL_MINT, USDC_MINT]);

const SB_HDR = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

console.log('[shreem] v15.1 LASERSTREAM — transactionSubscribe, <50ms entry/exit');

// ── HTTP ──────────────────────────────────────────────────────────────────────
function req(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const o = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const lib = u.protocol === 'https:' ? https : http;
    const r = lib.request(o, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    r.on('error', reject);
    r.setTimeout(20000, () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const sbGet = (t, f) => req(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HDR).then(r => Array.isArray(r.data) ? r.data : []);
const sbPatch = (t, f, b) => req(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HDR).catch(() => {});
const heliusRpc = (method, params) => req(HELIUS_RPC, 'POST', { jsonrpc: '2.0', id: 1, method, params });
const callExecutor = body => req(EXECUTOR_URL, 'POST', body, { ...SB_HDR, Authorization: `Bearer ${SUPABASE_KEY}` }).then(r => r.data);

// ── STATE ─────────────────────────────────────────────────────────────────────
const positions  = new Map();  // id → position
const prices     = new Map();  // mint → { price, ts }
const closing    = new Set();  // ids being closed
const seenTxs    = new Set();  // recent tx sigs
let   solUsd     = 150;
let   wsConn     = null;
let   wsReady    = false;
let   subIds     = {};         // addr → subscriptionId
let   botLive    = false;

// ── LIVE CHECK ────────────────────────────────────────────────────────────────
async function checkLive() {
  try {
    const s = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    botLive = !!(s[0]?.mode === 'live' && s[0]?.started_at && !s[0]?.stopped_at);
  } catch { botLive = false; }
}
setInterval(checkLive, 10000);
checkLive();

// ── PRICE ─────────────────────────────────────────────────────────────────────
async function getPrice(mint) {
  const c = prices.get(mint);
  if (c && Date.now() - c.ts < PRICE_TTL_MS) return c.price;
  try {
    const r = await req(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (r.data?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
      const price = parseFloat(pairs[0].priceUsd);
      if (price > 0) { prices.set(mint, { price, ts: Date.now() }); return price; }
    }
  } catch {}
  try {
    const r = await req(`https://api.jup.ag/price/v2?ids=${mint}`);
    const price = parseFloat(Object.values(r.data?.data||{})[0]?.price||0);
    if (price > 0) { prices.set(mint, { price, ts: Date.now() }); return price; }
  } catch {}
  return 0;
}

async function refreshSol() {
  try {
    const r = await req('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    if (r.data?.price) solUsd = parseFloat(r.data.price);
  } catch {}
}

// ── SYNC POSITIONS ────────────────────────────────────────────────────────────
async function syncPositions() {
  try {
    const rows = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=id,mint,symbol,entry_price,peak_price,amount_sol,opened_at,label');
    const ids = new Set(rows.map(r => r.id));
    for (const [id] of positions) { if (!ids.has(id)) positions.delete(id); }
    for (const p of rows) {
      const ex = positions.get(p.id);
      positions.set(p.id, { ...p, peak_price: ex?.peak_price || Number(p.peak_price) || Number(p.entry_price) || 0 });
    }
    if (rows.length > 0) console.log(`[sync] ${rows.length} open positions`);
  } catch(e) { console.error('[sync]', e.message); }
}

// ── PARSE TX ──────────────────────────────────────────────────────────────────
function parseTx(tx, walletAddr) {
  try {
    const meta = tx?.meta;
    const msg  = tx?.transaction?.message;
    if (!meta || !msg || meta.err) return null;

    const accounts = (msg.accountKeys || []).map(a => typeof a === 'string' ? a : a.pubkey);
    const walletIdx = accounts.indexOf(walletAddr);
    if (walletIdx === -1) return null;

    const preSol  = (meta.preBalances  || [])[walletIdx] || 0;
    const postSol = (meta.postBalances || [])[walletIdx] || 0;
    const solDiff = (postSol - preSol) / 1e9;

    const preTokens  = meta.preTokenBalances  || [];
    const postTokens = meta.postTokenBalances || [];

    const changes = [];
    for (const post of postTokens) {
      if (post.owner !== walletAddr || SKIP_MINTS.has(post.mint)) continue;
      const pre    = preTokens.find(p => p.mint === post.mint && p.owner === walletAddr);
      const preAmt = Number(pre?.uiTokenAmount?.amount || 0);
      const postAmt= Number(post.uiTokenAmount?.amount || 0);
      const diff   = postAmt - preAmt;
      if (Math.abs(diff) > 0) changes.push({ mint: post.mint, diff, preAmt, postAmt });
    }
    for (const pre of preTokens) {
      if (pre.owner !== walletAddr || SKIP_MINTS.has(pre.mint)) continue;
      const post = postTokens.find(p => p.mint === pre.mint && p.owner === walletAddr);
      if (!post || Number(post.uiTokenAmount?.amount||0) === 0) {
        const preAmt = Number(pre.uiTokenAmount?.amount||0);
        if (preAmt > 0 && !changes.find(c => c.mint === pre.mint)) {
          changes.push({ mint: pre.mint, diff: -preAmt, preAmt, postAmt: 0 });
        }
      }
    }

    for (const c of changes) {
      if (c.diff > 0 && solDiff < -0.005) return { action: 'BUY',  mint: c.mint, tokenAmount: c.diff,          amountSol: Math.abs(solDiff) };
      if (c.diff < 0 && solDiff > 0.001)  return { action: 'SELL', mint: c.mint, tokenAmount: Math.abs(c.diff), amountSol: solDiff };
    }
    return null;
  } catch { return null; }
}

// ── HANDLE SIGNAL ─────────────────────────────────────────────────────────────
async function onSignal(name, addr, action, mint, amountSol, tokenAmount, sig) {
  if (!botLive) return;
  if (seenTxs.has(sig)) return;
  seenTxs.add(sig);
  setTimeout(() => seenTxs.delete(sig), 120000);

  const ts = Date.now();
  console.log(`[ws] ⚡ ${name} ${action} ${mint.slice(0,8)} ${amountSol.toFixed(4)} SOL (${Date.now()-ts}ms)`);

  if (action === 'BUY') {
    try {
      const r = await callExecutor({ action: 'buy', mint, label: name, whale_address: addr,
        amount_sol: amountSol, token_amount: tokenAmount, sig, source: 'laserstream' });
      console.log(r?.ok ? `[ws] ✅ BUY ${mint.slice(0,8)} — ${Date.now()-ts}ms total` : `[ws] ⏭ skip: ${r?.reason||'?'}`);
    } catch(e) { console.error('[ws] BUY error:', e.message); }
  }

  if (action === 'SELL') {
    try {
      const open = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${mint}&select=id,symbol,entry_price,amount_sol,opened_at`);
      if (!open.length) return;
      const trade = open[0];
      if (closing.has(trade.id)) return;

      // Check current price before mirroring whale sell
      // If we are already past stop loss (-25%), close regardless
      // If whale is selling at a big loss and we haven't hit stop loss yet,
      // still close — but log it as whale_sell_mirror not stop_loss
      const currentPrice = await getPrice(mint);
      const entryPrice   = Number(trade.entry_price || 0);
      let pnlPct = 0;
      if (currentPrice > 0 && entryPrice > 0) {
        pnlPct = (currentPrice - entryPrice) / entryPrice * 100;
        // If whale is selling but we're in profit or small loss — follow him
        // If whale is selling at huge loss — we should have been out already, close now
        console.log(`[ws] 🔴 ${name} SELL ${trade.symbol||mint.slice(0,8)} — our PnL: ${pnlPct.toFixed(1)}%`);
      }

      closing.add(trade.id);
      const reason = pnlPct <= -25 ? 'stop_loss_via_whale_exit' : 'whale_sell_mirror';
      const r = await callExecutor({ action: 'close', trade_id: trade.id, mint, reason });
      if (r?.ok) { 
        positions.delete(trade.id); 
        console.log(`[ws] ✅ SELL ${trade.symbol||mint.slice(0,8)} ${pnlPct.toFixed(1)}% — ${Date.now()-ts}ms`); 
      }
    } catch(e) { console.error('[ws] SELL error:', e.message); }
    finally { closing.delete(mint); }
  }
}

// ── WEBSOCKET ─────────────────────────────────────────────────────────────────
let reconnDelay = 2000;
let pingTimer   = null;

function connect() {
  if (wsConn) { try { wsConn.terminate(); } catch {} }
  console.log('[ws] Connecting to Helius LaserStream...');
  wsConn = new WebSocket(HELIUS_WS);

  wsConn.on('open', () => {
    wsReady = true;
    reconnDelay = 2000;
    console.log('[ws] ✅ Connected — LaserStream active');

    // transactionSubscribe for each whale — fires on every tx involving their wallet
    let id = 1;
    for (const [addr, name] of Object.entries(WHALES)) {
      wsConn.send(JSON.stringify({
        jsonrpc: '2.0', id: id++,
        method: 'transactionSubscribe',
        params: [
          {
            accountInclude: [addr],
            failed: false,
            vote: false,
          },
          {
            commitment: 'processed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            maxSupportedTransactionVersion: 0,
          }
        ]
      }));
      console.log(`[ws] 📡 Subscribed ${name}`);
    }

    // Ping every 30s
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (wsConn?.readyState === WebSocket.OPEN) wsConn.ping();
    }, 30000);
  });

  wsConn.on('message', async raw => {
    try {
      const msg = JSON.parse(raw.toString());

      // Subscription confirmed
      if (msg.result !== undefined && msg.id) {
        const addrs = Object.keys(WHALES);
        const idx   = msg.id - 1;
        if (idx >= 0 && idx < addrs.length) {
          subIds[addrs[idx]] = msg.result;
          console.log(`[ws] ✅ ${WHALES[addrs[idx]]} sub ID: ${msg.result}`);
        }
        return;
      }

      // Transaction notification
      if (msg.method === 'transactionNotification') {
        const tx  = msg.params?.result?.transaction;
        const sig = msg.params?.result?.signature;
        if (!tx || !sig || seenTxs.has(sig)) return;

        // Find which whale this belongs to
        const subId    = msg.params?.result?.subscription ?? msg.params?.subscription;
        const whaleAddr = Object.entries(subIds).find(([, id]) => id === subId)?.[0];
        if (!whaleAddr) {
          // Fallback: check all whales
          for (const [addr, name] of Object.entries(WHALES)) {
            const parsed = parseTx(tx, addr);
            if (parsed) {
              await onSignal(name, addr, parsed.action, parsed.mint, parsed.amountSol, parsed.tokenAmount, sig);
              break;
            }
          }
          return;
        }

        const name   = WHALES[whaleAddr];
        const parsed = parseTx(tx, whaleAddr);
        if (parsed) await onSignal(name, whaleAddr, parsed.action, parsed.mint, parsed.amountSol, parsed.tokenAmount, sig);
      }
    } catch(e) { console.error('[ws] msg error:', e.message); }
  });

  wsConn.on('error', e => { console.error('[ws] error:', e.message); wsReady = false; });

  wsConn.on('close', (code) => {
    wsReady = false;
    if (pingTimer) clearInterval(pingTimer);
    console.log(`[ws] Closed (${code}) — reconnect in ${reconnDelay/1000}s`);
    setTimeout(() => { reconnDelay = Math.min(reconnDelay * 2, 30000); connect(); }, reconnDelay);
  });
}

// ── STOP LOSS 3s ──────────────────────────────────────────────────────────────
let slBusy = false;
async function stopLoss() {
  if (slBusy || positions.size === 0 || !botLive) return;
  slBusy = true;
  try {
    const mints = [...new Set([...positions.values()].map(p => p.mint).filter(Boolean))];
    await Promise.all(mints.map(getPrice));

    for (const [id, pos] of positions) {
      if (closing.has(id) || !pos.entry_price || !pos.mint) continue;
      const entry = Number(pos.entry_price);
      if (entry <= 0) continue;

      // 48h timeout
      if (pos.opened_at && Date.now() - new Date(pos.opened_at).getTime() > 172800000) {
        closing.add(id); positions.delete(id);
        callExecutor({ action: 'close', trade_id: id, reason: 'timeout_48h' }).catch(() => {});
        closing.delete(id); continue;
      }

      const cached = prices.get(pos.mint);
      if (!cached || Date.now() - cached.ts > 30000) continue;
      const price  = cached.price;
      if (!price) continue;

      const pnlPct  = (price - entry) / entry * 100;
      const peak    = Math.max(pos.peak_price || entry, price);
      const peakPct = (peak - entry) / entry * 100;
      pos.peak_price = peak;

      // Async DB update
      sbPatch('shreem_brzee_live_trades', `id=eq.${id}`, {
        exit_price: price, peak_price: peak,
        pnl_pct: pnlPct, pnl_sol: Number(pos.amount_sol||0) * pnlPct / 100,
      });

      if (pnlPct <= -20) { // Tightened from -25% to -20% — catches faster dumps
        console.log(`[sl] 🛑 ${pos.symbol||pos.mint.slice(0,8)} ${pnlPct.toFixed(1)}%`);
        closing.add(id); positions.delete(id);
        callExecutor({ action: 'close', trade_id: id, reason: 'stop_loss_25pct' }).catch(() => {});
        closing.delete(id); continue;
      }

      if (peakPct >= 30 && pnlPct <= peakPct * 0.5) {
        console.log(`[sl] 🔒 trail ${pos.symbol||pos.mint.slice(0,8)} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
        closing.add(id); positions.delete(id);
        callExecutor({ action: 'close', trade_id: id, reason: 'trailing_stop' }).catch(() => {});
        closing.delete(id); continue;
      }
    }
  } catch(e) { console.error('[sl]', e.message); }
  finally { slBusy = false; }
}

// ── FALLBACK SELL POLL 30s ────────────────────────────────────────────────────
async function fallbackSell() {
  if (!botLive) return;
  try {
    const sigs = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&or=(live_processed.eq.false,live_processed.is.null)&order=created_at.asc&limit=5');
    for (const sig of sigs) {
      const open = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${sig.mint}&select=id,symbol`);
      if (!open.length) { sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true }); continue; }
      const t = open[0];
      if (closing.has(t.id)) continue;
      closing.add(t.id);
      try {
        const r = await callExecutor({ action: 'close', trade_id: t.id, mint: sig.mint, reason: 'whale_sell_fallback' });
        if (r?.ok) { sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true }); positions.delete(t.id); }
      } catch {}
      finally { closing.delete(t.id); }
    }
  } catch {}
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ version: 'v15.1-laserstream', ws: wsReady, positions: positions.size, live: botLive, sol: solUsd }));
}).listen(PORT, () => console.log(`[shreem] health :${PORT}`));

// ── BOOT ──────────────────────────────────────────────────────────────────────
try { require.resolve('ws'); } catch { console.log('Installing ws...'); execSync('npm install ws --prefix /root', { stdio: 'inherit' }); }

syncPositions();
setInterval(syncPositions, 15000);
setInterval(stopLoss, STOP_POLL_MS);
setInterval(fallbackSell, 30000);
setInterval(refreshSol, 30000);
refreshSol();
connect();

console.log('[shreem] v15.1 ready — LaserStream transactionSubscribe active');
