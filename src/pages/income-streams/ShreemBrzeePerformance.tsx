import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase as d } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

const EDGE_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
const EXEC_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor";
const GOLD      = "#D4AF37";
const GOLD2     = "rgba(212,175,55,0.15)";
const GOLD3     = "rgba(212,175,55,0.06)";
const CYAN      = "#22D3EE";
const WHITE60   = "rgba(255,255,255,0.6)";
const WHITE10   = "rgba(255,255,255,0.06)";
const BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA";

const KOL_LIST = [
  { label: "Cented",      addr: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o" },
  { label: "Remusofmars", addr: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu" },
  { label: "trunoest",    addr: "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT"  },
  { label: "gake",        addr: "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm" },
];

const timeAgo = (dt: string) => {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d`;
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
  for (const rpc of ["https://api.mainnet-beta.solana.com","https://rpc.ankr.com/solana"]) {
    try {
      const r = await fetch(rpc, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({jsonrpc:"2.0",id:1,method:"getBalance",params:[addr]}),
        signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j?.result?.value!=null) return j.result.value/1e9;
    } catch {}
  }
  return 0;
}

async function fetchTokenPrice(mint: string): Promise<{price: number; symbol: string|null}> {
  try {
    const ds = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { signal: AbortSignal.timeout(7000) });
    if (ds.ok) {
      const pairs = ((await ds.json())?.pairs||[]).filter((p:any) => p?.priceUsd && parseFloat(p.priceUsd)>0);
      if (pairs.length) {
        pairs.sort((a:any,b:any) => parseFloat(b.liquidity?.usd||0)-parseFloat(a.liquidity?.usd||0));
        return { price: parseFloat(pairs[0].priceUsd), symbol: pairs[0].baseToken?.symbol||null };
      }
    }
  } catch {}
  try {
    const r = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const p = parseFloat((await r.json())?.data?.[mint]?.price);
      if (p > 0) return { price: p, symbol: null };
    }
  } catch {}
  return { price: 0, symbol: null };
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
  const [botBal, setBotBal]     = useState(0);
  const [toast, setToast]       = useState("");
  const [toastType, setToastType] = useState<"ok"|"warn"|"info">("ok");
  const [loading, setLoading]   = useState(false);
  const [liveConfirm, setLiveConfirm] = useState(false);
  const [closingIds, setClosingIds]   = useState<Set<string>>(new Set());
  const [livePrices, setLivePrices]   = useState<Record<string,number>>({});
  const [liveSymbols, setLiveSymbols] = useState<Record<string,string>>({});
  const [showSignals, setShowSignals] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const priceRef = useRef<any>(null);

  const notify = (msg: string, type: "ok"|"warn"|"info" = "ok") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 5000);
  };

  const isRunning = !!session?.started_at && !session?.stopped_at;
  const isLive    = session?.mode === "live";
  const solToEur  = (sol: number) => sol * solUsd * solEur;

  const fetchSession = useCallback(async () => {
    try { const r = await fetch(`${EDGE_BASE}/session`); if (r.ok) setSession(await r.json()); } catch {}
  }, []);

  const fetchOpen = useCallback(async () => {
    const skip = (s: any) => ["REALTEST_","TEST_","DIAG_"].some(p => String(s||"").toUpperCase().startsWith(p));
    try {
      const { data } = await d.from("shreem_brzee_live_trades")
        .select("*").in("status",["open","pending","unconfirmed"]).order("opened_at",{ascending:false});
      const now = Date.now();
      setOpenPos((data||[]).filter((t:any) => !skip(t.sig) &&
        !(now - new Date(t.opened_at||t.created_at).getTime() > 180000 && !t.tokens_received && !t.entry_price)));
    } catch {}
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const { data } = await d.from("shreem_brzee_live_trades").select("*").order("created_at",{ascending:false}).limit(50);
      setTrades((data||[]).filter((t:any) => !["TEST_","DIAG_"].some(p => t.sig?.startsWith(p))));
    } catch {}
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/signals`, { signal: AbortSignal.timeout(5000) });
      const data = r.ok ? await r.json() : [];
      setSignals((data||[]).filter((s:any) => !s.sig?.startsWith("TEST_")).slice(0,20));
    } catch {}
  }, []);

  const refreshBal = useCallback(async () => {
    const b = await getWalletBalance(BOT_WALLET);
    if (b > 0) setBotBal(b);
  }, []);

  const refreshAll = useCallback(() => {
    fetchSession(); fetchOpen(); fetchTrades(); fetchSignals();
  }, [fetchSession, fetchOpen, fetchTrades, fetchSignals]);

  const updatePrices = useCallback(async () => {
    if (!openPos.length) return;
    const mints = [...new Set(openPos.map((p:any) => p.mint).filter(Boolean))];
    await Promise.all(mints.map(async (m) => {
      const { price, symbol } = await fetchTokenPrice(m);
      if (price > 0) setLivePrices(prev => ({...prev, [m]: price}));
      if (symbol) setLiveSymbols(prev => ({...prev, [m]: symbol}));
    }));
  }, [openPos]);

  useEffect(() => {
    updatePrices();
    if (priceRef.current) clearInterval(priceRef.current);
    priceRef.current = setInterval(updatePrices, 8000);
    return () => clearInterval(priceRef.current);
  }, [updatePrices]);

  useEffect(() => {
    refreshAll(); refreshBal();
    getSolPrice().then(({usd,eur}) => { setSolUsd(usd); setSolEur(eur); });
    const iv = setInterval(() => { refreshAll(); getSolPrice().then(({usd,eur}) => { setSolUsd(usd); setSolEur(eur); }); }, 15000);
    const biv = setInterval(refreshBal, 20000);
    return () => { clearInterval(iv); clearInterval(biv); };
  }, []); // eslint-disable-line

  useEffect(() => {
    const ch1 = d.channel("sb_live_v8").on("postgres_changes",{event:"*",schema:"public",table:"shreem_brzee_live_trades"},() => { fetchOpen(); fetchTrades(); fetchSession(); refreshBal(); }).subscribe();
    const ch2 = d.channel("sb_sig_v8").on("postgres_changes",{event:"INSERT",schema:"public",table:"shreem_brzee_signals"},() => fetchSignals()).subscribe();
    return () => { d.removeChannel(ch1); d.removeChannel(ch2); };
  }, [fetchOpen, fetchTrades, fetchSession, refreshBal, fetchSignals]);

  const goLive = async () => {
    setLoading(true);
    try {
      const bal = botBal > 0 ? botBal : 0.3;
      const r = await fetch(`${EDGE_BASE}/go-live`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({balance_sol: bal}) });
      const j = r.ok ? await r.json() : null;
      if (!j?.ok) throw new Error(j?.error||"failed");
      setLiveConfirm(false);
      notify(`Shreem Brzee activated — ${bal.toFixed(4)} SOL`, "ok");
      refreshAll(); refreshBal();
    } catch(e:any) { notify(e.message, "warn"); }
    setLoading(false);
  };

  const stopBot = async () => {
    try {
      await d.from("shreem_brzee_session").update({ stopped_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id","default");
      notify("Transmission paused", "info");
      fetchSession();
    } catch(e:any) { notify(e.message,"warn"); }
  };

  const closePosition = useCallback(async (pos: any) => {
    setClosingIds(prev => { const n = new Set(prev); n.add(pos.id); return n; });
    try {
      const r = await fetch(EXEC_BASE, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({action:"close",trade_id:pos.id,mint:pos.mint,reason:"manual"}) });
      const j = r.ok ? await r.json() : null;
      if (j?.ok || j?.results?.[0]?.ok) {
        setOpenPos(prev => prev.filter(p => p.id !== pos.id));
        notify(`Position closed ✦`, "ok");
      } else {
        await d.from("shreem_brzee_live_trades").update({status:"closed",closed_at:new Date().toISOString(),sell_reason:"manual",pnl_sol:0,pnl_pct:0}).eq("id",pos.id);
        setOpenPos(prev => prev.filter(p => p.id !== pos.id));
        notify(`Closed ✦`, "info");
      }
      setTimeout(() => { fetchOpen(); fetchTrades(); fetchSession(); refreshBal(); }, 1500);
    } catch(e:any) { notify(e.message,"warn"); }
    setClosingIds(prev => { const n = new Set(prev); n.delete(pos.id); return n; });
  }, [fetchOpen, fetchTrades, fetchSession, refreshBal]);

  const closed    = trades.filter((t:any) => t.status==="closed"||t.status==="unconfirmed_close");
  const realClosed = closed.filter((t:any) => t.sell_reason !== "ghost_refunded");
  const pnlSol   = realClosed.reduce((s:number,t:any) => s+(Number(t.pnl_sol)||0), 0);
  const wins      = realClosed.filter((t:any) => (Number(t.pnl_sol)||0)>0).length;
  const losses    = realClosed.filter((t:any) => (Number(t.pnl_sol)||0)<=0 && t.pnl_sol!=null).length;
  const winRate   = (wins+losses)>0 ? Math.round(wins/(wins+losses)*100) : 0;
  const startBal  = Number(session?.start_balance)||0.3;
  const displayBal = botBal > 0 ? botBal : (Number(session?.portfolio)||startBal);
  const pnlPct    = startBal > 0 ? (pnlSol/startBal*100) : 0;

  const glassCard = {
    background: "rgba(212,175,55,0.03)",
    border: "1px solid rgba(212,175,55,0.15)",
    borderRadius: 20,
    backdropFilter: "blur(40px)",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#050505", color:"#fff",
      fontFamily:"'Plus Jakarta Sans','Inter',system-ui,sans-serif", paddingBottom:80 }}>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
        @keyframes goldglow{0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.15)}50%{box-shadow:0 0 40px rgba(212,175,55,0.35)}}
        @keyframes cyanglow{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ position:"sticky", top:0, zIndex:60, background:"rgba(5,5,5,0.95)",
        borderBottom:"1px solid rgba(212,175,55,0.12)", padding:"12px 16px",
        backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => nav(-1)} style={{ background:"none", border:"none",
            color:"rgba(212,175,55,0.5)", fontSize:20, cursor:"pointer" }}>←</button>
          <div style={{ width:34, height:34, borderRadius:10,
            background:"linear-gradient(135deg,#b8860b,#D4AF37)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
            boxShadow:"0 0 16px rgba(212,175,55,0.4)" }}>🔱</div>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:GOLD, letterSpacing:"-.03em" }}>Shreem Brzee</div>
            <div style={{ fontSize:8, color:"rgba(212,175,55,0.45)", letterSpacing:".4em", textTransform:"uppercase" }}>
              SIDDHA QUANTUM · {isLive?"LIVE":"PAPER"}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, color:"rgba(212,175,55,0.5)", fontWeight:700 }}>${solUsd.toFixed(0)}/SOL</span>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
            background: isRunning ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.03)",
            border:`1px solid ${isRunning ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}` }}>
            <span style={{ width:5, height:5, borderRadius:"50%",
              background: isRunning ? CYAN : "rgba(255,255,255,0.2)",
              animation: isRunning ? "pulse 1.5s infinite" : "none",
              boxShadow: isRunning ? `0 0 8px ${CYAN}` : "none" }} />
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:".15em", textTransform:"uppercase",
              color: isRunning ? CYAN : "rgba(255,255,255,0.3)" }}>
              {isRunning ? "TRANSMITTING" : "DORMANT"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ margin:"10px 14px 0", padding:"11px 16px", borderRadius:12,
          fontSize:12, fontWeight:700, letterSpacing:".02em",
          background: toastType==="ok" ? "rgba(212,175,55,0.08)" : toastType==="warn" ? "rgba(212,175,55,0.05)" : "rgba(34,211,238,0.06)",
          border:`1px solid ${toastType==="ok" ? "rgba(212,175,55,0.3)" : toastType==="warn" ? "rgba(212,175,55,0.2)" : "rgba(34,211,238,0.2)"}`,
          color: toastType==="ok" ? GOLD : toastType==="warn" ? "rgba(212,175,55,0.7)" : CYAN }}>
          ✦ {toast}
        </div>
      )}

      <div style={{ padding:"14px 14px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Wallet Oracle Card ── */}
        <div style={{ ...glassCard, padding:"22px 20px", position:"relative", overflow:"hidden",
          animation:"goldglow 4s ease-in-out infinite" }}>
          {/* Scan line effect */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
            background:`linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            animation:"scanline 4s linear infinite", opacity:0.4 }} />

          <div style={{ fontSize:8, fontWeight:800, letterSpacing:".5em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.45)", marginBottom:8 }}>◈ BOT WALLET BALANCE</div>

          <div style={{ fontSize:42, fontWeight:900, color:GOLD, letterSpacing:"-.04em", lineHeight:1 }}>
            {displayBal.toFixed(3)}
            <span style={{ fontSize:18, color:"rgba(212,175,55,0.4)", marginLeft:6 }}>SOL</span>
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:4, fontWeight:600 }}>
            €{solToEur(displayBal).toFixed(2)} EUR
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:18 }}>
            {[
              { l:"P&L", v:`${pnlSol>=0?"+":""}${pnlSol.toFixed(3)}`, s:"SOL",
                c: pnlSol>=0 ? GOLD : "rgba(212,175,55,0.5)" },
              { l:"WIN RATE", v:`${winRate}%`, s:`${wins}W · ${losses}L`,
                c: winRate>=50 ? GOLD : "rgba(212,175,55,0.5)" },
              { l:"TRADES", v:String(realClosed.length), s:"executed", c:CYAN },
            ].map(card => (
              <div key={card.l} style={{ background:"rgba(212,175,55,0.04)",
                border:"1px solid rgba(212,175,55,0.1)", borderRadius:14, padding:"10px 12px" }}>
                <div style={{ fontSize:7, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase",
                  color:"rgba(212,175,55,0.4)", marginBottom:5 }}>{card.l}</div>
                <div style={{ fontSize:17, fontWeight:900, color:card.c, letterSpacing:"-.02em" }}>{card.v}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{card.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Controls ── */}
        {!isRunning ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button onClick={() => { if (!liveConfirm) { setLiveConfirm(true); return; } goLive(); }}
              disabled={loading}
              style={{ padding:"15px 0", borderRadius:16, cursor:"pointer", fontWeight:900,
                fontSize:13, letterSpacing:".05em", textTransform:"uppercase",
                background: liveConfirm ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.08)",
                border:`1px solid ${liveConfirm ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.25)"}`,
                color: GOLD, boxShadow: liveConfirm ? "0 0 20px rgba(212,175,55,0.2)" : "none" }}>
              {loading ? "◈ ACTIVATING…" : liveConfirm ? "⚠ CONFIRM ACTIVATION" : "◈ ACTIVATE SHREEM BRZEE"}
            </button>
            {liveConfirm && (
              <button onClick={() => setLiveConfirm(false)}
                style={{ padding:"10px 0", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)",
                  background:"transparent", color:"rgba(255,255,255,0.3)", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={stopBot}
              style={{ padding:"13px 0", borderRadius:14, cursor:"pointer", fontWeight:800, fontSize:12,
                letterSpacing:".05em", textTransform:"uppercase",
                border:"1px solid rgba(212,175,55,0.2)", background:"rgba(212,175,55,0.05)", color:"rgba(212,175,55,0.6)" }}>
              ◫ PAUSE
            </button>
            <button onClick={refreshAll}
              style={{ padding:"13px 0", borderRadius:14, cursor:"pointer", fontWeight:800, fontSize:12,
                letterSpacing:".05em", textTransform:"uppercase",
                border:"1px solid rgba(34,211,238,0.2)", background:"rgba(34,211,238,0.04)", color:"rgba(34,211,238,0.7)" }}>
              ↺ REFRESH
            </button>
          </div>
        )}

        {/* ── Open Positions ── */}
        <div style={{ ...glassCard }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(212,175,55,0.08)",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:".5em", textTransform:"uppercase",
              color:"rgba(212,175,55,0.5)" }}>◈ ACTIVE TRANSMISSIONS</div>
            {openPos.length > 0 && (
              <div style={{ fontSize:10, fontWeight:800, color:CYAN,
                animation:"cyanglow 2s ease-in-out infinite" }}>
                {openPos.length} LIVE
              </div>
            )}
          </div>

          {openPos.length === 0 ? (
            <div style={{ padding:"28px 16px", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:8, opacity:0.4 }}>◈</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>
                {isRunning ? "Scanning whale transmissions…" : "Activate to begin scanning"}
              </div>
            </div>
          ) : openPos.map((pos:any) => {
            const entryUsd   = Number(pos.entry_price)||0;
            const currentUsd = livePrices[pos.mint]||0;
            const amtSol     = Number(pos.amount_sol)||0;
            const investedUsd = amtSol * solUsd;
            const tokensHeld  = entryUsd>0 ? investedUsd/entryUsd : 0;
            const currentVal  = tokensHeld>0 && currentUsd>0 ? tokensHeld*currentUsd : null;
            const pnlU        = currentVal!=null ? currentVal-investedUsd : null;
            const pnlP        = pnlU!=null && investedUsd>0 ? (pnlU/investedUsd)*100 : null;
            const isClosing   = closingIds.has(pos.id);
            const ageMin      = Math.floor((Date.now()-new Date(pos.opened_at||pos.created_at).getTime())/60000);
            const sym         = liveSymbols[pos.mint] || pos.symbol || pos.mint?.slice(0,8);
            const isUp        = pnlP!=null && pnlP >= 0;

            return (
              <div key={pos.id} style={{ padding:"14px 16px", borderBottom:"1px solid rgba(212,175,55,0.06)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:"#fff", letterSpacing:"-.02em",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sym}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:3, fontWeight:600 }}>
                      {pos.label} · {ageMin}m · {amtSol.toFixed(3)} SOL
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    {pnlP!=null ? (
                      <>
                        <div style={{ fontSize:18, fontWeight:900, letterSpacing:"-.02em",
                          color: isUp ? GOLD : "rgba(212,175,55,0.5)" }}>
                          {isUp?"+":""}{pnlP.toFixed(1)}%
                        </div>
                        <div style={{ fontSize:10, fontWeight:700,
                          color: isUp ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.35)" }}>
                          {isUp?"+":""}{pnlU!=null?(pnlU/solUsd).toFixed(4):""} SOL
                        </div>
                      </>
                    ) : (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:"rgba(212,175,55,0.4)" }}>{amtSol.toFixed(4)} SOL</div>
                        <div style={{ fontSize:9, color:"rgba(34,211,238,0.5)",
                          animation:"pulse 2s infinite" }}>scanning…</div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => closePosition(pos)} disabled={isClosing}
                  style={{ width:"100%", padding:"9px 0", borderRadius:10, cursor:isClosing?"not-allowed":"pointer",
                    fontWeight:800, fontSize:10, letterSpacing:".1em", textTransform:"uppercase",
                    border:"1px solid rgba(212,175,55,0.2)", background:"rgba(212,175,55,0.05)",
                    color:"rgba(212,175,55,0.6)", opacity:isClosing?0.4:1 }}>
                  {isClosing ? "◈ CLOSING…" : "◫ CLOSE POSITION"}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Tracked Whales ── */}
        <div style={{ ...glassCard, padding:"14px 16px" }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:".5em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.45)", marginBottom:12 }}>◈ WHALE CONSCIOUSNESS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {KOL_LIST.map(w => (
              <div key={w.addr} style={{ padding:"6px 14px", borderRadius:20,
                background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.18)",
                fontSize:11, fontWeight:800, color:GOLD, letterSpacing:".02em" }}>
                {w.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Signal Feed ── */}
        <div style={{ ...glassCard, overflow:"hidden" }}>
          <button onClick={() => setShowSignals(p=>!p)}
            style={{ width:"100%", padding:"14px 16px", background:"none", border:"none",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:".5em", textTransform:"uppercase",
              color:"rgba(212,175,55,0.45)" }}>◈ SIGNAL FEED</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {signals.length>0 && <span style={{ fontSize:10, fontWeight:800, color:CYAN }}>{signals.length}</span>}
              <span style={{ color:"rgba(212,175,55,0.4)", fontSize:12,
                transform:showSignals?"rotate(0)":"rotate(-90deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {showSignals && (
            <div style={{ borderTop:"1px solid rgba(212,175,55,0.08)", maxHeight:260, overflowY:"auto" }}>
              {signals.length===0 ? (
                <div style={{ padding:"20px", textAlign:"center", fontSize:11,
                  color:"rgba(255,255,255,0.2)" }}>No transmissions yet</div>
              ) : signals.map((sig:any,i:number) => (
                <div key={sig.id||i} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"10px 16px", borderBottom:"1px solid rgba(212,175,55,0.04)" }}>
                  <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:900,
                    background: sig.action==="BUY" ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.05)",
                    color: sig.action==="BUY" ? GOLD : "rgba(212,175,55,0.4)",
                    border:`1px solid ${sig.action==="BUY" ? "rgba(212,175,55,0.25)" : "rgba(212,175,55,0.1)"}` }}>
                    {sig.action==="BUY"?"↑":"↓"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {sig.symbol||sig.mint?.slice(0,8)}
                    </div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:1 }}>{sig.label}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"rgba(212,175,55,0.5)" }}>
                      {sig.amount_sol?.toFixed(3)||"—"} SOL
                    </div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>{timeAgo(sig.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trade History ── */}
        <div style={{ ...glassCard, overflow:"hidden" }}>
          <button onClick={() => setShowHistory(p=>!p)}
            style={{ width:"100%", padding:"14px 16px", background:"none", border:"none",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:".5em", textTransform:"uppercase",
              color:"rgba(212,175,55,0.45)" }}>◈ TRADE AKASHA</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {realClosed.length>0 && <span style={{ fontSize:10, fontWeight:800,
                color:"rgba(212,175,55,0.5)" }}>{realClosed.length}</span>}
              <span style={{ color:"rgba(212,175,55,0.4)", fontSize:12,
                transform:showHistory?"rotate(0)":"rotate(-90deg)", transition:"transform .2s" }}>▾</span>
            </div>
          </button>
          {showHistory && (
            <div style={{ borderTop:"1px solid rgba(212,175,55,0.08)", maxHeight:320, overflowY:"auto" }}>
              {realClosed.length===0 ? (
                <div style={{ padding:"20px", textAlign:"center", fontSize:11,
                  color:"rgba(255,255,255,0.2)" }}>No completed trades yet</div>
              ) : realClosed.slice(0,30).map((t:any) => {
                const won = (Number(t.pnl_sol)||0) > 0;
                const pct = Number(t.pnl_pct)||0;
                return (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"10px 16px", borderBottom:"1px solid rgba(212,175,55,0.04)" }}>
                    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:900,
                      background: won ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.04)",
                      color: won ? GOLD : "rgba(212,175,55,0.3)",
                      border:`1px solid ${won ? "rgba(212,175,55,0.25)" : "rgba(212,175,55,0.08)"}` }}>
                      {won?"✦":"◫"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.75)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {t.symbol||t.mint?.slice(0,8)||"?"}
                      </div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                        {t.sell_reason==="whale_sell_mirror"?"◈ whale exit":
                         t.sell_reason==="stop_loss"?"◫ stop loss":
                         t.sell_reason==="trailing_stop"?"✦ trail stop":
                         t.sell_reason==="manual"?"◫ manual":
                         t.sell_reason||"closed"} · {timeAgo(t.closed_at||t.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:900, letterSpacing:"-.01em",
                        color: won ? GOLD : "rgba(212,175,55,0.4)" }}>
                        {won?"+":""}{pct.toFixed(1)}%
                      </div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>
                        {won?"+":""}{(Number(t.pnl_sol)||0).toFixed(4)} SOL
                      </div>
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
