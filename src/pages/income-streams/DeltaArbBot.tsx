import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Zap } from 'lucide-react';

const GOLD = '#D4AF37';
const BG   = '#050505';
const CYAN = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';

const SUPABASE_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40';

async function fetchTrades() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/delta_arb_trades?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,created_at&order=created_at.desc&limit=100`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

export default function DeltaArbBot() {
  const navigate  = useNavigate();
  const [trades,  setTrades]  = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [ts,      setTs]      = useState('');
  const [tab,     setTab]     = useState<'live'|'all'>('live');

  useEffect(() => {
    let cancelled = false;
    fetchTrades().then(data => {
      if (!cancelled) {
        setTrades(Array.isArray(data) ? data : []);
        setTs(new Date().toLocaleTimeString());
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    const iv = setInterval(() => setRefresh(r => r + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const won   = trades.filter(t => t.status === 'won');
  const lost  = trades.filter(t => t.status === 'lost');
  const open  = trades.filter(t => !['won','lost'].includes(t.status));
  const totalPnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const balance   = Math.round((100 + totalPnl) * 100) / 100;
  const winRate   = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1)
    : '—';
  const pnlColor  = totalPnl >= 0 ? GREEN : RED;

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
              <span style={{ fontSize: 9, fontWeight: 800, color: CYAN, border: `1px solid ${CYAN}55`, borderRadius: 99, padding: '2px 8px', letterSpacing: '0.2em' }}>PAPER</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Binance → Polymarket · Auto-refreshes every 10s</div>
          </div>
          <button onClick={() => setRefresh(r => r + 1)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={16} color={GOLD} />
          </button>
        </div>

        {/* P&L Banner */}
        <div className={glass} style={{ padding: 20, marginBottom: 12, borderColor: `${pnlColor}33`, background: `${pnlColor}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
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
              { label: 'TRADES', value: won.length + lost.length, color: GOLD },
              { label: 'WIN RATE', value: winRate === '—' ? '—' : `${winRate}%`, color: GOLD },
              { label: 'WINS', value: won.length, color: GREEN },
              { label: 'LOSSES', value: lost.length, color: lost.length > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
              </div>
            ))}
          </div>

          {open.length > 0 && (
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              {open.length} trade{open.length > 1 ? 's' : ''} pending…
            </div>
          )}
        </div>

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
          {trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <Zap size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>Waiting for first signal…</div>
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
  </div>
  );
}
