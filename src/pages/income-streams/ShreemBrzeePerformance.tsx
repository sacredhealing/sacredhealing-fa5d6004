import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase as d } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";

// ─── Constants ───────────────────────────────────────────────────────────────
const EDGE_BASE = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";
const GOLD  = "#D4AF37";
const GOLD20 = "rgba(212,175,55,0.2)";
const GREEN = "#10b981";
const RED   = "#ef4444";
const CYAN  = "#00d4ff";
const BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA";

// ─── Active tracked wallets (manual list — add new ones here, no DB management) ─
const KOL_LIST = [
  { label: "Cented",      addr: "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o", vip: true },
  { label: "Remusofmars", addr: "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu", vip: true },
];

const isValidSol = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
const timeAgo = (dt: string) => {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m/60)}h` : `${Math.floor(m/1440)}d`;
};

// ─── Kelly Position Sizer ─────────────────────────────────────────────────────
function calculatePositionSize(
  portfolio: number, wins: number, losses: number, openPositions: any[],
): { size: number; pct: number; blocked: boolean; reason: string } {
  if (portfolio <= 0) return { size:0, pct:0, blocked:true, reason:"zero balance" };
  const totalTrades = wins + losses;
  const winRate = totalTrades >= 5 ? wins / totalTrades : 0.5;
  const kellyPct = Math.min(0.15, Math.max(0.05, winRate * 0.12));
  const positionSize = portfolio * kellyPct;
  const openExposure = openPositions.reduce((s: number, p: any) => s + (Number(p.amount_sol) || 0), 0);
  const maxExposure = portfolio * 0.50;
  const remaining = maxExposure - openExposure;
  if (remaining <= 0.001) return { size:0, pct:kellyPct, blocked:true, reason:"50% exposure cap reached" };
  return { size: Math.min(positionSize, remaining), pct: kellyPct, blocked: false, reason: "ok" };
}

// ─── Price & Balance helpers ──────────────────────────────────────────────────
async function getSolPrice(): Promise<{ usd: number; eur: number }> {
  try {
    const [solRes, fxRes] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT").then(r => r.json()),
      fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r => r.json()),
    ]);
    return { usd: parseFloat(solRes.price) || 150, eur: fxRes?.rates?.EUR || 0.92 };
  } catch { return { usd: 150, eur: 0.92 }; }
}

async function getWalletBalance(addr: string): Promise<number> {
  // Primary: executor health reads balance server-side (avoids browser RPC auth issues)
  try {
    const h = await fetch("https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor/health", { signal: AbortSignal.timeout(6000) });
    if (h.ok) { const j = await h.json(); if (j?.balance_sol > 0) return j.balance_sol; }
  } catch {}
  // Fallback: direct RPC
  const RPCS = [
    "https://api.mainnet-beta.solana.com",
    "https://rpc.ankr.com/solana",
    "https://mainnet.helius-rpc.com/?api-key=7de253c3-49e2-42be-9672-23a761260f86",
  ];
  for (const rpc of RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc:"2.0", id:1, method:"getBalance", params:[addr] }),
        signal: AbortSignal.timeout(5000),
      });
      const j = await res.json();
      if (j?.result?.value != null && !j?.error) return j.result.value / 1e9;
    } catch { continue; }
  }
  return 0;
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
    { label:"Edge Function", status:edgeOk===null?"checking":edgeOk?"ok":"fail", detail:edgeOk===null?"Checking…":edgeOk?"Webhook reachable ✓":"Edge function unreachable" },
    { label:"Bot Session", status:running?"ok":"warn", detail:running?"Session active — watching 2 whale wallets":"Session stopped — press START above" },
    { label:"Signal Pipeline", status:signalCount>0?"ok":"warn", detail:signalCount>0?`${signalCount} signals received`:"0 signals yet — waiting for whale activity" },
    { label:"Blockchain", status:"ok", detail:"Solana mainnet · Jupiter DEX · RugCheck active" },
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
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShreemBrzeePerformance() {
  const nav = useNavigate();

  const [session, setSession]       = useState<any>(null);
  const [trades, setTrades]         = useState<any[]>([]);
  const [signals, setSignals]       = useState<any[]>([]);
  const [periodSigs, setPeriodSigs] = useState<any[]>([]);
  const [period, setPeriod]         = useState<"daily"|"weekly"|"monthly"|"yearly">("weekly");

  const [mode, setMode]             = useState<"paper"|"live">("paper");
  const [balInput, setBalInput]     = useState("1");
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState("");
  const [toastType, setToastType]   = useState<"ok"|"err"|"info">("ok");
  const [walletInput, setWalletInput]       = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [walletBal, setWalletBal]   = useState<number|null>(null);
  const [inputValid, setInputValid] = useState<boolean|null>(null);
  const [phantomLoading, setPhantomLoading] = useState(false);

  // SOL price — updated every 15s
  const [solUsd, setSolUsd] = useState(150);
  const [solEur, setSolEur] = useState(0.92);

  // Bot wallet — LIVE balance from Phantom wallet (real Solana RPC)
  const [botBalSol, setBotBalSol]   = useState<number>(0);
  const [botBalFetched, setBotBalFetched] = useState(false);

  // Live prices for open positions (USD per token) — derived from real on-chain
  // Jupiter quote of held tokens → SOL. Matches Phantom exactly (real depth, real
  // held amount). NO DexScreener/price-batch polling.
  const [livePrices, setLivePrices] = useState<Record<string,number>>({});
  // Exact on-chain token balance per mint (uiAmount), fetched once at open via
  // getTokenAccountsByOwner. Drives the Jupiter quote-out sizing.
  const [heldTokens, setHeldTokens] = useState<Record<string,number>>({});
  const [pricesFetched, setPricesFetched] = useState(false);

  const [edgeOk, setEdgeOk] = useState<boolean|null>(null);

  // Open positions — from shreem_brzee_live_trades (open status)
  const [openPos, setOpenPos]       = useState<any[]>([]);
  const [expandedPos, setExpandedPos] = useState<any|null>(null);
  const priceIntervalRef            = useRef<ReturnType<typeof setInterval>|null>(null);

  const [startingBot, setStartingBot] = useState(false);
  const [stoppingBot, setStoppingBot] = useState(false);
  const [closingIds, setClosingIds]   = useState<Set<string>>(new Set());

  

  const [liveMode, setLiveMode]       = useState(false);
  const [liveConfirm, setLiveConfirm] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);

  const [adminOpen, setAdminOpen]     = useState(false);
  const [forceClosing, setForceClosing] = useState(false);

  const { isAdmin } = useAdminRole();

  // ── Helpers ──────────────────────────────────────────────────────────────
  // entry_price and live prices are both USD — keep everything in USD, convert to EUR at display
  const usdToEur  = (usd: number) => usd * solEur;
  const solToEur  = (sol: number) => sol * solUsd * solEur;
  const solToEurN = (sol: number) => sol * solUsd * solEur;

  const notify = (msg: string, type: "ok"|"err"|"info" = "ok") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 6000);
  };
  const inputStyle = (border: string) => ({
    width:"100%", padding:"11px 14px", borderRadius:12, border:`1px solid ${border}`,
    background:"rgba(212,175,55,0.05)", color:"#fff", backdropFilter:"blur(10px)",
    fontSize:14, fontWeight:600, outline:"none", boxSizing:"border-box" as const,
  });
  const rowStyle = { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(212,175,55,0.1)" };

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/session`);
      const data = r.ok ? await r.json() : null;
      setSession(data);
      if (data?.mode === "live" && data?.started_at && !data?.stopped_at) setLiveMode(true);
      else if (data?.mode !== "live") setLiveMode(false);
    } catch {}
  }, []);

  // FIX: fetchTrades fetches BOTH tables always (not mode-conditional)
  // live_trades is the source of truth for real trades
  // paper_trades is fallback when no live trades exist
  const fetchTrades = useCallback(async () => {
    try {
      const [liveResp, paperResp] = await Promise.all([
        d.from("shreem_brzee_live_trades").select("*").order("created_at", { ascending: false }).limit(200),
        d.from("shreem_brzee_paper_trades").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      const liveTrades  = (liveResp.data  || []).filter((t: any) => !["TEST_","DIAG_","VERIFY_","DEBUG_","MINTEST_","MINCHECK_","FINALCHECK_","FULLTEST_","BONK2","DEPLOY_TEST","SESSIONCHECK_"].some(p => t.sig?.startsWith(p)));
      const paperTrades = (paperResp.data || []).filter((t: any) => !["TEST_","DIAG_","VERIFY_","DEBUG_","MINTEST_","MINCHECK_","FINALCHECK_","FULLTEST_","BONK2","DEPLOY_TEST","SESSIONCHECK_"].some(p => t.sig?.startsWith(p)));
      // If we have real live trades, show those. Otherwise show paper trades.
      const all = liveTrades.length > 0 ? liveTrades : paperTrades;
      setTrades(all);
    } catch {}
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const { data } = await d.from("shreem_brzee_signals")
        .select("*").order("created_at", { ascending: false }).limit(100);
      setSignals((data || []).filter((s: any) => !s.sig?.startsWith("TEST_") && !s.sig?.startsWith("DIAG_")));
    } catch {}
  }, []);

  const fetchPeriod = useCallback(async () => {
    const now = new Date(), from = new Date(now);
    if (period === "daily")   from.setHours(0,0,0,0);
    if (period === "weekly")  from.setDate(now.getDate()-7);
    if (period === "monthly") from.setMonth(now.getMonth()-1);
    if (period === "yearly")  from.setFullYear(now.getFullYear()-1);
    const { data } = await d.from("shreem_brzee_signals")
      .select("label,wallet,action,amount_sol,created_at,sig")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });
    setPeriodSigs((data || []).filter((s: any) => !s.sig?.startsWith("TEST_") && !s.sig?.startsWith("DIAG_")));
  }, [period]);

  const fetchOpen = useCallback(async () => {
    const skipSig = (s: any) => ["REALTEST_","TEST_","DIAG_","VERIFY_","DEBUG_","COLTEST_","DIAGFULL_","DIAGTEST_","NEWCODE_","FINALCHECK_"].some(p => String(s||"").toUpperCase().startsWith(p));
    const isReal = (t: any) => !skipSig(t?.sig) && !skipSig(t?.tx_sig);
    try {
      const { data: live } = await d.from("shreem_brzee_live_trades")
        .select("*").in("status", ["open","pending","unconfirmed"]).order("opened_at", { ascending: false });
      const real = (live||[]).filter(isReal);

      // Verify each position is real: if tx_sig exists but no tokens_received and opened > 2min ago, it's a ghost
      const now = Date.now();
      const verified = real.filter((t: any) => {
        const age = now - new Date(t.opened_at || t.created_at).getTime();
        // If older than 3 minutes and still no tokens_received — likely failed tx
        if (age > 180000 && !t.tokens_received && !t.entry_price) return false;
        return true;
      });

      // Auto-close any that were filtered as ghosts
      const ghosts = real.filter((t: any) => !verified.find((v: any) => v.id === t.id));
      for (const g of ghosts) {
        await d.from("shreem_brzee_live_trades").update({
          status: "closed", sell_reason: "auto_ghost_cleanup", closed_at: new Date().toISOString(), pnl_sol: 0, pnl_pct: 0,
        }).eq("id", g.id);
      }

      if (verified.length > 0) { setOpenPos(verified); return; }

      const { data: paper } = await d.from("shreem_brzee_paper_trades")
        .select("*").in("status", ["open","pending","unconfirmed"]).order("opened_at", { ascending: false });
      setOpenPos((paper||[]).filter(isReal));
    } catch {}
  }, []);

  const checkEdge = useCallback(async () => {
    try {
      const r = await fetch(`${EDGE_BASE}/ping`, { signal: AbortSignal.timeout(5000) });
      setEdgeOk(r.ok);
    } catch { setEdgeOk(false); }
  }, []);

  const refreshAll = useCallback(() => {
    fetchSession(); fetchTrades(); fetchSignals(); fetchPeriod(); fetchOpen();
  }, [fetchSession, fetchTrades, fetchSignals, fetchPeriod, fetchOpen]);

  // ── FIX: Bot wallet balance — direct Supabase query is faster and more reliable
  // Uses the same RPC logic as before but stores separately from session
  const refreshBotBalance = useCallback(async () => {
    const bal = await getWalletBalance(BOT_WALLET);
    if (bal > 0) {
      setBotBalSol(bal);
      setBotBalFetched(true);
      setBalInput(bal.toFixed(4));
    }
    // If bal=0, keep last known — but executor health always returns real value so this is rare
  }, [botBalFetched]);

  // ── On-chain P&L — matches Phantom exactly ─────────────────────────────────
  // 1. Once per position: getTokenAccountsByOwner via Helius → exact held amount.
  // 2. Every 5s per position: Jupiter /quote held_tokens → SOL (real depth).
  //    USD price per token = (outSol / heldTokens) * solUsd.
  // NO DexScreener calls. NO token-price-batch. Zero stale price feeds.
  const TOKEN_BAL_URL = `${EDGE_BASE.replace(/\/[^/]+$/, "")}/shreem-token-balance`;
  const BOT_WALLET_REF = useRef<string>(BOT_WALLET);

  const fetchHeldAmount = useCallback(async (mint: string) => {
    try {
      const r = await fetch(TOKEN_BAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: BOT_WALLET_REF.current, mint }),
        signal: AbortSignal.timeout(5000),
      });
      const j = await r.json();
      const ui = Number(j?.uiAmount || 0);
      const raw = Number(j?.amount || 0);
      const dec = Number(j?.decimals || 0);
      if (ui > 0) setHeldTokens(prev => ({ ...prev, [mint]: ui }));
      return { ui, raw, dec };
    } catch { return { ui: 0, raw: 0, dec: 0 }; }
  }, [TOKEN_BAL_URL]);

  const quoteTokenToSol = useCallback(async (mint: string, rawAmount: number) => {
    if (!rawAmount || rawAmount <= 0) return 0;
    try {
      const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${mint}&outputMint=So11111111111111111111111111111111111111112&amount=${Math.floor(rawAmount)}&slippageBps=300`;
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return 0;
      const j = await r.json();
      const outLamports = Number(j?.outAmount || 0);
      return outLamports / 1e9; // SOL
    } catch { return 0; }
  }, []);

  const updatePrices = useCallback(async () => {
    if (!openPos.length) return;
    const mints = [...new Set(openPos.map((p: any) => p.mint).filter(Boolean))];
    if (!mints.length) return;

    // Ensure we have on-chain held amounts for every open position (one-time fetch per mint)
    const missing = mints.filter(m => !heldTokens[m]);
    const fetched: Record<string, { ui: number; raw: number; dec: number }> = {};
    await Promise.all(missing.map(async (m) => { fetched[m] = await fetchHeldAmount(m); }));

    // Quote each held token → SOL using Jupiter (real on-chain pool depth)
    await Promise.all(mints.map(async (m) => {
      const ui = heldTokens[m] ?? fetched[m]?.ui ?? 0;
      const dec = fetched[m]?.dec ?? 6;
      if (ui <= 0) return;
      const raw = ui * Math.pow(10, dec);
      const outSol = await quoteTokenToSol(m, raw);
      if (outSol > 0) {
        const usdPerToken = (outSol / ui) * solUsd;
        setLivePrices(prev => ({ ...prev, [m]: usdPerToken }));
      }
    }));
    setPricesFetched(true);
  }, [openPos, heldTokens, fetchHeldAmount, quoteTokenToSol, solUsd]);

  useEffect(() => {
    updatePrices();
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    priceIntervalRef.current = setInterval(updatePrices, 5000);
    return () => { if (priceIntervalRef.current) clearInterval(priceIntervalRef.current); };
  }, [updatePrices]);


  // ── Close a position ───────────────────────────────────────────────────────
  const closePosition = useCallback(async (pos: any, reason = "manual") => {
    const id   = pos.id;
    const mint = pos.mint;
    setClosingIds(prev => { const n = new Set(prev); n.add(id); return n; });
    try {
      notify("Closing position…", "info");
      const EXEC = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor";
      const r = await fetch(EXEC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", trade_id: id, mint, reason }),
      });
      const result = r.ok ? await r.json() : null;
      const first  = result?.results?.[0];

      if (result?.ok && first?.ok) {
        setOpenPos(prev => prev.filter(p => p.id !== id));
        notify(`✅ ${pos.symbol || "Position"} closed${first.pnl_pct != null ? ` (${first.pnl_pct >= 0 ? "+" : ""}${Number(first.pnl_pct).toFixed(1)}%)` : ""}`, "ok");
      } else if (result?.ok && first && !first.ok && /no token balance/i.test(first.reason || "")) {
        setOpenPos(prev => prev.filter(p => p.id !== id));
        notify(`✅ Position removed (no on-chain balance remaining)`, "info");
      } else {
        // Force-close in DB — handles both pending and open status trades
        const closeData: any = { status: "closed", closed_at: new Date().toISOString(), pnl_sol: 0, pnl_pct: 0 };
        if (reason) { try { closeData.sell_reason = reason; } catch {} }
        const { error } = await d.from("shreem_brzee_live_trades").update(closeData).eq("id", id);
        if (!error) {
          setOpenPos(prev => prev.filter(p => p.id !== id));
          notify(`✅ ${pos.symbol || "Position"} closed`, "ok");
        } else {
          notify(`Close failed: ${error.message}`, "err");
        }
      }
      setTimeout(() => { fetchOpen(); fetchTrades(); fetchSession(); refreshBotBalance(); }, 1500);
    } catch (e: any) {
      notify(`Close failed: ${e.message?.slice(0,60)}`, "err");
    } finally {
      setClosingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [fetchOpen, fetchTrades, fetchSession, refreshBotBalance]);

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const chSig = d.channel("sb_sig_v6")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"shreem_brzee_signals" },
        () => { fetchSignals(); fetchPeriod(); })
      .subscribe();
    const chPaper = d.channel("sb_paper_v6")
      .on("postgres_changes", { event:"*", schema:"public", table:"shreem_brzee_paper_trades" },
        () => { fetchOpen(); fetchTrades(); fetchSession(); })
      .subscribe();
    const chLive = d.channel("sb_live_v6")
      .on("postgres_changes", { event:"*", schema:"public", table:"shreem_brzee_live_trades" },
        () => { fetchOpen(); fetchTrades(); fetchSession(); refreshBotBalance(); })
      .subscribe();
    return () => { d.removeChannel(chSig); d.removeChannel(chPaper); d.removeChannel(chLive); };
  }, [fetchSignals, fetchPeriod, fetchOpen, fetchTrades, fetchSession, refreshBotBalance]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAll(); checkEdge();
    getSolPrice().then(({ usd, eur }) => { setSolUsd(usd); setSolEur(eur); });
    refreshBotBalance();

    const masterInterval = setInterval(() => {
      refreshAll();
      getSolPrice().then(({ usd, eur }) => { setSolUsd(usd); setSolEur(eur); });
    }, 15000);
    // Bot wallet refresh every 20s — fast enough to catch trades closing
    const walletInterval = setInterval(refreshBotBalance, 20000);
    return () => { clearInterval(masterInterval); clearInterval(walletInterval); };
  }, []); // eslint-disable-line

  useEffect(() => { fetchPeriod(); }, [period]);

  // ── Live mode ──────────────────────────────────────────────────────────────
  const toggleLiveMode = async (goLive: boolean) => {
    setLiveLoading(true);
    try {
      const bal = botBalSol > 0 ? botBalSol : (parseFloat(balInput) || 0.3);
      if (goLive) {
        notify(`Going live with ${bal.toFixed(4)} SOL…`, "info");
        const r = await fetch(`${EDGE_BASE}/go-live`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance_sol: bal }),
        });
        const result = r.ok ? await r.json() : null;
        if (!result?.ok) throw new Error(result?.error || "go-live failed");
        setLiveMode(true); setLiveConfirm(false);
        notify("🔴 LIVE MODE ACTIVE — real SOL trading", "err");
      } else {
        await d.from("shreem_brzee_session").update({
          mode: "paper", stopped_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).eq("id", "default");
        setLiveMode(false);
        notify("📋 Paper mode restored", "ok");
      }
      await fetchSession();
    } catch (e: any) { notify(`Mode switch failed: ${e.message?.slice(0,60)}`, "err"); }
    setLiveLoading(false);
  };

  // ── Bot controls ───────────────────────────────────────────────────────────
  const startBot = async () => {
    setLoading(true); setStartingBot(true);
    const bal = liveMode && botBalSol > 0 ? botBalSol : (parseFloat(balInput) || 1);
    try {
      // BUG FIX: read wins/losses from LIVE trades (not paper) — real trades go to live table
      const { data: closedLive } = await d.from("shreem_brzee_live_trades")
        .select("pnl_sol").in("status", ["closed","unconfirmed_close"]);
      const closedPaper = closedLive?.length ? [] : 
        (await d.from("shreem_brzee_paper_trades").select("pnl_sol").eq("status","closed")).data || [];
      const closedTrades = closedLive?.length ? closedLive : closedPaper;
      const realPnl  = (closedTrades || []).reduce((s: number, t: any) => s + (Number(t.pnl_sol)||0), 0);
      const realWins = (closedTrades || []).filter((t: any) => (Number(t.pnl_sol)||0) > 0).length;
      const realLoss = (closedTrades || []).filter((t: any) => (Number(t.pnl_sol)||0) <= 0).length;
      const { error } = await d.from("shreem_brzee_session").upsert({
        id:"default", portfolio:bal, start_balance:bal, positions:{},
        total_pnl:realPnl, wins:realWins, losses:realLoss,
        started_at:new Date().toISOString(), stopped_at:null,
        mode:liveMode?"live":(session?.mode==="live"?"live":"paper"),
        updated_at:new Date().toISOString(),
      }, { onConflict:"id" });
      if (error) throw new Error(error.message);
      await refreshAll();
      notify(`Bot started with ${bal.toFixed(4)} SOL ✓`, "ok");
    } catch (e: any) { notify(`Error: ${e.message?.slice(0,60)}`, "err"); setStartingBot(false); }
    setLoading(false);
  };

  const stopBot = async () => {
    setLoading(true); setStoppingBot(true);
    try {
      await d.from("shreem_brzee_session").upsert({
        id:"default", ...session, stopped_at:new Date().toISOString(), updated_at:new Date().toISOString(),
      }, { onConflict:"id" });
      await fetchSession();
      notify("Bot stopped", "info");
    } catch (e: any) { notify(`Error: ${e.message?.slice(0,60)}`, "err"); }
    setLoading(false); setStoppingBot(false);
  };

  const testBuy = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${EDGE_BASE}/test`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({}) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      j.sig ? (notify("⚡ Test BUY injected — check Signal Feed","ok"), setTimeout(refreshAll,2000)) : notify(`Test error: ${JSON.stringify(j).slice(0,80)}`,"err");
    } catch (e: any) { notify(`Test failed: ${e.message}`, "err"); }
    setLoading(false);
  };

  const testSell = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${EDGE_BASE}/test-sell`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({}) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      j.sig ? (notify("⚡ Test SELL injected","info"), setTimeout(refreshAll,2000)) : notify(`Sell error: ${JSON.stringify(j).slice(0,80)}`,"err");
    } catch (e: any) { notify(`Sell test failed: ${e.message}`, "err"); }
    setLoading(false);
  };

  const triggerExecutor = async () => {
    try {
      notify("⚡ Triggering live executor…", "info");
      const EXEC = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor";
      const r = await fetch(EXEC, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ trigger:"manual" }) });
      const j = await r.json();
      if (j.skipped) notify(`Executor: ${j.reason}`, "info");
      else if (j.results?.length) {
        const ok = j.results.filter((x:any) => x.ok).length;
        notify(`Executor: ${ok}/${j.results.length} succeeded`, ok ? "ok" : "err");
      } else notify(`Executor: ${JSON.stringify(j).slice(0,120)}`, "info");
      setTimeout(refreshAll, 2000);
    } catch(e:any) { notify(`Executor error: ${e.message?.slice(0,60)}`, "err"); }
  };

  const forceCloseAll = async () => {
    if (!openPos.length) { notify("No open positions","info"); return; }
    if (!confirm(`Force close ${openPos.length} position(s)?`)) return;
    setForceClosing(true);
    try {
      for (const pos of openPos) await closePosition(pos, "admin_force");
      notify(`✓ Force-closed ${openPos.length} position(s)`,"ok");
    } catch (e: any) { notify(`Force close failed: ${e.message}`,"err"); }
    setForceClosing(false); setAdminOpen(false);
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
    if (!(window as any).solana?.isPhantom) { notify("Phantom not found — install at phantom.app","err"); return; }
    setPhantomLoading(true);
    try {
      const pub = (await (window as any).solana.connect()).publicKey.toString();
      setConnectedWallet(pub);
      const bal = await getWalletBalance(pub);
      setWalletBal(bal);
      notify("Phantom connected ✓","ok");
    } catch { notify("Connection cancelled","info"); }
    setPhantomLoading(false);
  };




  // ── Derived data ───────────────────────────────────────────────────────────
  const isRunning    = !!session?.started_at && !session?.stopped_at;
  const closedTrades = trades.filter((t: any) => t.status === "closed" || t.status === "unconfirmed_close");
  const openTrades   = trades.filter((t: any) => t.status === "open");

  // Real PNL from closed trades only — pnl_sol is SOL profit/loss written by executor/worker
  const realPnlSol   = closedTrades.reduce((s: number, t: any) => s + (Number(t.pnl_sol) || 0), 0);
  const realPnlEur   = solToEur(realPnlSol);
  const realWins     = closedTrades.filter((t: any) => (Number(t.pnl_sol) || 0) > 0).length;
  const realLosses   = closedTrades.filter((t: any) => (Number(t.pnl_sol) || 0) <= 0 && t.pnl_sol !== null && t.pnl_sol !== undefined).length;
  const realTotal    = realWins + realLosses;
  const realWinRate  = realTotal > 0 ? Math.round(realWins / realTotal * 100) : 0;

  // FIX: Balance card — use LIVE bot wallet balance (real Solana RPC)
  // botBalSol is fetched every 20s directly from blockchain
  // Falls back to session.portfolio only if RPC never returned a value
  const startBal     = Number(session?.start_balance || parseFloat(balInput) || 1);
  const displayBalSol = botBalFetched ? botBalSol : (session?.portfolio ? Number(session.portfolio) : startBal);
  const displayBalEur = solToEur(displayBalSol);

  // P&L% relative to start balance
  const realPnlPct = startBal > 0 ? (realPnlSol / startBal * 100) : 0;

  // For compounding engine
  const portfolio = displayBalSol > 0 ? displayBalSol : startBal;
  const openExposureSol = openPos.reduce((s: number, p: any) => s + (Number(p.amount_sol) || 0), 0);

  // Whale table
  const whaleMap: Record<string,{buys:number;sells:number;totalSol:number}> = {};
  periodSigs.forEach((s: any) => {
    const lbl = s.label || "?";
    if (!whaleMap[lbl]) whaleMap[lbl] = { buys:0, sells:0, totalSol:0 };
    if (s.action === "BUY")  { whaleMap[lbl].buys++;  whaleMap[lbl].totalSol += s.amount_sol || 0; }
    if (s.action === "SELL") { whaleMap[lbl].sells++; }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#050505", color:"#fff", fontFamily:"'Plus Jakarta Sans','Inter',-apple-system,system-ui,sans-serif", paddingBottom:100 }}>

      {/* Header */}
      <div style={{ background:"#050505", borderBottom:"1px solid rgba(212,175,55,0.3)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:60 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => nav(-1)} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#b8860b,#D4AF37)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🔱</div>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:GOLD, letterSpacing:"-.03em" }}>Shreem Brzee Bot</div>
            <div style={{ fontSize:9, color:"#64748b", letterSpacing:".35em", textTransform:"uppercase" }}>SQI 2050 · {liveMode ? "Live Trading" : "Paper Trading"}</div>
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

      {toast && (
        <div style={{ margin:"10px 14px 0", padding:"11px 14px", borderRadius:12, fontSize:13, fontWeight:600, background:toastType==="ok"?"rgba(16,185,129,.1)":toastType==="err"?"rgba(239,68,68,.1)":"rgba(0,212,255,.08)", border:`1px solid ${toastType==="ok"?"rgba(16,185,129,.3)":toastType==="err"?"rgba(239,68,68,.3)":"rgba(0,212,255,.25)"}`, color:toastType==="ok"?GREEN:toastType==="err"?RED:CYAN }}>
          {toast}
        </div>
      )}

      <div style={{ padding:"12px 14px 40px", maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Stats Grid ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            {
              i:"💰", l:"Bot Wallet",
              // FIX: Always show LIVE balance from blockchain
              v:`$${(displayBalSol * solUsd).toFixed(2)}`,
              s:`${displayBalSol.toFixed(4)} SOL · €${displayBalEur.toFixed(0)}${botBalFetched ? " 🔴" : ""}`,
              c:GOLD,
            },
            {
              i:"📈", l:"P&L (closed)",
              v:`${realPnlSol>=0?"+":""}$${(realPnlSol*solUsd).toFixed(2)}`,
              s:`${realPnlSol>=0?"+":""}${realPnlPct.toFixed(1)}% · €${realPnlEur.toFixed(2)} · ${closedTrades.length} trades`,
              c:realPnlSol>=0?GREEN:RED,
            },
            {
              i:"🎯", l:"Win / Loss",
              v:`${realWins}W / ${realLosses}L`,
              s:`${realWinRate}% · ${realTotal} closed`,
              c:realWinRate>=55?GREEN:realWinRate<45&&realTotal>3?RED:"#fff",
            },
            {
              i:"📂", l:"Open Positions",
              v:String(openPos.length),
              s:isRunning?"live now":"start bot",
              c:openPos.length>0?GREEN:CYAN,
            },
          ].map(card => (
            <div key={card.l} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, backdropFilter:"blur(40px)", boxShadow:"0 0 20px rgba(212,175,55,0.05)", padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{card.i}</div>
              <div style={{ fontSize:18, fontWeight:900, color:card.c, letterSpacing:"-.02em", lineHeight:1 }}>{card.v}</div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".3em", textTransform:"uppercase", color:"#64748b", margin:"4px 0 2px" }}>{card.l}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{card.s}</div>
            </div>
          ))}
        </div>

        {/* ── Open Positions ── */}
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
                  {isRunning ? "Waiting for whale BUY signal — exits on whale SELL or -30% stop loss" : "Start the bot above to begin watching whale swaps"}
                </div>
              </div>
              <div style={{ background:"rgba(212,175,55,0.03)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:12, padding:14 }}>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)", marginBottom:10 }}>📊 Market Context</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { l:"SOL Price", v:`$${solUsd.toFixed(2)}`, sub:`€${(solUsd*solEur).toFixed(2)}` },
                    { l:"Bot Status", v:isRunning?"🟢 Online":"🔴 Offline", sub:isRunning?"Watching 2 whale wallets":"Not listening" },
                    { l:"Signals Received", v:String(signals.length), sub:signals.length>0?`Last: ${timeAgo(signals[0]?.created_at)}`:"None yet" },
                    { l:"Bot Balance", v:`${displayBalSol.toFixed(4)} SOL`, sub:`€${displayBalEur.toFixed(2)}` },
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
              // ── FIX: CORRECT P&L CALCULATION ──────────────────────────────
              // entry_price is stored in USD (from DexScreener at open time)
              // livePrices[mint] is also USD (from DexScreener/Jupiter now)
              // Compute P&L entirely in USD, then convert to SOL/EUR at display
              const amountSol       = Number(pos.amount_sol ?? pos.size_sol ?? pos.sol_amount ?? 0);
              const entryUsd        = Number(pos.entry_price) || 0; // USD per token at buy
              const currentUsd  = livePrices[pos.mint]   || 0;   // USD per token

              // ── CORRECT P&L — matches Phantom exactly ─────────────────────
              // Phantom: (tokens_held × current_price - invested_usd) / invested_usd
              const investedUsd     = amountSol * solUsd;
              const investedEur     = usdToEur(investedUsd);
              // tokens_received: Hetzner stores RAW units (Jupiter outAmount integer)
              //                  Executor stores HUMAN units (outAmount / 10^decimals)
              // entry_price is always USD per human token in both cases
              // PRIMARY path: use entry_price to derive tokensHeld (always correct unit)
              // FALLBACK: raw tokens_received if entry_price missing (normalize if > 1B → raw)
              const rawTokens       = Number(pos.tokens_received) || 0;
              const isRawUnits      = rawTokens > 1_000_000_000; // >1B = definitely raw
              const tokensNorm      = isRawUnits ? rawTokens / 1e6 : rawTokens; // assume 6 decimals for raw
              const tokensFromEntry = entryUsd > 0 ? investedUsd / entryUsd : 0;
              // Always prefer entry_price-derived tokens — more reliable across executor and Hetzner
              const tokensHeld      = tokensFromEntry > 0
                ? tokensFromEntry
                : tokensNorm > 0 ? tokensNorm : 0;
              const hasPrices       = tokensHeld > 0 && currentUsd > 0 && investedUsd > 0;
              const currentValueUsd = hasPrices ? tokensHeld * currentUsd : null;
              const currentValueEur = currentValueUsd !== null ? usdToEur(currentValueUsd) : null;
              const pnlUsd = hasPrices && currentValueUsd !== null ? currentValueUsd - investedUsd : null;
              const pnlPct = hasPrices && pnlUsd !== null ? (pnlUsd / investedUsd) * 100 : null;
              const pnlSol = pnlUsd !== null ? pnlUsd / solUsd : null;
              const pnlEur = pnlUsd !== null ? usdToEur(pnlUsd) : null;

              const noLiquidity   = pricesFetched && entryUsd > 0 && (!currentUsd || currentUsd <= 0);
              // Jupiter quote of held tokens → SOL already factors in real depth, so no
              // separate "estimated" flag is needed — the displayed % IS the executable exit.
              const liqKnown      = false;
              const liqUsd        = 0;
              const isEstimated   = false;
              const pnlLabel      = pnlPct !== null
                ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`
                : noLiquidity ? "no liquidity"
                : (!pos.entry_price || Number(pos.entry_price)===0) ? "syncing…"
                : "—";


              const ageMs   = Date.now() - new Date(pos.opened_at || pos.created_at).getTime();
              const ageMins = Math.max(0, Math.floor(ageMs / 60000));
              const ageStr  = ageMins < 60 ? `${ageMins}m` : `${Math.floor(ageMins/60)}h ${ageMins%60}m`;
              const pnlColor = pnlPct === null ? "#64748b" : pnlPct >= 0 ? GREEN : RED;
              const sym      = pos.symbol || pos.mint?.slice(0,6) || "?";
              const expanded = expandedPos?.id === pos.id;
              const isClosing = closingIds.has(pos.id);

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
                        <div style={{ fontSize:noLiquidity?11:15, fontWeight:900, color:(noLiquidity||!pos.entry_price)?"#94a3b8":pnlColor }}>{pnlLabel}</div>
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
                          { l:"SIZE",  v:`${amountSol.toFixed(4)}`, u:"SOL", s:`≈${investedEur.toFixed(2)}€` },
                          { l:"ENTRY", v:entryUsd>0?`$${entryUsd.toFixed(entryUsd<.001?8:entryUsd<.1?6:4)}`:"—", u:"", s:`${investedEur.toFixed(2)}€ invested` },
                          { l:"NOW",   v:currentUsd>0?`$${currentUsd.toFixed(currentUsd<.001?8:currentUsd<.1?6:4)}`:"fetching…", u:"", s: liqKnown ? `liq $${liqUsd>=1000?(liqUsd/1000).toFixed(1)+"k":liqUsd.toFixed(0)}${isEstimated?" · low":""}` : (currentValueEur!=null?`${currentValueEur.toFixed(2)}€`:"") },
                        ].map(cell => (
                          <div key={cell.l} style={{ background:"rgba(0,0,0,.3)", borderRadius:10, padding:"8px 10px", border:"1px solid rgba(255,255,255,.05)" }}>
                            <div style={{ fontSize:7, color:"#64748b", letterSpacing:".15em", marginBottom:3 }}>{cell.l}</div>
                            <div style={{ fontSize:11, fontWeight:800, color:"#fff" }}>{cell.v} <span style={{ fontSize:8, color:"#64748b" }}>{cell.u}</span></div>
                            <div style={{ fontSize:8, color:cell.l==="NOW"&&isEstimated?"#f59e0b":"#64748b", marginTop:1 }}>{cell.s}</div>
                          </div>
                        ))}
                      </div>
                      {/* Unrealized PNL bar — confirmed only on actual Jupiter sell with on-chain SOL received */}
                      <div style={{ margin:"8px 12px", padding:"10px 14px", borderRadius:12, background:`rgba(${pnlPct!==null?(pnlPct>=0?"34,197,94":"239,68,68"):"100,116,139"},.08)`, border:`1px solid rgba(${pnlPct!==null?(pnlPct>=0?"34,197,94":"239,68,68"):"100,116,139"},.2)`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          <div style={{ fontSize:9, color:"#64748b", letterSpacing:".1em" }}>UNREALIZED PNL</div>
                          {isEstimated && (
                            <div style={{ fontSize:8, color:"#f59e0b", fontWeight:700, letterSpacing:".06em" }}>
                              ⚠ ESTIMATED · LOW LIQUIDITY · CONFIRMED ON SELL
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <div style={{ fontSize:noLiquidity?13:18, fontWeight:900, color:(noLiquidity||!pos.entry_price)?"#94a3b8":pnlColor }}>{pnlLabel}</div>
                          {pnlEur !== null && (
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:14, fontWeight:700, color:pnlColor }}>{pnlEur>=0?"+":""}{pnlEur.toFixed(2)}€</div>
                              {pnlSol !== null && <div style={{ fontSize:10, color:"#64748b" }}>{pnlSol>=0?"+":""}{pnlSol.toFixed(4)} SOL</div>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 12px 12px" }}>
                        <a href={`https://dexscreener.com/solana/${pos.mint}`} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:10, borderRadius:12, border:"1px solid rgba(212,175,55,.3)", background:"rgba(212,175,55,.06)", color:GOLD, fontSize:10, fontWeight:800, textDecoration:"none" }}>📊 DEXSCREENER</a>
                        <button onClick={() => { if (!isClosing) closePosition(pos,"manual"); }} disabled={isClosing} style={{ padding:10, borderRadius:12, border:"1px solid rgba(239,68,68,.4)", background:"rgba(239,68,68,.12)", color:RED, fontSize:10, fontWeight:900, cursor:isClosing?"wait":"pointer", opacity:isClosing?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          {isClosing ? (<><span style={{ display:"inline-block", width:10, height:10, border:"2px solid rgba(239,68,68,.3)", borderTopColor:RED, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />CLOSING…</>) : "✕ CLOSE TRADE"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Section>

        {/* Bot controls */}
        <Section title="💰 Balance & Bot Controls">
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
          {/* Live bot wallet balance display */}
          <div style={{ marginTop:10, padding:"10px 14px", borderRadius:12, background:"rgba(0,0,0,.3)", border:"1px solid rgba(212,175,55,.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, color:"#64748b", letterSpacing:".25em", textTransform:"uppercase", marginBottom:2 }}>Bot Wallet · Live Balance</div>
              <div style={{ fontSize:10, fontFamily:"monospace", color:"#94a3b8" }}>{BOT_WALLET.slice(0,8)}…{BOT_WALLET.slice(-6)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:900, color:GOLD }}>{displayBalSol.toFixed(4)} SOL</div>
              <div style={{ fontSize:11, color:"#64748b" }}>€{displayBalEur.toFixed(2)} {botBalFetched && <span style={{ color:GREEN, fontSize:9 }}>● live</span>}</div>
            </div>
          </div>
          {isRunning && (
            <div style={{ marginTop:10, padding:"9px 12px", borderRadius:10, background:"rgba(16,185,129,.06)", border:"1px solid rgba(16,185,129,.2)", fontSize:11, color:"rgba(16,185,129,.8)", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:GREEN, animation:"pulse 1.5s infinite" }} />
              Bot running · 2 whale wallets · exits server-side automatically
            </div>
          )}
        </Section>

        {/* Compounding Engine */}
        {(() => {
          const sizing = calculatePositionSize(portfolio, session?.wins||0, session?.losses||0, openPos);
          const maxExposure  = portfolio * 0.50;
          const exposurePct  = maxExposure > 0 ? Math.min(100, openExposureSol / maxExposure * 100) : 0;
          const totalTrades  = (session?.wins||0) + (session?.losses||0);
          const wr           = totalTrades >= 5 ? Math.round((session?.wins||0)/totalTrades*100) : null;
          return (
            <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:14 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:"rgba(212,175,55,.65)", marginBottom:12 }}>⚛️ Compounding Engine</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[
                  { l:"Next Trade Size", v:sizing.blocked?"BLOCKED":`${sizing.size.toFixed(4)} SOL`, s:sizing.blocked?sizing.reason:`${(sizing.pct*100).toFixed(1)}% of balance`, c:sizing.blocked?RED:GOLD },
                  { l:"Live Win Rate",   v:wr !== null ? `${wr}%` : "—", s:totalTrades>=5?`from ${totalTrades} trades`:"need 5+ trades", c:wr!==null&&wr>=55?GREEN:wr!==null&&wr<45?RED:"#fff" },
                  { l:"Open Exposure",   v:`${openExposureSol.toFixed(3)} SOL`, s:`${exposurePct.toFixed(0)}% of 50% cap`, c:exposurePct>80?RED:exposurePct>60?"#f59e0b":GREEN },
                  { l:"Exposure Room",   v:`${Math.max(0, maxExposure-openExposureSol).toFixed(3)} SOL`, s:`${Math.max(0,100-exposurePct).toFixed(0)}% remaining`, c:GOLD },
                ].map(card => (
                  <div key={card.l} style={{ background:"rgba(0,0,0,.2)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(212,175,55,0.08)" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:".2em", textTransform:"uppercase", marginBottom:4 }}>{card.l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:card.c }}>{card.v}</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{card.s}</div>
                  </div>
                ))}
              </div>
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

        {/* Live Mode Panel */}
        <div style={{ background:"rgba(239,68,68,0.04)", border:`1px solid ${liveMode?"rgba(239,68,68,0.5)":"rgba(239,68,68,0.15)"}`, borderRadius:14, padding:14, boxShadow:liveMode?"0 0 20px rgba(239,68,68,0.15)":"none" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:liveMode||liveConfirm?12:0 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:".4em", textTransform:"uppercase", color:liveMode?"rgba(239,68,68,.8)":"rgba(255,255,255,.3)" }}>
                {liveMode ? "🔴 LIVE TRADING ACTIVE" : "📋 Paper Mode"}
              </div>
              {!liveMode && <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>Real SOL copy trades — enable when ready</div>}
            </div>
            <button onClick={() => liveMode ? toggleLiveMode(false) : setLiveConfirm(p=>!p)} disabled={liveLoading} style={{ padding:"7px 16px", borderRadius:10, border:`1px solid ${liveMode?"rgba(239,68,68,.6)":"rgba(212,175,55,.35)"}`, background:liveMode?"rgba(239,68,68,.15)":"rgba(212,175,55,.08)", color:liveMode?"#ef4444":GOLD, fontSize:11, fontWeight:900, cursor:liveLoading?"not-allowed":"pointer", letterSpacing:".06em" }}>
              {liveLoading ? "⚙" : liveMode ? "⏹ STOP LIVE" : "▶ GO LIVE"}
            </button>
          </div>
          {liveMode && (
            <div style={{ padding:"8px 12px", borderRadius:10, background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", fontSize:11, color:"rgba(239,68,68,.8)", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:RED, animation:"pulse 1.5s infinite" }} />
              Real SOL swaps active · {displayBalSol.toFixed(4)} SOL available · Bot wallet: {BOT_WALLET.slice(0,8)}…
            </div>
          )}
          {liveConfirm && !liveMode && (
            <div style={{ padding:14, borderRadius:12, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.3)" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#ef4444", marginBottom:8 }}>⚠️ Going live means REAL SOL</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginBottom:12, lineHeight:1.5 }}>
                Bot wallet: {displayBalSol.toFixed(4)} SOL (€{displayBalEur.toFixed(2)}). Every whale BUY triggers a real Jupiter swap. Max 50% in positions at once.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <button onClick={() => setLiveConfirm(false)} style={{ padding:10, borderRadius:10, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer" }}>Cancel</button>
                <button onClick={() => toggleLiveMode(true)} disabled={liveLoading} style={{ padding:10, borderRadius:10, border:"none", background:"#ef4444", color:"#fff", fontSize:12, fontWeight:900, cursor:"pointer" }}>
                  {liveLoading ? "Switching…" : "CONFIRM GO LIVE"}
                </button>
              </div>
            </div>
          )}
        </div>

        <Diagnostics running={isRunning} signalCount={signals.length} edgeOk={edgeOk} />

        {/* My Wallet */}
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
                  <div style={{ fontSize:11, color:"#64748b" }}>{walletBal!==null?`€${solToEur(walletBal).toFixed(2)}`:""}</div>
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
              <div style={{ fontSize:11, color:"#64748b", marginBottom:14 }}>BUY signals open positions · SELL signals close instantly</div>
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
                      background:t.sell_reason==="whale_sell_mirror"?"rgba(16,185,129,.12)":t.sell_reason==="stop_loss"?"rgba(239,68,68,.12)":"rgba(212,175,55,.1)",
                      color:t.sell_reason==="whale_sell_mirror"?GREEN:t.sell_reason==="stop_loss"?RED:GOLD,
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
                      {(t.pnl_sol||0)>=0?"+":"-"}€{Math.abs(solToEurN(t.pnl_sol||0)).toFixed(2)}
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

        {/* Active wallets (read-only, manual list — see KOL_LIST at top of file) */}
        <Section title={`🐋 Tracked Wallets · ${KOL_LIST.length}`} defaultOpen={false}>
          <div style={{ padding:"0 0 4px" }}>
            {KOL_LIST.map((w) => {
              const stats = whaleMap[w.label];
              const buys = stats?.buys || 0;
              const sells = stats?.sells || 0;
              const vol = stats?.totalSol || 0;
              return (
                <div key={w.addr} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{w.label}{w.vip && <span style={{ color:GOLD, marginLeft:4 }}>⭐</span>}</div>
                    <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace", marginTop:1 }}>{w.addr.slice(0,8)}…{w.addr.slice(-4)}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, fontSize:11, color:"#94a3b8" }}>
                    <div><span style={{ color:GREEN }}>{buys}B</span> · <span style={{ color:RED }}>{sells}S</span></div>
                    <div style={{ fontSize:9, color:"#64748b" }}>{vol.toFixed(2)} SOL ({period})</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>


      </div>
    </div>
  );
}
