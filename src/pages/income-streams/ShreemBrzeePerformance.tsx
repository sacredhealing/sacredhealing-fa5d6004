import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EDGE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY || '775d3d1f-6801-41de-a063-8aee4382d0f4'}`;

const WHALES = [
  { label: 'Remusofmars', addr: '5tzFkiKscXHK5ZXCGbGuPbCLNqLJnEUPs3EBGzSdAFkF', vip: true },
  { label: 'Cupsey',       addr: 'BU9EFBu2DSPwvbMpPjiFf46jqNiPDuvBkEbBBBDJUHBg', vip: true },
  { label: 'Heyitsyolo',   addr: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWagsenfzNnvk', vip: true },
  { label: 'Ansem',        addr: 'ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ', vip: false },
  { label: 'Murad',        addr: '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm', vip: false },
  { label: 'GCR',          addr: 'Dt4GEBcpsSCB2B1kSsRobF26TvBVVcfKAGR6pXPJSFfA', vip: false },
  { label: 'Hsaka',        addr: 'EVvpKxsMzn7F65fMr6qbJuBaAvuZhZr5KSbJ5gH3UW8m', vip: false },
  { label: 'Cobie',        addr: 'CmqJEJg6tLMV7VnXL5PvXtxBMBqVr4XJHNKEhLJHm1E', vip: false },
  { label: 'Alphakek',     addr: '8GFzKBLyFGDQRBMFhNKHMuq9MeFEWAT6c6E1a6HYpump',vip: false },
  { label: 'Fiskantes',    addr: 'FYmEhv1CybVe3NHGiK2gPLNfBCFkc5XNhEL7J2MhMkE', vip: false },
  { label: 'JupVol',       addr: '3QsmYbFPSFAHcnEHbmcqAGqJhkYVCMSmCHPG7BLNBZEV', vip: false },
  { label: 'Blknoiz06',    addr: 'DpWpCsnmhzmpjfhTtdKQSVQv78MdPHhFzKWkdumzXJNS', vip: false },
  { label: 'Nansen0x',     addr: 'GTMckXBGFT9qigrJLxUq5FBjcgbJLqh2DLZ4H7LGGEP', vip: false },
  { label: 'GMGN-TopPNL',  addr: 'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp',vip: false },
  { label: 'GMGN-Smart',   addr: 'H72yLkhTnoBfhBTXXaj1RBXuirm8s8G5fcVh2XpQLggM', vip: false },
  { label: 'Axiom-100x',   addr: '4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t', vip: false },
  { label: 'WalletMaster', addr: '7x6qE3DRMW2ZCgT1YQuBLePiheEWw7qjH6rYjj6GDtEd', vip: false },
  { label: 'Dune-Meta',    addr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', vip: false },
  { label: 'Birdeye-Mig',  addr: 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', vip: false },
  { label: 'KolScan-Top',  addr: 'GHoTTNFnSBFBbZvBZNvwNz7jtJz1TBNBqkS9vGPnm7Dv', vip: false },
  { label: 'SolBigBrain',  addr: 'Gr5mNBC5GnBZBQMm3MdVU9vEFpNSR1pGbTc8o1BvUCNh', vip: false },
];

// ── helpers ──────────────────────────────────────────────
function isValidSolana(addr: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}
async function getSolPrice(): Promise<number> {
  try {
    const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    const d = await r.json();
    return parseFloat(d.price) || 150;
  } catch { return 150; }
}
async function getEurRate(): Promise<number> {
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const d = await r.json();
    return d?.rates?.EUR || 0.92;
  } catch { return 0.92; }
}
async function getSolBalance(addr: string): Promise<number> {
  try {
    const r = await fetch(HELIUS_RPC, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [addr] })
    });
    const d = await r.json();
    return (d.result?.value || 0) / 1e9;
  } catch { return 0; }
}

// ── styles ────────────────────────────────────────────────
const G = '#D4AF37';
const BLK = '#0a0e1a';
const CARD = '#1a1f2e';
const BDR = '#2d3748';
const GRN = '#10b981';
const RED = '#ef4444';
const CYN = '#00d4ff';
const card: React.CSSProperties = {
  background: CARD, border: `1px solid ${BDR}`, borderRadius: 18, overflow: 'hidden',
};
const cardHead = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '13px 18px', borderBottom: `1px solid ${BDR}`,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...extra,
});
const cardBody: React.CSSProperties = { padding: 18 };
const label: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: '.45em',
  textTransform: 'uppercase' as const, color: 'rgba(212,175,55,.65)',
};
const pill = (bg: string, border: string, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 11px', borderRadius: 20,
  fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
  background: bg, border: `1px solid ${border}`, color,
});

export default function ShreemBrzeePerformance() {
  const nav = useNavigate();

  // ── state ──────────────────────────────────────────────
  const [session, setSession]   = useState<any>(null);
  const [trades,  setTrades]    = useState<any[]>([]);
  const [signals, setSignals]   = useState<any[]>([]);
  const [period,  setPeriod]    = useState<'daily'|'weekly'|'monthly'|'yearly'>('daily');
  const [mode,    setMode]      = useState<'paper'|'live'>('paper');
  const [running, setRunning]   = useState(false);
  const [startSOL,setStartSOL]  = useState('2');
  const [busy,    setBusy]      = useState(false);
  const [msg,     setMsg]       = useState('');

  // wallet
  const [walletInput, setWalletInput]   = useState('');
  const [savedWallet, setSavedWallet]   = useState('');
  const [walletBal,   setWalletBal]     = useState<number|null>(null);
  const [walletValid, setWalletValid]   = useState<boolean|null>(null);
  const [connecting,  setConnecting]    = useState(false);

  // prices
  const [solUSD, setSolUSD] = useState(150);
  const [eurRate,setEurRate]= useState(0.92);

  // whale perf derived from trades
  const [whalePnl, setWhalePnl] = useState<Record<string,{wins:number,losses:number,pnlSol:number,trades:number}>>({});

  const toEur = (sol: number) => (sol * solUSD * eurRate).toFixed(2);
  const toEurN = (sol: number) => sol * solUSD * eurRate;

  // ── load ───────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE}/session`);
      if (r.ok) { const d = await r.json(); if (d) setSession(d); }
    } catch {}
  }, []);

  const loadTrades = useCallback(async () => {
    const now = new Date();
    let since = new Date(now);
    if (period === 'daily')   since.setHours(0,0,0,0);
    if (period === 'weekly')  since.setDate(now.getDate() - 7);
    if (period === 'monthly') since.setMonth(now.getMonth() - 1);
    if (period === 'yearly')  since.setFullYear(now.getFullYear() - 1);

    const { data } = await (supabase as any)
      .from('shreem_brzee_paper_trades')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    const rows = data || [];
    setTrades(rows);

    // build per-whale stats
    const map: Record<string,{wins:number,losses:number,pnlSol:number,trades:number}> = {};
    rows.forEach((t: any) => {
      const l = t.label || 'Unknown';
      if (!map[l]) map[l] = { wins:0, losses:0, pnlSol:0, trades:0 };
      map[l].trades++;
      map[l].pnlSol += t.pnl_sol || 0;
      if ((t.pnl_sol||0) > 0) map[l].wins++;
      else if (!t.failed) map[l].losses++;
    });
    setWhalePnl(map);
  }, [period]);

  const loadSignals = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('shreem_brzee_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setSignals(data || []);
  }, []);

  const loadAll = useCallback(() => {
    loadSession(); loadTrades(); loadSignals();
  }, [loadSession, loadTrades, loadSignals]);

  useEffect(() => {
    loadAll();
    getSolPrice().then(setSolUSD);
    getEurRate().then(setEurRate);
    const t = setInterval(loadAll, 10000);
    return () => clearInterval(t);
  }, [loadAll]);

  useEffect(() => { loadTrades(); }, [period, loadTrades]);

  // Realtime subscriptions
  useEffect(() => {
    const ch1 = supabase.channel('shreem_sig_rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'shreem_brzee_signals' },
        () => { loadSignals(); if (running) loadSession(); })
      .subscribe();
    const ch2 = supabase.channel('shreem_trd_rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'shreem_brzee_paper_trades' },
        () => { loadTrades(); loadSession(); })
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [loadSignals, loadTrades, loadSession, running]);

  // ── wallet ─────────────────────────────────────────────
  const onWalletChange = (v: string) => {
    setWalletInput(v);
    setWalletValid(v.trim().length > 0 ? isValidSolana(v) : null);
  };

  const saveWallet = async () => {
    if (!isValidSolana(walletInput)) { setMsg('❌ Invalid Solana address'); return; }
    const addr = walletInput.trim();
    setSavedWallet(addr);
    setWalletInput('');
    setWalletValid(null);
    const bal = await getSolBalance(addr);
    setWalletBal(bal);
    setMsg('✅ Wallet saved — balance fetched');
    setTimeout(() => setMsg(''), 3000);
  };

  const connectPhantom = async () => {
    if (!(window as any).solana?.isPhantom) {
      setMsg('⚠ Phantom not found — install at phantom.app');
      setTimeout(() => setMsg(''), 4000);
      return;
    }
    setConnecting(true);
    try {
      const resp = await (window as any).solana.connect();
      const addr = resp.publicKey.toString();
      setSavedWallet(addr);
      const bal = await getSolBalance(addr);
      setWalletBal(bal);
      setMsg('✅ Phantom connected');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('⚠ Phantom connection cancelled'); setTimeout(() => setMsg(''), 3000); }
    setConnecting(false);
  };

  // ── session ────────────────────────────────────────────
  const startSession = async () => {
    setBusy(true); setMsg('');
    const sol = parseFloat(startSOL) || 2;
    try {
      await (supabase as any).from('shreem_brzee_paper_trades').delete().neq('id', 0);
      await fetch(`${EDGE}/paper`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'session', session: {
          portfolio: sol, start_balance: sol, positions: {},
          total_pnl: 0, wins: 0, losses: 0, started_at: new Date().toISOString(),
        }}),
      });
      await loadAll();
      setRunning(true);
      setMsg(`✅ Bot started with ${sol} SOL`);
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Error starting session'); }
    setBusy(false);
  };

  const stopSession = () => {
    setRunning(false);
    setMsg('⏹ Bot stopped');
    setTimeout(() => setMsg(''), 3000);
  };

  const testSignal = async () => {
    if (!session) { setMsg('⚠ Start the bot first'); setTimeout(() => setMsg(''), 3000); return; }
    setBusy(true);
    try {
      await (supabase as any).from('shreem_brzee_signals').insert({
        sig: 'TEST_' + Date.now(),
        wallet: '5tzFkiKscXHK5ZXCGbGuPbCLNqLJnEUPs3EBGzSdAFkF',
        label: 'Remusofmars', action: 'BUY',
        mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        symbol: 'POPCAT', amount_sol: 1.5, token_amount: 50000,
        is_pump_fun: true, block_time: Math.floor(Date.now()/1000),
      });
      setTimeout(loadAll, 2500);
      setMsg('⚡ Test signal injected — watch trades below');
      setTimeout(() => setMsg(''), 4000);
    } catch { setMsg('❌ Error'); }
    setBusy(false);
  };

  // ── derived ────────────────────────────────────────────
  const pnlSol   = session?.total_pnl || 0;
  const balSol   = session?.portfolio || parseFloat(startSOL) || 2;
  const startBal = session?.start_balance || parseFloat(startSOL) || 2;
  const pnlPct   = startBal > 0 ? ((pnlSol / startBal) * 100).toFixed(1) : '0.0';
  const openPos  = Object.values(session?.positions || {});

  // whale table with period data
  const whaleRows = WHALES.map(w => {
    const stats = whalePnl[w.label] || { wins:0, losses:0, pnlSol:0, trades:0 };
    const total = stats.wins + stats.losses;
    const winPct = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
    return { ...w, ...stats, winPct };
  }).sort((a, b) => b.pnlSol - a.pnlSol);

  const maxPnl = Math.max(...whaleRows.map(w => Math.abs(w.pnlSol)), 0.001);

  const timeAgo = (ts: string) => {
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  // ── render ─────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:BLK, color:'#fff',
      fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", paddingBottom:80 }}>

      {/* ── HEADER ── */}
      <div style={{ background:'#111827', borderBottom:`1px solid ${BDR}`,
        padding:'13px 20px', display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:60 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => nav(-1)}
            style={{ background:'none', border:'none', color:'#64748b',
              fontSize:22, cursor:'pointer', lineHeight:1, padding:'2px 6px' }}>←</button>
          <div style={{ width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,#b8860b,#D4AF37)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, boxShadow:'0 0 12px rgba(212,175,55,.3)' }}>🔱</div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:G, letterSpacing:'-.03em' }}>Shreem Brzee Bot</div>
            <div style={{ fontSize:9, color:'#64748b', letterSpacing:'.4em', textTransform:'uppercase' }}>SQI 2050 · Solana Copy Trading</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={pill(
            mode==='paper' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
            mode==='paper' ? 'rgba(16,185,129,.28)' : 'rgba(239,68,68,.28)',
            mode==='paper' ? GRN : RED
          )}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'currentColor',animation:'pulse 1.5s infinite' }}/>
            {mode === 'paper' ? 'Paper' : 'Live'}
          </span>
          {running && <span style={pill('rgba(0,212,255,.08)','rgba(0,212,255,.28)',CYN)}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:CYN }}/>Running
          </span>}
          <span style={{ fontSize:11, color:'#64748b' }}>SOL <strong style={{ color:CYN }}>€{(solUSD*eurRate).toFixed(2)}</strong></span>
        </div>
      </div>

      <div style={{ padding:18, maxWidth:960, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>

        {/* MSG */}
        {msg && (
          <div style={{ padding:'11px 16px', borderRadius:12,
            background: msg.startsWith('✅') ? 'rgba(16,185,129,.1)' : msg.startsWith('❌')||msg.startsWith('⚠') ? 'rgba(239,68,68,.1)' : 'rgba(0,212,255,.08)',
            border: `1px solid ${msg.startsWith('✅') ? 'rgba(16,185,129,.3)' : msg.startsWith('❌')||msg.startsWith('⚠') ? 'rgba(239,68,68,.3)' : 'rgba(0,212,255,.25)'}`,
            color: msg.startsWith('✅') ? GRN : msg.startsWith('❌')||msg.startsWith('⚠') ? RED : CYN,
            fontSize:13, fontWeight:600 }}>
            {msg}
          </div>
        )}

        {/* ── ① STAT CARDS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { i:'💰', v:`€${toEur(balSol)}`, l:'Balance',        s:`${balSol.toFixed(3)} SOL`,        c:G   },
            { i:'📈', v:`${pnlSol>=0?'+':''}€${toEur(pnlSol)}`, l:'Total P&L',  s:`${pnlSol>=0?'+':''}${pnlPct}%`, c:pnlSol>=0?GRN:RED },
            { i:'🎯', v:`${session?.wins||0}/${session?.losses||0}`, l:'Win/Loss', s:`${session?.wins&&(session.wins+session.losses)>0?Math.round(session.wins/(session.wins+session.losses)*100):0}% win rate`, c:'#fff' },
            { i:'📂', v:String(openPos.length), l:'Open Positions', s:`max 20 · 5% risk`, c:CYN },
          ].map(s => (
            <div key={s.l} style={{ background:CARD, border:`1px solid ${BDR}`,
              borderRadius:16, padding:'16px 14px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.i}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.c, letterSpacing:'-.02em' }}>{s.v}</div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.35em', textTransform:'uppercase', color:'#64748b', marginTop:4 }}>{s.l}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.s}</div>
            </div>
          ))}
        </div>

        {/* ── ② WALLET ── */}
        <div style={{ ...card, border:`1px solid rgba(212,175,55,.28)` }}>
          <div style={cardHead()}>
            <span style={label}>👛 My Solana Wallet</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5,
              padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:700,
              background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.28)', color:GRN }}>
              🔒 Public address only — private key never stored
            </span>
          </div>
          <div style={{ ...cardBody, display:'flex', flexDirection:'column', gap:13 }}>

            {/* Phantom */}
            <button onClick={connectPhantom} disabled={connecting}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'14px 16px', borderRadius:14, cursor:'pointer', textAlign:'left',
                border:'1px solid rgba(139,92,246,.35)', background:'rgba(139,92,246,.08)',
                transition:'all .2s', opacity: connecting ? .6 : 1 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#ab9ff2',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>👻</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#c4b5fd' }}>
                  {connecting ? 'Connecting…' : 'Connect Phantom Wallet'}
                </div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                  Safest — your key signs inside Phantom, never leaves your device
                </div>
              </div>
              <div style={{ fontSize:10, color:'#a78bfa', fontWeight:700 }}>CONNECT →</div>
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#64748b', fontSize:11 }}>
              <div style={{ flex:1, height:1, background:BDR }}/>
              or paste address manually
              <div style={{ flex:1, height:1, background:BDR }}/>
            </div>

            {/* Input */}
            <div style={{ display:'flex', gap:10 }}>
              <input
                value={walletInput}
                onChange={e => onWalletChange(e.target.value)}
                placeholder="Paste your Solana wallet address (32–44 chars, starts with base58)"
                maxLength={44}
                style={{ flex:1, padding:'12px 14px', borderRadius:12, fontSize:12,
                  fontFamily:'monospace', outline:'none', background:'#111827', color:'#fff',
                  border:`1px solid ${walletValid===null ? BDR : walletValid ? 'rgba(16,185,129,.5)' : 'rgba(239,68,68,.5)'}`,
                  transition:'border-color .2s' }}
              />
              <button onClick={saveWallet}
                disabled={!walletValid}
                style={{ padding:'12px 18px', borderRadius:12, cursor: walletValid ? 'pointer' : 'not-allowed',
                  border:`1px solid ${walletValid ? 'rgba(212,175,55,.35)' : BDR}`,
                  background: walletValid ? 'rgba(212,175,55,.1)' : 'rgba(255,255,255,.03)',
                  color: walletValid ? G : '#64748b',
                  fontSize:11, fontWeight:800, letterSpacing:'.1em', whiteSpace:'nowrap' }}>
                {walletValid === false ? '✗ INVALID' : '✓ SAVE'}
              </button>
            </div>

            {/* Security note */}
            <div style={{ display:'flex', gap:10, padding:'11px 14px', borderRadius:12,
              background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.2)',
              fontSize:11, color:'rgba(16,185,129,.9)', lineHeight:1.6 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>🛡️</span>
              <div>
                <strong>Your wallet is 100% safe.</strong> We only store your <em>public address</em> — like your bank account number. It lets us check your balance. We <strong>never</strong> ask for your seed phrase, private key, or password. Paper mode works without any wallet.
              </div>
            </div>

            {/* Connected state */}
            {savedWallet && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'13px 16px', borderRadius:13,
                background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.25)' }}>
                <div>
                  <div style={{ fontSize:9, color:'#64748b', letterSpacing:'.3em', textTransform:'uppercase', marginBottom:3 }}>Connected Wallet</div>
                  <div style={{ fontSize:12, fontFamily:'monospace', color:'#cbd5e0' }}>
                    {savedWallet.slice(0,6)}…{savedWallet.slice(-6)}
                    <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%',
                      background:GRN, marginLeft:6, boxShadow:'0 0 6px rgba(16,185,129,.7)' }}/>
                  </div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                    {mode === 'paper' ? '📄 Paper mode · no real SOL used' : '⚡ Live mode · real swaps active'}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:900, color:G }}>
                    {walletBal !== null ? `${walletBal.toFixed(3)} SOL` : '—'}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>
                    {walletBal !== null ? `≈ €${toEur(walletBal)}` : 'Fetching…'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ③ MODE + BALANCE+START ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Mode */}
          <div style={card}>
            <div style={cardHead()}><span style={label}>⚙️ Trading Mode</span></div>
            <div style={{ ...cardBody, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {(['paper','live'] as const).map(m => (
                <div key={m} onClick={() => setMode(m)}
                  style={{ padding:14, borderRadius:14, cursor:'pointer', transition:'all .2s',
                    border:`2px solid ${mode===m ? (m==='paper' ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)') : BDR}`,
                    background: mode===m ? (m==='paper' ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)') : 'transparent' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{m==='paper'?'📄':'⚡'}</div>
                  <div style={{ fontSize:13, fontWeight:800,
                    color: mode===m ? (m==='paper'?GRN:RED) : '#cbd5e0' }}>
                    {m==='paper'?'Paper Mode':'Live Mode'}
                  </div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:3, lineHeight:1.4 }}>
                    {m==='paper'
                      ? 'Simulated trades. No real money. Perfect for testing.'
                      : 'Real swaps via Jupiter v6. Needs Phantom wallet above.'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance + Start */}
          <div style={card}>
            <div style={cardHead()}><span style={label}>💰 Starting Balance (SOL)</span></div>
            <div style={cardBody}>
              <div style={{ display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' }}>
                {['0.5','1','2','5','10'].map(v => (
                  <button key={v} onClick={() => setStartSOL(v)}
                    style={{ padding:'7px 16px', borderRadius:10, cursor:'pointer',
                      border:`1px solid ${startSOL===v ? 'rgba(212,175,55,.35)' : BDR}`,
                      background: startSOL===v ? 'rgba(212,175,55,.1)' : 'transparent',
                      color: startSOL===v ? G : '#64748b',
                      fontSize:12, fontWeight:700, transition:'all .2s' }}>
                    {v}
                  </button>
                ))}
              </div>
              <input type="number" value={startSOL} onChange={e => setStartSOL(e.target.value)}
                min="0.1" step="0.1"
                style={{ width:'100%', padding:'11px 14px', borderRadius:12, marginBottom:12,
                  border:`1px solid ${BDR}`, background:'#111827', color:'#fff',
                  fontSize:15, fontWeight:700, outline:'none' }}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={startSession} disabled={busy}
                  style={{ padding:14, borderRadius:13, border:'none', cursor: busy?'not-allowed':'pointer',
                    background:'linear-gradient(135deg,#D4AF37,#c9930a)',
                    color:'#000', fontSize:12, fontWeight:900, letterSpacing:'.12em',
                    boxShadow:'0 0 18px rgba(212,175,55,.28)', opacity: busy ? .6 : 1 }}>
                  {busy ? '…' : '▶ START'}
                </button>
                <button onClick={stopSession}
                  style={{ padding:14, borderRadius:13, cursor:'pointer',
                    border:'1px solid rgba(239,68,68,.35)', background:'rgba(239,68,68,.08)',
                    color:RED, fontSize:12, fontWeight:900, letterSpacing:'.12em' }}>
                  ⏹ STOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ④ WHALE PERFORMANCE ── */}
        <div style={card}>
          <div style={cardHead()}>
            <span style={label}>🐋 Whale Performance — All 21 Wallets</span>
            <div style={{ display:'flex', gap:6 }}>
              {(['daily','weekly','monthly','yearly'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer',
                    border:`1px solid ${period===p ? 'rgba(212,175,55,.35)' : BDR}`,
                    background: period===p ? 'rgba(212,175,55,.1)' : 'transparent',
                    color: period===p ? G : '#64748b',
                    fontSize:10, fontWeight:700, letterSpacing:'.08em',
                    textTransform:'uppercase' as const }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['#','Whale','Trades','Win %','P&L %','P&L SOL','P&L €',''].map(h => (
                    <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:9,
                      fontWeight:800, letterSpacing:'.35em', textTransform:'uppercase' as const,
                      color:'#64748b', borderBottom:`1px solid ${BDR}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whaleRows.map((w, i) => {
                  const pct = w.pnlSol !== 0
                    ? ((w.pnlSol / (parseFloat(startSOL)||2)) * 100).toFixed(1)
                    : '0.0';
                  const barW = Math.min(100, (Math.abs(w.pnlSol) / maxPnl) * 100);
                  const up = w.pnlSol >= 0;
                  return (
                    <tr key={w.addr}
                      style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'#64748b', fontWeight:700 }}>
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ fontSize:12, fontWeight:800, color:'#fff' }}>
                          {w.label}{w.vip && <span style={{ color:G, marginLeft:4 }}>⭐</span>}
                        </div>
                        <div style={{ fontSize:10, color:'#64748b', fontFamily:'monospace', marginTop:1 }}>
                          {w.addr.slice(0,6)}…{w.addr.slice(-4)}
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'#cbd5e0' }}>{w.trades||0}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700,
                        color: w.winPct >= 50 ? GRN : RED }}>
                        {w.trades > 0 ? `${w.winPct}%` : '—'}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700,
                        color: up ? GRN : RED }}>
                        {w.trades > 0 ? `${up?'+':''}${pct}%` : '—'}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700,
                        color: up ? GRN : RED }}>
                        {w.trades > 0 ? `${up?'+':''}${w.pnlSol.toFixed(4)}` : '—'}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:700,
                        color: up ? GRN : RED }}>
                        {w.trades > 0 ? `${up?'+€':'-€'}${Math.abs(toEurN(w.pnlSol)).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ width:70, background:'rgba(255,255,255,.06)', borderRadius:4, height:5, overflow:'hidden' }}>
                          <div style={{ width:`${barW}%`, height:5, borderRadius:4,
                            background: up ? GRN : RED }}/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ⑤ POSITIONS + SIGNALS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Open positions */}
          <div style={card}>
            <div style={cardHead()}>
              <span style={label}>📂 Open Positions</span>
              <span style={{ fontSize:10, color: openPos.length > 0 ? GRN : '#64748b' }}>
                {openPos.length} active
              </span>
            </div>
            <div style={cardBody}>
              {openPos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>👀</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#cbd5e0', marginBottom:4 }}>Watching for whale BUYs</div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:14 }}>Positions open here instantly when a whale buys</div>
                  <button onClick={testSignal} disabled={busy}
                    style={{ display:'inline-flex', alignItems:'center', gap:6,
                      padding:'9px 18px', borderRadius:11,
                      border:'1px solid rgba(0,212,255,.3)', background:'rgba(0,212,255,.08)',
                      color:CYN, fontSize:11, fontWeight:800, letterSpacing:'.12em',
                      cursor: busy?'not-allowed':'pointer', opacity: busy?.7:1 }}>
                    ⚡ Inject Test Signal
                  </button>
                </div>
              ) : openPos.map((p: any) => (
                <div key={p.mint} style={{ display:'flex', alignItems:'center', gap:11,
                  padding:'10px 0', borderBottom:`1px solid rgba(45,55,72,.4)` }}>
                  <div style={{ width:34, height:34, borderRadius:10,
                    background:'rgba(16,185,129,.1)', color:GRN,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:900 }}>↑</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:G }}>{p.symbol||p.mint?.slice(0,8)}</div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{p.label}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:GRN }}>
                      {p.entrySOL?.toFixed(4)} SOL
                    </div>
                    <div style={{ fontSize:10, color:'#64748b' }}>€{toEur(p.entrySOL||0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal feed */}
          <div style={card}>
            <div style={cardHead()}>
              <span style={label}>📡 Live Signal Feed</span>
              <span style={pill('rgba(0,212,255,.08)','rgba(0,212,255,.28)',CYN)}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:CYN }}/>Helius
              </span>
            </div>
            <div style={cardBody}>
              {signals.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🐋</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#cbd5e0', marginBottom:4 }}>Watching 21 whale wallets</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>Signals appear here the moment any whale swaps on Solana</div>
                </div>
              ) : signals.map((s: any) => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:11,
                  padding:'10px 0', borderBottom:`1px solid rgba(45,55,72,.4)` }}>
                  <div style={{ width:34, height:34, borderRadius:10,
                    background: s.action==='BUY' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                    color: s.action==='BUY' ? GRN : RED,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:900 }}>
                    {s.action==='BUY'?'↑':'↓'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:G }}>
                      {s.symbol||s.mint?.slice(0,8)+'…'}
                      {s.is_pump_fun && <span style={{ marginLeft:5, padding:'1px 5px',
                        borderRadius:5, background:'rgba(139,92,246,.15)',
                        color:'#a78bfa', fontSize:9, fontWeight:700 }}>pump</span>}
                    </div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>
                      {s.amount_sol?.toFixed(3)} SOL
                    </div>
                    <div style={{ fontSize:10, color:'#64748b' }}>{timeAgo(s.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ⑥ TRADE HISTORY ── */}
        <div style={card}>
          <div style={cardHead()}>
            <span style={label}>📋 Paper Trade History</span>
            <span style={{ fontSize:10, color:'#64748b' }}>{trades.length} trades</span>
          </div>
          <div style={cardBody}>
            {trades.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#cbd5e0', marginBottom:4 }}>No trades yet</div>
                <div style={{ fontSize:11, color:'#64748b' }}>Start the bot and inject a test signal to see your first paper trade</div>
              </div>
            ) : trades.map((t: any) => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:11,
                padding:'10px 0', borderBottom:`1px solid rgba(45,55,72,.4)` }}>
                <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
                  background: t.failed ? 'rgba(255,255,255,.04)' : t.action==='BUY' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                  color: t.failed ? '#64748b' : t.action==='BUY' ? GRN : RED,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:900 }}>
                  {t.failed ? '✗' : t.action==='BUY' ? '↑' : '↓'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:G }}>{t.symbol||'?'}</div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                    {t.action} · {t.label}
                    {t.failed && <span style={{ marginLeft:6, padding:'1px 6px', borderRadius:5,
                      background:'rgba(239,68,68,.12)', color:RED, fontSize:9, fontWeight:700 }}>
                      FAILED — {t.fail_reason||'tx error'}
                    </span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {t.action === 'SELL' && !t.failed ? (
                    <div style={{ fontSize:14, fontWeight:900,
                      color: (t.pnl_sol||0) >= 0 ? GRN : RED }}>
                      {(t.pnl_sol||0) >= 0 ? '+' : ''}€{Math.abs(toEurN(t.pnl_sol||0)).toFixed(2)}
                    </div>
                  ) : (
                    <div style={{ fontSize:12, fontWeight:700, color:'#64748b' }}>
                      {(t.gross_sol||0).toFixed(4)} SOL
                    </div>
                  )}
                  <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                    bal: {(t.portfolio_after||0).toFixed(3)} SOL · {timeAgo(t.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
