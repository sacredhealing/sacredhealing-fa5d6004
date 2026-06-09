import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, TrendingUp } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const DIM   = 'rgba(255,255,255,0.35)';

const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy';
const SB    = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/delta_arb_trades';
const KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';
const STARTING = 10;

export default function DeltaArbBotV2() {
  const navigate = useNavigate();
  const [health,  setHealth]  = useState<any>(null);
  const [trades,  setTrades]  = useState<any[]>([]);
  const [mode,    setMode]    = useState<'LIVE'|'PAPER'>('LIVE');
  const [spin,    setSpin]    = useState(false);
  const [ts,      setTs]      = useState('');
  const [err,     setErr]     = useState('');

  const hdrs = { apikey: KEY, Authorization: `Bearer ${KEY}` };

  const load = async () => {
    setSpin(true); setErr('');
    try {
      // Primary: edge function (uses service key, bypasses RLS)
      const [hRes, tRes] = await Promise.all([
        fetch(`${PROXY}?endpoint=health`, { headers: hdrs }),
        fetch(`${PROXY}?endpoint=trades&limit=200`, { headers: hdrs }),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (tRes.ok) {
        const all = await tRes.json();
        // Filter by mode
        const filtered = Array.isArray(all)
          ? all.filter((t:any) => (t.mode || 'PAPER') === mode)
          : [];
        setTrades(filtered);
      } else {
        // Fallback: direct Supabase REST
        const fb = await fetch(
          `${SB}?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at&order=created_at.desc&limit=200&mode=eq.${mode}`,
          { headers: hdrs }
        );
        const fbData = await fb.json();
        if (Array.isArray(fbData)) setTrades(fbData);
        else setErr(`${fb.status}: ${JSON.stringify(fbData).slice(0,120)}`);
      }
      setTs(new Date().toLocaleTimeString());
    } catch (e:any) { setErr(String(e)); }
    setSpin(false);
  };

  useEffect(() => { load(); }, [mode]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [mode]);

  const won  = trades.filter(t => t.status === 'won');
  const lost = trades.filter(t => t.status === 'lost');
  const pnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal  = Math.round((STARTING + pnl) * 100) / 100;
  const wr   = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';
  const pnlColor = pnl >= 0 ? GOLD : DIM;

  const glass = {
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    marginBottom: 12,
  };

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 120 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

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
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD }}>
                {mode}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              {ts ? `Synced ${ts} · auto-refreshes` : 'Connecting to Akasha stream...'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Bot Status */}
        <div style={{ ...glass, padding: '12px 18px',
          borderColor: health?.status === 'running' ? `${GOLD}33` : 'rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%',
                background: health?.status === 'running' ? GOLD : 'rgba(255,255,255,0.2)',
                boxShadow: health?.status === 'running' ? `0 0 8px ${GOLD}88` : 'none' }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                color: health?.status === 'running' ? GOLD : 'rgba(255,255,255,0.3)' }}>
                {health?.status === 'running' ? 'ORACLE ACTIVE — SCANNING MARKETS' : 'CONNECTING TO ORACLE...'}
              </span>
            </div>
            {health && (
              <div style={{ display: 'flex', gap: 14 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                  WR <span style={{ color: GOLD, fontWeight: 700 }}>{health.winRate ?? '—'}</span>
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                  <span style={{ color: CYAN, fontWeight: 700 }}>{(health.bot ?? 'SQI').split(' ')[0]}</span>
                </span>
              </div>
            )}
          </div>
          {err && (
            <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(212,175,55,0.6)', wordBreak: 'break-all', lineHeight: 1.5 }}>
              ⚠ {err}
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['LIVE','PAPER'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '10px', borderRadius: 18, cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em',
                background: mode === m ? `${GOLD}18` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${mode === m ? GOLD : 'rgba(255,255,255,0.07)'}`,
                color: mode === m ? GOLD : 'rgba(255,255,255,0.25)' }}>
              {m === 'LIVE' ? '⚡ LIVE SIGNAL' : '◎ PAPER SIM'}
            </button>
          ))}
        </div>

        {/* Balance Card */}
        <div style={{ ...glass, padding: 22, borderColor: `${GOLD}22`, background: `${GOLD}06` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={13} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: `${GOLD}99` }}>
              {mode === 'LIVE' ? 'LIVE TRADING · POLYGRAM EXTREME' : 'PAPER SIMULATION'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>BALANCE</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', textShadow: `0 0 32px ${GOLD}44` }}>
                ${bal.toFixed(2)}
              </div>
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>TOTAL P&L</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: pnlColor }}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              ['TRADES',   won.length + lost.length, GOLD ],
              ['WIN RATE', wr,                        GOLD ],
              ['WINS',     won.length,                GREEN],
              ['LOSSES',   lost.length,               lost.length > 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'],
            ].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'rgba(0,0,0,0.28)', borderRadius: 16, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: String(c) }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Feed */}
        <div style={{ ...glass, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={13} color={CYAN} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>SIGNAL FEED</span>
            </div>
            <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
              {trades.length} TRADES
            </span>
          </div>

          {trades.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>🔮</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 8, letterSpacing: '-0.02em' }}>
                Awaiting First Quantum Signal
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
                Bot monitors BTC · ETH · SOL<br/>
                Fires on 0.12%+ delta in 5m/15m window<br/>
                {mode === 'LIVE' ? 'Oracle lag window: 10–120 seconds' : 'Switch to LIVE to see real trades'}
              </div>
            </div>
          ) : trades.slice(0,50).map((t, i) => {
            const win  = t.status === 'won';
            const loss = t.status === 'lost';
            const p    = parseFloat(t.pnl_usdc) || 0;
            const sc   = win ? GOLD : loss ? 'rgba(255,255,255,0.3)' : CYAN;
            return (
              <div key={t.id ?? i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    {t.asset ?? '?'}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 400, marginLeft: 6 }}>{t.interval ?? '5m'}</span>
                  </div>
                  <div style={{ fontSize: 10, marginTop: 2, display: 'flex', gap: 8 }}>
                    <span style={{ color: t.signal === 'UP' ? GOLD : CYAN, fontWeight: 700 }}>
                      {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.18)' }}>{t.delta}</span>
                    <span style={{ color: 'rgba(255,255,255,0.12)' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                    background: `${sc}18`, color: sc, border: `1px solid ${sc}44` }}>
                    {win ? 'WIN' : loss ? 'CLOSED' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4,
                    color: win ? GOLD : loss ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)' }}>
                    {win || loss ? `${p >= 0 ? '+' : ''}${p.toFixed(2)}` : `${parseFloat(t.size_usd||0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
