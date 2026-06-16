/**
 * SHREEM BRZEE BOT — Hetzner Server (Final)
 * Writes via edge function relay — no service role key needed.
 * Reads realtime signals from ssygukfdbtehvtndandn via anon key (public_read policy).
 */
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const EDGE_BASE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const SUPA_URL  = 'https://ssygukfdbtehvtndandn.supabase.co';
const ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';

// Anon client — for Realtime subscription only (public read policy)
const supabase = createClient(SUPA_URL, ANON_KEY);

// ── Paper trading engine constants ────────────────────────────────────────────
const PRIORITY_FEE    = 0.002;
const NETWORK_FEE     = 0.000005;
const RISK_PCT        = 0.05;    // 5% per trade
const SLIPPAGE_BPS    = 300;     // 3%
const TX_FAIL_RATE    = 0.12;    // 12% of trades fail
const SESSION_ID      = 'default';

interface Position {
  mint: string; symbol: string; label: string;
  entrySOL: number; netPosition: number; tokenAmount: number;
  entryTime: number; whaleEntrySol: number;
}
interface Session {
  portfolio: number; startBalance: number;
  positions: Record<string, Position>;
  totalPnl: number; wins: number; losses: number; startedAt: string;
}

// ── Simulation helpers ────────────────────────────────────────────────────────
const slip        = (sol: number) => sol * (SLIPPAGE_BPS / 10_000);
const fees        = ()            => PRIORITY_FEE + NETWORK_FEE;
const txFailed    = ()            => Math.random() < TX_FAIL_RATE;
const compPenalty = (sol: number) => {
  const r = Math.random();
  if (r < 0.20) return 0;
  if (r < 0.70) return sol * (0.02 + Math.random() * 0.03);
  return sol * (0.05 + Math.random() * 0.07);
};
const exitMult = (whaleMult?: number) => {
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

// ── Edge function relay ───────────────────────────────────────────────────────
async function edgePost(route: string, body: unknown): Promise<void> {
  try {
    const r = await fetch(`${EDGE_BASE}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error(`[edge] POST ${route} → ${r.status}`);
  } catch (e: any) {
    console.error(`[edge] POST ${route} failed:`, e.message);
  }
}

async function edgeGet(route: string): Promise<any> {
  try {
    const r = await fetch(`${EDGE_BASE}${route}`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ── Session persistence via edge fn ──────────────────────────────────────────
async function loadSession(): Promise<Session> {
  const data = await edgeGet('/session');
  if (data && data.portfolio != null) {
    console.log(`[session] loaded — ${data.portfolio.toFixed(4)} SOL | P&L: ${(data.total_pnl || 0).toFixed(4)} SOL`);
    return {
      portfolio:    Number(data.portfolio),
      startBalance: Number(data.start_balance ?? 2),
      positions:    data.positions || {},
      totalPnl:     Number(data.total_pnl ?? 0),
      wins:         Number(data.wins ?? 0),
      losses:       Number(data.losses ?? 0),
      startedAt:    data.started_at ?? new Date().toISOString(),
    };
  }
  const fresh: Session = {
    portfolio: 2, startBalance: 2, positions: {},
    totalPnl: 0, wins: 0, losses: 0, startedAt: new Date().toISOString(),
  };
  await saveSession(fresh);
  console.log('[session] new session — 2 SOL');
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
    },
  });
}

async function saveTrade(trade: Record<string, unknown>): Promise<void> {
  await edgePost('/paper', { type: 'trade', trade });
}

// ── Signal processing ─────────────────────────────────────────────────────────
let session: Session;

async function processSignal(signal: any): Promise<void> {
  const { action, mint, symbol, label, amount_sol, token_amount, sig } = signal;
  const sym = symbol || mint.slice(0, 8);
  console.log(`[signal] ${action} ${sym} from ${label} — ${amount_sol ?? '?'} SOL`);

  // ── BUY ───────────────────────────────────────────────────────────
  if (action === 'BUY') {
    if (session.positions[mint]) {
      console.log(`[skip] already holding ${sym}`);
      return;
    }

    const gross = Math.min(session.portfolio * RISK_PCT, session.portfolio);
    if (gross < 0.01) { console.log('[skip] portfolio too low'); return; }

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
      console.log(`[failed] tx failed — lost ${f.toFixed(6)} SOL in fees`);
      return;
    }

    const penalty = compPenalty(gross);
    const s       = slip(gross) + penalty;
    const f       = fees();
    const net     = gross - s - f;

    session.portfolio -= (gross + f);
    session.positions[mint] = {
      mint, symbol: sym, label,
      entrySOL:      gross,
      netPosition:   net,
      tokenAmount:   token_amount || 0,
      entryTime:     Date.now(),
      whaleEntrySol: amount_sol || 0,
    };

    await saveTrade({
      session_id: SESSION_ID, sig, mint, symbol: sym, label,
      action: 'BUY', gross_sol: gross, net_sol: net,
      slip_sol: s, fee_sol: f, pnl_sol: 0,
      portfolio_after: session.portfolio,
      created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[buy] ${sym} — ${gross.toFixed(4)} SOL | portfolio: ${session.portfolio.toFixed(4)} SOL`);
    return;
  }

  // ── SELL ──────────────────────────────────────────────────────────
  if (action === 'SELL') {
    const pos = session.positions[mint];
    if (!pos) { console.log(`[skip] no position in ${sym}`); return; }

    const whaleMult = (amount_sol && pos.whaleEntrySol)
      ? Number(amount_sol) / pos.whaleEntrySol
      : undefined;

    const mult   = exitMult(whaleMult);
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
      session_id: SESSION_ID, sig, mint, symbol: sym, label,
      action: 'SELL', gross_sol: gross, net_sol: net,
      slip_sol: s, fee_sol: f, pnl_sol: pnl,
      mult, mult_source: whaleMult ? 'REAL' : 'EST',
      portfolio_after: session.portfolio,
      created_at: new Date().toISOString(),
    });
    await saveSession(session);
    const pct = ((pnl / pos.entrySOL) * 100).toFixed(1);
    console.log(`[sell] ${sym} — ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL (${pct}%) | portfolio: ${session.portfolio.toFixed(4)} SOL`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔱 SHREEM BRZEE BOT — Hetzner starting...');
  console.log(`   Supabase:  ${SUPA_URL}`);
  console.log(`   Edge relay: ${EDGE_BASE}`);

  session = await loadSession();

  // Realtime subscription (anon key — public_read policy)
  const channel: RealtimeChannel = supabase
    .channel('shreem_bot_server')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'shreem_brzee_signals' },
      async (payload) => {
        try {
          await processSignal(payload.new);
        } catch (e: any) {
          console.error('[error] processSignal:', e.message);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[realtime] ${status}`);
    });

  // Status poll every 60s
  setInterval(async () => {
    const openCount = Object.keys(session.positions).length;
    console.log(
      `[status] portfolio: ${session.portfolio.toFixed(4)} SOL | ` +
      `P&L: ${session.totalPnl >= 0 ? '+' : ''}${session.totalPnl.toFixed(4)} SOL | ` +
      `W/L: ${session.wins}/${session.losses} | open: ${openCount}`
    );
  }, 60_000);

  console.log(`✅ Listening — portfolio: ${session.portfolio.toFixed(4)} SOL | P&L: ${session.totalPnl.toFixed(4)} SOL`);

  process.on('SIGTERM', async () => {
    console.log('[shutdown] saving session...');
    await saveSession(session);
    channel.unsubscribe();
    process.exit(0);
  });
}

main().catch(console.error);
