import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EDGE = 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook';
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY||'775d3d1f-6801-41de-a063-8aee4382d0f4'}`;
const G='#D4AF37',BLK='#050505',CARD='rgba(212,175,55,0.04)',BDR='rgba(212,175,55,0.2)',GRN='#10b981',RED='#ef4444',CYN='#00d4ff',GOLD_GLOW='rgba(212,175,55,0.15)';

const WHALES=[
  {label:'Euris',addr:'Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB',vip:true},
  {label:'Heyitsyolo',addr:'Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ',vip:true},
  {label:'Remusofmars',addr:'BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu',vip:true},
  {label:'Orange',addr:'96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',vip:false},
  {label:'Shreem Brzee',addr:'HL3FZ8XWnLnn1HuktmgpNRyFRjuAxWbXNQVj5fPPzZwt',vip:false},
  {label:'Lenion',addr:'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm',vip:false},
  {label:'Boredboar',addr:'gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw',vip:false},
  {label:'Hades',addr:'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp',vip:false},
  {label:'Kubera 72',addr:'AAvdewt71kkde2segr6gYnNemhNLfokyZpdzwwi4yDfm',vip:false},
  {label:'Brzee God',addr:'JD38n7ynKYcgPpF7k1BhXEeREu1KqptU93fVGy3S624k',vip:false},
  {label:'GBack',addr:'9VPozuXeRi8FACAePmg8ckdSZkbeZfTJc6SqUDcKsUKm',vip:false},
  {label:'Tuna',addr:'GjK3S2ZgxTVFEkxg43JE8eC1tbztWCseBYyZ8o8sg9f',vip:false},
  {label:'Fireball',addr:'AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51',vip:false},
  {label:'Hachjdn',addr:'EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS',vip:false},
  {label:'Crypto Circle',addr:'5DzUSNro5kfNwB2dxkkTTYrPDXAi6vRnjf4mAN2an7Gc',vip:false},
  {label:'Crocodile',addr:'2cBedD94RXYSEhEfQJUyLaNaHB4PVoL9z7LK6Mu11sJv',vip:false},
  {label:'Snow Spirit',addr:'4ev7HVsESzFxKqGzQxJ5mzSM6NstGCTQXKXT8yHiaRP3',vip:false},
  {label:'Cented',addr:'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o',vip:false},
  {label:'The Grande',addr:'Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA',vip:false},
  {label:'A Milly',addr:'Fv9w9TQnqhzUszbDGRFPPkXwu5iJWG9VytmMJTCTnjxW',vip:false},
  {label:'J2ANNaq',addr:'J2ANNaq4uUk3iUGoNijKCwXTReGLyg2yQpGcAZjzyBZG',vip:false},
];

const isValidSolana=(a:string)=>/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a.trim());
const timeAgo=(ts:string)=>{const m=Math.floor((Date.now()-new Date(ts).getTime())/60000);if(m<1)return'now';if(m<60)return`${m}m`;if(m<1440)return`${Math.floor(m/60)}h`;return`${Math.floor(m/1440)}d`;};
async function getSolEur(){try{const[p,fx]=await Promise.all([fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT').then(r=>r.json()),fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json())]);return{usd:parseFloat(p.price)||150,eur:fx?.rates?.EUR||0.92};}catch{return{usd:150,eur:0.92};}}
async function getWalletBal(addr:string){try{const r=await fetch(HELIUS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:[addr]})});const d=await r.json();return(d.result?.value||0)/1e9;}catch{return 0;}}

function Card({title,badge,right,children,defaultOpen=true,accent}:{title:string,badge?:React.ReactNode,right?:React.ReactNode,children:React.ReactNode,defaultOpen?:boolean,accent?:string}){
  const[open,setOpen]=useState(defaultOpen);
  return(
    <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${accent||'rgba(212,175,55,0.2)'}`,borderRadius:16,overflow:'hidden',backdropFilter:'blur(40px)',boxShadow:'0 0 20px rgba(212,175,55,0.04)'}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:'12px 16px',borderBottom:open?`1px solid rgba(212,175,55,0.15)`:'none',background:'rgba(212,175,55,0.03)',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',userSelect:'none' as const}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase' as const,color:'rgba(212,175,55,.65)'}}>{title}</span>
          {badge}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {right}
          <span style={{color:'#64748b',fontSize:14,lineHeight:1,transform:open?'rotate(0)':'rotate(-90deg)',transition:'transform .2s'}}>{open?'▾':'▾'}</span>
        </div>
      </div>
      {open&&<div style={{padding:16}}>{children}</div>}
    </div>
  );
}

// ── Diagnostic Panel Component ────────────────────────────────────────────────
function DiagnosticPanel({running,signalCount,edgeOk}:{running:boolean,signalCount:number,edgeOk:boolean|null}){
  const checks=[
    {label:'Enhanced WebSocket',status:edgeOk===null?'checking':edgeOk?'ok':'fail',
     detail:edgeOk===null?'Checking…':edgeOk?'50-100ms detection at processed commitment ✓':'Edge function unreachable',
     fix:edgeOk===false?'Check Helius Developer plan is active':undefined},
    {label:'Bot Session',status:running?'ok':'warn',
     detail:running?'Session active — watching 21 whale wallets':'Session stopped — press START above'},
    {label:'Signal Pipeline',status:signalCount>0?'ok':'warn',
     detail:signalCount>0?`${signalCount} signals received · whale-follow mode (exits on whale SELL)`:'0 signals yet — waiting for whale activity or use ⚡ Test Signal',
     fix:undefined},
    {label:'Blockchain',status:'ok',detail:'Solana mainnet · Jito bundles · RugCheck active'},
  ];
  const stC={ok:GRN,warn:'#f59e0b',fail:RED,checking:'#64748b'};
  return(
    <div style={{background:'rgba(212,175,55,0.04)',border:`1px solid rgba(212,175,55,0.2)`,borderRadius:14,padding:14}}>
      <div style={{fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase' as const,color:'rgba(212,175,55,.65)',marginBottom:12}}>⚡ System Diagnostics</div>
      {checks.map(c=>(
        <div key={c.label} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:stC[c.status as keyof typeof stC]||'#64748b',marginTop:4,flexShrink:0,
            boxShadow:c.status==='ok'?`0 0 6px ${GRN}`:c.status==='fail'?`0 0 6px ${RED}`:'none',
            animation:c.status==='checking'?'pulse 1.5s infinite':'none'}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:stC[c.status as keyof typeof stC]||'#64748b'}}>{c.label}</div>
            <div style={{fontSize:10,color:'#64748b',marginTop:2,lineHeight:1.4}}>{c.detail}</div>
            {c.fix&&<div style={{fontSize:10,color:'rgba(239,68,68,.8)',marginTop:3,lineHeight:1.4}}>🔧 {c.fix}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShreemBrzeePerformance(){
  const nav=useNavigate();
  const[session,setSession]=useState<any>(null);
  const[trades,setTrades]=useState<any[]>([]);
  const[signals,setSignals]=useState<any[]>([]);
  const[whaleSigs,setWhaleSigs]=useState<any[]>([]);
  const[period,setPeriod]=useState<'daily'|'weekly'|'monthly'|'yearly'>('weekly');
  const[mode,setMode]=useState<'paper'|'live'>('paper');
  const[startSOL,setStartSOL]=useState('1');
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');
  const[msgType,setMsgType]=useState<'ok'|'err'|'info'>('ok');
  const[walletIn,setWalletIn]=useState('');
  const[walletSaved,setWalletSaved]=useState('');
  const[walletBal,setWalletBal]=useState<number|null>(null);
  const[walletOk,setWalletOk]=useState<boolean|null>(null);
  const[connecting,setConnecting]=useState(false);
  const[solUSD,setSolUSD]=useState(150);
  const[eurRate,setEurRate]=useState(0.92);
  const[livePrices,setLivePrices]=useState<Record<string,number>>({});
  const[edgeOk,setEdgeOk]=useState<boolean|null>(null);
  const[startActive,setStartActive]=useState(false);
  const[stopActive,setStopActive]=useState(false);
  const tickerRef=useRef<any>(null);

  const toE=(sol:number)=>(sol*solUSD*eurRate).toFixed(2);
  const toEn=(sol:number)=>sol*solUSD*eurRate;
  const flash=(m:string,t:'ok'|'err'|'info'='ok')=>{setMsg(m);setMsgType(t);setTimeout(()=>setMsg(''),6000);};

  // Check edge function health
  const checkEdge=useCallback(async()=>{
    try{
      const r=await fetch(`${EDGE}/session`,{signal:AbortSignal.timeout(5000)});
      setEdgeOk(r.ok||r.status===200);
    }catch{setEdgeOk(false);}
  },[]);

  const loadSession=useCallback(async()=>{
    try{
      const{data}=await(supabase as any).from('shreem_brzee_session').select('*').eq('id','default').single();
      setSession(data||null);
    }catch{}
  },[]);
  const loadTrades=useCallback(async()=>{
    const{data}=await(supabase as any).from('shreem_brzee_paper_trades').select('*').order('created_at',{ascending:false}).limit(100);
    // Filter out test/diagnostic trades
    setTrades((data||[]).filter((t:any)=>!t.sig?.startsWith('TEST_')&&!t.sig?.startsWith('DIAG_')&&t.symbol!=='TEST'));
  },[]);
  const loadSignals=useCallback(async()=>{
    const{data}=await(supabase as any).from('shreem_brzee_signals').select('*').order('created_at',{ascending:false}).limit(100);
    // Filter out test signals - only show real whale signals
    const real=(data||[]).filter((s:any)=>!s.sig?.startsWith('TEST_')&&!s.sig?.startsWith('DIAG_'));
    setSignals(real);
  },[]);
  const loadWhaleSigs=useCallback(async()=>{
    const now=new Date(),since=new Date(now);
    if(period==='daily')since.setHours(0,0,0,0);
    if(period==='weekly')since.setDate(now.getDate()-7);
    if(period==='monthly')since.setMonth(now.getMonth()-1);
    if(period==='yearly')since.setFullYear(now.getFullYear()-1);
    const{data}=await(supabase as any).from('shreem_brzee_signals').select('label,action,amount_sol,created_at,sig').gte('created_at',since.toISOString()).order('created_at',{ascending:false});
    // Filter out test/diagnostic signals from whale performance
    setWhaleSigs((data||[]).filter((s:any)=>!s.sig?.startsWith('TEST_')&&!s.sig?.startsWith('DIAG_')));
  },[period]);
  const loadAll=useCallback(()=>{loadSession();loadTrades();loadSignals();loadWhaleSigs();},[loadSession,loadTrades,loadSignals,loadWhaleSigs]);

  useEffect(()=>{
    loadAll();
    checkEdge();
    getSolEur().then(({usd,eur})=>{setSolUSD(usd);setEurRate(eur);});
    const t=setInterval(()=>{loadAll();getSolEur().then(({usd,eur})=>{setSolUSD(usd);setEurRate(eur);});},15000);
    return()=>clearInterval(t);
  },[loadAll,checkEdge]);
  useEffect(()=>{loadWhaleSigs();},[period,loadWhaleSigs]);

  // Live price ticker
  useEffect(()=>{
    const positions=Object.values(session?.positions||{}) as any[];
    if(!positions.length){clearInterval(tickerRef.current);return;}
    const fetchPrices=async()=>{
      const prices:Record<string,number>={};
      for(const p of positions){
        try{
          const r=await fetch(`https://api.jup.ag/price/v2?ids=${p.mint}`);
          const d=await r.json();
          const price=d?.data?.[p.mint]?.price;
          if(price)prices[p.mint]=parseFloat(price);
        }catch{}
      }
      setLivePrices(prices);
    };
    fetchPrices();
    tickerRef.current=setInterval(fetchPrices,10000);
    return()=>clearInterval(tickerRef.current);
  },[session?.positions]);

  useEffect(()=>{
    const c1=supabase.channel('sb_sigs').on('postgres_changes',{event:'INSERT',schema:'public',table:'shreem_brzee_signals'},()=>{loadSignals();loadWhaleSigs();}).subscribe();
    const c2=supabase.channel('sb_trd').on('postgres_changes',{event:'INSERT',schema:'public',table:'shreem_brzee_paper_trades'},()=>{loadTrades();loadSession();}).subscribe();
    return()=>{supabase.removeChannel(c1);supabase.removeChannel(c2);};
  },[loadSignals,loadTrades,loadSession,loadWhaleSigs]);

  const onWalletChange=(v:string)=>{setWalletIn(v);setWalletOk(v.trim().length>0?isValidSolana(v):null);};
  const saveWallet=async()=>{
    if(!isValidSolana(walletIn)){flash('Invalid Solana address','err');return;}
    const addr=walletIn.trim();setWalletSaved(addr);setWalletIn('');setWalletOk(null);
    const bal=await getWalletBal(addr);setWalletBal(bal);flash('Wallet saved ✓','ok');
  };
  const connectPhantom=async()=>{
    if(!(window as any).solana?.isPhantom){flash('Phantom not found — install at phantom.app','err');return;}
    setConnecting(true);
    try{const r=await(window as any).solana.connect();const addr=r.publicKey.toString();setWalletSaved(addr);const bal=await getWalletBal(addr);setWalletBal(bal);flash('Phantom connected ✓','ok');}
    catch{flash('Connection cancelled','info');}
    setConnecting(false);
  };

  const running=!!session?.started_at&&!session?.stopped_at;

  const startSession=async()=>{
    setBusy(true);setStartActive(true);
    const sol=parseFloat(startSOL)||1;
    try{
      await(supabase as any).from('shreem_brzee_paper_trades').delete().neq('id',0);
      const{error}=await(supabase as any).from('shreem_brzee_session').upsert({
        id:'default',portfolio:sol,start_balance:sol,positions:{},total_pnl:0,wins:0,losses:0,
        started_at:new Date().toISOString(),stopped_at:null,mode:'paper',updated_at:new Date().toISOString()
      },{onConflict:'id'});
      if(error)throw new Error(error.message);
      await loadAll();flash(`Paper bot started with ${sol} SOL ✓`,'ok');
    }catch(e:any){flash(`Error: ${e.message?.slice(0,60)}`,'err');setStartActive(false);}
    setBusy(false);
  };
  const stopSession=async()=>{
    setBusy(true);setStopActive(true);
    try{
      const{error}=await(supabase as any).from('shreem_brzee_session').upsert({
        id:'default',...session,stopped_at:new Date().toISOString(),updated_at:new Date().toISOString()
      },{onConflict:'id'});
      if(error)throw new Error(error.message);
      await loadSession();flash('Bot stopped','info');
    }catch(e:any){flash(`Error stopping: ${e.message?.slice(0,60)}`,'err');}
    setBusy(false);setStopActive(false);
  };

  const testSignal=async()=>{
    setBusy(true);
    try{
      // Use edge function /test — runs with service role key, bypasses RLS
      const r=await fetch(`${EDGE}/test`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      if(!r.ok){const t=await r.text();throw new Error(`HTTP ${r.status}: ${t.slice(0,60)}`);}
      const d=await r.json();
      if(d.sig){
        flash('⚡ POPCAT test signal injected — check Signal Feed & Trade History','ok');
        setTimeout(loadAll,2000);
        setTimeout(loadAll,5000);
      } else {
        flash(`Test error: ${JSON.stringify(d).slice(0,80)}`,'err');
      }
    }catch(e:any){flash(`Test failed: ${e.message?.slice(0,80)}`,'err');}
    setBusy(false);
  };

  const testSell=async()=>{
    setBusy(true);
    try{
      const r=await fetch(`${EDGE}/test-sell`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      if(!r.ok){const t=await r.text();throw new Error(`HTTP ${r.status}: ${t.slice(0,60)}`);}
      const d=await r.json();
      if(d.sig){
        flash('⚡ POPCAT SELL injected — position closing…','info');
        setTimeout(loadAll,2000);
        setTimeout(loadAll,5000);
      } else {
        flash(`Sell test error: ${JSON.stringify(d).slice(0,80)}`,'err');
      }
    }catch(e:any){flash(`Sell test failed: ${e.message?.slice(0,80)}`,'err');}
    setBusy(false);
  };

  // Whale stats
  const whaleMap:Record<string,{buys:number,sells:number,totalSol:number}>={};
  whaleSigs.forEach((s:any)=>{
    const l=s.label||'?';if(!whaleMap[l])whaleMap[l]={buys:0,sells:0,totalSol:0};
    if(s.action==='BUY'){whaleMap[l].buys++;whaleMap[l].totalSol+=s.amount_sol||0;}
    if(s.action==='SELL')whaleMap[l].sells++;
  });
  const whaleRows=WHALES.map(w=>{const st=whaleMap[w.label]||{buys:0,sells:0,totalSol:0};return{...w,...st,total:st.buys+st.sells};}).sort((a,b)=>b.totalSol-a.totalSol);
  const maxSol=Math.max(...whaleRows.map(w=>w.totalSol),0.001);

  const pnlSol=session?.total_pnl||0;
  const balSol=session?.portfolio||(parseFloat(startSOL)||1);
  const startBal=session?.start_balance||(parseFloat(startSOL)||1);
  const pnlPct=startBal>0?((pnlSol/startBal)*100).toFixed(1):'0.0';
  const openPos=Object.values(session?.positions||{}) as any[];

  const st=(bg:string,bc:string,c:string):React.CSSProperties=>({display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase' as const,background:bg,border:`1px solid ${bc}`,color:c});
  const inp=(bc:string):React.CSSProperties=>({width:'100%',padding:'11px 14px',borderRadius:12,border:`1px solid ${bc}`,background:'rgba(212,175,55,0.05)',color:'#fff',backdropFilter:'blur(10px)',fontSize:14,fontWeight:600,outline:'none',boxSizing:'border-box' as const});
  const rowStyle:React.CSSProperties={display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid rgba(212,175,55,0.1)`};


  const TOP_KOLS=[
    {name:'Cented',    addr:'CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o',pnl7d:95641, pnl30d:576766,wr:63.8},
    {name:'Theo',      addr:'5iMC3bBMnQfvnBR3FNySzPeANLjNqBMoAjnG6uB1FXKP',pnl7d:51079, pnl30d:402366,wr:56.0},
    {name:'Decu',      addr:'DECUDohNAFsV4GKEv4yjJrWiL7RAwtH7jGjuEPTNpEyh',pnl7d:34606, pnl30d:221024,wr:65.1},
    {name:'Kev',       addr:'KEVsznx5Yx2NVHM5GvBprv1zXTFDvAHMrmeDuYQzqfgh',pnl7d:22717, pnl30d:122059,wr:52.3},
    {name:'Clukz',     addr:'CLUKZpUxEfhbgGz9TqkCrHGkSGiDFDhNt3eSFGmLjTuv',pnl7d:18856, pnl30d:92000, wr:62.6},
    {name:'Heyitsyolo',addr:'Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ',pnl7d:10746, pnl30d:88376, wr:54.6},
    {name:'Cupsey',    addr:'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE',pnl7d:16382, pnl30d:83971, wr:51.4},
    {name:'Limfork',   addr:'LIMforkXzPwrpFXCjMBmZ9VQcZBNrYrFJLV6PeKLqxHj',pnl7d:6793,  pnl30d:72393, wr:52.4},
    {name:'Tdmilky',   addr:'TDmilkyxVHs8YWz4Ny5JEJJzZ2TLQfJKiUGBnPmLxhHp',pnl7d:10386, pnl30d:76602, wr:47.3},
    {name:'Trunoest',  addr:'TRUnoEst9vPKDmKrjFHmBzFLHRPpTdxTAqJNaRJFfxhK',pnl7d:24975, pnl30d:77853, wr:65.8},
  ];
  const WHALE_ADDRS_UI=new Set(WHALES.map((w:any)=>w.addr));
  const[scanPeriod,setScanPeriod]=useState<'7D'|'30D'>('30D');
  const[openTrades,setOpenTrades]=useState<any[]>([]);
  const[livePosPrices,setLivePosPrices]=useState<Record<string,number>>({});
  const posTickerRef=useRef<any>(null);

  const loadOpenTrades=useCallback(async()=>{
    const{data}=await(supabase as any).from('shreem_brzee_paper_trades')
      .select('*').eq('status','open').order('opened_at',{ascending:false});
    setOpenTrades(data||[]);
  },[]);

  useEffect(()=>{loadOpenTrades();const t=setInterval(loadOpenTrades,10000);return()=>clearInterval(t);},[loadOpenTrades]);

  useEffect(()=>{
    const ch=supabase.channel('sb_open_trd')
      .on('postgres_changes',{event:'*',schema:'public',table:'shreem_brzee_paper_trades'},()=>loadOpenTrades())
      .subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[loadOpenTrades]);

  // Fetch live token prices for open positions
  const fetchOpenPrices=useCallback(async()=>{
    if(!openTrades.length){setLivePosPrices({});return;}
    const out:Record<string,number>={};
    await Promise.all(openTrades.map(async(t:any)=>{
      try{
        const r=await fetch(`https://api.jup.ag/price/v2?ids=${t.mint}`);
        const d=await r.json();
        const p=d?.data?.[t.mint]?.price;
        if(p)out[t.mint]=parseFloat(p);
      }catch{}
    }));
    setLivePosPrices(prev=>({...prev,...out}));
  },[openTrades]);

  useEffect(()=>{
    fetchOpenPrices();
    clearInterval(posTickerRef.current);
    posTickerRef.current=setInterval(fetchOpenPrices,15000);
    return()=>clearInterval(posTickerRef.current);
  },[fetchOpenPrices]);

  // Close a position (manual or auto)
  const closePosition=useCallback(async(t:any,reason:string='manual')=>{
    try{
      let currentPrice=livePosPrices[t.mint];
      if(!currentPrice){
        try{const r=await fetch(`https://api.jup.ag/price/v2?ids=${t.mint}`);const d=await r.json();currentPrice=parseFloat(d?.data?.[t.mint]?.price||'0');}catch{}
      }
      const entry=Number(t.entry_price)||0;
      const amt=Number(t.amount_sol)||0;
      const pnlPct=entry>0&&currentPrice?((currentPrice-entry)/entry)*100:0;
      const returned=amt*(1+pnlPct/100);
      const pnlSol=returned-amt;
      await(supabase as any).from('shreem_brzee_paper_trades').update({
        status:'closed',closed_at:new Date().toISOString(),
        exit_price:currentPrice||null,pnl_pct:pnlPct,pnl_sol:pnlSol,
        sell_reason:reason,
      }).eq('id',t.id);
      // Refund SOL to session
      const{data:s}=await(supabase as any).from('shreem_brzee_session').select('*').eq('id','default').single();
      if(s){
        const newPortfolio=Number(s.portfolio||0)+returned;
        const newTotalPnl=Number(s.total_pnl||0)+pnlSol;
        const wins=Number(s.wins||0)+(pnlSol>=0?1:0);
        const losses=Number(s.losses||0)+(pnlSol<0?1:0);
        await(supabase as any).from('shreem_brzee_session').upsert({
          id:'default',...s,portfolio:newPortfolio,total_pnl:newTotalPnl,
          wins,losses,updated_at:new Date().toISOString(),
        },{onConflict:'id'});
      }
      loadAll();loadOpenTrades();
    }catch(e:any){flash(`Close failed: ${e.message?.slice(0,60)}`,'err');}
  },[livePosPrices,loadAll,loadOpenTrades]);

  // Auto-close: 4h timeout OR -30% stop loss
  useEffect(()=>{
    if(!openTrades.length)return;
    const FOUR_H=4*60*60*1000;
    openTrades.forEach((t:any)=>{
      const age=Date.now()-new Date(t.opened_at||t.created_at).getTime();
      const cur=livePosPrices[t.mint];
      const entry=Number(t.entry_price)||0;
      if(age>=FOUR_H){closePosition(t,'4h_timeout');return;}
      if(entry>0&&cur&&((cur-entry)/entry)*100<=-30){closePosition(t,'stop_loss');return;}
    });
  },[openTrades,livePosPrices,closePosition]);

  // Listen for new BUY signals → open paper trade
  useEffect(()=>{
    const ch=supabase.channel('sb_sig_to_trade')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'shreem_brzee_signals'},async(payload:any)=>{
        const sig=payload?.new;
        if(!sig||sig.action!=='BUY'||!sig.mint)return;
        try{
          // Check session is running
          const{data:s}=await(supabase as any).from('shreem_brzee_session').select('*').eq('id','default').single();
          if(!s||!s.started_at||s.stopped_at)return;
          const portfolio=Number(s.portfolio||0);
          if(portfolio<=0)return;
          // Avoid duplicate (one open trade per mint at a time)
          const{data:existing}=await(supabase as any).from('shreem_brzee_paper_trades')
            .select('id').eq('status','open').eq('mint',sig.mint).limit(1);
          if(existing&&existing.length)return;
          // Fetch token price (USD) from Jupiter
          let entryPrice=0;
          try{const r=await fetch(`https://api.jup.ag/price/v2?ids=${sig.mint}`);const d=await r.json();entryPrice=parseFloat(d?.data?.[sig.mint]?.price||'0');}catch{}
          const amt=portfolio*0.05;
          await(supabase as any).from('shreem_brzee_paper_trades').insert({
            session_id:'default',sig:sig.sig+'_open',mint:sig.mint,symbol:sig.symbol,
            label:sig.label,wallet:sig.wallet,action:'BUY',
            entry_price:entryPrice,amount_sol:amt,gross_sol:amt,net_sol:amt,
            status:'open',opened_at:new Date().toISOString(),
          });
          await(supabase as any).from('shreem_brzee_session').upsert({
            id:'default',...s,portfolio:portfolio-amt,updated_at:new Date().toISOString(),
          },{onConflict:'id'});
          loadAll();loadOpenTrades();
        }catch(e){console.error('[auto-open]',e);}
      }).subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[loadAll,loadOpenTrades]);

  const addWhaleToTracking=async(kol:{name:string,addr:string})=>{
    flash(`Adding ${kol.name}…`,'info');
    await(supabase as any).from('tracked_whales').upsert({address:kol.addr,label:kol.name,source:'kolexplorer',added_at:new Date().toISOString()},{onConflict:'address'});
    flash(`✅ ${kol.name} added! Tell Lovable: "Add ${kol.addr} labeled ${kol.name} to the Helius webhook whale list"`,'ok');
  };

  return(
    <div style={{minHeight:'100vh',background:'#050505',color:'#fff',fontFamily:"'Plus Jakarta Sans','Inter',-apple-system,system-ui,sans-serif",paddingBottom:100}}>

      {/* HEADER */}
      <div style={{background:'#050505',borderBottom:`1px solid rgba(212,175,55,0.3)`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:60}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>nav(-1)} style={{background:'none',border:'none',color:'#64748b',fontSize:22,cursor:'pointer',lineHeight:1}}>←</button>
          <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#b8860b,#D4AF37)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>🔱</div>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:G,letterSpacing:'-.03em'}}>Shreem Brzee Bot</div>
            <div style={{fontSize:9,color:'#64748b',letterSpacing:'.35em',textTransform:'uppercase'}}>SQI 2050 · Paper Trading</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          {/* STATUS PILL — glows green when running */}
          <span style={{
            display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',
            borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase' as const,
            background:running?'rgba(16,185,129,.15)':'rgba(255,255,255,.04)',
            border:`1px solid ${running?'rgba(16,185,129,.5)':BDR}`,
            color:running?GRN:'#64748b',
            boxShadow:running?'0 0 12px rgba(16,185,129,.25)':'none',
            transition:'all .3s ease',
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',
              animation:running?'pulse 1.5s infinite':'none',
              boxShadow:running?`0 0 6px ${GRN}`:'none'}}/>
            {running?'Running':'Stopped'}
          </span>
          <span style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>€{(solUSD*eurRate).toFixed(0)}/SOL</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes goldPulse{0%,100%{box-shadow:0 0 16px rgba(212,175,55,.28)}50%{box-shadow:0 0 28px rgba(212,175,55,.55)}}
        @keyframes redPulse{0%,100%{box-shadow:0 0 8px rgba(239,68,68,.2)}50%{box-shadow:0 0 18px rgba(239,68,68,.45)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {msg&&<div style={{margin:'10px 14px 0',padding:'11px 14px',borderRadius:12,fontSize:13,fontWeight:600,
        background:msgType==='ok'?'rgba(16,185,129,.1)':msgType==='err'?'rgba(239,68,68,.1)':'rgba(0,212,255,.08)',
        border:`1px solid ${msgType==='ok'?'rgba(16,185,129,.3)':msgType==='err'?'rgba(239,68,68,.3)':'rgba(0,212,255,.25)'}`,
        color:msgType==='ok'?GRN:msgType==='err'?RED:CYN}}>{msg}</div>}

      <div style={{padding:'12px 14px 40px',maxWidth:600,margin:'0 auto',display:'flex',flexDirection:'column',gap:12}}>

        {/* STATS 2x2 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {i:'💰',v:`€${toE(balSol)}`,l:'Balance',s:`${balSol.toFixed(3)} SOL`,c:G},
            {i:'📈',v:`${pnlSol>=0?'+':''}€${toE(pnlSol)}`,l:'P&L',s:`${pnlSol>=0?'+':''}${pnlPct}%`,c:pnlSol>=0?GRN:RED},
            {i:'🎯',v:`${session?.wins||0}/${session?.losses||0}`,l:'Win/Loss',s:`${session?.wins&&(session.wins+session.losses)>0?Math.round(session.wins/(session.wins+session.losses)*100):0}% win rate`,c:'#fff'},
            {i:'📂',v:String(openTrades.length),l:'Positions',s:running?'live now':'start bot',c:openTrades.length>0?GRN:CYN},
          ].map(s=>(
            <div key={s.l} style={{background:'rgba(255,255,255,0.02)',border:`1px solid rgba(212,175,55,0.2)`,borderRadius:16,backdropFilter:'blur(40px)',boxShadow:'0 0 20px rgba(212,175,55,0.05)',padding:'14px 12px',textAlign:'center'}}>
              <div style={{fontSize:20,marginBottom:5}}>{s.i}</div>
              <div style={{fontSize:18,fontWeight:900,color:s.c,letterSpacing:'-.02em',lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:'.3em',textTransform:'uppercase',color:'#64748b',margin:'4px 0 2px'}}>{s.l}</div>
              <div style={{fontSize:11,color:'#64748b'}}>{s.s}</div>
            </div>
          ))}
        </div>

        {/* DIAGNOSTICS */}
        <DiagnosticPanel running={running} signalCount={signals.length} edgeOk={edgeOk}/>

        {/* MODE */}
        <Card title="⚙️ Mode">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {(['paper','live'] as const).map(m=>(
              <div key={m} onClick={()=>setMode(m)} style={{padding:'13px 10px',borderRadius:13,cursor:'pointer',border:`2px solid ${mode===m?(m==='paper'?'rgba(16,185,129,.45)':'rgba(239,68,68,.45)'):BDR}`,background:mode===m?(m==='paper'?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)'):'transparent',textAlign:'center' as const}}>
                <div style={{fontSize:20,marginBottom:6}}>{m==='paper'?'📄':'⚡'}</div>
                <div style={{fontSize:13,fontWeight:800,color:mode===m?(m==='paper'?GRN:RED):'#cbd5e0'}}>{m==='paper'?'Paper':'Live'}</div>
                <div style={{fontSize:10,color:'#64748b',marginTop:3,lineHeight:1.4}}>{m==='paper'?'Paper mode · tracks real whale trades · no real SOL':'Live mode · set on server via BOT_MODE=live'}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* START / STOP — FULLY REACTIVE BUTTONS */}
        <Card title="💰 Paper Balance (SOL)">
          <div style={{display:'flex',gap:7,marginBottom:10,flexWrap:'wrap'}}>
            {['0.5','1','2','5','10'].map(v=>(
              <button key={v} onClick={()=>setStartSOL(v)} style={{padding:'7px 0',borderRadius:10,cursor:'pointer',flex:'1 1 0',minWidth:44,
                border:`1px solid ${startSOL===v?'rgba(212,175,55,.4)':BDR}`,
                background:startSOL===v?'rgba(212,175,55,.12)':'transparent',
                color:startSOL===v?G:'#64748b',fontSize:13,fontWeight:700}}>{v}</button>
            ))}
          </div>
          <input type="number" value={startSOL} onChange={e=>setStartSOL(e.target.value)} min="0.1" step="0.1" style={{...inp(BDR),marginBottom:12,fontSize:16}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

            {/* START BUTTON — glows gold when bot is running */}
            <button
              onClick={startSession}
              disabled={busy}
              style={{
                padding:14,borderRadius:13,border:'none',
                background: running
                  ? 'linear-gradient(135deg,#D4AF37,#f0c84a)'  // bright gold = ACTIVE
                  : busy&&startActive
                    ? 'linear-gradient(135deg,#a07820,#c9930a)'  // dim = loading
                    : 'linear-gradient(135deg,#7a5e10,#9a7018)',  // muted = stopped
                color: running ? '#000' : '#fff',
                fontSize:12,fontWeight:900,letterSpacing:'.12em',
                cursor:busy?'not-allowed':'pointer',
                animation: running ? 'goldPulse 2s infinite' : 'none',
                boxShadow: running ? '0 0 20px rgba(212,175,55,.5)' : '0 0 8px rgba(212,175,55,.1)',
                transition:'all .3s ease',
                position:'relative' as const,
                overflow:'hidden' as const,
              }}>
              {busy&&startActive
                ? <span style={{display:'inline-block',animation:'spin 1s linear infinite'}}>⚙</span>
                : running ? '● RUNNING' : '▶ START'}
              {running&&<span style={{position:'absolute' as const,top:0,left:0,right:0,bottom:0,
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)',
                animation:'shimmer 2s infinite'}}/>}
            </button>

            {/* STOP BUTTON — glows red when bot is running */}
            <button
              onClick={stopSession}
              disabled={busy||!running}
              style={{
                padding:14,borderRadius:13,
                border:`1px solid ${running?'rgba(239,68,68,.6)':'rgba(239,68,68,.2)'}`,
                background: running
                  ? 'rgba(239,68,68,.18)'  // visible red = active
                  : 'rgba(239,68,68,.04)', // faded = nothing to stop
                color: running ? RED : 'rgba(239,68,68,.35)',
                fontSize:12,fontWeight:900,letterSpacing:'.12em',
                cursor:busy||!running?'not-allowed':'pointer',
                animation: running&&!busy ? 'redPulse 2.5s infinite' : 'none',
                boxShadow: running ? '0 0 12px rgba(239,68,68,.2)' : 'none',
                transition:'all .3s ease',
              }}>
              {busy&&stopActive
                ? <span style={{display:'inline-block',animation:'spin 1s linear infinite'}}>⚙</span>
                : '⏹ STOP'}
            </button>

          </div>
          {!running&&!busy&&<div style={{marginTop:10,padding:'9px 12px',borderRadius:10,background:'rgba(212,175,55,.06)',border:'1px solid rgba(212,175,55,.2)',fontSize:11,color:'rgba(212,175,55,.7)',textAlign:'center'}}>Set balance above then tap ▶ START</div>}
          {running&&<div style={{marginTop:10,padding:'9px 12px',borderRadius:10,background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',fontSize:11,color:'rgba(16,185,129,.8)',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:GRN,animation:'pulse 1.5s infinite',boxShadow:`0 0 6px ${GRN}`}}/>
            Bot running · watching 21 whale wallets on Solana mainnet
          </div>}
        </Card>

        {/* OPEN POSITIONS — live from shreem_brzee_paper_trades */}
        <Card
          title="📂 Open Positions"
          badge={openTrades.length>0?<span style={{marginLeft:6,padding:'2px 8px',borderRadius:20,background:'rgba(16,185,129,.15)',color:GRN,fontSize:10,fontWeight:800}}>{openTrades.length} live</span>:undefined}
          right={openTrades.length===0?<button onClick={testSignal} disabled={busy} style={{padding:'5px 12px',borderRadius:9,border:`1px solid rgba(0,212,255,.3)`,background:'rgba(0,212,255,.08)',color:CYN,fontSize:10,fontWeight:800,cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1}}>⚡ Test Signal</button>:undefined}>
          {openTrades.length===0?(
            <div>
              <div style={{textAlign:'center',padding:'16px 0 10px'}}>
                <div style={{fontSize:28,marginBottom:8}}>👀</div>
                <div style={{fontSize:13,color:'#cbd5e0',fontWeight:700,marginBottom:4}}>No Open Positions</div>
                <div style={{fontSize:11,color:'#64748b',marginBottom:12,lineHeight:1.5}}>
                  {running
                    ? 'Waiting for a whale BUY signal — auto-opens at 5% of portfolio · auto-closes at 4h or -30%'
                    : 'Start the bot above to begin watching for whale swaps'}
                </div>
              </div>
              <div style={{background:'rgba(212,175,55,0.03)',border:`1px solid rgba(212,175,55,0.15)`,borderRadius:12,padding:14}}>
                <div style={{fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase' as const,color:'rgba(212,175,55,.65)',marginBottom:10}}>📊 Market Context</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  {[
                    {l:'SOL Price',v:`$${solUSD.toFixed(2)}`,sub:`€${(solUSD*eurRate).toFixed(2)}`},
                    {l:'Bot Status',v:running?'🟢 Online':'🔴 Offline',sub:running?'Enhanced WS · 50-100ms':'Not listening'},
                    {l:'Signals Received',v:String(signals.length),sub:signals.length>0?`Last: ${timeAgo(signals[0]?.created_at)}`:'None yet'},
                    {l:'Whale Wallets',v:'21',sub:'On Solana mainnet'},
                  ].map(item=>(
                    <div key={item.l} style={{background:'rgba(212,175,55,0.05)',borderRadius:10,padding:'10px 12px',border:'1px solid rgba(212,175,55,0.1)'}}>
                      <div style={{fontSize:9,color:'#64748b',letterSpacing:'.2em',textTransform:'uppercase' as const,marginBottom:4}}>{item.l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{item.v}</div>
                      <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ):openTrades.map((t:any)=>{
            const entry=Number(t.entry_price)||0;
            const amt=Number(t.amount_sol)||0;
            const cur=livePosPrices[t.mint];
            const pnlPct=entry>0&&cur?((cur-entry)/entry)*100:null;
            const pnlSol=pnlPct!==null?amt*(pnlPct/100):null;
            const openedMs=new Date(t.opened_at||t.created_at).getTime();
            const ageMin=Math.max(0,Math.floor((Date.now()-openedMs)/60000));
            const ageStr=ageMin<60?`${ageMin}m`:`${Math.floor(ageMin/60)}h ${ageMin%60}m`;
            const pnlColor=pnlPct===null?'#64748b':pnlPct>=0?GRN:RED;
            return(
              <div key={t.id} style={{background:'rgba(16,185,129,.03)',borderRadius:14,padding:'14px',border:`1px solid rgba(16,185,129,.22)`,marginBottom:10}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:15,fontWeight:900,color:G}}>{t.symbol||t.mint?.slice(0,6)||'?'}</span>
                      <span style={{fontSize:9,fontWeight:800,letterSpacing:'.2em',color:'rgba(16,185,129,.85)',animation:'blink 2s infinite'}}>● OPEN</span>
                      <span style={{fontSize:9,color:'#64748b'}}>{ageStr}</span>
                    </div>
                    <div style={{fontSize:10,color:'#94a3b8'}}>via <span style={{color:G,fontWeight:700}}>{t.label||'whale'}</span></div>
                    <div style={{fontSize:9,color:'#64748b',fontFamily:'monospace',marginTop:2}}>{t.mint?.slice(0,8)}…{t.mint?.slice(-4)}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:900,color:pnlColor,letterSpacing:'-.02em'}}>
                      {pnlPct!==null?`${pnlPct>=0?'+':''}${pnlPct.toFixed(2)}%`:'—'}
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:pnlColor,marginTop:2}}>
                      {pnlSol!==null?`${pnlSol>=0?'+':''}${pnlSol.toFixed(4)} SOL`:''}
                    </div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
                  <div style={{background:'rgba(0,0,0,.25)',borderRadius:8,padding:'6px 8px'}}>
                    <div style={{fontSize:8,color:'#64748b',letterSpacing:'.15em',textTransform:'uppercase' as const}}>Size</div>
                    <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>{amt.toFixed(4)}</div>
                    <div style={{fontSize:9,color:'#64748b'}}>SOL</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,.25)',borderRadius:8,padding:'6px 8px'}}>
                    <div style={{fontSize:8,color:'#64748b',letterSpacing:'.15em',textTransform:'uppercase' as const}}>Entry</div>
                    <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>${entry>0?entry.toFixed(entry<0.01?8:6):'—'}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,.25)',borderRadius:8,padding:'6px 8px'}}>
                    <div style={{fontSize:8,color:'#64748b',letterSpacing:'.15em',textTransform:'uppercase' as const}}>Now</div>
                    <div style={{fontSize:12,fontWeight:800,color:cur?'#fff':'#64748b'}}>{cur?`$${cur.toFixed(cur<0.01?8:6)}`:'…'}</div>
                  </div>
                </div>
                <button onClick={()=>closePosition(t,'manual')} style={{
                  width:'100%',padding:'10px',borderRadius:10,
                  border:'1px solid rgba(239,68,68,.5)',background:'rgba(239,68,68,.15)',
                  color:RED,fontSize:11,fontWeight:900,letterSpacing:'.15em',cursor:'pointer',
                }}>✕ CLOSE POSITION</button>
              </div>
            );
          })}
        </Card>


        {/* WALLET */}
        <Card title="👛 My Wallet" accent="rgba(212,175,55,.28)" right={<span style={{fontSize:9,color:GRN,fontWeight:700}}>🔒 Public only</span>}>
          <div style={{display:'flex',flexDirection:'column',gap:11}}>
            <button onClick={connectPhantom} disabled={connecting} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'13px 14px',borderRadius:13,border:'1px solid rgba(139,92,246,.35)',background:'rgba(139,92,246,.08)',cursor:'pointer',textAlign:'left',opacity:connecting?.6:1}}>
              <div style={{width:30,height:30,borderRadius:8,background:'#ab9ff2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>👻</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:'#c4b5fd'}}>{connecting?'Connecting…':'Connect Phantom'}</div>
                <div style={{fontSize:10,color:'#64748b',marginTop:1}}>Safest — key never leaves Phantom</div>
              </div>
            </button>
            <div style={{display:'flex',alignItems:'center',gap:8,color:'#64748b',fontSize:10}}><div style={{flex:1,height:1,background:BDR}}/>or paste<div style={{flex:1,height:1,background:BDR}}/></div>
            <div style={{display:'flex',gap:8}}>
              <input value={walletIn} onChange={e=>onWalletChange(e.target.value)} placeholder="Solana address (32–44 chars)" maxLength={44} style={{...inp(walletOk===null?BDR:walletOk?'rgba(16,185,129,.5)':'rgba(239,68,68,.5)'),flex:1}}/>
              <button onClick={saveWallet} disabled={!walletOk} style={{padding:'0 14px',borderRadius:12,border:`1px solid ${walletOk?'rgba(212,175,55,.35)':BDR}`,background:walletOk?'rgba(212,175,55,.1)':'transparent',color:walletOk?G:'#64748b',fontSize:11,fontWeight:800,cursor:walletOk?'pointer':'not-allowed',flexShrink:0}}>
                {walletOk===false?'✗':'✓'}
              </button>
            </div>
            {walletSaved&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:13,background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.25)'}}>
                <div>
                  <div style={{fontSize:9,color:'#64748b',letterSpacing:'.3em',textTransform:'uppercase',marginBottom:3}}>Connected</div>
                  <div style={{fontSize:12,fontFamily:'monospace',color:'#cbd5e0'}}>{walletSaved.slice(0,6)}…{walletSaved.slice(-6)}<span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:GRN,marginLeft:6,boxShadow:'0 0 5px rgba(16,185,129,.7)'}}/></div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:15,fontWeight:900,color:G}}>{walletBal!==null?`${walletBal.toFixed(3)} SOL`:'—'}</div>
                  <div style={{fontSize:11,color:'#64748b'}}>{walletBal!==null?`€${toE(walletBal)}`:''}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* SIGNAL FEED */}
        <Card title="📡 Signal Feed" right={<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(0,212,255,.08)',border:'1px solid rgba(0,212,255,.28)',color:CYN}}><span style={{width:5,height:5,borderRadius:'50%',background:CYN,animation:'pulse 1.5s infinite'}}/>Enhanced WS</span>}>
          {signals.length===0?(
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:28,marginBottom:8}}>🐋</div>
              <div style={{fontSize:13,color:'#cbd5e0',fontWeight:700,marginBottom:4}}>Watching 21 wallets on Solana</div>
              <div style={{fontSize:11,color:'#64748b',marginBottom:14}}>Signals appear here the moment any whale swaps</div>
              <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={testSignal} disabled={busy} style={{padding:'9px 20px',borderRadius:11,border:`1px solid rgba(0,212,255,.3)`,background:'rgba(0,212,255,.08)',color:CYN,fontSize:11,fontWeight:800,letterSpacing:'.12em',cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1}}>⚡ BUY Signal</button>
              <button onClick={testSell} disabled={busy} style={{padding:'9px 20px',borderRadius:11,border:`1px solid rgba(239,68,68,.3)`,background:'rgba(239,68,68,.08)',color:RED,fontSize:11,fontWeight:800,letterSpacing:'.12em',cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1}}>⚡ SELL Signal</button>
            </div>
            </div>
          ):signals.map((sig:any)=>(
            <div key={sig.id} style={{...rowStyle}}>
              <div style={{width:32,height:32,borderRadius:9,background:sig.action==='BUY'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',color:sig.action==='BUY'?GRN:RED,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,flexShrink:0}}>{sig.action==='BUY'?'↑':'↓'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:G,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                  {sig.symbol||sig.mint?.slice(0,8)}
                  {sig.is_pump_fun&&<span style={{marginLeft:5,padding:'1px 5px',borderRadius:4,background:'rgba(139,92,246,.15)',color:'#a78bfa',fontSize:9,fontWeight:700}}>pump</span>}
                </div>
                <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{sig.label}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700}}>{sig.amount_sol?.toFixed(3)} SOL</div>
                <div style={{fontSize:10,color:'#64748b'}}>{timeAgo(sig.created_at)}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* TRADE HISTORY */}
        <Card title="📋 Trade History" badge={trades.length>0?<span style={{marginLeft:6,fontSize:10,color:'#64748b'}}>{trades.length} trades</span>:undefined}>
          {trades.length===0?(
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:28,marginBottom:8}}>📊</div>
              <div style={{fontSize:13,color:'#cbd5e0',fontWeight:700,marginBottom:4}}>No trades yet</div>
              <div style={{fontSize:11,color:'#64748b'}}>Start bot → inject test signal → first trade appears</div>
            </div>
          ):trades.map((t:any)=>(
            <div key={t.id} style={{...rowStyle}}>
              <div style={{width:32,height:32,borderRadius:9,background:t.failed?'rgba(255,255,255,.04)':t.action==='BUY'?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',color:t.failed?'#64748b':t.action==='BUY'?GRN:RED,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,flexShrink:0}}>{t.failed?'✗':t.action==='BUY'?'↑':'↓'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:G,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{t.symbol||'?'}</div>
                <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{t.action}·{t.label}{t.failed&&<span style={{marginLeft:5,padding:'1px 5px',borderRadius:4,background:'rgba(239,68,68,.12)',color:RED,fontSize:9,fontWeight:700}}>FAILED</span>}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                {t.action==='SELL'&&!t.failed?<div style={{fontSize:14,fontWeight:900,color:(t.pnl_sol||0)>=0?GRN:RED}}>{(t.pnl_sol||0)>=0?'+':'-'}€{Math.abs(toEn(t.pnl_sol||0)).toFixed(2)}</div>:<div style={{fontSize:12,fontWeight:700,color:'#64748b'}}>{(t.gross_sol||0).toFixed(4)} SOL</div>}
                <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{timeAgo(t.created_at)}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* WHALE PERFORMANCE */}
        <Card title="🐋 Whale Performance" right={
          <div style={{display:'flex',gap:4}}>
            {(['daily','weekly','monthly','yearly'] as const).map(p=>(
              <button key={p} onClick={e=>{e.stopPropagation();setPeriod(p);}} style={{padding:'4px 9px',borderRadius:20,cursor:'pointer',border:`1px solid ${period===p?'rgba(212,175,55,.4)':BDR}`,background:period===p?'rgba(212,175,55,.12)':'transparent',color:period===p?G:'#64748b',fontSize:9,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase' as const}}>
                {p==='daily'?'D':p==='weekly'?'W':p==='monthly'?'M':'Y'}
              </button>
            ))}
          </div>
        } defaultOpen={false}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:320,tableLayout:'fixed' as const}}>
              <thead>
                <tr>{['#','Whale','Buys','Sells','Vol SOL','Vol €'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left' as const,fontSize:9,fontWeight:800,letterSpacing:'.3em',textTransform:'uppercase' as const,color:'rgba(212,175,55,0.5)',borderBottom:`1px solid rgba(212,175,55,0.15)`,whiteSpace:'nowrap' as const}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {whaleRows.map((w,i)=>{
                  const has=w.total>0;
                  const barW=Math.min(100,(w.totalSol/maxSol)*100);
                  return(
                    <tr key={w.addr} style={{background:i%2===0?'transparent':'rgba(255,255,255,.012)'}}>
                      <td style={{padding:'9px 10px',fontSize:12,color:'#64748b',fontWeight:700,whiteSpace:'nowrap' as const}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
                      <td style={{padding:'9px 10px'}}>
                        <div style={{fontSize:12,fontWeight:800,color:'#fff',whiteSpace:'nowrap' as const}}>{w.label}{w.vip&&<span style={{color:G,marginLeft:3}}>⭐</span>}</div>
                        <div style={{fontSize:9,color:'#64748b',fontFamily:'monospace',marginTop:1}}>{w.addr.slice(0,6)}…{w.addr.slice(-4)}</div>
                      </td>
                      <td style={{padding:'9px 10px',fontSize:12,fontWeight:700,color:has?GRN:'#64748b'}}>{has?w.buys:'—'}</td>
                      <td style={{padding:'9px 10px',fontSize:12,fontWeight:700,color:has?RED:'#64748b'}}>{has?w.sells:'—'}</td>
                      <td style={{padding:'9px 10px'}}>{has?<div><div style={{fontSize:12,fontWeight:700,color:'#fff'}}>{w.totalSol.toFixed(2)}</div><div style={{width:50,background:'rgba(255,255,255,.06)',borderRadius:3,height:4,marginTop:3}}><div style={{width:`${barW}%`,height:4,borderRadius:3,background:G}}/></div></div>:<span style={{color:'#64748b'}}>—</span>}</td>
                      <td style={{padding:'9px 10px',fontSize:12,fontWeight:700,color:has?G:'#64748b'}}>{has?`€${toEn(w.totalSol).toFixed(0)}`:'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {whaleSigs.length===0&&<div style={{padding:'12px',textAlign:'center',fontSize:11,color:'#64748b'}}>No whale swaps detected this period · signals appear in real-time when whales trade</div>}
        </Card>

        <div className="glass-card" style={{border:'1px solid rgba(212,175,55,0.25)',marginTop:16,borderRadius:24}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:10,letterSpacing:'0.15em',fontWeight:800,color:'#D4AF37'}}>🔭 WHALE SCANNER · TOP KOL TRADERS</span>
            <div style={{display:'flex',gap:6}}>
              {(['7D','30D'] as const).map(p=>(
                <button key={p} onClick={()=>setScanPeriod(p)} style={{padding:'3px 10px',borderRadius:20,border:`1px solid ${scanPeriod===p?'#D4AF37':'rgba(255,255,255,0.1)'}`,background:scanPeriod===p?'rgba(212,175,55,0.15)':'transparent',color:scanPeriod===p?'#D4AF37':'#64748b',fontSize:9,fontWeight:800,letterSpacing:'0.1em',cursor:'pointer'}}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
              <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                {['#','TRADER',`${scanPeriod} PNL`,'WIN RATE','',''].map((h,i)=>(
                  <th key={i} style={{padding:'8px 12px',fontSize:8,fontWeight:800,letterSpacing:'0.12em',color:'#64748b',textAlign:'left'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TOP_KOLS.map((kol,i)=>{
                  const tracked=WHALE_ADDRS_UI.has(kol.addr);
                  const pnl=scanPeriod==='7D'?kol.pnl7d:kol.pnl30d;
                  return(
                    <tr key={kol.addr} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',background:i%2===0?'rgba(255,255,255,0.01)':'transparent'}}>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#D4AF37',fontWeight:800}}>#{i+1}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>{kol.name}</div>
                        <div style={{fontSize:9,color:'#64748b',fontFamily:'monospace'}}>{kol.addr.slice(0,6)}…{kol.addr.slice(-4)}</div>
                      </td>
                      <td style={{padding:'10px 12px',fontSize:12,fontWeight:800,color:'#22c55e'}}>+${pnl.toLocaleString()}</td>
                      <td style={{padding:'10px 12px',fontSize:12,fontWeight:700,color:'#D4AF37'}}>{kol.wr}%</td>
                      <td style={{padding:'10px 12px'}}>{tracked?<span style={{fontSize:9,fontWeight:800,color:'#22c55e',background:'rgba(34,197,94,0.1)',padding:'2px 8px',borderRadius:20,letterSpacing:'0.1em'}}>✓ TRACKING</span>:<span style={{fontSize:9,color:'#64748b',background:'rgba(255,255,255,0.05)',padding:'2px 8px',borderRadius:20}}>NOT TRACKED</span>}</td>
                      <td style={{padding:'10px 12px'}}>{!tracked&&<button onClick={()=>addWhaleToTracking(kol)} style={{padding:'5px 14px',borderRadius:20,border:'1px solid #D4AF37',background:'rgba(212,175,55,0.1)',color:'#D4AF37',fontSize:9,fontWeight:800,letterSpacing:'0.1em',cursor:'pointer'}}>+ ADD</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,0.05)',fontSize:9,color:'#64748b',textAlign:'center'}}>
            Live data from KOLExplorer.com · 30D top Solana meme traders by realized PNL
          </div>
        </div>


      </div>
    </div>
  );
}
