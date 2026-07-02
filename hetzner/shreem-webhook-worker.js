// shreem-webhook-worker.js — Shreem Brzee v18.11-DISKPOS
// Architecture: Helius Webhook POST → Hetzner HTTP server → Jupiter swap
// Supabase: LOGGING ONLY + session sync for UI Go Live toggle
// Wallets: Remusofmars, trunoest
// Zero idle credit burn — Helius only pushes on actual whale transactions
'use strict';
const https   = require('https');
const http    = require('http');
const fs      = require('fs');
const nacl    = require('tweetnacl');
const bs58    = require('bs58');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '5e971a11-d98d-40fc-8a12-37092eda4580';
const HELIUS_RPC     = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SUPABASE_URL   = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const BOT_WALLET     = 'Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA';
const KEY_FILE       = '/root/.shreem_key';
const PORT           = 3001;
// Webhook auth — set this same string in Helius dashboard "Auth Header" field
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'shreem-webhook-2026';

// ── WHALE WALLETS ─────────────────────────────────────────────────────────────
const WHALE_WALLETS = {
  'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT':   'trunoest',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SOL_MINT      = 'So11111111111111111111111111111111111111112';
const USDC_MINT     = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT     = 'Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1';
const STABLES       = new Set([USDC_MINT, USDT_MINT, SOL_MINT]);
const LAMPORTS      = 1_000_000_000;
const BUY_SLIPPAGE  = 2500;
const SELL_SLIPPAGE = 5000;
const STOP_LOSS_PCT = -25;
const TRAIL_PEAK    = 15;    // activate trailing at +15%
// Tiered trailing floor — locks profit fast on modest pumps, gives more room the
// bigger the peak gets so a real runner (300%+) doesn't get stopped out early.
// Returns the fraction of peak% that must be retained before exit fires.
function trailFloorFraction(peakPct) {
  if (peakPct < 30)  return 0.80; // +15–30%: lock in fast, exit near peak
  if (peakPct < 100) return 0.70; // +30–100%: give it a bit more room
  if (peakPct < 300) return 0.60; // +100–300%: real trend, wider berth
  return 0.50;                    // +300%+: moonshot tier, ride it further
}
const MAX_POSITIONS = 10;   // no artificial cap — 50% exposure is the limit
const MIN_TRADE_SOL = 0.012; // TEMP: was 0.015 -- wallet balance drift put real trades (0.0149) just under the old floor
const TRADE_PCT     = 0.10;  // TEMP: raised from 0.05 for the same reason — revert once buy/sell confirmed working
const MAX_EXPOSURE  = 0.50;
const MIN_POOL_USD  = 3000;
const MIN_WHALE_SOL = 0.05;
const COOLDOWN_MS   = 300000;
const DEDUP_MS      = 8000;
const STOP_POLL_MS  = 3000;

// ── STATE ─────────────────────────────────────────────────────────────────────
const posCache     = new Map();
const POS_FILE     = '/root/.shreem_webhook_positions.json';
function savePosCache() {
  try {
    const obj = {};
    for (const [k,v] of posCache) obj[k] = v;
    fs.writeFileSync(POS_FILE, JSON.stringify(obj));
  } catch(e) { console.error('[pos] save error:', e.message); }
}
function loadPosCache() {
  try {
    if (!fs.existsSync(POS_FILE)) return;
    const obj = JSON.parse(fs.readFileSync(POS_FILE, 'utf8'));
    for (const [k,v] of Object.entries(obj)) posCache.set(k, v);
    console.log(`[pos] 💾 loaded ${posCache.size} positions from disk`);
  } catch(e) { console.error('[pos] load error:', e.message); }
}
const closing      = new Set();
const cooldowns    = new Map();
const recentSigs   = new Set();   // dedupe webhook duplicate deliveries
const recentBuys   = new Map();   // mint → timestamp
let   kp           = null;
let   isLive       = true;
let   isRunning    = true;
let   buyBusy      = false;
let   solUsd       = 73; // fallback only — real value fetched immediately on startup via refreshSolUsd()
let   stopBusy     = false;
const priceCache   = new Map();
const PRICE_TTL    = 3000;

// ── KEYPAIR ───────────────────────────────────────────────────────────────────
function parseKeypair(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    const t = raw.trim();
    let sk;
    if (t.startsWith('['))    sk = new Uint8Array(JSON.parse(t));
    else if (t.includes(',')) sk = new Uint8Array(t.split(',').map(Number));
    else                      sk = bs58.decode(t);
    if (sk.length !== 64) throw new Error(`bad length ${sk.length}`);
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    const pub  = bs58.encode(pair.publicKey);
    console.log('[keypair] ✅ loaded:', pub);
    return { secretKey: sk, publicKey: pair.publicKey, publicKeyB58: pub };
  } catch(e) { console.error('[keypair] parse error:', e.message); return null; }
}

async function loadKeypair() {
  try {
    const raw = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (raw) { const k = parseKeypair(raw); if (k) { kp = k; console.log('[keypair] ✅ source: file'); return; } }
  } catch(e) { console.log('[keypair] no file:', e.code); }
  const envKey = process.env.SHREEM_BOT_KEYPAIR || '';
  if (envKey.trim()) { const k = parseKeypair(envKey.trim()); if (k) { kp = k; console.log('[keypair] ✅ source: env'); return; } }
  console.error('[keypair] ❌ FAILED — bot will detect but NOT execute.');
}

// ── HTTP HELPER ───────────────────────────────────────────────────────────────
function httpJSON(url, method = 'GET', body = null, extraHeaders = {}, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname, port: 443,
      path: u.pathname + u.search, method,
      headers: {
        'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...extraHeaders,
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// ── SUPABASE FIRE-AND-FORGET ──────────────────────────────────────────────────
const SB_HDR = { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' };
function sbFire(method, path, body) {
  const url  = `${SUPABASE_URL}${path}`;
  const u    = new URL(url);
  const data = JSON.stringify(body);
  const req  = https.request({
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method,
    headers: { ...SB_HDR, 'Prefer': 'return=minimal', 'Content-Length': Buffer.byteLength(data) },
  }, (res) => res.resume());
  req.on('error', () => {});
  req.setTimeout(8000, () => req.destroy());
  req.write(data); req.end();
}

// ── TX SIGNING ────────────────────────────────────────────────────────────────
function signAndSendTx(txB64) {
  if (!kp) throw new Error('no keypair');
  const txBytes = Buffer.from(txB64, 'base64');
  const numSigs  = txBytes[0];
  const msgStart = 1 + numSigs * 64;
  const message  = txBytes.slice(msgStart);
  const sig      = nacl.sign.detached(message, kp.secretKey);
  sig.forEach((b, i) => { txBytes[1 + i] = b; });
  return httpJSON(HELIUS_RPC, 'POST', {
    jsonrpc: '2.0', id: 1, method: 'sendTransaction',
    params: [txBytes.toString('base64'), { encoding: 'base64', skipPreflight: true, maxRetries: 3 }],
  }, {}, 8000).then(r => {
    if (r.error) throw new Error(r.error.message || JSON.stringify(r.error));
    return r.result;
  });
}
// FIX: sendTransaction only confirms BROADCAST, not on-chain success. A signature
// can come back and the tx can still revert, expire, or never land. This was the
// root cause of "log says sold, wallet still has the token" -- executeBuy/executeSell
// were declaring success right after broadcast with zero verification.
async function confirmTx(sig, maxWaitMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await httpJSON(HELIUS_RPC, 'POST', {
        jsonrpc: '2.0', id: 1, method: 'getSignatureStatuses',
        params: [[sig], { searchTransactionHistory: true }],
      }, {}, 5000);
      const status = r?.result?.value?.[0];
      if (status) {
        if (status.err) throw new Error(`on-chain failure: ${JSON.stringify(status.err)}`);
        if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
          return true;
        }
      }
    } catch (e) {
      if (e.message.startsWith('on-chain failure')) throw e;
      // network hiccup polling status — keep retrying within the time budget
    }
    await new Promise(res => setTimeout(res, 1000));
  }
  throw new Error(`confirmation timeout after ${maxWaitMs}ms — sig=${sig} (may still land later, treat as unconfirmed)`);
}

// ── JUPITER ───────────────────────────────────────────────────────────────────
async function jupQuote(inputMint, outputMint, amount, slippage) {
  const url = `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}&onlyDirectRoutes=false&asLegacyTransaction=false&swapMode=ExactIn`;
  const q   = await httpJSON(url, 'GET', null, {}, 6000);
  if (!q || q.error) throw new Error(`quote: ${q?.error || 'no data'}`);
  return q;
}
async function jupSwapTx(quote) {
  const res = await httpJSON('https://api.jup.ag/swap/v1/swap', 'POST', {
    quoteResponse: quote, userPublicKey: BOT_WALLET,
    wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 1000000, priorityLevel: 'high' } },
  }, {}, 8000);
  if (!res?.swapTransaction) throw new Error('no swapTransaction from Jupiter');
  return res.swapTransaction;
}

// ── PRICE + BALANCE ───────────────────────────────────────────────────────────
async function fetchPrice(mint) {
  const c = priceCache.get(mint);
  if (c && Date.now() - c.t < PRICE_TTL) return c.p;
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, 'GET', null, {}, 5000);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0));
      const p = parseFloat(pairs[0].priceUsd);
      if (p > 0) { priceCache.set(mint, { p, t: Date.now() }); return p; }
    }
  } catch {}
  try {
    // FIX: Price API V2 is fully deprecated (confirmed empty response from server).
    // V3 uses a different base URL and response shape (usdPrice, no .data wrapper).
    const d = await httpJSON(`https://lite-api.jup.ag/price/v3?ids=${mint}`, 'GET', null, {}, 4000);
    const p = parseFloat(d?.[mint]?.usdPrice || 0);
    if (p > 0) { priceCache.set(mint, { p, t: Date.now() }); return p; }
  } catch {}
  return 0;
}
async function getPoolLiq(mint) {
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, 'GET', null, {}, 5000);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (!pairs.length) return 0;
    pairs.sort((a, b) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0));
    return parseFloat(pairs[0].liquidity?.usd || 0);
  } catch { return 0; }
}
// SAFETY: reject Token-2022 mints with extensions that let the creator move tokens
// out of ANY holder's wallet without their signature (PermanentDelegate, TransferHook).
// This is the mechanism behind tokens getting drained via a raw "Sent" tx right after
// a legitimate buy -- confirmed pattern on this wallet (Robin, green, Stakoor).
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
async function isTokenSafe(mint) {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc: '2.0', id: 1, method: 'getAccountInfo',
      params: [mint, { encoding: 'jsonParsed' }],
    }, {}, 5000);
    const info = r?.result?.value;
    if (!info) return { safe: false, reason: 'mint_not_found' };
    if (info.owner !== TOKEN_2022_PROGRAM) return { safe: true }; // classic SPL token, no extension risk
    const extensions = info.data?.parsed?.info?.extensions || [];
    const dangerous = extensions.find(e =>
      e.extension === 'permanentDelegate' || e.extension === 'transferHook'
    );
    if (dangerous) return { safe: false, reason: `token2022_${dangerous.extension}` };
    return { safe: true };
  } catch (e) {
    // If the check itself fails, fail closed -- don't buy something we couldn't verify
    return { safe: false, reason: `check_failed_${e.message}` };
  }
}
async function getWalletSol() {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST',
      { jsonrpc: '2.0', id: 1, method: 'getBalance', params: [BOT_WALLET] }, {}, 5000);
    return (r?.result?.value || 0) / LAMPORTS;
  } catch { return 0; }
}
async function getTokenBal(mint) {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
      params: [BOT_WALLET, { mint }, { encoding: 'jsonParsed' }],
    }, {}, 5000);
    return (r?.result?.value || []).reduce(
      (s, a) => s + Number(a?.account?.data?.parsed?.info?.tokenAmount?.amount || 0), 0
    );
  } catch { return 0; }
}
async function getTokenDecimals(mint) {
  try {
    const r = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc: '2.0', id: 1, method: 'getTokenSupply', params: [mint],
    }, {}, 5000);
    const d = r?.result?.value?.decimals;
    return (typeof d === 'number') ? d : 6; // fallback only if RPC lookup genuinely fails
  } catch { return 6; }
}

// ── TX PARSER — whale owner filter + ATA closure sell detection ───────────────
function parseWhaleSwap(tx, whaleAddr) {
  // ── HELIUS ENHANCED FORMAT (top-level nativeTransfers + tokenTransfers) ──────
  // This is what Helius actually sends for SWAP transactions
  if (tx.nativeTransfers || tx.tokenTransfers) {
    // Get SOL direction from nativeTransfers
    let solDiff = 0;
    for (const t of (tx.nativeTransfers || [])) {
      if (t.fromUserAccount === whaleAddr) solDiff -= (t.amount || 0) / 1e9;
      if (t.toUserAccount   === whaleAddr) solDiff += (t.amount || 0) / 1e9;
    }
    if (Math.abs(solDiff) < MIN_WHALE_SOL) {
      // Try accountData for SOL balance changes
      const acct = (tx.accountData || []).find(a => a.account === whaleAddr);
      if (acct) solDiff = (acct.nativeBalanceChange || 0) / 1e9;
    }
    if (Math.abs(solDiff) < MIN_WHALE_SOL) {
      console.log(`[parse-dbg] ⏭ solDiff=${solDiff.toFixed(5)} < MIN_WHALE_SOL=${MIN_WHALE_SOL} | nativeTransfers=${JSON.stringify((tx.nativeTransfers||[]).map(t=>({from:t.fromUserAccount?.slice(0,6),to:t.toUserAccount?.slice(0,6),amt:t.amount})))}`);
      return null;
    }

    // Get token from tokenTransfers
    const mintMap = {};
    for (const t of (tx.tokenTransfers || [])) {
      if (!t.mint || STABLES.has(t.mint)) continue;
      if (t.fromUserAccount !== whaleAddr && t.toUserAccount !== whaleAddr) continue;
      if (!mintMap[t.mint]) mintMap[t.mint] = { diff: 0, symbol: t.tokenSymbol || null };
      if (t.toUserAccount   === whaleAddr) mintMap[t.mint].diff += Number(t.tokenAmount || 0);
      if (t.fromUserAccount === whaleAddr) mintMap[t.mint].diff -= Number(t.tokenAmount || 0);
    }
    let bestMint = null, bestDiff = 0, bestSymbol = null;
    for (const [mint, d] of Object.entries(mintMap)) {
      if (Math.abs(d.diff) > Math.abs(bestDiff)) { bestDiff=d.diff; bestMint=mint; bestSymbol=d.symbol; }
    }
    if (!bestMint) {
      console.log(`[parse-dbg] ⏭ no bestMint | solDiff=${solDiff.toFixed(5)} | tokenTransfers=${JSON.stringify((tx.tokenTransfers||[]).map(t=>({mint:t.mint?.slice(0,8),from:t.fromUserAccount?.slice(0,6),to:t.toUserAccount?.slice(0,6),amt:t.tokenAmount})))}`);
      return null;
    }
    const action = solDiff < 0 ? 'BUY' : 'SELL';
    console.log(`[parse] ${action} | whale=${whaleAddr.slice(0,8)} | mint=${bestMint.slice(0,8)} | sol=${solDiff.toFixed(4)} | enhanced-format`);
    return { action, mint: bestMint, symbol: bestSymbol, whaleSolSize: Math.abs(solDiff) };
  }

  // ── LEGACY FORMAT (tx.meta + tx.transaction.message) ─────────────────────────
  const meta = tx.meta;
  const msg  = tx.transaction?.message;
  if (!meta || !msg) return null;

  const keys = (msg.accountKeys || []).map(k =>
    typeof k === 'string' ? k : (k?.pubkey || k?.toString() || '')
  );
  const wi = keys.indexOf(whaleAddr);
  if (wi < 0) return null;

  const preSol  = (meta.preBalances?.[wi]  || 0) / 1e9;
  const postSol = (meta.postBalances?.[wi] || 0) / 1e9;
  const solDiff = postSol - preSol;
  if (Math.abs(solDiff) < MIN_WHALE_SOL) return null;

  const pre  = meta.preTokenBalances  || [];
  const post = meta.postTokenBalances || [];
  const whaleOwns = (b) => (b.owner === whaleAddr) || (b.accountIndex === wi);
  const whalePre  = pre.filter(b => b.mint && !STABLES.has(b.mint) && whaleOwns(b));
  const whalePost = post.filter(b => b.mint && !STABLES.has(b.mint) && whaleOwns(b));

  const mintMap = {};
  for (const b of whalePre)  { if (!mintMap[b.mint]) mintMap[b.mint]={pre:0,post:0,symbol:null}; mintMap[b.mint].pre  += Number(b.uiTokenAmount?.uiAmount||0); }
  for (const b of whalePost) { if (!mintMap[b.mint]) mintMap[b.mint]={pre:0,post:0,symbol:null}; mintMap[b.mint].post += Number(b.uiTokenAmount?.uiAmount||0); mintMap[b.mint].symbol=b.uiTokenAmount?.symbol||null; }
  for (const b of whalePre)  { if (!mintMap[b.mint]) mintMap[b.mint]={pre:0,post:0,symbol:null}; }

  if (Object.keys(mintMap).length === 0) {
    for (const b of pre)  { if (!b.mint||STABLES.has(b.mint)) continue; if (!mintMap[b.mint]) mintMap[b.mint]={pre:0,post:0,symbol:null}; mintMap[b.mint].pre  += Number(b.uiTokenAmount?.uiAmount||0); }
    for (const b of post) { if (!b.mint||STABLES.has(b.mint)) continue; if (!mintMap[b.mint]) mintMap[b.mint]={pre:0,post:0,symbol:null}; mintMap[b.mint].post += Number(b.uiTokenAmount?.uiAmount||0); mintMap[b.mint].symbol=b.uiTokenAmount?.symbol||null; }
  }

  let bestMint=null, bestDiff=0, bestSymbol=null;
  for (const [mint,amt] of Object.entries(mintMap)) {
    const diff = amt.post - amt.pre;
    if (Math.abs(diff) > Math.abs(bestDiff)) { bestDiff=diff; bestMint=mint; bestSymbol=amt.symbol; }
  }
  if (!bestMint) return null;

  const action = solDiff < 0 ? 'BUY' : 'SELL';
  console.log(`[parse] ${action} | whale=${whaleAddr.slice(0,8)} | mint=${bestMint.slice(0,8)} | sol=${solDiff.toFixed(4)} | legacy-format`);
  return { action, mint: bestMint, symbol: bestSymbol, whaleSolSize: Math.abs(solDiff) };
}

// ── SIGNAL FILTER ─────────────────────────────────────────────────────────────
function signalFilter(mint, whaleSolSize) {
  if (STABLES.has(mint)) return { ok: false, reason: 'stable' };
  if (whaleSolSize < MIN_WHALE_SOL) return { ok: false, reason: `too_small_${whaleSolSize.toFixed(3)}` };
  const lastBuy = recentBuys.get(mint);
  if (lastBuy && Date.now() - lastBuy < DEDUP_MS) return { ok: false, reason: 'dedup' };
  const cd = cooldowns.get(mint);
  if (cd && Date.now() - cd < COOLDOWN_MS) return { ok: false, reason: 'cooldown' };
  for (const p of posCache.values()) { if (p.mint === mint) return { ok: false, reason: 'already_holding' }; }
  if (posCache.size >= MAX_POSITIONS) return { ok: false, reason: 'max_positions' };
  return { ok: true, reason: 'pass' };
}

// ── BUY ───────────────────────────────────────────────────────────────────────
async function executeBuy(mint, symbol, label, whaleSolSize) {
  if (buyBusy || !kp || !isLive || !isRunning) return;
  const { ok, reason } = signalFilter(mint, whaleSolSize);
  if (!ok) { console.log(`[buy] ⏭ skip ${symbol||mint.slice(0,8)} — ${reason}`); return; }
  recentBuys.set(mint, Date.now());
  buyBusy = true;
  const t0 = Date.now();
  try {
    const walletSol = await getWalletSol();
    if (walletSol < MIN_TRADE_SOL + 0.005) { console.log(`[buy] low balance ${walletSol.toFixed(4)} SOL`); return; }
    const totalExp = [...posCache.values()].reduce((s, p) => s + (p.amount_sol || 0), 0);
    if (totalExp / walletSol >= MAX_EXPOSURE) { console.log('[buy] exposure cap'); return; }
    const poolLiq = await getPoolLiq(mint);
    if (poolLiq > 0 && poolLiq < MIN_POOL_USD) { console.log(`[buy] ⏭ pool $${poolLiq.toFixed(0)} < $${MIN_POOL_USD}`); return; }
    const safety = await isTokenSafe(mint);
    if (!safety.safe) { console.log(`[buy] 🚫 REJECTED ${symbol||mint.slice(0,8)} — ${safety.reason}`); return; }
    const free = walletSol - 0.005;
    const room = walletSol * MAX_EXPOSURE - totalExp;
    const size = Math.min(free * TRADE_PCT, room, free);
    if (size < MIN_TRADE_SOL) { console.log(`[buy] size too small ${size.toFixed(4)}`); return; }
    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[buy] 🔱 ${label}→${symbol||mint.slice(0,8)} | ${size.toFixed(4)} SOL | pool $${(poolLiq||0).toFixed(0)} | whale ${whaleSolSize.toFixed(3)} SOL`);
    const quote  = await jupQuote(SOL_MINT, mint, lamports, BUY_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);
    await confirmTx(txSig); // FIX: verify on-chain landing before treating as a real position
    const latency = Date.now() - t0;
    console.log(`[buy] ✅ ${symbol||'?'} | sig=${txSig.slice(0,16)}… | ${latency}ms`);
    const rawOut      = Number(quote.outAmount || 0);
    const decimals    = await getTokenDecimals(mint); // FIX: was hardcoded 6 — caused entryUsd
                                                        // to be computed on wrong basis vs the
                                                        // live DexScreener/Jupiter price, producing
                                                        // false pnl% readings in pollStopLoss (e.g.
                                                        // logged -56% stop trigger vs -12.9% real loss)
    const tokensHuman = rawOut / Math.pow(10, decimals);
    const entryUsd    = tokensHuman > 0 ? (size * solUsd) / tokensHuman : 0;
    const tradeId     = `live_${Date.now()}_${mint.slice(0,8)}`;
    cooldowns.set(mint, Date.now());
    posCache.set(tradeId, {
      id: tradeId, mint, symbol: symbol||mint.slice(0,8), label,
      entry_price: entryUsd, peak_price: entryUsd,
      amount_sol: size, tokens_received: rawOut,
      token_decimals: decimals, opened_at: new Date().toISOString(),
    });
    savePosCache();
    sbFire('POST', '/rest/v1/shreem_brzee_live_trades', {
      id: tradeId, session_id: 'default', sig: txSig, mint,
      symbol: symbol||mint.slice(0,8), label, wallet: label,
      action: 'BUY', amount_sol: size, gross_sol: size, net_sol: size,
      tokens_received: rawOut, token_decimals: decimals,
      entry_price: entryUsd > 0 ? entryUsd : null,
      sol_usd_at_entry: solUsd, status: 'open',
      opened_at: new Date().toISOString(),
    });
  } catch(e) {
    console.error(`[buy] ❌ ${symbol}: ${e.message}`);
    recentBuys.delete(mint);
  } finally { buyBusy = false; }
}

// ── SELL ──────────────────────────────────────────────────────────────────────
async function executeSell(pos, reason) {
  if (closing.has(pos.id) || !kp) return;
  closing.add(pos.id);
  posCache.delete(pos.id);
  savePosCache();
  const sym = pos.symbol || pos.mint.slice(0,8);
  const t0  = Date.now();
  console.log(`[sell] 🔴 ${sym} reason=${reason}`);
  try {
    let rawAmt = await getTokenBal(pos.mint);
    if (!rawAmt || rawAmt < 1) rawAmt = Number(pos.tokens_received || 0);
    if (!rawAmt || rawAmt < 1) {
      console.log(`[sell] no tokens for ${sym} — closing as stuck`);
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
        status: 'closed', sell_reason: 'no_tokens_stuck',
        closed_at: new Date().toISOString(), pnl_sol: 0, pnl_pct: 0,
      });
      return;
    }
    const quote  = await jupQuote(pos.mint, SOL_MINT, rawAmt, SELL_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);
    await confirmTx(txSig); // FIX: verify it actually landed before declaring success
    const solOut  = Number(quote.outAmount || 0) / LAMPORTS;
    const pnlSol  = solOut - (pos.amount_sol || 0);
    const pnlPct  = pos.amount_sol > 0 ? (pnlSol / pos.amount_sol) * 100 : 0;
    const latency = Date.now() - t0;
    console.log(`[sell] ✅ ${sym} | ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% | ${pnlSol >= 0 ? '+' : ''}${pnlSol.toFixed(4)} SOL | ${latency}ms`);
    sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
      status: 'closed', sell_reason: reason, sell_sig: txSig,
      closed_at: new Date().toISOString(), pnl_sol: pnlSol, pnl_pct: pnlPct,
      exit_price: priceCache.get(pos.mint)?.p || null,
    });
    getWalletSol().then(bal => {
      if (bal > 0) sbFire('PATCH', '/rest/v1/shreem_brzee_session?id=eq.default',
        { portfolio: bal, updated_at: new Date().toISOString() });
    });
  } catch(e) {
    console.error(`[sell] ❌ ${sym}: ${e.message}`);
    posCache.set(pos.id, pos);
  } finally { closing.delete(pos.id); }
}

// ── STOP LOSS + TRAILING (every 3s) ──────────────────────────────────────────
async function pollStopLoss() {
  if (stopBusy || posCache.size === 0) return;
  stopBusy = true;
  try {
    const mints = [...new Set([...posCache.values()].map(p => p.mint).filter(Boolean))];
    await Promise.all(mints.map(fetchPrice));
    for (const [id, pos] of posCache) {
      if (closing.has(id)) continue;
      const entry = Number(pos.entry_price);
      if (!entry || entry <= 0 || !pos.mint) continue;
      const c = priceCache.get(pos.mint);
      if (!c || Date.now() - c.t > 15000) continue;
      const price  = c.p;
      const pnlPct = (price - entry) / entry * 100;
      const peak   = Math.max(pos.peak_price || entry, price);
      pos.peak_price = peak;
      const peakPct  = (peak - entry) / entry * 100;
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${id}&status=eq.open`, {
        exit_price: price, peak_price: peak, pnl_pct: pnlPct,
        pnl_sol: (pos.amount_sol || 0) * (pnlPct / 100),
        updated_at: new Date().toISOString(),
      });
      if (pnlPct <= STOP_LOSS_PCT) {
        console.log(`[stop] 🛑 ${pos.symbol} hard stop ${pnlPct.toFixed(1)}%`);
        await executeSell(pos, 'stop_loss'); continue;
      }
      if (peakPct >= TRAIL_PEAK) {
        const floor = peakPct * trailFloorFraction(peakPct);
        if (pnlPct <= floor) {
          console.log(`[trail] 🔒 ${pos.symbol} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}% floor=${floor.toFixed(1)}%`);
          await executeSell(pos, 'trailing_stop'); continue;
        }
      }
    }
  } catch(e) { console.error('[stop] error:', e.message); }
  finally { stopBusy = false; }
}

// ── WEBHOOK HTTP SERVER ───────────────────────────────────────────────────────
function processWebhookPayload(transactions) {
  for (const tx of transactions) {
    // Signature dedup — Helius can deliver same tx twice
    const sig = tx.signature || tx.transaction?.signatures?.[0];
    if (sig) {
      if (recentSigs.has(sig)) { console.log(`[webhook] dup sig ${sig.slice(0,16)}`); continue; }
      recentSigs.add(sig);
      setTimeout(() => recentSigs.delete(sig), 60000);
    }

    // Find which whale triggered this webhook.
    // Helius Enhanced payloads have NO tx.meta / tx.transaction.message — they carry
    // participant addresses in nativeTransfers / tokenTransfers / accountData instead.
    // Legacy raw-RPC payloads carry them in tx.transaction.message.accountKeys.
    const addrSet = new Set();
    for (const t of (tx.nativeTransfers || [])) {
      if (t.fromUserAccount) addrSet.add(t.fromUserAccount);
      if (t.toUserAccount)   addrSet.add(t.toUserAccount);
    }
    for (const t of (tx.tokenTransfers || [])) {
      if (t.fromUserAccount) addrSet.add(t.fromUserAccount);
      if (t.toUserAccount)   addrSet.add(t.toUserAccount);
    }
    for (const a of (tx.accountData || [])) {
      if (a.account) addrSet.add(a.account);
    }
    if (tx.feePayer) addrSet.add(tx.feePayer);
    const legacyKeys = (tx.transaction?.message?.accountKeys || []).map(k =>
      typeof k === 'string' ? k : (k?.pubkey || k?.toString() || '')
    );
    for (const k of legacyKeys) addrSet.add(k);

    if (addrSet.size === 0) {
      console.log(`[webhook-dbg] ⚠️ SKIPPED — no addresses found | raw_keys=${JSON.stringify(Object.keys(tx))}`);
      console.log(`[webhook-dbg] full_payload: ${JSON.stringify(tx).slice(0, 2000)}`);
      continue;
    }

    const whaleAddr = [...addrSet].find(a => WHALE_ADDRS.has(a));
    if (!whaleAddr) continue;

    const label = WHALE_WALLETS[whaleAddr];
    const swap  = parseWhaleSwap(tx, whaleAddr);
    if (!swap) { console.log(`[webhook] ${label} tx — no swap detected`); continue; }

    console.log(`[webhook] 🐋 ${label} ${swap.action} ${swap.symbol||swap.mint.slice(0,8)} | ${swap.whaleSolSize.toFixed(3)} SOL`);

    if (swap.action === 'BUY') {
      executeBuy(swap.mint, swap.symbol, label, swap.whaleSolSize);
    } else {
      // Whale-sell mirror REMOVED — exits are price-based only, via pollStopLoss()
      // (-25% hard stop, +15% trailing activation locking 65% of peak gain).
      // This log is informational only and does not trigger a sell.
      console.log(`[sell-info] ${label} sold ${swap.symbol||swap.mint.slice(0,8)} — ignored, exit is price-based only`);
    }
  }
}

const server = http.createServer((req, res) => {
  // ── Health check ──
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: 'v18.10-WEBHOOK',
      uptime: Math.floor(process.uptime()),
      positions: posCache.size,
      is_live: isLive,
      is_running: isRunning,
      keypair_loaded: !!kp,
      balance_sol: null,
      sol_usd: solUsd,
      time: new Date().toISOString(),
    }));
    return;
  }

  // ── Webhook receiver ──
  if (req.method === 'POST' && req.url === '/webhook') {
    // Auth check
    const auth = req.headers['authorization'] || req.headers['x-auth-token'] || '';
    if (auth !== WEBHOOK_SECRET) {
      console.log(`[webhook] ❌ unauthorized — got: "${auth}"`);
      res.writeHead(401); res.end('Unauthorized');
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200); res.end('OK'); // respond immediately to Helius
      try {
        const payload = JSON.parse(body);
        const transactions = Array.isArray(payload) ? payload : [payload];
        console.log(`[webhook] 📥 received ${transactions.length} tx(s)`);
        // DEBUG: log first tx structure to understand Helius format
        if (transactions.length > 0) {
          const tx = transactions[0];
          const keys = tx.transaction?.message?.accountKeys || tx.accountData?.map(a=>a.account) || [];
          const hasWhale = keys.some(k => {
            const addr = typeof k === 'string' ? k : k?.pubkey || k?.toString();
            return ['BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu','ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT'].includes(addr);
          });
          console.log(`[webhook-dbg] sig=${tx.signature?.slice(0,16)} type=${tx.type||'?'} source=${tx.source||'?'} hasWhale=${hasWhale} keys=${JSON.stringify(keys.slice(0,3).map(k=>typeof k==='string'?k.slice(0,8):k?.pubkey?.slice(0,8)||'?'))}`);
          if (!hasWhale) {
            // Log top-level fields to understand structure
            console.log(`[webhook-dbg] top-keys: ${JSON.stringify(Object.keys(tx)).slice(0,120)}`);
            // Check accountData field (Helius enhanced format)
            if (tx.accountData) console.log(`[webhook-dbg] accountData[0]: ${JSON.stringify(tx.accountData[0]).slice(0,120)}`);
            if (tx.feePayer) console.log(`[webhook-dbg] feePayer=${tx.feePayer.slice(0,16)}`);
          }
        }
        processWebhookPayload(transactions);
      } catch(e) {
        console.error('[webhook] parse error:', e.message);
      }
    });
    return;
  }

  // ── Live toggle (from Lovable UI via Supabase sync) ──
  if (req.method === 'POST' && req.url === '/toggle') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { live, running } = JSON.parse(body);
        if (typeof live === 'boolean') { isLive = live; console.log(`[toggle] isLive=${live}`); }
        if (typeof running === 'boolean') { isRunning = running; console.log(`[toggle] isRunning=${running}`); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, isLive, isRunning }));
      } catch { res.writeHead(400); res.end('bad json'); }
    });
    return;
  }

  // ── Test sell — injects real token position and fires Jupiter sell ──
  // Usage: POST /test-sell with {"mint":"TOKEN_MINT","amount":1000000}
  // Use a token you actually hold in bot wallet to test real execution
  if (req.method === 'POST' && req.url === '/test-sell') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { mint, amount, symbol } = JSON.parse(body);
        if (!mint) { res.writeHead(400); res.end('missing mint'); return; }
        // Inject fake position into posCache
        const tradeId = `test_${Date.now()}_${mint.slice(0,8)}`;
        const fakePos = {
          id: tradeId, mint, symbol: symbol || mint.slice(0,8), label: 'TEST',
          entry_price: 0.001, peak_price: 0.001,
          amount_sol: 0.01, tokens_received: amount || 1000000,
          token_decimals: 6, opened_at: new Date().toISOString(),
        };
        posCache.set(tradeId, fakePos);
        console.log(`[test-sell] 🧪 injected fake position for ${symbol||mint.slice(0,8)} — firing real sell`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, tradeId, message: 'sell firing — check pm2 logs' }));
        // Fire real sell against Jupiter
        await executeSell(fakePos, 'test_sell');
      } catch(e) {
        console.error('[test-sell] error:', e.message);
        res.writeHead(500); res.end(e.message);
      }
    });
    return;
  }

  // ── /sell — called by Supabase edge function when whale sell detected ──────
  if (req.method === 'POST' && req.url === '/sell') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { mint, tradeId, secret } = JSON.parse(body);
        if (secret !== WEBHOOK_SECRET) { res.writeHead(401); res.end('Unauthorized'); return; }
        if (!mint) { res.writeHead(400); res.end('missing mint'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });

        // Find matching open position
        let pos = null;
        if (tradeId && posCache.has(tradeId)) {
          pos = posCache.get(tradeId);
        } else {
          // Find by mint
          for (const [id, p] of posCache) {
            if (p.mint === mint && !closing.has(id)) { pos = p; break; }
          }
        }

        if (!pos) {
          console.log(`[/sell] no open position for mint=${mint.slice(0,8)}`);
          res.end(JSON.stringify({ ok: false, reason: 'no_position' }));
          return;
        }

        console.log(`[/sell] 🔴 Supabase triggered sell for ${pos.symbol||mint.slice(0,8)}`);
        res.end(JSON.stringify({ ok: true, tradeId: pos.id, message: 'sell firing' }));
        await executeSell(pos, 'whale_sell_mirror');
      } catch(e) {
        console.error('[/sell] error:', e.message);
        res.writeHead(500); res.end(e.message);
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ── SUPABASE SESSION SYNC — reads UI Go Live toggle every 10s ─────────────────
const SESSION_BRIDGE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-session-bridge';
const { execFile } = require('child_process');

async function syncSessionState() {
  return new Promise((resolve) => {
    execFile('curl', ['-s', '--max-time', '5', SESSION_BRIDGE], (err, stdout) => {
      try {
        if (err) { console.log(`[session] ❌ curl error: ${err.message}`); resolve(); return; }
        const row = JSON.parse(stdout.trim());
        if (!row || !row.mode) { console.log('[session] ⚠️ no mode in response'); resolve(); return; }
        const wantLive = row.mode === 'live';
        if (wantLive !== isLive) {
          isLive    = wantLive;
          isRunning = wantLive;
          console.log(`[session] ✅ synced → isLive=${isLive} mode=${row.mode}`);
        }
      } catch(e) {
        console.log(`[session] ❌ parse error: ${e.message}`);
      }
      resolve();
    });
  });
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
(async () => {
  await loadKeypair();
  loadPosCache();

  // Read initial state from Supabase before accepting webhooks
  await syncSessionState();
  console.log(`[shreem] Initial state: isLive=${isLive} isRunning=${isRunning}`);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[shreem] v18.10-WEBHOOK listening on port ${PORT}`);
    console.log(`[shreem] Webhook endpoint: POST http://YOUR_IP:${PORT}/webhook`);
    console.log(`[shreem] Health: GET http://YOUR_IP:${PORT}/health`);
    console.log(`[shreem] Wallets: ${Object.values(WHALE_WALLETS).join(', ')}`);
    console.log(`[shreem] Auth header: "${WEBHOOK_SECRET}"`);
  });

  // SOL price refresh — immediately on startup, then every 5 min
  // FIX: previously only refreshed on the 5-min interval with no initial call,
  // so solUsd stayed at the hardcoded stale default (150, ~2x real price) for
  // up to 5 minutes after every restart -- inflating entryUsd and causing false
  // stop-loss triggers (e.g. logged -56% vs real -12.9% loss) on every trade
  // that happened shortly after a deploy/restart.
  async function refreshSolUsd() {
    try {
      // FIX: V2 confirmed dead (empty response). V3: different base URL + usdPrice field.
      const d = await httpJSON('https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112', 'GET', null, {}, 5000);
      const p = parseFloat(d?.['So11111111111111111111111111111111111111112']?.usdPrice || 0);
      if (p > 0) { solUsd = p; console.log(`[price] SOL/USD refreshed: $${p.toFixed(2)}`); }
      else { console.error(`[price] SOL/USD refresh returned no price — raw response: ${JSON.stringify(d).slice(0,200)}`); }
    } catch (e) { console.error('[price] SOL/USD refresh failed:', e.message); }
  }
  refreshSolUsd(); // fire immediately, don't wait for the first interval tick
  setInterval(refreshSolUsd, 300000);

  // Stop loss / trailing poll every 3s
  setInterval(pollStopLoss, STOP_POLL_MS);

  // UI session sync every 10s — reads Go Live toggle from Supabase
  setInterval(syncSessionState, 10000);

  console.log('[shreem] ✅ Ready — waiting for Helius webhook pushes');
  console.log('[shreem] UI sync active — Go Live button controls bot every 10s');
})();




