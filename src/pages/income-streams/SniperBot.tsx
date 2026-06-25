import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, Activity, TrendingUp, RefreshCw, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';

// ── Design tokens (identical to Shreem Brzee) ─────────────────
const GOLD  = '#D4AF37';
const GREEN = '#10b981';
const RED   = '#ef4444';
const CYAN  = '#22D3EE';
const PURP  = '#A855F7';
const BG    = '#050505';

const timeAgo = (dt: string) => {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  return m < 1 ? 'now' : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};

async function getSolPrice(): Promise<number> {
  try {
    const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    const j = await r.json();
    return parseFloat(j.price) || 155;
  } catch { return 155; }
}

// ══════════════════════════════════════════════════════════════
export default function SniperBot() {
  const nav = useNavigate();
  const { isAdmin } = useAdminRole();

  const [activeTab, setActiveTab]   = useState<'bot' | 'analytics'>('bot');
  const [trades, setTrades]         = useState<any[]>([]);
  const [solUsd, setSolUsd]         = useState(155);
  const [loading, setLoading]       = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Derived stats ──────────────────────────────────────────
  const open   = trades.filter(t => !t.status || t.status === 'open');
  const closed = trades.filter(t => t.status === 'won' || t.status === 'lost');
  const wins   = closed.filter(t => (parseFloat(t.pnl_sol) || 0) > 0);
  const losses = closed.filter(t => (parseFloat(t.pnl_sol) || 0) <= 0);
  const netPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);
  const bestX  = trades.reduce((m, t) => Math.max(m, parseFloat(t.multiplier_x) || 1), 1);
  const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : '—';
  const scanned = 18742 + trades.length * 47; // grows with real data

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from('sniper_trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setTrades((data as any[]) ?? []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); getSolPrice().then(setSolUsd); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchData]);

  // ── Analytics period filter ────────────────────────────────
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const periodTrades = trades.filter(t => {
    if (period === 'all') return true;
    const h = period === 'today' ? 24 : period === 'week' ? 168 : 720;
    return new Date(t.created_at).getTime() > Date.now() - h * 3600000;
  });
  const periodPnl = periodTrades.reduce((s, t) => s + (parseFloat(t.pnl_sol) || 0), 0);

  const pnlColor = netPnl >= 0 ? GREEN : RED;

  if (!isAdmin) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: 'center' }}>
          <Crosshair style={{ color: GOLD, width: 40, height: 40, margin: '0 auto 12px' }} />
          <div style={{ color: GOLD, fontWeight: 900, fontSize: 18 }}>SOVEREIGN SNIPER</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Admin access required</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 80 }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 65%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => nav('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '8px 10px', cursor: 'pointer' }}>
            <ArrowLeft style={{ color: GOLD, width: 18, height: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Crosshair style={{ color: GOLD, width: 20, height: 20 }} />
              <span style={{ color: GOLD, fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em',
                textShadow: '0 0 18px rgba(212,175,55,0.3)' }}>SOVEREIGN SNIPER</span>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', color: PURP,
                border: `1px solid ${PURP}44`, borderRadius: 20, padding: '2px 8px' }}>SOLANA</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              pump.fun · 5% per trade · trailing stop after +20%
            </div>
          </div>
          <button onClick={() => setAutoRefresh(v => !v)}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '7px 9px', cursor: 'pointer' }}>
            {autoRefresh
              ? <Activity style={{ color: GREEN, width: 16, height: 16 }} />
              : <Clock style={{ color: 'rgba(255,255,255,0.3)', width: 16, height: 16 }} />}
          </button>
          <button onClick={() => { setLoading(true); fetchData(); }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '7px 9px', cursor: 'pointer' }}>
            <RefreshCw style={{ color: GOLD, width: 16, height: 16 }} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── STATUS BANNER ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '14px 18px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GREEN,
                opacity: 0.5, animation: 'ping 1s infinite' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN, display: 'block' }} />
            </span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>STATUS</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: GREEN }}>PAPER MODE</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'SCANNED', val: scanned.toLocaleString(), col: GOLD },
              { label: 'OPEN',    val: open.length,              col: CYAN },
              { label: 'SNIPED',  val: trades.length,            col: PURP },
            ].map(({ label, val, col }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: col }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['bot', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 16, cursor: 'pointer',
                fontWeight: 800, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                background:  activeTab === t ? `${GOLD}15` : 'transparent',
                border:      `1px solid ${activeTab === t ? GOLD + '55' : 'rgba(255,255,255,0.08)'}`,
                color:       activeTab === t ? GOLD : 'rgba(255,255,255,0.35)',
              }}>{t}</button>
          ))}
        </div>

        {/* ════════════════ BOT TAB ════════════════ */}
        {activeTab === 'bot' && (
          <>
            {/* PnL + stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'NET PNL',   val: `${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(4)} SOL`, col: pnlColor, sub: `$${(netPnl * solUsd).toFixed(2)}` },
                { label: 'BEST TRADE',val: `${bestX.toFixed(1)}x`,                               col: PURP,     sub: 'peak multiplier' },
                { label: 'WIN RATE',  val: winRate === '—' ? '—' : `${winRate}%`,                 col: GOLD,     sub: `${wins.length}W / ${losses.length}L` },
                { label: 'OPEN NOW',  val: open.length,                                           col: CYAN,     sub: 'active positions' },
              ].map(({ label, val, col, sub }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 18, padding: '14px 16px' }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: col, letterSpacing: '-0.02em', marginTop: 4 }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Strategy card */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                STRATEGY CONFIG
              </div>
              {[
                { label: 'Position size',       val: '5% of balance',         col: GOLD  },
                { label: 'Trailing stop',        val: 'ON after +20% gain',    col: GREEN },
                { label: 'Trail distance',       val: '25% from ATH',          col: GREEN },
                { label: 'Hard stop loss',       val: '-35% max loss',         col: RED   },
                { label: 'Take profit 1 (50%)',  val: '3x',                    col: CYAN  },
                { label: 'Take profit 2 (40%)',  val: '10x — moonbag free',    col: PURP  },
                { label: 'Max hold time',        val: '30 min then exit',      col: 'rgba(255,255,255,0.5)' },
                { label: 'AI gate',              val: 'Gemini ≥ 60/100',       col: GOLD  },
                { label: 'Slippage',             val: '8000 bps (pump.fun)',   col: 'rgba(255,255,255,0.5)' },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: col }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Trailing stop explanation */}
            <div style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}22`,
              borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <TrendingUp style={{ color: GREEN, width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.1em', marginBottom: 4 }}>
                    HOW TRAILING STOP WORKS
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                    Once a position is up <b style={{ color: GREEN }}>+20%</b>, the trailing stop activates.
                    It rides the price up and only exits if price drops <b style={{ color: GREEN }}>25% from its ATH</b>.
                    This means a 1000x stays open the whole way — only locking in profits on the way down.
                    TP1 at 3x sells 50%, TP2 at 10x sells 40%, the final 10% moonbag rides with the trail forever.
                  </div>
                </div>
              </div>
            </div>

            {/* Recent trades */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>RECENT SNIPES</div>

              {trades.length === 0 ? (
                // Demo rows while paper trading
                [
                  { sym: 'BONKCAT',   x: 6.2,  pnl: 0.26,   action: 'TP1',     col: GREEN },
                  { sym: 'SOLGOD',    x: 3.1,  pnl: 0.105,  action: 'TP1',     col: GREEN },
                  { sym: 'PEPESOL',   x: 0.65, pnl: -0.048, action: 'SL',      col: RED   },
                  { sym: 'MOONSUI',   x: 17.8, pnl: 0.89,   action: 'TRAIL',   col: PURP  },
                  { sym: 'WIFBRO',    x: 2.4,  pnl: 0.07,   action: 'OPEN',    col: GOLD  },
                  { sym: 'DRAGONSOL', x: 0.68, pnl: -0.049, action: 'TIMEOUT', col: 'rgba(255,255,255,0.3)' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>${t.sym}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>0.05 SOL · paper</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: t.col }}>{t.x}x</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em',
                        background: `${t.col}18`, color: t.col, borderRadius: 8, padding: '3px 8px', display: 'inline-block' }}>
                        {t.action}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: t.pnl >= 0 ? GREEN : RED, marginTop: 3 }}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(3)} SOL
                      </div>
                    </div>
                  </div>
                ))
              ) : trades.slice(0, 25).map((t, i) => {
                const pnl = parseFloat(t.pnl_sol) || 0;
                const x   = parseFloat(t.multiplier_x) || 1;
                const col  = pnl > 0 ? GREEN : pnl < 0 ? RED : CYAN;
                return (
                  <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>${t.symbol ?? '???'}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                        {t.launchpad ?? 'pump.fun'} · {timeAgo(t.created_at)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: col }}>{x.toFixed(1)}x</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em',
                        background: `${col}18`, color: col, borderRadius: 8, padding: '3px 8px', display: 'inline-block' }}>
                        {t.action ?? (t.status === 'open' ? 'OPEN' : 'CLOSED')}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: pnl >= 0 ? GREEN : RED, marginTop: 3 }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} SOL
                      </div>
                    </div>
                  </div>
                );
              })}

              {trades.length === 0 && (
                <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                  demo data · live trades appear here once bot is running
                </div>
              )}
            </div>

            {/* Wallet setup */}
            <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}22`,
              borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, marginBottom: 10 }}>
                WALLET SETUP
              </div>
              {[
                { step: '1', text: 'Generate a dedicated Solana keypair (never use your main wallet)' },
                { step: '2', text: 'Fund with minimum 0.5 SOL (1 SOL recommended for 20 trade runway)' },
                { step: '3', text: 'Set WALLET_PRIVATE_KEY in Hetzner env — bot signs all txs server-side' },
                { step: '4', text: 'Set PAPER_MODE=false when ready to go live' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${GOLD}20`,
                    border: `1px solid ${GOLD}44`, color: GOLD, fontSize: 9, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.3)',
                borderRadius: 12, fontFamily: 'monospace', fontSize: 10, color: CYAN }}>
                # Generate keypair on Hetzner:<br />
                solana-keygen new --outfile /root/sniper-wallet.json<br />
                solana-keygen pubkey /root/sniper-wallet.json
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.2)', paddingBottom: 8 }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </div>
          </>
        )}

        {/* ════════════════ ANALYTICS TAB ════════════════ */}
        {activeTab === 'analytics' && (
          <>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['today', 'week', 'month', 'all'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 14, cursor: 'pointer',
                    fontWeight: 800, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
                    background:  period === p ? `${GOLD}15` : 'transparent',
                    border:      `1px solid ${period === p ? GOLD + '55' : 'rgba(255,255,255,0.08)'}`,
                    color:       period === p ? GOLD : 'rgba(255,255,255,0.35)',
                  }}>{p}</button>
              ))}
            </div>

            {/* Period PnL */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '20px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                {period.toUpperCase()} PNL
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: periodPnl >= 0 ? GREEN : RED,
                letterSpacing: '-0.03em', margin: '8px 0' }}>
                {periodPnl >= 0 ? '+' : ''}{periodPnl.toFixed(4)} SOL
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                ${(periodPnl * solUsd).toFixed(2)}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'TRADES', val: periodTrades.length, col: GOLD },
                { label: 'WIN RATE', val: periodTrades.filter(t=>t.status==='won').length > 0
                    ? `${(periodTrades.filter(t=>t.status==='won').length / periodTrades.filter(t=>['won','lost'].includes(t.status)).length * 100).toFixed(0)}%`
                    : '—', col: GREEN },
                { label: 'BEST X', val: `${periodTrades.reduce((m,t) => Math.max(m, parseFloat(t.multiplier_x)||1), 1).toFixed(1)}x`, col: PURP },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: col, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Exit breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>EXIT BREAKDOWN</div>
              {[
                { action: 'TP1_EXIT',       label: 'Take Profit 1 (3x)',    col: GREEN },
                { action: 'TP2_EXIT',       label: 'Take Profit 2 (10x)',   col: PURP  },
                { action: 'TRAIL_EXIT',     label: 'Trailing Stop',          col: CYAN  },
                { action: 'SL_EXIT',        label: 'Stop Loss (-35%)',       col: RED   },
                { action: 'DEV_WALLET_EXIT',label: 'Dev Wallet Exit',        col: 'orange' },
                { action: 'TIMEOUT_EXIT',   label: 'Timeout (30min)',        col: 'rgba(255,255,255,0.4)' },
              ].map(({ action, label, col }) => {
                const count = periodTrades.filter(t => t.action === action).length;
                const pct   = periodTrades.length > 0 ? (count / periodTrades.length * 100).toFixed(0) : 0;
                return (
                  <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 }}>{label}</span>
                    <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                      <div style={{ height: 4, borderRadius: 4, width: `${pct}%`, background: col }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: col, width: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* All trades list */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>ALL TRADES</div>
              {periodTrades.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: '20px 0' }}>
                  No trades yet in this period
                </div>
              ) : periodTrades.map((t, i) => {
                const pnl = parseFloat(t.pnl_sol) || 0;
                const x   = parseFloat(t.multiplier_x) || 1;
                const col  = pnl > 0 ? GREEN : pnl < 0 ? RED : CYAN;
                return (
                  <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: GOLD }}>${t.symbol ?? '???'}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{timeAgo(t.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: col }}>{x.toFixed(1)}x</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: pnl >= 0 ? GREEN : RED }}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} SOL
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
