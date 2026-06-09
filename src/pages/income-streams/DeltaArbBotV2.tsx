import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const GREEN = '#22c55e';
const RED   = '#ef4444';
const CYAN  = '#22D3EE';

const SB_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/delta_arb_trades';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';
const STARTING = 10;

export default function DeltaArbBotV2() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<any[]>([]);
  const [ts,     setTs]     = useState('');
  const [spin,   setSpin]   = useState(false);
  const [mode,   setMode]   = useState<'LIVE'|'PAPER'>('LIVE');

  const load = async () => {
    setSpin(true);
    try {
      const r = await fetch(
        `${SB_URL}?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,mode,created_at&order=created_at.desc&limit=10000&mode=eq.${mode}`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const data = await r.json();
      if (Array.isArray(data)) setTrades(data);
      setTs(new Date().toLocaleTimeString());
    } catch (_) {}
    setSpin(false);
  };

  useEffect(() => { load(); }, [mode]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [mode]);

  const won  = trades.filter(t => t.status === 'won');
  const lost = trades.filter(t => t.status === 'lost');
  const pnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal  = Math.round((STARTING + pnl) * 100) / 100;
  const pc   = pnl >= 0 ? GREEN : RED;
  const wr   = won.length + lost.length > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';

  const box = { borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 12 };

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 120 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight: 900, fontSize: 18, color: GOLD }}>DELTA-ARB BOT</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                background: mode === 'LIVE' ? `${RED}22` : 'rgba(255,255,255,0.08)',
                border: `1px solid ${mode === 'LIVE' ? RED : 'rgba(255,255,255,0.15)'}`,
                color: mode === 'LIVE' ? RED : 'rgba(255,255,255,0.5)' }}>
                {mode}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {ts ? `Updated ${ts} · auto-refreshes 10s` : 'Loading...'}
            </div>
          </div>
          <button onClick={load}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['LIVE', 'PAPER'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '10px', borderRadius: 16, cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em',
                background: mode === m ? (m === 'LIVE' ? `${RED}22` : `${GOLD}22`) : 'rgba(255,255,255,0.03)',
                border: `1px solid ${mode === m ? (m === 'LIVE' ? RED : GOLD) : 'rgba(255,255,255,0.08)'}`,
                color: mode === m ? (m === 'LIVE' ? RED : GOLD) : 'rgba(255,255,255,0.3)' }}>
              {m === 'LIVE' ? '🔴 LIVE MONEY' : '📄 PAPER SIM'}
            </button>
          ))}
        </div>

        {/* Balance Banner */}
        <div style={{ ...box, border: `1px solid ${pc}33`, background: `${pc}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: mode === 'LIVE' ? RED : GREEN,
              boxShadow: `0 0 8px ${mode === 'LIVE' ? RED : GREEN}` }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: mode === 'LIVE' ? RED : GREEN }}>
              {mode === 'LIVE' ? 'LIVE TRADING — REAL MONEY' : 'PAPER MODE — SIMULATION'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BALANCE</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, letterSpacing: '-0.03em', textShadow: `0 0 30px ${GOLD}44` }}>
                ${bal.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL P&L</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: pc }}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} USDC
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[['TRADES', won.length + lost.length, GOLD], ['WIN RATE', wr, GOLD], ['WINS', won.length, GREEN], ['LOSSES', lost.length, lost.length > 0 ? RED : 'rgba(255,255,255,0.2)']].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: String(c) }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Feed */}
        <div style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>⚡ TRADE FEED</span>
            <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>
              {trades.length} TRADES
            </span>
          </div>

          {trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
              {mode === 'LIVE'
                ? '⏳ Waiting for first live signal...\nBot is connected and monitoring BTC/ETH/SOL'
                : 'No paper trades yet'}
            </div>
          ) : trades.slice(0, 30).map((t, i) => {
            const win  = t.status === 'won';
            const loss = t.status === 'lost';
            const p    = parseFloat(t.pnl_usdc) || 0;
            const sc   = win ? GREEN : loss ? RED : CYAN;
            const time = t.created_at ? new Date(t.created_at).toLocaleTimeString() : '';
            return (
              <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    {t.asset ?? '?'} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>{t.interval ?? '15m'}</span>
                  </div>
                  <div style={{ fontSize: 10, marginTop: 2, display: 'flex', gap: 8 }}>
                    <span style={{ color: t.signal === 'UP' ? GREEN : RED, fontWeight: 700 }}>
                      {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>{t.delta}</span>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>{time}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                    background: `${sc}18`, color: sc, border: `1px solid ${sc}44` }}>
                    {win ? 'WIN' : loss ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4,
                    color: win ? GREEN : loss ? RED : 'rgba(255,255,255,0.3)' }}>
                    {win || loss ? `${p >= 0 ? '+' : ''}${p.toFixed(4)}` : `$${parseFloat(t.size_usd || 0).toFixed(2)} bet`}
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
