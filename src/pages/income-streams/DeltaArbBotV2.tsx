import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Zap, TrendingUp, Activity } from 'lucide-react';

const GOLD  = '#D4AF37';
const BG    = '#050505';
const CYAN  = '#22D3EE';
const GREEN = '#22c55e';
const RED   = '#ef4444';

const URL   = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/delta_arb_trades';
const KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDQwMDMsImV4cCI6MjA5MzY4MDAwM30.Mkbodv6uEb1yMKA0UIKMzm-cFWfcgNFXr-LLGtqoNcg';

export default function DeltaArbBotV2() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<any[]>([]);
  const [status, setStatus] = useState('Loading...');
  const [ts, setTs]         = useState('');
  const [spin, setSpin]     = useState(false);

  const load = async () => {
    setSpin(true);
    try {
      const r = await fetch(`${URL}?select=*&order=created_at.desc&limit=200`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
      });
      const txt = await r.text();
      if (r.ok) {
        const data = JSON.parse(txt);
        setTrades(data);
        setStatus(`OK ${r.status} — ${data.length} rows`);
      } else {
        setStatus(`ERROR ${r.status}: ${txt.slice(0,100)}`);
      }
      setTs(new Date().toLocaleTimeString());
    } catch(e: any) {
      setStatus(`CATCH: ${e.message}`);
    }
    setSpin(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  const won  = trades.filter(t => t.status === 'won');
  const lost = trades.filter(t => t.status === 'lost');
  const pnl  = trades.reduce((s, t) => s + (parseFloat(t.pnl_usdc) || 0), 0);
  const bal  = 100 + pnl;
  const pc   = pnl >= 0 ? GREEN : RED;
  const wr   = (won.length + lost.length) > 0
    ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) + '%'
    : '—';

  const g = { borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 12 };

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#fff', paddingBottom: 100 }}>
      <div style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => navigate('/income-streams')}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:10, cursor:'pointer' }}>
            <ArrowLeft size={18} color={GOLD} />
          </button>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Zap size={18} color={CYAN} />
              <span style={{ fontWeight:900, fontSize:18, color:GOLD, letterSpacing:'-0.03em' }}>DELTA-ARB BOT</span>
              <span style={{ fontSize:9, fontWeight:800, color:CYAN, border:`1px solid ${CYAN}55`, borderRadius:99, padding:'2px 8px' }}>PAPER</span>
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
              {ts ? `Updated ${ts}` : 'Loading...'}
            </div>
          </div>
          <button onClick={load} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:10, cursor:'pointer' }}>
            <RefreshCw size={15} color={GOLD} style={{ animation: spin ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Debug status — always visible */}
        <div style={{ marginBottom:12, padding:'8px 14px', background:'rgba(255,255,255,0.03)', borderRadius:16, fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>
          {status}
        </div>

        {/* Balance */}
        <div style={{ ...g, borderColor:`${pc}33`, background:`${pc}06` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:GREEN, boxShadow:`0 0 6px ${GREEN}` }} />
            <span style={{ fontSize:10, fontWeight:800, color:GREEN, letterSpacing:'0.15em' }}>LIVE · PAPER MODE</span>
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'flex-end', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', marginBottom:4 }}>BALANCE</div>
              <div style={{ fontSize:38, fontWeight:900, color:GOLD, letterSpacing:'-0.04em', textShadow:`0 0 24px ${GOLD}44` }}>
                ${bal.toFixed(2)}
              </div>
            </div>
            <div style={{ paddingBottom:4 }}>
              <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', marginBottom:4 }}>TOTAL P&L</div>
              <div style={{ fontSize:22, fontWeight:900, color:pc }}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { l:'TRADES',   v: won.length + lost.length, c: GOLD  },
              { l:'WIN RATE', v: wr,                        c: GOLD  },
              { l:'WINS',     v: won.length,                c: GREEN },
              { l:'LOSSES',   v: lost.length,               c: lost.length > 0 ? RED : 'rgba(255,255,255,0.3)' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background:'rgba(0,0,0,0.35)', borderRadius:14, padding:'10px 6px', textAlign:'center' }}>
                <div style={{ fontSize:7, fontWeight:700, letterSpacing:'0.15em', color:'rgba(255,255,255,0.25)', marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:15, fontWeight:900, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trades */}
        <div style={{ ...g, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={14} color={GOLD} />
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', color:'rgba(255,255,255,0.4)' }}>TRADE FEED</span>
            <span style={{ marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,0.2)' }}>{trades.length} trades</span>
          </div>
          {trades.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:12 }}>
              {spin ? 'Loading...' : 'No trades yet'}
            </div>
          ) : trades.map((t, i) => {
            const isWon  = t.status === 'won';
            const isLost = t.status === 'lost';
            const sc  = isWon ? GREEN : isLost ? RED : CYAN;
            const pv  = parseFloat(t.pnl_usdc) || 0;
            return (
              <div key={t.id ?? i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 20px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:13, color:'rgba(255,255,255,0.85)' }}>
                    {t.asset}<span style={{ fontSize:10, fontWeight:400, color:'rgba(255,255,255,0.3)', marginLeft:6 }}>{t.interval ?? '15m'}</span>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color: t.signal === 'UP' ? GREEN : RED, marginTop:2 }}>
                    {t.signal === 'UP' ? '▲' : '▼'} {t.signal}
                    <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:400, marginLeft:6 }}>{t.delta}</span>
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginTop:2 }}>
                    {new Date(t.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:99, background:`${sc}15`, color:sc, border:`1px solid ${sc}40` }}>
                    {isWon ? 'WIN' : isLost ? 'LOSS' : 'OPEN'}
                  </span>
                  <div style={{ fontSize:13, fontWeight:900, color: pv >= 0 ? GREEN : RED, marginTop:4 }}>
                    {isWon || isLost ? `${pv >= 0 ? '+' : ''}$${pv.toFixed(2)}` : `$${parseFloat(t.size_usd||0).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div style={g}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <TrendingUp size={14} color={GOLD} />
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', color:'rgba(255,255,255,0.35)' }}>HOW IT WORKS</span>
          </div>
          {[
            ['⚡','Binance WebSocket streams BTC/ETH/SOL at sub-50ms'],
            ['📐','Bot detects 0.12%+ price movement — direction locked'],
            ['🎯','Polymarket oracle still shows 50/50 for 10-30 seconds'],
            ['💰','Bot buys winning token at $0.50-$0.58 entry'],
            ['🏆','Token resolves at $1.00 — 74-92% win rate'],
          ].map(([icon,text]) => (
            <div key={String(text)} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
