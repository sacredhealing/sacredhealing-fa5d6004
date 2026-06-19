// shreem-live-worker.js — Shreem Brzee Live Trade Executor on Hetzner
const https = require('https');
const http  = require('http');

const SUPABASE_URL     = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HELIUS_KEY       = '775d3d1f-6801-41de-a063-8aee4382d0f4';
const HELIUS_RPC       = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUPITER          = 'https://quote-api.jup.ag/v6';
const SOL_MINT         = 'So11111111111111111111111111111111111111112';
const LAMPORTS         = 1_000_000_000;
const POLL_MS          = 5000;
const PORT             = 3001;

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

async function rpc(method, params) {
  const r = await httpReq(HELIUS_RPC, 'POST', { jsonrpc: '2.0', id: 1, method, params });
  if (r.data.error) throw new Error(`RPC ${method}: ${r.data.error.message}`);
  return r.data.result;
}

async function jupiterQuote(outputMint, amountLamports) {
  const url = `${JUPITER}/quote?inputMint=${SOL_MINT}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=300`;
  const r = await httpReq(url);
  if (r.status !== 200) throw new Error(`Jupiter quote ${r.status}: ${JSON.stringify(r.data).slice(0,100)}`);
  return r.data;
}

async function jupiterSwapTx(quote, walletPubkey) {
  const r = await httpReq(`${JUPITER}/swap`, 'POST', {
    quoteResponse: quote, userPublicKey: walletPubkey,
    wrapAndUnwrapSol: true, computeUnitPriceMicroLamports: 50000, dynamicComputeUnitLimit: true,
  });
  if (r.status !== 200) throw new Error(`Jupiter swap ${r.status}: ${JSON.stringify(r.data).slice(0,100)}`);
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

let busy = false;
async function poll() {
  if (busy) return;
  busy = true;
  try {
    const sessions = await sbGet('shreem_brzee_session', 'id=eq.default&select=*');
    const sess = sessions[0];
    if (!sess || sess.mode !== 'live' || !sess.started_at || sess.stopped_at) return;

    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const signals = await sbGet('shreem_brzee_signals', 'action=eq.BUY&live_processed=eq.false&order=created_at.asc&limit=5');

    for (const sig of signals) {
      if (sig.mint === USDC || sig.amount_sol < 0.01) continue;
      console.log(`[shreem] BUY signal: ${sig.label} | ${sig.amount_sol} SOL`);
      try {
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: true });

        const sk = loadKeypair();
        const { Keypair } = require('@solana/web3.js');
        const kp = Keypair.fromSecretKey(sk);
        const wallet = kp.publicKey.toBase58();

        const balRes = await rpc('getBalance', [wallet]);
        const bal = balRes.value / LAMPORTS;
        if (bal < 0.015) { console.log(`[shreem] Low balance: ${bal}`); continue; }

        const openTrades = await sbGet('shreem_brzee_live_trades', 'status=eq.open&select=amount_sol');
        const openExp = openTrades.reduce((s, t) => s + (Number(t.amount_sol) || 0), 0);
        const maxExp = bal * 0.5;
        if (openExp >= maxExp) { console.log('[shreem] Exposure cap reached'); continue; }

        const wins = Number(sess.wins || 0), losses = Number(sess.losses || 0);
        const wr = (wins + losses) >= 5 ? wins / (wins + losses) : 0.5;
        const pct = Math.min(0.10, Math.max(0.05, wr * 0.12));
        const size = Math.min(bal * pct, maxExp - openExp);
        if (size < 0.005) { console.log(`[shreem] Size too small: ${size}`); continue; }

        const lamports = Math.floor(size * LAMPORTS);
        const quote = await jupiterQuote(sig.mint, lamports);
        const swapTx = await jupiterSwapTx(quote, wallet);
        const txSig = await signAndSend(swapTx, sk);
        const confirmed = await waitConfirm(txSig);

        const entryPrice = (Number(quote.inAmount) > 0 && Number(quote.outAmount) > 0)
          ? (Number(quote.inAmount) / LAMPORTS) / (Number(quote.outAmount) / 1e6) : null;

        await sbPost('shreem_brzee_live_trades', {
          session_id: 'default', sig: sig.sig + '_live', tx_sig: txSig,
          mint: sig.mint, symbol: sig.symbol, label: sig.label, wallet: sig.wallet,
          action: 'BUY', amount_sol: size, entry_price: entryPrice,
          tokens_received: Number(quote.outAmount),
          status: confirmed ? 'open' : 'unconfirmed',
          opened_at: new Date().toISOString(), slippage_pct: 3.0,
        });

        await sbPatch('shreem_brzee_session', 'id=eq.default', {
          portfolio: Number(sess.portfolio || 0) - size, updated_at: new Date().toISOString(),
        });

        console.log(`[shreem] ✅ EXECUTED: ${sig.symbol || sig.mint?.slice(0,8)} | ${size.toFixed(4)} SOL | tx:${txSig?.slice(0,16)}`);
      } catch (e) {
        console.error(`[shreem] ERROR ${sig.sig}:`, e.message);
        await sbPatch('shreem_brzee_signals', `sig=eq.${sig.sig}`, { live_processed: false });
      }
    }
  } catch (e) { console.error('[shreem] Poll error:', e.message); }
  finally { busy = false; }
}

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'running', bot: 'Shreem Brzee Live Worker', uptime: Math.floor(process.uptime()), time: new Date().toISOString() }));
}).listen(PORT, () => console.log(`[shreem] Health on :${PORT}`));

console.log('[shreem] Shreem Brzee Live Worker starting...');
setInterval(poll, POLL_MS);
poll();
