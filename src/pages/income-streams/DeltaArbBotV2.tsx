import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, Activity, TrendingUp, Radio, Target, AlertTriangle } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = 'rgba(255,80,80,0.85)';
const DIM   = 'rgba(255,255,255,0.35)';

const SB_BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1';
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

type RlsStatus = 'unknown' | 'ok' | 'blocked';

export default function DeltaArbBotV2() {
  const navigate = useNavigate();
  const [trades,   setTrades]   = useState<any[]>([]);
  const [mode,     setMode]     = useState<'PAPER'|'LIVE'|'ALL'>('ALL');
  const [spin,     setSpin]     = useState(false);
  const [ts,       setTs]       = useState('');
  const [err,      setErr]      = useState('');
  const [pulse,    setPulse]    = useState(false);
  const [rlsSt,    setRlsSt]    = useState<RlsStatus>('unknown');
  const [httpCode, setHttpCode] = useState<number|null>(null);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 3000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(async () => {
    setSpin(true); setErr('');
    try {
      // Build URL — filter by mode only if not ALL
      let url = `${SB_BASE}/delta_arb_trades?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at&order=created_at.desc&limit=300`;
      if (mode === 'PAPER') url += '&mode=eq.PAPER';
      if (mode === 'LIVE')  url += '&mode=eq.LIVE';

      const tRes = await fetch(url, { headers: hdrs });
      setHttpCode(tRes.status);

      if (tRes.ok) {
        const all = await tRes.json();
        if (Array.isArray(all)) {
          setTrades(all);
          setRlsSt('ok');
        } else {
          setErr('Unexpected response format');
        }
      } else {
        const body = await tRes.text();
        setRlsSt('blocked');
        if (tRes.status === 403) {
          setErr(`RLS_BLOCKED: ${body.slice(0, 120)}`);
        } else {
          setErr(`HTTP ${tRes.status}: ${body.slice(0, 120)}`);
        }
      }
      setTs(new Date().toLocaleTimeString());
    } catch (e: any) {
      setErr(String(e));
    }
    setSpin(false);
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const won      = trades.filter(t => t.status === 'won');
  const lost     = trades.filter(t => t.status === 'lost');
  const open     = trades.filter(t => t.status !== 'won' && t.status !== 'lost');
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal      = Math.round((STARTING + totalPnl) * 10000) / 10000;
  const wr       = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';
  const pnlColor = totalPnl >= 0 ? GOLD : RED;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 120 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes goldPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>

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
                background: 'rgba(34,211,238,0.1)', border: `1px solid ${CYAN}44`,
                color: CYAN, letterSpacing: '0.1em' }}>
                ORACLE-LAG
              </span>
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                v3.1
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>
              {ts ? `Synced ${ts} · auto-refresh 10s` : 'Connecting to Akasha stream...'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD}
              style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none', display: 'block' }} />
          </button>
        </div>

        {/* ── RLS BLOCKED ALERT ── */}
        {rlsSt === 'blocked' && (
          <div style={{ ...glass({ padding: '18px 20px', borderColor: 'rgba(255,80,80,0.3)', background: 'rgba(255,40,40,0.04)',
            animation: 'shake 0.4s ease', marginBottom: 14 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={16} color={RED} />
              <span style={{ fontWeight: 800, fontSize: 12, color: RED, letterSpacing: '0.1em' }}>
                SUPABASE ACCESS BLOCKED
              </span>
              {httpCode && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.25)',
                color: RED, fontWeight: 700 }}>HTTP {httpCode}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, marginBottom: 14 }}>
              Row Level Security is blocking anon reads on <code style={{ color: GOLD, fontSize: 10 }}>bot_trades</code>.<br/>
              Run this in your <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Supabase SQL Editor</strong>{' '}
              (project <code style={{ color: CYAN, fontSize: 9 }}>fjdzhrdpioxdeyyfogep</code>):
            </div>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace', fontSize: 10,
              color: 'rgba(212,175,55,0.9)', lineHeight: 2.1, letterSpacing: '0.01em' }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, marginBottom: 6 }}>-- paste in SQL Editor → Run</div>
              <div>ALTER TABLE bot_trades ENABLE ROW LEVEL SECURITY;</div>
              <div>DROP POLICY IF EXISTS "anon_read_all" ON bot_trades;</div>
              <div>CREATE POLICY "anon_read_all" ON bot_trades</div>
              <div>&nbsp;&nbsp;FOR SELECT USING (true);</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 9, color: 'rgba(255,255,255,0.22)', lineHeight: 1.7 }}>
              After running, click the refresh button above. Trades will appear instantly.
            </div>
          </div>
        )}

        {/* ── STATUS BAR ── */}
        <div style={{ ...glass({ padding: '12px 18px', marginBottom: 12,
          borderColor: rlsSt === 'ok' ? `${GOLD}33` : rlsSt === 'blocked' ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.05)',
          background: rlsSt === 'ok' ? `${GOLD}05` : 'rgba(255,255,255,0.02)' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 10, height: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%',
                  background: rlsSt === 'ok' ? GOLD : rlsSt === 'blocked' ? RED : 'rgba(255,255,255,0.15)',
                  boxShadow: rlsSt === 'ok' ? `0 0 ${pulse ? 12 : 6}px ${GOLD}` : 'none',
                  transition: 'box-shadow 0.6s ease' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                color: rlsSt === 'ok' ? GOLD : rlsSt === 'blocked' ? RED : 'rgba(255,255,255,0.3)' }}>
                {rlsSt === 'ok' ? `ORACLE LIVE · ${trades.length} TRADES LOADED` :
                 rlsSt === 'blocked' ? 'SUPABASE BLOCKED — SEE ALERT ABOVE' :
                 'CONNECTING TO ORACLE...'}
              </span>
            </div>
            {rlsSt === 'ok' && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>
                BTC · ETH · SOL
              </span>
            )}
          </div>
        </div>

        {/* ── MODE FILTER ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['ALL', 'PAPER', 'LIVE'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '10px 6px', borderRadius: 16, cursor: 'pointer', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em',
                background: mode === m
                  ? m === 'PAPER' ? 'rgba(34,211,238,0.08)' : m === 'LIVE' ? `${GOLD}18` : 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${mode === m
                  ? m === 'PAPER' ? CYAN + '55' : m === 'LIVE' ? GOLD : 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.07)'}`,
                color: mode === m
                  ? m === 'PAPER' ? CYAN : m === 'LIVE' ? GOLD : 'rgba(255,255,255,0.8)'
                  : 'rgba(255,255,255,0.22)',
                transition: 'all 0.2s ease' }}>
              {m === 'PAPER' ? '◎ PAPER' : m === 'LIVE' ? '⚡ LIVE' : '∞ ALL'}
            </button>
          ))}
        </div>

        {/* ── BALANCE CARD ── */}
        {rlsSt === 'ok' && (
          <div style={{ ...glass({ padding: 22, borderColor: `${GOLD}22`, background: `${GOLD}06` }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={13} color={GOLD} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: `${GOLD}88` }}>
                {mode === 'LIVE' ? 'LIVE TRADING · POLYMARKET CLOB' :
                 mode === 'PAPER' ? 'PAPER SIMULATION · BINANCE ORACLE-LAG' :
                 'ALL TRADES · PAPER + LIVE'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>
                  BALANCE
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {[
                ['TRADES',  won.length + lost.length + open.length, GOLD ],
                ['WIN RATE', wr,                                      GOLD ],
                ['WINS',    won.length,                               GREEN],
                ['LOSSES',  lost.length,                              lost.length > 0 ? RED : 'rgba(255,255,255,0.2)'],
                ['OPEN',    open.length,                              CYAN],
              ].map(([l, v, c]) => (
                <div key={String(l)} style={{ background: 'rgba(0,0,0,0.28)', borderRadius: 14, padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.22)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: String(c), transition: 'color 0.4s' }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SIGNAL FEED ── */}
        <div style={{ ...glass({ overflow: 'hidden', marginBottom: 12 }) }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={13} color={CYAN} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>
                SIGNAL FEED · {mode}
              </span>
            </div>
            <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              {trades.length} TRADES
            </span>
          </div>

          {rlsSt === 'blocked' ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <AlertTriangle size={28} color="rgba(255,80,80,0.4)" style={{ margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 8 }}>
                Database Access Blocked
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
                Run the SQL fix shown above in Supabase,<br/>then click Refresh.
              </div>
            </div>
          ) : trades.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
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
                Awaiting First Delta Signal
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8 }}>
                {mode} mode · delta threshold 0.120%<br/>
                Fires on 5m + 15m candle windows<br/>
                Scanning BTC · ETH · SOL via Binance WebSocket
              </div>
            </div>
          ) : (
            trades.slice(0, 80).map((t, i) => {
              const win  = t.status === 'won';
              const loss = t.status === 'lost';
              const p    = parseFloat(t.pnl_usdc) || 0;
              const modeLabel = (t.mode ?? 'PAPER') as string;
              return (
                <div key={t.id ?? i}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    animation: i === 0 ? 'fadeUp 0.3s ease' : 'none',
                    background: i === 0 ? `${GOLD}05` : 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.asset ?? '?'}
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
                        padding: '1px 5px', borderRadius: 5, background: 'rgba(255,255,255,0.04)' }}>
                        {t.interval ?? '5m'}
                      </span>
                      {/* mode badge */}
                      <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 5, fontWeight: 700,
                        background: modeLabel === 'LIVE' ? `${GOLD}12` : 'rgba(34,211,238,0.08)',
                        color: modeLabel === 'LIVE' ? GOLD : CYAN,
                        border: `1px solid ${modeLabel === 'LIVE' ? GOLD+'30' : CYAN+'30'}` }}>
                        {modeLabel}
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

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Target size={10} color={`${GOLD}66`} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em' }}>
              BINANCE ORACLE-LAG ARBITRAGE · POLYMARKET CLOB · SUB-300MS EXECUTION
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
