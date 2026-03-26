import React, { useState, useEffect } from "react";

// ─── SQI 2050 DESIGN TOKENS ───────────────────────────────────────────────────
const C = {
  gold: "#D4AF37",
  goldDim: "rgba(212,175,55,0.15)",
  goldGlow: "rgba(212,175,55,0.4)",
  goldBorder: "rgba(212,175,55,0.25)",
  black: "#050505",
  glass: "rgba(255,255,255,0.02)",
  glassBorder: "rgba(255,255,255,0.05)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34,211,238,0.12)",
  red: "#FF4757",
  green: "#2ECC71",
  white60: "rgba(255,255,255,0.6)",
  white30: "rgba(255,255,255,0.3)",
  white10: "rgba(255,255,255,0.07)",
};

// ─── WALLET INTELLIGENCE DATA ─────────────────────────────────────────────────
const WALLETS = [
  {
    id: "0x8dxd",
    label: "Alpha-1 · Temporal Sniper",
    address: "0x8dxd...4f2a",
    pnl: "+$14,820",
    pnlPct: "+38.4%",
    winRate: "73%",
    tradesPerDay: "11",
    avgPositionSize: "$240",
    portfolioSize: "$38,500",
    strategy: "5–15 min markets · momentum entry",
    copyMode: "FIXED",
    fixedAmount: 50,
    slippage: 5,
    status: "LIVE",
    color: C.cyan,
    markets: ["US Election", "BTC Price", "Econ Events"],
    recentTrades: [
      { market: "Will BTC close above 85k?", side: "YES", size: "$240", result: "+$180", time: "4m ago" },
      { market: "Fed rate cut March?", side: "NO", size: "$200", result: "+$140", time: "18m ago" },
      { market: "Trump approval >50%?", side: "YES", size: "$260", result: "-$80", time: "31m ago" },
      { market: "ETH > BTC 30d return?", side: "NO", size: "$220", result: "+$200", time: "47m ago" },
    ],
  },
  {
    id: "0x3raf",
    label: "Alpha-2 · Risk Matrix",
    address: "0x3raf...9c1b",
    pnl: "+$9,340",
    pnlPct: "+22.1%",
    winRate: "68%",
    tradesPerDay: "7",
    avgPositionSize: "$180",
    portfolioSize: "$42,200",
    strategy: "5–15 min markets · risk-managed 1x ratio",
    copyMode: "RISK_RATIO",
    riskRatio: 1.0,
    slippage: 5,
    status: "PAPER",
    color: C.gold,
    markets: ["Sports", "Crypto", "Politics"],
    recentTrades: [
      { market: "Lakers win tonight?", side: "NO", size: "$180", result: "+$130", time: "2m ago" },
      { market: "SOL > $200 this week?", side: "YES", size: "$150", result: "+$110", time: "22m ago" },
      { market: "Ukraine ceasefire April?", side: "NO", size: "$200", result: "+$160", time: "38m ago" },
      { market: "Apple earnings beat?", side: "YES", size: "$170", result: "-$50", time: "55m ago" },
    ],
  },
];

const METRICS = [
  { label: "TOTAL SIGNALS", value: "2,847", sub: "all-time" },
  { label: "WIN RATE", value: "71%", sub: "combined" },
  { label: "TOTAL PnL", value: "+$24,160", sub: "since activation" },
  { label: "ACTIVE MARKETS", value: "14", sub: "monitoring now" },
];

// ─── PULSE ANIMATION COMPONENT ────────────────────────────────────────────────
function PulseDot({ color = C.cyan, size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, animation: "sqiPulse 2s ease-in-out infinite",
      }} />
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.4,
        animation: "sqiPulseRing 2s ease-in-out infinite",
        transform: "scale(2.5)",
      }} />
    </span>
  );
}

// ─── GLASS CARD ───────────────────────────────────────────────────────────────
function GlassCard({ children, style = {}, glow = false }: any) {
  return (
    <div style={{
      background: C.glass,
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      border: `1px solid ${glow ? C.goldBorder : C.glassBorder}`,
      borderRadius: 32,
      boxShadow: glow ? `0 0 40px ${C.goldDim}, inset 0 1px 0 ${C.goldBorder}` : "none",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SovereignSignalOracle() {
  const [activeWallet, setActiveWallet] = useState(0);
  const [mode, setMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [tab, setTab] = useState<"dashboard" | "wallets" | "config" | "activity">("dashboard");
  const [fixedAmount, setFixedAmount] = useState(50);
  const [riskRatio, setRiskRatio] = useState(1.0);
  const [slippage, setSlippage] = useState(5);
  const [copyMode, setCopyMode] = useState<"FIXED" | "PCT" | "RISK_RATIO">("FIXED");
  const [pctAmount, setPctAmount] = useState(5);
  const [live, setLive] = useState(true);
  const [ticker, setTicker] = useState(0);
  const wallet = WALLETS[activeWallet];

  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    root: {
      minHeight: "100vh",
      background: C.black,
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      color: "#fff",
      padding: "0 0 80px",
      position: "relative",
      overflow: "hidden",
    },
    starfield: {
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      background: `radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 60%),
                   radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9) 0%, ${C.black} 100%)`,
    },
    header: {
      position: "relative", zIndex: 10,
      padding: "32px 32px 0",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    logo: {
      display: "flex", alignItems: "center", gap: 12,
    },
    logoIcon: {
      width: 44, height: 44, borderRadius: 14,
      background: `linear-gradient(135deg, ${C.gold} 0%, rgba(212,175,55,0.3) 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, boxShadow: `0 0 20px ${C.goldGlow}`,
    },
    logoText: {
      fontSize: 11, fontWeight: 800, letterSpacing: "0.4em",
      textTransform: "uppercase" as const, color: C.gold,
    },
    logoSub: {
      fontSize: 9, fontWeight: 600, letterSpacing: "0.3em",
      textTransform: "uppercase" as const, color: C.white30, marginTop: 2,
    },
    modeToggle: {
      display: "flex", background: "rgba(255,255,255,0.04)",
      borderRadius: 50, padding: 4, gap: 4, border: `1px solid ${C.glassBorder}`,
    },
    modeBtn: (active: boolean, color: string): React.CSSProperties => ({
      padding: "8px 20px", borderRadius: 50, border: "none", cursor: "pointer",
      fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
      textTransform: "uppercase",
      background: active ? color : "transparent",
      color: active ? (color === C.red ? "#fff" : C.black) : C.white60,
      transition: "all 0.3s ease",
      boxShadow: active ? `0 0 20px ${color}66` : "none",
    }),
    content: { position: "relative", zIndex: 10, padding: "24px 32px" },
    heroTitle: {
      fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em",
      lineHeight: 1, marginBottom: 8,
      background: `linear-gradient(135deg, #fff 40%, ${C.gold} 100%)`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    heroSub: {
      fontSize: 11, fontWeight: 700, letterSpacing: "0.5em",
      textTransform: "uppercase" as const, color: C.gold, marginBottom: 32,
    },
    metricsGrid: {
      display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24,
    },
    metricCard: {
      padding: "20px 24px", borderRadius: 24,
      background: C.glass, border: `1px solid ${C.glassBorder}`,
      backdropFilter: "blur(40px)",
    },
    metricLabel: {
      fontSize: 8, fontWeight: 800, letterSpacing: "0.5em",
      textTransform: "uppercase" as const, color: C.white30, marginBottom: 8,
    },
    metricValue: {
      fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#fff",
    },
    metricSub: {
      fontSize: 9, color: C.white30, marginTop: 4,
    },
    tabs: {
      display: "flex", gap: 4, marginBottom: 24,
      background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 4,
      border: `1px solid ${C.glassBorder}`, width: "fit-content",
    },
    tabBtn: (active: boolean): React.CSSProperties => ({
      padding: "10px 22px", borderRadius: 12, border: "none", cursor: "pointer",
      fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
      textTransform: "uppercase",
      background: active ? C.goldDim : "transparent",
      color: active ? C.gold : C.white30,
      borderBottom: active ? `1px solid ${C.gold}` : "1px solid transparent",
      transition: "all 0.2s",
    }),
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    grid3: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 },
    sectionLabel: {
      fontSize: 8, fontWeight: 800, letterSpacing: "0.5em",
      textTransform: "uppercase" as const, color: C.white30, marginBottom: 16,
    },
    walletCard: (active: boolean, color: string): React.CSSProperties => ({
      padding: "24px", borderRadius: 28, cursor: "pointer",
      background: active ? `rgba(212,175,55,0.06)` : C.glass,
      border: `1px solid ${active ? color + "44" : C.glassBorder}`,
      backdropFilter: "blur(40px)",
      transition: "all 0.3s ease",
      boxShadow: active ? `0 0 30px ${color}22` : "none",
    }),
    walletAddr: {
      fontSize: 9, fontWeight: 700, letterSpacing: "0.3em",
      color: C.white30, fontFamily: "monospace",
    },
    walletName: {
      fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 6, marginBottom: 16,
    },
    statRow: {
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
    },
    statBox: {
      background: C.white10, borderRadius: 12, padding: "10px 12px",
    },
    statLabel: {
      fontSize: 7, fontWeight: 800, letterSpacing: "0.4em",
      textTransform: "uppercase" as const, color: C.white30,
    },
    statVal: {
      fontSize: 14, fontWeight: 900, color: "#fff", marginTop: 4,
    },
    tradeRow: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 16px", borderRadius: 14, marginBottom: 8,
      background: C.white10, border: `1px solid ${C.glassBorder}`,
    },
    pill: (color: string): React.CSSProperties => ({
      padding: "3px 10px", borderRadius: 50, fontSize: 8,
      fontWeight: 800, letterSpacing: "0.3em",
      background: color + "22", color, border: `1px solid ${color}44`,
    }),
    configBlock: {
      padding: "24px", borderRadius: 24,
      background: C.glass, border: `1px solid ${C.glassBorder}`,
      backdropFilter: "blur(40px)", marginBottom: 16,
    },
    configLabel: {
      fontSize: 9, fontWeight: 800, letterSpacing: "0.4em",
      textTransform: "uppercase" as const, color: C.white30, marginBottom: 12,
    },
    slider: {
      width: "100%", accentColor: C.gold, cursor: "pointer",
    },
    copyModeBtn: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: "12px 8px", borderRadius: 14, border: "none",
      cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em",
      textTransform: "uppercase",
      background: active ? C.goldDim : "rgba(255,255,255,0.03)",
      color: active ? C.gold : C.white30,
      border: `1px solid ${active ? C.goldBorder : C.glassBorder}`,
      transition: "all 0.2s",
    }),
    activateBig: {
      width: "100%", padding: "18px", borderRadius: 24, border: "none",
      cursor: "pointer", fontSize: 12, fontWeight: 900, letterSpacing: "0.4em",
      textTransform: "uppercase" as const,
      background: mode === "LIVE"
        ? `linear-gradient(135deg, ${C.red} 0%, #ff6b6b 100%)`
        : `linear-gradient(135deg, ${C.gold} 0%, #f0c040 100%)`,
      color: mode === "LIVE" ? "#fff" : C.black,
      boxShadow: mode === "LIVE" ? `0 0 40px ${C.red}66` : `0 0 40px ${C.goldGlow}`,
      transition: "all 0.3s",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes sqiPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes sqiPulseRing { 0%,100%{opacity:0.3;transform:scale(2)} 50%{opacity:0;transform:scale(3.5)} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes goldBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.goldBorder}; border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px;
          background: ${C.glassBorder}; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: ${C.gold}; cursor: pointer;
          box-shadow: 0 0 10px ${C.goldGlow}; }
      `}</style>

      <div style={styles.root}>
        <div style={styles.starfield} />

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>⟁</div>
            <div>
              <div style={styles.logoText}>Sovereign Signal Oracle</div>
              <div style={styles.logoSub}>SQI · Prediction Market Intelligence · 2050</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PulseDot color={live ? C.green : C.white30} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: live ? C.green : C.white30 }}>
                {live ? "SCANNING LIVE" : "OFFLINE"}
              </span>
            </div>
            <div style={styles.modeToggle}>
              <button style={styles.modeBtn(mode === "PAPER", C.cyan)} onClick={() => setMode("PAPER")}>
                Paper
              </button>
              <button style={styles.modeBtn(mode === "LIVE", C.red)} onClick={() => setMode("LIVE")}>
                ⚡ Live
              </button>
            </div>
          </div>
        </div>

        {/* LIVE WARNING BANNER */}
        {mode === "LIVE" && (
          <div style={{
            margin: "16px 32px 0", padding: "12px 20px", borderRadius: 14,
            background: "rgba(255,71,87,0.1)", border: `1px solid ${C.red}44`,
            display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 10,
          }}>
            <PulseDot color={C.red} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: C.red }}>
              LIVE MODE ACTIVE — SIGNALS WILL EXECUTE ON-CHAIN · CONFIRM ALL POSITIONS BEFORE ENABLING
            </span>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={styles.content}>

          {/* HERO */}
          <div style={{ marginBottom: 32 }}>
            <div style={styles.heroTitle}>Signal Oracle</div>
            <div style={styles.heroSub}>Prema-Pulse · Wallet Intelligence · Akasha-Neural Archive</div>
          </div>

          {/* METRICS */}
          <div style={styles.metricsGrid}>
            {METRICS.map((m, i) => (
              <div key={i} style={styles.metricCard}>
                <div style={styles.metricLabel}>{m.label}</div>
                <div style={{ ...styles.metricValue, color: i === 2 ? C.green : "#fff" }}>{m.value}</div>
                <div style={styles.metricSub}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={styles.tabs}>
            {(["dashboard", "wallets", "config", "activity"] as const).map(t => (
              <button key={t} style={styles.tabBtn(tab === t)} onClick={() => setTab(t)}>
                {t === "dashboard" ? "⬡ Dashboard" : t === "wallets" ? "◈ Wallets" : t === "config" ? "⚙ Config" : "⏱ Activity"}
              </button>
            ))}
          </div>

          {/* ─── DASHBOARD TAB ─── */}
          {tab === "dashboard" && (
            <div style={styles.grid3}>
              {/* LEFT: Wallet Cards */}
              <div>
                <div style={styles.sectionLabel}>Alpha Wallets · Bhakti-Algorithm Tracked</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {WALLETS.map((w, i) => (
                    <div key={i} style={styles.walletCard(i === activeWallet, w.color)} onClick={() => setActiveWallet(i)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={styles.walletAddr}>{w.address}</div>
                          <div style={styles.walletName}>{w.label}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <span style={styles.pill(w.status === "LIVE" ? C.red : C.cyan)}>
                            {w.status === "LIVE" ? "⚡ LIVE" : "◎ PAPER"}
                          </span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: C.green }}>{w.pnl}</span>
                          <span style={{ fontSize: 9, color: C.green }}>{w.pnlPct}</span>
                        </div>
                      </div>
                      <div style={styles.statRow}>
                        <div style={styles.statBox}>
                          <div style={styles.statLabel}>Win Rate</div>
                          <div style={{ ...styles.statVal, color: C.gold }}>{w.winRate}</div>
                        </div>
                        <div style={styles.statBox}>
                          <div style={styles.statLabel}>Trades/Day</div>
                          <div style={styles.statVal}>{w.tradesPerDay}</div>
                        </div>
                        <div style={styles.statBox}>
                          <div style={styles.statLabel}>Avg Size</div>
                          <div style={styles.statVal}>{w.avgPositionSize}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 9, color: C.white30, lineHeight: 1.6 }}>
                        {w.strategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Live Signal Feed */}
              <div>
                <div style={styles.sectionLabel}>Live Signal Feed · {wallet.label}</div>
                <GlassCard style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <PulseDot color={wallet.color} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: wallet.color }}>
                      MONITORING ACTIVE
                    </span>
                  </div>
                  {wallet.recentTrades.map((t, i) => (
                    <div key={i} style={styles.tradeRow}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", marginBottom: 4, maxWidth: 160 }}>{t.market}</div>
                        <div style={{ fontSize: 8, color: C.white30 }}>{t.time}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={styles.pill(t.side === "YES" ? C.cyan : C.gold)}>{t.side}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: t.result.startsWith("+") ? C.green : C.red }}>
                          {t.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </GlassCard>

                {/* Copy Config Summary */}
                <GlassCard style={{ padding: 20, marginTop: 16 }} glow>
                  <div style={styles.sectionLabel}>Signal Copy Config</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Copy Mode</div>
                      <div style={{ ...styles.statVal, color: C.gold, fontSize: 11 }}>{copyMode}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Amount</div>
                      <div style={{ ...styles.statVal, fontSize: 11 }}>
                        {copyMode === "FIXED" ? `$${fixedAmount}` : copyMode === "PCT" ? `${pctAmount}%` : `${riskRatio}x`}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Slippage</div>
                      <div style={{ ...styles.statVal, color: C.cyan, fontSize: 11 }}>{slippage}%</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Mode</div>
                      <div style={{ ...styles.statVal, color: mode === "LIVE" ? C.red : C.cyan, fontSize: 11 }}>{mode}</div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* ─── WALLETS TAB ─── */}
          {tab === "wallets" && (
            <div style={styles.grid2}>
              {WALLETS.map((w, i) => (
                <GlassCard key={i} style={{ padding: 28 }} glow={i === activeWallet}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                      <div style={styles.walletAddr}>{w.address}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 6 }}>{w.label}</div>
                    </div>
                    <span style={styles.pill(w.color)}>{w.copyMode}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[
                      ["PnL", w.pnl, C.green],
                      ["PnL %", w.pnlPct, C.green],
                      ["Win Rate", w.winRate, C.gold],
                      ["Trades/Day", w.tradesPerDay, "#fff"],
                      ["Avg Position", w.avgPositionSize, "#fff"],
                      ["Portfolio", w.portfolioSize, C.cyan],
                    ].map(([label, val, color], j) => (
                      <div key={j} style={styles.statBox}>
                        <div style={styles.statLabel}>{label as string}</div>
                        <div style={{ ...styles.statVal, color: color as string }}>{val as string}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: C.white30, lineHeight: 1.8, marginBottom: 16 }}>
                    <strong style={{ color: C.white60 }}>Strategy: </strong>{w.strategy}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={styles.configLabel}>Markets Tracked</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {w.markets.map((m, j) => (
                        <span key={j} style={styles.pill(w.color)}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveWallet(i)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 16, border: "none",
                      cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.3em",
                      background: i === activeWallet ? C.goldDim : C.white10,
                      color: i === activeWallet ? C.gold : C.white60,
                      border: `1px solid ${i === activeWallet ? C.goldBorder : C.glassBorder}`,
                    }}
                  >
                    {i === activeWallet ? "✓ ACTIVE SIGNAL SOURCE" : "SET AS SIGNAL SOURCE"}
                  </button>
                </GlassCard>
              ))}
            </div>
          )}

          {/* ─── CONFIG TAB ─── */}
          {tab === "config" && (
            <div style={styles.grid2}>
              <div>
                {/* Copy Mode */}
                <GlassCard style={{ padding: 24, marginBottom: 16 }}>
                  <div style={styles.configLabel}>Copy Mode · Vedic Signal Allocation</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["FIXED", "PCT", "RISK_RATIO"] as const).map(m => (
                      <button key={m} style={styles.copyModeBtn(copyMode === m)} onClick={() => setCopyMode(m)}>
                        {m === "FIXED" ? "Fixed $" : m === "PCT" ? "% Portfolio" : "Risk Ratio"}
                      </button>
                    ))}
                  </div>
                </GlassCard>

                {/* Amount Config */}
                <GlassCard style={{ padding: 24, marginBottom: 16 }}>
                  <div style={styles.configLabel}>
                    {copyMode === "FIXED" ? "Fixed Amount Per Signal" : copyMode === "PCT" ? "% of Portfolio" : "Risk Ratio"}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.gold, marginBottom: 16, textShadow: `0 0 20px ${C.goldGlow}` }}>
                    {copyMode === "FIXED" ? `$${fixedAmount}` : copyMode === "PCT" ? `${pctAmount}%` : `${riskRatio}x`}
                  </div>
                  <input
                    type="range"
                    style={styles.slider}
                    min={copyMode === "FIXED" ? 10 : copyMode === "PCT" ? 1 : 0.5}
                    max={copyMode === "FIXED" ? 500 : copyMode === "PCT" ? 25 : 5}
                    step={copyMode === "FIXED" ? 10 : copyMode === "PCT" ? 0.5 : 0.25}
                    value={copyMode === "FIXED" ? fixedAmount : copyMode === "PCT" ? pctAmount : riskRatio}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (copyMode === "FIXED") setFixedAmount(v);
                      else if (copyMode === "PCT") setPctAmount(v);
                      else setRiskRatio(v);
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: C.white30, marginTop: 8 }}>
                    <span>{copyMode === "FIXED" ? "$10" : copyMode === "PCT" ? "1%" : "0.5x"}</span>
                    <span>{copyMode === "FIXED" ? "$500" : copyMode === "PCT" ? "25%" : "5x"}</span>
                  </div>
                </GlassCard>

                {/* Slippage */}
                <GlassCard style={{ padding: 24, marginBottom: 16 }}>
                  <div style={styles.configLabel}>Slippage Tolerance · Nadi Scanner</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.cyan, marginBottom: 16 }}>{slippage}%</div>
                  <input type="range" style={styles.slider} min={1} max={15} step={0.5} value={slippage} onChange={e => setSlippage(parseFloat(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: C.white30, marginTop: 8 }}>
                    <span>1% · Tight</span>
                    <span>5% · Recommended</span>
                    <span>15% · Wide</span>
                  </div>
                  {slippage > 8 && (
                    <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,71,87,0.1)", border: `1px solid ${C.red}33`, fontSize: 9, color: C.red }}>
                      ⚠ High slippage may lead to unfavorable fills
                    </div>
                  )}
                </GlassCard>

                {/* Recommended Config Note */}
                <GlassCard style={{ padding: 20 }}>
                  <div style={styles.configLabel}>Akasha-Archive Recommendation</div>
                  <div style={{ fontSize: 9, color: C.white60, lineHeight: 1.8 }}>
                    <div style={{ color: C.gold, fontWeight: 800, marginBottom: 6 }}>Alpha-1 Wallet</div>
                    Fixed $50 · 5% Slippage · Paper mode first<br />
                    <div style={{ color: C.gold, fontWeight: 800, margin: "10px 0 6px" }}>Alpha-2 Wallet</div>
                    Risk Ratio 1.0x · 5% Slippage · Paper mode first
                  </div>
                </GlassCard>
              </div>

              <div>
                {/* Activate Button */}
                <GlassCard style={{ padding: 24, marginBottom: 16 }} glow>
                  <div style={styles.configLabel}>Signal Activation · {mode} Mode</div>
                  <div style={{ marginBottom: 20, fontSize: 9, color: C.white30, lineHeight: 1.8 }}>
                    Source: <span style={{ color: C.gold }}>{wallet.label}</span><br />
                    Mode: <span style={{ color: mode === "LIVE" ? C.red : C.cyan }}>{mode}</span><br />
                    Copy: <span style={{ color: "#fff" }}>
                      {copyMode === "FIXED" ? `$${fixedAmount} fixed` : copyMode === "PCT" ? `${pctAmount}% of portfolio` : `${riskRatio}x risk ratio`}
                    </span><br />
                    Slippage: <span style={{ color: C.cyan }}>{slippage}%</span>
                  </div>
                  <button style={styles.activateBig}>
                    {mode === "PAPER" ? "◎ Activate Paper Signal" : "⚡ Activate Live Signal"}
                  </button>
                  {mode === "LIVE" && (
                    <div style={{ marginTop: 12, fontSize: 8, color: C.red, textAlign: "center" as const, lineHeight: 1.6 }}>
                      Live mode connects to on-chain execution.<br />Connect your wallet to proceed.
                    </div>
                  )}
                </GlassCard>

                {/* Wallet Connection */}
                <GlassCard style={{ padding: 24 }}>
                  <div style={styles.configLabel}>Wallet Connection</div>
                  <button style={{
                    width: "100%", padding: "14px", borderRadius: 16, border: `1px solid ${C.goldBorder}`,
                    cursor: "pointer", fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
                    background: C.goldDim, color: C.gold,
                  }}>
                    Connect Wallet
                  </button>
                  <div style={{ marginTop: 12, fontSize: 8, color: C.white30, textAlign: "center" as const }}>
                    Supports MetaMask · WalletConnect · Coinbase Wallet
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* ─── ACTIVITY TAB ─── */}
          {tab === "activity" && (
            <div>
              <div style={styles.sectionLabel}>Full Signal History · Both Alpha Wallets</div>
              {WALLETS.flatMap(w => w.recentTrades.map(t => ({ ...t, wallet: w.label, color: w.color }))).map((t, i) => (
                <div key={i} style={{ ...styles.tradeRow, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={styles.pill(t.color)}>{t.wallet.split("·")[0].trim()}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{t.market}</div>
                      <div style={{ fontSize: 8, color: C.white30, marginTop: 3 }}>{t.time}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={styles.pill(t.side === "YES" ? C.cyan : C.gold)}>{t.side}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.white30 }}>{t.size}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: t.result.startsWith("+") ? C.green : C.red, minWidth: 60, textAlign: "right" as const }}>
                      {t.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
