import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EDGE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';

export default function ShreemBrzeePerformance() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [tab, setTab] = useState<'home' | 'trades' | 'signals'>('home');
  const [startSOL, setStartSOL] = useState('2');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadSession() {
    try {
      const r = await fetch(`${EDGE}/session`);
      if (r.ok) { const d = await r.json(); setSession(d); }
    } catch {}
  }

  async function loadTrades() {
    const { data } = await (supabase as any)
      .from('shreem_brzee_paper_trades')
      .select('*').order('created_at', { ascending: false }).limit(30);
    setTrades(data || []);
  }

  async function loadSignals() {
    const { data } = await (supabase as any)
      .from('shreem_brzee_signals')
      .select('*').order('created_at', { ascending: false }).limit(20);
    setSignals(data || []);
  }

  useEffect(() => {
    loadSession(); loadTrades(); loadSignals();
    const t = setInterval(() => { loadSession(); loadTrades(); loadSignals(); }, 10000);
    return () => clearInterval(t);
  }, []);

  async function startSession() {
    setBusy(true); setMsg('');
    const sol = parseFloat(startSOL) || 2;
    try {
      // Clear old trades
      await (supabase as any).from('shreem_brzee_paper_trades').delete().neq('id', 0);
      // Create new session
      await fetch(`${EDGE}/paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          session: { portfolio: sol, start_balance: sol, positions: {}, total_pnl: 0, wins: 0, losses: 0, started_at: new Date().toISOString() }
        })
      });
      await loadSession(); await loadTrades();
      setMsg(`✅ Session started with ${sol} SOL!`);
    } catch (e) { setMsg('❌ Error starting session'); }
    setBusy(false);
  }

  async function testSignal() {
    if (!session) { setMsg('Start a session first!'); return; }
    setBusy(true); setMsg('Injecting test BUY...');
    try {
      await (supabase as any).from('shreem_brzee_signals').insert({
        sig: 'TEST_' + Date.now(),
        wallet: '5tzFkiKscXHK5ZXCGbGuPbCLNqLJnEUPs3EBGzSdAFkF',
        label: 'Remusofmars',
        action: 'BUY',
        mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        symbol: 'POPCAT',
        amount_sol: 1.5,
        token_amount: 50000,
        is_pump_fun: false,
        block_time: Math.floor(Date.now() / 1000),
      });
      setTimeout(async () => {
        await loadSession(); await loadTrades(); await loadSignals();
        setMsg('✅ Test BUY injected — check Trades tab!');
        setBusy(false);
      }, 3000);
    } catch { setMsg('❌ Error'); setBusy(false); }
  }

  const pnl = session?.total_pnl || 0;
  const bal = session?.portfolio || 0;
  const start = session?.start_balance || 0;
  const pct = start > 0 ? ((pnl / start) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer', marginBottom: 12 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 30 }}>🔱</span>
          <div>
            <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 2 }}>Solana Copy Bot</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#D4AF37' }}>Shreem Brzee Bot</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['home', 'trades', 'signals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
              background: tab === t ? '#D4AF37' : 'rgba(255,255,255,0.07)',
              color: tab === t ? '#000' : 'rgba(255,255,255,0.5)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* HOME TAB */}
        {tab === 'home' && (
          <div>

            {/* Balance card */}
            <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              {session ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Your Balance</div>
                    <div style={{ fontSize: 44, fontWeight: 900, color: '#D4AF37' }}>{bal.toFixed(3)}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>SOL</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>P&L</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: pnl >= 0 ? '#4ADE80' : '#F87171' }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(3)}
                      </div>
                      <div style={{ fontSize: 10, color: pnl >= 0 ? '#4ADE80' : '#F87171' }}>{pct}%</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Wins</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{session.wins || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Losses</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#F87171' }}>{session.losses || 0}</div>
                    </div>
                  </div>

                  {/* Open positions */}
                  {Object.keys(session.positions || {}).length > 0 && (
                    <div style={{ marginTop: 16, padding: '12px', background: 'rgba(34,211,238,0.06)', borderRadius: 12, border: '1px solid rgba(34,211,238,0.15)' }}>
                      <div style={{ fontSize: 10, color: '#22D3EE', letterSpacing: 2, marginBottom: 8 }}>OPEN POSITIONS</div>
                      {Object.values(session.positions).map((p: any) => (
                        <div key={p.mint} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ fontWeight: 700 }}>{p.symbol}</span>
                          <span style={{ color: '#888' }}>{p.entrySOL?.toFixed(4)} SOL</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔱</div>
                  <div style={{ fontSize: 16, color: '#888' }}>No active session</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Set your SOL below and start</div>
                </div>
              )}
            </div>

            {/* Start / Reset */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 12, fontWeight: 600 }}>
                {session ? '🔄 Reset with new balance' : '▶ Start Paper Trading'}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>Starting Balance (SOL)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {['1', '2', '5', '10'].map(v => (
                    <button key={v} onClick={() => setStartSOL(v)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      background: startSOL === v ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                      color: startSOL === v ? '#D4AF37' : '#888',
                    }}>{v}</button>
                  ))}
                </div>
                <input
                  type="number" value={startSOL} onChange={e => setStartSOL(e.target.value)}
                  min="0.1" step="0.1"
                  style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <button onClick={startSession} disabled={busy} style={{
                width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                background: busy ? '#333' : '#D4AF37', color: busy ? '#666' : '#000', fontSize: 15, fontWeight: 800,
              }}>
                {busy ? 'Please wait...' : session ? `↺ Reset with ${startSOL} SOL` : `▶ Start with ${startSOL} SOL`}
              </button>
            </div>

            {/* Test signal */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 600 }}>⚡ Test the Bot</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 14, lineHeight: 1.6 }}>
                Inject a fake whale trade to instantly see the bot execute a paper trade — no real money needed.
              </div>
              <button onClick={testSignal} disabled={busy || !session} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none',
                cursor: (busy || !session) ? 'not-allowed' : 'pointer',
                background: (busy || !session) ? '#1a1a1a' : 'rgba(34,211,238,0.12)',
                color: (busy || !session) ? '#444' : '#22D3EE', fontSize: 14, fontWeight: 800,
              }}>
                {!session ? 'Start a session first' : busy ? 'Working...' : '⚡ Inject Test Trade'}
              </button>
            </div>

            {msg && (
              <div style={{ background: msg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${msg.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: msg.startsWith('✅') ? '#4ADE80' : '#F87171', textAlign: 'center' }}>
                {msg}
              </div>
            )}
          </div>
        )}

        {/* TRADES TAB */}
        {tab === 'trades' && (
          <div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>{trades.length} paper trades recorded</div>
            {trades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#555' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <div>No trades yet — inject a test signal on the Home tab</div>
              </div>
            ) : trades.map((t: any) => (
              <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, borderLeft: `4px solid ${t.failed ? '#555' : t.action === 'BUY' ? '#4ADE80' : t.pnl_sol >= 0 ? '#4ADE80' : '#F87171'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, marginRight: 8, background: t.action === 'BUY' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: t.action === 'BUY' ? '#4ADE80' : '#F87171' }}>{t.failed ? 'FAILED' : t.action}</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{t.symbol || '?'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {t.action === 'SELL' && !t.failed && (
                      <div style={{ fontWeight: 800, color: t.pnl_sol >= 0 ? '#4ADE80' : '#F87171' }}>
                        {t.pnl_sol >= 0 ? '+' : ''}{t.pnl_sol?.toFixed(4)} SOL
                      </div>
                    )}
                    {t.action === 'BUY' && !t.failed && (
                      <div style={{ color: '#888' }}>{t.gross_sol?.toFixed(4)} SOL</div>
                    )}
                    <div style={{ fontSize: 11, color: '#555' }}>bal: {t.portfolio_after?.toFixed(3)} SOL</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SIGNALS TAB */}
        {tab === 'signals' && (
          <div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>{signals.length} whale signals captured</div>
            {signals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#555' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🐋</div>
                <div style={{ marginBottom: 8 }}>Watching 21 whale wallets 24/7</div>
                <div style={{ fontSize: 12 }}>Signals appear here the moment a whale swaps</div>
              </div>
            ) : signals.map((s: any) => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, borderLeft: `4px solid ${s.action === 'BUY' ? '#4ADE80' : '#F87171'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, marginRight: 8, background: s.action === 'BUY' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: s.action === 'BUY' ? '#4ADE80' : '#F87171' }}>{s.action}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#D4AF37' }}>{s.symbol || s.mint?.slice(0, 8)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s.amount_sol && <div style={{ fontWeight: 700 }}>{s.amount_sol.toFixed(3)} SOL</div>}
                    <div style={{ fontSize: 11, color: '#555' }}>{s.label}</div>
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
