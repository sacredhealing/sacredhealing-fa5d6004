import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, TrendingUp, Target } from 'lucide-react';

const GOLD  = '#D4AF37'; // v4.1
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = 'rgba(255,80,80,0.9)';

const SB    = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/bot_trades';
const KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';
const HDRS  = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  marginBottom: 12,
  ...extra,
});

export default function DeltaArbBotV2() {
  const navigate = useNavigate();
  const [trades,  setTrades]  = useState<any[]>([]);
  const [mode,    setMode]    = useState<'ALL'|'PAPER'|'LIVE'>('ALL');
  const [spin,    setSpin]    = useState(false);
  const [ts,      setTs]      = useState('');
  const [err,     setErr]     = useState('');
  const [pulse,   setPulse]   = useState(false);
  const [capital, setCapital] = useState<any>(null);
  const [capErr,  setCapErr]  = useState('');

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(iv);
  }, []);

  // Live Binance capital — USDT + USDC + BTC valued in USD
  const loadCapital = useCallback(async () => {
    try {
      const r = await fetch(
        `https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/binance-balance`,
        { headers: HDRS },
      );
      const j = await r.json();
      if (j?.ok) { setCapital(j); setCapErr(''); }
      else { setCapErr(j?.error ?? 'binance unreachable'); }
    } catch (e: any) { setCapErr(String(e?.message ?? e)); }
  }, []);

  useEffect(() => { loadCapital(); }, [loadCapital]);
  useEffect(() => {
    const iv = setInterval(loadCapital, 15000);
    return () => clearInterval(iv);
  }, [loadCapital]);

  const load = useCallback(async () => {
    setSpin(true); setErr('');
    try {
      let url = `${SB}?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at&order=created_at.desc&limit=500`;
      if (mode === 'PAPER') url += '&mode=eq.PAPER';
      if (mode === 'LIVE')  url += '&mode=eq.LIVE';

      const r = await fetch(url, { headers: HDRS });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setTrades(data);
        else setErr('Unexpected response');
      } else {
        const body = await r.text();
        setErr(`HTTP ${r.status}: ${body.slice(0, 120)}`);
      }
      setTs(new Date().toLocaleTimeString());
    } catch (e: any) { setErr(String(e)); }
    setSpin(false);
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  // Stats — all computed from real Supabase data
  const won       = trades.filter(t => t.status === 'won');
  const lost      = trades.filter(t => t.status === 'lost');
  const open      = trades.filter(t => t.status !== 'won' && t.status !== 'lost');
  const totalPnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  // Real Binance spot capital (USDT + USDC + BTC in USD). Falls back to 0 while loading.
  const liveCapital = capital?.ok ? Number(capital.totalUsd ?? 0) : 0;
  const balance   = liveCapital;
  const wr        = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';
  const hasData   = trades.length > 0;
  const pnlColor  = totalPnl >= 0 ? GOLD : RED;

  // Latest trade asset for pulse label
  const latestAsset = trades[0]?.asset ?? null;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 120 }}>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes goldPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine  { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes ripple    { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD, letterSpacing: '-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(34,211,238,0.1)', border: `1px solid ${CYAN}44`, color: CYAN, letterSpacing: '0.1em' }}>
                ORACLE-LAG
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
              {ts ? `Synced ${ts} · auto-refresh 8s` : 'Connecting...'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none', display: 'block' }} />
          </button>
        </div>

        {/* ── LIVE STATUS BAR ── */}
        <div style={{ ...glass({ padding: '12px 18px', marginBottom: 12,
          borderColor: hasData ? `${GOLD}33` : 'rgba(255,255,255,0.05)',
          background: hasData ? `${GOLD}04` : 'rgba(255,255,255,0.02)' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Animated pulse dot */}
              <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                  background: hasData ? GOLD : 'rgba(255,255,255,0.15)',
                  boxShadow: hasData ? `0 0 ${pulse ? 10 : 5}px ${GOLD}88` : 'none',
                  transition: 'box-shadow 0.5s ease' }} />
                {hasData && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                    border: `1px solid ${GOLD}66`,
                    animation: 'ripple 2s ease-out infinite' }} />
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                color: hasData ? GOLD : 'rgba(255,255,255,0.25)' }}>
                {hasData
                  ? `ORACLE LIVE · ${trades.length} TRADES · BTC · ETH · SOL`
                  : 'CONNECTING TO ORACLE...'}
              </span>
            </div>
            {err && (
              <span style={{ fontSize: 8, color: 'rgba(255,80,80,0.7)', fontWeight: 600, maxWidth: 180, textAlign: 'right' }}>
                {err.slice(0, 60)}
              </span>
            )}
          </div>
        </div>

        {/* ── MODE FILTER ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['ALL', 'PAPER', 'LIVE'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '10px 6px', borderRadius: 16, cursor: 'pointer',
                fontWeight: 800, fontSize: 10, letterSpacing: '0.08em',
                background: mode === m
                  ? m === 'PAPER' ? 'rgba(34,211,238,0.08)' : m === 'LIVE' ? `${GOLD}18` : 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${mode === m
                  ? m === 'PAPER' ? CYAN+'55' : m === 'LIVE' ? GOLD : 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.07)'}`,
                color: mode === m
                  ? m === 'PAPER' ? CYAN : m === 'LIVE' ? GOLD : 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.22)',
                transition: 'all 0.2s ease' }}>
              {m === 'PAPER' ? '◎ PAPER' : m === 'LIVE' ? '⚡ LIVE' : '∞ ALL'}
            </button>
          ))}
        </div>

        {/* ── BALANCE CARD ── */}
        <div style={{ ...glass({ padding: '20px 22px', borderColor: `${GOLD}22`, background: `${GOLD}05` }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Activity size={13} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: `${GOLD}77` }}>
              {mode === 'LIVE' ? 'LIVE TRADING · POLYMARKET CLOB'
               : mode === 'PAPER' ? 'PAPER SIMULATION · ORACLE-LAG SIGNALS'
               : 'ALL TRADES · PAPER + LIVE COMBINED'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>
                BINANCE CAPITAL {capital?.ok ? '· LIVE' : capErr ? '· OFFLINE' : '· …'}
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em',
                textShadow: `0 0 40px ${GOLD}44` }}>
                ${balance.toFixed(2)}
              </div>
              {capital?.ok && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.08em' }}>
                  USDC ${Number(capital.usdc ?? 0).toFixed(2)} · USDT ${Number(capital.usdt ?? 0).toFixed(2)} · BTC {Number(capital.btc ?? 0).toFixed(6)}
                </div>
              )}
              {!capital?.ok && capErr && (
                <div style={{ fontSize: 9, color: 'rgba(255,80,80,0.6)', marginTop: 4 }}>{capErr.slice(0, 80)}</div>
              )}
            </div>
            <div style={{ paddingBottom: 7 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>
                TOTAL P&L
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: pnlColor, transition: 'color 0.4s' }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
            </div>
          </div>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {[
              ['TRADES',   trades.length,    GOLD ],
              ['WIN RATE', wr,               GOLD ],
              ['WINS',     won.length,        GREEN],
              ['LOSSES',   lost.length,       lost.length > 0 ? RED : 'rgba(255,255,255,0.2)'],
              ['OPEN',     open.length,       CYAN ],
            ].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '10px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: String(c) }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIGNAL FEED ── */}
        <div style={{ ...glass({ overflow: 'hidden' }) }}>
          {/* Feed header */}
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={13} color={CYAN} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                SIGNAL FEED · {mode}
              </span>
            </div>
            <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}>
              {trades.length} TRADES
            </span>
          </div>

          {/* Empty state */}
          {trades.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 16px',
                borderRadius: '50%', border: `1px solid ${GOLD}22`, overflow: 'hidden' }}>
                <Zap size={20} color={GOLD}
                  style={{ position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', animation: 'goldPulse 2s ease infinite' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(transparent,${GOLD}55,transparent)`,
                  animation: 'scanLine 2s linear infinite' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 6 }}>
                Scanning BTC · ETH · SOL
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8 }}>
                Delta threshold 0.12% · 5m + 15m windows<br/>
                {err ? <span style={{ color: 'rgba(255,80,80,0.6)' }}>{err}</span> : 'Awaiting next signal...'}
              </div>
            </div>
          ) : (
            // Trade rows
            trades.slice(0, 100).map((t, i) => {
              const win  = t.status === 'won';
              const loss = t.status === 'lost';
              const pnl  = parseFloat(t.pnl_usdc) || 0;
              const mLabel = (t.mode ?? 'PAPER') as string;
              const isNew = i === 0;
              return (
                <div key={t.id ?? i}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isNew ? `${GOLD}06` : 'transparent',
                    animation: isNew ? 'fadeUp 0.35s ease' : 'none' }}>
                  {/* Left: asset + signal */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                        {t.asset ?? '?'}
                      </span>
                      {/* interval badge */}
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
                        padding: '1px 5px', borderRadius: 5, background: 'rgba(255,255,255,0.04)' }}>
                        {t.interval ?? '5m'}
                      </span>
                      {/* mode badge */}
                      <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 5, fontWeight: 700,
                        background: mLabel === 'LIVE' ? `${GOLD}14` : 'rgba(34,211,238,0.08)',
                        color: mLabel === 'LIVE' ? GOLD : CYAN,
                        border: `1px solid ${mLabel === 'LIVE' ? GOLD+'33' : CYAN+'22'}` }}>
                        {mLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: t.signal === 'UP' ? GOLD : CYAN, fontWeight: 800, fontSize: 11 }}>
                        {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9 }}>{t.delta}</span>
                      <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 9 }}>
                        {t.created_at
                          ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : ''}
                      </span>
                    </div>
                  </div>
                  {/* Right: result + pnl */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                      background: win ? `${GOLD}18` : loss ? 'rgba(255,255,255,0.04)' : `${CYAN}12`,
                      color: win ? GOLD : loss ? 'rgba(255,255,255,0.3)' : CYAN,
                      border: `1px solid ${win ? GOLD+'33' : loss ? 'rgba(255,255,255,0.07)' : CYAN+'22'}` }}>
                      {win ? '✓ WIN' : loss ? 'LOSS' : 'OPEN'}
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4,
                      color: win ? GOLD : loss ? RED : 'rgba(255,255,255,0.22)' }}>
                      {(win || loss)
                        ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
                        : `$${parseFloat(t.size_usd || 0).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Target size={9} color={`${GOLD}44`} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em' }}>
              BINANCE ORACLE-LAG · POLYMARKET CLOB · SUB-300MS EXECUTION
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
