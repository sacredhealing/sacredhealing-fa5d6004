/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQI SOVEREIGN SNIPER — Hetzner Position Manager (v5)       ║
 * ║  Siddha Quantum Intelligence · Solana Memecoin Engine        ║
 * ║                                                                ║
 * ║  This process does ONE job: manage and exit open positions.   ║
 * ║  Detection and entry now live entirely in the                ║
 * ║  sniper-helius-webhook edge function — that's the "with       ║
 * ║  Helius webhook" architecture change. This file no longer     ║
 * ║  opens a WebSocket or gRPC stream and no longer calls         ║
 * ║  enter() at all, on purpose: running detection in two places  ║
 * ║  at once is how you double-buy the same mint on a race.       ║
 * ║                                                                ║
 * ║  Supabase is the single source of truth for position state    ║
 * ║  (tokens_held, ath_price, tp1_hit, tp2_hit, trail_armed,       ║
 * ║  realized_pnl — see the 20260630_sniper_position_state_       ║
 * ║  columns.sql migration). There is no local disk cache anymore;║
 * ║  a position created by the webhook and a worker restart that  ║
 * ║  happens to land a second later both need to see the same     ║
 * ║  state, and a file only one of those processes can write to   ║
 * ║  can't be that.                                                ║
 *
 * If you later want the faster gRPC/WebSocket detection path back
 * instead of (or alongside) the webhook, that code still exists in
 * git history (the v4 commit) — re-adding it safely means giving
 * it the SAME claim-via-DB-insert pattern the webhook uses, not
 * reverting to the old in-memory buyingMints lock, or you're back
 * to a double-entry race between two detection paths.
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js';

// ── ENV ──────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL        || 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || '';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY       || '';
const PAPER_MODE    = (process.env.PAPER_MODE || 'true') === 'true';
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || ''; // same dedicated wallet the edge function buys with
const TELEGRAM_TOKEN     = process.env.TELEGRAM_TOKEN     || '';
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '';

// ── TRADING CONFIG (exit side only — entry config now lives in the edge function's env) ──
const TP1_X              = parseFloat(process.env.TAKE_PROFIT_X        || '3.0');
const TP2_X               = parseFloat(process.env.MOONBAG_X            || '10.0');
const SL_PCT               = parseFloat(process.env.STOP_LOSS_PCT        || '0.35');
const TRAIL_PCT             = parseFloat(process.env.TRAILING_STOP_PCT    || '0.25');
const TRAIL_ACTIVATE_PCT    = parseFloat(process.env.TRAIL_ACTIVATE_PCT   || '0.20');
const MAX_HOLD_MIN          = parseInt(process.env.MAX_HOLD_MINUTES        || '30');
const SLIPPAGE_BPS          = parseInt(process.env.SLIPPAGE_BPS            || '8000');
const JITO_TIP               = parseFloat(process.env.JITO_TIP_SOL          || '0.001');
const MAX_IMPACT_FRACTION   = parseFloat(process.env.MAX_PRICE_IMPACT_PCT  || '15') / 100;

// ── CONSTANTS (verified June 2026) ──────────────────────────────
const SOL_MINT       = 'So11111111111111111111111111111111111111112';
const PUMP_DECIMALS = 6;
const JUP_URL         = 'https://api.jup.ag/swap/v1';
const JITO_URL        = 'https://mainnet.block-engine.jito.wtf/api/v1';

const RPC_HTTP = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

// ── CLIENTS ──────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
let keypair = null;
let connection = null;
if (!PAPER_MODE && WALLET_PRIVATE_KEY) {
  const { Connection, Keypair } = await import('@solana/web3.js');
  const bs58 = (await import('bs58')).default;
  connection = new Connection(RPC_HTTP, 'processed');
  try { keypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY)); }
  catch { console.error('❌ Invalid WALLET_PRIVATE_KEY'); }
}

// ── STATE — a local cache of what's in Supabase, resynced every tick ──
const positions = new Map(); // mint → position row (camelCased)
const devWatching = new Map();
const devTriggered = new Set();
const startTime = Date.now();

// ══════════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════════
const ts = () => new Date().toISOString().slice(11, 23);
const L = {
  info:  (m) => console.log(`[${ts()}] • ${m}`),
  win:   (m) => console.log(`[${ts()}] ✅ ${m}`),
  loss:  (m) => console.log(`[${ts()}] ❌ ${m}`),
  warn:  (m) => console.log(`[${ts()}] ⚠️  ${m}`),
  alert: (m) => console.log(`[${ts()}] 🚨 ${m}`),
};
async function tg(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}
}

// ══════════════════════════════════════════════════════════════════
// SYNC — Supabase is truth. Pull open positions in, drop ones that
// closed elsewhere (shouldn't happen since only this process closes
// them, but a manual DB edit or a future second writer shouldn't be
// able to leave a ghost position being managed forever).
// ══════════════════════════════════════════════════════════════════
async function syncPositionsFromDB() {
  try {
    const { data, error } = await sb.from('sniper_trades').select('*').eq('status', 'open');
    if (error) { L.warn(`Sync error: ${error.message}`); return; }
    const seen = new Set();
    for (const row of data ?? []) {
      seen.add(row.mint);
      const existing = positions.get(row.mint);
      positions.set(row.mint, {
        mint: row.mint, symbol: row.symbol, launchpad: row.launchpad,
        entryPrice: parseFloat(row.entry_price), entryTime: existing?.entryTime ?? new Date(row.created_at).getTime(),
        tokensHeld: row.tokens_held != null ? parseFloat(row.tokens_held) : (existing?.tokensHeld ?? 0),
        athPrice: row.ath_price != null ? parseFloat(row.ath_price) : (existing?.athPrice ?? parseFloat(row.entry_price)),
        tp1Hit: row.tp1_hit ?? existing?.tp1Hit ?? false,
        tp2Hit: row.tp2_hit ?? existing?.tp2Hit ?? false,
        trailArmed: row.trail_armed ?? existing?.trailArmed ?? false,
        realizedPnl: row.realized_pnl != null ? parseFloat(row.realized_pnl) : (existing?.realizedPnl ?? 0),
        creator: row.creator ?? existing?.creator ?? null,
      });
      if (!existing) {
        L.info(`[sync] picked up ${row.symbol} (${row.mint.slice(0, 8)}...) opened by the webhook`);
        if (row.creator) devWatching.set(row.mint, { creator: row.creator, lastSig: null });
      }
    }
    for (const mint of [...positions.keys()]) {
      if (!seen.has(mint)) { positions.delete(mint); devWatching.delete(mint); devTriggered.delete(mint); }
    }
  } catch (e) { L.warn(`Sync exception: ${e.message}`); }
}

// ══════════════════════════════════════════════════════════════════
// PRICING — same shared-basis function as v4. SOL received for
// exactly 1 whole token, so it's always comparable to entryPrice.
// ══════════════════════════════════════════════════════════════════
async function getLivePrice(mint) {
  try {
    const oneToken = 10 ** PUMP_DECIMALS;
    const qp = new URLSearchParams({ inputMint: mint, outputMint: SOL_MINT, amount: oneToken.toString(), slippageBps: '500' });
    const r = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    const q = await r.json();
    if (!q.outAmount) return null;
    return Number(q.outAmount) / 1e9;
  } catch { return null; }
}

async function executeSell(mint, amountRaw) {
  if (!keypair) return { success: false, reason: 'no keypair (paper mode or unset key)' };
  try {
    const qp = new URLSearchParams({ inputMint: mint, outputMint: SOL_MINT, amount: amountRaw.toString(), slippageBps: SLIPPAGE_BPS.toString(), onlyDirectRoutes: 'false' });
    const qRes = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) });
    if (!qRes.ok) return { success: false, reason: `quote ${qRes.status}` };
    const quote = await qRes.json();
    if (quote.error) return { success: false, reason: quote.error };

    const impact = Math.abs(parseFloat(quote.priceImpactPct || '0'));
    if (impact > MAX_IMPACT_FRACTION) return { success: false, reason: `impact ${(impact * 100).toFixed(1)}% > cap` };

    const swapRes = await fetch(`${JUP_URL}/swap`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote, userPublicKey: keypair.publicKey.toBase58(), wrapAndUnwrapSol: true,
        prioritizationFeeLamports: { jitoTipLamports: Math.round(JITO_TIP * 1e9) },
        dynamicComputeUnitLimit: true, dynamicSlippage: { maxBps: SLIPPAGE_BPS },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!swapRes.ok) return { success: false, reason: `swap ${swapRes.status}` };
    const { swapTransaction } = await swapRes.json();
    if (!swapTransaction) return { success: false, reason: 'no swapTx' };

    const { VersionedTransaction } = await import('@solana/web3.js');
    const txBuf = Buffer.from(swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);
    const signed = Buffer.from(tx.serialize()).toString('base64');

    const jitoRes = await fetch(`${JITO_URL}/bundles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [[signed]] }),
      signal: AbortSignal.timeout(4000),
    });
    const jitoData = await jitoRes.json().catch(() => ({}));
    if (jitoData.result) return { success: true, outAmount: quote.outAmount };

    await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return { success: true, outAmount: quote.outAmount };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════
// POSITION MANAGER (every 5s)
// ══════════════════════════════════════════════════════════════════
async function managePositions() {
  if (positions.size === 0) return;

  for (const [mint, pos] of [...positions.entries()]) {
    const currentPrice = await getLivePrice(mint);
    if (!currentPrice || currentPrice <= 0 || !Number.isFinite(pos.entryPrice) || pos.entryPrice <= 0) continue;

    const x = currentPrice / pos.entryPrice;
    const minElapsed = (Date.now() - pos.entryTime) / 60000;
    if (currentPrice > pos.athPrice) pos.athPrice = currentPrice;
    const drawFromAth = pos.athPrice > 0 ? (pos.athPrice - currentPrice) / pos.athPrice : 0;
    const gainFromEntry = x - 1;
    if (!pos.trailArmed && gainFromEntry >= TRAIL_ACTIVATE_PCT) pos.trailArmed = true;

    let exitPct = 0, exitAction = null;
    if (devTriggered.has(mint))                                  { exitPct = 1.0;  exitAction = 'DEV_WALLET_EXIT'; }
    else if (!pos.tp1Hit && x >= TP1_X)                          { pos.tp1Hit = true; exitPct = 0.50; exitAction = 'TP1_EXIT'; }
    else if (pos.tp1Hit && !pos.tp2Hit && x >= TP2_X)            { pos.tp2Hit = true; exitPct = 0.40; exitAction = 'TP2_EXIT'; }
    else if (x <= (1 - SL_PCT))                                  { exitPct = 1.0;  exitAction = 'SL_EXIT'; }
    else if (pos.trailArmed && drawFromAth >= TRAIL_PCT)         { exitPct = 1.0;  exitAction = 'TRAIL_EXIT'; }
    else if (minElapsed >= MAX_HOLD_MIN && !pos.tp1Hit)          { exitPct = 1.0;  exitAction = 'TIMEOUT_EXIT'; }

    if (!exitAction || exitPct <= 0) {
      await sb.from('sniper_trades').update({ ath_price: pos.athPrice, trail_armed: pos.trailArmed }).eq('mint', mint).eq('status', 'open');
      continue;
    }

    const tokensToSell = pos.tokensHeld * exitPct;
    let pnl;

    if (!PAPER_MODE && keypair) {
      const sellRaw = Math.round(tokensToSell * 10 ** PUMP_DECIMALS);
      const exec = await executeSell(mint, sellRaw);
      if (!exec.success) { L.warn(`Sell failed ${pos.symbol}: ${exec.reason}`); continue; }
      const solReceived = Number(exec.outAmount) / 1e9;
      pnl = solReceived - (pos.entryPrice * tokensToSell);
    } else {
      pnl = (currentPrice - pos.entryPrice) * tokensToSell;
    }

    pos.realizedPnl = (pos.realizedPnl || 0) + pnl;
    pos.tokensHeld -= tokensToSell;
    const fullExit = exitPct >= 1.0 || pos.tokensHeld <= 1e-6;

    try {
      await sb.from('sniper_trades').update({
        action: exitAction, exit_price: currentPrice,
        multiplier_x: parseFloat(x.toFixed(4)),
        pnl_sol: parseFloat(pos.realizedPnl.toFixed(8)),
        tokens_held: pos.tokensHeld, ath_price: pos.athPrice,
        tp1_hit: pos.tp1Hit, tp2_hit: pos.tp2Hit, trail_armed: pos.trailArmed,
        realized_pnl: pos.realizedPnl,
        status: fullExit ? (pos.realizedPnl > 0 ? 'won' : 'lost') : 'open',
      }).eq('mint', mint).eq('status', 'open');
    } catch (e) { L.warn(`DB update: ${e.message}`); }

    if (fullExit) { positions.delete(mint); devWatching.delete(mint); devTriggered.delete(mint); }

    const icon = pnl > 0 ? '✅' : '❌';
    L.info(`${icon} ${exitAction} ${pos.symbol} | ${x.toFixed(2)}x | PnL:${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL`);
    if (fullExit) tg(`${pnl > 0 ? '🟢' : '🔴'} *${PAPER_MODE ? 'PAPER ' : ''}${exitAction}* \`${pos.symbol}\`\n${x.toFixed(2)}x | PnL: \`${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL\``);
  }
}

// ══════════════════════════════════════════════════════════════════
// DEV WALLET MONITOR (every 5s) — unchanged from v4
// ══════════════════════════════════════════════════════════════════
async function rpc(method, params) {
  try {
    const r = await fetch(RPC_HTTP, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(4000),
    });
    return (await r.json()).result ?? null;
  } catch { return null; }
}
async function checkDevWallets() {
  for (const [mint, info] of devWatching.entries()) {
    if (!info.creator) continue;
    try {
      const sigs = await rpc('getSignaturesForAddress', [info.creator, { limit: 3 }]);
      if (sigs?.length > 0) {
        const latest = sigs[0];
        if (latest.signature !== info.lastSig && Date.now() / 1000 - (latest.blockTime || 0) < 30) {
          if (info.lastSig !== null) {
            devTriggered.add(mint);
            L.alert(`DEV WALLET MOVED: ${mint.slice(0, 8)}... — exit triggered`);
            tg(`🚨 *DEV WALLET MOVE*\n\`${mint.slice(0, 8)}...\` — instant exit queued`);
          }
          devWatching.set(mint, { ...info, lastSig: latest.signature });
        }
      }
    } catch {}
  }
}

// ══════════════════════════════════════════════════════════════════
// STATS (every 5 min)
// ══════════════════════════════════════════════════════════════════
async function printStats() {
  try {
    const { data } = await sb.from('sniper_trades').select('pnl_sol, status, multiplier_x').order('created_at', { ascending: false }).limit(1000);
    const all = data ?? [];
    const wins = all.filter((t) => t.status === 'won').length;
    const losses = all.filter((t) => t.status === 'lost').length;
    const pnl = all.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
    const wr = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '—';
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  SQI SOVEREIGN SNIPER — POSITION MANAGER SNAPSHOT');
    console.log(`  Mode: ${PAPER_MODE ? 'PAPER' : 'LIVE'} | Uptime: ${Math.round((Date.now() - startTime) / 60000)}min`);
    console.log(`  W/L: ${wins}/${losses} (${wr}%) | Net PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | Open: ${positions.size}`);
    console.log('══════════════════════════════════════════════════════');
    console.log('');
  } catch (e) { L.warn(`Stats error: ${e.message}`); }
}

// ══════════════════════════════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════════════════════════════
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  SQI SNIPER — Hetzner Position Manager (v5)      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Mode:   ${PAPER_MODE ? '📋 PAPER' : '⚡ LIVE'}`);
  console.log(`  Wallet: ${keypair ? keypair.publicKey.toBase58() : 'Not set (paper mode)'}`);
  console.log(`  Entry/detection: handled by sniper-helius-webhook — NOT this process`);
  console.log(`  Exit:   TP1:${TP1_X}x(50%) TP2:${TP2_X}x(40%) SL:-${SL_PCT * 100}% Trail:${TRAIL_PCT * 100}%(arms@+${TRAIL_ACTIVATE_PCT * 100}%) MaxHold:${MAX_HOLD_MIN}min`);
  console.log(`  Supabase: ${SUPABASE_URL.slice(8, 28)}...`);
  console.log('');

  await syncPositionsFromDB();
  L.info(`✦ Loaded ${positions.size} open position(s) from Supabase`);

  setInterval(syncPositionsFromDB, 8000);
  setInterval(managePositions, 5000);
  setInterval(checkDevWallets, 5000);
  setInterval(printStats, 300000);
  setTimeout(printStats, 30000);

  L.info('✦ Position manager online.');
  tg(`🌟 *POSITION MANAGER ONLINE*\nMode: \`${PAPER_MODE ? 'PAPER' : 'LIVE'}\`\nManaging ${positions.size} open position(s)`);
}

start().catch((e) => { console.error('Fatal:', e); process.exit(1); });
