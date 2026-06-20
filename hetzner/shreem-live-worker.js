// shreem-live-worker.js — Shreem Brzee Live Trade Executor on Hetzner
// v6 — NEW Helius key + Jupiter lite-api + SELL signal auto-close
const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// NEW Helius key 7de253c3 — replaces dead key 775d3d1f
const HELIUS_KEY   = process.env.HELIUS_API_KEY || '7de253c3-49e2-42be-9672-23a761260f86';
const HELIUS_RPC   = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
// Jupiter v6 lite endpoint (quote-api.jup.ag/v6 is deprecated/dead)
const JUP_QUOTE    = 'https://lite-api.jup.ag/swap/v1/quote';
const JUP_SWAP     = 'https://lite-api.jup.ag/swap/v1/swap';
const SOL_MINT     = 'So11111111111111111111111111111111111111112';
const LAMPORTS     = 1_000_000_000;
const POLL_MS      = 5000;   // poll BUY signals every 5s
const SELL_POLL_MS = 8000;   // poll SELL signals every 8s
const PORT         = 3001;

// Public fallback RPCs for getBalance (never burns Helius credits)
const PUBLIC_RPCS = [
  HELIUS_RPC,
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function bs58Decode(str) {
  let n = BigInt(0);
  for (const c of str) { const i = ALPHABET.indexOf(c); if (i < 0) throw new Error('bad b58'); n = n * BigInt(58) + BigInt(i); }
  const hex = n.toString(16).padStart(128, '0');
  return Buffer.from(hex, 'hex');
}

function loadKeypair() {
  const raw = process.env.SHREEM_BOT_KEYPAIR;
  if (!raw) throw new Error('SHREEM_BOT_KEYPAIR not set');
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

// RPC with fallback chain — never burns credits on read operations
async function rpc(method, params) {
  let lastErr;
  for (const endpoint of PUBLIC_RPCS) {
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

// Jupiter quote — SOL -> token (BUY) or token -> SOL (SELL)
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

async function waitConfirm(txSig, ms = 30000) {
  const dl = Date.now() + ms;
  while (Date.now() < dl) {
    await new Promise(r => setTimeout(r, 2000));
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
    const signals = await sbGet('shreem_brzee_signals', 'action=eq.BUY&live_processed=eq.false&order=created_at.asc&limit=5');

    for (const sig of signals) {
      if (sig.mint === USDC || sig.amount_sol < 0.01) continue;

      // Mark processed immediately to avoid duplicate
      await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });

      try {
        const sk = loadKeypair();
        const { Keypair } = require('@solana/web3.js');
        const kp = Keypair.fromSecretKey(sk);
        const wallet = kp.publicKey.toBase58();

        const balRes = await rpc('getBalance', [wallet]);
        const bal = balRes.value / LAMPORTS;
        if (bal < 0.015) { console.log(`[BUY] Low balance: ${bal} SOL`); continue; }

        // No duplicate open position in same mint
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

        console.log(`[BUY] ${sig.label} → ${sig.symbol} | ${size.toFixed(4)} SOL | bal=${bal.toFixed(4)}`);
        const lamports = Math.floor(size * LAMPORTS);
        const quote = await jupiterQuote(SOL_MINT, sig.mint, lamports);
        const swapTx = await jupiterSwapTx(quote, wallet);
        const txSig = await signAndSend(swapTx, sk);
        const confirmed = await waitConfirm(txSig);

        const tokensReceived = Number(quote.outAmount);
        const entryPrice = (Number(quote.inAmount) > 0 && tokensReceived > 0)
          ? (Number(quote.inAmount) / LAMPORTS) / (tokensReceived / 1e6) : null;

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

        console.log(`[BUY] ✅ ${sig.symbol} | ${size.toFixed(4)} SOL | tx:${txSig?.slice(0,16)} | confirmed:${confirmed}`);
      } catch (e) {
        console.error(`[BUY] ERROR ${sig.sig}:`, e.message);
        // Unmark so it retries next poll
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: false });
      }
    }
  } catch (e) { console.error('[pollBuy] error:', e.message); }
  finally { buyBusy = false; }
}

// ── SELL POLL — auto-close on whale SELL signal ────────────────────────────
let sellBusy = false;
async function pollSell() {
  if (sellBusy) return;
  sellBusy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    // Get unprocessed SELL signals
    const sellSignals = await sbGet('shreem_brzee_signals',
      'action=eq.SELL&live_processed=eq.false&order=created_at.asc&limit=10');

    for (const sig of sellSignals) {
      // Mark processed immediately
      await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });

      // Find matching open trade for this mint
      const openTrades = await sbGet('shreem_brzee_live_trades',
        `status=eq.open&mint=eq.${sig.mint}&select=*`);

      if (!openTrades.length) {
        console.log(`[SELL] No open position for ${sig.symbol} — skip`);
        continue;
      }

      console.log(`[SELL] Whale ${sig.label} sold ${sig.symbol} — auto-closing our position`);

      for (const pos of openTrades) {
        try {
          const sk = loadKeypair();
          const { Keypair } = require('@solana/web3.js');
          const kp = Keypair.fromSecretKey(sk);
          const wallet = kp.publicKey.toBase58();

          // Get on-chain token balance
          let rawAmount = 0;
          let decimals = 6;
          try {
            const taRes = await rpc('getTokenAccountsByOwner',
              [wallet, { mint: pos.mint }, { encoding: 'jsonParsed' }]);
            const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
            if (acct) { decimals = Number(acct.decimals); rawAmount = Number(acct.amount); }
          } catch {}

          if (!rawAmount) {
            rawAmount = Math.floor(Number(pos.tokens_received || 0) * Math.pow(10, decimals));
          }

          if (!rawAmount || rawAmount < 1) {
            await sbPatch('shreem_brzee_live_trades',
              `id=eq.${pos.id}`,
              { status: 'closed', sell_reason: 'whale_sell_no_balance', closed_at: new Date().toISOString() });
            continue;
          }

          const sellQuote = await jupiterQuote(pos.mint, SOL_MINT, rawAmount, 2000);
          const swapTx = await jupiterSwapTx(sellQuote, wallet);
          const txSig = await signAndSend(swapTx, sk);
          const confirmed = await waitConfirm(txSig);

          const solOut = Number(sellQuote.outAmount) / LAMPORTS;
          const sizeIn = Number(pos.amount_sol) || 0;
          const pnlSol = solOut - sizeIn;
          const pnlPct = sizeIn > 0 ? (pnlSol / sizeIn) * 100 : 0;

          await sbPatch('shreem_brzee_live_trades', `id=eq.${pos.id}`, {
            status: confirmed ? 'closed' : 'unconfirmed_close',
            sell_reason: 'whale_sell',
            pnl_sol: pnlSol, pnl_pct: pnlPct,
            closed_at: new Date().toISOString(),
            tx_sig_close: txSig,
          });

          // Update session wins/losses
          const sessNow = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
          if (sessNow[0]) {
            await sbPatch('shreem_brzee_session', 'id=eq.default', {
              portfolio: Number(sessNow[0].portfolio || 0) + solOut,
              wins:   Number(sessNow[0].wins||0)   + (pnlSol > 0 ? 1 : 0),
              losses: Number(sessNow[0].losses||0) + (pnlSol <= 0 ? 1 : 0),
              updated_at: new Date().toISOString(),
            });
          }

          console.log(`[SELL] ✅ ${pos.symbol} | pnl=${pnlPct.toFixed(1)}% | sol_out=${solOut.toFixed(4)} | tx:${txSig.slice(0,16)}`);
        } catch (e) {
          console.error(`[SELL] ERROR closing ${pos.id}:`, e.message);
        }
      }
    }

    // ── Stop-loss: close any position down >30% ──────────────────────────────
    const openAll = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=*');
    for (const pos of openAll) {
      // Fetch current price from DexScreener
      let currentPrice = 0;
      try {
        const ds = await httpReq(`https://api.dexscreener.com/latest/dex/tokens/${pos.mint}`);
        if (ds.data?.pairs?.length) {
          const best = ds.data.pairs.sort((a, b) =>
            parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0))[0];
          currentPrice = parseFloat(best.priceUsd || 0);
        }
      } catch {}

      if (!currentPrice || !pos.entry_price) continue;
      const changePct = ((currentPrice - Number(pos.entry_price)) / Number(pos.entry_price)) * 100;

      if (changePct <= -30) {
        console.log(`[STOPLOSS] ${pos.symbol} down ${changePct.toFixed(1)}% — closing`);
        try {
          const sk = loadKeypair();
          const { Keypair } = require('@solana/web3.js');
          const kp = Keypair.fromSecretKey(sk);
          const wallet = kp.publicKey.toBase58();

          let rawAmount = 0;
          let decimals = 6;
          try {
            const taRes = await rpc('getTokenAccountsByOwner',
              [wallet, { mint: pos.mint }, { encoding: 'jsonParsed' }]);
            const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
            if (acct) { decimals = Number(acct.decimals); rawAmount = Number(acct.amount); }
          } catch {}

          if (!rawAmount) rawAmount = Math.floor(Number(pos.tokens_received || 0) * Math.pow(10, decimals));
          if (!rawAmount || rawAmount < 1) {
            await sbPatch('shreem_brzee_live_trades', `id=eq.${pos.id}`,
              { status: 'closed', sell_reason: 'stoploss_no_balance', closed_at: new Date().toISOString() });
            continue;
          }

          const sellQuote = await jupiterQuote(pos.mint, SOL_MINT, rawAmount, 2000);
          const swapTx = await jupiterSwapTx(sellQuote, wallet);
          const txSig = await signAndSend(swapTx, sk);
          const confirmed = await waitConfirm(txSig);

          const solOut = Number(sellQuote.outAmount) / LAMPORTS;
          const sizeIn = Number(pos.amount_sol) || 0;
          const pnlSol = solOut - sizeIn;
          const pnlPct2 = sizeIn > 0 ? (pnlSol / sizeIn) * 100 : 0;

          await sbPatch('shreem_brzee_live_trades', `id=eq.${pos.id}`, {
            status: confirmed ? 'closed' : 'unconfirmed_close',
            sell_reason: 'stoploss_30pct',
            pnl_sol: pnlSol, pnl_pct: pnlPct2,
            closed_at: new Date().toISOString(),
            tx_sig_close: txSig,
          });

          console.log(`[STOPLOSS] ✅ ${pos.symbol} | ${pnlPct2.toFixed(1)}% | tx:${txSig.slice(0,16)}`);
        } catch(e) {
          console.error(`[STOPLOSS] ERROR ${pos.id}:`, e.message);
        }
      }
    }

  } catch (e) { console.error('[pollSell] error:', e.message); }
  finally { sellBusy = false; }
}

// ── Health check HTTP server ──────────────────────────────────────────────────
http.createServer(async (req, res) => {
  let balance = 0;
  try {
    const sk = loadKeypair();
    const { Keypair } = require('@solana/web3.js');
    const kp = Keypair.fromSecretKey(sk);
    const balRes = await rpc('getBalance', [kp.publicKey.toBase58()]);
    balance = balRes.value / LAMPORTS;
  } catch {}

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    bot: 'Shreem Brzee Live Worker v6',
    helius_key_prefix: HELIUS_KEY.slice(0,8),
    balance_sol: balance,
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString()
  }));
}).listen(PORT, () => console.log(`[shreem] Health check on :${PORT}`));

console.log('[shreem] v6 starting — BUY poll every 5s, SELL poll every 8s');
console.log('[shreem] Helius key prefix:', HELIUS_KEY.slice(0,8));
setInterval(pollBuy,  POLL_MS);
setInterval(pollSell, SELL_POLL_MS);
pollBuy();
pollSell();
