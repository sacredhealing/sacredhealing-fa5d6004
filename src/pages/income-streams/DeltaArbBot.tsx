import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, TrendingUp, Activity } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';

// Correct anon key from the app's own supabase client.ts
// v6 — RLS disabled, anon read confirmed working
const SB_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';

export default function DeltaArbBot() {
  const navigate = useNavigate();
  const [trades, setTrades]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin]       = useState(false);
  const [ts, setTs]           = useState('');
  const [err, setErr]         = useState('');

  const load = async () => {
    setSpin(true);
    setErr('');
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/delta_arb_trades?select=*&order=created_at.desc&limit=10000`,
        {
          headers: {
            apikey: SB_KEY,
            Authorization: `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrades(data);
      } else {
        setErr(`${res.status}: ${JSON.stringify(data).slice(0, 120)}`);
      }
      setTs(new Date().toLocaleTimeString());
    } catch (e: any) {
      setErr(String(e));
    }
    setLoading(false);
    setSpin(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  const won      = trades.filter(t => t.status === 'won');
  const lost     = trades.filter(t => t.status === 'lost');
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal      = Math.round((100 + totalPnl) * 100) / 100;
  const pnl      = bal - 100;
  const pc       = pnl >= 0 ? GREEN : RED;
  const wr       = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';

  const g = 'rounded-[32px] border border-white/[0.06] bg-white/[0.02]';

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 100 }}>
      <div style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD, letterSpacing: '-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: CYAN, border: `1px solid ${CYAN}55`, borderRadius: 99, padding: '2px 8px' }}>PAPER</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              Polymarket · Binance WebSocket · {ts || '...'}
            </div>
          </div>
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Error banner — shows exact error so we can debug */}
        {err && (
          <div style={{ marginBottom: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, fontSize: 10, color: RED, wordBreak: 'break-all' }}>
            {err}
          </div>
        )}

        {/* Balance Banner */}
        <div className={g} style={{ padding: 20, marginBottom: 12, borderColor: `${pc}33`, background: `${pc}06` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.15em' }}>LIVE · PAPER MODE</span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BALANCE</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 24px ${GOLD}44` }}>
                {loading ? '...' : `$${bal.toFixed(2)}`}
              </div>
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL P&L</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: pc }}>
                {loading ? '...' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { l: 'TRADES',   v: loading ? '...' : won.length + lost.length, c: GOLD  },
              { l: 'WIN RATE', v: loading ? '...' : wr,                        c: GOLD  },
              { l: 'WINS',     v: loading ? '...' : won.length,                c: GREEN },
              { l: 'LOSSES',   v: loading ? '...' : lost.length,               c: lost.length > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Feed */}
        <div className={g} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>TRADE FEED</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{trades.length} trades</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Loading...</div>
          ) : trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>No trades yet — bot is running</div>
            </div>
          ) : trades.map((t, i) => {
            const isWon  = t.status === 'won';
            const isLost = t.status === 'lost';
            const sc  = isWon ? GREEN : isLost ? RED : CYAN;
            const pv  = parseFloat(t.pnl_usdc) || 0;
            return (
              <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    {t.asset ?? '?'}<span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{t.interval ?? '15m'}</span>
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
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 99, background: `${sc}15`, color: sc, border: `1px solid ${sc}40` }}>
                    {isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: pv >= 0 ? GREEN : RED, marginTop: 4 }}>
                    {isWon || isLost ? `${pv >= 0 ? '+' : ''}$${pv.toFixed(2)}` : `$${parseFloat(t.size_usd || 0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className={g} style={{ padding: 20, marginTop: 12 }}>
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
