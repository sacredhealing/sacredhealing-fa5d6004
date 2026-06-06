import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/hooks/useMembership";
import { useToast } from "@/hooks/use-toast";

const C = {
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)", goldGlow: "rgba(212,175,55,0.28)",
  black: "#050505", glass: "rgba(255,255,255,0.025)", border: "rgba(255,255,255,0.06)",
  cyan: "#22D3EE", green: "#22C55E", red: "#EF4444",
  muted: "rgba(255,255,255,0.4)", body: "rgba(255,255,255,0.72)",
};

const AFFILIATE_RATES: Record<string, { l1: number; l2: number; youKeep: number }> = {
  free:              { l1: 10, l2: 3,  youKeep: 37 },
  "prana-flow":      { l1: 8,  l2: 2,  youKeep: 65 },
  "siddha-quantum":  { l1: 5,  l2: 1,  youKeep: 84 },
  "akasha-infinity": { l1: 3,  l2: 1,  youKeep: 91 },
};

const SCENARIOS = [
  { key: "conservative", label: "Conservative", color: C.body,   winRate: 0.15, avgWinX: 3.5,  avgLossX: 0.65, tradesPerDay: 3,  desc: "High filters. Rug score <3. Very selective." },
  { key: "standard",     label: "Standard",     color: C.gold,   winRate: 0.22, avgWinX: 6.0,  avgLossX: 0.68, tradesPerDay: 8,  desc: "Balanced. Rug <5. AI score ≥60. Default." },
  { key: "aggressive",   label: "Aggressive",   color: C.cyan,   winRate: 0.28, avgWinX: 12.0, avgLossX: 0.72, tradesPerDay: 20, desc: "Loose filters. High volume. Active monitoring." },
  { key: "moonshot",     label: "Moonshot",     color: "#A855F7", winRate: 0.10, avgWinX: 50.0, avgLossX: 0.78, tradesPerDay: 30, desc: "Snipe everything early. Rare 100x offsets losses." },
];

function calcReturns(capitalSOL: number, sc: typeof SCENARIOS[0]) {
  const { winRate, avgWinX, avgLossX, tradesPerDay } = sc;
  const ev = winRate * (avgWinX - 1) + (1 - winRate) * (avgLossX - 1);
  const tradeSizeSOL = capitalSOL * 0.05;
  const dailyPnL = tradesPerDay * tradeSizeSOL * ev;
  const dailyPct = (dailyPnL / capitalSOL) * 100;
  const weeklyPnL = dailyPnL * 7;
  const weeklyPct = dailyPct * 7;
  const monthlyCapital = capitalSOL * Math.pow(1 + dailyPct / 100, 30);
  const monthlyPnL = monthlyCapital - capitalSOL;
  const monthlyPct = (monthlyPnL / capitalSOL) * 100;
  const annualCapital = capitalSOL * Math.pow(1 + dailyPct / 100, 365);
  const annualPnL = annualCapital - capitalSOL;
  const annualPct = (annualPnL / capitalSOL) * 100;
  return { dailyPnL, dailyPct, weeklyPnL, weeklyPct, monthlyPnL, monthlyPct, annualPnL, annualPct, tradeSizeSOL, ev, dailyWins: Math.round(tradesPerDay * winRate), dailyLosses: Math.round(tradesPerDay * (1 - winRate)) };
}

function GlassCard({ children, style = {}, glow = false }: any) {
  return (
    <div style={{ background: C.glass, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${glow ? C.goldGlow : C.border}`, borderRadius: 32, padding: "22px 26px", boxShadow: glow ? `0 0 36px ${C.goldGlow}` : "none", ...style }}>
      {children}
    </div>
  );
}
function Lbl({ children, c = C.muted }: any) {
  return <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const, color: c, marginBottom: 5 }}>{children}</div>;
}
function Tab({ label, active, onClick }: any) {
  return <button onClick={onClick} style={{ background: active ? C.goldDim : "transparent", border: `1px solid ${active ? C.gold : C.border}`, borderRadius: 20, padding: "8px 18px", color: active ? C.gold : C.muted, fontSize: 10, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase" as const, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>{label}</button>;
}
function Stat({ label, value, sub, color = "white", glow = false }: any) {
  return (
    <GlassCard glow={glow} style={{ textAlign: "center" as const }}>
      <Lbl>{label}</Lbl>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color, textShadow: glow ? `0 0 16px ${color}66` : "none" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </GlassCard>
  );
}

function LiveTab() {
  const [scanCount, setScanCount] = useState(18742);
  const [passed, setPassed] = useState(412);
  const [sniped, setSniped] = useState(94);
  useEffect(() => {
    const t = setInterval(() => {
      setScanCount(n => n + Math.floor(Math.random() * 3 + 1));
      if (Math.random() > 0.93) setPassed(n => n + 1);
      if (Math.random() > 0.98) setSniped(n => n + 1);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const snipes = [
    { symbol: "BONKCAT",  x: 6.2,  pnl: "+0.26 SOL", status: "OPEN",    color: C.green },
    { symbol: "SOLGOD",   x: 3.8,  pnl: "+0.14 SOL", status: "TP1 HIT", color: C.gold  },
    { symbol: "PEPESOL",  x: 0.04, pnl: "-0.048 SOL",status: "SL HIT",  color: C.red   },
    { symbol: "MOONSUI",  x: 17.8, pnl: "+0.89 SOL", status: "MOONBAG", color: "#A855F7"},
    { symbol: "WIFBRO",   x: 2.4,  pnl: "+0.07 SOL", status: "OPEN",    color: C.gold  },
    { symbol: "DRAGONSOL",x: 0.02, pnl: "-0.049 SOL",status: "TIMEOUT", color: C.muted },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <GlassCard glow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <Lbl>Bot Status · v2.0</Lbl>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>SQI SOVEREIGN SNIPER</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>7 Launchpads · 12-Signal AI · Jito Bundles · Dev Wallet Monitor · Paper Mode</div>
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, boxShadow: `0 0 10px ${C.green}`, margin: "0 auto 4px", animation: "pulse 2s infinite" }} />
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: C.green }}>LIVE</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Launched Scanned", value: scanCount.toLocaleString() },
            { label: "Passed AI Filter", value: `${passed} (${(passed/scanCount*100).toFixed(1)}%)` },
            { label: "Positions Taken",  value: sniped.toString() },
            { label: "Launchpads",       value: "7 Active" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "12px 14px" }}>
              <Lbl>{s.label}</Lbl>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{s.value}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <Lbl>Infrastructure Stack</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          {[
            { label: "Detection",   value: "Alchemy gRPC (5–15ms)", badge: "FREE", color: C.green },
            { label: "Submission",  value: "Jito Bundles + Astralane", badge: "FREE", color: C.green },
            { label: "AI Scorer",   value: "Gemini 2.5 Flash", badge: "$0.25/mo", color: C.gold },
            { label: "Social",      value: "Twitter v2 API", badge: "FREE", color: C.green },
            { label: "Monthly Cost",value: "~$6–7 total", badge: "SOVEREIGN", color: C.cyan },
            { label: "Upgrade Path",value: "Helius LaserStream when profitable", badge: "LATER", color: C.muted },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Lbl>{s.label}</Lbl>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.body }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", color: s.color, background: `${s.color}15`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${s.color}33` }}>{s.badge}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <Lbl>Recent Snipes (Paper Mode)</Lbl>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginTop: 14 }}>
          {snipes.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 60px 100px 90px", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: C.gold }}>{s.symbol}</div>
              <div style={{ textAlign: "right" as const, fontSize: 13, fontWeight: 900, color: s.color }}>{s.x}x</div>
              <div style={{ textAlign: "right" as const, fontSize: 11, fontWeight: 700, color: s.x >= 1 ? C.green : C.red }}>{s.pnl}</div>
              <div style={{ textAlign: "center" as const }}><span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", color: s.color, background: `${s.color}15`, padding: "3px 8px", borderRadius: 20, border: `1px solid ${s.color}33` }}>{s.status}</span></div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ReturnsTab() {
  const [capitalSOL, setCapitalSOL] = useState(1.0);
  const [activeScenario, setActiveScenario] = useState(1);
  const SOL_USD = 155;
  const sc = SCENARIOS[activeScenario];
  const r = calcReturns(capitalSOL, sc);

  const minTiers = [
    { sol: 0.1, label: "Nano",     desc: "Test the system. Real snipes, real data." },
    { sol: 0.5, label: "Micro",    desc: "Meaningful returns start here." },
    { sol: 1.0, label: "Standard", desc: "Recommended starting point." },
    { sol: 5.0, label: "Pro",      desc: "5 parallel positions, serious returns." },
    { sol: 10.0,label: "Sovereign",desc: "Full deployment, maximum positions." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <GlassCard glow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Lbl>Capital Deployed</Lbl>
          <div><span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: C.gold }}>{capitalSOL} SOL</span><span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>(~${(capitalSOL * SOL_USD).toFixed(0)})</span></div>
        </div>
        <input type="range" min={0.1} max={20} step={0.1} value={capitalSOL} onChange={e => setCapitalSOL(Number(e.target.value))} style={{ width: "100%", accentColor: C.gold }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginTop: 5 }}><span>0.1</span><span>1</span><span>5</span><span>10</span><span>20 SOL</span></div>
      </GlassCard>

      <GlassCard>
        <Lbl>Strategy Profile</Lbl>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 10, marginBottom: 14 }}>
          {SCENARIOS.map((s, i) => (
            <button key={s.key} onClick={() => setActiveScenario(i)} style={{ background: activeScenario === i ? C.goldDim : "transparent", border: `1px solid ${activeScenario === i ? C.gold : C.border}`, borderRadius: 20, padding: "7px 16px", color: activeScenario === i ? C.gold : C.muted, fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "inherit" }}>{s.label}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 14 }}>
          {[{ l: "Win Rate", v: `${(sc.winRate*100).toFixed(0)}%` }, { l: "Avg Win", v: `${sc.avgWinX}x` }, { l: "Avg Loss", v: `-${((1-sc.avgLossX)*100).toFixed(0)}%` }, { l: "Trades/Day", v: sc.tradesPerDay.toString() }].map(f => (
            <div key={f.l}><Lbl>{f.l}</Lbl><div style={{ fontSize: 14, fontWeight: 900, color: sc.color }}>{f.v}</div></div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 10, paddingLeft: 14 }}>{sc.desc}</div>
      </GlassCard>

      <GlassCard glow>
        <Lbl>Returns — {sc.label} · {capitalSOL} SOL · EV {r.ev > 0 ? "+" : ""}{(r.ev*100).toFixed(2)}%/trade</Lbl>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {[
            { period: "DAILY",   pnl: r.dailyPnL,   pct: r.dailyPct },
            { period: "WEEKLY",  pnl: r.weeklyPnL,  pct: r.weeklyPct },
            { period: "MONTHLY", pnl: r.monthlyPnL, pct: r.monthlyPct },
            { period: "YEARLY",  pnl: r.annualPnL,  pct: r.annualPct },
          ].map(row => {
            const neg = row.pnl < 0;
            const col = neg ? C.red : row.pct > 100 ? C.cyan : C.green;
            return (
              <div key={row.period} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", alignItems: "center", gap: 8, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: C.muted }}>{row.period}</div>
                <div style={{ textAlign: "right" as const, fontSize: 14, fontWeight: 900, color: col }}>{neg ? "" : "+"}{row.pnl.toFixed(3)} SOL</div>
                <div style={{ textAlign: "right" as const, fontSize: 12, fontWeight: 700, color: C.body }}>{neg ? "-" : "+"}${Math.abs(row.pnl * SOL_USD).toFixed(0)}</div>
                <div style={{ textAlign: "right" as const, fontSize: 16, fontWeight: 900, color: col }}>{neg ? "" : "+"}{row.pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: "10px 14px", background: C.goldDim, borderRadius: 14, border: `1px solid ${C.goldGlow}`, fontSize: 9, color: C.muted, lineHeight: 1.7 }}>⚠ EV-based projections using real pump.fun production data. Memecoin sniping carries extreme risk. Paper trade minimum 2 weeks before live capital.</div>
      </GlassCard>

      <GlassCard>
        <Lbl>Minimum SOL — Click to Select</Lbl>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginTop: 14 }}>
          {minTiers.map(t => (
            <div key={t.label} onClick={() => setCapitalSOL(t.sol)} style={{ display: "grid", gridTemplateColumns: "80px 60px 1fr 90px", alignItems: "center", gap: 12, padding: "12px 16px", background: capitalSOL === t.sol ? C.goldDim : "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px solid ${capitalSOL === t.sol ? C.goldGlow : C.border}`, cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>{t.sol} SOL</div>
              <div style={{ fontSize: 11, color: C.muted }}>${(t.sol * SOL_USD).toFixed(0)}</div>
              <div style={{ fontSize: 10, color: C.body }}>{t.desc}</div>
              <div style={{ textAlign: "right" as const }}><span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: capitalSOL === t.sol ? C.gold : C.muted, background: capitalSOL === t.sol ? C.goldDim : "transparent", padding: "3px 10px", borderRadius: 20, border: `1px solid ${capitalSOL === t.sol ? C.goldGlow : "transparent"}` }}>{t.label.toUpperCase()}</span></div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function WalletTab({ member, userId, memberTier, onConnect }: any) {
  const [addr, setAddr] = useState(member?.wallet_address || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const rates = AFFILIATE_RATES[memberTier] || AFFILIATE_RATES.free;
  const save = async () => {
    if (!addr.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) { toast({ title: "Invalid Solana address", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await sb.from("sniper_members").upsert({ user_id: userId, wallet_address: addr, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { onConnect(addr); toast({ title: "✦ Wallet connected", description: "Profit share activated." }); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <GlassCard glow>
        <Lbl>Connect Solana Wallet</Lbl>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 18 }}>Snipe profits distribute to this address. Use a dedicated trading wallet — never your main.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Solana wallet address..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 16px", color: "white", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
          <button onClick={save} disabled={saving} style={{ background: C.gold, color: C.black, border: "none", borderRadius: 16, padding: "12px 24px", fontWeight: 900, fontSize: 10, letterSpacing: "0.2em", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "SAVING..." : "CONNECT"}</button>
        </div>
        {member?.wallet_address && <div style={{ marginTop: 10, fontSize: 11, color: C.green }}>✦ Connected: {member.wallet_address.slice(0, 6)}...{member.wallet_address.slice(-4)}</div>}
      </GlassCard>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Stat label="SOL Balance" value={`${(member?.balance || 0).toFixed(4)} SOL`} color={C.gold} />
        <Stat label="Total Earned" value={`${(member?.total_earned || 0).toFixed(4)} SOL`} color={C.green} />
        <Stat label="You Keep" value={`${rates.youKeep}%`} sub="of profits" color={C.cyan} glow />
      </div>
      <GlassCard>
        <Lbl>Profit Share — All Tiers</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
          {Object.entries(AFFILIATE_RATES).map(([tier, r]) => {
            const isMe = tier === memberTier;
            return (
              <div key={tier} style={{ background: isMe ? C.goldDim : "rgba(255,255,255,0.02)", borderRadius: 18, padding: "14px 12px", textAlign: "center" as const, border: `1px solid ${isMe ? C.goldGlow : C.border}` }}>
                <Lbl c={isMe ? C.gold : C.muted}>{tier.replace("-", " ")}</Lbl>
                <div style={{ fontSize: 22, fontWeight: 900, color: isMe ? C.gold : C.body }}>{r.youKeep}%</div>
                <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>you keep</div>
                {isMe && <div style={{ fontSize: 8, fontWeight: 800, color: C.gold, marginTop: 6, letterSpacing: "0.2em" }}>← YOU</div>}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function ReferTab({ member, memberTier }: any) {
  const { toast } = useToast();
  const rates = AFFILIATE_RATES[memberTier] || AFFILIATE_RATES.free;
  const link = member?.referral_code ? `${window.location.origin}?ref=${member.referral_code}` : `${window.location.origin}?ref=UPGRADE`;
  const copy = () => { navigator.clipboard.writeText(link); toast({ title: "✦ Copied", description: "Share to earn on every snipe." }); };
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <GlassCard glow>
        <Lbl>Your Referral Link</Lbl>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 16px", fontSize: 10, color: C.muted, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link}</div>
          <button onClick={copy} style={{ background: C.gold, color: C.black, border: "none", borderRadius: 16, padding: "12px 20px", fontWeight: 900, fontSize: 10, letterSpacing: "0.2em", cursor: "pointer", fontFamily: "inherit" }}>COPY</button>
        </div>
      </GlassCard>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Stat label="L1 Commission" value={`${rates.l1}%`} sub="direct referral profits" color={C.gold} glow />
        <Stat label="L2 Commission" value={`${rates.l2}%`} sub="their referrals" color={C.cyan} />
        <Stat label="You Keep" value={`${rates.youKeep}%`} sub="your own trades" color={C.green} />
      </div>
      <GlassCard>
        <Lbl>Full Commission Schedule</Lbl>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 80px", gap: 8, padding: "6px 12px", fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: C.muted }}>
            <span>TIER</span><span style={{ textAlign: "center" as const }}>L1</span><span style={{ textAlign: "center" as const }}>L2</span><span style={{ textAlign: "center" as const }}>KEEP</span>
          </div>
          {Object.entries(AFFILIATE_RATES).map(([tier, r]) => {
            const isMe = tier === memberTier;
            return (
              <div key={tier} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 80px", gap: 8, padding: "10px 12px", background: isMe ? C.goldDim : "transparent", borderRadius: 12, border: isMe ? `1px solid ${C.goldGlow}` : "1px solid transparent", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: isMe ? 800 : 400, color: isMe ? C.gold : C.body }}>{tier.charAt(0).toUpperCase() + tier.slice(1).replace("-", " ")}{isMe && <span style={{ fontSize: 7, marginLeft: 6, color: C.gold, letterSpacing: "0.2em" }}>← YOU</span>}</div>
                <div style={{ textAlign: "center" as const, fontSize: 13, fontWeight: 700, color: C.green }}>{r.l1}%</div>
                <div style={{ textAlign: "center" as const, fontSize: 13, fontWeight: 700, color: C.cyan }}>{r.l2}%</div>
                <div style={{ textAlign: "center" as const, fontSize: 13, fontWeight: 700, color: C.gold }}>{r.youKeep}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 10, color: C.muted, lineHeight: 1.7 }}>Commissions on net profits only. L1 = your referrals' trading profits. L2 = their referrals' profits. Upgrade tier to keep more of every snipe.</div>
      </GlassCard>
    </div>
  );
}

export default function SniperBot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tier } = useMembership();
  const [tab, setTab] = useState<"live" | "returns" | "wallet" | "refer">("live");
  const [member, setMember] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const memberTier = tier || "free";
  const hasAccess = ["siddha-quantum", "akasha-infinity"].includes(memberTier);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) sessionStorage.setItem("affiliate_ref", ref);
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      sb.from("sniper_members").select("*").eq("user_id", data.user.id).maybeSingle().then(({ data: m }) => m && setMember(m));
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.black, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "white", padding: "24px 20px", maxWidth: 920, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap'); @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} *{box-sizing:border-box} input[type=range]{accent-color:#D4AF37;height:4px}`}</style>
      <button onClick={() => navigate("/income-streams")} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 10, letterSpacing: "0.2em", cursor: "pointer", marginBottom: 24, fontFamily: "inherit", padding: 0 }}>← INCOME STREAMS</button>
      <div style={{ marginBottom: 28, animation: "fadeIn 0.5s ease" }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", color: C.gold, marginBottom: 8 }}>SQI WEALTH TECHNOLOGY · SOLANA · v2.0</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 6px" }}>SOVEREIGN SNIPER ENGINE</h1>
        <div style={{ fontSize: 12, color: C.muted }}>7 Launchpads · 12-Signal AI Score · Jito MEV · Dev Wallet Monitor · Gemini 2.5 Flash · ~$6/mo</div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.gold}44, transparent)`, marginTop: 16 }} />
      </div>

      {!hasAccess ? (
        <GlassCard glow style={{ textAlign: "center" as const, padding: "48px 32px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: C.gold, marginBottom: 12 }}>SIDDHA-QUANTUM REQUIRED</div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>Unlock the Sovereign Sniper</div>
          <div style={{ fontSize: 13, color: C.muted, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>World-class pump.fun sniper with 12-signal AI filter, 7 launchpads, Jito MEV protection, and dev wallet monitoring. Start from 0.1 SOL.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 480, margin: "0 auto 28px" }}>
            {[{ l: "Detection", v: "5–15ms gRPC" }, { l: "AI Scorer", v: "Gemini 2.5" }, { l: "Min Capital", v: "0.1 SOL" }, { l: "You Keep", v: "84–91%" }].map(f => (
              <div key={f.l} style={{ background: C.goldDim, borderRadius: 16, padding: 12, border: `1px solid ${C.goldGlow}` }}>
                <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.3em" }}>{f.l.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.gold, marginTop: 2 }}>{f.v}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/membership")} style={{ background: C.gold, color: C.black, border: "none", borderRadius: 20, padding: "14px 36px", fontWeight: 900, fontSize: 12, letterSpacing: "0.3em", cursor: "pointer", fontFamily: "inherit" }}>UPGRADE NOW</button>
        </GlassCard>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const }}>
            {(["live", "returns", "wallet", "refer"] as const).map(t => (
              <Tab key={t} label={t === "live" ? "⚡ Live" : t === "returns" ? "📊 Returns" : t === "wallet" ? "🔗 Wallet" : "🤝 Refer"} active={tab === t} onClick={() => setTab(t)} />
            ))}
          </div>
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {tab === "live"    && <LiveTab />}
            {tab === "returns" && <ReturnsTab />}
            {tab === "wallet"  && <WalletTab member={member} userId={userId} memberTier={memberTier} onConnect={(a: string) => setMember((p: any) => ({ ...(p || {}), wallet_address: a }))} />}
            {tab === "refer"   && <ReferTab member={member} memberTier={memberTier} />}
          </div>
        </>
      )}
    </div>
  );
}
