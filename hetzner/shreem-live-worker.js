// shreem-live-worker.js — v14 WEBSOCKET
// Architecture: Helius Enhanced WebSocket → instant detection → Jupiter swap on Hetzner
// No Supabase cold starts. No 7s polling for exits. Everything in memory.
// Entry: <100ms | Exit: <100ms | Stop loss: 3s in-memory

const https  = require('https');
const http   = require('http');
const WebSocket = require('ws');

const SUPABASE_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const HELIUS_KEY    = '7de253c3-49e2-42be-9672-23a761260f86';
const HELIUS_WS_URL = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const EXECUTOR_URL  = `${SUPABASE_URL}/functions/v1/shreem-live-executor`;
const PORT          = 3001;
const STOP_POLL_MS  = 3000;
const PRICE_TTL_MS  = 4000;

// Whale wallets to track
const WHALE_WALLETS = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
};

const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

console.log('[shreem] v14 WEBSOCKET — Helius WS + instant entry/exit');

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

const sbGet   = (t, f) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HEADERS).then(r => Array.isArray(r.data) ? r.data : []);
const sbPatch = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);
const sbInsert = (t, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}`, 'POST', b, { ...SB_HEADERS, Prefer: 'return=minimal' });

async function callExecutor(body) {
  const r = await httpReq(EXECUTOR_URL, 'POST', body, { ...SB_HEADERS, Authorization: `Bearer ${SUPABASE_KEY}` });
  return r.data;
}

// ── IN-MEMORY STATE ───────────────────────────────────────────────────────────
const positionCache = new Map(); // id → position
const priceCache    = new Map(); // mint → { price, updatedAt }
const closingSet    = new Set(); // ids currently being closed
const recentTxs     = new Set(); // recent tx sigs to prevent duplicates
let   solUsd        = 150;
let   wsConn        = null;
let   wsReady       = false;

// ── PRICE FETCHER ─────────────────────────────────────────────────────────────
async function fetchPrice(mint) {
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.updatedAt < PRICE_TTL_MS) return cached.price;
  try {
    const r = await httpReq(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (r.data?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
      const price = parseFloat(pairs[0].priceUsd);
      if (price > 0) { priceCache.set(mint, { price, updatedAt: Date.now() }); return price; }
    }
  } catch {}
  try {
    const r = await httpReq(`https://api.jup.ag/price/v2?ids=${mint}`);
    const price = parseFloat(Object.values(r.data?.data || {})[0]?.price || 0);
    if (price > 0) { priceCache.set(mint, { price, updatedAt: Date.now() }); return price; }
  } catch {}
  return 0;
}

async function refreshSolPrice() {
  try {
    const r = await httpReq('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    if (r.data?.price) solUsd = parseFloat(r.data.price);
  } catch {}
}

// ── SYNC POSITIONS FROM DB ────────────────────────────────────────────────────
async function syncPositions() {
  try {
    const positions = await sbGet('shreem_brzee_live_trades',
      'status=eq.open&select=id,mint,symbol,entry_price,peak_price,amount_sol,opened_at,label');
    const dbIds = new Set(positions.map(p => p.id));
    for (const [id] of positionCache) { if (!dbIds.has(id)) positionCache.delete(id); }
    for (const pos of positions) {
      const existing = positionCache.get(pos.id);
      positionCache.set(pos.id, {
        ...pos,
        peak_price: existing?.peak_price || Number(pos.peak_price) || Number(pos.entry_price) || 0,
      });
    }
    if (positions.length > 0) console.log(`[cache] ${positions.length} positions synced`);
  } catch(e) { console.error('[cache] sync error:', e.message); }
}

// ── CHECK IF BOT IS LIVE ──────────────────────────────────────────────────────
async function isLive() {
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const s = sessions[0];
    return s && s.mode === 'live' && s.started_at && !s.stopped_at;
  } catch { return false; }
}

// ── PARSE HELIUS TRANSACTION ──────────────────────────────────────────────────
// Detect if a wallet is buying or selling a token
function parseWhaleAction(tx, walletAddr) {
  try {
    const meta = tx?.meta;
    const msg  = tx?.transaction?.message;
    if (!meta || !msg) return null;
    if (meta.err) return null; // failed tx

    const accounts = msg.accountKeys || [];
    const walletIdx = accounts.findIndex(a => 
      (typeof a === 'string' ? a : a.pubkey) === walletAddr
    );
    if (walletIdx === -1) return null;

    // Look at token balance changes
    const preTokens  = meta.preTokenBalances  || [];
    const postTokens = meta.postTokenBalances || [];

    // SOL balance change for this wallet
    const preSol  = (meta.preBalances  || [])[walletIdx] || 0;
    const postSol = (meta.postBalances || [])[walletIdx] || 0;
    const solDiff = (postSol - preSol) / 1e9;

    // Find token changes
    const tokenChanges = [];
    for (const post of postTokens) {
      if (post.owner !== walletAddr) continue;
      const pre = preTokens.find(p => p.mint === post.mint && p.owner === walletAddr);
      const preAmt  = Number(pre?.uiTokenAmount?.amount  || 0);
      const postAmt = Number(post.uiTokenAmount?.amount || 0);
      const diff = postAmt - preAmt;
      if (Math.abs(diff) > 0) {
        tokenChanges.push({ mint: post.mint, diff, preAmt, postAmt });
      }
    }

    // Also check tokens that disappeared (went to 0)
    for (const pre of preTokens) {
      if (pre.owner !== walletAddr) continue;
      const post = postTokens.find(p => p.mint === pre.mint && p.owner === walletAddr);
      if (!post || Number(post.uiTokenAmount?.amount || 0) === 0) {
        const preAmt = Number(pre.uiTokenAmount?.amount || 0);
        if (preAmt > 0) tokenChanges.push({ mint: pre.mint, diff: -preAmt, preAmt, postAmt: 0 });
      }
    }

    if (!tokenChanges.length) return null;

    // Determine action
    for (const tc of tokenChanges) {
      // Skip SOL/USDC
      if (['So11111111111111111111111111111111111111112',
           'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'].includes(tc.mint)) continue;

      if (tc.diff > 0 && solDiff < -0.01) {
        // Bought token with SOL
        return {
          action: 'BUY',
          mint: tc.mint,
          tokenAmount: tc.diff,
          amountSol: Math.abs(solDiff),
          sig: tx.transaction?.signatures?.[0],
        };
      }
      if (tc.diff < 0 && solDiff > 0.005) {
        // Sold token for SOL
        return {
          action: 'SELL',
          mint: tc.mint,
          tokenAmount: Math.abs(tc.diff),
          amountSol: solDiff,
          sig: tx.transaction?.signatures?.[0],
        };
      }
    }
    return null;
  } catch(e) {
    console.error('[parse] error:', e.message);
    return null;
  }
}

// ── HANDLE WHALE SIGNAL ───────────────────────────────────────────────────────
async function handleWhaleSignal(whaleName, walletAddr, action, mint, amountSol, tokenAmount, sig) {
  if (!(await isLive())) return;
  if (recentTxs.has(sig)) return; // dedup
  recentTxs.add(sig);
  setTimeout(() => recentTxs.delete(sig), 60000); // cleanup after 1min

  console.log(`[ws] 🐋 ${whaleName} ${action} ${mint.slice(0,8)} — ${amountSol.toFixed(4)} SOL`);

  if (action === 'BUY') {
    // Fire buy immediately via executor
    try {
      const result = await callExecutor({
        action: 'buy',
        mint,
        label: whaleName,
        whale_address: walletAddr,
        amount_sol: amountSol,
        token_amount: tokenAmount,
        sig,
        source: 'websocket',
      });
      if (result?.ok) {
        console.log(`[ws] ✅ BUY executed — ${mint.slice(0,8)}`);
      } else {
        console.log(`[ws] ⏭ BUY skipped — ${result?.reason || 'unknown'}`);
      }
    } catch(e) { console.error('[ws] BUY error:', e.message); }
  }

  if (action === 'SELL') {
    // Find open position for this mint and close immediately
    try {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${mint}&select=id,symbol`);
      if (!openTrades.length) return;
      const trade = openTrades[0];
      if (closingSet.has(trade.id)) return;
      closingSet.add(trade.id);
      console.log(`[ws] 🔴 ${whaleName} SELL detected — closing ${trade.symbol || mint.slice(0,8)} immediately`);
      const result = await callExecutor({
        action: 'close',
        trade_id: trade.id,
        mint,
        reason: 'whale_sell_mirror',
      });
      if (result?.ok) {
        positionCache.delete(trade.id);
        console.log(`[ws] ✅ SELL executed — ${trade.symbol || mint.slice(0,8)}`);
      }
    } catch(e) { console.error('[ws] SELL error:', e.message); }
    finally { closingSet.delete(/* will be set above */ ''); }
  }
}

// ── HELIUS WEBSOCKET CONNECTION ───────────────────────────────────────────────
let subIds = {};
let reconnectTimer = null;
let reconnectDelay = 2000;

function connectWebSocket() {
  if (wsConn) { try { wsConn.terminate(); } catch {} }
  console.log('[ws] Connecting to Helius Enhanced WebSocket...');

  wsConn = new WebSocket(HELIUS_WS_URL);

  wsConn.on('open', () => {
    wsReady = true;
    reconnectDelay = 2000;
    console.log('[ws] ✅ Connected to Helius');

    // Subscribe to each whale wallet using logsSubscribe
    // This fires on every transaction involving the wallet
    let subId = 1;
    for (const [addr, name] of Object.entries(WHALE_WALLETS)) {
      const msg = {
        jsonrpc: '2.0',
        id: subId++,
        method: 'logsSubscribe',
        params: [
          { mentions: [addr] },
          { commitment: 'processed' }
        ]
      };
      wsConn.send(JSON.stringify(msg));
      console.log(`[ws] 📡 Subscribed to ${name} (${addr.slice(0,8)}...)`);
    }
  });

  wsConn.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      
      // Subscription confirmation
      if (msg.result && typeof msg.result === 'number') {
        console.log(`[ws] Subscription confirmed: ${msg.result}`);
        return;
      }

      // Transaction notification
      if (msg.method === 'logsNotification') {
        const value = msg.params?.result?.value;
        if (!value) return;

        const logs = value.logs || [];
        const sig  = value.signature;
        if (!sig || recentTxs.has(sig)) return;

        // Check if this involves any of our whale wallets
        // The logs mention the accounts involved
        for (const [addr, name] of Object.entries(WHALE_WALLETS)) {
          // Quick check — does any log mention this is a swap?
          const isSwap = logs.some(l => 
            l.includes('Program log: Instruction: Swap') ||
            l.includes('Program JUP') ||
            l.includes('Program log: ray_log') ||
            l.includes('Program log: Instruction: Buy') ||
            l.includes('Program log: Instruction: Sell')
          );
          if (!isSwap) continue;

          // Fetch full transaction to parse token changes
          try {
            const txRes = await httpReq('https://mainnet.helius-rpc.com/?api-key=' + HELIUS_KEY, 'POST', {
              jsonrpc: '2.0', id: 1,
              method: 'getTransaction',
              params: [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
            });
            const tx = txRes.data?.result;
            if (!tx) continue;

            const parsed = parseWhaleAction(tx, addr);
            if (parsed) {
              await handleWhaleSignal(name, addr, parsed.action, parsed.mint, 
                parsed.amountSol, parsed.tokenAmount, parsed.sig || sig);
            }
          } catch(e) { console.error('[ws] getTransaction error:', e.message); }
        }
      }
    } catch(e) { console.error('[ws] parse error:', e.message); }
  });

  wsConn.on('error', (e) => {
    console.error('[ws] error:', e.message);
    wsReady = false;
  });

  wsConn.on('close', (code, reason) => {
    wsReady = false;
    console.log(`[ws] Disconnected (${code}) — reconnecting in ${reconnectDelay/1000}s...`);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      connectWebSocket();
    }, reconnectDelay);
  });

  // Ping every 30s to keep connection alive
  setInterval(() => {
    if (wsConn && wsConn.readyState === WebSocket.OPEN) {
      wsConn.ping();
    }
  }, 30000);
}

// ── STOP LOSS (3s in-memory, unchanged from v13) ──────────────────────────────
let stopBusy = false;
async function pollStopLoss() {
  if (stopBusy || positionCache.size === 0) return;
  stopBusy = true;
  try {
    if (!(await isLive())) return;

    const mints = [...new Set([...positionCache.values()].map(p => p.mint).filter(Boolean))];
    await Promise.all(mints.map(fetchPrice));

    for (const [id, pos] of positionCache) {
      if (closingSet.has(id) || !pos.entry_price || !pos.mint) continue;
      const entry = Number(pos.entry_price);
      if (entry <= 0) continue;

      // 48h timeout
      if (pos.opened_at && (Date.now() - new Date(pos.opened_at).getTime()) > 48 * 3600000) {
        closingSet.add(id);
        positionCache.delete(id);
        try { await callExecutor({ action: 'close', trade_id: id, reason: 'timeout_48h' }); } catch {}
        closingSet.delete(id);
        continue;
      }

      const cached = priceCache.get(pos.mint);
      if (!cached || Date.now() - cached.updatedAt > 30000) continue;
      const price = cached.price;
      if (!price || price <= 0) continue;

      const pnlPct  = (price - entry) / entry * 100;
      const peak    = Math.max(pos.peak_price || entry, price);
      const peakPct = (peak - entry) / entry * 100;
      pos.peak_price = peak;

      // Update DB non-blocking
      sbPatch('shreem_brzee_live_trades', `id=eq.${id}`, {
        exit_price: price, peak_price: peak,
        pnl_pct: pnlPct,
        pnl_sol: Number(pos.amount_sol || 0) * (pnlPct / 100),
      }).catch(() => {});

      // Hard stop -25%
      if (pnlPct <= -25) {
        console.log(`[stopLoss] 🛑 ${pos.symbol||pos.mint.slice(0,8)} ${pnlPct.toFixed(1)}%`);
        closingSet.add(id); positionCache.delete(id);
        try { await callExecutor({ action: 'close', trade_id: id, reason: 'stop_loss_25pct' }); } catch {}
        closingSet.delete(id);
        continue;
      }

      // Trailing stop: peak >= 30%, protect 50% of gains
      if (peakPct >= 30 && pnlPct <= peakPct * 0.5) {
        console.log(`[trailStop] 🔒 ${pos.symbol||pos.mint.slice(0,8)} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
        closingSet.add(id); positionCache.delete(id);
        try { await callExecutor({ action: 'close', trade_id: id, reason: 'trailing_stop' }); } catch {}
        closingSet.delete(id);
        continue;
      }
    }
  } catch(e) { console.error('[stopLoss] error:', e.message); }
  finally { stopBusy = false; }
}

// ── FALLBACK SELL POLL (every 30s — backup only, WS handles exits now) ────────
let sellBusy = false;
async function pollSellFallback() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    if (!(await isLive())) return;
    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&or=(live_processed.eq.false,live_processed.is.null)&order=created_at.asc&limit=5');
    for (const sig of sellSignals) {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${sig.mint}&select=id,symbol`);
      if (!openTrades.length) {
        await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
        continue;
      }
      const trade = openTrades[0];
      if (closingSet.has(trade.id)) continue;
      closingSet.add(trade.id);
      try {
        const result = await callExecutor({ action: 'close', trade_id: trade.id, mint: sig.mint, reason: 'whale_sell_mirror_fallback' });
        if (result?.ok) {
          await sbPatch('shreem_brzee_signals', `sig=eq.${encodeURIComponent(sig.sig)}`, { live_processed: true });
          positionCache.delete(trade.id);
          console.log(`[fallback] ✅ closed ${trade.symbol||sig.mint.slice(0,8)}`);
        }
      } catch(e) { console.error('[fallback] error:', e.message); }
      finally { closingSet.delete(trade.id); }
    }
  } catch(e) { console.error('[fallback] error:', e.message); }
  finally { sellBusy = false; }
}

// ── HEALTH SERVER ─────────────────────────────────────────────────────────────
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:    'running',
    version:   'v14-websocket',
    uptime:    Math.floor(process.uptime()),
    ws_connected: wsReady,
    positions: positionCache.size,
    sol_usd:   solUsd,
    time:      new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

// ── START ─────────────────────────────────────────────────────────────────────
// Install ws if not present
const { execSync } = require('child_process');
try { require.resolve('ws'); } 
catch { console.log('[shreem] Installing ws...'); execSync('npm install ws --prefix /root', { stdio: 'inherit' }); }

syncPositions();
setInterval(syncPositions, 15000);
setInterval(pollStopLoss, STOP_POLL_MS);
setInterval(pollSellFallback, 30000); // fallback only
setInterval(refreshSolPrice, 30000);

// Start WebSocket connection
connectWebSocket();

console.log('[shreem] v14 running — WS entry <100ms, WS exit <100ms, 3s stop loss');
