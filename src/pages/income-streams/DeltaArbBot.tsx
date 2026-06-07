import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Zap, Activity } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';

// Use the deployed edge function (service role bypasses RLS)
const EDGE_FN = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40';

async function fetchHealth() {
  const res = await fetch(`${EDGE_FN}?endpoint=health`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchTrades(limit = 100) {
  const res = await fetch(`${EDGE_FN}?endpoint=trades&limit=${limit}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
  });
  if (!res.ok) return [];
  return res.json();
}

export default function DeltaArbBot() {
  const navigate  = useNavigate();
  const [trades,  setTrades]  = useState<any[]>([]);
  const [health,  setHealth]  = useState<any>(null);
  const [refresh, setRefresh] = useState(0);
  const [ts,      setTs]      = useState('');
  const [tab,     setTab]     = useState<'live'|'all'>('live');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchHealth(), fetchTrades()]).then(([h, t]) => {
      if (!cancelled) {
        setHealth(h);
        setTrades(Array.isArray(t) ? t : []);
        setTs(new Date().toLocaleTimeString());
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    const iv = setInterval(() => setRefresh(r => r + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const won   = trades.filter(t => t.status === 'won');
  const lost  = trades.filter(t => t.status === 'lost');
  const open  = trades.filter(t => !['won','lost'].includes(t.status));

  // Prefer health endpoint stats (server-side computed, authoritative)
  const balance  = health?.balance ?? Math.round((100 + trades.reduce((s,t) => s + (parseFloat(t.pnl_usdc)||0), 0)) * 100) / 100;
  const totalPnl = balance - 100;
  const winRate  = health?.winRate ?? (won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—');
  const tradeCount = health?.tradeCount ?? (won.length + lost.length);
  const pnlColor = totalPnl >= 0 ? GREEN : RED;
  const botMode  = health?.mode ?? 'PAPER';

  const glass = 'rounded-[32px] border border-white/[0.06] bg-white/[0.02]';

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 120 }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '10px', cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 20, color: GOLD, letterSpacing: '-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: botMode === 'LIVE' ? GREEN : CYAN, border: `1px solid ${botMode === 'LIVE' ? GREEN : CYAN}55`, borderRadius: 99, padding: '2px 8px', letterSpacing: '0.2em' }}>
                {botMode}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Binance → Polymarket · Auto-refreshes every 10s</div>
          </div>
          <button onClick={() => setRefresh(r => r + 1)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={16} color={GOLD} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* P&L Banner */}
        <div className={glass} style={{ padding: 20, marginBottom: 12, borderColor: `${pnlColor}33`, background: `${pnlColor}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: GREEN }}>PAPER MODE — LIVE</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{ts}</span>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BALANCE</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, letterSpacing: '-0.03em', textShadow: `0 0 30px ${GOLD}44` }}>${balance.toFixed(2)}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL P&L</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: pnlColor }}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDC
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'TRADES', value: tradeCount, color: GOLD },
              { label: 'WIN RATE', value: winRate, color: GOLD },
              { label: 'WINS', value: won.length || health?.tradeCount && health?.winRate ? Math.round((parseFloat(health.winRate)/100) * tradeCount) : won.length, color: GREEN },
              { label: 'LOSSES', value: lost.length, color: lost.length > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
              </div>
            ))}
          </div>

          {open.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Activity size={12} color={CYAN} />
              <span style={{ fontSize: 10, color: CYAN }}>{open.length} trade{open.length > 1 ? 's' : ''} open</span>
            </div>
          )}
        </div>

        {/* DB status indicator */}
        {health?.error && (
          <div style={{ marginBottom: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16 }}>
            <span style={{ fontSize: 10, color: RED, fontWeight: 700 }}>⚠ TABLE NOT FOUND — Run SQL migration in Supabase SQL Editor</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['live', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 20,
                border: `1px solid ${tab === t ? GOLD + '66' : 'rgba(255,255,255,0.06)'}`,
                background: tab === t ? 'rgba(212,175,55,0.08)' : 'transparent',
                color: tab === t ? GOLD : 'rgba(255,255,255,0.35)',
                fontWeight: 800, fontSize: 10, letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>
              {t === 'live' ? '⚡ Live Feed' : '📊 All Trades'}
            </button>
          ))}
        </div>

        {/* Trade List */}
        <div className={glass} style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: 13 }}>Scanning Akasha…</div>
            </div>
          ) : trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <Zap size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>
                {health?.error
                  ? 'DB tables not created yet — see banner above'
                  : 'Waiting for first signal…'}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: 'rgba(255,255,255,0.12)' }}>Bot fires when BTC/ETH/SOL delta ≥ 0.12%</div>
            </div>
          ) : (
            (tab === 'live' ? trades.slice(0, 15) : trades).map((t, i) => {
              const isWon  = t.status === 'won';
              const isLost = t.status === 'lost';
              const pnl    = parseFloat(t.pnl_usdc) || 0;
              const sc     = isWon ? GREEN : isLost ? RED : CYAN;
              const label  = isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN';
              return (
                <div key={t.id ?? i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                      {t.asset ?? '?'} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{t.interval ?? '15m'}</span>
                    </div>
                    <div style={{ fontSize: 10, color: t.signal === 'UP' ? GREEN : RED, marginTop: 2, fontWeight: 700 }}>
                      {t.signal === 'UP' ? '▲' : '▼'} {t.signal} &nbsp;
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>{t.delta}</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                      {new Date(t.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                      padding: '3px 8px', borderRadius: 99,
                      background: `${sc}18`, color: sc, border: `1px solid ${sc}44`
                    }}>{label}</span>
                    <div style={{ fontSize: 13, fontWeight: 900, color: pnl >= 0 ? GREEN : RED, marginTop: 4 }}>
                      {isWon || isLost ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}` : `$${parseFloat(t.size_usd||0).toFixed(2)} bet`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ROI Info */}
        <div className={glass} style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color={GOLD} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>HOW IT WORKS</span>
          </div>
          {[
            ['⚡', 'Binance streams BTC/ETH/SOL price at sub-50ms'],
            ['📐', 'When price moves 0.12%+ bot detects direction'],
            ['🎯', 'Polymarket oracle still shows 50/50 for 10-30s'],
            ['💰', 'Bot buys winning token at ~$0.50-0.58 entry'],
            ['🏆', 'Token pays $1.00 if correct → 70-100% profit on position'],
          ].map(([icon, text]) => (
            <div key={String(text)} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(212,175,55,0.06)', borderRadius: 16, border: `1px solid ${GOLD}22` }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ACTIVE STRATEGY</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>AGGRESSIVE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>15% per trade · Compounding · 0.12% delta threshold</div>
          </div>
        </div>

      </div>
    </div>
  );
}
