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
  last_trade_size: number;
  total_trades_seen: number;
  is_active: boolean;
  last_checked: string;
}

interface Settings {
  paper_balance: number;
  paper_mode: boolean;
  risk_pct: number;
  updated_at: string;
}

const PUSD_PER_TRADE = 10; // whale average position in pUSD thousands

export default function PolymarketOracle() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [whales, setWhales] = useState<Whale[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "trades" | "whales" | "setup">("dashboard");

  if (!user || user.id !== ADMIN_UUID) return <Navigate to="/" replace />;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [tradesRes, whalesRes, settingsRes] = await Promise.all([
        supabase.from("polymarket_trades").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("polymarket_whales").select("*").order("roi_30d", { ascending: false }),
        supabase.from("polymarket_bot_settings").select("*").limit(1).single(),
      ]);
      if (tradesRes.data) setTrades(tradesRes.data);
      if (whalesRes.data) setWhales(whalesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const paperTrades = trades.filter(t => t.is_paper);
  const openTrades  = paperTrades.filter(t => t.status === "open");
  const closedTrades= paperTrades.filter(t => t.status === "closed");
  const totalStaked = openTrades.reduce((s, t) => s + t.amount_usdc, 0);
  const clawbotTrades = paperTrades.filter(t => t.strategy?.includes("clawbot"));
  const last7Days = paperTrades.filter(t => new Date(t.created_at) > new Date(Date.now() - 7*864e5));
  const last3Days = paperTrades.filter(t => new Date(t.created_at) > new Date(Date.now() - 3*864e5));
  const activeWhales = whales.filter(w => w.is_active);

  const statCard = (label: string, value: string | number, sub?: string, color = "#D4AF37") => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 20, padding: "20px 24px" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const badge = (text: string, color: string) => (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{text}</span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#D4AF37", marginBottom: 8 }}>SQI-2050 ADMIN ONLY</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
          🦈 CLAWBOT Oracle
        </h1>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          On-Chain Polymarket Whale Tracker · Polygon V2 · Runs every 15 min
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          {badge("PAPER MODE", "#22D3EE")}
          {badge(`${activeWhales.length} WHALES TRACKED`, "#D4AF37")}
          {badge("24/7 ACTIVE", "#10B981")}
          {settings && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>
            Last update: {new Date(settings.updated_at).toLocaleTimeString()}
          </span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 4, width: "fit-content" }}>
        {(["dashboard","trades","whales","setup"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
              background: activeTab === tab ? "#D4AF37" : "transparent",
              color: activeTab === tab ? "#050505" : "rgba(255,255,255,0.5)" }}>
            {tab}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "#D4AF37", fontSize: 14 }}>Loading oracle data...</div>}

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && !loading && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            {statCard("Paper Balance", `$${settings?.paper_balance?.toFixed(2) ?? "0.00"}`, "Started at $10.00")}
            {statCard("Open Positions", openTrades.length, `$${totalStaked.toFixed(2)} staked`)}
            {statCard("Trades (7d)", last7Days.length, `${last3Days.length} in last 3 days`)}
            {statCard("CLAWBOT Trades", clawbotTrades.length, "On-chain whale copies")}
            {statCard("Whales Tracked", activeWhales.length, `${whales.length} total discovered`)}
            {statCard("Risk Per Trade", `${((settings?.risk_pct ?? 0.05) * 100).toFixed(0)}%`, "Of current balance")}
          </div>

          {/* How it works */}
          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4AF37", marginBottom: 12 }}>HOW CLAWBOT WORKS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                ["🔍 Scan", "Every 15 min: scan last 450 Polygon blocks (~15 min of trades) on Polymarket V2 Exchange contracts"],
                ["🦈 Detect", "Find trades > $100 USDC from any wallet. Auto-register as new whale if unseen"],
                ["📊 Filter", "Only mirror positions with price 6–94% (entry zones, not exits/resolutions)"],
                ["⚡ Mirror", "Paper-copy top 3 whale trades at 5% of current balance per position"],
                ["📈 Compound", "As balance grows, position sizes grow automatically (5% of running balance)"],
              ].map(([title, desc]) => (
                <div key={title as string}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title as string}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc as string}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent trades preview */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>LATEST WHALE MIRRORS</div>
            {openTrades.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70vw" }}>
                    {t.market_question}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                    {new Date(t.created_at).toLocaleString()} · {t.strategy}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37" }}>${t.amount_usdc.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: "#22D3EE" }}>{t.outcome} @ {(t.entry_price * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRADES TAB */}
      {activeTab === "trades" && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {openTrades.length} open · {closedTrades.length} closed · {paperTrades.length} total paper trades
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Time","Market","Outcome","Entry","Size","Strategy","Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paperTrades.slice(0, 100).map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.35)", fontSize: 10, whiteSpace: "nowrap" }}>
                      {new Date(t.created_at).toLocaleDateString()}<br/>{new Date(t.created_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "8px 12px", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span title={t.market_question} style={{ color: "rgba(255,255,255,0.75)" }}>{t.market_question?.slice(0, 60)}...</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: t.outcome === "Yes" ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{t.outcome}</td>
                    <td style={{ padding: "8px 12px", color: "#D4AF37", fontWeight: 700 }}>{(t.entry_price * 100).toFixed(1)}¢</td>
                    <td style={{ padding: "8px 12px", color: "#fff" }}>${t.amount_usdc.toFixed(3)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 10 }}>
                      <span style={{ background: t.strategy?.includes("clawbot") ? "#D4AF3722" : "#22D3EE22", color: t.strategy?.includes("clawbot") ? "#D4AF37" : "#22D3EE", padding: "2px 8px", borderRadius: 6 }}>
                        {t.strategy?.includes("clawbot") ? "🦈 CLAWBOT" : "📊 VALUE-EV"}
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

      {/* WHALES TAB */}
      {activeTab === "whales" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
            {statCard("Total Whales", whales.length, "Auto-discovered on-chain")}
            {statCard("Active Tracking", activeWhales.length, "Scanned every 15 min")}
            {statCard("Max Trackable", "500+", "No limit — grows each run")}
            {statCard("Avg Whale Trade", "$20k–$56k", "Per position in pUSD")}
          </div>

          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4AF37", marginBottom: 12 }}>WHALE POSITION SIZING ANALYSIS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                  Based on observed trades, whales on Polymarket V2 typically:<br/>
                  • Use <strong style={{color:"#D4AF37"}}>$5k–$100k USDC per trade</strong><br/>
                  • Estimated portfolio: $50k–$500k<br/>
                  • Position size: <strong style={{color:"#D4AF37"}}>~5–15% per trade</strong><br/>
                  • Prefer entry prices: <strong style={{color:"#D4AF37"}}>30¢–75¢</strong><br/>
                  • Markets: Sports, Politics, Crypto
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                  Our mirror strategy:<br/>
                  • <strong style={{color:"#22D3EE"}}>5% of running balance</strong> per trade<br/>
                  • Starting: €10 → $0.50 per position<br/>
                  • After 2x: €20 → $1.00 per position<br/>
                  • Fully compounding<br/>
                  • Same markets as whales, same direction
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Whale Alias","Address","Win Rate","ROI (30d)","Trades Seen","Last Trade","Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.2em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whales.map(w => (
                  <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#D4AF37" }}>{w.alias || "Unknown"}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "monospace" }}>
                      {w.address?.slice(0,10)}...{w.address?.slice(-6)}
                    </td>
                    <td style={{ padding: "8px 12px", color: w.win_rate_30d > 60 ? "#10B981" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                      {w.win_rate_30d > 0 ? `${w.win_rate_30d}%` : "Building..."}
                    </td>
                    <td style={{ padding: "8px 12px", color: w.roi_30d > 0 ? "#10B981" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                      {w.roi_30d > 0 ? `+${w.roi_30d}%` : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)" }}>{w.trades_tracked || w.total_trades_seen || 0}</td>
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

      {/* SETUP TAB */}
      {activeTab === "setup" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Paper vs Real */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#22D3EE", marginBottom: 16 }}>PAPER vs REAL — IDENTICAL EXECUTION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 14, padding: 16 }}>
                <div style={{ color: "#22D3EE", fontWeight: 700, marginBottom: 12 }}>📋 PAPER MODE (Now)</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                  ✓ Real whale detection<br/>
                  ✓ Real market prices<br/>
                  ✓ Real entry timing<br/>
                  ✓ Simulated USDC balance<br/>
                  ✓ Fees calculated identically<br/>
                  ✗ No actual Polymarket account<br/>
                  ✗ No real profit/loss
                </div>
              </div>
              <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, padding: 16 }}>
                <div style={{ color: "#D4AF37", fontWeight: 700, marginBottom: 12 }}>🔴 LIVE MODE (After 7 days)</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                  ✓ Everything from paper mode<br/>
                  ✓ Real USDC trades on Polygon<br/>
                  ✓ Actual Polymarket positions<br/>
                  ✓ Real profit paid out in pUSD<br/>
                  ✓ Auto-compounds gains<br/>
                  ⚠ Requires wallet + pUSD<br/>
                  ⚠ Real risk — start with €10
                </div>
              </div>
            </div>
          </div>

          {/* Wallet setup */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4AF37", marginBottom: 16 }}>WALLET SETUP FOR LIVE TRADING</div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["1. Create a dedicated MetaMask wallet", "Use a fresh wallet — NEVER your main wallet. Bot will hold its private key."],
                ["2. Add Polygon network", "Chain ID: 137 · RPC: polygon-mainnet.g.alchemy.com/v2/az4D7Awbl2E2rNpe6kc3M"],
                ["3. Fund with USDC on Polygon", "Bridge or buy USDC on Polygon via Binance/Coinbase → withdraw to Polygon network"],
                ["4. Create Polymarket account", "Go to polymarket.com → sign in with MetaMask → create deposit wallet (V2)"],
                ["5. Wrap USDC → pUSD", "On Polymarket: deposit USDC → auto-wraps to pUSD (1:1, no fee)"],
                ["6. Add private key to GitHub", "Store as POLYMARKET_PRIVATE_KEY secret in GitHub → CLAWBOT will auto-trade"],
              ].map(([step, desc]) => (
                <div key={step as string} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontWeight: 700, color: "#D4AF37", fontSize: 13, minWidth: 200 }}>{step as string}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{desc as string}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Speed & slippage */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4AF37", marginBottom: 16 }}>EXECUTION SPEED & SLIPPAGE</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
              <strong style={{color:"#fff"}}>Current delay:</strong> ~15 minutes (GitHub Actions cron minimum)<br/>
              <strong style={{color:"#fff"}}>Whale → Our entry gap:</strong> 15 min max — some slippage on fast-moving markets<br/>
              <strong style={{color:"#fff"}}>Ideal speed:</strong> &lt;30 seconds (requires Railway 24/7 WebSocket listener)<br/>
              <strong style={{color:"#fff"}}>Polymarket fees:</strong> Dynamic per market — typically 0.5–2% of position<br/>
              <strong style={{color:"#fff"}}>To reduce delay:</strong> Upgrade Railway account → redeploy polymarket-worker with WebSocket listener<br/>
              <strong style={{color:"#fff"}}>Best entry price:</strong> Whale buys at X → we buy at X+slippage (usually &lt;2% difference on liquid markets)
            </div>
          </div>

          {/* 7-day checklist */}
          <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#10B981", marginBottom: 16 }}>7-DAY PAPER TRADING CHECKLIST</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                "Day 1–3: CLAWBOT scanning & mirroring 3+ whale trades/day",
                "Day 3: At least 10 open paper positions recorded",
                "Day 5: Review which markets resolved — note win/loss",
                "Day 5: Whale win rate data building in database",
                "Day 7: Compare paper P&L vs starting $10",
                "Day 7: If positive P&L → go live with real €10",
                "Live: Set PAPER_MODE=false in GitHub workflow",
                "Live: Add POLYMARKET_PRIVATE_KEY to GitHub secrets",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  <span style={{ color: "#10B981", flexShrink: 0 }}>□</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
