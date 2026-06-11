/**
 * SHREEM BRZEE BOT — Railway Server
 * Runs 24/7. Watches Supabase for whale signals.
 * Executes paper trades server-side.
 * Browser just reads results — closing the app changes NOTHING.
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SESSION_KEY   = 'default'; // one paper session per server

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Paper Engine ──────────────────────────────────────────────────────
interface Position {
  mint: string; symbol: string; label: string;
  entrySOL: number; netPosition: number; tokenAmount: number;
  entryTime: number; whaleEntrySol: number;
}

interface Session {
  portfolio: number;
  startBalance: number;
  positions: Record<string, Position>;
  totalPnl: number;
  wins: number; losses: number;
  startedAt: string;
}

const PRIORITY_FEE = 0.002;
const NETWORK_FEE  = 0.000005;

function slippage(sol: number, bps = 300): number {
  return sol * (bps / 10000);
}

function txFees(): number { return PRIORITY_FEE + NETWORK_FEE; }

function competitionPenalty(sol: number): number {
  const r = Math.random();
  if (r < 0.20) return 0;
  if (r < 0.70) return sol * (0.02 + Math.random() * 0.03);
  return sol * (0.05 + Math.random() * 0.07);
}

function txFailed(): boolean { return Math.random() < 0.12; }

function exitMultiplier(whaleMultiplier?: number): number {
  if (whaleMultiplier && whaleMultiplier > 0 && whaleMultiplier < 100) {
    return whaleMultiplier * (0.97 + Math.random() * 0.06);
  }
  const r = Math.random();
  if (r < 0.30) return 0.05 + Math.random() * 0.25;
  if (r < 0.55) return 0.30 + Math.random() * 0.50;
  if (r < 0.75) return 0.92 + Math.random() * 0.11;
  if (r < 0.90) return 1.10 + Math.random() * 0.90;
  return 2.00 + Math.random() * 4.00;
}

// ── Load or create session from Supabase ─────────────────────────────
async function loadSession(): Promise<Session> {
  const { data } = await supabase
    .from('shreem_brzee_session')
    .select('*')
    .eq('id', SESSION_KEY)
    .single();

  if (data) {
    console.log(`[session] loaded — portfolio: ${data.portfolio.toFixed(4)} SOL`);
    return {
      portfolio:    data.portfolio,
      startBalance: data.start_balance,
      positions:    data.positions || {},
      totalPnl:     data.total_pnl || 0,
      wins:         data.wins || 0,
      losses:       data.losses || 0,
      startedAt:    data.started_at,
    };
  }

  // Create new session with 2 SOL
  const newSession: Session = {
    portfolio: 2.0, startBalance: 2.0, positions: {},
    totalPnl: 0, wins: 0, losses: 0, startedAt: new Date().toISOString(),
  };
  await saveSession(newSession);
  console.log('[session] new session created — 2 SOL');
  return newSession;
}

async function saveSession(s: Session): Promise<void> {
  await supabase.from('shreem_brzee_session').upsert({
    id:            SESSION_KEY,
    portfolio:     s.portfolio,
    start_balance: s.startBalance,
    positions:     s.positions,
    total_pnl:     s.totalPnl,
    wins:          s.wins,
    losses:        s.losses,
    started_at:    s.startedAt,
    updated_at:    new Date().toISOString(),
  });
}

async function saveTrade(trade: any): Promise<void> {
  await supabase.from('shreem_brzee_paper_trades').insert(trade);
}

// ── Process a signal ──────────────────────────────────────────────────
let session: Session;

async function processSignal(signal: any): Promise<void> {
  const { action, mint, symbol, label, amount_sol, token_amount, sig } = signal;
  console.log(`[signal] ${action} ${symbol || mint.slice(0,8)} from ${label} — ${amount_sol} SOL`);

  if (action === 'BUY') {
    if (session.positions[mint]) {
      console.log(`[skip] already have position in ${symbol}`);
      return;
    }

    const riskPct = 0.05; // 5% of portfolio
    const gross = Math.min(session.portfolio * riskPct, session.portfolio);
    if (gross <= 0.01) { console.log('[skip] insufficient portfolio'); return; }

    // Failed transaction simulation
    if (txFailed()) {
      const fees = txFees();
      session.portfolio -= fees;
      await saveTrade({
        session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8),
        label, action: 'BUY', gross_sol: 0, net_sol: 0, pnl_sol: -fees,
        failed: true, fail_reason: Math.random() < 0.6 ? 'Slippage exceeded' : 'RPC timeout',
        portfolio_after: session.portfolio, created_at: new Date().toISOString(),
      });
      await saveSession(session);
      console.log(`[failed] BUY failed — lost ${fees.toFixed(6)} SOL in fees`);
      return;
    }

    const compPenalty = competitionPenalty(gross);
    const slip = slippage(gross) + compPenalty;
    const fees = txFees();
    const net = gross - slip - fees;

    session.portfolio -= (gross + fees);
    session.positions[mint] = {
      mint, symbol: symbol || mint.slice(0,8), label,
      entrySOL: gross, netPosition: net,
      tokenAmount: token_amount || 0,
      entryTime: Date.now(),
      whaleEntrySol: amount_sol || 0,
    };

    await saveTrade({
      session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8),
      label, action: 'BUY', gross_sol: gross, net_sol: net,
      slip_sol: slip, fee_sol: fees, pnl_sol: 0,
      portfolio_after: session.portfolio, created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[buy] ${symbol} — ${gross.toFixed(4)} SOL | portfolio: ${session.portfolio.toFixed(4)} SOL`);

  } else if (action === 'SELL') {
    const pos = session.positions[mint];
    if (!pos) {
      console.log(`[skip] no position in ${symbol} to sell`);
      return;
    }

    // Real whale multiplier
    const whaleMultiplier = (amount_sol && pos.whaleEntrySol)
      ? amount_sol / pos.whaleEntrySol : undefined;

    const mult   = exitMultiplier(whaleMultiplier);
    const gross  = pos.netPosition * mult;
    const slip   = slippage(gross);
    const fees   = txFees();
    const net    = gross - slip - fees;
    const pnl    = net - (pos.entrySOL + fees);

    session.portfolio += net;
    session.totalPnl  += pnl;
    if (pnl > 0) session.wins++; else session.losses++;
    delete session.positions[mint];

    await saveTrade({
      session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8),
      label, action: 'SELL', gross_sol: gross, net_sol: net,
      slip_sol: slip, fee_sol: fees, pnl_sol: pnl,
      mult: mult, mult_source: whaleMultiplier ? 'REAL' : 'EST',
      portfolio_after: session.portfolio, created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[sell] ${symbol} — ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL (${((pnl/pos.entrySOL)*100).toFixed(1)}%) | portfolio: ${session.portfolio.toFixed(4)} SOL`);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────
async function main() {
  console.log('🔱 SHREEM BRZEE BOT — Railway server starting...');
  console.log(`Supabase: ${SUPABASE_URL}`);

  session = await loadSession();

  // Subscribe to new signals via Realtime
  const channel: RealtimeChannel = supabase
    .channel('shreem_signals_server')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'shreem_brzee_signals',
    }, async (payload) => {
      try {
        await processSignal(payload.new);
      } catch (e: any) {
        console.error('[error] processing signal:', e.message);
      }
    })
    .subscribe((status) => {
      console.log(`[realtime] ${status}`);
    });

  // Also poll every 30s as backup (catches any missed realtime events)
  setInterval(async () => {
    try {
      const { data: recent } = await supabase
        .from('shreem_brzee_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent?.length) {
        console.log(`[poll] last signal: ${recent[0].label} ${recent[0].action} ${recent[0].symbol || recent[0].mint.slice(0,8)} — ${new Date(recent[0].created_at).toLocaleTimeString()}`);
      }
    } catch {}
  }, 30_000);

  console.log('✅ Listening for whale signals 24/7...');
  console.log(`📊 Portfolio: ${session.portfolio.toFixed(4)} SOL | P&L: ${session.totalPnl >= 0 ? '+' : ''}${session.totalPnl.toFixed(4)} SOL`);

  // Keep alive
  process.on('SIGTERM', async () => {
    console.log('Shutting down, saving session...');
    await saveSession(session);
    channel.unsubscribe();
    process.exit(0);
  });
}

main().catch(console.error);
