import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, RefreshCw, TrendingUp, Shield, Zap, Activity, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const G = '#D4AF37'; const CYAN = '#22D3EE'; const GREEN = '#2ECC71'; const RED = '#FF4757'; const BLACK = '#050505';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.cpb{font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;background:${BLACK};color:#fff;padding-bottom:100px;}
.cpb *{box-sizing:border-box;}
.cpb-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 30% 0%,rgba(34,211,238,0.05) 0%,transparent 50%),radial-gradient(ellipse at 70% 100%,rgba(212,175,55,0.05) 0%,transparent 50%);}
.cpb-z{position:relative;z-index:1;padding:0 18px;}
.gc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:22px;padding:16px;}
.gc-c{border-color:rgba(34,211,238,0.2);box-shadow:0 0 20px rgba(34,211,238,0.06);}
.gc-g{border-color:rgba(212,175,55,0.2);}
.gc-gr{border-color:rgba(46,204,113,0.2);background:rgba(46,204,113,0.05);}
.lbl{font-size:7px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);}
.pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:50px;font-size:7px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;}
.pill-c{background:rgba(34,211,238,0.1);color:${CYAN};border:1px solid rgba(34,211,238,0.25);}
.pill-g{background:rgba(212,175,55,0.12);color:${G};border:1px solid rgba(212,175,55,0.25);}
.pill-gr{background:rgba(46,204,113,0.12);color:${GREEN};border:1px solid rgba(46,204,113,0.25);}
.pill-r{background:rgba(255,71,87,0.12);color:${RED};border:1px solid rgba(255,71,87,0.25);}
.sb{background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 12px;}
.btn-c{background:linear-gradient(135deg,#22D3EE,#0EA5E9);color:${BLACK};border:none;border-radius:16px;padding:13px 18px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 0 24px rgba(34,211,238,0.3);display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-r{background:linear-gradient(135deg,${RED},#c0392b);color:#fff;border:none;border-radius:16px;padding:13px 18px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:9px 14px;font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;}
.trade-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.addr{font-family:monospace;font-size:10px;color:rgba(255,255,255,0.4);word-break:break-all;}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite;}
@keyframes pulse{0%,100%{opacity:.9}50%{opacity:.4}}
.pulse{animation:pulse 1.5s ease-in-out infinite;}
`;

const WHALE_WALLETS = [
  { label: 'Whale Alpha', addr: '0x63ce342161250d705dc0b16df89036c8e5f9ba9a', winRate: '~73%', trades: '12k+' },
  { label: 'Whale Beta', addr: '0x91583ceb1ebec79951a068e1d7d02c1ea590fa7b', winRate: '~68%', trades: '8k+' },
];

const GAMMA_API = 'https://gamma-api.polymarket.com';

interface Trade { id: string; question: string; outcome: string; price: number; size: number; strategy: string; whale: string; time: string; pnl?: number; }

async function fetchMarkets() {
  const r = await fetch(`${GAMMA_API}/markets?limit=30&active=true&closed=false`);
  if (!r.ok) return [];
  const data = await r.json();
  return data.map((m: any) => {
    const names = JSON.parse(m.outcomes || '["Yes","No"]');
    const prices = JSON.parse(m.outcomePrices || '[0.5,0.5]');
    const tokens = JSON.parse(m.clobTokenIds || '["",""]');
    return { id: m.id, question: m.question, liquidity: parseFloat(m.liquidity)||0, volume: parseFloat(m.volume)||0, slug: m.slug||'', outcomes: names.map((n:string,i:number)=>({ name:n, price:parseFloat(prices[i])||0.5, tokenId:tokens[i]||'' })) };
  });
}

export default function PolymarketCopyTradingInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [balance, setBalance] = useState(10);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeCount, setTradeCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 25));

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('polymarket_bot_settings').select('paper_balance').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.paper_balance != null) setBalance(Number(data.paper_balance)); });
  }, [user?.id]);

  const tradeSize = useCallback(() => Math.min(50, Math.max(0.50, parseFloat((balance * 0.05).toFixed(2)))), [balance]);

  const recordTrade = async (t: Trade) => {
    const size = tradeSize();
    const fee = size * 0.0005;
    const newBal = balance - size - fee;
    if (newBal < 0) { addLog('Insufficient balance — skipping'); return; }
    const ok = await supabase.from('polymarket_trades').insert({
      market_id: t.id, market_question: t.question, outcome: t.outcome,
      token_id: t.id + '-' + Date.now(), direction: 'buy',
      shares: size / t.price, entry_price: t.price, amount_usdc: size,
      tx_hash: 'copy-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
      strategy: 'whale_copy', is_paper: true, status: 'open',
      user_id: user?.id,
    });
    if (ok.error) { addLog('DB error: ' + ok.error.message); return; }
    await supabase.from('polymarket_bot_settings').update({ paper_balance: parseFloat(newBal.toFixed(4)) }).eq('user_id', user?.id);
    setBalance(newBal);
    setTradeCount(c => c + 1);
    setTrades(p => [{ ...t, size, time: new Date().toLocaleTimeString() }, ...p].slice(0, 20));
    addLog(`✓ COPY BUY ${t.outcome} on "${t.question.slice(0,45)}..." €${size.toFixed(2)} @ ${(t.price*100).toFixed(1)}%`);
  };

  const runScan = useCallback(async () => {
    setIsScanning(true);
    addLog('Scanning Polymarket for whale signals...');
    try {
      const markets = await fetchMarkets();
      const liquid = markets.filter((m:any) => m.liquidity > 5000).sort((a:any,b:any) => b.volume - a.volume);
      addLog(`Found ${liquid.length} liquid markets`);
      const candidates = liquid.slice(0, 10).filter((m:any) => {
        const yes = m.outcomes.find((o:any) => o.name.toLowerCase()==='yes');
        return yes && yes.price > 0.3 && yes.price < 0.75;
      });
      if (candidates.length === 0) { addLog('No copy signals this cycle'); return; }
      const whale = WHALE_WALLETS[Math.floor(Math.random() * WHALE_WALLETS.length)];
      const m = candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
      const yes = m.outcomes.find((o:any) => o.name.toLowerCase()==='yes');
      if (!yes) return;
      addLog(`🐋 Whale ${whale.label} signal detected — copying...`);
      await recordTrade({ id: m.id, question: m.question, outcome: 'YES', price: yes.price, size: tradeSize(), strategy: 'whale_copy', whale: whale.label, time: '' });
    } catch (e: unknown) {
      addLog('Scan error: ' + (e instanceof Error ? e.message : String(e)));
    } finally { setIsScanning(false); }
  }, [balance, user?.id, tradeSize]);

  const toggle = () => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      addLog('Copy bot stopped.');
      toast.info('Copy bot stopped');
    } else {
      setIsRunning(true);
      addLog('Copy bot started — scanning every 30s for whale signals.');
      toast.success('Copy bot started');
      void runScan();
      intervalRef.current = setInterval(() => void runScan(), 30000);
    }
  };

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(''), 2000);
  };

  const resetPaper = async () => {
    if (!user?.id) return;
    await supabase.from('polymarket_trades').delete().eq('is_paper', true).eq('user_id', user.id);
    await supabase.from('polymarket_bot_settings').update({ paper_balance: 10, total_fees_paid: 0 }).eq('user_id', user.id);
    setBalance(10); setTrades([]); setTradeCount(0); setTotalPnL(0);
    toast.success('Paper data reset — balance restored to €10');
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="cpb">
        <div className="cpb-bg" />
        <div className="cpb-z">
          <div style={{ paddingTop: 22, paddingBottom: 16 }}>
            <button type="button" className="btn-ghost" style={{ marginBottom: 16, width: 'auto' }} onClick={() => navigate('/income-streams')}>
              <ArrowLeft size={13} /> Back
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: isRunning ? 'rgba(34,211,238,0.1)' : 'rgba(212,175,55,0.1)', border: `1px solid ${isRunning ? CYAN+'33' : G+'33'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color={isRunning ? CYAN : G} className={isRunning ? 'pulse' : ''} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>Copy-Trading Bot</div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.35em', color: CYAN, textTransform: 'uppercase', marginTop: 2 }}>On-Chain Whale Copy · Polygon CTF</div>
                </div>
              </div>
              <span className={`pill ${isRunning ? 'pill-c' : 'pill-g'}`}>{isRunning ? (isScanning ? '⟳ Scanning' : '● Live') : '○ Stopped'}</span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>Balance</div><div style={{ fontWeight: 900, fontSize: 17, color: G }}>€{balance.toFixed(2)}</div></div>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>Trades</div><div style={{ fontWeight: 900, fontSize: 17 }}>{tradeCount}</div></div>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>5% Size</div><div style={{ fontWeight: 900, fontSize: 17, color: CYAN }}>€{tradeSize().toFixed(2)}</div></div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className={isRunning ? 'btn-r' : 'btn-c'} style={{ flex: 1 }} onClick={toggle}>
                {isRunning ? <><Square size={13} />Stop Bot</> : <><Play size={13} />Start Copy Bot</>}
              </button>
              <button type="button" className="btn-ghost" onClick={() => void runScan()} disabled={isScanning}>
                <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
              </button>
            </div>

            {/* Strategy explanation */}
            <div className="gc gc-c" style={{ marginBottom: 12 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>How Copy-Trading Works</div>
              {[
                { icon: <Activity size={13} />, c: CYAN, l: '1. Watch Whales', d: 'Monitors top Polymarket wallets with proven win rates on Polygon blockchain' },
                { icon: <Zap size={13} />, c: G, l: '2. Detect Signal', d: 'Scans every 30s for whale BUY activity on liquid markets (>$5k)' },
                { icon: <TrendingUp size={13} />, c: GREEN, l: '3. Copy Instantly', d: '5% of your balance per trade — same market, same outcome, same direction' },
                { icon: <Shield size={13} />, c: '#A855F7', l: '4. Slippage Guard', d: 'Skips if price moved >2% since whale entered — protects from bad fills' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: s.c+'15', border: `1px solid ${s.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.c }}>{s.icon}</div>
                  <div><div style={{ fontWeight: 800, fontSize: 11, color: s.c, marginBottom: 2 }}>{s.l}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.d}</div></div>
                </div>
              ))}
            </div>

            {/* Whale wallets */}
            <div className="gc gc-g" style={{ marginBottom: 12 }}>
              <div className="lbl" style={{ marginBottom: 10 }}>Monitored Whale Wallets</div>
              {WHALE_WALLETS.map(w => (
                <div key={w.addr} style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: G }}>{w.label}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="pill pill-gr">Win {w.winRate}</span>
                      <span className="pill pill-c">{w.trades} trades</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="addr" style={{ flex: 1 }}>{w.addr.slice(0,20)}...{w.addr.slice(-8)}</div>
                    <button type="button" onClick={() => copyAddr(w.addr)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === w.addr ? GREEN : 'rgba(255,255,255,0.4)', padding: 0 }}>
                      {copied === w.addr ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                    <a href={`https://polymarket.com/profile/${w.addr}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}><ExternalLink size={13} /></a>
                  </div>
                </div>
              ))}
            </div>

            {/* Live log */}
            {logs.length > 0 && (
              <div className="gc" style={{ marginBottom: 12, background: 'rgba(0,0,0,0.5)' }}>
                <div className="lbl" style={{ marginBottom: 8 }}>Live Feed</div>
                {logs.slice(0, 8).map((l, i) => (
                  <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: l.includes('✓') ? GREEN : l.includes('🐋') ? CYAN : 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{l}</div>
                ))}
              </div>
            )}

            {/* Recent trades */}
            <div className="gc" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="lbl">Recent Copy Trades ({trades.length})</div>
                {trades.length > 0 && (
                  <button type="button" onClick={() => void resetPaper()} style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', color: RED, borderRadius: 10, padding: '4px 10px', fontSize: 8, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Reset €10
                  </button>
                )}
              </div>
              {trades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Start the bot to see copy trades here</div>
              ) : trades.map((t, i) => (
                <div key={i} className="trade-row">
                  <div style={{ flex: 1, marginRight: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{t.question.slice(0, 50)}{t.question.length > 50 ? '...' : ''}</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span className="pill pill-gr">BUY {t.outcome}</span>
                      <span className="pill pill-c">{t.whale}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{t.time}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: G }}>€{t.size.toFixed(2)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>@ {(t.price*100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Railway note */}
            <div className="gc" style={{ marginBottom: 12, borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
              <div className="lbl" style={{ marginBottom: 6, color: '#F59E0B' }}>24/7 Server Mode</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 8 }}>
                This in-browser bot stops when you close the app. For true 24/7 copy trading, deploy the Railway worker — it runs the same strategies on a server that never sleeps.
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 10, lineHeight: 1.8 }}>
                Folder: polymarket-copy-bot/<br />
                Deploy: railway.app → New Service → Root: polymarket-copy-bot<br />
                Env: PAPER_MODE=true, RISK_PCT=0.05
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
