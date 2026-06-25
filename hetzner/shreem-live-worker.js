// shreem-live-worker.js — v16 POLLING
// Architecture: Poll getSignaturesForAddress every 2s per whale — reliable, simple
// Entry: <3s | Exit: <3s | Stop loss: 3s in-memory
// No WebSocket dependency — pure HTTP polling, always works

const https   = require('https');
const http    = require('http');

const SUPABASE_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const HELIUS_KEY    = '4319d817-88e2-4332-926f-84d98f0f5155';
const HELIUS_RPC    = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const EXECUTOR_URL  = `${SUPABASE_URL}/functions/v1/shreem-live-executor`;
const PORT          = 3001;
const POLL_MS       = 2000;  // Poll every 2s per whale
const STOP_POLL_MS  = 3000;
const PRICE_TTL_MS  = 4000;

const WHALES = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt': 'theo',
  '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9': 'decu',
  'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT':  'trunoest',
};

const SOL_MINT  = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SKIP_MINTS = new Set([SOL_MINT, USDC_MINT]);

const MIN_WHALE_SOL = 0.15;
const MIN_POOL_USD  = 10000;
const MIN_MCAP_USD  = 50000;

const SB_HDR = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

console.log('[shreem] v16 POLLING — getSignaturesForAddress every 2s, reliable');

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
    r.setTimeout(15000, () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const sbGet = (t, f) => req(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HDR).then(r => Array.isArray(r.data) ? r.data : []);
const sbPatch = (t, f, b) => req(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HDR).catch(() => {});
const helius = (method, params) => req(HELIUS_RPC, 'POST', { jsonrpc: '2.0', id: 1, method, params });
const callExecutor = body => req(EXECUTOR_URL, 'POST', body, { ...SB_HDR, Authorization: `Bearer ${SUPABASE_KEY}` }).then(r => r.data);

// State
const positions  = new Map();
const prices     = new Map();
const closing    = new Set();
const seenSigs   = new Set(); // processed tx signatures
const lastSigs   = {};        // addr → last seen signature
let   solUsd     = 150;
let   botLive    = false;

async function checkLive() {
  try {
    const s = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    botLive = !!(s[0]?.mode === 'live' && s[0]?.started_at && !s[0]?.stopped_at);
  } catch { botLive = false; }
}

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

async function syncPositions() {
  try {
    const rows = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=id,mint,symbol,entry_price,peak_price,amount_sol,opened_at,label');
    const ids = new Set(rows.map(r => r.id));
    for (const [id] of positions) { if (!ids.has(id)) positions.delete(id); }
    for (const p of rows) {
      const ex = positions.get(p.id);
      positions.set(p.id, { ...p, peak_price: ex?.peak_price || Number(p.peak_price) || Number(p.entry_price) || 0 });
    }
  } catch(e) { console.error('[sync]', e.message); }
}

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
      const pre     = preTokens.find(p => p.mint === post.mint && p.owner === walletAddr);
      const preAmt  = Number(pre?.uiTokenAmount?.uiAmount  || 0);
      const postAmt = Number(post.uiTokenAmount?.uiAmount  || 0);
      const diff    = postAmt - preAmt;
      if (Math.abs(diff) > 0) changes.push({ mint: post.mint, diff, preAmt, postAmt });
    }
    for (const pre of preTokens) {
      if (pre.owner !== walletAddr || SKIP_MINTS.has(pre.mint)) continue;
      const post = postTokens.find(p => p.mint === pre.mint && p.owner === walletAddr);
      if (!post || Number(post.uiTokenAmount?.uiAmount||0) === 0) {
        const preAmt = Number(pre.uiTokenAmount?.uiAmount||0);
        if (preAmt > 0 && !changes.find(c => c.mint === pre.mint))
          changes.push({ mint: pre.mint, diff: -preAmt, preAmt, postAmt: 0 });
      }
    }
    for (const c of changes) {
      if (c.diff > 0 && solDiff < -0.005) return { action:'BUY',  mint:c.mint, tokenAmount:c.diff,          amountSol:Math.abs(solDiff) };
      if (c.diff < 0 && solDiff > 0.001)  return { action:'SELL', mint:c.mint, tokenAmount:Math.abs(c.diff), amountSol:solDiff };
    }
    return null;
  } catch { return null; }
}

async function onSignal(name, addr, action, mint, amountSol, tokenAmount, sig) {
  if (!botLive) return;
  const ts = Date.now();
  console.log(`[poll] ⚡ ${name} ${action} ${mint.slice(0,8)} ${amountSol.toFixed(4)} SOL`);

  if (action === 'BUY') {
    // Filter 1: min whale position
    if (amountSol < MIN_WHALE_SOL) {
      console.log(`[filter] ⏭ SKIP ${mint.slice(0,8)} — only ${amountSol.toFixed(4)} SOL (min ${MIN_WHALE_SOL})`);
      return;
    }
    // Filter 2: pool liquidity + mcap
    try {
      const ds = await req(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      const pairs = (ds.data?.pairs||[]).filter(p => parseFloat(p?.priceUsd) > 0);
      if (pairs.length) {
        pairs.sort((a,b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
        const best    = pairs[0];
        const poolLiq = parseFloat(best.liquidity?.usd||0);
        const mcap    = parseFloat(best.fdv||best.marketCap||0);
        if (poolLiq > 0 && poolLiq < MIN_POOL_USD) {
          console.log(`[filter] ⏭ SKIP ${best.baseToken?.symbol||mint.slice(0,8)} — pool $${poolLiq.toFixed(0)}`);
          return;
        }
        if (mcap > 0 && mcap < MIN_MCAP_USD) {
          console.log(`[filter] ⏭ SKIP ${best.baseToken?.symbol||mint.slice(0,8)} — mcap $${mcap.toFixed(0)}`);
          return;
        }
        console.log(`[filter] ✅ PASS ${best.baseToken?.symbol||mint.slice(0,8)} pool $${poolLiq.toFixed(0)} mcap $${mcap.toFixed(0)}`);
      }
    } catch(fe) { console.log(`[filter] pool check skipped: ${fe.message}`); }

    callExecutor({ action:'buy', mint, label:name, whale_address:addr,
      amount_sol:amountSol, token_amount:tokenAmount, sig, source:'polling' })
      .then(r => console.log(r?.ok ? `[poll] ✅ BUY ${mint.slice(0,8)} — ${Date.now()-ts}ms` : `[poll] ⏭ ${r?.reason||'?'}`))
      .catch(e => console.error('[poll] BUY error:', e.message));
  }

  if (action === 'SELL') {
    try {
      const open = await sbGet('shreem_brzee_live_trades',
        `or=(status.eq.open,status.eq.unconfirmed)&mint=eq.${mint}&select=id,symbol`);
      if (!open.length) return;
      const trade = open[0];
      if (closing.has(trade.id)) return;
      closing.add(trade.id);
      console.log(`[poll] 🔴 ${name} SELL — closing ${trade.symbol||mint.slice(0,8)}`);
      const r = await callExecutor({ action:'close', trade_id:trade.id, mint, reason:'whale_sell_mirror' });
      if (r?.ok) { positions.delete(trade.id); console.log(`[poll] ✅ SELL ${trade.symbol||mint.slice(0,8)} — ${Date.now()-ts}ms`); }
    } catch(e) { console.error('[poll] SELL error:', e.message); }
    finally { closing.delete(mint); }
  }
}

// Poll each whale every 2s
const pollBusy = {};
async function pollWhale(addr, name) {
  if (pollBusy[addr]) return;
  pollBusy[addr] = true;
  try {
    const r = await helius('getSignaturesForAddress', [addr, { limit: 5, commitment: 'confirmed' }]);
    const sigs = r.data?.result || [];
    if (!sigs.length) return;

    // First run — just set baseline, don't process old txs
    if (!lastSigs[addr]) {
      lastSigs[addr] = sigs[0].signature;
      console.log(`[poll] 📍 ${name} baseline: ${sigs[0].signature.slice(0,12)}...`);
      return;
    }

    // Find new signatures since last check
    const newSigs = [];
    for (const s of sigs) {
      if (s.signature === lastSigs[addr]) break;
      if (!seenSigs.has(s.signature)) newSigs.push(s);
    }

    if (newSigs.length > 0) {
      lastSigs[addr] = sigs[0].signature;
      console.log(`[poll] 🆕 ${name} — ${newSigs.length} new tx(s)`);
    }

    // Process each new tx
    for (const sigInfo of newSigs.reverse()) {
      seenSigs.add(sigInfo.signature);
      setTimeout(() => seenSigs.delete(sigInfo.signature), 300000);
      try {
        const txRes = await helius('getTransaction', [sigInfo.signature, { encoding:'jsonParsed', maxSupportedTransactionVersion:0 }]);
        const tx = txRes.data?.result;
        if (!tx) continue;
        const parsed = parseTx(tx, addr);
        if (parsed) await onSignal(name, addr, parsed.action, parsed.mint, parsed.amountSol, parsed.tokenAmount, sigInfo.signature);
      } catch(e) { console.error(`[poll] tx fetch error:`, e.message); }
    }
  } catch(e) { console.error(`[poll] ${name} error:`, e.message); }
  finally { pollBusy[addr] = false; }
}

// Stop loss 3s in-memory
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
      if (pos.opened_at && Date.now() - new Date(pos.opened_at).getTime() > 172800000) {
        closing.add(id); positions.delete(id);
        callExecutor({ action:'close', trade_id:id, reason:'timeout_48h' }).catch(() => {});
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
      sbPatch('shreem_brzee_live_trades', `id=eq.${id}`, {
        exit_price:price, peak_price:peak, pnl_pct:pnlPct,
        pnl_sol:Number(pos.amount_sol||0)*pnlPct/100,
      });
      if (pnlPct <= -20) {
        console.log(`[sl] 🛑 ${pos.symbol||pos.mint.slice(0,8)} ${pnlPct.toFixed(1)}%`);
        closing.add(id); positions.delete(id);
        callExecutor({ action:'close', trade_id:id, reason:'stop_loss_20pct' }).catch(() => {});
        closing.delete(id); continue;
      }
      if (peakPct >= 30 && pnlPct <= peakPct * 0.5) {
        console.log(`[sl] 🔒 trail ${pos.symbol||pos.mint.slice(0,8)} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
        closing.add(id); positions.delete(id);
        callExecutor({ action:'close', trade_id:id, reason:'trailing_stop' }).catch(() => {});
        closing.delete(id); continue;
      }
    }
  } catch(e) { console.error('[sl]', e.message); }
  finally { slBusy = false; }
}

// Health server
http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ version:'v16-polling', positions:positions.size, live:botLive, sol:solUsd, whales:Object.keys(WHALES).length }));
}).listen(PORT, () => console.log(`[shreem] health :${PORT}`));

// Start polling each whale independently with offset
syncPositions();
setInterval(syncPositions, 15000);
setInterval(stopLoss, STOP_POLL_MS);
setInterval(checkLive, 10000);
setInterval(() => {
  req('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT')
    .then(r => { if (r.data?.price) solUsd = parseFloat(r.data.price); }).catch(() => {});
}, 30000);
checkLive();

// Start each whale poll with staggered timing to avoid rate limits
let offset = 0;
for (const [addr, name] of Object.entries(WHALES)) {
  setTimeout(() => {
    setInterval(() => pollWhale(addr, name), POLL_MS);
    console.log(`[poll] 📡 Polling ${name} every ${POLL_MS}ms`);
  }, offset);
  offset += 400; // stagger by 400ms
}

console.log('[shreem] v16 ready — polling all whales every 2s');
