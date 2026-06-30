// shreem-sniper-worker.js — Shreem Sniper v1.0
// Architecture: Helius webhook (new pool creation) → Hetzner → safety checks → Jupiter buy
//               → in-memory + disk-persisted price watcher → trailing-stop/hard-stop sell
//
// LESSONS FROM COPY-TRADING FAILURE (applied here):
// 1. Position state MUST survive restarts — saved to disk on every change, loaded on boot
// 2. Sell logic must NEVER depend on a possibly-dead Supabase key — Supabase is logging-only
// 3. No WebSocket reconnect gaps — webhook push only, nothing to "miss" during reconnects
// 4. Buy-confirm and position-store happen atomically before anything else can read state
// 5. Price polling loop (not whale-mirror) drives sells — we own our own exit, no dependency
//    on detecting someone else's sell transaction

const express     = require('express');
const fs           = require('fs');
const fetch         = require('node-fetch');
const { Connection, Keypair, VersionedTransaction, PublicKey } = require('@solana/web3.js');
const bs58          = require('bs58');

// ── CONFIG ──────────────────────────────────────────────────────────────────
const PORT             = 3002;
const WEBHOOK_SECRET    = process.env.SNIPER_WEBHOOK_SECRET || 'shreem-sniper-2026';
const HELIUS_API_KEY    = process.env.HELIUS_API_KEY || '5e971a11-d98d-40fc-8a12-37092eda4580';
const HELIUS_RPC        = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const JUP_QUOTE_URL      = 'https://quote-api.jup.ag/v6/quote';
const JUP_SWAP_URL       = 'https://quote-api.jup.ag/v6/swap';
const SOL_MINT          = 'So11111111111111111111111111111111111111112';
const KEYPAIR_FILE       = '/root/.shreem_key';
const POS_FILE          = '/root/.shreem_sniper_positions.json';

const TRADE_PCT         = 0.05;   // 5% of wallet per trade
const HARD_STOP_PCT      = -0.25;  // -25% hard stop loss
const TRAIL_ACTIVATE_PCT  = 0.15;   // trailing starts once price is +15% from entry
const TRAIL_LOCK_PCT     = 0.50;   // once trailing, lock 50% of peak gain (matches copy-bot setting)
const MIN_LIQUIDITY_USD   = 5000;   // skip pools under $5k liquidity
const BUY_SLIPPAGE_BPS    = 1500;  // 15% slippage on entry (new pools are volatile)
const SELL_SLIPPAGE_BPS   = 2000;  // 20% slippage on exit (prioritize getting out over price)
const PRICE_POLL_MS      = 3000;  // check every open position's price every 3s
const MIN_HOLD_MS        = 5000;  // never sell within first 5s — let pool stabilize

const connection = new Connection(HELIUS_RPC, 'confirmed');

// ── STATE ───────────────────────────────────────────────────────────────────
const posCache  = new Map();   // id → position
const closing   = new Set();   // ids currently being sold
const buying    = new Set();   // mints currently being bought (race lock)
let   keypair   = null;
let   isLive     = true;       // controlled by pm2 stop/start only — no fragile UI dependency
let   solUsd     = 150;

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

async function loadKeypair() {
  const raw = JSON.parse(fs.readFileSync(KEYPAIR_FILE, 'utf8'));
  keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log(`[keypair] ✅ loaded: ${keypair.publicKey.toBase58()}`);
}

async function getWalletBalanceSol() {
  const lamports = await connection.getBalance(keypair.publicKey);
  return lamports / 1e9;
}

// ── SAFETY CHECKS ───────────────────────────────────────────────────────────
// Checks mint authority + freeze authority on-chain. Returns {safe, reason}.
async function checkTokenSafety(mint) {
  try {
    const info = await connection.getParsedAccountInfo(new PublicKey(mint));
    const parsed = info?.value?.data?.parsed?.info;
    if (!parsed) return { safe: false, reason: 'no_mint_data' };
    if (parsed.mintAuthority !== null) return { safe: false, reason: 'mint_authority_active' };
    if (parsed.freezeAuthority !== null) return { safe: false, reason: 'freeze_authority_active' };
    return { safe: true, reason: 'renounced' };
  } catch(e) {
    return { safe: false, reason: `check_failed: ${e.message}` };
  }
}

async function getPoolLiquidityUsd(mint) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const j = await r.json();
    const pairs = j?.pairs || [];
    if (!pairs.length) return 0;
    // take the highest-liquidity pair for this mint
    return Math.max(...pairs.map(p => Number(p.liquidity?.usd) || 0));
  } catch(e) {
    console.error('[liquidity] check failed:', e.message);
    return 0;
  }
}

// ── JUPITER SWAP HELPERS ────────────────────────────────────────────────────
async function jupQuote(inputMint, outputMint, amount, slippageBps) {
  const url = `${JUP_QUOTE_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(`quote: ${j.error}`);
  return j;
}

async function jupSwapTx(quote) {
  const r = await fetch(JUP_SWAP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  const j = await r.json();
  if (!j.swapTransaction) throw new Error('no swapTransaction from Jupiter');
  return j.swapTransaction;
}

async function signAndSendTx(swapTxBase64) {
  const tx = VersionedTransaction.deserialize(Buffer.from(swapTxBase64, 'base64'));
  tx.sign([keypair]);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
  const conf = await connection.confirmTransaction(sig, 'confirmed');
  if (conf.value.err) throw new Error(`tx failed: ${JSON.stringify(conf.value.err)}`);
  return sig;
}

// ── BUY ─────────────────────────────────────────────────────────────────────
async function executeSnipe(mint, symbol) {
  if (!isLive) { console.log(`[snipe] ⛔ skipped — bot stopped`); return; }
  if (buying.has(mint)) { console.log(`[snipe] ⛔ already buying ${mint.slice(0,8)}`); return; }
  for (const p of posCache.values()) {
    if (p.mint === mint) { console.log(`[snipe] ⛔ already holding ${mint.slice(0,8)}`); return; }
  }
  buying.add(mint);
  const t0 = Date.now();
  try {
    // 1. Safety checks first — these are the lines that prevent catastrophic loss
    const safety = await checkTokenSafety(mint);
    if (!safety.safe) {
      console.log(`[snipe] ⛔ ${mint.slice(0,8)} UNSAFE — ${safety.reason}`);
      return;
    }
    const liqUsd = await getPoolLiquidityUsd(mint);
    if (liqUsd < MIN_LIQUIDITY_USD) {
      console.log(`[snipe] ⛔ ${mint.slice(0,8)} liquidity too low: $${liqUsd.toFixed(0)} < $${MIN_LIQUIDITY_USD}`);
      return;
    }
    console.log(`[snipe] ✅ ${mint.slice(0,8)} passed safety: renounced=${safety.safe} liq=$${liqUsd.toFixed(0)}`);

    // 2. Size the trade
    const balSol = await getWalletBalanceSol();
    const sizeSol = Math.max(balSol * TRADE_PCT, 0.003); // floor to avoid dust-size failed txs
    const sizeLamports = Math.floor(sizeSol * 1e9);

    // 3. Quote + swap
    const quote = await jupQuote(SOL_MINT, mint, sizeLamports, BUY_SLIPPAGE_BPS);
    const swapTx = await jupSwapTx(quote);
    const sig = await signAndSendTx(swapTx);

    const rawOut = Number(quote.outAmount);
    const decimals = quote.outputDecimals ?? 6; // Jupiter v6 includes this; fallback 6 for pump.fun standard
    const entryPriceUsd = (sizeSol * solUsd) / (rawOut / (10 ** decimals));

    const tradeId = `snipe_${Date.now()}_${mint.slice(0,8)}`;
    posCache.set(tradeId, {
      id: tradeId, mint, symbol: symbol || mint.slice(0,8),
      entry_price: entryPriceUsd, peak_price: entryPriceUsd,
      amount_sol: sizeSol, tokens_received: rawOut, token_decimals: decimals,
      opened_at: new Date().toISOString(), trailing_active: false,
    });
    savePosCache();

    console.log(`[snipe] ✅ BUY ${symbol||mint.slice(0,8)} | ${sizeSol.toFixed(4)} SOL | sig=${sig.slice(0,16)}… | ${Date.now()-t0}ms`);
  } catch(e) {
    console.log(`[snipe] ❌ buy failed for ${mint.slice(0,8)}: ${e.message}`);
  } finally {
    buying.delete(mint);
  }
}

// ── SELL ────────────────────────────────────────────────────────────────────
async function executeExit(pos, reason) {
  if (closing.has(pos.id)) return;
  closing.add(pos.id);
  posCache.delete(pos.id);
  savePosCache();
  const sym = pos.symbol || pos.mint.slice(0,8);
  const t0 = Date.now();
  console.log(`[exit] 🔴 ${sym} reason=${reason}`);
  try {
    let rawAmt = await getTokenBalance(pos.mint);
    if (!rawAmt || rawAmt < 1) rawAmt = Number(pos.tokens_received || 0);
    if (!rawAmt || rawAmt < 1) {
      await new Promise(r => setTimeout(r, 3000));
      rawAmt = await getTokenBalance(pos.mint);
      if (!rawAmt || rawAmt < 1) {
        console.log(`[exit] ⚠️ ${sym} no tokens found after retry — nothing to sell (already empty or never landed)`);
        return;
      }
    }
    const quote = await jupQuote(pos.mint, SOL_MINT, rawAmt, SELL_SLIPPAGE_BPS);
    const swapTx = await jupSwapTx(quote);
    const sig = await signAndSendTx(swapTx);

    const solOut = Number(quote.outAmount) / 1e9;
    const pnlSol = solOut - pos.amount_sol;
    const pnlPct = (pnlSol / pos.amount_sol) * 100;

    console.log(`[exit] ✅ ${sym} | ${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}% | ${pnlSol>=0?'+':''}${pnlSol.toFixed(4)} SOL | sig=${sig.slice(0,16)}… | ${Date.now()-t0}ms`);
  } catch(e) {
    console.log(`[exit] ❌ sell failed for ${sym}: ${e.message} — re-adding to posCache for retry`);
    posCache.set(pos.id, pos);
    savePosCache();
  } finally {
    closing.delete(pos.id);
  }
}

async function getTokenBalance(mint) {
  try {
    const resp = await connection.getParsedTokenAccountsByOwner(keypair.publicKey, { mint: new PublicKey(mint) });
    if (!resp.value.length) return 0;
    return Number(resp.value[0].account.data.parsed.info.tokenAmount.amount);
  } catch(e) {
    return 0;
  }
}

// ── PRICE WATCHER — this is what replaces "whale sell mirror" ──────────────
// We own our exit. We don't wait to detect someone else selling.
// Every PRICE_POLL_MS we check each open position's live price and apply
// hard-stop / trailing-stop rules ourselves.
async function getCurrentPriceUsd(mint, tokenDecimals) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const j = await r.json();
    const pairs = j?.pairs || [];
    if (!pairs.length) return null;
    const best = pairs.reduce((a,b) => (Number(b.liquidity?.usd)||0) > (Number(a.liquidity?.usd)||0) ? b : a);
    return Number(best.priceUsd) || null;
  } catch(e) {
    return null;
  }
}

async function priceWatchTick() {
  for (const [id, pos] of [...posCache.entries()]) {
    if (closing.has(id)) continue;
    const heldMs = Date.now() - new Date(pos.opened_at).getTime();
    if (heldMs < MIN_HOLD_MS) continue; // let pool stabilize before evaluating

    const price = await getCurrentPriceUsd(pos.mint, pos.token_decimals);
    if (price === null) continue; // dexscreener has no data yet — skip this tick, try again next tick

    const changePct = ((price - pos.entry_price) / pos.entry_price);

    // Hard stop — always checked first, overrides everything
    if (changePct <= HARD_STOP_PCT) {
      console.log(`[watch] 🛑 ${pos.symbol} hard stop ${(changePct*100).toFixed(1)}%`);
      executeExit(pos, 'hard_stop');
      continue;
    }

    // Update peak + trailing state
    if (price > pos.peak_price) {
      pos.peak_price = price;
      const peakChangePct = (pos.peak_price - pos.entry_price) / pos.entry_price;
      if (peakChangePct >= TRAIL_ACTIVATE_PCT && !pos.trailing_active) {
        pos.trailing_active = true;
        console.log(`[watch] 📈 ${pos.symbol} trailing ACTIVATED at +${(peakChangePct*100).toFixed(1)}%`);
      }
      posCache.set(id, pos);
      savePosCache();
    }

    // Trailing stop check — once active, sell if price drops to lock TRAIL_LOCK_PCT of peak gain
    if (pos.trailing_active) {
      const peakGainPct = (pos.peak_price - pos.entry_price) / pos.entry_price;
      const lockPriceGainPct = peakGainPct * TRAIL_LOCK_PCT;
      const lockPrice = pos.entry_price * (1 + lockPriceGainPct);
      if (price <= lockPrice) {
        console.log(`[watch] 📉 ${pos.symbol} trailing stop hit — peak +${(peakGainPct*100).toFixed(1)}%, locking ${(TRAIL_LOCK_PCT*100)}% of gain`);
        executeExit(pos, 'trailing_stop');
        continue;
      }
    }
  }
}

// ── WEBHOOK SERVER — receives new pool/launch events from Helius ───────────
const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({
    version: 'v1.0-SNIPER', positions: posCache.size, is_live: isLive,
    keypair_loaded: !!keypair, time: new Date().toISOString(),
  });
});

app.post('/webhook', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader !== WEBHOOK_SECRET) return res.status(401).json({ error: 'unauthorized' });
  res.json({ received: true }); // ack immediately, process async

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of events) {
      // Helius "pool creation" / token mint events vary by webhook type configured.
      // This expects an enhanced webhook with type TOKEN_MINT or similar — adjust
      // the field extraction once the actual Helius payload shape is confirmed live.
      const mint = ev?.tokenTransfers?.[0]?.mint || ev?.mint;
      const symbol = ev?.tokenTransfers?.[0]?.symbol || null;
      if (!mint) { console.log('[webhook] event with no mint field — skipping'); continue; }
      console.log(`[webhook] 🆕 new token detected: ${mint.slice(0,8)}`);
      executeSnipe(mint, symbol);
    }
  } catch(e) {
    console.error('[webhook] processing error:', e.message);
  }
});

// Manual test endpoint — snipe a specific mint on demand without waiting for a webhook
app.post('/test-snipe', async (req, res) => {
  const { mint, symbol } = req.body;
  if (!mint) return res.status(400).json({ error: 'mint required' });
  executeSnipe(mint, symbol);
  res.json({ triggered: true, mint });
});

// Manual test endpoint — force-sell a specific open position by id
app.post('/test-sell', async (req, res) => {
  const { id } = req.body;
  const pos = posCache.get(id);
  if (!pos) return res.status(404).json({ error: 'position not found', open_ids: [...posCache.keys()] });
  executeExit(pos, 'manual_test');
  res.json({ triggered: true, id });
});

app.get('/positions', (req, res) => {
  res.json([...posCache.values()]);
});

(async () => {
  await loadKeypair();
  loadPosCache();
  app.listen(PORT, () => {
    console.log(`[sniper] ✅ v1.0-SNIPER listening on port ${PORT}`);
    console.log(`[sniper] Webhook: POST http://YOUR_IP:${PORT}/webhook`);
    console.log(`[sniper] Health: GET http://YOUR_IP:${PORT}/health`);
    console.log(`[sniper] Config: ${TRADE_PCT*100}% size | hard stop ${HARD_STOP_PCT*100}% | trail activates +${TRAIL_ACTIVATE_PCT*100}% locking ${TRAIL_LOCK_PCT*100}% | min liq $${MIN_LIQUIDITY_USD}`);
  });
  setInterval(priceWatchTick, PRICE_POLL_MS);
})();
