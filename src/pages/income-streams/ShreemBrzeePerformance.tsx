import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const G = '#D4AF37';
const BLK = '#050505';
const GRN = '#4ADE80';
const RED = '#F87171';
const CYN = '#22D3EE';

const glass = (extra = {}): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
  ...extra,
});

const micro: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: '0.4em',
  textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)',
};

interface Signal { id:number; sig:string; label:string; action:'BUY'|'SELL'; mint:string; symbol?:string; amount_sol?:number; is_pump_fun?:boolean; block_time?:number; created_at:string; }
interface Session { portfolio:number; start_balance:number; total_pnl:number; wins:number; losses:number; positions:Record<string,any>; }
interface Trade { id:number; symbol:string; action:string; gross_sol:number; pnl_sol:number; failed:boolean; portfolio_after:number; created_at:string; }

const EDGE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';

export default function ShreemBrzeePerformance() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'paper'|'signals'|'trades'>( 'paper');
  const [session, setSession] = useState<Session|null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [startSOL, setStartSOL] = useState('2');
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [testBuying, setTestBuying] = useState(false);

  // Load session from edge function
  const loadSession = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE}/session`);
      const data = await r.json();
      setSession(data);
    } catch {}
  }, []);

  // Load signals
  const loadSignals = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('shreem_brzee_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setSignals(data || []);
  }, []);

  // Load paper trades
  const loadTrades = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('shreem_brzee_paper_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setTrades(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSession(), loadSignals(), loadTrades()]);
    setLoading(false);
  }, [loadSession, loadSignals, loadTrades]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime — update when new signal or trade comes in
  useEffect(() => {
    const ch1 = supabase.channel('shreem_sig')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'shreem_brzee_signals' }, () => { loadSignals(); loadSession(); })
      .subscribe();
    const ch2 = supabase.channel('shreem_trd')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'shreem_brzee_paper_trades' }, () => { loadTrades(); loadSession(); })
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [loadSignals, loadTrades, loadSession]);

  // Start / reset paper session
  const resetSession = async () => {
    setResetting(true);
    const sol = parseFloat(startSOL) || 2;
    try {
      await fetch(`${EDGE}/paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          session: { portfolio: sol, start_balance: sol, positions: {}, total_pnl: 0, wins: 0, losses: 0, started_at: new Date().toISOString() }
        })
      });
      // Also clear old paper trades
      await (supabase as any).from('shreem_brzee_paper_trades').delete().neq('id', 0);
      await loadAll();
    } catch(e) { console.error(e); }
    setResetting(false);
  };

  // Inject a test BUY signal manually so paper trading works immediately
  const injectTestSignal = async () => {
    setTestBuying(true);
    try {
      const testSignal = {
        sig: 'TEST_' + Date.now(),
        wallet: '5tzFkiKscXHK5ZXCGbGuPbCLNqLJnEUPs3EBGzSdAFkF',
        label: 'Remusofmars',
        action: 'BUY',
        mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        symbol: 'POPCAT',
        amount_sol: 1.5,
        token_amount: 50000,
        is_pump_fun: false,
        block_time: Math.floor(Date.now()/1000),
      };
      await (supabase as any).from('shreem_brzee_signals').insert(testSignal);
      setTimeout(() => { loadAll(); setTestBuying(false); }, 2000);
    } catch(e) { setTestBuying(false); }
  };

  const timeAgo = (ts: string|number) => {
    const ms = typeof ts === 'number' ? ts*1000 : new Date(ts).getTime();
    const m = Math.floor((Date.now()-ms)/60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  const pnlColor = (v: number) => v > 0 ? GRN : v < 0 ? RED : 'rgba(255,255,255,0.5)';
  const openCount = session ? Object.keys(session.positions || {}).length : 0;
  const pnlPct = session && session.start_balance > 0
    ? ((session.total_pnl / session.start_balance) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{ minHeight:'100vh', background:BLK, color:'#fff', fontFamily:"'Plus Jakarta Sans', sans-serif", paddingBottom:100 }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 0' }}>
        <button onClick={() => navigate(-1)}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:22, cursor:'pointer', padding:0, marginBottom:16 }}>←</button>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ fontSize:28 }}>🔱</div>
          <div style={{ flex:1 }}>
            <p style={{ ...micro, color:'rgba(212,175,55,0.6)', marginBottom:3 }}>SQI 2050 · SOLANA COPY BOT</p>
            <h1 style={{ fontSize:20, fontWeight:900, color:G, letterSpacing:'-0.04em', margin:0 }}>Shreem Brzee Bot</h1>
          </div>
          <button onClick={loadAll} style={{ background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', color:CYN, borderRadius:10, padding:'8px 12px', fontSize:10, fontWeight:800, letterSpacing:'0.15em', cursor:'pointer' }}>↻</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {(['paper','signals','trades'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'9px 16px', borderRadius:12, fontSize:9, fontWeight:800, letterSpacing:'0.2em',
              cursor:'pointer', textTransform:'uppercase' as const,
              background: tab===t ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
              border:`1px solid ${tab===t ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: tab===t ? G : 'rgba(255,255,255,0.4)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 20px' }}>

        {/* ── PAPER TAB ─────────────────────────────────── */}
        {tab === 'paper' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Portfolio card */}
            <div style={glass({ padding:24 })}>
              <p style={{ ...micro, marginBottom:12 }}>Paper Portfolio</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div style={{ textAlign:'center', padding:'12px 0' }}>
                  <p style={{ ...micro, marginBottom:4 }}>Balance</p>
                  <p style={{ fontSize:28, fontWeight:900, color:G, margin:0 }}>
                    {session ? session.portfolio.toFixed(3) : '—'}
                  </p>
                  <p style={{ ...micro, color:'rgba(255,255,255,0.25)', marginTop:4 }}>SOL</p>
                </div>
                <div style={{ textAlign:'center', padding:'12px 0' }}>
                  <p style={{ ...micro, marginBottom:4 }}>Total P&L</p>
                  <p style={{ fontSize:28, fontWeight:900, color: session ? pnlColor(session.total_pnl) : 'rgba(255,255,255,0.4)', margin:0 }}>
                    {session ? (session.total_pnl >= 0 ? '+' : '') + session.total_pnl.toFixed(3) : '—'}
                  </p>
                  <p style={{ ...micro, color:'rgba(255,255,255,0.25)', marginTop:4 }}>{pnlPct}%</p>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
                {[
                  { label:'W / L', value: session ? `${session.wins} / ${session.losses}` : '— / —' },
                  { label:'OPEN', value: openCount, color: openCount > 0 ? CYN : undefined },
                  { label:'START', value: session ? `${session.start_balance} SOL` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'10px 0', textAlign:'center' }}>
                    <p style={{ ...micro, marginBottom:4 }}>{s.label}</p>
                    <p style={{ fontSize:13, fontWeight:900, color: s.color || 'rgba(255,255,255,0.7)', margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Open positions */}
              {openCount > 0 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ ...micro, marginBottom:8 }}>Open Positions</p>
                  {Object.values(session?.positions || {}).map((pos: any) => (
                    <div key={pos.mint} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:G }}>{pos.symbol}</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{pos.entrySOL?.toFixed(4)} SOL in</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start / Reset session */}
            <div style={glass({ padding:20 })}>
              <p style={{ ...micro, marginBottom:12 }}>
                {session ? 'Reset Paper Session' : 'Start Paper Trading'}
              </p>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <p style={{ ...micro, marginBottom:6 }}>Starting Balance (SOL)</p>
                  <input
                    type="number"
                    value={startSOL}
                    onChange={e => setStartSOL(e.target.value)}
                    min="0.1" max="100" step="0.1"
                    style={{
                      width:'100%', padding:'12px 14px', borderRadius:12,
                      background:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,175,55,0.3)',
                      color:'#fff', fontSize:16, fontWeight:700, boxSizing:'border-box' as const,
                      outline:'none',
                    }}
                  />
                </div>
              </div>
              <button onClick={resetSession} disabled={resetting} style={{
                width:'100%', padding:'14px', borderRadius:14, cursor: resetting ? 'not-allowed' : 'pointer',
                background: resetting ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.15)',
                border:'1px solid rgba(212,175,55,0.4)', color:G,
                fontSize:11, fontWeight:800, letterSpacing:'0.2em',
              }}>
                {resetting ? 'STARTING...' : session ? `↺ RESET WITH ${parseFloat(startSOL)||2} SOL` : `▶ START WITH ${parseFloat(startSOL)||2} SOL`}
              </button>
            </div>

            {/* Test signal inject */}
            <div style={glass({ padding:20 })}>
              <p style={{ ...micro, marginBottom:6 }}>Test Paper Trading Now</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:12, lineHeight:1.6 }}>
                Inject a test BUY signal (Remusofmars buying POPCAT 1.5 SOL) to see the paper engine execute a trade immediately — no need to wait for a real whale swap.
              </p>
              <button onClick={injectTestSignal} disabled={testBuying || !session} style={{
                width:'100%', padding:'13px', borderRadius:14,
                cursor: (testBuying || !session) ? 'not-allowed' : 'pointer',
                background: (testBuying || !session) ? 'rgba(255,255,255,0.04)' : 'rgba(34,211,238,0.1)',
                border:`1px solid ${(testBuying || !session) ? 'rgba(255,255,255,0.08)' : 'rgba(34,211,238,0.3)'}`,
                color: (testBuying || !session) ? 'rgba(255,255,255,0.3)' : CYN,
                fontSize:11, fontWeight:800, letterSpacing:'0.2em',
              }}>
                {testBuying ? 'INJECTING...' : !session ? 'START SESSION FIRST' : '⚡ INJECT TEST SIGNAL'}
              </button>
            </div>
          </div>
        )}

        {/* ── SIGNALS TAB ───────────────────────────────── */}
        {tab === 'signals' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <p style={{ ...micro }}>Live Whale Signals</p>
              <p style={{ ...micro, color:'rgba(255,255,255,0.25)' }}>{signals.length} total</p>
            </div>

            {loading ? (
              <div style={{ ...glass(), padding:40, textAlign:'center', color:'rgba(255,255,255,0.3)'  }}>Loading...</div>
            ) : signals.length === 0 ? (
              <div style={{ ...glass(), padding:40, textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔱</div>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, fontWeight:600, marginBottom:8 }}>Watching 21 whale wallets</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>Signals appear here the moment a whale swaps on Solana</p>
                <p style={{ ...micro, color:'rgba(212,175,55,0.5)', marginTop:16 }}>Helius webhook active</p>
              </div>
            ) : signals.map(s => (
              <div key={s.id} style={{ ...glass(), borderLeft:`3px solid ${s.action==='BUY' ? GRN : RED}`, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.15em', padding:'3px 8px', borderRadius:99,
                      color: s.action==='BUY' ? GRN : RED,
                      background: s.action==='BUY' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      border:`1px solid ${s.action==='BUY' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`
                    }}>{s.action}</span>
                    <span style={{ fontSize:13, fontWeight:900, color:G }}>{s.symbol || s.mint.slice(0,8)+'…'}</span>
                    {s.is_pump_fun && <span style={{ fontSize:8, color:'rgba(168,85,247,0.7)', fontWeight:700 }}>pump.fun</span>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {s.amount_sol ? <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>{s.amount_sol.toFixed(3)} SOL</p> : null}
                    <p style={{ ...micro, color:'rgba(255,255,255,0.25)', margin:0 }}>{timeAgo(s.block_time||s.created_at)}</p>
                  </div>
                </div>
                <p style={{ ...micro, color:'rgba(255,255,255,0.35)', margin:'6px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TRADES TAB ───────────────────────────────── */}
        {tab === 'trades' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <p style={{ ...micro }}>Paper Trade History</p>
              <p style={{ ...micro, color:'rgba(255,255,255,0.25)' }}>{trades.length} trades</p>
            </div>

            {trades.length === 0 ? (
              <div style={{ ...glass(), padding:40, textAlign:'center' }}>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>No paper trades yet</p>
                <p style={{ color:'rgba(255,255,255,0.25)', fontSize:11, marginTop:6 }}>Start a session and inject a test signal</p>
              </div>
            ) : trades.map(t => (
              <div key={t.id} style={{ ...glass(), padding:'12px 16px',
                borderLeft:`3px solid ${t.failed ? 'rgba(255,255,255,0.2)' : t.action==='BUY' ? GRN : pnlColor(t.pnl_sol)}`
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.15em', padding:'3px 8px', borderRadius:99,
                      color: t.failed ? 'rgba(255,255,255,0.3)' : t.action==='BUY' ? GRN : pnlColor(t.pnl_sol),
                      background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'
                    }}>{t.failed ? 'FAILED' : t.action}</span>
                    <span style={{ fontSize:13, fontWeight:900, color:G }}>{t.symbol || '?'}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {t.action==='SELL' && !t.failed && (
                      <p style={{ fontSize:13, fontWeight:700, color:pnlColor(t.pnl_sol), margin:'0 0 2px' }}>
                        {t.pnl_sol >= 0 ? '+' : ''}{t.pnl_sol?.toFixed(4)} SOL
                      </p>
                    )}
                    {t.action==='BUY' && !t.failed && (
                      <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', margin:'0 0 2px' }}>
                        {t.gross_sol?.toFixed(4)} SOL in
                      </p>
                    )}
                    <p style={{ ...micro, color:'rgba(255,255,255,0.25)', margin:0 }}>
                      bal: {t.portfolio_after?.toFixed(3)} SOL
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
