import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, TrendingUp, Activity } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';

const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy';
const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40';
const HDR   = { apikey: ANON, Authorization: `Bearer ${ANON}` };

export default function DeltaArbBot() {
  const navigate = useNavigate();
  const [health, setHealth]   = useState<any>(null);
  const [trades, setTrades]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ts, setTs]           = useState('');
  const [spin, setSpin]       = useState(false);

  const load = async () => {
    setSpin(true);
    try {
      const [hRes, tRes] = await Promise.all([
        fetch(`${PROXY}?endpoint=health`, { headers: HDR }),
        fetch(`${PROXY}?endpoint=trades&limit=50`, { headers: HDR }),
      ]);
      const h = await hRes.json();
      const t = await tRes.json();
      setHealth(h);
      setTrades(Array.isArray(t) ? t : []);
      setTs(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('DeltaArb fetch error:', e);
    } finally {
      setLoading(false);
      setSpin(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  const bal      = health?.balance ?? 100;
  const pnl      = bal - 100;
  const pnlColor = pnl >= 0 ? GREEN : RED;
  const winRate  = health?.winRate ?? '—';
  const trades_n = health?.tradeCount ?? 0;
  const wins_n   = Math.round((parseFloat(winRate) / 100) * trades_n) || 0;
  const mode     = health?.mode ?? 'PAPER';

  const g = (extra = '') =>
    `rounded-[32px] border border-white/[0.06] bg-white/[0.02] ${extra}`;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD, letterSpacing: '-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                color: mode === 'LIVE' ? GREEN : CYAN,
                border: `1px solid ${mode === 'LIVE' ? GREEN : CYAN}55`,
                borderRadius: 99, padding: '2px 8px'
              }}>{mode}</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              Polymarket · Binance WebSocket · {ts || '…'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── Balance Banner ── */}
        <div className={g()} style={{ padding: 20, marginBottom: 12, borderColor: `${pnlColor}33`, background: `${pnlColor}06` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.15em' }}>LIVE · PAPER MODE</span>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BALANCE</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 24px ${GOLD}44` }}>
                {loading ? '…' : `$${bal.toFixed(2)}`}
              </div>
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL P&L</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: pnlColor }}>
                {loading ? '…' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { l: 'TRADES',   v: loading ? '…' : trades_n,                          c: GOLD  },
              { l: 'WIN RATE', v: loading ? '…' : winRate,                            c: GOLD  },
              { l: 'WINS',     v: loading ? '…' : wins_n,                             c: GREEN },
              { l: 'LOSSES',   v: loading ? '…' : (trades_n - wins_n),               c: trades_n - wins_n > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trade Feed ── */}
        <div className={g()} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>TRADE FEED</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{trades.length} trades</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Scanning Akasha…
            </div>
          ) : trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Zap size={28} color="rgba(255,255,255,0.06)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                {health?.error ? `DB error: ${health.error}` : 'Waiting for first signal…'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', marginTop: 6 }}>
                Bot fires when BTC/ETH/SOL moves 0.12%+
              </div>
            </div>
          ) : trades.map((t, i) => {
            const won  = t.status === 'won';
            const lost = t.status === 'lost';
            const open = !won && !lost;
            const sc   = won ? GREEN : lost ? RED : CYAN;
            const pnlV = parseFloat(t.pnl_usdc) || 0;
            return (
              <div key={t.id ?? i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    {t.asset ?? '?'}
                    <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>
                      {t.interval ?? '15m'}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: t.signal === 'UP' ? GREEN : RED, marginTop: 2 }}>
                    {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, marginLeft: 6 }}>{t.delta}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>
                    {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                    padding: '3px 8px', borderRadius: 99,
                    background: `${sc}15`, color: sc, border: `1px solid ${sc}40`
                  }}>
                    {won ? 'WIN' : lost ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: pnlV >= 0 ? GREEN : RED, marginTop: 4 }}>
                    {open
                      ? `$${parseFloat(t.size_usd || 0).toFixed(2)}`
                      : `${pnlV >= 0 ? '+' : ''}$${pnlV.toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── How It Works ── */}
        <div className={g()} style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>HOW IT WORKS</span>
          </div>
          {[
            ['⚡', 'Binance WebSocket streams BTC/ETH/SOL at sub-50ms'],
            ['📐', 'Bot detects 0.12%+ price movement → direction locked'],
            ['🎯', 'Polymarket oracle still shows ~50/50 for 10–30 seconds'],
            ['💰', 'Bot buys winning token at $0.50–$0.58 entry'],
            ['🏆', 'Token resolves at $1.00 → 74–92% win rate'],
          ].map(([icon, text]) => (
            <div key={String(text)} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
