import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const ADMIN = "bd0b21c9-577a-450b-bb1e-21c9d0423f17";
const SB = "https://fjdzhrdpioxdeyyfogep.supabase.co";
const KEY = "sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F";

export default function PolymarketOracle() {
  const { user, isLoading } = useAuth();
  const [data, setData] = useState({ trades: [], whales: [], balance: "10.00" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading || !user || user.id !== ADMIN) return;
    Promise.all([
      fetch(`${SB}/rest/v1/polymarket_trades?order=created_at.desc&limit=100`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()).catch(() => []),
      fetch(`${SB}/rest/v1/polymarket_whales?order=roi_30d.desc`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()).catch(() => []),
      fetch(`${SB}/rest/v1/polymarket_bot_settings?limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()).catch(() => []),
    ]).then(([trades, whales, settings]) => {
      setData({ trades: Array.isArray(trades) ? trades : [], whales: Array.isArray(whales) ? whales : [], balance: settings?.[0]?.paper_balance ?? "10.00" });
      setReady(true);
    });
  }, [user, isLoading]);

  if (isLoading) return <div style={{ background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37" }}>Loading...</div>;
  if (!user || user.id !== ADMIN) return <Navigate to="/" replace />;

  const paper = (data.trades as any[]).filter((t: any) => t.is_paper);
  const open = paper.filter((t: any) => t.status === "open");
  const clawbot = paper.filter((t: any) => String(t.strategy).includes("clawbot"));
  const whales = data.whales as any[];

  return (
    <div style={{ background: "#050505", minHeight: "100vh", color: "#fff", padding: "32px 24px", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "#D4AF37", letterSpacing: "0.3em", marginBottom: 4 }}>ADMIN · SQI-2050</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>🦈 CLAWBOT Oracle</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>Polymarket Whale Tracker · Polygon V2 · Runs every 15 min via GitHub Actions</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            ["Paper Balance", `$${Number(data.balance).toFixed(2)}`, "#D4AF37"],
            ["Open Positions", String(open.length), "#D4AF37"],
            ["Whale Mirrors", String(clawbot.length), "#A78BFA"],
            ["Whales Tracked", String(whales.filter((w: any) => w.is_active).length), "#22D3EE"],
            ["Total Trades", String(paper.length), "#D4AF37"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", marginBottom: 8 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {!ready && <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>⟳ Loading data from Supabase...</div>}

        {ready && (
          <>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3em", marginBottom: 14 }}>LATEST WHALE MIRRORS</div>
              {open.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No open positions — next scan within 15 min</div>}
              {open.slice(0, 8).map((t: any) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(t.market_question ?? "").slice(0, 80)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#D4AF37", fontWeight: 700 }}>${Number(t.amount_usdc).toFixed(3)}</div>
                    <div style={{ fontSize: 10, color: t.outcome === "Yes" ? "#10B981" : "#F59E0B" }}>{t.outcome} @ {(Number(t.entry_price) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3em", marginBottom: 14 }}>WHALE WALLETS ({whales.length})</div>
              {whales.slice(0, 15).map((w: any) => (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <div style={{ color: "#D4AF37", fontWeight: 700, minWidth: 120 }}>{w.alias}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 10, flex: 1 }}>{String(w.address ?? "").slice(0, 14)}...</div>
                  <div style={{ color: w.win_rate_30d > 60 ? "#10B981" : "rgba(255,255,255,0.3)", minWidth: 80 }}>{w.win_rate_30d > 0 ? `${w.win_rate_30d}% WR` : "Building..."}</div>
                  <div style={{ color: w.is_active ? "#10B981" : "#6B7280", fontSize: 10 }}>{w.is_active ? "● Active" : "○ Paused"}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
