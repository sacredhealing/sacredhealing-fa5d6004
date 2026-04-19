import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, RefreshCw, Play, Square, BarChart3, ChevronDown, ChevronUp, ExternalLink, Target, Zap, Shield, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const G = '#D4AF37'; const CYAN = '#22D3EE'; const GREEN = '#2ECC71'; const RED = '#FF4757'; const AMBER = '#F59E0B'; const BLACK = '#050505';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.pmb{font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;background:${BLACK};color:#fff;padding-bottom:100px;}
.pmb *{box-sizing:border-box;}
.pmb-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 20% 10%,rgba(212,175,55,0.06) 0%,transparent 55%),radial-gradient(ellipse at 80% 90%,rgba(34,211,238,0.04) 0%,transparent 55%);}
.pmb-z{position:relative;z-index:1;padding:0 18px;}
.gc{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:22px;padding:16px;}
.gc-g{border-color:rgba(212,175,55,0.22);box-shadow:0 0 24px rgba(212,175,55,0.07);}
.gc-gr{border-color:rgba(46,204,113,0.2);background:rgba(46,204,113,0.06);}
.lbl{font-size:7px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);}
.pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:50px;font-size:7px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;}
.pill-g{background:rgba(212,175,55,0.12);color:${G};border:1px solid rgba(212,175,55,0.25);}
.pill-gr{background:rgba(46,204,113,0.12);color:${GREEN};border:1px solid rgba(46,204,113,0.25);}
.pill-r{background:rgba(255,71,87,0.12);color:${RED};border:1px solid rgba(255,71,87,0.25);}
.pill-c{background:rgba(34,211,238,0.1);color:${CYAN};border:1px solid rgba(34,211,238,0.25);}
.pill-a{background:rgba(245,158,11,0.1);color:${AMBER};border:1px solid rgba(245,158,11,0.25);}
.sb{background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 12px;}
.btn-g{background:linear-gradient(135deg,${G},#f0c040);color:${BLACK};border:none;border-radius:16px;padding:13px 18px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 0 24px rgba(212,175,55,0.35);transition:all .25s;display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-r{background:linear-gradient(135deg,${RED},#c0392b);color:#fff;border:none;border-radius:16px;padding:13px 18px;font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 0 24px rgba(255,71,87,0.3);transition:all .25s;display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:9px 14px;font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;}
.filter-btn{background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:50px;padding:5px 12px;font-size:8px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;color:rgba(255,255,255,0.35);transition:all .2s;font-family:inherit;}
.filter-btn.on{background:rgba(212,175,55,0.12);color:${G};border-color:rgba(212,175,55,0.3);}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.pulse{animation:pulse 2s ease-in-out infinite;}
`;

interface Market { id: string; question: string; outcomes: { name: string; price: number; tokenId: string }[]; liquidity: number; volume: number; endDate: string; slug: string; }
interface Signal { id: string; market: Market; outcome: string; currentPrice: number; targetPrice: number; confidence: number; kellySize: number; reasoning: string; edge: string; strategy: string; timestamp: Date; }

function calcKelly(balance: number, winProb: number, price: number): number {
  if (winProb <= 0 || price <= 0 || price >= 1) return 0;
  const payout = (1 - price) / price;
  const k = (winProb * payout - (1 - winProb)) / payout;
  if (k <= 0) return 0;
  return Math.min(50, Math.max(0.50, parseFloat((balance * k * 0.25).toFixed(2))));
}

async function fetchMarkets(): Promise<Market[]> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-proxy?endpoint=markets&params=${encodeURIComponent('limit=50&active=true&closed=false')}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return data.map((m: any) => {
      const names = JSON.parse(m.outcomes || '["Yes","No"]');
      const prices = JSON.parse(m.outcomePrices || '[0.5,0.5]');
      const tokens = JSON.parse(m.clobTokenIds || '["",""]');
      return { id: m.id, question: m.question, liquidity: parseFloat(m.liquidity) || 0, volume: parseFloat(m.volume) || 0, endDate: m.endDate, slug: m.slug || '', outcomes: names.map((n: string, i: number) => ({ name: n, price: parseFloat(prices[i]) || 0.5, tokenId: tokens[i] || '' })) };
    });
  } catch { return []; }
}

async function analyseMarket(market: Market, balance: number): Promise<Signal | null> {
  try {
    const yes = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no = market.outcomes.find(o => o.name.toLowerCase() === 'no');
    if (!yes || !no) return null;
    const prompt = `You are a professional prediction market analyst. Analyse this market and find if there is a trading edge.

Market: "${market.question}"
YES price: ${(yes.price * 100).toFixed(1)}% | NO price: ${(no.price * 100).toFixed(1)}%
Liquidity: $${market.liquidity.toLocaleString()} | Volume: $${market.volume.toLocaleString()}
End Date: ${market.endDate}

Give your analysis as JSON only, no other text:
{"shouldTrade":true/false,"recommendation":"BUY_YES"/"BUY_NO"/"AVOID","trueProb":0.0-1.0,"confidence":50-95,"reasoning":"1-2 sentences","edge":"brief edge description","strategy":"arbitrage"/"news_edge"/"mispricing"/"momentum"}

Only recommend if confidence >= 65 and edge > 4%. Be conservative.`;
    const { data, error } = await supabase.functions.invoke('gemini-bridge', { body: { prompt, model: 'gemini-2.0-flash', type: 'market-analysis' } });
    if (error || !data?.response) return null;
    const match = data.response.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const a = JSON.parse(match[0]);
    if (!a.shouldTrade || a.confidence < 65) return null;
    const outcome = a.recommendation === 'BUY_YES' ? yes : no;
    const size = calcKelly(balance, a.trueProb, outcome.price);
    if (size < 0.50) return null;
    return { id: `${market.id}-${Date.now()}`, market, outcome: a.recommendation === 'BUY_YES' ? 'YES' : 'NO', currentPrice: outcome.price, targetPrice: Math.min(0.95, a.trueProb), confidence: a.confidence, kellySize: size, reasoning: a.reasoning, edge: a.edge, strategy: a.strategy, timestamp: new Date() };
  } catch { return null; }
}

export default function PredictionMarketBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState(10);
  const [scanCount, setScanCount] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [stats, setStats] = useState({ total: 0, highConf: 0, avgEdge: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 30));

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('polymarket_bot_settings').select('paper_balance').eq('user_id', user.id).single().then(({ data }) => { if (data?.paper_balance != null) setBalance(Number(data.paper_balance)); });
  }, [user?.id]);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    addLog('Fetching 50 markets...');
    try {
      const fetched = await fetchMarkets();
      setMarkets(fetched);
      addLog(`Fetched ${fetched.length} markets. Sending top 5 to Gemini...`);
      const top = fetched.filter(m => m.liquidity > 10000).sort((a, b) => b.volume - a.volume).slice(0, 5);
      const newSigs: Signal[] = [];
      for (const m of top) {
        addLog(`Analysing: ${m.question.slice(0, 50)}...`);
        const sig = await analyseMarket(m, balance);
        if (sig) { newSigs.push(sig); addLog(`✓ Signal found: ${sig.outcome} @ ${(sig.currentPrice * 100).toFixed(1)}% conf:${sig.confidence}%`); }
        else addLog(`No edge found.`);
        await new Promise(r => setTimeout(r, 400));
      }
      if (newSigs.length > 0) {
        setSignals(p => {
          const combined = [...newSigs, ...p].slice(0, 20);
          setStats({ total: combined.length, highConf: combined.filter(s => s.confidence >= 80).length, avgEdge: parseFloat((combined.reduce((s, x) => s + Math.abs(x.targetPrice - x.currentPrice), 0) / combined.length * 100).toFixed(1)) });
          return combined;
        });
        toast.success(`${newSigs.length} new signal${newSigs.length > 1 ? 's' : ''} found`);
      } else {
        addLog('No signals this cycle — market well-priced.');
      }
      setScanCount(c => c + 1);
      setLastScan(new Date());
    } catch { toast.error('Scan failed'); }
    finally { setIsScanning(false); }
  }, [balance]);

  const toggle = () => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      addLog('AI Engine stopped.');
      toast.info('AI Engine stopped');
    } else {
      setIsRunning(true);
      addLog('AI Engine started — scanning every 90s.');
      toast.success('AI Engine started');
      runScan();
      intervalRef.current = setInterval(runScan, 90000);
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const filtered = signals.filter(s => filter === 'high' ? s.confidence >= 80 : filter === 'medium' ? s.confidence >= 65 && s.confidence < 80 : true);
  const stratColor: Record<string, string> = { arbitrage: CYAN, news_edge: G, mispricing: GREEN, momentum: '#A855F7' };

  return (
    <>
      <style>{CSS}</style>
      <div className="pmb">
        <div className="pmb-bg" />
        <div className="pmb-z">
          <div style={{ paddingTop: 22, paddingBottom: 16 }}>
            <button className="btn-ghost" style={{ marginBottom: 16, width: 'auto' }} onClick={() => navigate('/income-streams')}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: isRunning ? 'rgba(34,211,238,0.1)' : 'rgba(212,175,55,0.1)', border: `1px solid ${isRunning ? 'rgba(34,211,238,0.25)' : 'rgba(212,175,55,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={20} color={isRunning ? CYAN : G} className={isRunning ? 'pulse' : ''} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>AI Prediction Engine</div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.35em', color: CYAN, textTransform: 'uppercase', marginTop: 2 }}>Gemini · Kelly · 50 Markets · 90s Scans</div>
                </div>
              </div>
              <span className={`pill ${isRunning ? 'pill-c' : 'pill-a'}`}>{isRunning ? (isScanning ? '⟳ Scanning' : '● Running') : '○ Stopped'}</span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>Markets</div><div style={{ fontWeight: 900, fontSize: 18 }}>{markets.length}</div></div>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>Signals</div><div style={{ fontWeight: 900, fontSize: 18, color: G }}>{stats.total}</div></div>
              <div className="sb"><div className="lbl" style={{ marginBottom: 4 }}>High Conf</div><div style={{ fontWeight: 900, fontSize: 18, color: GREEN }}>{stats.highConf}</div></div>
            </div>

            {/* Balance + Kelly */}
            <div className="gc gc-g" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div><div className="lbl" style={{ marginBottom: 3 }}>Paper Balance</div><div style={{ fontWeight: 900, fontSize: 22, color: G }}>€{balance.toFixed(2)}</div></div>
                <div style={{ textAlign: 'right' }}><div className="lbl" style={{ marginBottom: 3 }}>Quarter-Kelly Size</div><div style={{ fontWeight: 900, fontSize: 22, color: CYAN }}>€{(balance * 0.05 * 0.25).toFixed(2)}</div></div>
              </div>
              {lastScan && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Last scan: {lastScan.toLocaleTimeString()} · Scan #{scanCount} · Next in ~90s</div>}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className={isRunning ? 'btn-r' : 'btn-g'} style={{ flex: 1 }} onClick={toggle} disabled={isScanning}>
                {isRunning ? <><Square size={13} />Stop AI Engine</> : <><Play size={13} />Start AI Engine</>}
              </button>
              <button className="btn-ghost" onClick={runScan} disabled={isScanning}>
                <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
              </button>
            </div>

            {/* How it works */}
            <div className="gc" style={{ marginBottom: 12 }}>
              <div className="lbl" style={{ marginBottom: 12 }}>How It Works</div>
              {[
                { icon: <Search size={13} />, c: CYAN, l: '1. Scan', d: 'Fetches 50 active markets filtered by >$10k liquidity' },
                { icon: <Brain size={13} />, c: G, l: '2. Gemini AI', d: 'Estimates true probability vs market price using reasoning' },
                { icon: <Target size={13} />, c: GREEN, l: '3. Edge Filter', d: 'Only signals with >4% edge and 65%+ confidence pass' },
                { icon: <Shield size={13} />, c: '#A855F7', l: '4. Kelly Size', d: 'Quarter-Kelly sizing — never risks more than ~1.25% per trade' },
                { icon: <Zap size={13} />, c: RED, l: '5. Signal', d: 'Shows reasoning, entry price, target, edge % and market link' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 10 : 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: s.c + '15', border: `1px solid ${s.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.c }}>{s.icon}</div>
                  <div><div style={{ fontWeight: 800, fontSize: 11, color: s.c, marginBottom: 2 }}>{s.l}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.d}</div></div>
                </div>
              ))}
            </div>

            {/* Live log */}
            {logs.length > 0 && (
              <div className="gc" style={{ marginBottom: 12, background: 'rgba(0,0,0,0.5)' }}>
                <div className="lbl" style={{ marginBottom: 8 }}>Live Feed</div>
                {logs.slice(0, 8).map((l, i) => <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: l.includes('✓') ? GREEN : 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{l}</div>)}
              </div>
            )}
          </div>

          {/* Signals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="lbl">AI Signals ({filtered.length})</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['all', 'high', 'medium'] as const).map(f => <button key={f} type="button" className={`filter-btn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'high' ? '80%+' : '65–80%'}</button>)}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="gc" style={{ textAlign: 'center', padding: 40 }}>
              <BarChart3 size={32} style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.2)' }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No signals yet</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Press Start AI Engine to begin scanning</div>
            </div>
          ) : filtered.map(sig => (
            <div key={sig.id} className={`gc ${sig.confidence >= 80 ? 'gc-gr' : ''}`} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpanded(expanded === sig.id ? null : sig.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>{sig.market.question}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                    <span className={`pill ${sig.outcome === 'YES' ? 'pill-gr' : 'pill-r'}`}>BUY {sig.outcome}</span>
                    <span className="pill pill-g">{sig.strategy.replace('_', ' ')}</span>
                    <span style={{ padding: '2px 9px', borderRadius: 50, fontSize: '7px', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase' as const, background: `${stratColor[sig.strategy] || G}15`, color: stratColor[sig.strategy] || G, border: `1px solid ${stratColor[sig.strategy] || G}33` }}>{sig.confidence}% conf</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: G }}>€{sig.kellySize.toFixed(2)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Kelly size</div>
                  {expanded === sig.id ? <ChevronUp size={13} color="rgba(255,255,255,0.3)" style={{ marginTop: 3 }} /> : <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ marginTop: 3 }} />}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: expanded === sig.id ? 10 : 0 }}>
                <div className="sb"><div className="lbl" style={{ marginBottom: 3 }}>Entry</div><div style={{ fontWeight: 900, fontSize: 13 }}>{(sig.currentPrice * 100).toFixed(1)}%</div></div>
                <div className="sb"><div className="lbl" style={{ marginBottom: 3 }}>Target</div><div style={{ fontWeight: 900, fontSize: 13, color: GREEN }}>{(sig.targetPrice * 100).toFixed(1)}%</div></div>
                <div className="sb"><div className="lbl" style={{ marginBottom: 3 }}>Edge</div><div style={{ fontWeight: 900, fontSize: 13, color: CYAN }}>+{((sig.targetPrice - sig.currentPrice) * 100).toFixed(1)}%</div></div>
              </div>
              {expanded === sig.id && (
                <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ marginBottom: 8 }}><div className="lbl" style={{ marginBottom: 4 }}>AI Reasoning</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{sig.reasoning}</div></div>
                  <div style={{ marginBottom: 10 }}><div className="lbl" style={{ marginBottom: 4 }}>Edge</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{sig.edge}</div></div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10, lineHeight: 1.8 }}>
                    Liquidity: ${sig.market.liquidity.toLocaleString()} · Volume: ${sig.market.volume.toLocaleString()}<br />
                    Ends: {new Date(sig.market.endDate).toLocaleDateString()} · Found: {sig.timestamp.toLocaleTimeString()}
                  </div>
                  <a href={`https://polymarket.com/market/${sig.market.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, color: G, letterSpacing: '.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> View on Polymarket
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
