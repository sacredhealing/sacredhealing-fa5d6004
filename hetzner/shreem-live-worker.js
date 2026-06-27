// shreem-live-worker.js — Shreem Brzee v16.4 LaserStream
// Architecture: Helius WSS → detect whale swap <50ms → Jupiter swap direct on Hetzner
// Supabase: LOGGING ONLY — never in execution path
// 3 wallets: Cented, Remusofmars, trunoest
// Keypair: file → env → Supabase (triple fallback, loads once at boot)
// WS: exponential backoff reconnect, ping/pong keepalive
// Signal filters: min SOL size, duplicate suppression, stable skip
'use strict';
const https   = require('https');
const http    = require('http');
const fs      = require('fs');
const WebSocket = require('ws');
const nacl    = require('tweetnacl');
const bs58    = require('bs58');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'e2f69606-6be5-435c-9674-87ffb55cc5a6';
const HELIUS_RPC     = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_WSS     = `wss://atlas-mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SUPABASE_URL   = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2OTMyOTAsImV4cCI6MjAzMTI2OTI5MH0.C_QKdlXJ2TKPuTIHKhAMrHkdPJSmUBNjJwmMFb7xFaE';
const BRIDGE_URL     = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/worker-bridge';
const BRIDGE_SECRET  = 'shreem2026';
const BOT_WALLET     = 'Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA';
const KEY_FILE       = '/root/.shreem_key';
const PORT           = 3001;

// ── WHALE WALLETS — 3 active, confirmed ──────────────────────────────────────
const WHALE_WALLETS = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT':   'trunoest',
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SOL_MINT      = 'So11111111111111111111111111111111111111112';
const USDC_MINT     = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT     = 'Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1';
const STABLES       = new Set([USDC_MINT, USDT_MINT, SOL_MINT]);
const LAMPORTS      = 1_000_000_000;
const BUY_SLIPPAGE  = 2500;   // 25% — meme coins need this
const SELL_SLIPPAGE = 5000;   // 50%
const STOP_LOSS_PCT = -25;
const TRAIL_PEAK    = 30;     // activate trailing at +30%
const TRAIL_FLOOR   = 0.5;    // lock 50% of peak gains
const MAX_POSITIONS = 3;      // 1 per whale max
const MIN_TRADE_SOL = 0.02;
const TRADE_PCT     = 0.05;   // 5% per trade
const MAX_EXPOSURE  = 0.50;
const MIN_POOL_USD  = 5000;
const MIN_WHALE_SOL = 0.1;    // ignore whale trades < 0.1 SOL (noise/dust)
const COOLDOWN_MS   = 300000; // 5min cooldown per mint after buy
const DEDUP_MS      = 8000;   // suppress duplicate signals on same mint within 8s
const STOP_POLL_MS  = 2000;

// ── SIGNAL DEDUP CACHE ────────────────────────────────────────────────────────
// Prevents double-firing if 2 whales buy same token within DEDUP_MS
const recentSignals = new Map(); // mint → timestamp of last signal processed

// ── KEYPAIR ───────────────────────────────────────────────────────────────────
let kp = null;

function parseKeypair(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    const t = raw.trim();
    let sk;
    if (t.startsWith('['))      sk = new Uint8Array(JSON.parse(t));
    else if (t.includes(','))   sk = new Uint8Array(t.split(',').map(Number));
    else                        sk = bs58.decode(t);
    if (sk.length !== 64) throw new Error(`bad length ${sk.length}`);
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    const pub  = bs58.encode(pair.publicKey);
    console.log('[keypair] ✅ loaded:', pub);
    return { secretKey: sk, publicKey: pair.publicKey, publicKeyB58: pub };
  } catch(e) { console.error('[keypair] parse error:', e.message); return null; }
}

async function loadKeypair() {
  // 1. Try /root/.shreem_key file (fastest, most reliable)
  try {
    const raw = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (raw) {
      const k = parseKeypair(raw);
      if (k) { kp = k; console.log('[keypair] ✅ source: file'); return; }
    }
  } catch(e) { console.log('[keypair] no file:', e.code); }

  // 2. Try env var
  const envKey = process.env.SHREEM_BOT_KEYPAIR || '';
  if (envKey.trim()) {
    const k = parseKeypair(envKey.trim());
    if (k) { kp = k; console.log('[keypair] ✅ source: env'); return; }
  }

  // 3. Try Supabase worker-bridge
  try {
    const res = await httpJSON(BRIDGE_URL, 'POST',
      { action: 'get_secret', name: 'SHREEM_BOT_KEYPAIR' },
      { 'x-bridge-secret': BRIDGE_SECRET, 'Content-Type': 'application/json' }
    );
    const val = res?.value || res?.data?.value;
    if (val && val.trim()) {
      const k = parseKeypair(val.trim());
      if (k) { kp = k; console.log('[keypair] ✅ source: bridge'); return; }
    }
  } catch(e) { console.error('[keypair] bridge failed:', e.message); }

  // 4. Try Supabase REST directly with anon key (bot_secrets table)
  try {
    const res = await httpJSON(
      `${SUPABASE_URL}/rest/v1/bot_secrets?name=eq.SHREEM_BOT_KEYPAIR&select=value&limit=1`,
      'GET', null,
      { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Accept': 'application/json' }
    );
    const val = Array.isArray(res) ? res[0]?.value : res?.value;
    if (val && val.trim()) {
      const k = parseKeypair(val.trim());
      if (k) { kp = k; console.log('[keypair] ✅ source: supabase rest'); return; }
    }
  } catch(e) { console.error('[keypair] supabase rest failed:', e.message); }

  console.error('[keypair] ❌ FAILED — no keypair found. Bot will detect but NOT execute trades.');
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

// ── SUPABASE FIRE-AND-FORGET (non-blocking logging) ───────────────────────────
const SB_HDR = { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' };
function sbGet(table, filter) {
  return httpJSON(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, 'GET', null, SB_HDR)
    .then(d => Array.isArray(d) ? d : []).catch(() => []);
}
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

// ── TX SIGNING (pure nacl) ────────────────────────────────────────────────────
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

// ── JUPITER ───────────────────────────────────────────────────────────────────
async function jupQuote(inputMint, outputMint, amount, slippage) {
  const url = `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}&onlyDirectRoutes=false&asLegacyTransaction=false`;
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
const priceCache = new Map(); // mint → { p, t }
const PRICE_TTL  = 3000;

async function fetchPrice(mint) {
  const c = priceCache.get(mint);
  if (c && Date.now() - c.t < PRICE_TTL) return c.p;
  // DexScreener (best for meme coins — has liquidity data too)
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, 'GET', null, {}, 5000);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0));
      const p = parseFloat(pairs[0].priceUsd);
      if (p > 0) { priceCache.set(mint, { p, t: Date.now() }); return p; }
    }
  } catch {}
  // Jupiter fallback
  try {
    const d = await httpJSON(`https://api.jup.ag/price/v2?ids=${mint}`, 'GET', null, {}, 4000);
    const p = parseFloat(Object.values(d?.data || {})[0]?.price || 0);
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

// ── STATE ─────────────────────────────────────────────────────────────────────
const posCache  = new Map();  // id → position
const closing   = new Set();  // ids currently being sold
const cooldowns = new Map();  // mint → timestamp of last buy
let solUsd      = 150;
let isLive      = true;       // HARDCODED LIVE — controlled by Supabase sync override
let isRunning   = true;       // HARDCODED RUNNING
let buyBusy     = false;

// ── SIGNAL QUALITY CHECK ──────────────────────────────────────────────────────
// Returns { ok: bool, reason: string }
function signalFilter(mint, whaleSolSize) {
  // 1. Skip stables
  if (STABLES.has(mint)) return { ok: false, reason: 'stable' };

  // 2. Whale trade too small — ignore dust/test txs
  if (whaleSolSize < MIN_WHALE_SOL) return { ok: false, reason: `whale_size_${whaleSolSize.toFixed(3)}sol` };

  // 3. Duplicate signal suppression — same mint within DEDUP_MS
  const lastSig = recentSignals.get(mint);
  if (lastSig && Date.now() - lastSig < DEDUP_MS) return { ok: false, reason: 'dedup_window' };

  // 4. Cooldown — already bought this mint in last 5 min
  const lastBuy = cooldowns.get(mint);
  if (lastBuy && Date.now() - lastBuy < COOLDOWN_MS) return { ok: false, reason: 'cooldown' };

  // 5. Already holding this mint
  for (const p of posCache.values()) {
    if (p.mint === mint) return { ok: false, reason: 'already_holding' };
  }

  // 6. Max positions
  if (posCache.size >= MAX_POSITIONS) return { ok: false, reason: 'max_positions' };

  return { ok: true, reason: 'pass' };
}

// ── BUY ───────────────────────────────────────────────────────────────────────
async function executeBuy(mint, symbol, label, whaleSolSize) {
  if (buyBusy || !kp || !isLive || !isRunning) return;

  const { ok, reason } = signalFilter(mint, whaleSolSize);
  if (!ok) { console.log(`[buy] ⏭ skip ${symbol || mint.slice(0,8)} — ${reason}`); return; }

  // Mark dedup immediately — before async ops
  recentSignals.set(mint, Date.now());

  buyBusy = true;
  const t0 = Date.now();
  try {
    const walletSol = await getWalletSol();
    if (walletSol < MIN_TRADE_SOL + 0.005) {
      console.log(`[buy] low balance ${walletSol.toFixed(4)} SOL`); return;
    }

    const totalExp = [...posCache.values()].reduce((s, p) => s + (p.amount_sol || 0), 0);
    if (totalExp / walletSol >= MAX_EXPOSURE) { console.log('[buy] exposure cap'); return; }

    // Pool liquidity check — do NOT skip if DexScreener is slow (returns 0)
    const poolLiq = await getPoolLiq(mint);
    if (poolLiq > 0 && poolLiq < MIN_POOL_USD) {
      console.log(`[buy] ⏭ pool $${poolLiq.toFixed(0)} < $${MIN_POOL_USD}`); return;
    }

    const free = walletSol - 0.005;
    const room = walletSol * MAX_EXPOSURE - totalExp;
    const size = Math.min(free * TRADE_PCT, room, free);
    if (size < MIN_TRADE_SOL) { console.log(`[buy] size too small ${size.toFixed(4)}`); return; }

    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[buy] 🔱 ${label}→${symbol || mint.slice(0,8)} | ${size.toFixed(4)} SOL | pool $${(poolLiq||0).toFixed(0)} | whale ${whaleSolSize.toFixed(3)} SOL`);

    const quote  = await jupQuote(SOL_MINT, mint, lamports, BUY_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);

    const latency = Date.now() - t0;
    console.log(`[buy] ✅ ${symbol} | sig=${txSig.slice(0,16)}… | ${latency}ms`);

    const rawOut     = Number(quote.outAmount || 0);
    const decimals   = 6;
    const tokensHuman = rawOut / Math.pow(10, decimals);
    const entryUsd   = tokensHuman > 0 ? (size * solUsd) / tokensHuman : 0;
    const tradeId    = `live_${Date.now()}_${mint.slice(0,8)}`;

    cooldowns.set(mint, Date.now());

    posCache.set(tradeId, {
      id: tradeId, mint, symbol: symbol || mint.slice(0,8), label,
      entry_price: entryUsd, peak_price: entryUsd,
      amount_sol: size, tokens_received: rawOut,
      token_decimals: decimals, opened_at: new Date().toISOString(),
    });

    // Log async — NEVER blocks execution
    sbFire('POST', '/rest/v1/shreem_brzee_live_trades', {
      id: tradeId, session_id: 'default', sig: txSig, mint,
      symbol: symbol || mint.slice(0,8), label, wallet: label,
      action: 'BUY', amount_sol: size, gross_sol: size, net_sol: size,
      tokens_received: rawOut, token_decimals: decimals,
      entry_price: entryUsd > 0 ? entryUsd : null,
      sol_usd_at_entry: solUsd, status: 'open',
      opened_at: new Date().toISOString(),
    });

  } catch(e) {
    console.error(`[buy] ❌ ${symbol}: ${e.message}`);
    // Clear dedup on failure so next whale signal can retry
    recentSignals.delete(mint);
  } finally {
    buyBusy = false;
  }
}

// ── SELL ──────────────────────────────────────────────────────────────────────
async function executeSell(pos, reason) {
  if (closing.has(pos.id) || !kp) return;
  closing.add(pos.id);
  posCache.delete(pos.id);
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
        updated_at: new Date().toISOString(),
      });
      return;
    }
    const quote  = await jupQuote(pos.mint, SOL_MINT, rawAmt, SELL_SLIPPAGE);
    const swapTx = await jupSwapTx(quote);
    const txSig  = await signAndSendTx(swapTx);
    const solOut  = Number(quote.outAmount || 0) / LAMPORTS;
    const pnlSol  = solOut - (pos.amount_sol || 0);
    const pnlPct  = pos.amount_sol > 0 ? (pnlSol / pos.amount_sol) * 100 : 0;
    const latency = Date.now() - t0;
    console.log(`[sell] ✅ ${sym} | ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% | ${pnlSol >= 0 ? '+' : ''}${pnlSol.toFixed(4)} SOL | ${latency}ms`);
    sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
      status: 'closed', sell_reason: reason, sell_sig: txSig,
      closed_at: new Date().toISOString(), pnl_sol: pnlSol, pnl_pct: pnlPct,
      exit_price: priceCache.get(pos.mint)?.p || null,
      updated_at: new Date().toISOString(),
    });
    getWalletSol().then(bal => {
      if (bal > 0) sbFire('PATCH', '/rest/v1/shreem_brzee_session?id=eq.default',
        { portfolio: bal, updated_at: new Date().toISOString() });
    });
  } catch(e) {
    console.error(`[sell] ❌ ${sym}: ${e.message}`);
    posCache.set(pos.id, pos); // restore for retry
  } finally {
    closing.delete(pos.id);
  }
}

// ── STOP LOSS + TRAILING (every 2s) ──────────────────────────────────────────
let stopBusy = false;
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
      const price   = c.p;
      const pnlPct  = (price - entry) / entry * 100;
      const peak    = Math.max(pos.peak_price || entry, price);
      pos.peak_price = peak;
      const peakPct = (peak - entry) / entry * 100;
      // Non-blocking DB update
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
        const floor = peakPct * TRAIL_FLOOR;
        if (pnlPct <= floor) {
          console.log(`[trail] 🔒 ${pos.symbol} peak=${peakPct.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
          await executeSell(pos, 'trailing_stop'); continue;
        }
      }
      const ageH = (Date.now() - new Date(pos.opened_at).getTime()) / 3600000;
      if (ageH >= 48) { await executeSell(pos, 'timeout_48h'); }
    }
  } catch(e) { console.error('[stop] error:', e.message); }
  finally { stopBusy = false; }
}

// ── TX PARSER ─────────────────────────────────────────────────────────────────
function parseWhaleSwap(tx, whaleAddr) {
  const meta = tx.meta || tx.transaction?.meta;
  const msg  = tx.transaction?.message || tx.message;
  if (!meta || !msg) return null;
  const keys    = (msg.accountKeys || []).map(k => typeof k === 'string' ? k : k?.pubkey || '');
  const wi      = keys.indexOf(whaleAddr);
  if (wi < 0) return null;
  const solDiff = ((meta.postBalances?.[wi] || 0) - (meta.preBalances?.[wi] || 0)) / LAMPORTS;
  const preT  = (meta.preTokenBalances  || []).filter(b => keys[b.accountIndex] === whaleAddr || b.owner === whaleAddr);
  const postT = (meta.postTokenBalances || []).filter(b => keys[b.accountIndex] === whaleAddr || b.owner === whaleAddr);
  let mint = null, tokenDiff = 0, symbol = null;
  const allMints = new Set([...preT.map(b => b.mint), ...postT.map(b => b.mint)].filter(m => !STABLES.has(m)));
  for (const m of allMints) {
    const pre     = preT.find(b => b.mint === m);
    const post    = postT.find(b => b.mint === m);
    const preAmt  = Number(pre?.uiTokenAmount?.uiAmount  || 0);
    const postAmt = Number(post?.uiTokenAmount?.uiAmount || 0);
    const diff    = postAmt - preAmt;
    if (Math.abs(diff) > Math.abs(tokenDiff)) { mint = m; tokenDiff = diff; symbol = post?.uiTokenAmount?.symbol || null; }
  }
  if (!mint || Math.abs(solDiff) < 0.001) return null;
  return {
    action: tokenDiff > 0 ? 'BUY' : 'SELL',
    mint, symbol, whaleSolSize: Math.abs(solDiff),
  };
}

// ── WEBSOCKET — exponential backoff reconnect ─────────────────────────────────
let ws          = null;
let pingTimer   = null;
let reconnTimer = null;
let reconnDelay = 2000;      // starts at 2s, backs off to 60s max
const MAX_DELAY = 60000;

function connect() {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  console.log(`[ws] 🔌 Connecting… (delay was ${reconnDelay}ms)`);
  ws = new WebSocket(HELIUS_WSS);

  ws.on('open', () => {
    console.log('[ws] ✅ Connected — LaserStream active');
    reconnDelay = 2000; // reset backoff on successful connect

    // Subscribe all 3 whale wallets — signatures only (cheapest, fastest)
    for (const [addr, name] of Object.entries(WHALE_WALLETS)) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: Date.now(),
        method: 'transactionSubscribe',
        params: [
          { accountInclude: [addr] },
          {
            commitment: 'processed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            showRewards: false,
            maxSupportedTransactionVersion: 0,
          },
        ],
      }));
      console.log(`[ws] 📡 ${name} subscribed`);
    }

    // Keepalive ping every 20s
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (ws.readyState === 1) ws.ping();
    }, 20000);
  });

  ws.on('message', async (raw) => {
    const t0 = Date.now();
    try {
      const msg = JSON.parse(raw.toString());
      // Subscription confirmations — ignore
      if (msg.result !== undefined && msg.id !== undefined) return;

      // Full stream — transaction arrives complete, no extra RPC call needed
      const tx = msg.params?.result?.transaction;
      if (!tx) return;

      const keys      = (tx.transaction?.message?.accountKeys || []).map(k => typeof k === 'string' ? k : k?.pubkey || '');
      const whaleAddr = keys.find(a => WHALE_ADDRS.has(a));
      if (!whaleAddr) return;

      const label = WHALE_WALLETS[whaleAddr];
      const swap  = parseWhaleSwap(tx, whaleAddr);
      if (!swap) return;

      const detectMs = Date.now() - t0;
      console.log(`[ws] 🐋 ${label} ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} | ${swap.whaleSolSize.toFixed(3)} SOL | detect=${detectMs}ms`);

      if (swap.action === 'BUY') {
        executeBuy(swap.mint, swap.symbol, label, swap.whaleSolSize);
      } else {
        // Mirror SELL — close any matching position immediately
        for (const [id, pos] of posCache) {
          if (pos.mint === swap.mint && !closing.has(id)) {
            executeSell(pos, 'whale_sell_mirror'); break;
          }
        }
      }
    } catch(e) { console.error('[ws] msg error:', e.message); }
  });

  ws.on('pong', () => { /* keepalive ack */ });
  ws.on('error', (e) => console.error('[ws] error:', e.message));
  ws.on('close', (code, reason) => {
    console.log(`[ws] ❌ Closed code=${code} — reconnect in ${reconnDelay}ms`);
    if (pingTimer) clearInterval(pingTimer);
    if (reconnTimer) clearTimeout(reconnTimer);
    reconnTimer = setTimeout(() => {
      reconnDelay = Math.min(reconnDelay * 2, MAX_DELAY);
      connect();
    }, reconnDelay);
  });
}

// ── SESSION + POSITION SYNC ───────────────────────────────────────────────────
async function syncSession() {
  try {
    const rows = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at');
    const s = rows[0];
    if (s) {
      // Only override if DB explicitly says stopped
      const dbLive    = s.mode === 'live';
      const dbRunning = !!(s.started_at && !s.stopped_at);
      isLive    = dbLive;
      isRunning = dbRunning;
    }
  } catch(e) { /* keep hardcoded values on error */ }
}

async function syncPositions() {
  try {
    const rows = await sbGet('shreem_brzee_live_trades', 'status=in.(open,pending)&select=id,mint,symbol,label,entry_price,peak_price,amount_sol,tokens_received,token_decimals,opened_at');
    const dbIds = new Set(rows.map(r => r.id));
    for (const [id] of posCache) { if (!dbIds.has(id)) posCache.delete(id); }
    for (const r of rows) {
      if (!posCache.has(r.id)) posCache.set(r.id, {
        ...r,
        entry_price: Number(r.entry_price) || 0,
        peak_price:  Number(r.peak_price)  || Number(r.entry_price) || 0,
        amount_sol:  Number(r.amount_sol)  || 0,
      });
    }
  } catch(e) { /* keep in-memory state */ }
}

async function refreshSolPrice() {
  try {
    const r = await httpJSON('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT', 'GET', null, {}, 5000);
    if (r?.price) solUsd = parseFloat(r.price);
  } catch {}
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const bal = await getWalletSol().catch(() => 0);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    version: 'v16.5-LaserStream',
    uptime: Math.floor(process.uptime()),
    ws_state: ws ? ['CONNECTING','OPEN','CLOSING','CLOSED'][ws.readyState] : 'null',
    positions: posCache.size,
    is_live: isLive,
    is_running: isRunning,
    keypair_loaded: !!kp,
    balance_sol: bal,
    sol_usd: solUsd,
    dedup_cache: recentSignals.size,
    time: new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health :${PORT}`));

// ── BOOT ──────────────────────────────────────────────────────────────────────
console.log('[shreem] v16.5 LaserStream-Full booting — Cented | Remusofmars | trunoest');
(async () => {
  await loadKeypair();
  await syncSession();
  await syncPositions();
  await refreshSolPrice();
  connect();
})();

setInterval(syncSession,     30000);
setInterval(syncPositions,   20000);
setInterval(pollStopLoss,    STOP_POLL_MS);
setInterval(refreshSolPrice, 60000);

// Prune dedup cache every minute (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [mint, ts] of recentSignals) {
    if (now - ts > DEDUP_MS * 3) recentSignals.delete(mint);
  }
}, 60000);
