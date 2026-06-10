import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, TrendingUp, Radio, Target } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = 'rgba(255,80,80,0.85)';
const DIM   = 'rgba(255,255,255,0.35)';

const SB      = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/bot_trades';
const HEALTH  = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy?endpoint=health';
const KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';
const STARTING = 10;

const hdrs = { apikey: KEY, Authorization: `Bearer ${KEY}` };

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
  const [health, setHealth]   = useState<any>(null);
  const [trades, setTrades]   = useState<any[]>([]);
  const [mode,   setMode]     = useState<'LIVE'|'PAPER'>('PAPER');
  const [spin,   setSpin]     = useState(false);
  const [ts,     setTs]       = useState('');
  const [err,    setErr]      = useState('');
  const [pulse,  setPulse]    = useState(false);

  // Heartbeat pulse every 3s
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 3000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(async () => {
    setSpin(true); setErr('');
    try {
      // Health from edge proxy (gets Railway bot status)
      const hRes = await fetch(HEALTH, { headers: hdrs }).catch(() => null);
      if (hRes?.ok) {
        const h = await hRes.json();
        setHealth(h);
        // Sync mode from bot if available
        if (h.mode && (h.mode === 'LIVE' || h.mode === 'PAPER')) {
          setMode(h.mode as 'LIVE'|'PAPER');
        }
      }

      // Trades from Supabase — fetch both modes, filter client-side
      const tRes = await fetch(
        `${SB}?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at&order=created_at.desc&limit=300`,
        { headers: hdrs }
      );
      if (tRes.ok) {
        const all = await tRes.json();
        if (Array.isArray(all)) {
          setTrades(all.filter((t: any) => (t.mode ?? 'PAPER') === mode));
        }
      } else {
        const body = await tRes.text();
        setErr(`Supabase ${tRes.status}: ${body.slice(0, 100)}`);
      }
      setTs(new Date().toLocaleTimeString());
    } catch (e: any) {
      setErr(String(e));
    }
    setSpin(false);
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  // Stats
  const won      = trades.filter(t => t.status === 'won');
  const lost     = trades.filter(t => t.status === 'lost');
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal      = Math.round((STARTING + totalPnl) * 10000) / 10000;
  const wr       = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';
  const pnlColor = totalPnl >= 0 ? GOLD : RED;
  const isLive   = health?.status === 'running';
  const botMode  = health?.mode ?? mode;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 120 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes goldPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Header */}
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
                background: botMode === 'PAPER' ? 'rgba(34,211,238,0.1)' : `${GOLD}18`,
                border: `1px solid ${botMode === 'PAPER' ? CYAN+'44' : GOLD+'44'}`,
                color: botMode === 'PAPER' ? CYAN : GOLD, letterSpacing: '0.1em' }}>
                {botMode}
              </span>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                v3.1
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>
              {ts ? `Synced ${ts} · auto-refresh 8s` : 'Connecting to Akasha stream...'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD}
              style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none', display: 'block' }} />
          </button>
        </div>

        {/* Bot Oracle Status */}
        <div style={{ ...glass({ padding: '14px 18px',
          borderColor: isLive ? `${GOLD}33` : 'rgba(255,255,255,0.05)',
          background: isLive ? `${GOLD}05` : 'rgba(255,255,255,0.02)' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Live pulse dot */}
              <div style={{ position: 'relative', width: 10, height: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%',
                  background: isLive ? GOLD : 'rgba(255,255,255,0.15)',
                  boxShadow: isLive ? `0 0 ${pulse ? 12 : 6}px ${GOLD}` : 'none',
                  transition: 'box-shadow 0.6s ease' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                color: isLive ? GOLD : 'rgba(255,255,255,0.3)' }}>
                {isLive ? 'ORACLE ACTIVE — SCANNING' : 'CONNECTING TO ORACLE...'}
              </span>
            </div>
            {health && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>
                  CACHE <span style={{ color: CYAN, fontWeight: 700 }}>{health.cacheSize ?? '—'}</span>
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>
                  WR <span style={{ color: GOLD, fontWeight: 700 }}>{health.winRate ?? '—'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Live stats row from bot health */}
          {health && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12 }}>
              {[
                { l: 'BOT BAL', v: `$${parseFloat(health.balance ?? STARTING).toFixed(2)}`, c: GOLD },
                { l: 'BOT PNL', v: `${(health.pnl ?? 0) >= 0 ? '+' : ''}$${parseFloat(health.pnl ?? 0).toFixed(2)}`, c: (health.pnl ?? 0) >= 0 ? GOLD : RED },
                { l: 'WINS', v: health.wins ?? 0, c: GREEN },
                { l: 'LOSSES', v: health.losses ?? 0, c: 'rgba(255,255,255,0.4)' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: String(c) }}>{String(v)}</div>
                </div>
              ))}
            </div>
          )}

          {err && (
            <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(212,175,55,0.5)', wordBreak: 'break-all', lineHeight: 1.6 }}>
              ⚠ {err}
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['PAPER', 'LIVE'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '11px', borderRadius: 18, cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em',
                background: mode === m ? (m === 'PAPER' ? 'rgba(34,211,238,0.08)' : `${GOLD}18`) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${mode === m ? (m === 'PAPER' ? CYAN + '55' : GOLD) : 'rgba(255,255,255,0.07)'}`,
                color: mode === m ? (m === 'PAPER' ? CYAN : GOLD) : 'rgba(255,255,255,0.22)',
                transition: 'all 0.2s ease' }}>
              {m === 'PAPER' ? '◎ PAPER SIM' : '⚡ LIVE SIGNAL'}
            </button>
          ))}
        </div>

        {/* Balance Card — from Supabase trades */}
        <div style={{ ...glass({ padding: 22, borderColor: `${GOLD}22`, background: `${GOLD}06` }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={13} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: `${GOLD}88` }}>
              {mode === 'PAPER' ? 'PAPER SIMULATION · SUPABASE LOG' : 'LIVE TRADING · POLYGRAM EXTREME'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>
                {mode} BALANCE
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 32px ${GOLD}44` }}>
                ${bal.toFixed(2)}
              </div>
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>TOTAL P&L</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: pnlColor, transition: 'color 0.4s' }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(4)}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              ['TRADES',   won.length + lost.length, GOLD ],
              ['WIN RATE', wr,                        GOLD ],
              ['WINS',     won.length,                GREEN],
              ['LOSSES',   lost.length,               lost.length > 0 ? RED : 'rgba(255,255,255,0.2)'],
            ].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'rgba(0,0,0,0.28)', borderRadius: 16, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: String(c), transition: 'color 0.4s' }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signal Feed */}
        <div style={{ ...glass({ overflow: 'hidden', marginBottom: 12 }) }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={13} color={CYAN} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>
                {mode} SIGNAL FEED
              </span>
            </div>
            <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              {trades.length} TRADES
            </span>
          </div>

          {trades.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              {/* Scanning animation */}
              <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 18px',
                borderRadius: '50%', border: `1px solid ${GOLD}33`, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Radio size={22} color={GOLD} style={{ animation: 'goldPulse 2s ease infinite' }} />
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2,
                  background: `linear-gradient(to bottom, transparent, ${GOLD}66, transparent)`,
                  animation: 'scanLine 2s linear infinite' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 8, letterSpacing: '-0.02em' }}>
                {isLive ? 'Scanning BTC · ETH · SOL' : 'Awaiting First Trade Signal'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8 }}>
                {mode} mode · delta threshold 0.120%<br/>
                Fires on 5m + 15m candle windows<br/>
                {mode === 'PAPER' ? 'Trades will appear here as bot fires' : 'Switch to PAPER to see simulation trades'}
              </div>
            </div>
          ) : (
            trades.slice(0, 60).map((t, i) => {
              const win  = t.status === 'won';
              const loss = t.status === 'lost';
              const p    = parseFloat(t.pnl_usdc) || 0;
              const sc   = win ? GOLD : loss ? 'rgba(255,255,255,0.3)' : CYAN;
              return (
                <div key={t.id ?? i}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    animation: i === 0 ? 'fadeUp 0.3s ease' : 'none',
                    background: i === 0 ? `${GOLD}05` : 'transparent' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.asset ?? '?'}
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontWeight: 600,
                        padding: '1px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
                        {t.interval ?? '5m'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: t.signal === 'UP' ? GOLD : CYAN, fontWeight: 700, fontSize: 11 }}>
                        {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{t.delta}</span>
                      <span style={{ color: 'rgba(255,255,255,0.14)', fontSize: 9 }}>
                        {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                      background: win ? `${GOLD}18` : loss ? 'rgba(255,255,255,0.04)' : `${CYAN}14`,
                      color: win ? GOLD : loss ? 'rgba(255,255,255,0.35)' : CYAN,
                      border: `1px solid ${win ? GOLD+'33' : loss ? 'rgba(255,255,255,0.08)' : CYAN+'33'}` }}>
                      {win ? '✓ WIN' : loss ? 'LOSS' : 'OPEN'}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4,
                      color: win ? GOLD : loss ? RED : 'rgba(255,255,255,0.25)' }}>
                      {win || loss
                        ? `${p >= 0 ? '+' : ''}$${p.toFixed(4)}`
                        : `$${parseFloat(t.size_usd || 0).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info footer */}
        <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Target size={10} color={`${GOLD}66`} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em' }}>
              BINANCE ORACLE-LAG ARBITRAGE · SUB-300MS EXECUTION
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
