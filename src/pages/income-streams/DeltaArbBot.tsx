import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GOLD = '#D4AF37';
const BG   = '#050505';
const GREEN = '#22c55e';
const RED   = '#ef4444';
const CYAN  = '#22D3EE';

// v2
export default function DeltaArbBot() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<any[]>([]);
  const [tick, setTick]     = useState(0);
  const [time,   setTime]   = useState('');
  const [debug,  setDebug]  = useState('loading...');

  useEffect(() => {
    let cancelled = false;
    // Use proxy edge function — same pattern as CLAWBOT page (no auth needed)
    const PROXY = 'https://fjdzhrdpioxdeyyfogep.supabase.co/functions/v1/delta-arb-proxy';
    fetch(`${PROXY}?endpoint=trades&limit=200`, {
      headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40' }
    })
      .then(r => { setDebug('HTTP:' + r.status); return r.json(); })
      .then(data => {
        if (!cancelled) {
          const arr = Array.isArray(data) ? data : [];
          setTrades(arr);
          setTime(new Date().toLocaleTimeString());
          setDebug(arr.length + ' trades loaded');
        }
      })
      .catch(e => {
        // Fallback: direct Supabase
        fetch('https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/delta_arb_trades?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,created_at&order=created_at.desc&limit=200', {
          headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40', Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzE5NDUsImV4cCI6MjA2MDMwNzk0NX0.HrUmzMBqNShHi0G9VDtHrZSHCIMoaYGC6lJUCrDWk40' }
        })
          .then(r => r.json())
          .then(data => { if (!cancelled) { setTrades(Array.isArray(data) ? data : []); setDebug('fallback:' + (Array.isArray(data) ? data.length : 0)); } })
          .catch(() => { if (!cancelled) setDebug('ERR:' + e.message?.slice(0,15)); });
      });
    return () => { cancelled = true; };
  }, [tick]);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const won  = trades.filter(t => t.status === 'won');
  const lost = trades.filter(t => t.status === 'lost');
  const pnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal  = Math.round((100 + pnl) * 100) / 100;
  const wr   = won.length + lost.length > 0 ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) : '—';
  const pc   = pnl >= 0 ? GREEN : RED;

  const g = (s: string) => ({ borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', [s]: s });
  const box = { borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 120 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/income-streams')} style={{ ...box, padding: 10, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: GOLD, letterSpacing: '-0.03em' }}>⚡ DELTA-ARB BOT</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Binance → Polymarket · refreshes every 10s · {time}</div>
          </div>
          <button onClick={() => setTick(t => t + 1)} style={{ ...box, padding: 10, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </button>
        </div>

        {/* Balance Banner */}
        <div style={{ ...box, padding: 20, marginBottom: 12, borderColor: `${pc}44`, background: `${pc}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>PAPER MODE — LIVE</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>PAPER</span>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BALANCE</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: GOLD, letterSpacing: '-0.03em', textShadow: `0 0 30px ${GOLD}44` }}>${bal.toFixed(2)}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>TOTAL P&L</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: pc }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDC</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[['TRADES', won.length + lost.length, GOLD], ['WIN RATE', wr === '—' ? '—' : `${wr}%`, GOLD], ['WINS', won.length, GREEN], ['LOSSES', lost.length, lost.length > 0 ? RED : 'rgba(255,255,255,0.2)']].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: String(c) }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Feed */}
        <div style={{ ...box, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>⚡ LIVE TRADE FEED</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }}>{trades.length} TOTAL</span>
          </div>
          {trades.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
              Waiting for first signal… Bot fires when delta ≥ 0.12%
            </div>
          ) : trades.slice(0, 25).map((t, i) => {
            const win  = t.status === 'won';
            const loss = t.status === 'lost';
            const open = !win && !loss;
            const p    = parseFloat(t.pnl_usdc) || 0;
            const sc   = win ? GREEN : loss ? RED : CYAN;
            return (
              <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    {t.asset ?? '?'} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>{t.interval ?? '15m'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: t.signal === 'UP' ? GREEN : RED, fontWeight: 700, marginTop: 2 }}>
                    {t.signal === 'UP' ? '▲' : '▼'} {t.signal} <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>{t.delta}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 99, background: `${sc}18`, color: sc, border: `1px solid ${sc}44` }}>
                    {win ? 'WIN' : loss ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 900, color: open ? 'rgba(255,255,255,0.3)' : p >= 0 ? GREEN : RED, marginTop: 4 }}>
                    {open ? `$${parseFloat(t.size_usd||0).toFixed(2)} bet` : `${p >= 0 ? '+' : ''}${p.toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Strategy Info */}
        <div style={{ ...box, padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>ACTIVE STRATEGY</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: GOLD, marginBottom: 4 }}>AGGRESSIVE</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            15% position per trade · Compounding · 0.12% delta threshold<br />
            Entry at $0.50–0.58 · Kill switch at −25% session loss
          </div>
        </div>

      </div>
    </div>
  );
}
