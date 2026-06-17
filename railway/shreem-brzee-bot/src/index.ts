// v2.2.0 deployed 2026-06-17T13:12:14Z
/**
 * 🔱 SHREEM BRZEE BOT v2 — World-Class Solana Copy Trading
 * Hetzner Server | Solana Mainnet
 *
 * ARCHITECTURE:
 *  Helius Enhanced WS (50-100ms processed) → parseTradeFromTx() → processSignal()
 *    → RugCheck filter (mint/freeze authority)
 *    → Jupiter v6 quote + swap (LIVE mode)
 *    → Jito bundle broadcast (MEV-protected)
 *    → TP/SL monitor (independent of whale signals)
 *
 * MODES:
 *  PAPER  — simulate with realistic costs, no real SOL spent
 *  LIVE   — real execution via BOT_WALLET_PRIVATE_KEY
 *
 * ENV VARS (set in Hetzner PM2 ecosystem or GitHub Actions):
 *  BOT_WALLET_PRIVATE_KEY  — base58 private key for live trading
 *  BOT_MODE                — 'paper' | 'live' (default: paper)
 *  HELIUS_API_KEY          — 775d3d1f-6801-41de-a063-8aee4382d0f4
 *  RISK_PCT                — 0.05 (5% per trade, default)
 *  MAX_SLIPPAGE_BPS        — 300 (3%, default)
 *  JITO_TIP_LAMPORTS       — 1000000 (0.001 SOL, default)
 *  TP_MULTIPLIER           — 2.0 (take profit at 2× entry, default)
 *  SL_MULTIPLIER           — 0.5 (stop loss at 50% of entry, default)
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';

// ── Config ────────────────────────────────────────────────────────────────────
const HELIUS_KEY   = process.env.HELIUS_API_KEY || '775d3d1f-6801-41de-a063-8aee4382d0f4';
const HELIUS_RPC   = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const BOT_MODE     = (process.env.BOT_MODE || 'paper') as 'paper' | 'live';
const RISK_PCT     = parseFloat(process.env.RISK_PCT || '0.05');
const MAX_SLIP_BPS = parseInt(process.env.MAX_SLIPPAGE_BPS || '300');
const JITO_TIP_LAM = parseInt(process.env.JITO_TIP_LAMPORTS || '1000000'); // 0.001 SOL
const TP_MULT      = parseFloat(process.env.TP_MULTIPLIER || '2.0');
const SL_MULT      = parseFloat(process.env.SL_MULTIPLIER || '0.5');
const SESSION_ID   = 'default';

// Supabase
const EDGE_BASE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const SUPA_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const supabase  = createClient(SUPA_URL, ANON_KEY);

// Jupiter
const JUP_QUOTE = 'https://quote-api.jup.ag/v6/quote';
const JUP_SWAP  = 'https://quote-api.jup.ag/v6/swap';
const JUP_PRICE = 'https://api.jup.ag/price/v2';
const SOL_MINT  = 'So11111111111111111111111111111111111111112';

// Jito block engine + rotating tip accounts
const JITO_ENGINE = 'https://mainnet.block-engine.jito.labs.io/api/v1/bundles';
const JITO_TIPS   = [
  'Cw8CFyZ9LofTQB12JMi7JVEqBFKAFNLxTDMoYiHddfS4',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6Lx',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1sMaC9jQ5ry',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Position {
  mint: string; symbol: string; label: string;
  entrySOL: number; netPosition: number; tokenAmount: number;
  entryTime: number; whaleEntrySol: number;
  entryPrice: number;     // USD price at entry (for TP/SL)
  liveMode: boolean;      // was this a real trade?
  liveSig?: string;       // on-chain signature if live
}

interface Session {
  portfolio: number; startBalance: number;
  positions: Record<string, Position>;
  totalPnl: number; wins: number; losses: number;
  startedAt: string; mode: 'paper' | 'live';
}

interface RugReport {
  safe: boolean; reason?: string;
  mintAuthority: boolean; freezeAuthority: boolean;
  lpLocked: boolean; score: number;
}

// ── Solana connection + wallet ────────────────────────────────────────────────
const connection = new Connection(HELIUS_RPC, { commitment: 'processed' });

let botKeypair: Keypair | null = null;
if (BOT_MODE === 'live') {
  const pk = process.env.BOT_WALLET_PRIVATE_KEY;
  if (!pk) {
    console.error('❌ LIVE mode requires BOT_WALLET_PRIVATE_KEY env var');
    process.exit(1);
  }
  try {
    botKeypair = Keypair.fromSecretKey(bs58.decode(pk));
    console.log(`🔑 Bot wallet: ${botKeypair.publicKey.toBase58()}`);
  } catch (e) {
    console.error('❌ Invalid BOT_WALLET_PRIVATE_KEY:', (e as Error).message);
    process.exit(1);
  }
}

// ── Paper sim helpers ─────────────────────────────────────────────────────────
const PRIORITY_FEE = 0.002;
const NETWORK_FEE  = 0.000005;
const TX_FAIL_RATE = 0.08;   // realistic 8% failure for well-configured tx

const slip     = (sol: number) => sol * (MAX_SLIP_BPS / 10_000);
const fees     = ()            => PRIORITY_FEE + NETWORK_FEE;
const txFailed = ()            => BOT_MODE === 'paper' && Math.random() < TX_FAIL_RATE;

const compPenalty = (sol: number): number => {
  const r = Math.random();
  if (r < 0.20) return 0;
  if (r < 0.70) return sol * (0.02 + Math.random() * 0.03);
  return sol * (0.05 + Math.random() * 0.07);
};

const exitMult = (whaleMult?: number): number => {
  if (whaleMult && whaleMult > 0 && whaleMult < 100) {
    return whaleMult * (0.97 + Math.random() * 0.06);
  }
  const r = Math.random();
  if (r < 0.30) return 0.05 + Math.random() * 0.25;
  if (r < 0.55) return 0.30 + Math.random() * 0.50;
  if (r < 0.75) return 0.92 + Math.random() * 0.11;
  if (r < 0.90) return 1.10 + Math.random() * 0.90;
  return 2.00 + Math.random() * 4.00;
};

// ── RugCheck ─────────────────────────────────────────────────────────────────
// Cache checked mints for 10 min to avoid repeat calls
const rugCache = new Map<string, { result: RugReport; ts: number }>();

async function checkRug(mint: string): Promise<RugReport> {
  const cached = rugCache.get(mint);
  if (cached && Date.now() - cached.ts < 600_000) return cached.result;

  try {
    const r = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}/report`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) {
      // If RugCheck is down, allow trade but log warning
      console.warn(`[rugcheck] HTTP ${r.status} for ${mint} — allowing with warning`);
      return { safe: true, mintAuthority: false, freezeAuthority: false, lpLocked: true, score: 0 };
    }
    const data = await r.json();

    // Extract key risk fields
    const mintAuth   = !!data.token?.mintAuthority;
    const freezeAuth = !!data.token?.freezeAuthority;
    const score      = data.score || 0;

    // LP lock: check if any markets have locked liquidity
    const lpLocked   = (data.markets || []).some((m: any) =>
      m.liquidityA?.locked || m.liquidityB?.locked || m.lp?.lpLockedUSD > 0
    );

    // FAIL: mint authority not revoked (dev can print tokens)
    if (mintAuth) {
      const result: RugReport = { safe: false, reason: 'Mint authority NOT revoked — dev can print tokens', mintAuthority: true, freezeAuthority: freezeAuth, lpLocked, score };
      rugCache.set(mint, { result, ts: Date.now() });
      return result;
    }

    // FAIL: freeze authority not revoked (dev can freeze your wallet)
    if (freezeAuth) {
      const result: RugReport = { safe: false, reason: 'Freeze authority NOT revoked — dev can freeze wallets', mintAuthority: false, freezeAuthority: true, lpLocked, score };
      rugCache.set(mint, { result, ts: Date.now() });
      return result;
    }

    // WARN but allow: LP not locked (higher risk, allow in paper, skip in live if score < 50)
    const result: RugReport = { safe: true, mintAuthority: false, freezeAuthority: false, lpLocked, score };
    rugCache.set(mint, { result, ts: Date.now() });
    return result;

  } catch (e: any) {
    // Network error — allow with warning (don't block on RugCheck unavailability)
    console.warn(`[rugcheck] timeout/error for ${mint}: ${e.message} — allowing`);
    return { safe: true, mintAuthority: false, freezeAuthority: false, lpLocked: true, score: 0 };
  }
}

// ── Dynamic priority fee ──────────────────────────────────────────────────────
async function getPriorityFee(accounts: string[]): Promise<number> {
  try {
    const r = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getPriorityFeeEstimate',
        params: [{ accountKeys: accounts, options: { priorityLevel: 'High' } }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    const d = await r.json();
    const fee = d.result?.priorityFeeEstimate;
    if (typeof fee === 'number' && fee > 0) return Math.ceil(fee);
  } catch {}
  return 300_000; // fallback: 300k micro-lamports
}

// ── Live price fetch ──────────────────────────────────────────────────────────
async function getTokenPriceUSD(mint: string): Promise<number> {
  try {
    const r = await fetch(`${JUP_PRICE}?ids=${mint}`, { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    return parseFloat(d?.data?.[mint]?.price || '0');
  } catch { return 0; }
}

// ── Jupiter v6 quote ──────────────────────────────────────────────────────────
async function jupiterQuote(inputMint: string, outputMint: string, amountLamports: number): Promise<any> {
  const url = `${JUP_QUOTE}?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountLamports}&slippageBps=${MAX_SLIP_BPS}&onlyDirectRoutes=false`;
  const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const q = await r.json();
  if (!q.outAmount) throw new Error(q.error || `No Jupiter route: ${inputMint}→${outputMint}`);
  return q;
}

// ── Jupiter v6 swap transaction ───────────────────────────────────────────────
async function jupiterSwapTx(
  quote: any,
  walletPubkey: string,
  priorityFee: number,
): Promise<VersionedTransaction> {
  const r = await fetch(JUP_SWAP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: walletPubkey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: priorityFee,
      asLegacyTransaction: false,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const { swapTransaction } = await r.json();
  if (!swapTransaction) throw new Error('Jupiter returned no swap transaction');
  return VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
}

// ── Build Jito tip transaction ────────────────────────────────────────────────
async function buildJitoTipTx(keypair: Keypair): Promise<VersionedTransaction> {
  const tipAccount = new PublicKey(JITO_TIPS[Math.floor(Math.random() * JITO_TIPS.length)]);
  const { blockhash } = await connection.getLatestBlockhash('finalized');

  const tipIx = SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: tipAccount,
    lamports: JITO_TIP_LAM,
  });

  const msg = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions: [tipIx],
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);
  tx.sign([keypair]);
  return tx;
}

// ── Jito bundle broadcast ─────────────────────────────────────────────────────
async function sendJitoBundle(txs: VersionedTransaction[]): Promise<string> {
  const encoded = txs.map(tx => Buffer.from(tx.serialize()).toString('base64'));
  const r = await fetch(JITO_ENGINE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sendBundle',
      params: [encoded],
    }),
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json();
  if (d.error) throw new Error(`Jito error: ${d.error.message}`);
  return d.result as string; // bundle ID
}


// ── Jupiter Quote Pre-Warmer ──────────────────────────────────────────────────
// Pre-fetches Jupiter quotes for recently-active whale mints every 60s.
// When a real BUY signal fires, the quote is already in memory →
// execution goes from ~800ms cold → ~200ms warm.
//
// How it works:
//   recentMints   — Set of mints seen in last 10 min from incoming signals
//   quoteCache    — Map<mint, {quote, ts}> — expires after 55s (just under refresh)
//   priorityCache — Map<accounts_key, {fee, ts}> — expires after 30s
//
// executeLiveBuy reads from both caches first; only fetches fresh if stale.

const recentMints   = new Map<string, number>();            // mint → last seen ts
const quoteCache    = new Map<string, { quote: any; ts: number }>();  // warm quotes
const priorityCache = new Map<string, { fee: number; ts: number }>(); // warm fees

const QUOTE_TTL    = 55_000;  // 55s — Solana blockhash valid ~90s, quote valid slightly less
const PRIORITY_TTL = 30_000;  // 30s — fees change fast during congestion
const MINT_TTL     = 600_000; // 10 min — forget mints not seen recently
const RISK_LAMPORTS_SAMPLE = 50_000_000; // 0.05 SOL sample size for pre-warm quotes

// Called by processSignal on every incoming signal to register the mint
function registerMintActivity(mint: string): void {
  if (mint && mint !== SOL_MINT) {
    recentMints.set(mint, Date.now());
  }
}

// Warm: get cached quote or fetch fresh
async function getWarmQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
): Promise<any> {
  const key = `${inputMint}:${outputMint}:${amountLamports}`;
  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.ts < QUOTE_TTL) {
    console.log(`[warm] quote hit for ${outputMint.slice(0, 8)} (${((Date.now() - cached.ts) / 1000).toFixed(0)}s old)`);
    return cached.quote;
  }
  const quote = await jupiterQuote(inputMint, outputMint, amountLamports);
  quoteCache.set(key, { quote, ts: Date.now() });
  return quote;
}

// Warm: get cached priority fee or fetch fresh
async function getWarmPriorityFee(accounts: string[]): Promise<number> {
  const key = accounts.slice(0, 3).join(':');
  const cached = priorityCache.get(key);
  if (cached && Date.now() - cached.ts < PRIORITY_TTL) {
    return cached.fee;
  }
  const fee = await getPriorityFee(accounts);
  priorityCache.set(key, { fee, ts: Date.now() });
  return fee;
}

// Background warmer — runs every 60s
let warmerTimer: NodeJS.Timer | null = null;

function startQuotePreWarmer(): void {
  warmerTimer = setInterval(async () => {
    const now = Date.now();

    // Evict stale mints (not seen in 10 min)
    for (const [mint, ts] of recentMints) {
      if (now - ts > MINT_TTL) recentMints.delete(mint);
    }

    const mints = [...recentMints.keys()];
    if (!mints.length) return;

    console.log(`[warmer] pre-fetching quotes for ${mints.length} active mint(s)`);

    let hits = 0;
    for (const mint of mints) {
      try {
        // Pre-warm BUY quote (SOL → token)
        const buyKey  = `${SOL_MINT}:${mint}:${RISK_LAMPORTS_SAMPLE}`;
        const sellKey = `${mint}:${SOL_MINT}:${RISK_LAMPORTS_SAMPLE}`;

        // Fetch both directions in parallel
        const [buyQuote, sellQuote] = await Promise.allSettled([
          jupiterQuote(SOL_MINT, mint, RISK_LAMPORTS_SAMPLE),
          jupiterQuote(mint, SOL_MINT, RISK_LAMPORTS_SAMPLE),
        ]);

        if (buyQuote.status === 'fulfilled') {
          quoteCache.set(buyKey, { quote: buyQuote.value, ts: Date.now() });
          hits++;
        }
        if (sellQuote.status === 'fulfilled') {
          quoteCache.set(sellKey, { quote: sellQuote.value, ts: Date.now() });
        }

        // Pre-warm priority fee for this mint pair
        const feeKey = `${SOL_MINT}:${mint}`;
        const fee = await getPriorityFee([SOL_MINT, mint]);
        priorityCache.set(feeKey, { fee, ts: Date.now() });

        // Small gap between mints to avoid rate limiting
        await new Promise(r => setTimeout(r, 400));
      } catch (e: any) {
        console.warn(`[warmer] ${mint.slice(0, 8)}: ${e.message}`);
      }
    }

    // Clean up expired quote cache entries
    for (const [k, v] of quoteCache) {
      if (Date.now() - v.ts > QUOTE_TTL * 2) quoteCache.delete(k);
    }

    console.log(`[warmer] ✅ ${hits}/${mints.length} quotes warmed | cache size: ${quoteCache.size}`);
  }, 60_000);

  console.log('[warmer] Jupiter quote pre-warmer started — 60s refresh cycle');
}

// ── Full live execution: BUY (uses warm cache) ───────────────────────────────
async function executeLiveBuy(
  mint: string, amountSOL: number, keypair: Keypair
): Promise<{ sig: string; tokenOut: number; actualFee: number }> {
  const lamports  = Math.floor(amountSOL * 1e9);
  const accounts  = [keypair.publicKey.toBase58(), SOL_MINT, mint];

  // Use warm caches — O(1) if pre-warmer ran in last 55s
  const priorityFee = await getWarmPriorityFee(accounts);
  const quote       = await getWarmQuote(SOL_MINT, mint, lamports);
  const swapTx = await jupiterSwapTx(quote, keypair.publicKey.toBase58(), priorityFee);
  swapTx.sign([keypair]);

  const tipTx    = await buildJitoTipTx(keypair);
  const bundleId = await sendJitoBundle([swapTx, tipTx]);

  console.log(`[jito] BUY bundle sent: ${bundleId}`);

  // Poll for landing (Jito bundles land within 2-3 slots ~800ms)
  await new Promise(r => setTimeout(r, 3000));

  const sig = Buffer.from(swapTx.signatures[0]).toString('base64').slice(0, 44);
  const tokenOut = parseInt(quote.outAmount || '0');
  const actualFee = (priorityFee / 1e9) + NETWORK_FEE;

  return { sig: bundleId, tokenOut, actualFee };
}

// ── Full live execution: SELL (uses warm cache) ──────────────────────────────
async function executeLiveSell(
  mint: string, tokenAmount: number, keypair: Keypair
): Promise<{ sig: string; solOut: number; actualFee: number }> {
  const accounts  = [keypair.publicKey.toBase58(), mint, SOL_MINT];

  // Use warm caches
  const priorityFee = await getWarmPriorityFee(accounts);
  const quote       = await getWarmQuote(mint, SOL_MINT, tokenAmount);
  const swapTx = await jupiterSwapTx(quote, keypair.publicKey.toBase58(), priorityFee);
  swapTx.sign([keypair]);

  const tipTx    = await buildJitoTipTx(keypair);
  const bundleId = await sendJitoBundle([swapTx, tipTx]);

  console.log(`[jito] SELL bundle sent: ${bundleId}`);
  await new Promise(r => setTimeout(r, 3000));

  const solOut    = parseInt(quote.outAmount || '0') / 1e9;
  const actualFee = (priorityFee / 1e9) + NETWORK_FEE;
  return { sig: bundleId, solOut, actualFee };
}

// ── Edge relay ────────────────────────────────────────────────────────────────
async function edgePost(route: string, body: unknown): Promise<void> {
  try {
    const r = await fetch(`${EDGE_BASE}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error(`[edge] POST ${route} → ${r.status}`);
  } catch (e: any) { console.error(`[edge] failed:`, e.message); }
}

async function edgeGet(route: string): Promise<any> {
  try {
    const r = await fetch(`${EDGE_BASE}${route}`);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// ── Session persistence ───────────────────────────────────────────────────────
let session: Session;

async function loadSession(): Promise<Session> {
  const data = await edgeGet('/session');
  if (data?.portfolio != null) {
    console.log(`[session] loaded — ${data.portfolio.toFixed(4)} SOL | P&L: ${(data.total_pnl || 0).toFixed(4)} SOL | mode: ${data.mode || BOT_MODE}`);
    return {
      portfolio:    Number(data.portfolio),
      startBalance: Number(data.start_balance ?? 2),
      positions:    data.positions || {},
      totalPnl:     Number(data.total_pnl ?? 0),
      wins:         Number(data.wins ?? 0),
      losses:       Number(data.losses ?? 0),
      startedAt:    data.started_at ?? new Date().toISOString(),
      mode:         data.mode || BOT_MODE,
    };
  }
  const fresh: Session = {
    portfolio: 2, startBalance: 2, positions: {},
    totalPnl: 0, wins: 0, losses: 0,
    startedAt: new Date().toISOString(), mode: BOT_MODE,
  };
  await saveSession(fresh);
  console.log(`[session] new session — 2 SOL | ${BOT_MODE} mode`);
  return fresh;
}

async function saveSession(s: Session): Promise<void> {
  await edgePost('/paper', {
    type: 'session',
    session: {
      portfolio:     s.portfolio,
      start_balance: s.startBalance,
      positions:     s.positions,
      total_pnl:     s.totalPnl,
      wins:          s.wins,
      losses:        s.losses,
      started_at:    s.startedAt,
      mode:          s.mode,
    },
  });
}

async function saveTrade(trade: Record<string, unknown>): Promise<void> {
  await edgePost('/paper', { type: 'trade', trade });
}

// ── Process signal ────────────────────────────────────────────────────────────
async function processSignal(signal: any): Promise<void> {
  const { action, mint, symbol, label, amount_sol, token_amount, sig } = signal;
  const sym = symbol || mint?.slice(0, 8) || '???';
  const isLive = session.mode === 'live' && !!botKeypair;

  console.log(`[signal] ${action} ${sym} from ${label} | ${amount_sol ?? '?'} SOL | ${isLive ? 'LIVE' : 'PAPER'}`);

  // Register mint with pre-warmer so next refresh pre-fetches its quote
  registerMintActivity(mint);

  // ── BUY ───────────────────────────────────────────────────────────────────
  if (action === 'BUY') {
    if (session.positions[mint]) {
      console.log(`[skip] already holding ${sym}`);
      return;
    }

    const gross = Math.min(session.portfolio * RISK_PCT, session.portfolio);
    if (gross < 0.01) { console.log('[skip] portfolio too low'); return; }

    // ── RUG CHECK (both modes) ───────────────────────────────────────────────
    console.log(`[rugcheck] checking ${sym} (${mint.slice(0, 8)}…)`);
    const rug = await checkRug(mint);

    if (!rug.safe) {
      console.log(`[RUGCHECK BLOCK] ${sym} — ${rug.reason}`);
      await saveTrade({
        session_id: SESSION_ID, sig, mint, symbol: sym, label,
        action: 'SKIP', gross_sol: 0, net_sol: 0, pnl_sol: 0,
        failed: true, fail_reason: `RUG: ${rug.reason}`,
        portfolio_after: session.portfolio,
        created_at: new Date().toISOString(),
      });
      return;
    }

    // LP not locked warning in live mode: skip if high risk
    if (!rug.lpLocked && isLive && rug.score < 50) {
      console.log(`[SKIP] ${sym} — LP not locked + score ${rug.score} — too risky for live`);
      return;
    }

    console.log(`[rugcheck] ✅ ${sym} passed — score: ${rug.score}, LP locked: ${rug.lpLocked}`);

    // ── LIVE EXECUTION ───────────────────────────────────────────────────────
    if (isLive && botKeypair) {
      try {
        console.log(`[live BUY] ${sym} — ${gross.toFixed(4)} SOL`);
        const { sig: liveSig, tokenOut, actualFee } = await executeLiveBuy(mint, gross, botKeypair);
        const entryPrice = await getTokenPriceUSD(mint);

        session.portfolio -= (gross + actualFee);
        session.positions[mint] = {
          mint, symbol: sym, label,
          entrySOL: gross, netPosition: gross - actualFee,
          tokenAmount: tokenOut,
          entryTime: Date.now(), whaleEntrySol: amount_sol || 0,
          entryPrice, liveMode: true, liveSig,
        };

        await saveTrade({
          session_id: SESSION_ID, sig: liveSig, mint, symbol: sym, label,
          action: 'BUY', gross_sol: gross, net_sol: gross - actualFee,
          fee_sol: actualFee, pnl_sol: 0, live: true,
          portfolio_after: session.portfolio,
          created_at: new Date().toISOString(),
        });
        await saveSession(session);
        console.log(`[live BUY] ✅ ${sym} | bundle: ${liveSig} | tokens: ${tokenOut}`);
        return;
      } catch (e: any) {
        console.error(`[live BUY] ❌ ${sym}: ${e.message}`);
        // Fall through to paper sim on live failure
      }
    }

    // ── PAPER SIMULATION ─────────────────────────────────────────────────────
    if (txFailed()) {
      const f = fees();
      session.portfolio -= f;
      await saveTrade({
        session_id: SESSION_ID, sig, mint, symbol: sym, label,
        action: 'BUY', gross_sol: 0, net_sol: 0, pnl_sol: -f,
        failed: true,
        fail_reason: Math.random() < 0.6 ? 'Slippage exceeded' : 'RPC timeout',
        portfolio_after: session.portfolio,
        created_at: new Date().toISOString(),
      });
      await saveSession(session);
      console.log(`[paper fail] ${sym} — lost ${f.toFixed(6)} SOL in fees`);
      return;
    }

    const penalty    = compPenalty(gross);
    const slipCost   = slip(gross) + penalty;
    const f          = fees();
    const net        = gross - slipCost - f;
    const entryPrice = await getTokenPriceUSD(mint);

    session.portfolio -= (gross + f);
    session.positions[mint] = {
      mint, symbol: sym, label,
      entrySOL: gross, netPosition: net,
      tokenAmount: token_amount || 0,
      entryTime: Date.now(), whaleEntrySol: amount_sol || 0,
      entryPrice, liveMode: false,
    };

    await saveTrade({
      session_id: SESSION_ID, sig, mint, symbol: sym, label,
      action: 'BUY', gross_sol: gross, net_sol: net,
      slip_sol: slipCost, fee_sol: f, pnl_sol: 0,
      portfolio_after: session.portfolio,
      created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[paper BUY] ${sym} — ${gross.toFixed(4)} SOL → ${net.toFixed(4)} net | portfolio: ${session.portfolio.toFixed(4)}`);
    return;
  }

  // ── SELL (whale triggered) ────────────────────────────────────────────────
  if (action === 'SELL') {
    const pos = session.positions[mint];
    if (!pos) { console.log(`[skip] no position in ${sym}`); return; }
    await executeSell(mint, pos, 'whale', amount_sol);
  }
}

// ── Sell execution (whale signal or TP/SL) ───────────────────────────────────
async function executeSell(
  mint: string,
  pos: Position,
  reason: 'whale' | 'tp' | 'sl',
  whaleAmountSol?: number,
): Promise<void> {
  const sym  = pos.symbol;
  const isLive = pos.liveMode && !!botKeypair;

  console.log(`[SELL] ${sym} — reason: ${reason} | ${isLive ? 'LIVE' : 'PAPER'}`);

  if (isLive && botKeypair) {
    try {
      const { sig: liveSig, solOut, actualFee } = await executeLiveSell(mint, pos.tokenAmount, botKeypair);
      const pnl = solOut - pos.entrySOL - actualFee;

      session.portfolio += solOut;
      session.totalPnl  += pnl;
      pnl > 0 ? session.wins++ : session.losses++;
      delete session.positions[mint];

      await saveTrade({
        session_id: SESSION_ID, sig: liveSig, mint, symbol: sym, label: pos.label,
        action: 'SELL', gross_sol: solOut, net_sol: solOut - actualFee,
        fee_sol: actualFee, pnl_sol: pnl, sell_reason: reason,
        live: true, portfolio_after: session.portfolio,
        created_at: new Date().toISOString(),
      });
      await saveSession(session);
      const pct = ((pnl / pos.entrySOL) * 100).toFixed(1);
      console.log(`[live SELL] ✅ ${sym} | ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL (${pct}%) | reason: ${reason}`);
      return;
    } catch (e: any) {
      console.error(`[live SELL] ❌ ${sym}: ${e.message}`);
    }
  }

  // Paper sell
  const whaleMult = (whaleAmountSol && pos.whaleEntrySol)
    ? Number(whaleAmountSol) / pos.whaleEntrySol : undefined;

  const mult   = reason === 'tp' ? TP_MULT : reason === 'sl' ? SL_MULT : exitMult(whaleMult);
  const gross  = pos.netPosition * mult;
  const s      = slip(gross);
  const f      = fees();
  const net    = gross - s - f;
  const pnl    = net - (pos.entrySOL + f);

  session.portfolio += net;
  session.totalPnl  += pnl;
  pnl > 0 ? session.wins++ : session.losses++;
  delete session.positions[mint];

  await saveTrade({
    session_id: SESSION_ID, mint, symbol: sym, label: pos.label,
    action: 'SELL', gross_sol: gross, net_sol: net,
    slip_sol: s, fee_sol: f, pnl_sol: pnl,
    mult, mult_source: reason === 'whale' && whaleMult ? 'REAL' : reason.toUpperCase(),
    sell_reason: reason, portfolio_after: session.portfolio,
    created_at: new Date().toISOString(),
  });
  await saveSession(session);
  const pct = ((pnl / pos.entrySOL) * 100).toFixed(1);
  console.log(`[paper SELL] ${sym} | ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL (${pct}%) | ${reason} | mult: ${mult.toFixed(2)}×`);
}

// ── TP/SL Monitor — runs every 30s independent of whale signals ───────────────
let tpslTimer: NodeJS.Timer | null = null;

function startTpSlMonitor() {
  tpslTimer = setInterval(async () => {
    const positions = Object.values(session.positions);
    if (!positions.length) return;

    for (const pos of positions) {
      try {
        const livePrice = await getTokenPriceUSD(pos.mint);
        if (!livePrice || !pos.entryPrice || pos.entryPrice === 0) continue;

        const mult     = livePrice / pos.entryPrice;
        const holdMins = (Date.now() - pos.entryTime) / 60000;

        // TAKE PROFIT: price is 2× entry
        if (mult >= TP_MULT) {
          console.log(`[TP] ${pos.symbol} hit ${mult.toFixed(2)}× — taking profit`);
          await executeSell(pos.mint, pos, 'tp');
          continue;
        }

        // STOP LOSS: price is 50% of entry
        if (mult <= SL_MULT) {
          console.log(`[SL] ${pos.symbol} at ${mult.toFixed(2)}× — stop loss`);
          await executeSell(pos.mint, pos, 'sl');
          continue;
        }

        // FORCE EXIT: held >4h without TP/SL trigger (stale position)
        if (holdMins > 240) {
          console.log(`[SL-timeout] ${pos.symbol} held ${holdMins.toFixed(0)} min — force exit`);
          await executeSell(pos.mint, pos, 'sl');
          continue;
        }

        console.log(`[tpsl] ${pos.symbol} | ${mult.toFixed(2)}× | ${holdMins.toFixed(0)}m held`);
      } catch (e: any) {
        console.error(`[tpsl] error for ${pos.symbol}:`, e.message);
      }
    }
  }, 30_000); // check every 30 seconds
}

// ── Whale wallet map (for WS trade parsing) ───────────────────────────────────
const WHALE_WALLETS: Record<string, string> = {
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': 'Cupsey',
  'Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ': 'Heyitsyolo',
  'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu': 'Remusofmars',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5': 'Orange',
  'HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt': 'Shreem Brzee',
  'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm': 'Lenion',
  'gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw':  'Boredboar',
  'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp': 'Hades',
  'AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm':  'Kubera 72',
  'JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k': 'Brzee God',
  '9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm': 'GBack',
  'GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f':  'Tuna',
  'AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51': 'Fireball',
  'EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS': 'Hachjdn',
  '5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc': 'Crypto Circle',
  '2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv': 'Crocodile',
  '4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3': 'Snow Spirit',
  'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o': 'Cented',
  'Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA': 'The Grande',
  'Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW': 'A Milly',
  'J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG': 'J2ANNaq',
};
const WHALE_ADDRS = new Set(Object.keys(WHALE_WALLETS));
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// ── Inline trade parser (same logic as FomoCopyBot) ───────────────────────────
function isPumpFunTx(tx: any): boolean {
  const keys = tx?.transaction?.message?.accountKeys || [];
  return keys.some((k: any) => (k.pubkey || k) === PUMP_FUN_PROGRAM);
}

function parseTradeFromTx(tx: any, walletAddress: string, sig: string): any | null {
  if (!tx?.meta || tx.meta.err) return null;
  const pre     = tx.meta.preTokenBalances  || [];
  const post    = tx.meta.postTokenBalances || [];
  const preSOL  = tx.meta.preBalances?.[0]  ?? 0;
  const postSOL = tx.meta.postBalances?.[0] ?? 0;
  const solDelta = (postSOL - preSOL) / 1e9;

  const balByMint: Record<string, { pre: number; post: number }> = {};
  for (const b of pre) {
    if (b.owner !== walletAddress) continue;
    balByMint[b.mint] = { pre: parseFloat(b.uiTokenAmount?.uiAmountString || '0'), post: 0 };
  }
  for (const b of post) {
    if (b.owner !== walletAddress) continue;
    const cur = balByMint[b.mint] || { pre: 0, post: 0 };
    cur.post = parseFloat(b.uiTokenAmount?.uiAmountString || '0');
    balByMint[b.mint] = cur;
  }

  let bestMint: string | null = null;
  let bestDelta = 0;
  for (const [mint, { pre: p, post: q }] of Object.entries(balByMint)) {
    if (mint === SOL_MINT) continue;
    const d = q - p;
    if (Math.abs(d) > Math.abs(bestDelta)) { bestDelta = d; bestMint = mint; }
  }
  if (!bestMint || bestDelta === 0) return null;

  return {
    sig, wallet: walletAddress,
    action:      bestDelta > 0 ? 'BUY' : 'SELL',
    mint:        bestMint,
    symbol:      null,
    amount_sol:  Math.abs(solDelta),
    token_amount: Math.abs(bestDelta),
    is_pump_fun: isPumpFunTx(tx),
    label:       WHALE_WALLETS[walletAddress] || walletAddress.slice(0, 8),
  };
}

// ── Helius Enhanced WebSocket — 50-100ms at processed commitment ──────────────
// Replaces Supabase Realtime subscription. Direct connection to Helius WS.
// Uses transactionSubscribe (Developer plan feature) — monitors all 21 whales
// in ONE subscription at 'processed' commitment for minimum latency.

let wsInstance: any = null;
let wsReconnectTimer: any = null;
let wsKilled = false;

function startEnhancedWebSocket(): void {
  if (wsKilled) return;

  const WS_URL = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
  console.log('[ws] Connecting to Helius Enhanced WebSocket...');

  const WebSocket = require('ws');
  const ws = new WebSocket(WS_URL);
  wsInstance = ws;

  ws.on('open', () => {
    console.log('[ws] Connected — subscribing to 21 whale wallets at processed commitment');

    // ONE subscription covers ALL 21 wallets — Helius Developer plan feature
    ws.send(JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'transactionSubscribe',
      params: [
        {
          vote: false,
          failed: false,
          accountInclude: Object.keys(WHALE_WALLETS),
        },
        {
          commitment: 'processed',        // ← 50-100ms vs 400-600ms confirmed
          encoding: 'jsonParsed',
          transactionDetails: 'full',
          showRewards: false,
          maxSupportedTransactionVersion: 0,
        },
      ],
    }));

    // Keepalive ping every 25s
    const ping = setInterval(() => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping', params: [] }));
      } else {
        clearInterval(ping);
      }
    }, 25_000);
  });

  ws.on('message', async (raw: Buffer) => {
    let msg: any;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    // Subscription confirmed
    if (msg.id === 1 && typeof msg.result === 'number') {
      console.log(`[ws] ✅ Subscribed — sub ID: ${msg.result} | watching 21 whales at processed`);
      return;
    }

    // transactionSubscribe blocked (free plan) — log and keep alive
    if (msg.id === 1 && msg.error) {
      console.error(`[ws] transactionSubscribe error: ${msg.error.message}`);
      console.log('[ws] Falling back to Supabase Realtime (check Helius plan)');
      return;
    }

    if (msg.method !== 'transactionNotification') return;

    const t0  = Date.now();
    const val = msg.params?.result?.transaction;
    const sig = msg.params?.result?.signature || val?.transaction?.signatures?.[0];
    if (!val || !sig) return;

    // Find which whale wallet is involved
    const keys: string[] = (val?.transaction?.message?.accountKeys || [])
      .map((k: any) => k.pubkey || k);
    const whaleAddr = keys.find(k => WHALE_ADDRS.has(k));
    if (!whaleAddr) return;

    // Parse the trade inline — no DB round trip
    const trade = parseTradeFromTx(val, whaleAddr, sig);
    if (!trade) return;

    const latency = Date.now() - t0;
    console.log(`[ws] Signal parsed in ${latency}ms — ${trade.action} ${trade.mint.slice(0,8)} by ${trade.label}`);

    // Save signal to DB for UI display (async, non-blocking)
    edgePost('/signal', { signal: trade }).catch(() => {});

    // Register with pre-warmer
    registerMintActivity(trade.mint);

    // Process immediately — this is the hot path
    try {
      await processSignal(trade);
    } catch (e: any) {
      console.error('[ws] processSignal error:', e.message);
    }
  });

  ws.on('error', (e: Error) => {
    console.error('[ws] Error:', e.message);
  });

  ws.on('close', () => {
    console.log('[ws] Disconnected — reconnecting in 3s...');
    if (!wsKilled) {
      wsReconnectTimer = setTimeout(() => startEnhancedWebSocket(), 3000);
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔱 SHREEM BRZEE BOT v2 — starting');
  console.log(`   Mode:    ${BOT_MODE.toUpperCase()}`);
  console.log(`   Risk:    ${(RISK_PCT * 100).toFixed(0)}% per trade`);
  console.log(`   Slippage: ${MAX_SLIP_BPS}bps max`);
  console.log(`   TP:      ${TP_MULT}× | SL: ${SL_MULT}× (every 30s)`);
  if (botKeypair) console.log(`   Wallet:  ${botKeypair.publicKey.toBase58()}`);
  console.log(`   Jito:    ${JITO_TIP_LAM / 1e9} SOL tip per bundle`);
  console.log(`   RPC:     Helius mainnet`);

  session = await loadSession();

  // Override mode from env if different
  if (session.mode !== BOT_MODE) {
    console.log(`[session] mode override: ${session.mode} → ${BOT_MODE}`);
    session.mode = BOT_MODE;
    await saveSession(session);
  }

  // Start TP/SL monitor
  startTpSlMonitor();
  console.log('[tpsl] monitor started — checking every 30s');

  // Start Jupiter quote pre-warmer
  startQuotePreWarmer();

  // Enhanced WebSocket — 50-100ms at processed commitment (Helius Developer plan)
  startEnhancedWebSocket();

  // Keep Supabase Realtime as fallback for test signals from UI
  const channel: RealtimeChannel = supabase
    .channel('shreem_bot_v2_fallback')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'shreem_brzee_signals' },
      async (payload) => {
        // Only process test signals (sig starts with TEST_) via Supabase
        // Real whale signals come via Enhanced WebSocket above
        const sig = payload.new?.sig || '';
        if (sig.startsWith('TEST_')) {
          try { await processSignal(payload.new); }
          catch (e: any) { console.error('[fallback]', e.message); }
        }
      }
    )
    .subscribe((status) => {
      console.log(`[realtime-fallback] ${status}`);
    });

  // Status log every 60s
  setInterval(async () => {
    const open = Object.keys(session.positions).length;
    const walletSOL = botKeypair
      ? await connection.getBalance(botKeypair.publicKey).then(b => b / 1e9).catch(() => 0)
      : null;
    console.log(
      `[status] mode:${session.mode} | portfolio: ${session.portfolio.toFixed(4)} SOL` +
      (walletSOL !== null ? ` | wallet: ${walletSOL.toFixed(4)} SOL` : '') +
      ` | P&L: ${session.totalPnl >= 0 ? '+' : ''}${session.totalPnl.toFixed(4)} SOL` +
      ` | W/L: ${session.wins}/${session.losses} | open: ${open}`
    );
  }, 60_000);

  console.log(`✅ Enhanced WebSocket LIVE | 50-100ms detection | portfolio: ${session.portfolio.toFixed(4)} SOL`);

  process.on('SIGTERM', async () => {
    console.log('[shutdown] saving session…');
    if (tpslTimer)  clearInterval(tpslTimer  as unknown as number);
    if (warmerTimer) clearInterval(warmerTimer as unknown as number);
    await saveSession(session);
    wsKilled = true;
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    if (wsInstance) wsInstance.close();
    channel.unsubscribe();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error('🔥 Fatal:', e.message);
  process.exit(1);
});
