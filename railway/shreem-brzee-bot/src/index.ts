/**
 * SHREEM BRZEE BOT — Hetzner Server v2
 * Writes via edge function (no direct Supabase access needed).
 * Edge fn URL: https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook
 */

import { RealtimeChannel, createClient } from '@supabase/supabase-js';

// Edge function relay — no service role key needed on this server
const EDGE_URL = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const SUPA_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';

// Use anon key for realtime subscription only (public read is allowed)
const supabase = createClient(SUPA_URL, ANON_KEY);

const SESSION_KEY = 'default';

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

const PRIORITY_FEE = 0.002;
const NETWORK_FEE  = 0.000005;

function slippage(sol: number, bps = 300) { return sol * (bps / 10000); }
function txFees() { return PRIORITY_FEE + NETWORK_FEE; }
function competitionPenalty(sol: number) {
  const r = Math.random();
  if (r < 0.20) return 0;
  if (r < 0.70) return sol * (0.02 + Math.random() * 0.03);
  return sol * (0.05 + Math.random() * 0.07);
}
function txFailed() { return Math.random() < 0.12; }
function exitMultiplier(whaleMultiplier?: number) {
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

// Write via edge function relay (no service role key needed)
async function edgePost(path: string, body: any): Promise<void> {
  try {
    await fetch(`${EDGE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    console.error(`[edge] POST ${path} failed:`, e.message);
  }
}

async function edgeGet(path: string): Promise<any> {
  try {
    const r = await fetch(`${EDGE_URL}${path}`);
    return await r.json();
  } catch { return null; }
}

async function loadSession(): Promise<Session> {
  const data = await edgeGet('/session');
  if (data) {
    console.log(`[session] loaded — portfolio: ${data.portfolio.toFixed(4)} SOL`);
    return {
      portfolio: data.portfolio, startBalance: data.start_balance,
      positions: data.positions || {}, totalPnl: data.total_pnl || 0,
      wins: data.wins || 0, losses: data.losses || 0, startedAt: data.started_at,
    };
  }
  const newSession: Session = {
    portfolio: 2.0, startBalance: 2.0, positions: {},
    totalPnl: 0, wins: 0, losses: 0, startedAt: new Date().toISOString(),
  };
  await saveSession(newSession);
  console.log('[session] new session created — 2 SOL');
  return newSession;
}

async function saveSession(s: Session): Promise<void> {
  await edgePost('/paper', {
    type: 'session',
    session: {
      portfolio: s.portfolio, start_balance: s.startBalance, positions: s.positions,
      total_pnl: s.totalPnl, wins: s.wins, losses: s.losses, started_at: s.startedAt,
    },
  });
}

async function saveTrade(trade: any): Promise<void> {
  await edgePost('/paper', { type: 'trade', trade });
}

let session: Session;

async function processSignal(signal: any): Promise<void> {
  const { action, mint, symbol, label, amount_sol, token_amount, sig } = signal;
  console.log(`[signal] ${action} ${symbol || mint.slice(0,8)} from ${label} — ${amount_sol} SOL`);

  if (action === 'BUY') {
    if (session.positions[mint]) { console.log(`[skip] already in ${symbol}`); return; }

    const gross = Math.min(session.portfolio * 0.05, session.portfolio);
    if (gross <= 0.01) { console.log('[skip] insufficient portfolio'); return; }

    if (txFailed()) {
      const fees = txFees();
      session.portfolio -= fees;
      await saveTrade({
        session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8), label,
        action: 'BUY', gross_sol: 0, net_sol: 0, pnl_sol: -fees,
        failed: true, fail_reason: Math.random() < 0.6 ? 'Slippage exceeded' : 'RPC timeout',
        portfolio_after: session.portfolio, created_at: new Date().toISOString(),
      });
      await saveSession(session);
      console.log(`[failed] lost ${fees.toFixed(6)} SOL in fees`);
      return;
    }

    const slip = slippage(gross) + competitionPenalty(gross);
    const fees = txFees();
    const net = gross - slip - fees;
    session.portfolio -= (gross + fees);
    session.positions[mint] = {
      mint, symbol: symbol || mint.slice(0,8), label, entrySOL: gross, netPosition: net,
      tokenAmount: token_amount || 0, entryTime: Date.now(), whaleEntrySol: amount_sol || 0,
    };
    await saveTrade({
      session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8), label,
      action: 'BUY', gross_sol: gross, net_sol: net, slip_sol: slip, fee_sol: fees, pnl_sol: 0,
      portfolio_after: session.portfolio, created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[buy] ${symbol} — ${gross.toFixed(4)} SOL | portfolio: ${session.portfolio.toFixed(4)} SOL`);

  } else if (action === 'SELL') {
    const pos = session.positions[mint];
    if (!pos) { console.log(`[skip] no position in ${symbol}`); return; }

    const whaleMultiplier = (amount_sol && pos.whaleEntrySol) ? amount_sol / pos.whaleEntrySol : undefined;
    const mult  = exitMultiplier(whaleMultiplier);
    const gross = pos.netPosition * mult;
    const slip  = slippage(gross);
    const fees  = txFees();
    const net   = gross - slip - fees;
    const pnl   = net - (pos.entrySOL + fees);

    session.portfolio += net;
    session.totalPnl  += pnl;
    if (pnl > 0) session.wins++; else session.losses++;
    delete session.positions[mint];

    await saveTrade({
      session_id: SESSION_KEY, sig, mint, symbol: symbol || mint.slice(0,8), label,
      action: 'SELL', gross_sol: gross, net_sol: net, slip_sol: slip, fee_sol: fees, pnl_sol: pnl,
      mult, mult_source: whaleMultiplier ? 'REAL' : 'EST',
      portfolio_after: session.portfolio, created_at: new Date().toISOString(),
    });
    await saveSession(session);
    console.log(`[sell] ${symbol} — ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | portfolio: ${session.portfolio.toFixed(4)} SOL`);
  }
}

async function main() {
  console.log('🔱 SHREEM BRZEE BOT — Hetzner v2 starting...');
  console.log(`Edge relay: ${EDGE_URL}`);

  session = await loadSession();

  // Subscribe via Realtime (anon key, public_read policy allows it)
  const channel: RealtimeChannel = supabase
    .channel('shreem_signals_server')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shreem_brzee_signals' },
      async (payload) => {
        try { await processSignal(payload.new); }
        catch (e: any) { console.error('[error]', e.message); }
      })
    .subscribe((status) => console.log(`[realtime] ${status}`));

  // Poll every 30s as backup
  setInterval(async () => {
    const data = await edgeGet('/session');
    if (data) console.log(`[poll] portfolio: ${(data.portfolio || 0).toFixed(4)} SOL | P&L: ${(data.total_pnl || 0).toFixed(4)} SOL | positions: ${Object.keys(data.positions || {}).length}`);
  }, 30_000);

  console.log(`✅ Live — Portfolio: ${session.portfolio.toFixed(4)} SOL | P&L: ${session.totalPnl.toFixed(4)} SOL`);

  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await saveSession(session);
    channel.unsubscribe();
    process.exit(0);
  });
}

main().catch(console.error);
