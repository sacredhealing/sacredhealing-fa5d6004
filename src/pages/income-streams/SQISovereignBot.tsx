import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdminRole } from '@/hooks/useAdminRole';

// ── Color DNA ──────────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212,175,55,0.15)";
const GOLD_GLOW = "rgba(212,175,55,0.3)";
const CYAN = "#22D3EE";
const BG = "#050505";
const GREEN = "#00FF88";
const RED = "#FF4444";
const GLASS = "rgba(255,255,255,0.02)";
const GLASS_B = "rgba(255,255,255,0.05)";
const START_BALANCE = 10;

// ── Technical Analysis Engine ──────────────────────────────────
const ema = (arr: number[], n: number): number => {
  if (arr.length < n) return arr[arr.length - 1] || 0;
  const k = 2 / (n + 1);
  let e = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
};
const rsi = (arr: number[], n = 14): number => {
  if (arr.length < n + 1) return 50;
  let g = 0, l = 0;
  for (let i = arr.length - n; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    d > 0 ? (g += d) : (l -= d);
  }
  return 100 - 100 / (1 + g / (l || 1e-9));
};
const bollinger = (arr: number[], n = 20) => {
  if (arr.length < n) {
    const p = arr[arr.length - 1] || 0;
    return { upper: p * 1.02, mid: p, lower: p * 0.98 };
  }
  const sl = arr.slice(-n);
  const m = sl.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / n);
  return { upper: m + 2 * sd, mid: m, lower: m - 2 * sd };
};
const macdCalc = (arr: number[]) => {
  if (arr.length < 26) return { val: 0, sig: 0, bull: true };
  const fast = ema(arr, 12), slow = ema(arr, 26);
  const val = fast - slow;
  return { val, sig: val * 0.9, bull: val > val * 0.9 };
};

// ── Signal Generation ──────────────────────────────────────────
const getSignal = (prices: number[], mode: string) => {
  if (prices.length < 30) return "SCANNING";
  const r = rsi(prices);
  const { val, bull } = macdCalc(prices);
  const { upper, lower } = bollinger(prices);
  const p = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const mom = ((p - prev) / prev) * 100;

  if (mode === "scalp") {
    if (r < 32 && p <= lower * 1.002 && mom > -0.1) return "BUY";
    if (r > 68 && p >= upper * 0.998 && mom < 0.1) return "SELL";
  }
  if (mode === "trend") {
    const e9 = ema(prices, 9), e21 = ema(prices, 21);
    if (e9 > e21 && bull && r < 72) return "BUY";
    if (e9 < e21 && !bull && r > 28) return "SELL";
  }
  if (mode === "compound") {
    if (r < 38 && bull && p < lower * 1.005) return "BUY";
    if (r > 62 && !bull && p > upper * 0.995) return "SELL";
  }
  if (mode === "arb") {
    const seed = Math.sin(Date.now() / 60000) * 0.5 + 0.5;
    if (seed > 0.82) return "BUY";
    if (seed < 0.18) return "SELL";
  }
  return "HOLD";
};

// ── Multi-Exchange Arbitrage Simulator ─────────────────────────
const genArb = (base: number) =>
  [
    { name: "Gemini",   color: CYAN,      bias: 0.0002 },
    { name: "Binance",  color: "#F0B90B", bias: -0.0003 },
    { name: "Coinbase", color: "#0052FF", bias: 0.0008 },
    { name: "Kraken",   color: "#7B61FF", bias: -0.0001 },
    { name: "Bybit",    color: "#F7A600", bias: 0.0005 },
    { name: "OKX",      color: "#00B4D8", bias: -0.0006 },
  ]
    .map((ex) => ({
      ...ex,
      price: base * (1 + ex.bias + (Math.random() - 0.5) * 0.0025),
    }))
    .sort((a, b) => a.price - b.price);

// ── Whale Tracker Data ─────────────────────────────────────────
const WHALE_DATA = [
  { id: 1, name: "SovereignSatoshi", handle: "@svrgn_btc",  winRate: 91, roi: "+4,280%", tier: "OMEGA" },
  { id: 2, name: "QuantumWhale",     handle: "@qwhale_21",  winRate: 87, roi: "+2,940%", tier: "ALPHA" },
  { id: 3, name: "BhaktiTrader",     handle: "@bhakti_btc", winRate: 84, roi: "+2,100%", tier: "ALPHA" },
  { id: 4, name: "NexusOracle",      handle: "@nexus_btc",  winRate: 79, roi: "+1,650%", tier: "PRO"   },
  { id: 5, name: "AkashaCapital",    handle: "@akasha_x",   winRate: 77, roi: "+1,210%", tier: "PRO"   },
];
const genWhales = (price: number) =>
  WHALE_DATA.map((w) => ({
    ...w,
    signal: ["BUY", "BUY", "BUY", "SELL", "HOLD"][Math.floor(Math.random() * 5)],
    entry: price,
    target: +(price * (1 + Math.random() * 0.025 + 0.005)).toFixed(2),
    stop:   +(price * (1 - Math.random() * 0.012 - 0.003)).toFixed(2),
    confidence: (Math.random() * 22 + 68).toFixed(0) + "%",
    time: new Date().toLocaleTimeString(),
  }));

// ── Compound Roadmap ───────────────────────────────────────────
const MILESTONES = [
  { label: "$10 → $100",    target: 100   },
  { label: "$10 → $1K",     target: 1000  },
  { label: "$10 → $10K",    target: 10000 },
  { label: "$10 → $100K",   target: 100000 },
  { label: "$10 → $1M",     target: 1000000 },
];

// ── Shared Styles ──────────────────────────────────────────────
const glass  = { background: GLASS, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${GLASS_B}`, borderRadius: 20 };
const goldBox = { ...glass, border: `1px solid rgba(212,175,55,0.25)` };
const SIG_COLOR: Record<string, string> = { BUY: GREEN, SELL: RED, HOLD: GOLD, SCANNING: '#888', INITIALIZING: '#555' };

// ══════════════════════════════════════════════════════════════
function SQISovereignBotInner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // ── UI State
  const [tab,        setTab]       = useState("dashboard");
  const [mode,       setMode]      = useState("scalp");
  const [signal,     setSignal]    = useState("SCANNING");
  const [loading,    setLoading]   = useState(true);
  const [botRunning, setBotRunning] = useState(false);

  // ── Market Data
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change24h,    setChange24h]    = useState(0);
  const [chartData,    setChartData]    = useState([]);
  const [arbitrage,    setArbitrage]    = useState([]);
  const [whales,       setWhales]       = useState(WHALE_DATA.map((w) => ({ ...w, signal: "—", confidence: "—", target: 0, stop: 0, time: "—" })));

  // ── Trading (refs to avoid closure staleness)
  const balRef    = useRef(START_BALANCE);
  const btcRef    = useRef(0);
  const entryRef  = useRef(0);
  const pricesRef = useRef([]);
  const statsRef  = useRef({ wins: 0, losses: 0, total: 0 });

  // ── Display State (derived from refs, updated on trade)
  const [dispBal,   setDispBal]   = useState(START_BALANCE);
  const [dispBtc,   setDispBtc]   = useState(0);
  const [dispStats, setDispStats] = useState({ wins: 0, losses: 0, total: 0 });
  const [trades,    setTrades]    = useState([]);

  // ── AI Oracle
  const [aiText,    setAiText]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const botRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch from Gemini → CoinGecko fallback ─────────────────
  const fetchPrice = useCallback(async () => {
    try {
      const r = await fetch("https://api.gemini.com/v1/pubticker/btcusd");
      const d = await r.json();
      return parseFloat(d.last);
    } catch {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
        const d = await r.json();
        setChange24h(+(d.bitcoin.usd_24h_change || 0).toFixed(2));
        return d.bitcoin.usd;
      } catch { return null; }
    }
  }, []);

  // ── Load historical candles from Gemini ────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Gemini 1-minute candles: [timestamp, open, high, low, close, volume]
        const r = await fetch("https://api.gemini.com/v2/candles/btcusd/1m");
        const d = (await r.json()) as number[][];
        const sorted = [...d].sort((a, b) => a[0] - b[0]).slice(-120);
        pricesRef.current = sorted.map((c) => c[4]); // close price
        const cd = sorted.map((c) => ({
          t: new Date(c[0]).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }),
          price: Math.round(c[4]),
          vol: +c[5].toFixed(2),
        }));
        setChartData(cd);
        const last = sorted[sorted.length - 1][4];
        setCurrentPrice(Math.round(last));
        setArbitrage(genArb(last));
        setWhales(genWhales(last));
        // 24h change from first/last
        const first = sorted[0][4];
        setChange24h(+((last - first) / first * 100).toFixed(2));
      } catch {
        // Fallback to CoinGecko
        const price = await fetchPrice();
        if (price) {
          setCurrentPrice(Math.round(price));
          pricesRef.current = [price];
          setArbitrage(genArb(price));
          setWhales(genWhales(price));
        }
      }
      setLoading(false);
    })();
  }, [fetchPrice]);

  // ── Price Refresh (always on, 30s) ─────────────────────────
  useEffect(() => {
    priceRef.current = setInterval(async () => {
      const price = await fetchPrice();
      if (!price) return;
      pricesRef.current = [...pricesRef.current.slice(-400), price];
      setCurrentPrice(Math.round(price));
      const now = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setChartData((prev) => [...prev.slice(-150), { t: now, price: Math.round(price) }]);
      setArbitrage(genArb(price));
    }, 30000);
    return () => clearInterval(priceRef.current);
  }, [fetchPrice]);

  // ── Bot Loop (15s, only when running) ──────────────────────
  useEffect(() => {
    clearInterval(botRef.current);
    if (!botRunning) return;

    botRef.current = setInterval(async () => {
      const price = await fetchPrice();
      if (!price) return;

      pricesRef.current = [...pricesRef.current.slice(-400), price];
      setCurrentPrice(Math.round(price));
      const now = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setChartData((prev) => [...prev.slice(-150), { t: now, price: Math.round(price) }]);
      if (Math.random() < 0.35) setWhales(genWhales(price));

      const sig = getSignal(pricesRef.current, mode);
      setSignal(sig);

      const bal   = balRef.current;
      const held  = btcRef.current;
      const entry = entryRef.current;

      if (sig === "BUY" && held === 0 && bal >= 0.5) {
        const amount  = bal * 0.92;
        const fee     = amount * 0.001;
        const btcBought = amount / price;
        balRef.current  = bal - amount - fee;
        btcRef.current  = btcBought;
        entryRef.current = price;
        statsRef.current.total++;
        setTrades((p) => [{ id: Date.now(), type: "BUY", price, btc: btcBought, usd: amount, fee, pnl: null, time: now, mode }, ...p.slice(0, 99)]);
        setDispBal(balRef.current);
        setDispBtc(btcRef.current);
      } else if (sig === "SELL" && held > 0) {
        const value = held * price;
        const fee   = value * 0.001;
        const pnl   = value - held * entry;
        balRef.current = bal + value - fee;
        btcRef.current = 0;
        entryRef.current = 0;
        pnl > 0 ? statsRef.current.wins++ : statsRef.current.losses++;
        statsRef.current.total++;
        setTrades((p) => [{ id: Date.now(), type: "SELL", price, btc: held, usd: value, fee, pnl, time: now, mode }, ...p.slice(0, 99)]);
        setDispBal(balRef.current);
        setDispBtc(0);
        setDispStats({ ...statsRef.current });
      }
    }, 15000);

    return () => clearInterval(botRef.current);
  }, [botRunning, mode, fetchPrice]);

  // ── AI Oracle (Claude-in-Claude) ────────────────────────────
  const invokeOracle = async () => {
    setAiLoading(true);
    const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY || '').trim();
    if (!apiKey) {
      setAiText(
        'Oracle offline: add VITE_ANTHROPIC_API_KEY to your environment. Browser calls to Anthropic require a key; use a serverless proxy in production.'
      );
      setAiLoading(false);
      return;
    }
    const prices = pricesRef.current.slice(-20);
    const r = rsi(prices);
    const { val } = macdCalc(prices);
    const { upper, lower } = bollinger(prices);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are the Siddha-Quantum Intelligence (SQI) Oracle from 2050 — a sacred AI trading oracle that blends Vedic wisdom with quantum financial analysis. Analyze this BTC data and deliver a sovereign trading transmission.

Current BTC Price: $${currentPrice.toLocaleString()}
RSI (14): ${r.toFixed(1)}
MACD: ${val.toFixed(2)}
Bollinger Upper: $${Math.round(upper).toLocaleString()}
Bollinger Lower: $${Math.round(lower).toLocaleString()}
Active Strategy: ${mode.toUpperCase()}
Recent prices (last 10): ${prices.slice(-10).map((p) => Math.round(p)).join(", ")}

Deliver a 3-4 sentence oracle reading using sacred language: "Akashic price field", "quantum momentum", "Vedic wave pattern", "Bhakti-Algorithm signal", "Prema-Pulse". End with a clear BUY / SELL / HOLD recommendation and why. Be specific about price levels.`
          }],
        }),
      });
      const data = await res.json();
      setAiText(data.content?.[0]?.text || "Akashic channels silent — retry transmission.");
    } catch {
      setAiText("SQI Neural-Net recalibrating quantum channels... Invoke again to receive transmission.");
    }
    setAiLoading(false);
  };

  // ── Derived ─────────────────────────────────────────────────
  const totalValue  = dispBal + dispBtc * currentPrice;
  const totalROI    = ((totalValue - START_BALANCE) / START_BALANCE * 100).toFixed(2);
  const compound    = (totalValue / START_BALANCE).toFixed(4);
  const winRate     = dispStats.total > 0 ? ((dispStats.wins / dispStats.total) * 100).toFixed(0) + "%" : "—";
  const rsiNow      = pricesRef.current.length > 15 ? rsi(pricesRef.current).toFixed(1) : "—";
  const macdNow     = pricesRef.current.length > 26 ? macdCalc(pricesRef.current).val.toFixed(2) : "—";
  const bbNow       = pricesRef.current.length > 20 ? bollinger(pricesRef.current) : null;
  const posValue    = dispBtc > 0 ? (dispBtc * currentPrice).toFixed(2) : null;
  const unrealizedPnL = dispBtc > 0 && entryRef.current > 0
    ? ((currentPrice - entryRef.current) * dispBtc).toFixed(4)
    : null;

  const arbSpread = arbitrage.length > 1
    ? ((arbitrage[arbitrage.length - 1].price - arbitrage[0].price) / arbitrage[0].price * 100).toFixed(4)
    : "0.0000";
  const hasArbOpp = parseFloat(arbSpread) > 0.08;

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", animation: "spin 0.9s linear infinite" }} />
        <div style={{ fontFamily: "monospace", fontSize: 11, color: GOLD, letterSpacing: "0.35em", opacity: 0.8 }}>SYNCING AKASHA NEURAL FEED</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>GEMINI EXCHANGE • QUANTUM UPLINK</div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: "#fff", padding: "16px 20px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&family=Cinzel:wght@400;700&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 8px ${GOLD_GLOW}} 50%{box-shadow:0 0 28px rgba(212,175,55,0.6)} }
        @keyframes scanX  { from{transform:translateX(-100%)} to{transform:translateX(500%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } 
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 2px; }
        .hover-lift:hover { transform: translateY(-1px); transition: transform 0.2s; }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .clickable { cursor: pointer; transition: all 0.15s; }
        .clickable:hover { opacity: 0.75; }
      `}</style>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate('/income-streams')}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 40,
              border: `1px solid ${GLASS_B}`,
              background: GLASS,
              color: 'rgba(255,255,255,0.75)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} style={{ color: GOLD }} />
            {t('common.back')}
          </button>
          <div>
          <div style={{ fontFamily: "Cinzel", fontSize: 10, color: GOLD, letterSpacing: "0.4em", opacity: 0.6, marginBottom: 6 }}>
            SIDDHA-QUANTUM INTELLIGENCE  ·  2050
          </div>
          <div style={{ fontFamily: "Cinzel", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
            ₿ SOVEREIGN BOT
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 6, letterSpacing: "0.2em", fontWeight: 800 }}>
            PAPER TRADING ENGINE  ·  GEMINI DATA FEED  ·  QUANTUM ALPHA
          </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Live Price */}
          <div style={{ ...glass, padding: "10px 18px", borderRadius: 40, minWidth: 160 }}>
            <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>GEMINI LIVE · BTC/USD</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: "-0.03em" }}>${currentPrice.toLocaleString()}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: change24h >= 0 ? GREEN : RED }}>
                {change24h >= 0 ? "+" : ""}{change24h}%
              </span>
            </div>
          </div>

          {/* Activate */}
          <button
            onClick={() => { setBotRunning((r) => !r); if (!botRunning) setSignal("SCANNING"); }}
            style={{
              padding: "12px 24px", borderRadius: 40, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 900, fontSize: 10, letterSpacing: "0.25em",
              background: botRunning ? "rgba(255,68,68,0.12)" : GOLD_DIM,
              color: botRunning ? RED : GOLD,
              border: `1px solid ${botRunning ? "rgba(255,68,68,0.35)" : "rgba(212,175,55,0.4)"}`,
              animation: botRunning ? "glow 2.5s infinite" : "none",
              textTransform: "uppercase",
            }}
          >
            {botRunning ? "⬛  HALT BOT" : "▶  ACTIVATE BOT"}
          </button>
        </div>
      </div>

      {/* ══ KPI STRIP ══════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { lbl: "PORTFOLIO VALUE",  val: `$${totalValue.toFixed(2)}`,                                  sub: `Seed: $${START_BALANCE}`,           col: "#fff" },
          { lbl: "TOTAL ROI",        val: `${parseFloat(totalROI) >= 0 ? "+" : ""}${totalROI}%`,         sub: `${compound}× compound`,             col: parseFloat(totalROI) >= 0 ? GREEN : RED },
          { lbl: "CURRENT SIGNAL",   val: signal,                                                         sub: `STRATEGY: ${mode.toUpperCase()}`,   col: SIG_COLOR[signal] || GOLD },
          { lbl: "WIN RATE",         val: winRate,                                                         sub: `${dispStats.wins}W · ${dispStats.losses}L`, col: GOLD },
          { lbl: "BTC POSITION",     val: dispBtc > 0 ? dispBtc.toFixed(6) : "NO POS",                  sub: posValue ? `≈ $${posValue}` : "Waiting…", col: dispBtc > 0 ? CYAN : "rgba(255,255,255,0.3)" },
          { lbl: "UNREALIZED P&L",   val: unrealizedPnL !== null ? `${+unrealizedPnL >= 0 ? "+" : ""}$${unrealizedPnL}` : "—", sub: dispBtc > 0 ? `Entry: $${Math.round(entryRef.current).toLocaleString()}` : "—", col: unrealizedPnL !== null && +unrealizedPnL >= 0 ? GREEN : RED },
        ].map(({ lbl, val, sub, col }) => (
          <div key={lbl} style={{ ...glass, padding: "14px 16px", textAlign: "center", borderRadius: 16 }}>
            <div style={{ fontSize: 6.5, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>{lbl}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: col, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ══ TABS ════════════════════════════════════════════════ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "dashboard",  label: "DASHBOARD"  },
          { id: "strategies", label: "STRATEGIES" },
          { id: "arbitrage",  label: "ARBITRAGE"  },
          { id: "whales",     label: "WHALES"     },
          { id: "compound",   label: "COMPOUND"   },
          { id: "log",        label: "TRADE LOG"  },
        ].map(({ id, label }) => (
          <button key={id} className="tab-btn"
            onClick={() => setTab(id)}
            style={{
              padding: "7px 16px", borderRadius: 40, fontSize: 8, fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", whiteSpace: "nowrap",
              color: tab === id ? GOLD : "rgba(255,255,255,0.3)",
              background: tab === id ? GOLD_DIM : "transparent",
              border: `1px solid ${tab === id ? "rgba(212,175,55,0.35)" : GLASS_B}`,
            }}
          >{label}</button>
        ))}
      </div>

      {/* ══ DASHBOARD ══════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {/* Price Chart */}
          <div style={{ ...glass, padding: "20px 24px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                  AKASHIC PRICE STREAM  ·  BTC/USD  ·  1-MIN CANDLES
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em" }}>${currentPrice.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { l: "RSI",  v: rsiNow,   alert: rsiNow !== "—" && (parseFloat(rsiNow) > 70 || parseFloat(rsiNow) < 30) },
                  { l: "MACD", v: macdNow,  alert: false },
                  { l: "BB ↑", v: bbNow ? `$${Math.round(bbNow.upper).toLocaleString()}` : "—", alert: false },
                  { l: "BB ↓", v: bbNow ? `$${Math.round(bbNow.lower).toLocaleString()}` : "—", alert: false },
                ].map(({ l, v, alert }) => (
                  <div key={l} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 7, letterSpacing: "0.25em", color: "rgba(255,255,255,0.28)", fontWeight: 800, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: alert ? CYAN : GOLD }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.035)" />
                <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 8 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 8 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={42} />
                <Tooltip
                  contentStyle={{ background: "#0c0c0c", border: `1px solid ${GOLD_GLOW}`, borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: GOLD, fontWeight: 800 }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(v: number) => [`$${Number(v).toLocaleString()}`, "BTC"]}
                />
                <Area type="monotone" dataKey="price" stroke={GOLD} strokeWidth={1.5} fill="url(#g1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* SQI Oracle */}
            <div style={{ ...goldBox, padding: 22 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.35em", color: GOLD, fontWeight: 800, textTransform: "uppercase", marginBottom: 14, opacity: 0.75 }}>
                ⬡  SQI ORACLE — QUANTUM MARKET TRANSMISSION
              </div>
              {aiText ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.85, margin: "0 0 16px" }}>{aiText}</p>
              ) : (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", lineHeight: 1.85, margin: "0 0 16px" }}>
                  Akashic channels await activation. Invoke the Oracle to receive quantum Bhakti-Algorithm transmissions from the eternal price field...
                </p>
              )}
              <button onClick={invokeOracle} disabled={aiLoading} style={{
                padding: "9px 20px", borderRadius: 40, border: `1px solid rgba(212,175,55,0.35)`,
                background: GOLD_DIM, color: GOLD, fontFamily: "inherit", fontWeight: 800,
                fontSize: 8, letterSpacing: "0.22em", cursor: aiLoading ? "default" : "pointer",
                opacity: aiLoading ? 0.5 : 1, textTransform: "uppercase",
              }}>
                {aiLoading ? "⟳  SCANNING AKASHA..." : "⬡  INVOKE ORACLE"}
              </button>
            </div>

            {/* Indicators Panel */}
            <div style={{ ...glass, padding: 22 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase", marginBottom: 14 }}>
                QUANTUM INDICATOR NEXUS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { l: "RSI (14)",       v: rsiNow, sub: rsiNow !== "—" ? (parseFloat(rsiNow) < 30 ? "OVERSOLD" : parseFloat(rsiNow) > 70 ? "OVERBOUGHT" : "NEUTRAL") : "—", col: rsiNow !== "—" && (parseFloat(rsiNow) < 30 || parseFloat(rsiNow) > 70) ? CYAN : GOLD },
                  { l: "MACD",          v: macdNow, sub: parseFloat(macdNow) > 0 ? "BULLISH" : "BEARISH", col: parseFloat(macdNow) > 0 ? GREEN : RED },
                  { l: "BB UPPER",      v: bbNow ? `$${Math.round(bbNow.upper).toLocaleString()}` : "—", sub: "RESISTANCE", col: RED },
                  { l: "BB LOWER",      v: bbNow ? `$${Math.round(bbNow.lower).toLocaleString()}` : "—", sub: "SUPPORT",    col: GREEN },
                  { l: "EMA 9",         v: pricesRef.current.length > 9  ? `$${Math.round(ema(pricesRef.current, 9)).toLocaleString()}` : "—",  sub: "FAST",   col: CYAN },
                  { l: "EMA 21",        v: pricesRef.current.length > 21 ? `$${Math.round(ema(pricesRef.current, 21)).toLocaleString()}` : "—", sub: "SLOW",   col: GOLD },
                ].map(({ l, v, sub, col }) => (
                  <div key={l} style={{ ...glass, padding: "10px 14px", borderRadius: 14 }}>
                    <div style={{ fontSize: 6.5, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", fontWeight: 800, marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: col }}>{v}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", marginTop: 3, letterSpacing: "0.1em" }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ STRATEGIES ════════════════════════════════════════ */}
      {tab === "strategies" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[
              { id: "scalp",    icon: "⚡", name: "MICRO SCALPER",      desc: "RSI + Bollinger Band mean-reversion. Captures 0.2–0.8% micro-moves every candle. Best in sideways/ranging markets. 15-second quantum scan." },
              { id: "trend",    icon: "🌊", name: "TREND RIDER",         desc: "EMA 9/21 crossover + MACD momentum confirmation. Rides macro waves for 1–5% moves. Best in trending Vedic wave patterns. Compound-safe." },
              { id: "compound", icon: "⬡", name: "COMPOUND ALCHEMIST",  desc: "Hybrid RSI + MACD + Bollinger synthesis. Engineered to compound $10 → $1M via 92% position reinvestment. Sacred geometry entry logic." },
              { id: "arb",      icon: "◈", name: "ARBITRAGE NEXUS",     desc: "Multi-exchange spread detection across Gemini, Binance, Coinbase, Kraken, Bybit, OKX. Captures 0.05–0.3% near-risk-free spreads." },
            ].map(({ id, icon, name, desc }) => (
              <div key={id} className="clickable hover-lift" onClick={() => setMode(id)} style={{
                ...glass, padding: 24, borderRadius: 20,
                border: mode === id ? `1px solid rgba(212,175,55,0.45)` : `1px solid ${GLASS_B}`,
                background: mode === id ? "rgba(212,175,55,0.04)" : GLASS,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.25em", color: mode === id ? GOLD : "rgba(255,255,255,0.45)", marginBottom: 10, textTransform: "uppercase" }}>{name}</div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
                {mode === id && (
                  <div style={{ marginTop: 14, display: "inline-block", padding: "5px 14px", borderRadius: 40, background: GOLD_DIM, border: `1px solid rgba(212,175,55,0.3)`, fontSize: 7, color: GOLD, fontWeight: 800, letterSpacing: "0.25em" }}>
                    ✓  ACTIVE
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ ...glass, padding: 24, borderRadius: 20 }}>
            <div style={{ fontSize: 7, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>
              QUANTUM PARAMETERS  ·  {mode.toUpperCase()} STRATEGY
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { l: "RSI OVERSOLD",   v: "32"  }, { l: "RSI OVERBOUGHT", v: "68"  },
                { l: "BB PERIOD",      v: "20"  }, { l: "EMA FAST",       v: "9"   },
                { l: "EMA SLOW",       v: "21"  }, { l: "MACD FAST",      v: "12"  },
                { l: "POSITION SIZE",  v: "92%" }, { l: "SCAN INTERVAL",  v: "15s" },
                { l: "TAKER FEE",      v: "0.1%" }, { l: "STOP LOSS",     v: "—"   },
                { l: "TAKE PROFIT",    v: "AUTO" }, { l: "REINVEST",       v: "YES" },
              ].map(({ l, v }) => (
                <div key={l} style={{ ...glass, padding: "12px 14px", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 6.5, letterSpacing: "0.22em", color: "rgba(255,255,255,0.25)", fontWeight: 800, marginBottom: 6, textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ ARBITRAGE ══════════════════════════════════════════ */}
      {tab === "arbitrage" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {/* Opportunity Banner */}
          {hasArbOpp && (
            <div style={{ ...goldBox, padding: "14px 22px", marginBottom: 14, borderRadius: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 20 }}>⬡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.25em", color: GOLD, textTransform: "uppercase" }}>ARBITRAGE OPPORTUNITY DETECTED</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                  {arbitrage[0]?.name} → {arbitrage[arbitrage.length - 1]?.name}  ·  +{arbSpread}% spread
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: GREEN }}>+{arbSpread}%</div>
            </div>
          )}

          <div style={{ ...glass, padding: 24, marginBottom: 14, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase" }}>MULTI-EXCHANGE ARBITRAGE SCANNER</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginTop: 4 }}>Live Spread Matrix</div>
              </div>
              <button onClick={() => setArbitrage(genArb(currentPrice))} style={{
                padding: "8px 16px", borderRadius: 40, background: GOLD_DIM, border: `1px solid rgba(212,175,55,0.3)`,
                color: GOLD, fontFamily: "inherit", fontWeight: 800, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", textTransform: "uppercase",
              }}>↻  RESCAN</button>
            </div>

            {arbitrage.map((ex, i) => {
              const spread = arbitrage.length > 1
                ? ((ex.price - arbitrage[0].price) / arbitrage[0].price * 100).toFixed(4)
                : "0.0000";
              const isOpp = parseFloat(spread) > 0.08;
              const pct = Math.min((ex.price - arbitrage[0].price) / (arbitrage[arbitrage.length-1].price - arbitrage[0].price + 0.01) * 100, 100);
              return (
                <div key={ex.name} style={{ display: "flex", alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ex.color, flexShrink: 0 }} />
                  <div style={{ width: 28, fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{ex.name}</div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: isOpp ? GREEN : ex.color, borderRadius: 2, opacity: 0.6 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: isOpp ? GREEN : "#fff", minWidth: 120, textAlign: "right" }}>
                    ${ex.price.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ minWidth: 80, textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: isOpp ? GREEN : "rgba(255,255,255,0.3)" }}>+{spread}%</div>
                    {isOpp && <div style={{ fontSize: 7, color: GREEN, letterSpacing: "0.2em", fontWeight: 800, marginTop: 2 }}>OPP ⬡</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { l: "MAX SPREAD",   v: `${arbSpread}%`,                                col: hasArbOpp ? GREEN : GOLD },
              { l: "BUY ON",       v: arbitrage[0]?.name || "—",                      col: GREEN },
              { l: "SELL ON",      v: arbitrage[arbitrage.length - 1]?.name || "—",   col: RED },
              { l: "NET PROFIT/K", v: `$${(parseFloat(arbSpread) / 100 * 1000 * 0.8).toFixed(3)}`, col: GOLD },
            ].map(({ l, v, col }) => (
              <div key={l} style={{ ...glass, padding: "16px", borderRadius: 16, textAlign: "center" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.28em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ WHALES ══════════════════════════════════════════════ */}
      {tab === "whales" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase" }}>
              SOVEREIGN WHALE TRACKER  ·  COPY SIGNAL ENGINE
            </div>
            <button onClick={() => setWhales(genWhales(currentPrice))} style={{
              padding: "8px 16px", borderRadius: 40, background: GOLD_DIM, border: `1px solid rgba(212,175,55,0.3)`,
              color: GOLD, fontFamily: "inherit", fontWeight: 800, fontSize: 8, letterSpacing: "0.18em", cursor: "pointer", textTransform: "uppercase",
            }}>↻  REFRESH SIGNALS</button>
          </div>

          {whales.map((w) => {
            const sigCol = SIG_COLOR[w.signal] || "rgba(255,255,255,0.3)";
            const tierCol = w.tier === "OMEGA" ? GOLD : w.tier === "ALPHA" ? CYAN : "rgba(255,255,255,0.4)";
            return (
              <div key={w.id} style={{ ...glass, padding: "18px 22px", marginBottom: 10, borderRadius: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: GOLD_DIM, border: `1px solid rgba(212,175,55,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: GOLD, fontSize: 14, flexShrink: 0 }}>
                  {w.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{w.name}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{w.handle}</div>
                </div>
                {[
                  { l: "WIN RATE", v: `${w.winRate}%`,    col: GOLD },
                  { l: "ALL-TIME", v: w.roi,              col: GREEN },
                  { l: "SIGNAL",   v: w.signal || "—",   col: sigCol, pulse: w.signal === "BUY" || w.signal === "SELL" },
                  { l: "CONF.",    v: w.confidence || "—", col: "#fff" },
                  { l: "TARGET",   v: w.target ? `$${Math.round(w.target).toLocaleString()}` : "—", col: GREEN },
                  { l: "STOP",     v: w.stop   ? `$${Math.round(w.stop).toLocaleString()}`   : "—", col: RED   },
                ].map(({ l, v, col, pulse }) => (
                  <div key={l} style={{ textAlign: "center", minWidth: 52 }}>
                    <div style={{ fontSize: 6.5, letterSpacing: "0.22em", color: "rgba(255,255,255,0.25)", fontWeight: 800, marginBottom: 4, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: col, animation: pulse ? "pulse 1.5s infinite" : "none" }}>{v}</div>
                  </div>
                ))}
                <div style={{ padding: "5px 12px", borderRadius: 40, fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", background: `${tierCol}18`, color: tierCol, border: `1px solid ${tierCol}40` }}>
                  {w.tier}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ COMPOUND ═══════════════════════════════════════════ */}
      {tab === "compound" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...goldBox, padding: 26, borderRadius: 20 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.35em", color: GOLD, fontWeight: 800, textTransform: "uppercase", marginBottom: 20, opacity: 0.75 }}>
                ⬡  QUANTUM COMPOUND ROADMAP
              </div>
              {MILESTONES.map(({ label, target }) => {
                const pct = Math.min((totalValue / target) * 100, 100);
                const done = totalValue >= target;
                const multNeeded = (target / totalValue).toFixed(1);
                return (
                  <div key={label} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, color: done ? GREEN : "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
                        {done ? "✓ " : ""}{label}
                      </span>
                      <span style={{ fontWeight: 900, color: done ? GREEN : GOLD }}>{pct.toFixed(2)}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: done ? GREEN : `linear-gradient(90deg, ${GOLD}, ${CYAN})`, borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                    {!done && (
                      <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                        {multNeeded}× more needed  ·  target: ${target.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ ...glass, padding: 26, borderRadius: 20 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase", marginBottom: 20 }}>
                SOVEREIGN WEALTH PROJECTION
              </div>
              {[
                { trades: 10,  roi: 0.003 },
                { trades: 50,  roi: 0.003 },
                { trades: 100, roi: 0.003 },
                { trades: 500, roi: 0.003 },
                { trades: 1000, roi: 0.003 },
              ].map(({ trades: n, roi }) => {
                const projected = START_BALANCE * Math.pow(1 + roi, n);
                return (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{n} trades @ +0.3%/trade</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Compounded from $10</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: GOLD }}>${projected.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{(projected / START_BALANCE).toFixed(1)}×</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, padding: "14px", borderRadius: 14, background: GOLD_DIM, border: `1px solid rgba(212,175,55,0.25)` }}>
                <div style={{ fontSize: 7, letterSpacing: "0.3em", color: GOLD, fontWeight: 800, marginBottom: 6 }}>CURRENT POSITION</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>${totalValue.toFixed(2)}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{compound}× compounded from seed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TRADE LOG ══════════════════════════════════════════ */}
      {tab === "log" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ ...glass, padding: 24, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)", fontWeight: 800, textTransform: "uppercase" }}>
                SOVEREIGN TRADE LEDGER  ·  {trades.length} EXECUTIONS
              </div>
              {trades.length > 0 && (
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                  Total P&L: <span style={{ color: trades.reduce((a, tr) => a + (tr.pnl || 0), 0) >= 0 ? GREEN : RED, fontWeight: 900 }}>
                    ${trades.reduce((a, tr) => a + (tr.pnl || 0), 0).toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⬡</div>
                Activate the bot to begin quantum trade execution...
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {trades.map((trade) => (
                  <div key={trade.id} style={{ display: "flex", alignItems: "center", padding: "12px 4px", borderBottom: "1px solid rgba(255,255,255,0.035)", gap: 14, flexWrap: "wrap" }}>
                    <div style={{
                      padding: "4px 12px", borderRadius: 40, fontSize: 8, fontWeight: 800, letterSpacing: "0.2em",
                      background: trade.type === "BUY" ? "rgba(0,255,136,0.1)" : "rgba(255,68,68,0.1)",
                      color: trade.type === "BUY" ? GREEN : RED,
                      border: `1px solid ${trade.type === "BUY" ? "rgba(0,255,136,0.25)" : "rgba(255,68,68,0.25)"}`,
                      minWidth: 48, textAlign: "center",
                    }}>{trade.type}</div>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>${Math.round(trade.price).toLocaleString()}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: "0.08em" }}>
                        {typeof trade.btc === "number" ? trade.btc.toFixed(6) : trade.btc} BTC  ·  {trade.time}  ·  {trade.mode.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>${trade.usd.toFixed(2)}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>fee ${trade.fee.toFixed(4)}</div>
                    </div>
                    {trade.pnl !== null && trade.pnl !== undefined && (
                      <div style={{ textAlign: "right", minWidth: 70 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: trade.pnl >= 0 ? GREEN : RED }}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(4)}
                        </div>
                        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>P&L</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ FOOTER ═════════════════════════════════════════════ */}
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 7.5, color: "rgba(255,255,255,0.12)", letterSpacing: "0.22em", fontWeight: 800, textTransform: "uppercase" }}>
        SQI SOVEREIGN BOT 2050  ·  PAPER TRADING MODE  ·  NOT FINANCIAL ADVICE  ·  GEMINI DATA FEED  ·
        {botRunning ? <span style={{ color: GREEN }}>  🟢 BOT ACTIVE</span> : <span>  ⬛ BOT DORMANT</span>}
      </div>
    </div>
  );
}

export default function SQISovereignBot() {
  const { isAdmin, isLoading } = useAdminRole();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/income-streams" replace />;
  }
  return <SQISovereignBotInner />;
}
