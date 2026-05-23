import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const ADMIN_UUID = "bd0b21c9-577a-450b-bb1e-21c9d0423f17";

interface Trade {
  id: string; market_question: string; outcome: string;
  entry_price: number; amount_usdc: number; strategy: string;
  status: string; is_paper: boolean; created_at: string;
}
interface Whale {
  id: string; address: string; alias: string;
  win_rate_30d: number; roi_30d: number; trades_tracked: number;
  total_trades_seen: number; is_active: boolean; last_checked: string;
}
interface Settings {
  id: string; paper_balance: number; risk_pct: number; updated_at: string;
}

export default function PolymarketOracle() {
  const { user, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [whales, setWhales] = useState<Whale[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard"|"trades"|"whales"|"setup">("dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.id !== ADMIN_UUID) return;
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [user, authLoading]);

  async function fetchData() {
    const [t, w, s] = await Promise.all([
      (supabase as any).from("polymarket_trades").select("*").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("polymarket_whales").select("*").order("roi_30d", { ascending: false }),
      (supabase as any).from("polymarket_bot_settings").select("*").limit(1).single(),
    ]);
    if (t.data) setTrades(t.data);
    if (w.data) setWhales(w.data);
    if (s.data) setSettings(s.data);
    setLoading(false);
  }

  // Wait for auth to load — never redirect while still loading
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#D4AF37", fontSize: 14, letterSpacing: "0.2em" }}>⟳ Loading...</div>
      </div>
    );
  }

  // Only redirect once auth is confirmed loaded and user is not admin
  if (!user || user.id !== ADMIN_UUID) return <Navigate to="/" replace />;

  const G = "#D4AF37", C = "#22D3EE";
  const paper   = trades.filter(t => t.is_paper);
  const open    = paper.filter(t => t.status === "open");
  const clawbot = paper.filter(t => t.strategy?.includes("clawbot"));
  const d7      = paper.filter(t => new Date(t.created_at) > new Date(Date.now() - 7*864e5));
  const d3      = paper.filter(t => new Date(t.created_at) > new Date(Date.now() - 3*864e5));
  const active  = whales.filter(w => w.is_active);
  const staked  = open.reduce((s, t) => s + Number(t.amount_usdc), 0);

  const Card = ({ label, val, sub, col = G }: { label: string; val: string|number; sub?: string; col?: string }) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${col}25`, borderRadius: 18, padding: "18px 22px" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: col, letterSpacing: "-0.03em" }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );

  const Badge = ({ t: text, c }: { t: string; c: string }) => (
    <span style={{ background: c+"20", color: c, border: `1px solid ${c}40`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{text}</span>
  );

  const Tab = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, background: tab === id ? G : "transparent", color: tab === id ? "#050505" : "rgba(255,255,255,0.4)" }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "28px 20px", maxWidth: 1100, margin: "0 auto" }}>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.4em", color: G, marginBottom: 4 }}>SQI-2050 · ADMIN ONLY</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>🦈 CLAWBOT Oracle</h1>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>On-Chain Polymarket Whale Tracker · Polygon V2 · Every 15 min</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <Badge t="PAPER MODE" c={C} />
          <Badge t={`${active.length} WHALES`} c={G} />
          <Badge t="24/7 ACTIVE" c="#10B981" />
          <Badge t={`${clawbot.length} MIRRORS`} c="#A78BFA" />
          {settings && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Updated {new Date(settings.updated_at).toLocaleTimeString()}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        <Tab id="dashboard" label="Dashboard" />
        <Tab id="trades" label={`Trades (${paper.length})`} />
        <Tab id="whales" label={`Whales (${whales.length})`} />
        <Tab id="setup" label="Go Live" />
      </div>

      {loading && <div style={{ color: G, padding: 40, textAlign: "center" as const }}>⟳ Fetching oracle data...</div>}

      {/* DASHBOARD */}
      {!loading && tab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
            <Card label="Paper Balance" val={`$${Number(settings?.paper_balance??0).toFixed(2)}`} sub="Started $10.00" />
            <Card label="Open Positions" val={open.length} sub={`$${staked.toFixed(2)} staked`} />
            <Card label="7-Day Trades" val={d7.length} sub={`${d3.length} in last 3d`} />
            <Card label="Whale Mirrors" val={clawbot.length} sub="On-chain copies" col="#A78BFA" />
            <Card label="Whales Found" val={active.length} sub={`${whales.length} total`} col={C} />
            <Card label="Risk / Trade" val={`${((settings?.risk_pct??0.05)*100).toFixed(0)}%`} sub="Compounds auto" />
          </div>

          <div style={{ background: `${G}09`, border: `1px solid ${G}25`, borderRadius: 18, padding: 20, marginBottom: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: G, marginBottom: 12 }}>HOW CLAWBOT WORKS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
              {[["🔍 Scan","450 Polygon blocks every 15 min — full V2 exchange coverage"],["🦈 Detect","All trades >$100 on Polymarket. Auto-adds new wallets."],["📊 Filter","Entry zone 6–94% only. Skip exits & resolved markets."],["⚡ Mirror","Top 3 whale trades copied at 5% of balance."],["📈 Compound","Position sizes grow as balance grows. Automatic."]].map(([t,d])=>(
                <div key={t}><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{d}</div></div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>LATEST WHALE MIRRORS</div>
            {open.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No open positions yet — next scan runs within 15 min automatically</div>}
            {open.slice(0,8).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {t.market_question?.replace(/\[.*?\]/g,"").trim()}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G }}>${Number(t.amount_usdc).toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: t.outcome==="Yes"?"#10B981":"#F59E0B" }}>{t.outcome} @ {(Number(t.entry_price)*100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRADES */}
      {!loading && tab === "trades" && (
        <div style={{ overflowX: "auto" as const }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Time","Market","Outcome","Entry","Size","Type","Status"].map(h=>(
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left" as const, color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.2em", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paper.slice(0,100).map(t=>(
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "7px 10px", color: "rgba(255,255,255,0.25)", fontSize: 10, whiteSpace: "nowrap" as const }}>{new Date(t.created_at).toLocaleDateString()}<br/>{new Date(t.created_at).toLocaleTimeString()}</td>
                  <td style={{ padding: "7px 10px", maxWidth: 260 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, color: "rgba(255,255,255,0.7)" }} title={t.market_question}>{t.market_question?.replace(/\[.*?\]/g,"").trim().slice(0,55)}...</div></td>
                  <td style={{ padding: "7px 10px", fontWeight: 700, color: t.outcome==="Yes"?"#10B981":"#F59E0B" }}>{t.outcome}</td>
                  <td style={{ padding: "7px 10px", color: G, fontWeight: 700 }}>{(Number(t.entry_price)*100).toFixed(1)}¢</td>
                  <td style={{ padding: "7px 10px" }}>${Number(t.amount_usdc).toFixed(3)}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: t.strategy?.includes("clawbot")?G+"22":C+"22", color: t.strategy?.includes("clawbot")?G:C, padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>
                      {t.strategy?.includes("clawbot")?"🦈 WHALE":"📊 EV"}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 10, color: t.status==="open"?"#10B981":"#6B7280" }}>● {t.status?.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WHALES */}
      {!loading && tab === "whales" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            <Card label="Tracking" val={whales.length} sub="Auto-discovered" />
            <Card label="Active" val={active.length} sub="Every 15 min" />
            <Card label="Avg Trade" val="$20k–$400k" sub="Per whale position" col="#A78BFA" />
            <Card label="Our Mirror" val="5% balance" sub="Fully compounds" col="#10B981" />
          </div>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Alias","Wallet","Win Rate","ROI 30d","Trades Seen","Last Active","Active"].map(h=>(
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left" as const, color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.15em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whales.map(w=>(
                  <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: G }}>{w.alias}</td>
                    <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}>{w.address?.slice(0,10)}...{w.address?.slice(-6)}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: w.win_rate_30d>60?"#10B981":"rgba(255,255,255,0.35)" }}>{w.win_rate_30d>0?`${w.win_rate_30d}%`:"Building..."}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: w.roi_30d>0?"#10B981":"rgba(255,255,255,0.35)" }}>{w.roi_30d>0?`+${w.roi_30d}%`:"—"}</td>
                    <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.5)" }}>{w.total_trades_seen||w.trades_tracked||0}</td>
                    <td style={{ padding: "8px 10px", color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{w.last_checked?new Date(w.last_checked).toLocaleDateString():"—"}</td>
                    <td style={{ padding: "8px 10px", fontSize: 10, color: w.is_active?"#10B981":"#6B7280" }}>{w.is_active?"● YES":"○ NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GO LIVE */}
      {!loading && tab === "setup" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: C+"10", border: `1px solid ${C}30`, borderRadius: 18, padding: 18 }}>
              <div style={{ color: C, fontWeight: 700, marginBottom: 10 }}>📋 PAPER MODE (Now)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.9 }}>✓ Real whale detection<br/>✓ Real Polymarket prices<br/>✓ Fees calculated identically<br/>✓ Full compounding simulation<br/>✗ No actual profit/loss</div>
            </div>
            <div style={{ background: G+"10", border: `1px solid ${G}30`, borderRadius: 18, padding: 18 }}>
              <div style={{ color: G, fontWeight: 700, marginBottom: 10 }}>🔴 LIVE MODE (After 7 days)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.9 }}>✓ Real USDC trades on Polygon<br/>✓ Real Polymarket V2 positions<br/>✓ Profit withdrawable as USDC<br/>✓ Auto-compounds every run<br/>⚠ Start with €10 — real risk</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: G, marginBottom: 14 }}>WALLET SETUP — 6 STEPS TO GO LIVE</div>
            {[["1. New MetaMask wallet","Create a FRESH wallet for this bot only. Never use your main wallet."],["2. Add Polygon network","Chain ID: 137 · RPC: polygon-mainnet.g.alchemy.com/v2/az4D7Awbl2E2rNpe6kc3M"],["3. Fund with USDC on Polygon","Binance/Coinbase → withdraw USDC to Polygon network. Add ~€12 to cover gas."],["4. Polymarket account","polymarket.com → connect MetaMask → Deposit → V2 deposit wallet auto-created"],["5. Wrap USDC → pUSD","Polymarket auto-wraps on deposit. 1:1, zero fee. pUSD = trading collateral."],["6. Add private key to GitHub","github.com/sacredhealing/sacredhealing-fa5d6004 → Settings → Secrets → POLYMARKET_PRIVATE_KEY"]].map(([s,d])=>(
              <div key={s} style={{ display: "flex", gap: 14, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontWeight: 700, color: G, fontSize: 12, minWidth: 170, flexShrink: 0 }}>{s}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#10B98110", border: "1px solid #10B98130", borderRadius: 18, padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "#10B981", marginBottom: 12 }}>7-DAY PAPER CHECKLIST BEFORE GOING LIVE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["Day 1–2: Bot mirrors 3+ whale trades daily","Day 3: 10+ open paper positions in Supabase","Day 4: Check which markets resolved — W/L","Day 5: Whale win rate data auto-building","Day 6: Review paper P&L vs $10 start","Day 7: If neutral/positive → fund real wallet","Go Live: Set PAPER_MODE=false in GitHub","Go Live: Add POLYMARKET_PRIVATE_KEY secret"].map((item,i)=>(
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.45)", padding: "5px 0" }}>
                  <span style={{ color: "#10B981", flexShrink: 0 }}>☐</span>{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
