// shreem-live-worker.js — Shreem Brzee Live Trade Executor on Hetzner
// v9 — SELL MIRROR HARDENING: live_processed set AFTER success, retry logic, on-chain balance fallback
const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HELIUS_KEY   = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC   = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUP_QUOTE    = 'https://lite-api.jup.ag/swap/v1/quote';
const JUP_SWAP     = 'https://lite-api.jup.ag/swap/v1/swap';
const SOL_MINT     = 'So11111111111111111111111111111111111111112';
const LAMPORTS     = 1_000_000_000;

const POLL_MS      = 20000;   // BUY signals every 20s
const SELL_POLL_MS = 15000;   // v9: tightened to 15s for faster sell response
const PORT         = 3001;
const MAX_HOLD_MS  = 48 * 60 * 60 * 1000; // 48h max hold

const PUBLIC_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com',
];
const SEND_RPCS = [...PUBLIC_RPCS, HELIUS_RPC];

let _cachedBalance = null;
let _balanceCachedAt = 0;
const BALANCE_CACHE_MS = 120_000;

async function getWalletBalance(wallet) {
  const now = Date.now();
  if (_cachedBalance !== null && (now - _balanceCachedAt) < BALANCE_CACHE_MS) return _cachedBalance;
  const res = await rpc('getBalance', [wallet]);
  _cachedBalance = res.value / LAMPORTS;
  _balanceCachedAt = now;
  return _cachedBalance;
}
function invalidateBalanceCache() { _cachedBalance = null; _balanceCachedAt = 0; }

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function bs58Decode(str) {
  let n = BigInt(0);
  for (const c of str) { const i = ALPHABET.indexOf(c); if (i < 0) throw new Error('bad b58'); n = n * BigInt(58) + BigInt(i); }
  const hex = n.toString(16).padStart(128, '0');
  return Buffer.from(hex, 'hex');
}

function loadKeypair() {
  const raw = process.env.SHREEM_BOT_KEYPAIR || process.env.BOT_WALLET_PRIVATE_KEY;
  if (!raw) throw new Error('Neither SHREEM_BOT_KEYPAIR nor BOT_WALLET_PRIVATE_KEY is set');
  const t = raw.trim();
  let sk;
  if (t.startsWith('[')) sk = Buffer.from(JSON.parse(t));
  else if (t.includes(',')) sk = Buffer.from(t.split(',').map(Number));
  else sk = bs58Decode(t);
  if (sk.length !== 64) throw new Error(`Bad key length: ${sk.length}`);
  return sk;
}

function httpReq(url, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const sbGet   = (t, f) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'GET', null, SB_HEADERS).then(r => r.data);
const sbPost  = (t, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}`, 'POST', b, { ...SB_HEADERS, Prefer: 'return=minimal' });
const sbPatch = (t, f, b) => httpReq(`${SUPABASE_URL}/rest/v1/${t}?${f}`, 'PATCH', b, SB_HEADERS);

async function rpc(method, params) {
  const endpoints = method === 'sendTransaction' ? SEND_RPCS : PUBLIC_RPCS;
  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const r = await httpReq(endpoint, 'POST', { jsonrpc: '2.0', id: 1, method, params });
      if (r.data && r.data.error) {
        const code = r.data.error.code;
        if (code === -32429 || code === 429) { lastErr = new Error(`rate-limited on ${endpoint}`); continue; }
        throw new Error(`RPC ${method}: ${r.data.error.message}`);
      }
      return r.data.result;
    } catch(e) { lastErr = e; }
  }
  throw lastErr ?? new Error(`RPC ${method} failed on all endpoints`);
}

async function jupiterQuote(inputMint, outputMint, amount, slippageBps = 300) {
  const url = `${JUP_QUOTE}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
  const r = await httpReq(url);
  if (r.status !== 200) throw new Error(`Jupiter quote ${r.status}: ${JSON.stringify(r.data).slice(0,120)}`);
  return r.data;
}

async function jupiterSwapTx(quote, walletPubkey) {
  const r = await httpReq(JUP_SWAP, 'POST', {
    quoteResponse: quote, userPublicKey: walletPubkey,
    wrapAndUnwrapSol: true, computeUnitPriceMicroLamports: 50000, dynamicComputeUnitLimit: true,
  });
  if (r.status !== 200) throw new Error(`Jupiter swap ${r.status}: ${JSON.stringify(r.data).slice(0,120)}`);
  return r.data.swapTransaction;
}

async function signAndSend(txBase64, secretKey) {
  const { VersionedTransaction, Keypair } = require('@solana/web3.js');
  const kp = Keypair.fromSecretKey(secretKey);
  const vTx = VersionedTransaction.deserialize(Buffer.from(txBase64, 'base64'));
  vTx.sign([kp]);
  const encoded = Buffer.from(vTx.serialize()).toString('base64');
  return rpc('sendTransaction', [encoded, { encoding: 'base64', preflightCommitment: 'confirmed' }]);
}

async function waitConfirm(txSig, ms = 45000) {
  const dl = Date.now() + ms;
  await new Promise(r => setTimeout(r, 8000));
  while (Date.now() < dl) {
    await new Promise(r => setTimeout(r, 8000));
    try {
      const res = await rpc('getSignatureStatuses', [[txSig], { searchTransactionHistory: true }]);
      const s = res?.value?.[0];
      if (!s) continue;
      if (s.err) return false;
      if (s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized') return true;
    } catch {}
  }
  return false;
}

// v9: resolveRawAmount — always tries on-chain first, falls back to stored,
// THEN falls back to fresh on-chain re-read before giving up
async function resolveRawAmount(wallet, mint, tokensReceivedRaw) {
  let rawAmount = 0;
  let decimals = 6;

  // Attempt 1: on-chain balance
  try {
    const taRes = await rpc('getTokenAccountsByOwner', [wallet, { mint }, { encoding: 'jsonParsed' }]);
    const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
    if (acct) { decimals = Number(acct.decimals); rawAmount = Number(acct.amount); }
  } catch (e) { console.warn(`[resolveRawAmount] on-chain read failed: ${e.message}`); }

  // Attempt 2: stored DB value (tokens_received = raw units from Jupiter outAmount)
  if (!rawAmount && tokensReceivedRaw) {
    rawAmount = Math.floor(Number(tokensReceivedRaw));
    console.log(`[resolveRawAmount] Using stored tokens_received: ${rawAmount}`);
  }

  // Attempt 3: retry on-chain after 3s (handles propagation delay)
  if (!rawAmount) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const taRes2 = await rpc('getTokenAccountsByOwner', [wallet, { mint }, { encoding: 'jsonParsed' }]);
      const acct2 = taRes2?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
      if (acct2) { decimals = Number(acct2.decimals); rawAmount = Number(acct2.amount); }
      if (rawAmount) console.log(`[resolveRawAmount] Retry on-chain succeeded: ${rawAmount}`);
    } catch {}
  }

  return { rawAmount, decimals };
}

// Core sell — v9: no longer sets live_processed=true before calling this
// The caller (pollSell) sets it only after success
async function executeSell(pos, reason) {
  const sk = loadKeypair();
  const { Keypair } = require('@solana/web3.js');
  const kp = Keypair.fromSecretKey(sk);
  const wallet = kp.publicKey.toBase58();

  const { rawAmount } = await resolveRawAmount(wallet, pos.mint, pos.tokens_received);

  if (!rawAmount || rawAmount < 1) {
    await sbPatch('shreem_brzee_live_trades', `id=eq.${pos.id}`,
      { status: 'closed', sell_reason: `${reason}_no_balance`, closed_at: new Date().toISOString() });
    console.log(`[SELL:${reason}] ${pos.symbol} — no token balance after 3 attempts, marked closed`);
    return { ok: true, noBalance: true };
  }

  const sellQuote = await jupiterQuote(pos.mint, SOL_MINT, rawAmount, 2000);
  const swapTx = await jupiterSwapTx(sellQuote, wallet);
  const txSig = await signAndSend(swapTx, sk);
  const confirmed = await waitConfirm(txSig);
  invalidateBalanceCache();

  const solOut = Number(sellQuote.outAmount) / LAMPORTS;
  const sizeIn = Number(pos.amount_sol) || 0;
  const pnlSol = solOut - sizeIn;
  const pnlPct = sizeIn > 0 ? (pnlSol / sizeIn) * 100 : 0;

  await sbPatch('shreem_brzee_live_trades', `id=eq.${pos.id}`, {
    status: confirmed ? 'closed' : 'failed',
    sell_reason: reason,
    pnl_sol: pnlSol, pnl_pct: pnlPct,
    closed_at: new Date().toISOString(),
    tx_sig_close: txSig,
  });

  const sessNow = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
  if (sessNow[0]) {
    await sbPatch('shreem_brzee_session', 'id=eq.default', {
      portfolio: Number(sessNow[0].portfolio || 0) + solOut,
      wins:   Number(sessNow[0].wins||0)   + (pnlSol > 0 ? 1 : 0),
      losses: Number(sessNow[0].losses||0) + (pnlSol <= 0 ? 1 : 0),
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`[SELL:${reason}] ✅ ${pos.symbol} | pnl=${pnlPct.toFixed(1)}% | sol_out=${solOut.toFixed(4)} | confirmed:${confirmed} | tx:${txSig?.slice(0,16)}`);
  return { ok: true, confirmed, solOut, txSig };
}

// ── BUY POLL ─────────────────────────────────────────────────────────────────
let buyBusy = false;
async function pollBuy() {
  if (buyBusy) return;
  buyBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const cutoff = new Date(Date.now() - 30000).toISOString();
    const signals = await sbGet('shreem_brzee_signals',
      `action=eq.BUY&live_processed=eq.false&created_at=lt.${cutoff}&order=created_at.asc&limit=5`);

    for (const sig of signals) {
      // v9: allow amount_sol=0 if mint is valid (Cented/clukz WSOL trades)
      // Only skip if BOTH too small AND no valid mint
      if (sig.mint === USDC) continue;
      if (Number(sig.amount_sol || 0) < 0.05 && !sig.mint) continue;

      // Mark processed BEFORE execution (prevents double-buy from parallel polls)
      await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });

      try {
        const sk = loadKeypair();
        const { Keypair } = require('@solana/web3.js');
        const kp = Keypair.fromSecretKey(sk);
        const wallet = kp.publicKey.toBase58();

        const bal = await getWalletBalance(wallet);
        if (bal < 0.05) {
          console.log(`[BUY] FLOOR PROTECTION — balance too low: ${bal.toFixed(4)} SOL. Halting buys.`);
          break;
        }

        const openMint = await sbGet('shreem_brzee_live_trades', `status=eq.open&mint=eq.${sig.mint}&limit=1`);
        if (openMint.length) { console.log(`[BUY] Already open: ${sig.symbol}`); continue; }

        const openTrades = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=amount_sol');
        const openExp = openTrades.reduce((s, t) => s + (Number(t.amount_sol) || 0), 0);
        const maxExp = bal * 0.5;
        if (openExp >= maxExp) { console.log('[BUY] 50% exposure cap reached'); continue; }

        const wins = Number(sess.wins || 0), losses = Number(sess.losses || 0);
        const wr = (wins + losses) >= 5 ? wins / (wins + losses) : 0.5;
        const pct = Math.min(0.10, Math.max(0.05, wr * 0.12));
        const size = Math.min(bal * pct, maxExp - openExp);
        if (size < 0.005) { console.log(`[BUY] Size too small: ${size}`); continue; }

        console.log(`[BUY] ${sig.label} → ${sig.symbol} | ${size.toFixed(4)} SOL | bal=${bal.toFixed(4)} | amount_sol=${sig.amount_sol}`);
        const lamports = Math.floor(size * LAMPORTS);
        const quote = await jupiterQuote(SOL_MINT, sig.mint, lamports);
        const swapTx = await jupiterSwapTx(quote, wallet);
        const txSig = await signAndSend(swapTx, sk);
        const confirmed = await waitConfirm(txSig);
        invalidateBalanceCache();

        const tokensReceived = Number(quote.outAmount);
        const inAmountSol = Number(quote.inAmount) / LAMPORTS;
        const entryPrice = (inAmountSol > 0 && tokensReceived > 0)
          ? inAmountSol / (tokensReceived / 1e6) : null;

        await sbPost('shreem_brzee_live_trades', {
          session_id: 'default', sig: sig.sig + '_live', tx_sig: txSig,
          mint: sig.mint, symbol: sig.symbol, label: sig.label, wallet: sig.wallet,
          action: 'BUY', amount_sol: size, entry_price: entryPrice,
          tokens_received: tokensReceived,
          status: confirmed ? 'open' : 'unconfirmed',
          opened_at: new Date().toISOString(), slippage_pct: 3.0,
        });

        await sbPatch('shreem_brzee_session', 'id=eq.default', {
          portfolio: Number(sess.portfolio || 0) - size, updated_at: new Date().toISOString(),
        });

        console.log(`[BUY] ✅ ${sig.symbol} | ${size.toFixed(4)} SOL | entry_price=${entryPrice?.toFixed(8) ?? 'null'} | tx:${txSig?.slice(0,16)} | confirmed:${confirmed}`);
      } catch (e) {
        console.error(`[BUY] ERROR ${sig.sig}:`, e.message);
        // v9: un-mark so it gets retried on next poll cycle
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: false });
      }
    }
  } catch (e) { console.error('[pollBuy] error:', e.message); }
  finally { buyBusy = false; }
}

// ── SELL POLL — v9 HARDENED ───────────────────────────────────────────────────
// KEY FIX: live_processed=true ONLY after executeSell succeeds
// Retry logic: if sell fails, signal stays unprocessed for next cycle
let sellBusy = false;
async function pollSell() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    // ── 1. Whale SELL mirror — HARDENED v9 ─────────────────────────────────
    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&live_processed=eq.false&order=created_at.asc&limit=10');

    for (const sig of sellSignals) {
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `status=eq.open&mint=eq.${sig.mint}&select=*`);

      if (!openTrades.length) {
        // No open position — safe to mark processed immediately
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });
        console.log(`[SELL:whale] No open position for ${sig.symbol} — skip`);
        continue;
      }

      console.log(`[SELL:whale] v9 ${sig.label} sold ${sig.symbol} — closing ${openTrades.length} position(s)`);
      let allSuccess = true;

      for (const pos of openTrades) {
        try {
          const result = await executeSell(pos, 'whale_sell');
          if (!result?.ok) { allSuccess = false; console.error(`[SELL:whale] executeSell returned !ok for ${pos.id}`); }
        } catch (e) {
          allSuccess = false;
          console.error(`[SELL:whale] ERROR ${pos.id}:`, e.message);
        }
      }

      // v9 KEY FIX: only mark processed if ALL positions closed successfully
      // If any failed, leave live_processed=false → retry on next cycle
      if (allSuccess) {
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });
        console.log(`[SELL:whale] ✅ ${sig.symbol} — all positions closed, signal marked processed`);
      } else {
        console.warn(`[SELL:whale] ⚠️ ${sig.symbol} — sell had errors, signal stays unprocessed for retry`);
      }
    }

    // ── 2. Stop-loss + 48h timeout ───────────────────────────────────────────
    const openAll = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=*');
    const now = Date.now();

    for (const pos of openAll) {
      // 48h timeout
      if (pos.opened_at) {
        const ageMs = now - new Date(pos.opened_at).getTime();
        if (ageMs > MAX_HOLD_MS) {
          console.log(`[SELL:48h] ${pos.symbol} held ${(ageMs/3600000).toFixed(1)}h — force closing`);
          try { await executeSell(pos, 'timeout_48h'); }
          catch (e) { console.error(`[SELL:48h] ERROR ${pos.id}:`, e.message); }
          continue;
        }
      }

      if (!pos.entry_price) {
        console.log(`[STOPLOSS] ${pos.symbol} — entry_price null, skipping`);
        continue;
      }

      // Jupiter price check
      let currentPrice = 0;
      try {
        const jupR = await httpReq(`https://lite-api.jup.ag/price/v3?ids=${pos.mint}`);
        const jupData = jupR.data;
        if (jupData && typeof jupData === 'object') {
          const entry = Object.values(jupData)[0];
          currentPrice = parseFloat(entry?.usdPrice || entry?.price || 0);
        }
      } catch {}

      if (!currentPrice) {
        try {
          const ds = await httpReq(`https://api.dexscreener.com/latest/dex/tokens/${pos.mint}`);
          if (ds.data?.pairs?.length) {
            const best = ds.data.pairs.sort((a, b) =>
              parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0))[0];
            currentPrice = parseFloat(best.priceUsd || 0);
          }
        } catch {}
      }

      if (!currentPrice) continue;

      const entryUsd = Number(pos.entry_price);
      if (!entryUsd || entryUsd <= 0) continue;

      const changePct = ((currentPrice - entryUsd) / entryUsd) * 100;

      if (changePct <= -25) {
        console.log(`[STOPLOSS] ${pos.symbol} down ${changePct.toFixed(1)}% — closing`);
        try { await executeSell(pos, 'stoploss_25pct'); }
        catch(e) { console.error(`[STOPLOSS] ERROR ${pos.id}:`, e.message); }
      } else {
        console.log(`[STOPLOSS] ${pos.symbol} at ${changePct.toFixed(1)}% — holding`);
      }
    }

  } catch (e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── Health check ─────────────────────────────────────────────────────────────
let _healthBalance = 0;
let _healthBalanceAt = 0;

http.createServer(async (req, res) => {
  const now = Date.now();
  if (now - _healthBalanceAt > 180_000) {
    try {
      const sk = loadKeypair();
      const { Keypair } = require('@solana/web3.js');
      const kp = Keypair.fromSecretKey(sk);
      const balRes = await rpc('getBalance', [kp.publicKey.toBase58()]);
      _healthBalance = balRes.value / LAMPORTS;
      _healthBalanceAt = now;
    } catch {}
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    bot: 'Shreem Brzee Live Worker v9',
    version: 'v9-sell-hardened',
    helius_key_prefix: HELIUS_KEY.slice(0,8),
    balance_sol: _healthBalance,
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString()
  }));
}).listen(PORT, () => console.log(`[shreem] Health check on :${PORT}`));

console.log('[shreem] v9 SELL HARDENED — live_processed=true AFTER success only, retry on failure');
console.log('[shreem] resolveRawAmount: on-chain → stored → retry on-chain (3s delay)');
console.log('[shreem] WSOL fix: amount_sol=0 with valid mint passes BUY filter (Cented/clukz)');
console.log('[shreem] Sell poll: 15s interval (tightened from 30s)');
console.log('[shreem] Helius key prefix:', HELIUS_KEY.slice(0,8));
setInterval(pollBuy,  POLL_MS);
setInterval(pollSell, SELL_POLL_MS);
pollBuy();
pollSell();
