import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase as d } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

const EDGE_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
const EXEC_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor";
const GOLD  = "#D4AF37";
const GREEN = "#10b981";
const RED   = "#ef4444";
const CYAN  = "#22D3EE";
const BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA";

const KOL_LIST = [
  { label: "Cented",      addr: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o" },
  { label: "Remusofmars", addr: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu" },
  { label: "trunoest",    addr: "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT"  },
  { label: "gake",        addr: "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm" },
];

const timeAgo = (dt: string) => {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d`;
};

async function getSolPrice(): Promise<{ usd: number; eur: number }> {
  try {
    const [s, fx] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT").then(r=>r.json()),
      fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r=>r.json()),
    ]);
    return { usd: parseFloat(s.price)||150, eur: fx?.rates?.EUR||0.92 };
  } catch { return { usd:150, eur:0.92 }; }
}

async function getWalletBalance(addr: string): Promise<number> {
  try {
    const h = await fetch(`${EXEC_BASE}/health`, { signal: AbortSignal.timeout(6000) });
    if (h.ok) { const j = await h.json(); if (j?.balance_sol>0) return j.balance_sol; }
  } catch {}
  const rpcs = ["https://api.mainnet-beta.solana.com","https://rpc.ankr.com/solana"];
  for (const rpc of rpcs) {
    try {
      const r = await fetch(rpc, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({jsonrpc:"2.0",id:1,method:"getBalance",params:[addr]}),
        signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j?.result?.value!=null && !j?.error) return j.result.value/1e9;
    } catch {}
  }
  return 0;
}

export default function ShreemBrzeePerformance() {
  const nav = useNavigate();
  const { isAdmin } = useAdminRole();

  const [session, setSession]   = useState<any>(null);
  const [trades, setTrades]     = useState<any[]>([]);
  const [signals, setSignals]   = useState<any[]>([]);
  const [openPos, setOpenPos]   = useState<any[]>([]);
  const [solUsd, setSolUsd]     = useState(150);
  const [solEur, setSolEur]     = useState(0.92);
  const [botBal, setBotBal]     = useState<number | null>(null);
  const [toast, setToast]       = useState("");
  const [toastType, setToastType] = useState<"ok"|"err"|"info">("ok");
  const [loading, setLoading]   = useState(false);
  const [liveConfirm, setLiveConfirm] = useState(false);
  const [closingIds, setClosingIds]   = useState<Set<string>>(new Set());
  const [livePrices, setLivePrices]   = useState<Record<string,number>>({});
  const [liveSymbols, setLiveSymbols] = useState<Record<string,string>>({});
  const [showSignals, setShowSignals] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const priceRef = useRef<any>(null);

  const notify = (msg: string, type: "ok"|"err"|"info" = "ok") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 5000);
  };

  const isRunning = !!session?.started_at && !session?.stopped_at;
  const isLive    = session?.mode === "live";

  const solToEur = (sol: number) => sol * solUsd * solEur;

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/session`);
      if (r.ok) setSession(await r.json());
    } catch {}
  }, []);

  const fetchOpen = useCallback(async () => {
    const skip = (s: any) => ["REALTEST_","TEST_","DIAG_"].some(p => String(s||"").toUpperCase().startsWith(p));
    try {
      const { data } = await d.from("shreem_brzee_live_trades")
        .select("*").in("status",["open","pending","unconfirmed"]).order("opened_at",{ascending:false});
      const now = Date.now();
      const real = (data||[]).filter((t:any) => !skip(t.sig) && !(now - new Date(t.opened_at||t.created_at).getTime() > 180000 && !t.tokens_received && !t.entry_price));
      setOpenPos(real);
    } catch {}
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const { data: live } = await d.from("shreem_brzee_live_trades").select("*").order("created_at",{ascending:false}).limit(50);
      const filtered = (live||[]).filter((t:any) => !["TEST_","DIAG_"].some(p => t.sig?.startsWith(p)));
      setTrades(filtered);
    } catch {}
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/signals`, { signal: AbortSignal.timeout(5000) });
      const data = r.ok ? await r.json() : [];
      // Only last 20, no test signals
      setSignals((data||[]).filter((s:any) => !s.sig?.startsWith("TEST_") && !s.sig?.startsWith("DIAG_")).slice(0,20));
    } catch {}
  }, []);

  const refreshBal = useCallback(async () => {
    const b = await getWalletBalance(BOT_WALLET);
    setBotBal(b);
  }, []);

  const refreshAll = useCallback(() => {
    fetchSession(); fetchOpen(); fetchTrades(); fetchSignals();
  }, [fetchSession, fetchOpen, fetchTrades, fetchSignals]);

  // ── Price polling for open positions ─────────────────────────────────────
  const updatePrices = useCallback(async () => {
    if (!openPos.length) return;
    const mints = [...new Set(openPos.map((p:any) => p.mint).filter(Boolean))];
    await Promise.all(mints.map(async (m) => {
      // DexScreener first — indexes new meme coins immediately + gets symbol
      try {
        const ds = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${m}`, { signal: AbortSignal.timeout(6000) });
        if (ds.ok) {
          const pairs = ((await ds.json())?.pairs||[]).filter((p:any) => p?.priceUsd && parseFloat(p.priceUsd)>0);
          if (pairs.length) {
            pairs.sort((a:any,b:any) => parseFloat(b.liquidity?.usd||0)-parseFloat(a.liquidity?.usd||0));
            const best = pairs[0];
            const p = parseFloat(best.priceUsd);
            const sym = best.baseToken?.symbol || best.quoteToken?.symbol || null;
            if (p > 0) {
              setLivePrices(prev => ({...prev, [m]: p}));
              if (sym) setLiveSymbols(prev => ({...prev, [m]: sym}));
              return;
            }
          }
        }
      } catch {}
      // Jupiter fallback
      try {
        const r = await fetch(`https://api.jup.ag/price/v2?ids=${m}`, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const p = parseFloat((await r.json())?.data?.[m]?.price);
          if (p > 0) setLivePrices(prev => ({...prev, [m]: p}));
        }
      } catch {}
    }));
  }, [openPos]);

  useEffect(() => {
    updatePrices();
    if (priceRef.current) clearInterval(priceRef.current);
    priceRef.current = setInterval(updatePrices, 8000);
    return () => clearInterval(priceRef.current);
  }, [updatePrices]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAll(); refreshBal();
    getSolPrice().then(({usd,eur}) => { setSolUsd(usd); setSolEur(eur); });
    const iv = setInterval(() => { refreshAll(); getSolPrice().then(({usd,eur}) => { setSolUsd(usd); setSolEur(eur); }); }, 15000);
    const biv = setInterval(refreshBal, 20000);
    return () => { clearInterval(iv); clearInterval(biv); };
  }, []); // eslint-disable-line

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch1 = d.channel("sb_live_v7").on("postgres_changes",{event:"*",schema:"public",table:"shreem_brzee_live_trades"},() => { fetchOpen(); fetchTrades(); fetchSession(); refreshBal(); }).subscribe();
    const ch2 = d.channel("sb_sig_v7").on("postgres_changes",{event:"INSERT",schema:"public",table:"shreem_brzee_signals"},() => fetchSignals()).subscribe();
    return () => { d.removeChannel(ch1); d.removeChannel(ch2); };
  }, [fetchOpen, fetchTrades, fetchSession, refreshBal, fetchSignals]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const goLive = async () => {
    setLoading(true);
    try {
      const bal = botBal > 0 ? botBal : 0.3;
      const r = await fetch(`${EDGE_BASE}/go-live`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({balance_sol: bal}) });
      const j = r.ok ? await r.json() : null;
      if (!j?.ok) throw new Error(j?.error||"failed");
      setLiveConfirm(false);
      notify(`🔴 LIVE — ${bal.toFixed(4)} SOL`, "ok");
      refreshAll(); refreshBal();
    } catch(e:any) { notify(e.message, "err"); }
    setLoading(false);
  };

  const stopBot = async () => {
    try {
      await d.from("shreem_brzee_session").update({ stopped_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id","default");
      notify("Bot stopped", "info");
      fetchSession();
    } catch(e:any) { notify(e.message,"err"); }
  };

  const closePosition = useCallback(async (pos: any) => {
    setClosingIds(prev => { const n = new Set(prev); n.add(pos.id); return n; });
    try {
      const r = await fetch(`${EDGE_BASE}/close-trade`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({trade_id:pos.id}),
        signal: AbortSignal.timeout(30000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "Close failed");
      setOpenPos(prev => prev.filter(p => p.id !== pos.id));
      notify("✦ Position closed on-chain", "ok");
      setTimeout(() => { fetchOpen(); fetchTrades(); fetchSession(); refreshBal(); }, 1500);
    } catch(e:any) {
      notify(e.message || "Close failed", "err");
    }
    setClosingIds(prev => { const n = new Set(prev); n.delete(pos.id); return n; });
  }, [fetchOpen, fetchTrades, fetchSession, refreshBal]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const closed      = trades.filter((t:any) => t.status==="closed"||t.status==="unconfirmed_close");
  const pnlSol      = closed.reduce((s:number,t:any) => s+(Number(t.pnl_sol)||0), 0);
  const wins        = closed.filter((t:any) => (Number(t.pnl_sol)||0)>0).length;
  const losses      = closed.filter((t:any) => (Number(t.pnl_sol)||0)<=0 && t.pnl_sol!=null).length;
  const winRate     = (wins+losses)>0 ? Math.round(wins/(wins+losses)*100) : 0;
  const startBal    = Number(session?.start_balance)||0.3;
  const displayBal  = botBal !== null ? botBal : (Number(session?.portfolio)||startBal);
  const pnlPct      = startBal > 0 ? (pnlSol/startBal*100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#050505", color:"#fff", fontFamily:"'Plus Jakarta Sans','Inter',system-ui,sans-serif", paddingBottom:80 }}>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ position:"sticky", top:0, zIndex:60, background:"#050505", borderBottom:"1px solid rgba(212,175,55,0.15)", padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => nav(-1)} style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>←</button>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#b8860b,#D4AF37)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔱</div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:GOLD, letterSpacing:"-.03em" }}>Shreem Brzee</div>
            <div style={{ fontSize:9, color:"#64748b", letterSpacing:".3em", textTransform:"uppercase" }}>{isLive?"LIVE":"PAPER"} · {isRunning?"RUNNING":"STOPPED"}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:"#64748b" }}>${solUsd.toFixed(0)}</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:700,
            background:isRunning?"rgba(16,185,129,.12)":"rgba(255,255,255,.04)",
            border:`1px solid ${isRunning?"rgba(16,185,129,.4)":"rgba(255,255,255,.08)"}`,
            color:isRunning?GREEN:"#64748b" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", animation:isRunning?"pulse 1.5s infinite":"none" }} />
            {isRunning?"Live":"Idle"}
          </span>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ margin:"10px 14px 0", padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
          background:toastType==="ok"?"rgba(16,185,129,.1)":toastType==="err"?"rgba(239,68,68,.1)":"rgba(34,211,238,.08)",
          border:`1px solid ${toastType==="ok"?"rgba(16,185,129,.3)":toastType==="err"?"rgba(239,68,68,.3)":"rgba(34,211,238,.25)"}`,
          color:toastType==="ok"?GREEN:toastType==="err"?RED:CYAN }}>
          {toast}
        </div>
      )}

      <div style={{ padding:"16px 14px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Balance Card ── */}
        <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:"20px 18px", backdropFilter:"blur(40px)" }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.5)", marginBottom:6 }}>Bot Wallet</div>
          <div style={{ fontSize:34, fontWeight:900, color:GOLD, letterSpacing:"-.04em", lineHeight:1 }}>{displayBal.toFixed(3)} <span style={{ fontSize:16, color:"rgba(212,175,55,.5)" }}>SOL</span></div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.45)", marginTop:4 }}>€{solToEur(displayBal).toFixed(2)}</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16 }}>
            {[
              { l:"P&L", v:`${pnlSol>=0?"+":""}${pnlSol.toFixed(3)}`, s:"SOL", c:pnlSol>=0?GREEN:RED },
              { l:"Win Rate", v:`${winRate}%`, s:`${wins}W ${losses}L`, c:winRate>=50?GREEN:RED },
              { l:"Trades", v:String(closed.length), s:"closed", c:"#fff" },
            ].map(card => (
              <div key={card.l} style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:9, color:"#64748b", letterSpacing:".2em", textTransform:"uppercase", marginBottom:4 }}>{card.l}</div>
                <div style={{ fontSize:16, fontWeight:900, color:card.c }}>{card.v}</div>
                <div style={{ fontSize:10, color:"#64748b" }}>{card.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {!isRunning ? (
            <button onClick={() => { if (!liveConfirm) { setLiveConfirm(true); return; } goLive(); }} disabled={loading}
              style={{ gridColumn:"1/-1", padding:"14px 0", borderRadius:14, border:"1px solid rgba(212,175,55,.4)", background:liveConfirm?"rgba(239,68,68,.15)":"rgba(212,175,55,.1)", color:liveConfirm?RED:GOLD, fontSize:13, fontWeight:900, cursor:"pointer", letterSpacing:"-.01em" }}>
              {loading ? "Starting…" : liveConfirm ? "⚠️ Confirm Go Live — Real SOL" : "▶ Go Live"}
            </button>
          ) : (
            <>
              <button onClick={stopBot} style={{ padding:"12px 0", borderRadius:14, border:"1px solid rgba(239,68,68,.3)", background:"rgba(239,68,68,.08)", color:RED, fontSize:13, fontWeight:800, cursor:"pointer" }}>
                ■ Stop
              </button>
              <button onClick={refreshAll} style={{ padding:"12px 0", borderRadius:14, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.03)", color:"#94a3b8", fontSize:13, fontWeight:800, cursor:"pointer" }}>
                ↻ Refresh
              </button>
            </>
          )}
          {liveConfirm && (
            <button onClick={() => setLiveConfirm(false)} style={{ gridColumn:"1/-1", padding:"10px 0", borderRadius:12, border:"1px solid rgba(255,255,255,.08)", background:"transparent", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Cancel
            </button>
          )}
        </div>

        {/* ── Open Positions ── */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.6)" }}>Open Positions</span>
            {openPos.length>0 && <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>{openPos.length} active</span>}
          </div>
          {openPos.length===0 ? (
            <div style={{ padding:"24px 0", textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#64748b" }}>{isRunning?"Watching for whale signals…":"Start bot to begin"}</div>
            </div>
          ) : openPos.map((pos:any) => {
            const entryUsd    = Number(pos.entry_price)||0;
            const currentUsd  = livePrices[pos.mint]||0;
            const amtSol      = Number(pos.amount_sol)||0;
            const investedUsd = amtSol * solUsd;
            const tokensHeld  = entryUsd>0 ? investedUsd/entryUsd : 0;
            const currentVal  = tokensHeld>0 && currentUsd>0 ? tokensHeld*currentUsd : null;
            const dbPct       = pos.pnl_pct != null ? Number(pos.pnl_pct) : null;
            const dbSol       = pos.pnl_sol != null ? Number(pos.pnl_sol) : null;
            const pnlU        = dbSol != null ? dbSol * solUsd : (currentVal!=null ? currentVal-investedUsd : null);
            const pnlP        = dbPct != null ? dbPct : (pnlU!=null && investedUsd>0 ? (pnlU/investedUsd)*100 : null);
            const isClosing   = closingIds.has(pos.id);
            const ageMin      = Math.floor((Date.now()-new Date(pos.opened_at||pos.created_at).getTime())/60000);
            return (
              <div key={pos.id} role="button" tabIndex={0} onClick={() => !isClosing && closePosition(pos)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isClosing) closePosition(pos); }}
                style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:isClosing?"wait":"pointer", opacity:isClosing?0.72:1 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{liveSymbols[pos.mint] || pos.symbol || (pos.mint ? pos.mint.slice(0,6)+"…"+pos.mint.slice(-4) : "?")}</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{pos.label} · {ageMin}m ago · {amtSol.toFixed(3)} SOL</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    {pnlP!=null ? (
                      <>
                        <div style={{ fontSize:15, fontWeight:900, color:pnlP>=0?GREEN:RED }}>{pnlP>=0?"+":""}{pnlP.toFixed(1)}%</div>
                        <div style={{ fontSize:10, color:pnlP>=0?GREEN:RED }}>{pnlU!=null&&pnlU>=0?"+":""}{pnlU!=null?(pnlU/solUsd).toFixed(4):""} SOL</div>
                      </>
                    ) : (
                      <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8" }}>{amtSol.toFixed(4)} SOL in</div>
                      <div style={{ fontSize:10, color:"#f59e0b" }}>⏳ pricing…</div>
                    </div>
                    )}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); closePosition(pos); }} disabled={isClosing}
                  style={{ marginTop:8, width:"100%", padding:"8px 0", borderRadius:10, border:"1px solid rgba(239,68,68,.3)", background:"rgba(239,68,68,.07)", color:RED, fontSize:11, fontWeight:800, cursor:isClosing?"not-allowed":"pointer", opacity:isClosing?0.5:1 }}>
                  {isClosing?"Closing…":"Close Position"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Tracked Whales (compact) ── */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"12px 14px" }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.6)", marginBottom:10 }}>Tracked Whales</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {KOL_LIST.map(w => (
              <div key={w.addr} style={{ padding:"5px 10px", borderRadius:20, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.2)", fontSize:11, fontWeight:700, color:GOLD }}>
                {w.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Signal Feed (collapsed, paginated) ── */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
          <button onClick={() => setShowSignals(p=>!p)} style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.6)" }}>Signal Feed</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {signals.length>0 && <span style={{ fontSize:10, fontWeight:700, color:CYAN }}>{signals.length}</span>}
              <span style={{ color:"#64748b", fontSize:13, transform:showSignals?"rotate(0)":"rotate(-90deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {showSignals && (
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", maxHeight:280, overflowY:"auto" }}>
              {signals.length===0 ? (
                <div style={{ padding:"20px 14px", textAlign:"center", fontSize:11, color:"#64748b" }}>No signals yet — watching 4 wallets</div>
              ) : signals.map((sig:any,i:number) => (
                <div key={sig.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900,
                    background:sig.action==="BUY"?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)",
                    color:sig.action==="BUY"?GREEN:RED }}>
                    {sig.action==="BUY"?"↑":"↓"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sig.symbol||sig.mint?.slice(0,8)}</div>
                    <div style={{ fontSize:10, color:"#64748b" }}>{sig.label}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8" }}>{sig.amount_sol?.toFixed(3)||"—"} SOL</div>
                    <div style={{ fontSize:10, color:"#64748b" }}>{timeAgo(sig.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trade History (collapsed) ── */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
          <button onClick={() => setShowHistory(p=>!p)} style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.6)" }}>Trade History</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {closed.length>0 && <span style={{ fontSize:10, fontWeight:700, color:"#64748b" }}>{closed.length}</span>}
              <span style={{ color:"#64748b", fontSize:13, transform:showHistory?"rotate(0)":"rotate(-90deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {showHistory && (
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", maxHeight:320, overflowY:"auto" }}>
              {closed.length===0 ? (
                <div style={{ padding:"20px 14px", textAlign:"center", fontSize:11, color:"#64748b" }}>No closed trades yet</div>
              ) : closed.slice(0,30).map((t:any) => {
                const won = (Number(t.pnl_sol)||0) > 0;
                return (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900,
                      background:won?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)", color:won?GREEN:RED }}>
                      {won?"W":"L"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.symbol||t.mint?.slice(0,8)||"?"}</div>
                      <div style={{ fontSize:10, color:"#64748b" }}>
                        {t.sell_reason==="whale_sell_mirror"?"🐋 whale exit":t.sell_reason==="stop_loss"?"🛑 stop loss":t.sell_reason==="trailing_stop"?"📈 trail":t.sell_reason||"closed"} · {timeAgo(t.closed_at||t.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:900, color:won?GREEN:RED }}>
                        {won?"+":""}{(Number(t.pnl_pct)||0).toFixed(1)}%
                      </div>
                      <div style={{ fontSize:10, color:"#64748b" }}>{won?"+":""}{(Number(t.pnl_sol)||0).toFixed(4)} SOL</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
