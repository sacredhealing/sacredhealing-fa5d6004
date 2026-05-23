import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const ADMIN_UUID = "bd0b21c9-577a-450b-bb1e-21c9d0423f17";

interface Trade {
  id: string;
  market_question: string;
  outcome: string;
  direction: string;
  entry_price: number;
  amount_usdc: number;
  shares: number;
  strategy: string;
  status: string;
  is_paper: boolean;
  created_at: string;
}

interface Whale {
  id: string;
  address: string;
  alias: string;
  win_rate_30d: number;
  roi_30d: number;
  trades_tracked: number;
  total_trades_seen: number;
  is_active: boolean;
  last_checked: string;
}

interface Settings {
  id: string;
  paper_balance: number;
  paper_mode: boolean;
  risk_pct: number;
  updated_at: string;
}

export default function PolymarketOracle() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [whales, setWhales] = useState<Whale[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "trades" | "whales" | "setup">("dashboard");

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (!user || user.id !== ADMIN_UUID) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchData() {
    try {
      const [tradesRes, whalesRes, settingsRes] = await Promise.all([
        supabase.from("polymarket_trades" as any).select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("polymarket_whales" as any).select("*").order("roi_30d", { ascending: false }),
        supabase.from("polymarket_bot_settings" as any).select("*").limit(1).single(),
      ]);
      if (tradesRes.data) setTrades(tradesRes.data as Trade[]);
      if (whalesRes.data) setWhales(whalesRes.data as Whale[]);
      if (settingsRes.data) setSettings(settingsRes.data as Settings);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Guard after hooks
  if (!user || user.id !== ADMIN_UUID) return <Navigate to="/" replace />;

  const paperTrades   = trades.filter(t => t.is_paper);
  const openTrades    = paperTrades.filter(t => t.status === "open");
  const closedTrades  = paperTrades.filter(t => t.status === "closed");
  const totalStaked   = openTrades.reduce((s, t) => s + Number(t.amount_usdc), 0);
  const clawbotTrades = paperTrades.filter(t => t.strategy?.includes("clawbot"));
  const last7Days     = paperTrades.filter(t => new Date(t.created_at) > new Date(Date.now() - 7*864e5));
  const last3Days     = paperTrades.filter(t => new Date(t.created_at) > new Date(Date.now() - 3*864e5));
  const activeWhales  = whales.filter(w => w.is_active);

  const G = "#D4AF37";
  const C = "#22D3EE";

  const card = (label: string, value: string | number, sub?: string, col = G) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${col}22`, borderRadius: 20, padding: "20px 24px" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: col, letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const badge = (t: string, c: string) => (
    <span style={{ background: c+"22", color: c, border: `1px solid ${c}44`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{t}</span>
  );

  const tab = (id: typeof activeTab, label: string) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const,
        background: activeTab === id ? G : "transparent", color: activeTab === id ? "#050505" : "rgba(255,255,255,0.45)" }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "32px 20px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: G, marginBottom: 6 }}>SQI-2050 · ADMIN ONLY</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>🦈 CLAWBOT Oracle</h1>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>On-Chain Polymarket Whale Tracker · Polygon V2 · Every 15 min</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          {badge("PAPER MODE", C)}
          {badge(`${activeWhales.length} WHALES`, G)}
          {badge("24/7 ACTIVE", "#10B981")}
          {badge(`${clawbotTrades.length} CLAWBOT TRADES`, "#A78BFA")}
          {settings && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Updated {new Date(settings.updated_at).toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 4, width: "fit-content" }}>
        {tab("dashboard", "Dashboard")}
        {tab("trades", "Trades")}
        {tab("whales", "Whales")}
        {tab("setup", "Go Live")}
      </div>

      {loading && <div style={{ color: G, fontSize: 14, padding: 40, textAlign: "center" as const }}>⟳ Loading oracle data...</div>}

      {/* DASHBOARD */}
      {!loading && activeTab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 28 }}>
            {card("Paper Balance", `$${Number(settings?.paper_balance ?? 0).toFixed(2)}`, "Started $10.00")}
            {card("Open Positions", openTrades.length, `$${totalStaked.toFixed(2)} staked`)}
            {card("7-Day Trades", last7Days.length, `${last3Days.length} in last 3d`)}
            {card("Whale Mirrors", clawbotTrades.length, "On-chain copies", "#A78BFA")}
            {card("Whales Found", activeWhales.length, `${whales.length} total`, C)}
            {card("Risk / Trade", `${((settings?.risk_pct ?? 0.05)*100).toFixed(0)}%`, "Of running balance")}
          </div>

          <div style={{ background: "rgba(212,175,55,0.04)", border: `1px solid ${G}30`, borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: G, marginBottom: 14 }}>HOW CLAWBOT WORKS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {[
                ["🔍 Scan","Every 15 min: 450 Polygon blocks scanned (~15 min of trades)"],
                ["🦈 Detect","All trades >$100 USDC on V2 Exchange. Auto-register whale wallets"],
                ["📊 Filter","Only entry-zone prices 6%–94%. Skip exits & near-resolutions"],
                ["⚡ Mirror","Top 3 whale trades copied at 5% of running balance"],
                ["📈 Compound","Position size grows as balance grows. Fully automatic"],
              ].map(([t, d]) => (
                <div key={t}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>LATEST WHALE MIRRORS</div>
            {openTrades.length === 0 && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No open positions yet — next scan in &lt;15 min</div>}
            {openTrades.slice(0,8).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {t.market_question?.replace(/\[.*?\]/g,'').trim()}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {new Date(t.created_at).toLocaleString()} · {t.strategy}
                  </div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G }}>${Number(t.amount_usdc).toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: t.outcome === "Yes" ? "#10B981" : "#F59E0B" }}>{t.outcome} @ {(Number(t.entry_price)*100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRADES */}
      {!loading && activeTab === "trades" && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {openTrades.length} open · {closedTrades.length} closed · {paperTrades.length} total
          </div>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Time","Market","Outcome","Entry %","Size $","Strategy","Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left" as const, color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.15em", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paperTrades.slice(0,100).map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontSize: 10, whiteSpace: "nowrap" as const }}>
                      {new Date(t.created_at).toLocaleDateString()}<br/>{new Date(t.created_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "8px 12px", maxWidth: 280 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, color: "rgba(255,255,255,0.75)", fontSize: 12 }} title={t.market_question}>
                        {t.market_question?.replace(/\[.*?\]/g,'').trim().slice(0,60)}...
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", color: t.outcome === "Yes" ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{t.outcome}</td>
                    <td style={{ padding: "8px 12px", color: G, fontWeight: 700 }}>{(Number(t.entry_price)*100).toFixed(1)}¢</td>
                    <td style={{ padding: "8px 12px", color: "#fff" }}>${Number(t.amount_usdc).toFixed(3)}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: t.strategy?.includes("clawbot") ? G+"22" : C+"22", color: t.strategy?.includes("clawbot") ? G : C, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        {t.strategy?.includes("clawbot") ? "🦈 WHALE" : "📊 EV"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: t.status === "open" ? "#10B981" : "#6B7280", fontSize: 10 }}>● {t.status?.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WHALES */}
      {!loading && activeTab === "whales" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
            {card("Tracking", whales.length, "Auto-discovered on-chain")}
            {card("Active", activeWhales.length, "Scanned every 15 min")}
            {card("Max Trackable", "Unlimited", "Grows each scan run", "#10B981")}
            {card("Avg Trade", "$20k–$400k", "Per whale position", "#A78BFA")}
          </div>

          <div style={{ background: "rgba(212,175,55,0.04)", border: `1px solid ${G}30`, borderRadius: 20, padding: 20, marginBottom: 20, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: G, marginBottom: 10 }}>POSITION SIZING INTELLIGENCE</div>
            <strong style={{color:"#fff"}}>Whale typical stats:</strong> $5k–$400k per trade · 5–15% of portfolio per position · Entry zone 30¢–75¢ · Sports + Politics + Crypto<br/>
            <strong style={{color:"#fff"}}>Our mirror:</strong> 5% of running balance · €10 start = €0.50/trade · Fully compounds · Same market + direction · ~15 min after whale entry
          </div>

          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Alias","Address","Win Rate","ROI 30d","Trades Seen","Last Active","Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left" as const, color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whales.map(w => (
                  <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: G }}>{w.alias}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "monospace" }}>
                      {w.address?.slice(0,10)}...{w.address?.slice(-6)}
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: w.win_rate_30d > 60 ? "#10B981" : "rgba(255,255,255,0.4)" }}>
                      {w.win_rate_30d > 0 ? `${w.win_rate_30d}%` : "Building..."}
                    </td>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: w.roi_30d > 0 ? "#10B981" : "rgba(255,255,255,0.4)" }}>
                      {w.roi_30d > 0 ? `+${w.roi_30d}%` : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)" }}>{w.total_trades_seen || w.trades_tracked || 0}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                      {w.last_checked ? new Date(w.last_checked).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: w.is_active ? "#10B981" : "#6B7280", fontSize: 10 }}>
                        {w.is_active ? "● ACTIVE" : "○ PAUSED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GO LIVE SETUP */}
      {!loading && activeTab === "setup" && (
        <div style={{ display: "grid", gap: 18 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C+"11", border: `1px solid ${C}30`, borderRadius: 20, padding: 20 }}>
              <div style={{ color: C, fontWeight: 700, marginBottom: 12 }}>📋 PAPER MODE (Now)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
                ✓ Real whale detection on Polygon<br/>✓ Real Polymarket prices<br/>✓ Real entry timing + markets<br/>✓ Fees calculated identically<br/>✓ Full compounding simulation<br/>✗ No real Polymarket account<br/>✗ No actual profit/loss
              </div>
            </div>
            <div style={{ background: G+"11", border: `1px solid ${G}30`, borderRadius: 20, padding: 20 }}>
              <div style={{ color: G, fontWeight: 700, marginBottom: 12 }}>🔴 LIVE MODE (After 7 days)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
                ✓ Everything from paper mode<br/>✓ Real USDC trades on Polygon<br/>✓ Real Polymarket V2 positions<br/>✓ Profit in pUSD → withdraw USDC<br/>✓ Auto-compounds every trade<br/>⚠ Needs MetaMask + pUSD balance<br/>⚠ Start with €10 — real risk
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: G, marginBottom: 16 }}>WALLET SETUP — 6 STEPS TO GO LIVE</div>
            {[
              ["1. Fresh MetaMask wallet","Create a NEW wallet only for this bot. Never use your main wallet. Bot will hold the private key."],
              ["2. Add Polygon network","Chain ID: 137 · polygon-mainnet.g.alchemy.com/v2/az4D7Awbl2E2rNpe6kc3M"],
              ["3. Fund with USDC on Polygon","Buy on Binance/Coinbase → withdraw to Polygon (not Ethereum). Start with €12 to cover gas."],
              ["4. Go to polymarket.com","Sign in with MetaMask → Deposit → creates your V2 deposit wallet automatically"],
              ["5. Convert USDC → pUSD","Polymarket auto-wraps on deposit. 1:1 ratio, no fee. pUSD is your trading collateral."],
              ["6. Add private key to GitHub","Go to: github.com/sacredhealing/sacredhealing-fa5d6004 → Settings → Secrets → Add POLYMARKET_PRIVATE_KEY"],
            ].map(([s, d]) => (
              <div key={s} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontWeight: 700, color: G, fontSize: 12, minWidth: 180, flexShrink: 0 }}>{s}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#10B98111", border: "1px solid #10B98130", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#10B981", marginBottom: 14 }}>7-DAY CHECKLIST BEFORE LIVE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                "Day 1–2: Bot scans & mirrors 3+ whale trades per day",
                "Day 3: 10+ open paper positions in Supabase",
                "Day 4: Check which markets resolved — note W/L",
                "Day 5: Whale win rate data building automatically",
                "Day 6: Compare paper P&L vs $10 start",
                "Day 7: If neutral/positive → fund real wallet",
                "Go Live: Set PAPER_MODE=false in GitHub workflow",
                "Go Live: Add POLYMARKET_PRIVATE_KEY to secrets",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.5)", padding: "6px 0" }}>
                  <span style={{ color: "#10B981", flexShrink: 0 }}>☐</span>{item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: G, marginBottom: 14 }}>EXECUTION SPEED & FEES</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
              <strong style={{color:"#fff"}}>Current delay:</strong> Max 15 min (GitHub cron) — whale enters, we follow next cycle<br/>
              <strong style={{color:"#fff"}}>Slippage:</strong> Liquid markets move &lt;2% in 15 min. Sports markets can move more near game time.<br/>
              <strong style={{color:"#fff"}}>Polymarket fees:</strong> ~0.5–2% per trade, charged at match time in pUSD<br/>
              <strong style={{color:"#fff"}}>Paper vs Live parity:</strong> Entry price, direction, and market identical. Only real money differs.<br/>
              <strong style={{color:"#fff"}}>To get &lt;30 sec speed:</strong> Upgrade Railway → redeploy WebSocket listener (future upgrade)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
