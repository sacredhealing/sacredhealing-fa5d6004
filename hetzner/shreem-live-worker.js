// shreem-live-worker.js — Shreem Brzee v16.2 LaserStream
// Architecture: Helius WebSocket → detect whale swap <50ms → Jupiter swap direct on Hetzner
// Supabase is LOGGING ONLY — never in the execution path
// Signing: tweetnacl + bs58 (no @solana/web3.js dependency issues)

'use strict';
const https   = require('https');
const http    = require('http');
const WebSocket = require('ws');
const nacl    = require('tweetnacl');
const bs58    = require('bs58');

// ── ENV ───────────────────────────────────────────────────────────────────────
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '4319d817-88e2-4332-926f-84d98f0f5155';
const HELIUS_RPC     = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_WSS     = `wss://atlas-mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SUPABASE_URL   = process.env.SUPABASE_URL || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const RAW_KEYPAIR    = process.env.SHREEM_BOT_KEYPAIR || '';
const BOT_WALLET     = 'Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA';
const PORT           = 3001;

// ── WHALE WALLETS — confirmed today's session ─────────────────────────────────
const WHALE_WALLETS = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt':  'Theo',
  '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9':  'decu',
  'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT':   'trunoest',
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SOL_MINT      = 'So11111111111111111111111111111111111111112';
const USDC_MINT     = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT     = 'Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1';
const STABLES       = new Set([USDC_MINT, USDT_MINT, SOL_MINT]);
const LAMPORTS      = 1_000_000_000;
const BUY_SLIPPAGE  = 2500;   // 25%
const SELL_SLIPPAGE = 5000;   // 50%
const STOP_LOSS_PCT = -25;
const TRAIL_PEAK    = 30;     // activate trailing at +30%
const TRAIL_FLOOR   = 0.5;    // lock 50% of peak
const MAX_POSITIONS = 5;
const MIN_TRADE_SOL = 0.02;
const TRADE_PCT     = 0.05;   // 5% of wallet per trade
const MAX_EXPOSURE  = 0.50;   // 50% cap
const MIN_POOL_USD  = 10000;  // skip tokens < $10k liquidity
const STOP_POLL_MS  = 2000;

// ── KEYPAIR (tweetnacl — no @solana/web3.js) ──────────────────────────────────
let kp = null;

function parseKeypair(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    const t = raw.trim();
    let sk;
    if (t.startsWith('[')) sk = new Uint8Array(JSON.parse(t));
    else if (t.includes(',')) sk = new Uint8Array(t.split(',').map(Number));
    else sk = bs58.decode(t);
    if (sk.length !== 64) throw new Error(`bad length ${sk.length}`);
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    const pub  = bs58.encode(pair.publicKey);
    console.log('[keypair] ✅ loaded:', pub);
    return { secretKey: sk, publicKey: pair.publicKey, publicKeyB58: pub };
  } catch(e) { console.error('[keypair] ❌', e.message); return null; }
}

async function loadKeypairFromSupabase() {
  // Try env var first (fast path)
  if (RAW_KEYPAIR) {
    const k = parseKeypair(RAW_KEYPAIR);
    if (k) { kp = k; return; }
  }
  // Fetch from Supabase bot_secrets table (set via UI)
  try {
    const rows = await sbGet('bot_secrets', 'name=eq.SHREEM_BOT_KEYPAIR&select=value&limit=1');
    const val = rows[0]?.value;
    if (val) {
      const k = parseKeypair(val);
      if (k) { kp = k; console.log('[keypair] ✅ loaded from Supabase bot_secrets'); return; }
    }
  } catch(e) { console.error('[keypair] Supabase fetch failed:', e.message); }
  console.error('[keypair] ❌ SHREEM_BOT_KEYPAIR not found in env or Supabase — trades will not execute');
}

// ── HTTP HELPERS ──────────────────────────────────────────────────────────────
function httpJSON(url, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname, port: 443,
      path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...extraHeaders },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

const SB_HDR = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
function sbGet(table, filter) {
  return httpJSON(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, 'GET', null, SB_HDR).then(d => Array.isArray(d) ? d : []);
}
function sbFire(method, path, body) {
  // Non-blocking fire-and-forget
  const url = `${SUPABASE_URL}${path}`;
  const u = new URL(url);
  const data = JSON.stringify(body);
  const req = https.request({
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method,
    headers: { ...SB_HDR, 'Prefer': 'return=minimal', 'Content-Length': Buffer.byteLength(data) },
  }, (res) => res.resume());
  req.on('error', () => {});
  req.setTimeout(8000, () => req.destroy());
  req.write(data); req.end();
}

// ── TRANSACTION SIGNING (pure nacl, no web3.js) ───────────────────────────────
function signAndSendTx(txB64) {
  if (!kp) throw new Error('no keypair loaded');
  // Deserialize versioned transaction manually
  const txBytes = Buffer.from(txB64, 'base64');
  // VersionedTransaction format: first byte = version prefix (0x80 | version)
  // Find the message start and sign it
  // For versioned transactions: bytes[0] = numSignatures, then signature slots, then message
  const numSigs = txBytes[0];
  const sigSize = 64;
  const msgStart = 1 + numSigs * sigSize;
  const message = txBytes.slice(msgStart);
  const sig = nacl.sign.detached(message, kp.secretKey);
  // Write signature into first slot
  sig.forEach((b, i) => { txBytes[1 + i] = b; });
  const signed = txBytes.toString('base64');
  return httpJSON(HELIUS_RPC, 'POST', {
    jsonrpc: '2.0', id: 1, method: 'sendTransaction',
    params: [signed, { encoding: 'base64', skipPreflight: true, maxRetries: 3 }],
  }).then(r => {
    if (r.error) throw new Error(r.error.message || JSON.stringify(r.error));
    return r.result;
  });
}

// ── JUPITER ───────────────────────────────────────────────────────────────────
async function jupQuote(inputMint, outputMint, amount, slippage) {
  const url = `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}&onlyDirectRoutes=false&asLegacyTransaction=false`;
  const q = await httpJSON(url);
  if (!q || q.error) throw new Error(`quote: ${q?.error || 'no data'}`);
  return q;
}
async function jupSwapTx(quote) {
  const res = await httpJSON('https://api.jup.ag/swap/v1/swap', 'POST', {
    quoteResponse: quote, userPublicKey: BOT_WALLET,
    wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 1000000, priorityLevel: 'high' } },
  });
  if (!res?.swapTransaction) throw new Error('no swapTransaction');
  return res.swapTransaction;
}

// ── PRICE + BALANCE ───────────────────────────────────────────────────────────
const priceCache = new Map();
const PRICE_TTL  = 3000;

async function fetchPrice(mint) {
  const c = priceCache.get(mint);
  if (c && Date.now() - c.t < PRICE_TTL) return c.p;
  // DexScreener first
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a,b) => parseFloat(b.liquidity?.usd||0)-parseFloat(a.liquidity?.usd||0));
      const p = parseFloat(pairs[0].priceUsd);
      if (p > 0) { priceCache.set(mint, {p, t:Date.now()}); return p; }
    }
  } catch {}
  // Jupiter fallback
  try {
    const d = await httpJSON(`https://api.jup.ag/price/v2?ids=${mint}`);
    const p = parseFloat(Object.values(d?.data||{})[0]?.price||0);
    if (p > 0) { priceCache.set(mint, {p, t:Date.now()}); return p; }
  } catch {}
  return 0;
}

async function getPoolLiq(mint) {
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (d?.pairs||[]).filter(p=>parseFloat(p?.priceUsd)>0);
    if (!pairs.length) return 0;
    pairs.sort((a,b)=>parseFloat(b.liquidity?.usd||0)-parseFloat(a.liquidity?.usd||0));
    return parseFloat(pairs[0].liquidity?.usd||0);
  } catch { return 0; }
}

async function getWalletSol() {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST', {jsonrpc:'2.0',id:1,method:'getBalance',params:[BOT_WALLET]});
    return (r?.result?.value||0)/LAMPORTS;
  } catch { return 0; }
}

async function getTokenBal(mint) {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc:'2.0',id:1,method:'getTokenAccountsByOwner',
      params:[BOT_WALLET,{mint},{encoding:'jsonParsed'}]
    });
    return (r?.result?.value||[]).reduce((s,a)=>s+Number(a?.account?.data?.parsed?.info?.tokenAmount?.amount||0),0);
  } catch { return 0; }
}

// ── IN-MEMORY STATE ───────────────────────────────────────────────────────────
const posCache  = new Map();   // id → position
const closing   = new Set();   // ids currently being sold
const cooldowns = new Map();   // mint → timestamp
let solUsd      = 150;
let isLive      = false;
let isRunning   = false;
let buyBusy     = false;

// ── BUY ───────────────────────────────────────────────────────────────────────
async function executeBuy(mint, symbol, label, whaleSolSize) {
  if (buyBusy || !kp || !isLive || !isRunning) return;
  if (STABLES.has(mint)) return;
  if ((cooldowns.get(mint)||0) > Date.now()-300000) { console.log(`[buy] cooldown ${symbol}`); return; }
  if (posCache.size >= MAX_POSITIONS) { console.log(`[buy] max positions`); return; }
  for (const p of posCache.values()) { if (p.mint===mint) { console.log(`[buy] already holding ${symbol}`); return; } }

  buyBusy = true;
  const t0 = Date.now();
  try {
    const walletSol = await getWalletSol();
    if (walletSol < MIN_TRADE_SOL+0.003) { console.log(`[buy] low balance ${walletSol.toFixed(4)}`); return; }

    const totalExp = [...posCache.values()].reduce((s,p)=>s+(p.amount_sol||0),0);
    if (totalExp/walletSol >= MAX_EXPOSURE) { console.log(`[buy] exposure cap`); return; }

    const poolLiq = await getPoolLiq(mint);
    if (poolLiq > 0 && poolLiq < MIN_POOL_USD) { console.log(`[buy] pool $${poolLiq.toFixed(0)} < min`); return; }

    const free = walletSol - 0.003;
    const room = walletSol*MAX_EXPOSURE - totalExp;
    const size = Math.min(free*TRADE_PCT, room, free);
    if (size < MIN_TRADE_SOL) { console.log(`[buy] size too small ${size.toFixed(4)}`); return; }

    const lamports = Math.floor(size*LAMPORTS);
    console.log(`[buy] 🔱 ${label}→${symbol} | ${size.toFixed(4)} SOL | pool $${poolLiq.toFixed(0)}`);

    const quote  = await jupQuote(SOL_MINT, mint, lamports, BUY_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);

    const latency = Date.now()-t0;
    console.log(`[buy] ✅ ${symbol} | ${txSig.slice(0,16)}… | ${latency}ms`);

    const rawOut = Number(quote.outAmount||0);
    const decimals = 6;
    const tokensHuman = rawOut/Math.pow(10,decimals);
    const entryUsd = tokensHuman>0 ? (size*solUsd)/tokensHuman : 0;
    const tradeId = `live_${Date.now()}_${mint.slice(0,8)}`;
    cooldowns.set(mint, Date.now());

    posCache.set(tradeId, { id:tradeId, mint, symbol:symbol||mint.slice(0,8), label,
      entry_price:entryUsd, peak_price:entryUsd, amount_sol:size,
      tokens_received:rawOut, token_decimals:decimals, opened_at:new Date().toISOString() });

    // Log async — never blocks
    sbFire('POST', '/rest/v1/shreem_brzee_live_trades', {
      id:tradeId, session_id:'default', sig:txSig, mint,
      symbol:symbol||mint.slice(0,8), label, wallet:label,
      action:'BUY', amount_sol:size, gross_sol:size, net_sol:size,
      tokens_received:rawOut, token_decimals:decimals,
      entry_price:entryUsd>0?entryUsd:null, sol_usd_at_entry:solUsd,
      status:'open', opened_at:new Date().toISOString(),
    });

  } catch(e) { console.error(`[buy] ❌ ${symbol}: ${e.message}`); }
  finally { buyBusy = false; }
}

// ── SELL ──────────────────────────────────────────────────────────────────────
async function executeSell(pos, reason) {
  if (closing.has(pos.id) || !kp) return;
  closing.add(pos.id);
  posCache.delete(pos.id);
  const sym = pos.symbol||pos.mint.slice(0,8);
  const t0  = Date.now();
  console.log(`[sell] 🔴 ${sym} reason=${reason}`);
  try {
    let rawAmt = await getTokenBal(pos.mint);
    if (!rawAmt || rawAmt<1) rawAmt = Number(pos.tokens_received||0);
    if (!rawAmt || rawAmt<1) {
      console.log(`[sell] no tokens for ${sym} — marking stuck`);
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
        status:'closed', sell_reason:'closed_in_wallet', closed_at:new Date().toISOString(),
        pnl_sol:0, pnl_pct:0, updated_at:new Date().toISOString(),
      });
      return;
    }
    const quote  = await jupQuote(pos.mint, SOL_MINT, rawAmt, SELL_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);
    const solOut  = Number(quote.outAmount||0)/LAMPORTS;
    const pnlSol  = solOut-(pos.amount_sol||0);
    const pnlPct  = pos.amount_sol>0?(pnlSol/pos.amount_sol)*100:0;
    console.log(`[sell] ✅ ${sym} | ${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}% | ${pnlSol>=0?'+':''}${pnlSol.toFixed(4)} SOL | ${Date.now()-t0}ms`);
    sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
      status:'closed', sell_reason:reason, sell_sig:txSig,
      closed_at:new Date().toISOString(), pnl_sol:pnlSol, pnl_pct:pnlPct,
      exit_price:priceCache.get(pos.mint)?.p||null, updated_at:new Date().toISOString(),
    });
    // Sync wallet balance to Supabase async
    getWalletSol().then(bal=>{ if(bal>0) sbFire('PATCH','/rest/v1/shreem_brzee_session?id=eq.default',{portfolio:bal,updated_at:new Date().toISOString()}); });
  } catch(e) {
    console.error(`[sell] ❌ ${sym}: ${e.message}`);
    posCache.set(pos.id, pos); // restore — retry next cycle
  } finally { closing.delete(pos.id); }
}

// ── STOP LOSS + TRAILING (every 2s) ──────────────────────────────────────────
let stopBusy = false;
async function pollStopLoss() {
  if (stopBusy || posCache.size===0) return;
  stopBusy = true;
  try {
    const mints = [...new Set([...posCache.values()].map(p=>p.mint).filter(Boolean))];
    await Promise.all(mints.map(fetchPrice));
    for (const [id, pos] of posCache) {
      if (closing.has(id)) continue;
      const entry = Number(pos.entry_price);
      if (!entry||entry<=0||!pos.mint) continue;
      const c = priceCache.get(pos.mint);
      if (!c||Date.now()-c.t>15000) continue;
      const price  = c.p;
      const pnlPct = (price-entry)/entry*100;
      const peak   = Math.max(pos.peak_price||entry, price);
      pos.peak_price = peak;
      const peakPct  = (peak-entry)/entry*100;
      // Update DB non-blocking
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${id}&status=eq.open`, {
        exit_price:price, peak_price:peak, pnl_pct:pnlPct,
        pnl_sol:(pos.amount_sol||0)*(pnlPct/100), updated_at:new Date().toISOString(),
      });
      if (pnlPct <= STOP_LOSS_PCT) {
        console.log(`[stop] 🛑 ${pos.symbol} hard stop ${pnlPct.toFixed(1)}%`);
        await executeSell(pos, 'stop_loss'); continue;
      }
      if (peakPct >= TRAIL_PEAK) {
        const floor = peakPct*TRAIL_FLOOR;
        if (pnlPct <= floor) {
          console.log(`[trail] 🔒 ${pos.symbol} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
          await executeSell(pos, 'trailing_stop'); continue;
        }
      }
      const ageH = (Date.now()-new Date(pos.opened_at).getTime())/3600000;
      if (ageH>=48) { await executeSell(pos,'timeout_48h'); }
    }
  } catch(e) { console.error('[stop] error:', e.message); }
  finally { stopBusy = false; }
}

// ── TX PARSER ─────────────────────────────────────────────────────────────────
function parseWhaleSwap(tx, whaleAddr) {
  const label = WHALE_WALLETS[whaleAddr];
  const meta  = tx.meta||tx.transaction?.meta;
  const msg   = tx.transaction?.message||tx.message;
  if (!meta||!msg) return null;
  const keys = (msg.accountKeys||[]).map(k=>typeof k==='string'?k:k?.pubkey||'');
  const wi   = keys.indexOf(whaleAddr);
  if (wi<0) return null;
  const solDiff = ((meta.postBalances?.[wi]||0)-(meta.preBalances?.[wi]||0))/LAMPORTS;
  const preT  = (meta.preTokenBalances||[]).filter(b=>keys[b.accountIndex]===whaleAddr||b.owner===whaleAddr);
  const postT = (meta.postTokenBalances||[]).filter(b=>keys[b.accountIndex]===whaleAddr||b.owner===whaleAddr);
  let mint=null, tokenDiff=0, symbol=null;
  const allMints = new Set([...preT.map(b=>b.mint),...postT.map(b=>b.mint)].filter(m=>!STABLES.has(m)));
  for (const m of allMints) {
    const pre  = preT.find(b=>b.mint===m);
    const post = postT.find(b=>b.mint===m);
    const preAmt  = Number(pre?.uiTokenAmount?.uiAmount||0);
    const postAmt = Number(post?.uiTokenAmount?.uiAmount||0);
    const diff = postAmt-preAmt;
    if (Math.abs(diff)>Math.abs(tokenDiff)) { mint=m; tokenDiff=diff; symbol=post?.uiTokenAmount?.symbol||null; }
  }
  if (!mint||Math.abs(solDiff)<0.001) return null;
  return { action:tokenDiff>0?'BUY':'SELL', mint, symbol, label, whaleSolSize:Math.abs(solDiff) };
}

// ── HELIUS WEBSOCKET ──────────────────────────────────────────────────────────
let ws=null, pingTimer=null, reconnTimer=null;

function connect() {
  if (ws&&(ws.readyState===0||ws.readyState===1)) return;
  console.log('[ws] 🔌 Connecting LaserStream…');
  ws = new WebSocket(HELIUS_WSS);

  ws.on('open', () => {
    console.log('[ws] ✅ Connected');
    for (const [addr, name] of Object.entries(WHALE_WALLETS)) {
      ws.send(JSON.stringify({
        jsonrpc:'2.0', id:Date.now(),
        method:'transactionSubscribe',
        params:[
          { accountInclude:[addr] },
          { commitment:'processed', encoding:'base64', transactionDetails:'signatures', showRewards:false, maxSupportedTransactionVersion:0 },
        ],
      }));
      console.log(`[ws] 📡 Subscribed ${name}`);
    }
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(()=>{ if(ws.readyState===1) ws.ping(); }, 30000);
  });

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      // Subscription confirmation
      if (msg.result!==undefined&&msg.id!==undefined) return;
      // Signatures-only payload: { params: { result: { signature, ... } } }
      const sig = msg.params?.result?.signature || msg.params?.result?.transaction?.signatures?.[0];
      if (!sig) return;
      // Fetch full transaction details — 1-10 credits vs hundreds for full stream
      const txRes = await httpJSON(HELIUS_RPC, 'POST', {
        jsonrpc:'2.0', id:1, method:'getTransaction',
        params:[sig, { encoding:'jsonParsed', commitment:'confirmed', maxSupportedTransactionVersion:0 }]
      });
      const tx = txRes?.result;
      if (!tx) return;
      // Find which whale triggered this
      const keys = (tx.transaction?.message?.accountKeys||[]).map(k=>typeof k==='string'?k:k?.pubkey||'');
      const whaleAddr = keys.find(a=>WHALE_ADDRS.has(a));
      if (!whaleAddr) return;
      const swap = parseWhaleSwap(tx, whaleAddr);
      if (!swap) return;
      console.log(`[ws] 🐋 ${swap.label} ${swap.action} ${swap.symbol||swap.mint.slice(0,8)} | ${swap.whaleSolSize.toFixed(3)} SOL`);
      if (swap.action==='BUY') {
        executeBuy(swap.mint, swap.symbol, swap.label, swap.whaleSolSize);
      } else {
        for (const [id,pos] of posCache) {
          if (pos.mint===swap.mint&&!closing.has(id)) { executeSell(pos,'whale_sell_mirror'); break; }
        }
      }
    } catch(e) { console.error('[ws] parse error:', e.message); }
  });

  ws.on('error', e=>console.error('[ws] error:', e.message));
  ws.on('pong', ()=>{});
  ws.on('close', (code)=>{
    console.log(`[ws] ❌ Closed (${code}) — reconnecting in 5s`);
    if (pingTimer) clearInterval(pingTimer);
    if (reconnTimer) clearTimeout(reconnTimer);
    reconnTimer = setTimeout(connect, 5000);
  });
}

// ── SESSION + POSITION SYNC ───────────────────────────────────────────────────
async function syncSession() {
  try {
    const rows = await sbGet('shreem_brzee_session','id=eq.default&select=mode,started_at,stopped_at,portfolio');
    const s = rows[0];
    if (s) { isLive=s.mode==='live'; isRunning=!!(s.started_at&&!s.stopped_at); }
  } catch(e) { console.error('[session]', e.message); }
}

async function syncPositions() {
  try {
    const rows = await sbGet('shreem_brzee_live_trades','status=in.(open,pending,unconfirmed)&select=id,mint,symbol,label,entry_price,peak_price,amount_sol,tokens_received,token_decimals,opened_at');
    const dbIds = new Set(rows.map(r=>r.id));
    for (const [id] of posCache) { if (!dbIds.has(id)) posCache.delete(id); }
    for (const r of rows) {
      if (!posCache.has(r.id)) posCache.set(r.id,{...r,
        entry_price:Number(r.entry_price)||0, peak_price:Number(r.peak_price)||Number(r.entry_price)||0,
        amount_sol:Number(r.amount_sol)||0 });
    }
    if(rows.length) console.log(`[cache] ${rows.length} positions`);
  } catch(e) { console.error('[positions]', e.message); }
}

async function refreshSolPrice() {
  try {
    const r = await httpJSON('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    if(r?.price) solUsd=parseFloat(r.price);
  } catch {}
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const bal = await getWalletSol().catch(()=>0);
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({
    version:'v16-LaserStream', uptime:Math.floor(process.uptime()),
    ws_state:ws?['CONNECTING','OPEN','CLOSING','CLOSED'][ws.readyState]:'null',
    positions:posCache.size, is_live:isLive, is_running:isRunning,
    balance_sol:bal, sol_usd:solUsd, time:new Date().toISOString(),
  }));
}).listen(PORT, ()=>console.log(`[shreem] Health :${PORT}`));

// ── BOOT ──────────────────────────────────────────────────────────────────────
console.log('[shreem] v16.2 LaserStream booting — Helius WSS, local execution, Supabase logging only');
console.log('[shreem] Whales:', Object.values(WHALE_WALLETS).join(', '));
(async()=>{
  await loadKeypairFromSupabase();
  await syncSession();
  await syncPositions();
  await refreshSolPrice();
  connect();
})();

setInterval(syncSession,   30000);
setInterval(syncPositions, 20000);
setInterval(pollStopLoss,  STOP_POLL_MS);
setInterval(refreshSolPrice, 30000);
