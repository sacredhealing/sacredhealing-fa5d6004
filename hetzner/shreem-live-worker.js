// shreem-live-worker.js — Shreem Brzee v16 LaserStream
// Architecture: Helius WebSocket → detect whale swap <50ms → Jupiter swap direct on Hetzner
// Supabase is LOGGING ONLY — never in the execution path
// No Supabase round-trip before entry or exit. All swap logic runs locally.

'use strict';
const https   = require('https');
const http    = require('http');
const WebSocket = require('ws');
const { Connection, VersionedTransaction, Keypair } = require('@solana/web3.js');
const bs58    = require('bs58');

// ── ENV ───────────────────────────────────────────────────────────────────────
const HELIUS_API_KEY  = process.env.HELIUS_API_KEY   || '';
const HELIUS_RPC      = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_WSS      = `wss://atlas-mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SUPABASE_URL    = process.env.SUPABASE_URL      || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RAW_KEYPAIR     = process.env.SHREEM_BOT_KEYPAIR || '';
const BOT_WALLET      = 'Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA';
const PORT            = 3001;

// ── WHALE WALLETS (active 5) ──────────────────────────────────────────────────
const WHALE_WALLETS = {
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC': 'clukz',
  '8MaVa9kdt3NW4Q5HyNAm1X5LbR8PQRVDc1W8NMVK88D5': 'Daumen',
  '5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg':  'Doji',
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SOL_MINT        = 'So11111111111111111111111111111111111111112';
const USDC_MINT       = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT       = 'Es9vMFrzaCERmJfrF4H2FYD4KConKzMNFNcZb3yNpFP1';
const STABLES         = new Set([USDC_MINT, USDT_MINT, SOL_MINT]);
const LAMPORTS        = 1_000_000_000;
const BUY_SLIPPAGE    = 2500;  // 25%
const SELL_SLIPPAGE   = 5000;  // 50%
const STOP_LOSS_PCT   = -25;   // -25%
const TRAIL_PEAK_PCT  = 30;    // activate trailing at +30%
const TRAIL_FLOOR_PCT = 0.5;   // lock 50% of peak gains
const MAX_POSITIONS   = 5;
const MIN_TRADE_SOL   = 0.02;
const MAX_TRADE_PCT   = 0.05;  // 5% of wallet per trade
const MAX_EXPOSURE    = 0.50;  // 50% max wallet in open trades
const MIN_WHALE_SOL   = 0.3;   // ignore Cented dust trades < 0.3 SOL
const MIN_POOL_USD    = 10000; // ignore tokens with < $10k liquidity
const PRICE_TTL_MS    = 3000;
const STOP_POLL_MS    = 2000;  // check stop loss every 2s (was 3s)

// ── KEYPAIR ───────────────────────────────────────────────────────────────────
let keypair = null;
function loadKeypair() {
  if (!RAW_KEYPAIR) { console.error('[keypair] SHREEM_BOT_KEYPAIR not set'); return null; }
  try {
    let sk;
    const t = RAW_KEYPAIR.trim();
    if (t.startsWith('[')) sk = Uint8Array.from(JSON.parse(t));
    else if (t.includes(',')) sk = Uint8Array.from(t.split(',').map(Number));
    else sk = bs58.decode(t);
    if (sk.length !== 64) throw new Error(`bad length ${sk.length}`);
    return Keypair.fromSecretKey(sk);
  } catch(e) { console.error('[keypair] load failed:', e.message); return null; }
}
keypair = loadKeypair();
console.log('[keypair]', keypair ? `✅ ${keypair.publicKey.toBase58()}` : '❌ NOT LOADED');

// ── SOLANA CONNECTION (for sending) ───────────────────────────────────────────
const connection = new Connection(HELIUS_RPC, 'confirmed');

// ── IN-MEMORY STATE ───────────────────────────────────────────────────────────
// positionCache: id → { id, mint, symbol, label, entry_price, peak_price, amount_sol, tokens_received, token_decimals, opened_at }
const positionCache = new Map();
const priceCache    = new Map();  // mint → { price, updatedAt }
const closingSet    = new Set();  // ids being closed right now
const mintCooldown  = new Map();  // mint → timestamp (prevent double-buy)
let solUsd = 150;
let isLive = false;
let isRunning = false;

// ── SUPABASE HELPERS (async, non-blocking — never await in execution path) ────
const SB_HDR = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};
function sbFire(method, path, body) {
  // Fire and forget — never blocks execution
  const url = `${SUPABASE_URL}${path}`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443,
    path: u.pathname + u.search,
    method, headers: { ...SB_HDR, 'Content-Length': body ? Buffer.byteLength(JSON.stringify(body)) : 0 },
  };
  const req = https.request(opts, (res) => { res.resume(); });
  req.on('error', () => {});
  req.setTimeout(8000, () => req.destroy());
  if (body) req.write(JSON.stringify(body));
  req.end();
}
function sbGet(table, filter) {
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET', headers: SB_HDR };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
    req.end();
  });
}

// ── JUPITER SWAP ──────────────────────────────────────────────────────────────
function httpJSON(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443,
      path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function jupQuote(inputMint, outputMint, amount, slippage) {
  const url = `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}&onlyDirectRoutes=false&asLegacyTransaction=false`;
  const q = await httpJSON(url);
  if (!q || q.error) throw new Error(`quote failed: ${q?.error || 'no data'}`);
  return q;
}

async function jupSwapTx(quote, walletPub) {
  const body = {
    quoteResponse: quote,
    userPublicKey: walletPub,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 1000000, priorityLevel: 'high' } },
  };
  const res = await httpJSON('https://api.jup.ag/swap/v1/swap', 'POST', body);
  if (!res?.swapTransaction) throw new Error('no swapTransaction from Jupiter');
  return res.swapTransaction;
}

async function signAndSend(txB64) {
  if (!keypair) throw new Error('no keypair');
  const txBytes = Buffer.from(txB64, 'base64');
  const tx = VersionedTransaction.deserialize(txBytes);
  tx.sign([keypair]);
  const serialized = Buffer.from(tx.serialize()).toString('base64');
  // Send via Helius RPC
  const res = await httpJSON(HELIUS_RPC, 'POST', {
    jsonrpc: '2.0', id: 1, method: 'sendTransaction',
    params: [serialized, { encoding: 'base64', skipPreflight: true, maxRetries: 3 }],
  });
  if (res.error) throw new Error(`sendTransaction: ${res.error.message}`);
  return res.result; // tx signature
}

// ── PRICE FETCHER ─────────────────────────────────────────────────────────────
async function fetchPrice(mint) {
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.updatedAt < PRICE_TTL_MS) return cached.price;
  // DexScreener first
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (pairs.length) {
      pairs.sort((a, b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
      const price = parseFloat(pairs[0].priceUsd);
      if (price > 0) { priceCache.set(mint, { price, updatedAt: Date.now() }); return price; }
    }
  } catch {}
  // Jupiter fallback
  try {
    const d = await httpJSON(`https://api.jup.ag/price/v2?ids=${mint}`);
    const price = parseFloat(Object.values(d?.data || {})[0]?.price || 0);
    if (price > 0) { priceCache.set(mint, { price, updatedAt: Date.now() }); return price; }
  } catch {}
  return 0;
}

async function getPoolLiquidity(mint) {
  try {
    const d = await httpJSON(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = (d?.pairs || []).filter(p => parseFloat(p?.priceUsd) > 0);
    if (!pairs.length) return 0;
    pairs.sort((a, b) => parseFloat(b.liquidity?.usd||0) - parseFloat(a.liquidity?.usd||0));
    return parseFloat(pairs[0].liquidity?.usd || 0);
  } catch { return 0; }
}

async function getWalletBalanceSol() {
  try {
    const res = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc: '2.0', id: 1, method: 'getBalance', params: [BOT_WALLET],
    });
    return (res?.result?.value || 0) / LAMPORTS;
  } catch { return 0; }
}

async function getTokenBalance(mint) {
  try {
    const res = await httpJSON(HELIUS_RPC, 'POST', {
      jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
      params: [BOT_WALLET, { mint }, { encoding: 'jsonParsed' }],
    });
    const accounts = res?.result?.value || [];
    return accounts.reduce((s, a) => s + Number(a?.account?.data?.parsed?.info?.tokenAmount?.amount || 0), 0);
  } catch { return 0; }
}

// ── BUY EXECUTION ─────────────────────────────────────────────────────────────
let buyBusy = false;
async function executeBuy(mint, symbol, label, whaleSolSize) {
  if (buyBusy) return;
  if (!keypair) { console.log('[buy] no keypair'); return; }
  if (!isLive || !isRunning) { console.log('[buy] bot not live/running'); return; }
  if (STABLES.has(mint)) return;

  // Cooldown check (5 min per mint)
  const lastBuy = mintCooldown.get(mint) || 0;
  if (Date.now() - lastBuy < 300000) { console.log(`[buy] ⏭ ${symbol} on cooldown`); return; }

  // Max positions
  if (positionCache.size >= MAX_POSITIONS) { console.log(`[buy] max positions (${MAX_POSITIONS})`); return; }

  // Already holding this mint
  for (const p of positionCache.values()) { if (p.mint === mint) { console.log(`[buy] already holding ${symbol}`); return; } }

  // Whale size filter — ignore dust
  if (whaleSolSize > 0 && whaleSolSize < MIN_WHALE_SOL) {
    console.log(`[buy] ⏭ ${symbol} whale size ${whaleSolSize.toFixed(3)} SOL < min ${MIN_WHALE_SOL} SOL`);
    return;
  }

  buyBusy = true;
  const t0 = Date.now();
  try {
    // Get live wallet balance
    const walletSol = await getWalletBalanceSol();
    if (walletSol < MIN_TRADE_SOL + 0.003) { console.log(`[buy] insufficient balance ${walletSol.toFixed(4)} SOL`); return; }

    // Exposure cap
    const totalExposure = [...positionCache.values()].reduce((s, p) => s + (p.amount_sol || 0), 0);
    if (totalExposure / walletSol >= MAX_EXPOSURE) { console.log(`[buy] exposure cap ${(totalExposure/walletSol*100).toFixed(0)}%`); return; }

    // Pool liquidity filter
    const poolLiq = await getPoolLiquidity(mint);
    if (poolLiq > 0 && poolLiq < MIN_POOL_USD) {
      console.log(`[buy] ⏭ ${symbol} pool $${poolLiq.toFixed(0)} < $${MIN_POOL_USD}`);
      return;
    }

    // Position size: 5% of wallet, capped at exposure room
    const freeBalance = walletSol - 0.003;
    const exposureRoom = walletSol * MAX_EXPOSURE - totalExposure;
    const size = Math.min(freeBalance * MAX_TRADE_PCT, exposureRoom, freeBalance);
    if (size < MIN_TRADE_SOL) { console.log(`[buy] size too small ${size.toFixed(4)}`); return; }

    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[buy] 🔱 ${label} → ${symbol} | ${size.toFixed(4)} SOL | pool $${poolLiq.toFixed(0)} | lat ${Date.now()-t0}ms`);

    const quote  = await jupQuote(SOL_MINT, mint, lamports, BUY_SLIPPAGE);
    const swapTx = await jupSwapTx(quote, BOT_WALLET);
    const txSig  = await signAndSend(swapTx);

    const latency = Date.now() - t0;
    console.log(`[buy] ✅ ${symbol} tx=${txSig.slice(0,16)}… | ${latency}ms`);

    // Calculate entry price
    const rawOut     = Number(quote.outAmount || 0);
    const decimals   = 6; // will be refined async
    const tokensHuman = rawOut / Math.pow(10, decimals);
    const entryPriceUsd = tokensHuman > 0 ? (size * solUsd) / tokensHuman : 0;

    const tradeId = `live_${Date.now()}_${mint.slice(0,8)}`;
    mintCooldown.set(mint, Date.now());

    // Store in memory immediately
    positionCache.set(tradeId, {
      id: tradeId, mint, symbol: symbol || mint.slice(0,8), label,
      entry_price: entryPriceUsd, peak_price: entryPriceUsd,
      amount_sol: size, tokens_received: rawOut,
      token_decimals: decimals, opened_at: new Date().toISOString(),
    });

    // Log to Supabase async (non-blocking — never holds up next trade)
    sbFire('POST', '/rest/v1/shreem_brzee_live_trades', {
      id: tradeId, session_id: 'default',
      sig: txSig, mint, symbol: symbol || mint.slice(0,8), label,
      wallet: WHALE_WALLETS[label] || label,
      action: 'BUY', amount_sol: size, gross_sol: size, net_sol: size,
      tokens_received: rawOut, token_decimals: decimals,
      entry_price: entryPriceUsd > 0 ? entryPriceUsd : null,
      sol_usd_at_entry: solUsd,
      status: 'open', opened_at: new Date().toISOString(),
    });

  } catch(e) {
    console.error(`[buy] ❌ ${symbol} failed: ${e.message}`);
  } finally {
    buyBusy = false;
  }
}

// ── SELL EXECUTION ────────────────────────────────────────────────────────────
async function executeSell(pos, reason) {
  if (closingSet.has(pos.id)) return;
  if (!keypair) return;
  closingSet.add(pos.id);
  positionCache.delete(pos.id); // remove immediately so stop loss doesn't re-trigger

  const t0 = Date.now();
  const sym = pos.symbol || pos.mint.slice(0,8);
  console.log(`[sell] 🔴 ${sym} reason=${reason}`);

  try {
    // Get actual token balance on-chain
    let rawAmount = await getTokenBalance(pos.mint);
    if (!rawAmount || rawAmount < 1) {
      // Try stored amount as fallback
      rawAmount = Number(pos.tokens_received || 0);
    }
    if (!rawAmount || rawAmount < 1) {
      console.log(`[sell] no tokens found for ${sym} — marking closed_in_wallet`);
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
        status: 'closed', sell_reason: 'closed_in_wallet', closed_at: new Date().toISOString(),
        pnl_sol: 0, pnl_pct: 0, updated_at: new Date().toISOString(),
      });
      return;
    }

    const quote  = await jupQuote(pos.mint, SOL_MINT, rawAmount, SELL_SLIPPAGE);
    const swapTx = await jupSwapTx(quote, BOT_WALLET);
    const txSig  = await signAndSend(swapTx);

    const latency    = Date.now() - t0;
    const solReceived = Number(quote.outAmount || 0) / LAMPORTS;
    const pnlSol     = solReceived - (pos.amount_sol || 0);
    const pnlPct     = pos.amount_sol > 0 ? (pnlSol / pos.amount_sol) * 100 : 0;

    console.log(`[sell] ✅ ${sym} | ${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}% | ${pnlSol>=0?'+':''}${pnlSol.toFixed(4)} SOL | ${latency}ms`);

    // Log to Supabase async
    sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${pos.id}`, {
      status: 'closed', sell_reason: reason, sell_sig: txSig,
      closed_at: new Date().toISOString(),
      exit_price: priceCache.get(pos.mint)?.price || null,
      pnl_sol: pnlSol, pnl_pct: pnlPct,
      updated_at: new Date().toISOString(),
    });

    // Update session balance in Supabase async
    const newBal = await getWalletBalanceSol();
    if (newBal > 0) {
      sbFire('PATCH', '/rest/v1/shreem_brzee_session?id=eq.default', {
        portfolio: newBal, updated_at: new Date().toISOString(),
      });
    }

  } catch(e) {
    console.error(`[sell] ❌ ${sym} failed: ${e.message}`);
    positionCache.set(pos.id, pos); // restore to cache so it retries
  } finally {
    closingSet.delete(pos.id);
  }
}

// ── STOP LOSS + TRAILING STOP (every 2s, fully in-memory) ────────────────────
let stopBusy = false;
async function pollStopLoss() {
  if (stopBusy || positionCache.size === 0) return;
  stopBusy = true;
  try {
    const mints = [...new Set([...positionCache.values()].map(p => p.mint).filter(Boolean))];
    await Promise.all(mints.map(fetchPrice)); // parallel price fetch

    for (const [id, pos] of positionCache) {
      if (closingSet.has(id)) continue;
      const entry = Number(pos.entry_price);
      if (!entry || entry <= 0 || !pos.mint) continue;

      const cached = priceCache.get(pos.mint);
      if (!cached || Date.now() - cached.updatedAt > 15000) continue;
      const price = cached.price;
      if (!price || price <= 0) continue;

      const pnlPct  = (price - entry) / entry * 100;
      const peak    = Math.max(pos.peak_price || entry, price);
      pos.peak_price = peak;
      const peakPct = (peak - entry) / entry * 100;

      // Update DB non-blocking
      sbFire('PATCH', `/rest/v1/shreem_brzee_live_trades?id=eq.${id}&status=eq.open`, {
        exit_price: price, peak_price: peak,
        pnl_pct: pnlPct, pnl_sol: (pos.amount_sol || 0) * (pnlPct / 100),
        updated_at: new Date().toISOString(),
      });

      // Hard stop loss
      if (pnlPct <= STOP_LOSS_PCT) {
        console.log(`[stop] 🛑 ${pos.symbol} hard stop ${pnlPct.toFixed(1)}%`);
        await executeSell(pos, 'stop_loss');
        continue;
      }

      // Trailing stop
      if (peakPct >= TRAIL_PEAK_PCT) {
        const floor = peakPct * TRAIL_FLOOR_PCT;
        if (pnlPct <= floor) {
          console.log(`[trail] 🔒 ${pos.symbol} peak=${peakPct.toFixed(1)}% floor=${floor.toFixed(1)}% now=${pnlPct.toFixed(1)}%`);
          await executeSell(pos, 'trailing_stop');
          continue;
        }
      }

      // 48h timeout
      const ageH = (Date.now() - new Date(pos.opened_at).getTime()) / 3_600_000;
      if (ageH >= 48) {
        console.log(`[stop] ⏰ ${pos.symbol} 48h timeout`);
        await executeSell(pos, 'timeout_48h');
      }
    }
  } catch(e) { console.error('[stopLoss] error:', e.message); }
  finally { stopBusy = false; }
}

// ── TRANSACTION PARSER ────────────────────────────────────────────────────────
function parseWhaleSwap(tx, walletAddr) {
  const label = WHALE_WALLETS[walletAddr];
  const meta  = tx.meta || tx.transaction?.meta;
  const msg   = tx.transaction?.message || tx.message;
  if (!meta || !msg) return null;

  const keys = (msg.accountKeys || []).map(k => typeof k === 'string' ? k : k?.pubkey || '');
  const walletIdx = keys.indexOf(walletAddr);
  if (walletIdx < 0) return null;

  const preSol  = (meta.preBalances?.[walletIdx]  || 0) / LAMPORTS;
  const postSol = (meta.postBalances?.[walletIdx] || 0) / LAMPORTS;
  const solDiff = postSol - preSol; // negative = BUY, positive = SELL

  const preTokens  = (meta.preTokenBalances  || []).filter(b => keys[b.accountIndex] === walletAddr || b.owner === walletAddr);
  const postTokens = (meta.postTokenBalances || []).filter(b => keys[b.accountIndex] === walletAddr || b.owner === walletAddr);

  let mint = null, tokenDiff = 0, symbol = null;
  const allMints = new Set([...preTokens.map(b=>b.mint), ...postTokens.map(b=>b.mint)].filter(m => !STABLES.has(m)));

  for (const m of allMints) {
    const pre  = preTokens.find(b=>b.mint===m);
    const post = postTokens.find(b=>b.mint===m);
    const preAmt  = Number(pre?.uiTokenAmount?.uiAmount  || pre?.uiTokenAmount?.amount  || 0);
    const postAmt = Number(post?.uiTokenAmount?.uiAmount || post?.uiTokenAmount?.amount || 0);
    const diff = postAmt - preAmt;
    if (Math.abs(diff) > Math.abs(tokenDiff)) { mint = m; tokenDiff = diff; symbol = post?.uiTokenAmount?.symbol || pre?.uiTokenAmount?.symbol || null; }
  }

  if (!mint) return null;
  if (Math.abs(solDiff) < 0.001 && Math.abs(tokenDiff) < 0.0001) return null; // not a real swap

  const action = tokenDiff > 0 ? 'BUY' : 'SELL';
  const whaleSolSize = Math.abs(solDiff);

  return { action, mint, symbol, label, walletAddr, whaleSolSize, solDiff, tokenDiff };
}

// ── HELIUS WEBSOCKET LASER STREAM ─────────────────────────────────────────────
let ws = null;
let wsReconnectTimer = null;
let wsPingTimer = null;
const subIds = {};

function connectLaserStream() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  console.log('[ws] 🔌 Connecting to Helius LaserStream…');
  ws = new WebSocket(HELIUS_WSS);

  ws.on('open', async () => {
    console.log('[ws] ✅ Connected to Helius LaserStream');

    // Subscribe to each whale wallet
    for (const [addr, name] of Object.entries(WHALE_WALLETS)) {
      const id = Date.now() + Math.random();
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id,
        method: 'transactionSubscribe',
        params: [
          { accountInclude: [addr] },
          {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            showRewards: false,
            maxSupportedTransactionVersion: 0,
          },
        ],
      }));
      subIds[addr] = id;
      console.log(`[ws] 📡 Subscribed ${name} (${addr.slice(0,8)}…)`);
    }

    // Ping every 30s to keep connection alive
    if (wsPingTimer) clearInterval(wsPingTimer);
    wsPingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  });

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Ignore subscription confirmations
      if (msg.id !== undefined && msg.result !== undefined) {
        const addr = Object.keys(subIds).find(a => subIds[a] === msg.id);
        if (addr) console.log(`[ws] ✅ ${WHALE_WALLETS[addr]} sub ID: ${msg.result}`);
        return;
      }

      if (!msg.params?.result) return;
      const { transaction, signature } = msg.params.result;
      if (!transaction) return;

      // Identify which whale wallet triggered this
      const tx       = transaction;
      const accounts = (tx.transaction?.message?.accountKeys || tx.message?.accountKeys || [])
                        .map(k => typeof k === 'string' ? k : k?.pubkey || '');

      const whaleAddr = accounts.find(a => WHALE_ADDRS.has(a));
      if (!whaleAddr) return;

      const swap = parseWhaleSwap(tx, whaleAddr);
      if (!swap) return;

      console.log(`[ws] 🐋 ${swap.label} ${swap.action} ${swap.symbol || swap.mint.slice(0,8)} | ${swap.whaleSolSize.toFixed(3)} SOL`);

      if (swap.action === 'BUY') {
        // Execute immediately — no Supabase round-trip
        executeBuy(swap.mint, swap.symbol, swap.label, swap.whaleSolSize);
      } else if (swap.action === 'SELL') {
        // Find our open position for this mint and close it
        for (const [id, pos] of positionCache) {
          if (pos.mint === swap.mint && !closingSet.has(id)) {
            console.log(`[ws] 🔴 ${swap.label} SELL mirroring ${swap.symbol || swap.mint.slice(0,8)}`);
            executeSell(pos, 'whale_sell_mirror');
            break;
          }
        }
      }
    } catch(e) { console.error('[ws] parse error:', e.message); }
  });

  ws.on('error', (e) => { console.error('[ws] error:', e.message); });

  ws.on('close', (code, reason) => {
    console.log(`[ws] ❌ Disconnected (${code}) — reconnecting in 5s…`);
    if (wsPingTimer) clearInterval(wsPingTimer);
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    wsReconnectTimer = setTimeout(connectLaserStream, 5000);
  });

  ws.on('pong', () => {}); // keep-alive confirmed
}

// ── SESSION SYNC — load state from Supabase on startup ───────────────────────
async function syncSession() {
  try {
    const rows = await sbGet('shreem_brzee_session', 'id=eq.default&select=mode,started_at,stopped_at,portfolio');
    const sess = rows[0];
    if (sess) {
      isLive    = sess.mode === 'live';
      isRunning = !!(sess.started_at && !sess.stopped_at);
      console.log(`[session] mode=${sess.mode} running=${isRunning} portfolio=${sess.portfolio} SOL`);
    }
  } catch(e) { console.error('[session] sync failed:', e.message); }
}

async function syncPositions() {
  try {
    const positions = await sbGet('shreem_brzee_live_trades',
      'status=in.(open,pending,unconfirmed)&select=id,mint,symbol,label,entry_price,peak_price,amount_sol,tokens_received,token_decimals,opened_at');
    const dbIds = new Set(positions.map(p => p.id));
    for (const [id] of positionCache) { if (!dbIds.has(id)) positionCache.delete(id); }
    for (const pos of positions) {
      if (!positionCache.has(pos.id)) {
        positionCache.set(pos.id, {
          ...pos,
          entry_price: Number(pos.entry_price) || 0,
          peak_price:  Number(pos.peak_price)  || Number(pos.entry_price) || 0,
          amount_sol:  Number(pos.amount_sol)  || 0,
        });
      }
    }
    if (positions.length > 0) console.log(`[cache] ${positions.length} positions loaded`);
  } catch(e) { console.error('[cache] sync failed:', e.message); }
}

async function refreshSolPrice() {
  try {
    const r = await httpJSON('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    if (r?.price) solUsd = parseFloat(r.price);
  } catch {}
}

// ── HEALTH HTTP SERVER ────────────────────────────────────────────────────────
http.createServer(async (req, res) => {
  const walletSol = await getWalletBalanceSol().catch(() => 0);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:     'running',
    version:    'v16-LaserStream',
    uptime:     Math.floor(process.uptime()),
    ws_state:   ws ? ['CONNECTING','OPEN','CLOSING','CLOSED'][ws.readyState] : 'null',
    positions:  positionCache.size,
    is_live:    isLive,
    is_running: isRunning,
    balance_sol: walletSol,
    sol_usd:    solUsd,
    time:       new Date().toISOString(),
  }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

// ── BOOT ──────────────────────────────────────────────────────────────────────
console.log('[shreem] v16 LaserStream booting…');
(async () => {
  await syncSession();
  await syncPositions();
  await refreshSolPrice();
  connectLaserStream();
})();

setInterval(syncSession,   30000);   // refresh live/running state every 30s
setInterval(syncPositions, 20000);   // sync positions from DB every 20s
setInterval(pollStopLoss,  STOP_POLL_MS); // stop loss every 2s
setInterval(refreshSolPrice, 30000); // SOL price every 30s

console.log('[shreem] v16 — Helius WebSocket active, execution on Hetzner, Supabase logging only');
