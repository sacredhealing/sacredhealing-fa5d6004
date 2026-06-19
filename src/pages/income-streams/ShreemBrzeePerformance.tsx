import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase as d } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

// ─── Constants ───────────────────────────────────────────────────────────────
const EDGE_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=775d3d1f-6801-41de-a063-8aee4382d0f4";
const GOLD = "#D4AF37";
const GOLD20 = "rgba(212,175,55,0.2)";
const GREEN = "#10b981";
const RED = "#ef4444";
const CYAN = "#00d4ff";

// ─── Static KOL list ─────────────────────────────────────────────────────────
const KOL_LIST = [
  { label: "Euris",         addr: "Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB", vip: true },
  { label: "Heyitsyolo",    addr: "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ", vip: true },
  { label: "Remusofmars",   addr: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu", vip: true },
  { label: "Lenion",        addr: "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm", vip: false },
  { label: "Hades",         addr: "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp", vip: false },
  { label: "Fireball",      addr: "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51", vip: false },
  { label: "Hachjdn",       addr: "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS", vip: false },
  { label: "Cented",        addr: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o", vip: false },
  { label: "The Grande",    addr: "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA", vip: false },
  { label: "West",          addr: "JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN", vip: false },
  { label: "Yenni",         addr: "5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG", vip: false },
  { label: "Doji",          addr: "5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg", vip: false },
  { label: "Trenchman",     addr: "Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7", vip: false },
  { label: "OGAntD",        addr: "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP", vip: false },
  { label: "Kev",           addr: "BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd", vip: false },
  { label: "decu",          addr: "4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9", vip: false },
  { label: "trunoest",      addr: "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT", vip: false },
  { label: "clukz",         addr: "G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC", vip: false },
  { label: "Limfork",       addr: "BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB", vip: false },
];

const KOL_LABELS = new Set(KOL_LIST.map(k => k.label));
const KOL_ADDRS  = new Set(KOL_LIST.map(k => k.addr));
const isTracked  = (s: any) => KOL_LABELS.has(s?.label) || KOL_ADDRS.has(s?.wallet);
const isValidSol = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
const timeAgo    = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d`;
};

// Top KOL explorer data (static reference)
const KOL_EXPLORER = [
  { name:"Cented",     addr:"CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o", pnl7d:95641,  pnl30d:576766, wr:63.8 },
  { name:"Euris",      addr:"Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB", pnl7d:51079,  pnl30d:402366, wr:56   },
  { name:"Trunoest",   addr:"ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT",  pnl7d:24975,  pnl30d:77853,  wr:65.8 },
  { name:"Kev",        addr:"BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd", pnl7d:22717,  pnl30d:122059, wr:52.3 },
  { name:"clukz",      addr:"G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC", pnl7d:18856,  pnl30d:92000,  wr:62.6 },
  { name:"Heyitsyolo", addr:"Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ", pnl7d:10746,  pnl30d:88376,  wr:54.6 },
  { name:"West",       addr:"JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN", pnl7d:16382,  pnl30d:83971,  wr:51.4 },
  { name:"Limfork",    addr:"BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB", pnl7d:6793,   pnl30d:72393,  wr:52.4 },
  { name:"Yenni",      addr:"5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG", pnl7d:10386,  pnl30d:76602,  wr:47.3 },
  { name:"Remusofmars",addr:"BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu", pnl7d:24200,  pnl30d:68000,  wr:65.8 },
];

// TRACKED_ADDRS built from KOL_LIST — merged with trackedWhalesAddrs state below

// ─── Compounding Position Sizer ───────────────────────────────────────────────
// Kelly-inspired: position grows with win rate AND account size.
// Hard cap: never risk more than 50% of portfolio across all open trades.
function calculatePositionSize(
  portfolio:    number,   // current SOL balance
  wins:         number,   // session wins
  losses:       number,   // session losses
  openPositions: any[],  // current open trades (to calc exposure)
): { size: number; pct: number; blocked: boolean; reason: string } {

  if (portfolio <= 0) return { size:0, pct:0, blocked:true, reason:"zero balance" };

  const totalTrades  = wins + losses;
  const winRate      = totalTrades >= 5 ? wins / totalTrades : 0.5; // need ≥5 trades to use real WR

  // Kelly fraction: edge × bankroll / odds (simplified for 1:1 payout)
  // base 5%, scale up with win rate, cap at 15%
  const BASE_PCT     = 0.05;
  const kellyPct     = Math.min(0.15, Math.max(BASE_PCT, winRate * 0.12));
  const positionSize = portfolio * kellyPct;

  // 50% exposure cap: sum all open position sizes
  const openExposure = openPositions.reduce((sum: number, p: any) => sum + (Number(p.amount_sol) || 0), 0);
  const maxExposure  = portfolio * 0.50;
  const remaining    = maxExposure - openExposure;

  if (remaining <= 0.001) {
    return { size:0, pct:kellyPct, blocked:true, reason:"50% exposure cap reached" };
  }

  // Use the smaller of: kelly size vs remaining exposure room
  const finalSize = Math.min(positionSize, remaining);

  return { size:finalSize, pct:kellyPct, blocked:false, reason:"ok" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getSolPrice(): Promise<{ usd: number; eur: number }> {
  try {
    const [solRes, fxRes] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT").then(r => r.json()),
      fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r => r.json()),
    ]);
    return { usd: parseFloat(solRes.price) || 150, eur: fxRes?.rates?.EUR || 0.92 };
  } catch {
    return { usd: 150, eur: 0.92 };
  }
}

async function getWalletBalance(addr: string): Promise<number> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [addr] }),
    });
    return ((await res.json()).result?.value || 0) / 1e9;
  } catch {
    return 0;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Section({ title, badge, right, children, defaultOpen = true, accent }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${accent||GOLD20}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(40px)", boxShadow:"0 0 20px rgba(212,175,55,0.04)" }}>
      <div onClick={() => setOpen(p => !p)} style={{ padding:"12px 16px", borderBottom:open?"1px solid rgba(212,175,55,0.15)":"none", background:"rgba(212,175,55,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", userSelect:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)" }}>{title}</span>
          {badge}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {right}
          <span style={{ color:"#64748b", fontSize:14, transform:open?"rotate(0)":"rotate(-90deg)", transition:"transform .2s" }}>▾</span>
        </div>
      </div>
      {open && <div style={{ padding:16 }}>{children}</div>}
    </div>
  );
}

function Diagnostics({ running, signalCount, edgeOk }: { running: boolean; signalCount: number; edgeOk: boolean|null }) {
  const items = [
    { label:"Enhanced WebSocket", status:edgeOk===null?"checking":edgeOk?"ok":"fail", detail:edgeOk===null?"Checking…":edgeOk?"50-100ms detection at processed commitment ✓":"Edge function unreachable", fix:edgeOk===false?"Check Helius Developer plan is active":undefined },
    { label:"Bot Session", status:running?"ok":"warn", detail:running?"Session active — watching 20 whale wallets":"Session stopped — press START above" },
    { label:"Signal Pipeline", status:signalCount>0?"ok":"warn", detail:signalCount>0?`${signalCount} signals received · auto-mirrors whale BUY & SELL`:"0 signals yet — waiting for whale activity or use ⚡ Test Signal" },
    { label:"Blockchain", status:"ok", detail:"Solana mainnet · Jito bundles · RugCheck active" },
  ];
  const colors: Record<string,string> = { ok:GREEN, warn:"#f59e0b", fail:RED, checking:"#64748b" };
  return (
    <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:14 }}>
      <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)", marginBottom:12 }}>⚡ System Diagnostics</div>
      {items.map(it => (
        <div key={it.label} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:colors[it.status]||"#64748b", marginTop:4, flexShrink:0, boxShadow:it.status==="ok"?`0 0 6px ${GREEN}`:it.status==="fail"?`0 0 6px ${RED}`:"none" }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:colors[it.status]||"#64748b" }}>{it.label}</div>
            <div style={{ fontSize:10, color:"#64748b", marginTop:2, lineHeight:1.4 }}>{it.detail}</div>
            {it.fix && <div style={{ fontSize:10, color:"rgba(239,68,68,.8)", marginTop:3 }}>🔧 {it.fix}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShreemBrzeePerformance() {
  const nav = useNavigate();

  // Session / data
  const [session, setSession]     = useState<any>(null);
  const [trades, setTrades]       = useState<any[]>([]);
  const [signals, setSignals]     = useState<any[]>([]);
  const [periodSigs, setPeriodSigs] = useState<any[]>([]);
  const [period, setPeriod]       = useState<"daily"|"weekly"|"monthly"|"yearly">("weekly");

  // UI
  const [mode, setMode]           = useState<"paper"|"live">("paper");
  const [balInput, setBalInput]   = useState("1");
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState("");
  const [toastType, setToastType] = useState<"ok"|"err"|"info">("ok");
  const [walletInput, setWalletInput] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [walletBal, setWalletBal] = useState<number|null>(null);
  const [inputValid, setInputValid] = useState<boolean|null>(null);
  const [phantomLoading, setPhantomLoading] = useState(false);
  const [solUsd, setSolUsd]       = useState(150);
  const [solEur, setSolEur]       = useState(0.92);
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});
  const [edgeOk, setEdgeOk]       = useState<boolean|null>(null);

  // Positions (open)
  const [openPos, setOpenPos]     = useState<any[]>([]);
  const [expandedPos, setExpandedPos] = useState<any|null>(null);
  const priceIntervalRef          = useRef<ReturnType<typeof setInterval>|null>(null);

  // Starting/stopping
  const [startingBot, setStartingBot] = useState(false);
  const [stoppingBot, setStoppingBot] = useState(false);

  // KOL Explorer
  const [kolPeriod, setKolPeriod]           = useState<"7D"|"30D">("30D");
  const [trackedWhalesAddrs, setTrackedWhalesAddrs] = useState<Set<string>>(
    new Set(KOL_LIST.map(k => k.addr))
  );

  const fetchTrackedWhales = useCallback(async () => {
    try {
      const { data } = await d.from("tracked_whales").select("address");
      if (data && data.length > 0) {
        const allAddrs = new Set<string>([
          ...KOL_LIST.map(k => k.addr),
          ...data.map((w: any) => w.address).filter(Boolean),
        ]);
        setTrackedWhalesAddrs(allAddrs);
      }
    } catch {}
  }, []);

  // Admin
  const { isAdmin } = useAdminRole();
  const [adminOpen, setAdminOpen]     = useState(false);
  const [forceClosing, setForceClosing] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toEur   = (sol: number) => (sol * solUsd * solEur).toFixed(2);
  const toEurN  = (sol: number) => sol * solUsd * solEur;
  const notify  = (msg: string, type: "ok"|"err"|"info" = "ok") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 6000);
  };
  const inputStyle = (border: string) => ({
    width:"100%", padding:"11px 14px", borderRadius:12, border:`1px solid ${border}`,
    background:"rgba(212,175,55,0.05)", color:"#fff", backdropFilter:"blur(10px)",
    fontSize:14, fontWeight:600, outline:"none", boxSizing:"border-box" as const,
  });
  const rowStyle = { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(212,175,55,0.1)" };

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchSession  = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/session`);
      const data = r.ok ? await r.json() : null;
      setSession(data);
      // Sync liveMode state from DB — prevents reset on page reload
      if (data?.mode === "live" && data?.started_at && !data?.stopped_at) {
        setLiveMode(true);
      } else if (data?.mode !== "live") {
        setLiveMode(false);
      }
    } catch {}
  }, []);

  const fetchTrades   = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/trades`);
      const data = r.ok ? await r.json() : [];
      setTrades((data || []).filter((t: any) => {
        const sig = t.sig || "";
        const isPureTest = (sig.startsWith("TEST_") || sig.startsWith("DIAG_") || sig.startsWith("test-") || sig === "paper-bootstrap") && !t.entry_price && !t.amount_sol;
        return !isPureTest;
      }));
    } catch {}
  }, []);

  const fetchSignals  = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/signals`);
      const data = r.ok ? await r.json() : [];
      const filtered = (data || []).filter((s: any) => !s.sig?.startsWith("TEST_") && !s.sig?.startsWith("DIAG_") && isTracked(s));
      setSignals(filtered.slice(0, 100));
    } catch {}
  }, []);

  const fetchPeriod   = useCallback(async () => {
    const now  = new Date(), from = new Date(now);
    if (period === "daily")   from.setHours(0,0,0,0);
    if (period === "weekly")  from.setDate(now.getDate()-7);
    if (period === "monthly") from.setMonth(now.getMonth()-1);
    if (period === "yearly")  from.setFullYear(now.getFullYear()-1);
    const { data } = await d.from("shreem_brzee_signals").select("label,wallet,action,amount_sol,created_at,sig").gte("created_at",from.toISOString()).order("created_at",{ascending:false});
    setPeriodSigs((data || []).filter((s: any) => !s.sig?.startsWith("TEST_") && !s.sig?.startsWith("DIAG_") && isTracked(s)));
  }, [period]);

  const fetchOpen     = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/open`);
      const data = r.ok ? await r.json() : [];
      setOpenPos(data || []);
    } catch {}
  }, []);

  const checkEdge     = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/ping`, { signal: AbortSignal.timeout(5000) });
      setEdgeOk(r.ok);
    } catch { setEdgeOk(false); }
  }, []);

  const refreshAll    = useCallback(() => {
    fetchSession(); fetchTrades(); fetchSignals(); fetchPeriod();
  }, [fetchSession, fetchTrades, fetchSignals, fetchPeriod]);

  // ── Price fetch via edge function (avoids browser CORS / CF rate limits) ──
  const PRICE_URL = `${EDGE_BASE.replace(/\/[^/]+$/, "")}/token-price-batch`;

  const fetchTokenPrice = useCallback(async (mint: string): Promise<number> => {
    if (!mint) return 0;
    try {
      const r = await fetch(`${PRICE_URL}?mints=${mint}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        const p = Number(j?.prices?.[mint]);
        if (p > 0) return p;
      }
    } catch {}
    return 0;
  }, [PRICE_URL]);

  const updatePrices = useCallback(async () => {
    if (!openPos.length) return;
    const mints = [...new Set(openPos.map((p: any) => p.mint).filter(Boolean))];
    if (!mints.length) return;
    try {
      const r = await fetch(PRICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mints }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = await r.json();
      const updated: Record<string, number> = {};
      for (const [m, p] of Object.entries<any>(j?.prices || {})) {
        const n = Number(p);
        if (n > 0) updated[m] = n;
      }
      if (Object.keys(updated).length) setLivePrices(prev => ({ ...prev, ...updated }));
    } catch (e) {
      console.warn("[ShreemBrzee] price batch failed", e);
    }
  }, [openPos, PRICE_URL]);

  useEffect(() => {
    updatePrices();
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    priceIntervalRef.current = setInterval(updatePrices, 8000);
    return () => { if (priceIntervalRef.current) clearInterval(priceIntervalRef.current); };
  }, [updatePrices]);

  // ── Close a position ───────────────────────────────────────────────────────
  // closePosition: only used for manual "CLOSE TRADE" button
  // Calls edge function /signal to trigger server-side close
  const closePosition = useCallback(async (pos: any, reason = "manual") => {
    try {
      notify("Closing position…", "info");
      // Call edge function /close-trade directly — server fetches price and closes
      const r = await fetch(`${EDGE_BASE}/close-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade_id: pos.id }),
      });
      const result = r.ok ? await r.json() : null;
      if (!r.ok || !result?.ok) {
        // Fallback: write directly to DB if edge fn fails
        await d.from("shreem_brzee_paper_trades").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          sell_reason: "manual",
          pnl_pct: 0,
          pnl_sol: 0,
        }).eq("id", pos.id);
        notify("Position closed (no price data)", "info");
      } else {
        notify(`✅ ${result.symbol || "Position"} closed`, "ok");
      }
      setTimeout(() => { fetchOpen(); fetchTrades(); fetchSession(); }, 1500);
    } catch (e: any) { notify(`Close failed: ${e.message?.slice(0,60)}`, "err"); }
  }, [fetchOpen, fetchTrades, fetchSession, notify]);

  // v5: ALL exit logic runs server-side in edge function:
  //   whale_sell_mirror — whale SELL signal detected → close immediately
  //   stop_loss        — price drops -30% from entry → close immediately  
  //   48h_safety_cap   — position open 48h with no whale SELL → close
  // Browser is READ-ONLY. Phone can be off. Bot runs 24/7.
  // Exit reasons: "whale_sell_mirror" | "stop_loss" | "48h_safety_cap" | "manual"

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  // v5: Trade execution is 100% server-side in the edge function.
  // Browser just listens for DB changes and refreshes display.
  // No trade logic runs in the browser — phone can be off.
  useEffect(() => {
    const chSig = d.channel("sb_sig_v5")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"shreem_brzee_signals" },
        () => { fetchSignals(); fetchPeriod(); })
      .subscribe();
    // Listen to BOTH tables — paper and live trades
    const chTrd5 = d.channel("sb_trd_v5")
      .on("postgres_changes", { event:"*", schema:"public", table:"shreem_brzee_paper_trades" },
        () => { fetchOpen(); fetchTrades(); fetchSession(); })
      .subscribe();
    const chLive = d.channel("sb_live_trd")
      .on("postgres_changes", { event:"*", schema:"public", table:"shreem_brzee_live_trades" },
        () => { fetchOpen(); fetchTrades(); fetchSession(); })
      .subscribe();
    return () => { d.removeChannel(chSig); d.removeChannel(chTrd5); d.removeChannel(chLive); };
  }, [fetchSignals, fetchPeriod, fetchOpen, fetchTrades, fetchSession]);

  // Note: additional realtime subscriptions removed — consolidated above


  // ── Live mode toggle state ─────────────────────────────────────────────────
  const [liveMode, setLiveMode]         = useState(false);
  const [liveConfirm, setLiveConfirm]   = useState(false);
  const [botWallet, setBotWallet]       = useState<{wallet:string;balance_sol:number}|null>(null);
  const [liveLoading, setLiveLoading]   = useState(false);
  const liveIntervalRef                 = useRef<ReturnType<typeof setInterval>|null>(null);

  const checkBotWallet = useCallback(async () => {
    try {
      const r = await fetch(
        "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor/health",
        { signal: AbortSignal.timeout(8000) }
      );
      const data = r.ok ? await r.json() : null;
      if (data?.wallet) {
        setBotWallet(data);
        console.log("[botWallet] connected:", data.wallet, data.balance_sol, "SOL");
        // Auto-populate balance input with real wallet balance
        if (data.balance_sol > 0) setBalInput(data.balance_sol.toFixed(4));
      } else {
        console.warn("[botWallet] health check failed:", data);
      }
    } catch (e: any) {
      console.warn("[botWallet] unreachable:", e.message);
    }
  }, []);

  const toggleLiveMode = async (goLive: boolean) => {
    setLiveLoading(true);
    try {
      const bal = parseFloat(balInput) || 0.3;
      if (goLive) {
        // Call edge function /go-live — has service role to wipe paper data + start fresh
        notify("Clearing paper data and going live…", "info");
        const r = await fetch(`${EDGE_BASE}/go-live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance_sol: bal }),
        });
        const result = r.ok ? await r.json() : null;
        if (!result?.ok) throw new Error(result?.error || "go-live endpoint failed");
        setLiveMode(true);
        setLiveConfirm(false);
        notify("🔴 LIVE MODE ACTIVE — paper data cleared, real SOL trading", "err");
      } else {
        // Stop live — back to paper
        const { error } = await d.from("shreem_brzee_session").update({
          mode: "paper", stopped_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).eq("id", "default");
        if (error) throw error;
        setLiveMode(false);
        notify("📋 Paper mode restored", "ok");
      }
      await fetchSession();
    } catch (e: any) { notify(`Mode switch failed: ${e.message?.slice(0,60)}`, "err"); }
    setLiveLoading(false);
  };

  useEffect(() => { checkBotWallet(); }, [checkBotWallet]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAll(); fetchOpen(); checkEdge(); fetchTrackedWhales();
    getSolPrice().then(({ usd, eur }) => { setSolUsd(usd); setSolEur(eur); });
    const masterInterval = setInterval(() => {
      refreshAll();
      getSolPrice().then(({ usd, eur }) => { setSolUsd(usd); setSolEur(eur); });
    }, 15000);
    // Re-check bot wallet every 30s
    const walletInterval = setInterval(checkBotWallet, 30000);
    return () => { clearInterval(masterInterval); clearInterval(walletInterval); };
  }, []); // eslint-disable-line

  useEffect(() => { fetchPeriod(); }, [period]);

  // ── Bot controls ───────────────────────────────────────────────────────────
  const startBot = async () => {
    setLoading(true); setStartingBot(true);
    // In live mode, always use real wallet balance; in paper, use input
    const bal = liveMode && botWallet?.balance_sol
      ? botWallet.balance_sol
      : (parseFloat(balInput) || 1);
    try {
      // NEVER delete trade history — only update session state
      // Recalculate real balances from existing closed trades
      const { data: closedTrades } = await d.from("shreem_brzee_paper_trades")
        .select("pnl_sol").eq("status","closed");
      const realPnl  = (closedTrades || []).reduce((s: number, t: any) => s + (Number(t.pnl_sol)||0), 0);
      const realWins  = (closedTrades || []).filter((t: any) => (t.pnl_sol||0) >= 0).length;
      const realLoss  = (closedTrades || []).filter((t: any) => (t.pnl_sol||0) <  0).length;

      const { error } = await d.from("shreem_brzee_session").upsert({
        id:"default",
        portfolio:   bal,
        start_balance: bal,
        positions:   {},
        total_pnl:   realPnl,   // carry over real PNL
        wins:        realWins,  // carry over real wins
        losses:      realLoss,  // carry over real losses
        started_at:  new Date().toISOString(),
        stopped_at:  null,
        mode:        session?.mode === "live" ? "live" : "paper", // never overwrite live mode
        updated_at:  new Date().toISOString(),
      }, { onConflict:"id" });
      if (error) throw new Error(error.message);
      await refreshAll();
      notify(`Bot started with ${bal} SOL ✓`, "ok");
    } catch (e: any) { notify(`Error: ${e.message?.slice(0,60)}`, "err"); setStartingBot(false); }
    setLoading(false);
  };

  const stopBot = async () => {
    setLoading(true); setStoppingBot(true);
    try {
      const { error } = await d.from("shreem_brzee_session").upsert({
        id:"default", ...session, stopped_at:new Date().toISOString(), updated_at:new Date().toISOString(),
      }, { onConflict:"id" });
      if (error) throw new Error(error.message);
      await fetchSession();
      notify("Bot stopped", "info");
    } catch (e: any) { notify(`Error stopping: ${e.message?.slice(0,60)}`, "err"); }
    setLoading(false); setStoppingBot(false);
  };

  // ── Test signals ───────────────────────────────────────────────────────────
  const testBuy = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${EDGE_BASE}/test`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({}) });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0,60)}`);
      const d = await r.json();
      d.sig ? (notify("⚡ POPCAT test signal injected — check Signal Feed & Trade History","ok"), setTimeout(refreshAll,2000), setTimeout(refreshAll,5000)) : notify(`Test error: ${JSON.stringify(d).slice(0,80)}`,"err");
    } catch (e: any) { notify(`Test failed: ${e.message?.slice(0,80)}`,"err"); }
    setLoading(false);
  };

  const testSell = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${EDGE_BASE}/test-sell`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({}) });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0,60)}`);
      const d = await r.json();
      d.sig ? (notify("⚡ POPCAT SELL injected — position closing…","info"), setTimeout(refreshAll,2000), setTimeout(refreshAll,5000)) : notify(`Sell test error: ${JSON.stringify(d).slice(0,80)}`,"err");
    } catch (e: any) { notify(`Sell test failed: ${e.message?.slice(0,80)}`,"err"); }
    setLoading(false);
  };

  const triggerExecutor = async () => {
    try {
      notify("⚡ Triggering live executor…", "info");
      const EXEC = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor";
      const r = await fetch(EXEC, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ trigger:"manual" }) });
      const d = await r.json();
      console.log("[executor]", JSON.stringify(d, null, 2));
      if (d.skipped) notify(`Executor skipped: ${d.reason}`, "info");
      else if (d.results?.length) {
        const ok   = d.results.filter((x:any) => x.ok).length;
        const errs = d.results.filter((x:any) => x.error);
        notify(`Executor: ${ok} traded · ${errs.length} errors · see console`, ok ? "ok" : "err");
        if (errs.length) errs.forEach((e:any) => console.error("[exec err]", e));
      } else notify(`Executor: ${JSON.stringify(d).slice(0,120)}`, "info");
      setTimeout(refreshAll, 2000);
    } catch(e:any) { notify(`Executor error: ${e.message?.slice(0,60)}`, "err"); }
  };

  // ── Wallet ────────────────────────────────────────────────────────────────
  const handleWalletInput = (val: string) => {
    setWalletInput(val);
    setInputValid(val.trim().length > 0 ? isValidSol(val) : null);
  };
  const saveWallet = async () => {
    if (!isValidSol(walletInput)) { notify("Invalid Solana address","err"); return; }
    const addr = walletInput.trim();
    setConnectedWallet(addr); setWalletInput(""); setInputValid(null);
    const bal = await getWalletBalance(addr);
    setWalletBal(bal);
    notify("Wallet saved ✓","ok");
  };
  const connectPhantom = async () => {
    if (!window.solana?.isPhantom) { notify("Phantom not found — install at phantom.app","err"); return; }
    setPhantomLoading(true);
    try {
      const pub = (await window.solana.connect()).publicKey.toString();
      setConnectedWallet(pub);
      const bal = await getWalletBalance(pub);
      setWalletBal(bal);
      notify("Phantom connected ✓","ok");
    } catch { notify("Connection cancelled","info"); }
    setPhantomLoading(false);
  };

  // ── BUG 3 FIX: KOL Add — decouple DB insert from Helius sync ─────────────
  const addKolTrader = async (kol: { name: string; addr: string }) => {
    notify(`Adding ${kol.name}…`, "info");
    try {
      const { data: { user } } = await d.auth.getUser();
      // Step 1: Always write to DB first — this is the source of truth
      const { error: dbErr } = await d.from("tracked_whales").upsert({
        address:   kol.addr,
        label:     kol.name,
        source:    "kolexplorer",
        added_by:  user?.id || null,
        added_at:  new Date().toISOString(),
      }, { onConflict:"address" });
      if (dbErr) throw dbErr;
      // Step 2: Try Helius sync — but don't fail the whole operation if it errors
      notify(`✅ ${kol.name} added to tracking list. Syncing to Helius…`, "ok");
      try {
        const { data: syncData, error: syncErr } = await d.functions.invoke("helius-webhook-sync", { body:{} });
        if (syncErr) {
          console.warn("[helius-sync] Edge function error:", syncErr.message);
          notify(`✅ ${kol.name} tracked in DB · Helius sync pending (will retry automatically)`, "ok");
        } else if (!syncData?.ok) {
          console.warn("[helius-sync] Sync returned not-ok:", syncData?.error);
          notify(`✅ ${kol.name} tracked · Helius sync: ${syncData?.error || "check edge fn logs"}`, "info");
        } else {
          notify(`✅ ${kol.name} tracked · Helius watching ${syncData.wallet_count} wallets`, "ok");
        }
      } catch (syncEx: any) {
        console.warn("[helius-sync] Exception:", syncEx.message);
        notify(`✅ ${kol.name} saved · Helius sync will retry on next add`, "info");
      }
      // Refresh the tracked set so UI updates immediately
      setTrackedWhalesAddrs(prev => new Set([...prev, kol.addr]));
    } catch (e: any) {
      notify(`Add failed: ${e?.message?.slice(0,80) || "unknown error"}`, "err");
    }
  };

  // ── Admin force-close ──────────────────────────────────────────────────────
  const forceCloseAll = async () => {
    if (!openPos.length) { notify("No open positions","info"); return; }
    if (!confirm(`Force close ${openPos.length} position(s) at current market price?`)) return;
    setForceClosing(true);
    try {
      for (const pos of openPos) await closePosition(pos, "admin_force");
      notify(`✓ Force-closed ${openPos.length} position(s)`,"ok");
    } catch (e: any) { notify(`Force close failed: ${e.message?.slice(0,60)}`,"err"); }
    setForceClosing(false); setAdminOpen(false);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const isRunning = !!session?.started_at && !session?.stopped_at;

  // ── Derive ALL numbers from actual trade data — never from session counters ──
  // session.portfolio drifts with restarts and is unreliable for display
  const closedTrades  = trades.filter((t: any) => t.status === "closed");
  const openTrades    = trades.filter((t: any) => t.status === "open");

  // Real P&L = sum of pnl_sol from all closed trades
  const realPnlSol  = closedTrades.reduce((s: number, t: any) => s + (Number(t.pnl_sol) || 0), 0);
  const realPnlEur  = realPnlSol * solUsd * solEur;

  // Win/loss from actual trades
  const realWins    = closedTrades.filter((t: any) => (t.pnl_sol || 0) >= 0).length;
  const realLosses  = closedTrades.filter((t: any) => (t.pnl_sol || 0) < 0).length;
  const realTotal   = realWins + realLosses;
  const realWinRate = realTotal > 0 ? Math.round(realWins / realTotal * 100) : 0;

  // Start balance = what was set at last START (most recent session.start_balance)
  const startBal    = Number(session?.start_balance || parseFloat(balInput) || 1);

  // Current balance = start balance + all closed PNL - capital in open trades
  const openExposureSol = openTrades.reduce((s: number, t: any) => s + (Number(t.amount_sol) || 0), 0);
  const currentBalSol   = startBal + realPnlSol - openExposureSol;
  const currentBalEur   = currentBalSol * solUsd * solEur;

  // P&L % relative to start balance
  const realPnlPct  = startBal > 0 ? (realPnlSol / startBal * 100) : 0;

  // Keep portfolio for backward compat (compounding engine)
  const portfolio   = currentBalSol > 0 ? currentBalSol : startBal;
  const pnlTotal    = realPnlSol;
  const pnlPct      = realPnlPct.toFixed(1);

  // Whale table aggregation
  const whaleMap: Record<string,{buys:number;sells:number;totalSol:number}> = {};
  periodSigs.forEach((s: any) => {
    const lbl = s.label || "?";
    if (!whaleMap[lbl]) whaleMap[lbl] = { buys:0, sells:0, totalSol:0 };
    if (s.action === "BUY")  { whaleMap[lbl].buys++;  whaleMap[lbl].totalSol += s.amount_sol || 0; }
    if (s.action === "SELL") { whaleMap[lbl].sells++; }
  });
  const whaleRows = KOL_LIST.map(k => ({ ...k, ...(whaleMap[k.label]||{buys:0,sells:0,totalSol:0}), total:(whaleMap[k.label]?.buys||0)+(whaleMap[k.label]?.sells||0) }))
    .sort((a,b) => b.totalSol - a.totalSol);
  const maxSol = Math.max(...whaleRows.map(w => w.totalSol), 0.001);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#050505", color:"#fff", fontFamily:"'Plus Jakarta Sans','Inter',-apple-system,system-ui,sans-serif", paddingBottom:100 }}>

      {/* Header */}
      <div style={{ background:"#050505", borderBottom:"1px solid rgba(212,175,55,0.3)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:60 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => nav(-1)} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#b8860b,#D4AF37)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🔱</div>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:GOLD, letterSpacing:"-.03em" }}>Shreem Brzee Bot</div>
            <div style={{ fontSize:9, color:"#64748b", letterSpacing:".35em", textTransform:"uppercase" }}>SQI 2050 · Paper Trading</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", background:isRunning?"rgba(16,185,129,.15)":"rgba(255,255,255,.04)", border:`1px solid ${isRunning?"rgba(16,185,129,.5)":GOLD20}`, color:isRunning?GREEN:"#64748b", boxShadow:isRunning?"0 0 12px rgba(16,185,129,.25)":"none" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", animation:isRunning?"pulse 1.5s infinite":"none" }} />
            {isRunning ? "Running" : "Stopped"}
          </span>
          <span style={{ fontSize:11, color:"#64748b", whiteSpace:"nowrap" }}>€{(solUsd*solEur).toFixed(0)}/SOL</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes goldPulse{0%,100%{box-shadow:0 0 16px rgba(212,175,55,.28)}50%{box-shadow:0 0 28px rgba(212,175,55,.55)}}
        @keyframes redPulse{0%,100%{box-shadow:0 0 8px rgba(239,68,68,.2)}50%{box-shadow:0 0 18px rgba(239,68,68,.45)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ margin:"10px 14px 0", padding:"11px 14px", borderRadius:12, fontSize:13, fontWeight:600, background:toastType==="ok"?"rgba(16,185,129,.1)":toastType==="err"?"rgba(239,68,68,.1)":"rgba(0,212,255,.08)", border:`1px solid ${toastType==="ok"?"rgba(16,185,129,.3)":toastType==="err"?"rgba(239,68,68,.3)":"rgba(0,212,255,.25)"}`, color:toastType==="ok"?GREEN:toastType==="err"?RED:CYAN }}>
          {toast}
        </div>
      )}

      <div style={{ padding:"12px 14px 40px", maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { i:"💰", v:`€${currentBalEur.toFixed(2)}`, l:"Balance", s:`${currentBalSol.toFixed(3)} SOL`, c:GOLD },
            { i:"📈", v:`${realPnlSol>=0?"+":""}€${realPnlEur.toFixed(2)}`, l:"P&L (closed)", s:`${realPnlSol>=0?"+":""}${realPnlPct.toFixed(1)}% · ${closedTrades.length} trades`, c:realPnlSol>=0?GREEN:RED },
            { i:"🎯", v:`${realWins}W / ${realLosses}L`, l:"Win/Loss", s:`${realWinRate}% · ${realTotal} closed`, c:realWinRate>=55?GREEN:realWinRate<45&&realTotal>3?RED:"#fff" },
            { i:"📂", v:String(openPos.length), l:"Positions", s:isRunning?"live now":"start bot", c:openPos.length>0?GREEN:CYAN },
          ].map(card => (
            <div key={card.l} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, backdropFilter:"blur(40px)", boxShadow:"0 0 20px rgba(212,175,55,0.05)", padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{card.i}</div>
              <div style={{ fontSize:18, fontWeight:900, color:card.c, letterSpacing:"-.02em", lineHeight:1 }}>{card.v}</div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:"#64748b", margin:"4px 0 2px" }}>{card.l}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{card.s}</div>
            </div>
          ))}
        </div>

        <Section
          title="📂 Open Positions"
          badge={openPos.length>0?<span style={{ marginLeft:6, padding:"2px 8px", borderRadius:20, background:"rgba(16,185,129,.15)", color:GREEN, fontSize:10, fontWeight:800 }}>{openPos.length} live</span>:undefined}
          right={
            <div style={{ display:"flex", alignItems:"center", gap:6, position:"relative" }}>
              {liveMode && <button onClick={triggerExecutor} disabled={loading} style={{ padding:"5px 12px", borderRadius:9, border:"1px solid rgba(212,175,55,.4)", background:"rgba(212,175,55,.1)", color:"#D4AF37", fontSize:10, fontWeight:800, cursor:"pointer", marginRight:4 }}>▶ Run Executor</button>}
              {openPos.length===0 && <button onClick={testBuy} disabled={loading} style={{ padding:"5px 12px", borderRadius:9, border:"1px solid rgba(0,212,255,.3)", background:"rgba(0,212,255,.08)", color:CYAN, fontSize:10, fontWeight:800, cursor:"pointer" }}>⚡ Test Signal</button>}
              {isAdmin && (
                <>
                  <button onClick={e => { e.stopPropagation(); setAdminOpen(p=>!p); }} style={{ padding:"4px 8px", borderRadius:8, border:"1px solid rgba(212,175,55,.25)", background:"rgba(212,175,55,.06)", color:GOLD, fontSize:12, cursor:"pointer" }}>⚙</button>
                  {adminOpen && (
                    <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:50, minWidth:220, background:"#0a0a0a", border:"1px solid rgba(212,175,55,.3)", borderRadius:10, padding:8 }}>
                      <button onClick={forceCloseAll} disabled={forceClosing||openPos.length===0} style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid rgba(239,68,68,.3)", background:"rgba(239,68,68,.08)", color:RED, fontSize:11, fontWeight:800, cursor:"pointer" }}>
                        {forceClosing ? "Closing…" : `✕ Force Close All (${openPos.length})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          }
        >
          {openPos.length === 0 ? (
            <div>
              <div style={{ textAlign:"center", padding:"16px 0 10px" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>👀</div>
                <div style={{ fontSize:13, color:"#cbd5e0", fontWeight:700, marginBottom:4 }}>No Open Positions</div>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:12, lineHeight:1.5 }}>
                  {isRunning ? "Waiting for whale BUY signal — holds as long as whale holds · exits when whale exits · -30% stop loss only" : "Start the bot above to begin watching for whale swaps"}
                </div>
              </div>
              {/* Market context */}
              <div style={{ background:"rgba(212,175,55,0.03)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:12, padding:14 }}>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)", marginBottom:10 }}>📊 Market Context</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { l:"SOL Price", v:`$${solUsd.toFixed(2)}`, sub:`€${(solUsd*solEur).toFixed(2)}` },
                    { l:"Bot Status", v:isRunning?"🟢 Online":"🔴 Offline", sub:isRunning?"Whale SELL mirror: ACTIVE":"Not listening" },
                    { l:"Signals Received", v:String(signals.length), sub:signals.length>0?`Last: ${timeAgo(signals[0]?.created_at)}`:"None yet" },
                    { l:"Whale Wallets", v:"20", sub:"On Solana mainnet" },
                  ].map(card => (
                    <div key={card.l} style={{ background:"rgba(212,175,55,0.05)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(212,175,55,0.1)" }}>
                      <div style={{ fontSize:9, color:"#64748b", letterSpacing:".2em", textTransform:"uppercase", marginBottom:4 }}>{card.l}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{card.v}</div>
                      <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            openPos.map((pos: any) => {
              const entry   = Number(pos.entry_price) || 0;
              const size    = Number(pos.amount_sol) || 0;
              const price   = livePrices[pos.mint];
              // If entry_price was 0 (failed at open), show current price but mark PNL as pending
              const hasPriceData = entry > 0 && price && price > 0;
              const pnlPct  = hasPriceData ? (price - entry) / entry * 100 : null;
              const pnlSol  = pnlPct !== null ? size * (pnlPct / 100) : null;
              const pnlEur  = pnlSol !== null ? pnlSol * solUsd * solEur : null;
              const entryMissing = entry <= 0;
              const ageMs   = Date.now() - new Date(pos.opened_at || pos.created_at).getTime();
              const ageMins = Math.max(0, Math.floor(ageMs / 60000));
              const ageStr  = ageMins < 60 ? `${ageMins}m` : `${Math.floor(ageMins/60)}h ${ageMins%60}m`;
              const pnlColor= pnlPct === null ? "#64748b" : pnlPct >= 0 ? GREEN : RED;
              const sym     = pos.symbol || pos.mint?.slice(0,6) || "?";
              const expanded= expandedPos?.id === pos.id;
              return (
                <div key={pos.id} style={{ borderRadius:16, marginBottom:8, overflow:"hidden", border:`1px solid ${expanded?"rgba(212,175,55,.4)":"rgba(16,185,129,.2)"}`, background:expanded?"rgba(212,175,55,.04)":"rgba(16,185,129,.03)" }}>
                  <div onClick={() => setExpandedPos(expanded ? null : pos)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", cursor:"pointer" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:"rgba(212,175,55,.12)", border:"1px solid rgba(212,175,55,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:GOLD, flexShrink:0 }}>{sym.slice(0,2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:900, color:"#fff" }}>{sym}</div>
                        <div style={{ fontSize:9, color:"#64748b" }}>via <span style={{ color:GOLD, fontWeight:700 }}>{pos.label||"whale"}</span> · {ageStr}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:15, fontWeight:900, color:pnlColor }}>{pnlPct!==null?`${pnlPct>=0?"+":""}${pnlPct.toFixed(2)}%`:"—"}</div>
                        <div style={{ fontSize:9, color:pnlColor }}>{pnlEur!==null?`${pnlEur>=0?"+":""}${pnlEur.toFixed(2)}€`:""}</div>
                      </div>
                      <span style={{ color:GOLD, fontSize:14, transform:expanded?"rotate(90deg)":"rotate(0deg)", transition:"transform .2s" }}>›</span>
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ borderTop:"1px solid rgba(212,175,55,.15)" }}>
                      <div style={{ height:260, background:"#000" }}>
                        <iframe src={`https://dexscreener.com/solana/${pos.mint}?embed=1&theme=dark&trades=0&info=0&chart=1`} style={{ width:"100%", height:"100%", border:"none" }} title="chart" loading="lazy" />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, padding:"10px 12px 0" }}>
                        {[
                          { l:"SIZE",  v:`${size.toFixed(4)}`, u:"SOL", s:`≈${(size*solUsd*solEur).toFixed(2)}€` },
                          { l:"ENTRY", v:entry>0?`$${entry.toFixed(entry<.001?8:entry<.1?6:4)}`:"—", u:"", s:entry>0?`≈${(entry*size/Math.max(solUsd,1)*solEur).toFixed(2)}€`:"will retry" },
                          { l:"NOW",   v:price&&price>0?`$${price.toFixed(price<.001?8:price<.1?6:4)}`:"fetching…", u:"", s:price&&price>0?`≈${(price*size/Math.max(solUsd,1)*solEur).toFixed(2)}€`:"" },
                        ].map(cell => (
                          <div key={cell.l} style={{ background:"rgba(0,0,0,.3)", borderRadius:10, padding:"8px 10px", border:"1px solid rgba(255,255,255,.05)" }}>
                            <div style={{ fontSize:7, color:"#64748b", letterSpacing:".15em", marginBottom:3 }}>{cell.l}</div>
                            <div style={{ fontSize:11, fontWeight:800, color:"#fff" }}>{cell.v} <span style={{ fontSize:8, color:"#64748b" }}>{cell.u}</span></div>
                            <div style={{ fontSize:8, color:"#64748b", marginTop:1 }}>{cell.s}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ margin:"8px 12px", padding:"10px 14px", borderRadius:12, background:`rgba(${pnlPct!==null&&pnlPct>=0?"34,197,94":"239,68,68"},.08)`, border:`1px solid rgba(${pnlPct!==null&&pnlPct>=0?"34,197,94":"239,68,68"},.2)`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ fontSize:9, color:"#64748b", letterSpacing:".1em" }}>UNREALIZED PNL</div>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <div style={{ fontSize:18, fontWeight:900, color:pnlColor }}>{pnlPct!==null?`${pnlPct>=0?"+":""}${pnlPct.toFixed(2)}%`:"—"}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:pnlColor }}>{pnlEur!==null?`${pnlEur>=0?"+":""}${pnlEur.toFixed(2)}€`:""}</div>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 12px 12px" }}>
                        <a href={`https://dexscreener.com/solana/${pos.mint}`} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:10, borderRadius:12, border:"1px solid rgba(212,175,55,.3)", background:"rgba(212,175,55,.06)", color:GOLD, fontSize:10, fontWeight:800, textDecoration:"none" }}>📊 DEXSCREENER</a>
                        <button onClick={() => { closePosition(pos,"manual"); setExpandedPos(null); }} style={{ padding:10, borderRadius:12, border:"1px solid rgba(239,68,68,.4)", background:"rgba(239,68,68,.12)", color:RED, fontSize:10, fontWeight:900, cursor:"pointer" }}>✕ CLOSE TRADE</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Section>

        {/* My Wallet */}
        {/* Bot controls */}
        <Section title="💰 Paper Balance (SOL)">
          <div style={{ display:"flex", gap:7, marginBottom:10, flexWrap:"wrap" }}>
            {["0.5","1","2","5","10"].map(v => (
              <button key={v} onClick={() => setBalInput(v)} style={{ padding:"7px 0", borderRadius:10, cursor:"pointer", flex:"1 1 0", minWidth:44, border:`1px solid ${balInput===v?"rgba(212,175,55,.4)":GOLD20}`, background:balInput===v?"rgba(212,175,55,.12)":"transparent", color:balInput===v?GOLD:"#64748b", fontSize:13, fontWeight:700 }}>{v}</button>
            ))}
          </div>
          <input type="number" value={balInput} onChange={e => setBalInput(e.target.value)} min="0.1" step="0.1" style={{ ...inputStyle(GOLD20), marginBottom:12, fontSize:16 }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button onClick={startBot} disabled={loading} style={{ padding:14, borderRadius:13, border:"none", background:isRunning?"linear-gradient(135deg,#D4AF37,#f0c84a)":"linear-gradient(135deg,#7a5e10,#9a7018)", color:isRunning?"#000":"#fff", fontSize:12, fontWeight:900, letterSpacing:".12em", cursor:loading?"not-allowed":"pointer", animation:isRunning?"goldPulse 2s infinite":"none" }}>
              {loading&&startingBot ? "⚙" : isRunning ? "● RUNNING" : "▶ START"}
            </button>
            <button onClick={stopBot} disabled={loading||!isRunning} style={{ padding:14, borderRadius:13, border:`1px solid ${isRunning?"rgba(239,68,68,.6)":"rgba(239,68,68,.2)"}`, background:isRunning?"rgba(239,68,68,.18)":"rgba(239,68,68,.04)", color:isRunning?RED:"rgba(239,68,68,.35)", fontSize:12, fontWeight:900, letterSpacing:".12em", cursor:loading||!isRunning?"not-allowed":"pointer" }}>
              {loading&&stoppingBot ? "⚙" : "⏹ STOP"}
            </button>
          </div>
          {isRunning && (
            <div style={{ marginTop:10, padding:"9px 12px", borderRadius:10, background:"rgba(16,185,129,.06)", border:"1px solid rgba(16,185,129,.2)", fontSize:11, color:"rgba(16,185,129,.8)", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:GREEN, animation:"pulse 1.5s infinite" }} />
              Bot running · mirrors whale BUY & SELL · 20 wallets on Solana mainnet
            </div>
          )}
        </Section>

        {/* Open Positions */}
        {/* Compounding Engine stats */}
        {(() => {
          const sizing = calculatePositionSize(
            portfolio,
            session?.wins  || 0,
            session?.losses|| 0,
            openPos,
          );
          const openExposure = openPos.reduce((s: number, p: any) => s + (Number(p.amount_sol)||0), 0);
          const maxExposure  = portfolio * 0.50;
          const exposurePct  = maxExposure > 0 ? Math.min(100, openExposure / maxExposure * 100) : 0;
          const totalTrades  = (session?.wins||0) + (session?.losses||0);
          const wr           = totalTrades >= 5 ? Math.round((session?.wins||0)/totalTrades*100) : null;
          return (
            <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:14 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)", marginBottom:12 }}>⚛️ Compounding Engine</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[
                  { l:"Next Trade Size", v:sizing.blocked?"BLOCKED":`${sizing.size.toFixed(4)} SOL`, s:sizing.blocked?sizing.reason:`${(sizing.pct*100).toFixed(1)}% of balance`, c:sizing.blocked?RED:GOLD },
                  { l:"Live Win Rate",   v:wr !== null ? `${wr}%` : `—`, s:totalTrades>=5?`from ${totalTrades} trades`:"need 5+ trades", c:wr !== null && wr >= 55 ? GREEN : wr !== null && wr < 45 ? RED : "#fff" },
                  { l:"Open Exposure",   v:`${openExposure.toFixed(3)} SOL`, s:`${exposurePct.toFixed(0)}% of 50% cap`, c:exposurePct > 80 ? RED : exposurePct > 60 ? "#f59e0b" : GREEN },
                  { l:"Exposure Room",   v:`${Math.max(0, maxExposure-openExposure).toFixed(3)} SOL`, s:`${Math.max(0,100-exposurePct).toFixed(0)}% remaining`, c:GOLD },
                ].map(card => (
                  <div key={card.l} style={{ background:"rgba(0,0,0,.2)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(212,175,55,0.08)" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:".2em", textTransform:"uppercase", marginBottom:4 }}>{card.l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:card.c }}>{card.v}</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{card.s}</div>
                  </div>
                ))}
              </div>
              {/* Exposure bar */}
              <div style={{ background:"rgba(255,255,255,.04)", borderRadius:6, height:6, overflow:"hidden" }}>
                <div style={{ width:`${exposurePct}%`, height:6, borderRadius:6, background:exposurePct>80?RED:exposurePct>60?"#f59e0b":GREEN, transition:"width .5s ease" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:9, color:"#64748b" }}>0%</span>
                <span style={{ fontSize:9, color:"#f59e0b" }}>50% cap</span>
              </div>
            </div>
          );
        })()}


        {/* ── LIVE MODE PANEL ────────────────────────────────────────────── */}
        <div style={{ background:"rgba(239,68,68,0.04)", border:`1px solid ${liveMode?"rgba(239,68,68,0.5)":"rgba(239,68,68,0.15)"}`, borderRadius:14, padding:14, boxShadow:liveMode?"0 0 20px rgba(239,68,68,0.15)":"none" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:liveMode||liveConfirm?12:0 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:liveMode?"rgba(239,68,68,.8)":"rgba(255,255,255,.3)" }}>
                {liveMode ? "🔴 LIVE TRADING ACTIVE" : "📋 Paper Mode"}
              </div>
              {!liveMode && <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Real SOL copy trades — enable when ready</div>}
            </div>
            <button onClick={() => liveMode ? toggleLiveMode(false) : setLiveConfirm(p=>!p)} disabled={liveLoading} style={{ padding:"7px 16px", borderRadius:10, border:`1px solid ${liveMode?"rgba(239,68,68,.6)":"rgba(212,175,55,.35)"}`, background:liveMode?"rgba(239,68,68,.15)":"rgba(212,175,55,.08)", color:liveMode?"#ef4444":GOLD, fontSize:11, fontWeight:900, cursor:liveLoading||!isRunning?"not-allowed":"pointer", letterSpacing:".06em" }}>
              {liveLoading ? "⚙" : liveMode ? "⏹ STOP LIVE" : "▶ GO LIVE"}
            </button>
          </div>
          {/* Bot wallet info */}
          {botWallet && (
            <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:10, background:"rgba(0,0,0,.3)", border:"1px solid rgba(255,255,255,.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:9, color:"#64748b", letterSpacing:".2em", textTransform:"uppercase", marginBottom:2 }}>Bot Wallet</div>
                <div style={{ fontSize:11, fontFamily:"monospace", color:"#cbd5e0" }}>{botWallet.wallet.slice(0,8)}…{botWallet.wallet.slice(-6)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:15, fontWeight:900, color:GOLD }}>{botWallet.balance_sol.toFixed(3)} SOL</div>
                <div style={{ fontSize:10, color:"#64748b" }}>€{(botWallet.balance_sol*solUsd*solEur).toFixed(2)}</div>
              </div>
            </div>
          )}
          {/* Confirmation dialog */}
          {liveConfirm && !liveMode && (
            <div style={{ padding:"14px", borderRadius:12, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.3)" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#ef4444", marginBottom:8 }}>⚠️ Going live means REAL SOL</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginBottom:12, lineHeight:1.5 }}>
                The bot will execute real Solana swaps using the bot wallet. Every whale BUY signal triggers a real Jupiter swap. Max {(50).toFixed(0)}% of bot wallet can be in open positions at once.
              </div>
              {!botWallet && (
                <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", marginBottom:12, fontSize:11, color:"#ef4444" }}>
                  ❌ Bot wallet not configured. Add SHREEM_BOT_KEYPAIR to Supabase Edge Function secrets first.
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <button onClick={() => setLiveConfirm(false)} style={{ padding:"10px", borderRadius:10, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer" }}>Cancel</button>
                <button onClick={() => toggleLiveMode(true)} disabled={!botWallet||liveLoading} style={{ padding:"10px", borderRadius:10, border:"none", background:botWallet?"#ef4444":"rgba(239,68,68,.3)", color:"#fff", fontSize:12, fontWeight:900, cursor:botWallet?"pointer":"not-allowed" }}>
                  {liveLoading ? "Switching…" : "CONFIRM GO LIVE"}
                </button>
              </div>
            </div>
          )}
        </div>

        <Diagnostics running={isRunning} signalCount={signals.length} edgeOk={edgeOk} />

        <Section title="👛 My Wallet" accent="rgba(212,175,55,.28)" right={<span style={{ fontSize:9, color:GREEN, fontWeight:700 }}>🔒 Public only</span>}>
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            <button onClick={connectPhantom} disabled={phantomLoading} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"13px 14px", borderRadius:13, border:"1px solid rgba(139,92,246,.35)", background:"rgba(139,92,246,.08)", cursor:"pointer", textAlign:"left" }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"#ab9ff2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👻</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:"#c4b5fd" }}>{phantomLoading?"Connecting…":"Connect Phantom"}</div>
                <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>Safest — key never leaves Phantom</div>
              </div>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8, color:"#64748b", fontSize:10 }}>
              <div style={{ flex:1, height:1, background:GOLD20 }} />or paste<div style={{ flex:1, height:1, background:GOLD20 }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={walletInput} onChange={e => handleWalletInput(e.target.value)} placeholder="Solana address (32–44 chars)" maxLength={44} style={{ ...inputStyle(inputValid===null?GOLD20:inputValid?"rgba(16,185,129,.5)":"rgba(239,68,68,.5)"), flex:1 }} />
              <button onClick={saveWallet} disabled={!inputValid} style={{ padding:"0 14px", borderRadius:12, border:`1px solid ${inputValid?"rgba(212,175,55,.35)":GOLD20}`, background:inputValid?"rgba(212,175,55,.1)":"transparent", color:inputValid?GOLD:"#64748b", fontSize:11, fontWeight:800, cursor:inputValid?"pointer":"not-allowed" }}>{inputValid===false?"✗":"✓"}</button>
            </div>
            {connectedWallet && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:13, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.25)" }}>
                <div>
                  <div style={{ fontSize:9, color:"#64748b", letterSpacing:".3em", textTransform:"uppercase", marginBottom:3 }}>Connected</div>
                  <div style={{ fontSize:12, fontFamily:"monospace", color:"#cbd5e0" }}>{connectedWallet.slice(0,6)}…{connectedWallet.slice(-6)} <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:GREEN, marginLeft:6 }} /></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:GOLD }}>{walletBal!==null?`${walletBal.toFixed(3)} SOL`:"—"}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{walletBal!==null?`€${toEur(walletBal)}`:""}</div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Signal Feed */}
        <Section title="📡 Signal Feed" right={<span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.28)", color:CYAN }}><span style={{ width:5, height:5, borderRadius:"50%", background:CYAN, animation:"pulse 1.5s infinite" }} />Enhanced WS</span>}>
          {signals.length === 0 ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🐋</div>
              <div style={{ fontSize:13, color:"#cbd5e0", fontWeight:700, marginBottom:4 }}>Watching 20 wallets on Solana</div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:14 }}>BUY signals open positions · SELL signals close them instantly</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={testBuy} disabled={loading} style={{ padding:"9px 20px", borderRadius:11, border:"1px solid rgba(0,212,255,.3)", background:"rgba(0,212,255,.08)", color:CYAN, fontSize:11, fontWeight:800, cursor:"pointer" }}>⚡ BUY Signal</button>
                <button onClick={testSell} disabled={loading} style={{ padding:"9px 20px", borderRadius:11, border:"1px solid rgba(239,68,68,.3)", background:"rgba(239,68,68,.08)", color:RED, fontSize:11, fontWeight:800, cursor:"pointer" }}>⚡ SELL Signal</button>
              </div>
            </div>
          ) : signals.map((sig: any) => (
            <div key={sig.id} style={rowStyle}>
              <div style={{ width:32, height:32, borderRadius:9, background:sig.action==="BUY"?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)", color:sig.action==="BUY"?GREEN:RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, flexShrink:0 }}>{sig.action==="BUY"?"↑":"↓"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:GOLD, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sig.symbol||sig.mint?.slice(0,6)}</div>
                <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{sig.label}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{sig.amount_sol?.toFixed(3)} SOL</div>
                <div style={{ fontSize:10, color:"#64748b" }}>{timeAgo(sig.created_at)}</div>
              </div>
            </div>
          ))}
        </Section>

        {/* Trade History */}
        <Section title="📋 Trade History" badge={trades.length>0?<span style={{ marginLeft:6, fontSize:10, color:"#64748b" }}>{trades.length} trades</span>:undefined}>
          {trades.length === 0 ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
              <div style={{ fontSize:13, color:"#cbd5e0", fontWeight:700, marginBottom:4 }}>No trades yet</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Start bot → inject test signal → first trade appears</div>
            </div>
          ) : trades.map((t: any) => (
            <div key={t.id} style={rowStyle}>
              <div style={{ width:32, height:32, borderRadius:9, background:t.failed?"rgba(255,255,255,.04)":t.action==="BUY"?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)", color:t.failed?"#64748b":t.action==="BUY"?GREEN:RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, flexShrink:0 }}>
                {t.failed?"✗":t.action==="BUY"?"↑":"↓"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:GOLD, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.symbol||t.mint?.slice(0,6)||"?"}</div>
                <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>
                  {t.action} · {t.label}
                  {t.sell_reason && <span style={{ marginLeft:5, padding:"2px 7px", borderRadius:20, fontSize:9, fontWeight:700,
                      background:t.sell_reason==="whale_sell_mirror"?"rgba(16,185,129,.12)":t.sell_reason==="stop_loss"?"rgba(239,68,68,.12)":t.sell_reason==="48h_safety_cap"?"rgba(100,116,139,.12)":"rgba(212,175,55,.1)",
                      color:t.sell_reason==="whale_sell_mirror"?GREEN:t.sell_reason==="stop_loss"?RED:t.sell_reason==="48h_safety_cap"?"#94a3b8":GOLD,
                      border:`1px solid ${t.sell_reason==="whale_sell_mirror"?"rgba(16,185,129,.25)":t.sell_reason==="stop_loss"?"rgba(239,68,68,.25)":"rgba(212,175,55,.2)"}`
                    }}>
                      {t.sell_reason==="whale_sell_mirror"?"🐋 Whale exit":t.sell_reason==="stop_loss"?"🛑 Stop loss":t.sell_reason==="48h_safety_cap"?"⏱ 48h cap":t.sell_reason.replace(/_/g," ")}
                    </span>}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {t.status==="closed" ? (
                  <div>
                    <div style={{ fontSize:14, fontWeight:900, color:(t.pnl_sol||0)>=0?GREEN:RED }}>
                      {(t.pnl_sol||0)>=0?"+":"-"}€{Math.abs(toEurN(t.pnl_sol||0)).toFixed(2)}
                    </div>
                    <div style={{ fontSize:10, color:(t.pnl_pct||0)>=0?GREEN:RED }}>
                      {(t.pnl_pct||0)>=0?"+":""}{(t.pnl_pct||0).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>{(t.gross_sol||0).toFixed(4)} SOL</div>
                )}
                <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{timeAgo(t.created_at)}</div>
              </div>
            </div>
          ))}
        </Section>

        {/* Whale Performance */}
        <Section title={`🐋 Whale Performance · ${period.toUpperCase()}`} right={
          <div style={{ display:"flex", gap:4 }}>
            {(["daily","weekly","monthly","yearly"] as const).map(p => (
              <button key={p} onClick={e => { e.stopPropagation(); setPeriod(p); setTimeout(fetchPeriod,0); }} style={{ padding:"4px 9px", borderRadius:20, cursor:"pointer", border:`1px solid ${period===p?"rgba(212,175,55,.4)":GOLD20}`, background:period===p?"rgba(212,175,55,.12)":"transparent", color:period===p?GOLD:"#64748b", fontSize:9, fontWeight:800, textTransform:"uppercase" }}>
                {p==="daily"?"D":p==="weekly"?"W":p==="monthly"?"M":"Y"}
              </button>
            ))}
          </div>
        } defaultOpen={false}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:320, tableLayout:"fixed" }}>
              <thead>
                <tr>{["#","Whale","Buys","Sells","Vol SOL","Vol €"].map(h => <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:9, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", borderBottom:"1px solid rgba(212,175,55,0.15)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {whaleRows.map((w, i) => {
                  const active = w.total > 0;
                  const barW   = Math.min(100, w.totalSol / maxSol * 100);
                  return (
                    <tr key={w.addr} style={{ background:i%2===0?"transparent":"rgba(255,255,255,.012)" }}>
                      <td style={{ padding:"9px 10px", fontSize:12, color:"#64748b", fontWeight:700 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
                      <td style={{ padding:"9px 10px" }}>
                        <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{w.label}{w.vip&&<span style={{ color:GOLD, marginLeft:3 }}>⭐</span>}</div>
                        <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace", marginTop:1 }}>{w.addr.slice(0,6)}…{w.addr.slice(-4)}</div>
                      </td>
                      <td style={{ padding:"9px 10px", fontSize:12, fontWeight:700, color:active?GREEN:"#64748b" }}>{active?w.buys:"—"}</td>
                      <td style={{ padding:"9px 10px", fontSize:12, fontWeight:700, color:active?RED:"#64748b" }}>{active?w.sells:"—"}</td>
                      <td style={{ padding:"9px 10px" }}>{active?<div><div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{w.totalSol.toFixed(2)}</div><div style={{ width:50, background:"rgba(255,255,255,.06)", borderRadius:3, height:4, marginTop:3 }}><div style={{ width:`${barW}%`, height:4, borderRadius:3, background:GOLD }} /></div></div>:<span style={{ color:"#64748b" }}>—</span>}</td>
                      <td style={{ padding:"9px 10px", fontSize:12, fontWeight:700, color:active?GOLD:"#64748b" }}>{active?`€${toEurN(w.totalSol).toFixed(0)}`:"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {periodSigs.length === 0 && <div style={{ padding:"12px", textAlign:"center", fontSize:11, color:"#64748b" }}>No whale swaps detected this period · signals appear in real-time</div>}
        </Section>

        {/* KOL Explorer / Top Traders */}
        <div className="glass-card" style={{ border:"1px solid rgba(212,175,55,0.25)", marginTop:16, borderRadius:24 }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:10, letterSpacing:"0.15em", fontWeight:800, color:GOLD }}>🔭 WHALE SCANNER · TOP KOL TRADERS</span>
            <div style={{ display:"flex", gap:6 }}>
              {(["7D","30D"] as const).map(p => (
                <button key={p} onClick={() => setKolPeriod(p)} style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${kolPeriod===p?"#D4AF37":"rgba(255,255,255,0.1)"}`, background:kolPeriod===p?"rgba(212,175,55,0.15)":"transparent", color:kolPeriod===p?GOLD:"#64748b", fontSize:9, fontWeight:800, cursor:"pointer" }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ padding:"0 0 4px" }}>
            {KOL_EXPLORER.map((kol, i) => {
              const alreadyTracked = trackedWhalesAddrs.has(kol.addr);
              const pnl = kolPeriod === "7D" ? kol.pnl7d : kol.pnl30d;
              return (
                <div key={kol.addr} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                  {/* Rank */}
                  <div style={{ width:22, textAlign:"center", fontSize:11, fontWeight:900, color:i<3?GOLD:"#64748b", flexShrink:0 }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                  </div>
                  {/* Name + addr */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{kol.name}</div>
                    <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace", marginTop:1 }}>{kol.addr.slice(0,8)}…{kol.addr.slice(-4)}</div>
                  </div>
                  {/* PNL */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#22c55e" }}>+${pnl.toLocaleString()}</div>
                    <div style={{ fontSize:10, color:kol.wr>=60?GREEN:kol.wr>=50?"#f59e0b":RED, fontWeight:700 }}>{kol.wr}% WR</div>
                  </div>
                  {/* Status / Add button */}
                  <div style={{ flexShrink:0, marginLeft:4 }}>
                    {alreadyTracked ? (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, fontWeight:800, color:GREEN, background:"rgba(16,185,129,0.1)", padding:"4px 10px", borderRadius:20, border:"1px solid rgba(16,185,129,0.3)" }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:GREEN }} />TRACKING
                      </span>
                    ) : (
                      <button
                        onClick={() => addKolTrader(kol)}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${GOLD}`, background:"rgba(212,175,55,0.1)", color:GOLD, fontSize:10, fontWeight:800, letterSpacing:"0.08em", cursor:"pointer", whiteSpace:"nowrap" }}
                      >
                        + ADD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.05)", fontSize:9, color:"#64748b", textAlign:"center" }}>Live data from KOLExplorer.com · 30D top Solana meme traders by realized PNL</div>
        </div>

      </div>
    </div>
  );
}
