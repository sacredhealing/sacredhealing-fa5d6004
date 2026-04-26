// src/pages/PredictionMarketBot.tsx
// SQI 2050 — AI Prediction Engine (Polymarket)
// Paper + Live trading | Gemini-powered | Kelly-sized
// IMPORTANT: Stripe checkout & AffiliateID logic untouched (handled at parent /income-streams route)

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  ArrowLeft, Activity, TrendingUp, TrendingDown, Brain, Zap,
  Target, AlertTriangle, Power, RefreshCw, Settings as SettingsIcon,
  ChevronRight, Sparkles, Shield, BarChart3,
} from "lucide-react";

// ─── DESIGN TOKENS (SQI 2050) ─────────────────────────────────
const GOLD = "#D4AF37";
const BLACK = "#050505";
const CYAN = "#22D3EE";
const GREEN = "#10B981";
const RED = "#EF4444";

// ─── TYPES ────────────────────────────────────────────────────
type Mode = "paper" | "live";

interface BotSession {
  id: string;
  user_id: string;
  bot_type: "prediction_engine";
  mode: Mode;
  status: "running" | "paused" | "stopped";
  starting_balance: number;
  current_balance: number;
  kelly_fraction: number;
  min_edge_pct: number;
  max_position_pct: number;
  created_at: string;
  updated_at: string;
}

interface BotTrade {
  id: string;
  session_id: string;
  market_question: string;
  market_id: string;
  side: "YES" | "NO";
  price: number;          // 0.00–1.00
  ai_probability: number; // 0.00–1.00
  edge_pct: number;
  size_usd: number;
  status: "pending" | "open" | "settled" | "cancelled";
  pnl_usd: number | null;
  created_at: string;
  settled_at: string | null;
  reasoning: string | null;
}

interface MarketCandidate {
  id: string;
  question: string;
  current_price: number;   // YES price 0–1
  volume_24h: number;
  ai_probability: number;
  edge_pct: number;
  recommended_side: "YES" | "NO";
  recommended_size: number;
  reasoning: string;
}

// ─── KELLY MATH ───────────────────────────────────────────────
/**
 * Fractional Kelly for binary prediction markets.
 * f* = (bp - q) / b ; clamped to [0, max_position_pct]
 * @param p AI probability (0-1)
 * @param marketPrice Current YES price (0-1)
 * @param kellyFraction 0.10–1.0 (we default 0.25 = quarter Kelly for safety)
 * @param maxPositionPct Hard cap on bankroll % per trade
 */
function kellySize(
  p: number,
  marketPrice: number,
  kellyFraction: number,
  maxPositionPct: number
): { fraction: number; side: "YES" | "NO"; edge: number } {
  // Decide side based on AI vs market
  const yesEdge = p - marketPrice;
  const noEdge = (1 - p) - (1 - marketPrice);
  const side: "YES" | "NO" = yesEdge > noEdge ? "YES" : "NO";
  const probWin = side === "YES" ? p : 1 - p;
  const cost = side === "YES" ? marketPrice : 1 - marketPrice;
  const edge = side === "YES" ? yesEdge : noEdge;

  if (cost <= 0 || cost >= 1 || edge <= 0) {
    return { fraction: 0, side, edge };
  }

  // Decimal odds b = (1/cost) - 1 ; payoff per $1 risked
  const b = 1 / cost - 1;
  const q = 1 - probWin;
  const fullKelly = (b * probWin - q) / b;
  const sized = Math.max(0, fullKelly) * kellyFraction;
  return {
    fraction: Math.min(sized, maxPositionPct),
    side,
    edge,
  };
}

// ─── REALISTIC PROJECTION MODEL ───────────────────────────────
// Three scenarios based on win-rate × avg edge × trades/day × Kelly
// These are PROJECTIONS, not guarantees. Variance is significant.
interface ProjectionInputs {
  startingBalance: number;
  kellyFraction: number;
}
function buildProjections({ startingBalance, kellyFraction }: ProjectionInputs) {
  const scenarios = [
    {
      key: "conservative" as const,
      label: "Conservative",
      tagline: "Minimal edge survives fees",
      winRate: 0.51,
      avgEdge: 0.015,
      tradesPerDay: 2,
      feeDrag: 0.02,
      color: "rgba(255,255,255,0.7)",
    },
    {
      key: "base" as const,
      label: "Base Case",
      tagline: "Realistic AI edge in liquid markets",
      winRate: 0.54,
      avgEdge: 0.030,
      tradesPerDay: 4,
      feeDrag: 0.02,
      color: GOLD,
    },
    {
      key: "optimistic" as const,
      label: "Optimistic",
      tagline: "Strong AI edge, illiquid niches",
      winRate: 0.58,
      avgEdge: 0.060,
      tradesPerDay: 6,
      feeDrag: 0.02,
      color: CYAN,
    },
  ];

  return scenarios.map((s) => {
    // Per-trade EV = (winRate × edge) - feeDrag, applied to Kelly fraction
    const evPerTrade = (s.winRate * s.avgEdge) - s.feeDrag * 0.5; // half-spread approx
    const dailyReturn = evPerTrade * kellyFraction * s.tradesPerDay;
    const day = startingBalance * dailyReturn;
    const week = startingBalance * (Math.pow(1 + dailyReturn, 7) - 1);
    const month = startingBalance * (Math.pow(1 + dailyReturn, 30) - 1);
    return {
      ...s,
      dailyReturnPct: dailyReturn * 100,
      day,
      week,
      month,
    };
  });
}

// ─── COMPONENT ────────────────────────────────────────────────
export default function PredictionMarketBot() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [session, setSession] = useState<BotSession | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [candidates, setCandidates] = useState<MarketCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings (persisted in session)
  const [mode, setMode] = useState<Mode>("paper");
  const [kellyFraction, setKellyFraction] = useState(0.25); // quarter-Kelly default
  const [minEdge, setMinEdge] = useState(0.03);             // 3% min edge
  const [maxPosition, setMaxPosition] = useState(0.05);     // 5% max per trade
  const [startingBalance] = useState(10);                    // €10 default

  // ─── INITIAL LOAD ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadOrCreateSession();
  }, [user]);

  const loadOrCreateSession = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load existing session for this bot
      const { data: existing, error } = await supabase
        .from("bot_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("bot_type", "prediction_engine")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existing) {
        setSession(existing as unknown as BotSession);
        setMode((existing.mode as Mode) ?? "paper");
        setKellyFraction(existing.kelly_fraction || 0.25);
        setMinEdge(existing.min_edge_pct || 0.03);
        setMaxPosition(existing.max_position_pct || 0.05);
        await loadTrades(existing.id);
      } else {
        // Create fresh paper-mode session at €10
        const { data: created, error: createErr } = await supabase
          .from("bot_sessions")
          .insert({
            user_id: user.id,
            bot_type: "prediction_engine",
            mode: "paper",
            status: "paused",
            starting_balance: 10,
            current_balance: 10,
            kelly_fraction: 0.25,
            min_edge_pct: 0.03,
            max_position_pct: 0.05,
          })
          .select()
          .single();
        if (createErr) throw createErr;
        setSession(created as BotSession);
      }
    } catch (e: any) {
      console.error("loadOrCreateSession", e);
      toast.error("Failed to load bot session", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTrades = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("bot_trades")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setTrades(data as BotTrade[]);
  };

  // ─── REALTIME SUBSCRIPTION ───────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`bot_trades:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bot_trades",
          filter: `session_id=eq.${session.id}`,
        },
        () => loadTrades(session.id)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bot_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => setSession(payload.new as BotSession)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // ─── BOT CONTROL ─────────────────────────────────────────────
  const persistSettings = async (updates: Partial<BotSession>) => {
    if (!session) return;
    const { data, error } = await supabase
      .from("bot_sessions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", session.id)
      .select()
      .single();
    if (!error && data) setSession(data as BotSession);
  };

  const toggleBot = async () => {
    if (!session) return;
    const next = session.status === "running" ? "paused" : "running";
    await persistSettings({ status: next });
    toast.success(next === "running" ? "Engine activated" : "Engine paused");
  };

  const switchMode = async (next: Mode) => {
    if (!session) return;
    if (next === "live" && session.current_balance < 10) {
      toast.error("Live mode requires minimum $10 balance");
      return;
    }
    if (next === "live") {
      const confirmed = window.confirm(
        "LIVE MODE: Real money will be risked. Polymarket trades execute on Polygon mainnet via the Railway worker. Continue?"
      );
      if (!confirmed) return;
    }
    setMode(next);
    await persistSettings({ mode: next });
    toast.success(`Switched to ${next.toUpperCase()} mode`);
  };

  // ─── SCAN MARKETS (Gemini via edge function) ────────────────
  const scanMarkets = useCallback(async () => {
    if (!session) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "prediction-engine-scan",
        {
          body: {
            session_id: session.id,
            mode: session.mode,
            kelly_fraction: session.kelly_fraction,
            min_edge_pct: session.min_edge_pct,
            max_position_pct: session.max_position_pct,
            current_balance: session.current_balance,
          },
        }
      );
      if (error) throw error;
      setCandidates(data?.candidates ?? []);
      if ((data?.candidates ?? []).length === 0) {
        toast("No edge found this scan", {
          description: "Engine waits for a higher-quality signal.",
        });
      } else {
        toast.success(`${data.candidates.length} candidate(s) identified`);
      }
    } catch (e: any) {
      console.error("scanMarkets", e);
      toast.error("Scan failed", { description: e.message });
    } finally {
      setScanning(false);
    }
  }, [session]);

  // Auto-scan loop when running (every 90s)
  const scanRef = useRef(scanMarkets);
  scanRef.current = scanMarkets;
  useEffect(() => {
    if (session?.status !== "running") return;
    scanRef.current();
    const id = setInterval(() => scanRef.current(), 90_000);
    return () => clearInterval(id);
  }, [session?.status]);

  // ─── EXECUTE TRADE (paper or live signal) ───────────────────
  const executeTrade = async (c: MarketCandidate) => {
    if (!session) return;
    try {
      const sizeUsd = Math.min(
        c.recommended_size,
        session.current_balance * session.max_position_pct
      );
      if (sizeUsd < 0.5) {
        toast.error("Size below minimum trade ($0.50)");
        return;
      }
      const tradePayload = {
        user_id: user!.id,
        session_id: session.id,
        market_question: c.question,
        market_id: c.id,
        side: c.recommended_side,
        price: c.current_price,
        ai_probability: c.ai_probability,
        edge_pct: c.edge_pct,
        size_usd: sizeUsd,
        status: "pending",
        reasoning: c.reasoning,
        bot_type: "prediction_engine",
      };

      const { data: trade, error } = await supabase
        .from("bot_trades")
        .insert([tradePayload])
        .select()
        .single();
      if (error) throw error;

      if (mode === "live") {
        // Push to bot_trade_signals → Railway worker picks up
        const { error: sigErr } = await supabase
          .from("bot_trade_signals")
          .insert({
            user_id: user!.id,
            session_id: session.id,
            trade_id: trade.id,
            bot_type: "prediction_engine",
            payload: tradePayload,
            status: "queued",
          });
        if (sigErr) throw sigErr;
        toast.success("Trade signal queued for live execution");
      } else {
        // Paper mode: deduct size, mark as open
        await supabase
          .from("bot_trades")
          .update({ status: "open" })
          .eq("id", trade.id);
        await persistSettings({
          current_balance: session.current_balance - sizeUsd,
        });
        toast.success(`Paper trade opened: ${c.recommended_side} ${c.question.slice(0, 40)}…`);
      }

      setCandidates((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e: any) {
      console.error("executeTrade", e);
      toast.error("Trade failed", { description: e.message });
    }
  };

  // ─── DERIVED ANALYTICS ───────────────────────────────────────
  const stats = useMemo(() => {
    const settled = trades.filter((t) => t.status === "settled");
    const wins = settled.filter((t) => (t.pnl_usd ?? 0) > 0).length;
    const totalPnl = settled.reduce((sum, t) => sum + (t.pnl_usd ?? 0), 0);
    const open = trades.filter((t) => t.status === "open" || t.status === "pending");
    const today = trades.filter(
      (t) =>
        new Date(t.created_at).toDateString() === new Date().toDateString()
    );
    const todayPnl = today
      .filter((t) => t.status === "settled")
      .reduce((sum, t) => sum + (t.pnl_usd ?? 0), 0);
    return {
      winRate: settled.length > 0 ? (wins / settled.length) * 100 : 0,
      totalPnl,
      todayPnl,
      openCount: open.length,
      settledCount: settled.length,
    };
  }, [trades]);

  const projections = useMemo(
    () =>
      buildProjections({
        startingBalance: session?.starting_balance ?? 10,
        kellyFraction,
      }),
    [session?.starting_balance, kellyFraction]
  );

  // ─── RENDER ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BLACK }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{
              borderColor: `${GOLD}33`,
              borderTopColor: GOLD,
            }}
          />
          <p
            style={{
              color: GOLD,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
            }}
          >
            Initializing Engine
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: BLACK, color: "#fff" }}>
      {/* ─── HEADER ─── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: "rgba(5,5,5,0.85)", borderBottom: `1px solid ${GOLD}22` }}
      >
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/income-streams")}
            className="flex items-center gap-2 opacity-70 hover:opacity-100 transition"
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 800 }}>
              INCOME STREAMS
            </span>
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="p-2 rounded-full transition"
            style={{ border: `1px solid ${GOLD}33` }}
          >
            <SettingsIcon size={18} style={{ color: GOLD }} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-8 space-y-6">
        {/* ─── HERO ─── */}
        <div className="text-center space-y-3 pt-4">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${GOLD}33`,
              backdropFilter: "blur(40px)",
            }}
          >
            <Brain size={12} style={{ color: GOLD }} />
            <span
              style={{
                fontSize: 8,
                letterSpacing: "0.5em",
                fontWeight: 800,
                color: GOLD,
                textTransform: "uppercase",
              }}
            >
              AI Prediction Engine
            </span>
          </div>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              background: `linear-gradient(135deg, ${GOLD}, #fff)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Polymarket Edge
            <br />Detection
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Gemini scans liquid markets every 90 seconds. Trades open only when AI probability beats market price by your minimum edge threshold.
          </p>
        </div>

        {/* ─── MODE + STATUS ROW ─── */}
        <div
          className="rounded-[40px] p-6 flex items-center justify-between gap-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid rgba(255,255,255,0.05)`,
            backdropFilter: "blur(40px)",
          }}
        >
          <div className="flex-1">
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.5em",
                fontWeight: 800,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
              }}
            >
              Status
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: session?.status === "running" ? GREEN : "#666",
                  boxShadow:
                    session?.status === "running"
                      ? `0 0 12px ${GREEN}`
                      : "none",
                  animation:
                    session?.status === "running" ? "pulse 2s infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: session?.status === "running" ? GREEN : "#aaa",
                }}
              >
                {session?.status === "running" ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.5em",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                }}
              >
                Mode
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: mode === "paper" ? GOLD : "rgba(255,255,255,0.4)",
                    letterSpacing: "0.2em",
                  }}
                >
                  PAPER
                </span>
                <Switch
                  checked={mode === "live"}
                  onCheckedChange={(v) => switchMode(v ? "live" : "paper")}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: mode === "live" ? RED : "rgba(255,255,255,0.4)",
                    letterSpacing: "0.2em",
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>

            <button
              onClick={toggleBot}
              className="rounded-full p-4 transition"
              style={{
                background:
                  session?.status === "running"
                    ? `linear-gradient(135deg, ${RED}, #B91C1C)`
                    : `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                boxShadow:
                  session?.status === "running"
                    ? `0 0 24px ${RED}66`
                    : `0 0 24px ${GOLD}66`,
              }}
            >
              <Power size={20} color={BLACK} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ─── STAT CHIPS ─── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "BALANCE",
              value: `$${session?.current_balance.toFixed(2) ?? "0.00"}`,
              color: GOLD,
            },
            {
              label: "TODAY",
              value: `${stats.todayPnl >= 0 ? "+" : ""}$${stats.todayPnl.toFixed(2)}`,
              color: stats.todayPnl >= 0 ? GREEN : RED,
            },
            {
              label: "WIN RATE",
              value: `${stats.winRate.toFixed(0)}%`,
              color: "#fff",
            },
            {
              label: "OPEN",
              value: `${stats.openCount}`,
              color: CYAN,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[24px] p-3 text-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(40px)",
              }}
            >
              <div
                style={{
                  fontSize: 7,
                  letterSpacing: "0.5em",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: s.color,
                  textShadow: s.color === GOLD ? `0 0 12px ${GOLD}33` : "none",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ─── PROJECTIONS PANEL ─── */}
        <div
          className="rounded-[40px] p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.5em",
                  fontWeight: 800,
                  color: GOLD,
                  textTransform: "uppercase",
                }}
              >
                Modeled Projections
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginTop: 4,
                }}
              >
                ${session?.starting_balance.toFixed(0)} starting bankroll
              </div>
            </div>
            <BarChart3 size={20} style={{ color: GOLD, opacity: 0.6 }} />
          </div>

          <div className="space-y-3">
            {projections.map((p) => (
              <div
                key={p.key}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${p.color}22`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: "-0.03em",
                        color: p.color,
                      }}
                    >
                      {p.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 2,
                      }}
                    >
                      {p.tagline}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: p.color,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {p.dailyReturnPct >= 0 ? "+" : ""}
                    {p.dailyReturnPct.toFixed(2)}%/day
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "1D", value: p.day },
                    { label: "1W", value: p.week },
                    { label: "1M", value: p.month },
                  ].map((t) => (
                    <div key={t.label} className="text-center">
                      <div
                        style={{
                          fontSize: 7,
                          letterSpacing: "0.4em",
                          fontWeight: 800,
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {t.label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          letterSpacing: "-0.03em",
                          color: t.value >= 0 ? p.color : RED,
                          marginTop: 2,
                        }}
                      >
                        {t.value >= 0 ? "+" : ""}${t.value.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* HONEST DISCLAIMER */}
          <div
            className="mt-5 p-4 rounded-2xl flex gap-3"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertTriangle size={16} style={{ color: RED, flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <strong style={{ color: RED }}>Projections, not promises.</strong>{" "}
              Real returns depend on market efficiency, AI accuracy, fees, slippage, and variance. Drawdowns of 20–40% from peak are normal even for profitable bots. Most retail prediction-market traders lose money. Never deposit funds you can't afford to lose. Run paper mode for 2+ weeks before going live.
            </p>
          </div>
        </div>

        {/* ─── ACTIVE CANDIDATES ─── */}
        <div
          className="rounded-[40px] p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.5em",
                  fontWeight: 800,
                  color: GOLD,
                  textTransform: "uppercase",
                }}
              >
                Live Candidates
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginTop: 4,
                }}
              >
                {candidates.length} edge{candidates.length === 1 ? "" : "s"} detected
              </div>
            </div>
            <Button
              onClick={scanMarkets}
              disabled={scanning}
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
                color: BLACK,
                fontWeight: 800,
                letterSpacing: "0.1em",
                fontSize: 11,
                borderRadius: 999,
                padding: "0 16px",
                height: 36,
              }}
            >
              {scanning ? (
                <RefreshCw size={14} className="animate-spin mr-2" />
              ) : (
                <Zap size={14} className="mr-2" />
              )}
              SCAN
            </Button>
          </div>

          {candidates.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles
                size={32}
                style={{ color: GOLD, opacity: 0.3, margin: "0 auto" }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 12,
                }}
              >
                {session?.status === "running"
                  ? "Engine scanning… edges appear here when found."
                  : "Activate engine to begin scanning."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${GOLD}22`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {c.question}
                      </div>
                      {c.reasoning && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 6,
                            lineHeight: 1.5,
                          }}
                        >
                          {c.reasoning}
                        </div>
                      )}
                    </div>
                    <div
                      className="px-2 py-1 rounded-md text-center flex-shrink-0"
                      style={{
                        background:
                          c.recommended_side === "YES"
                            ? `${GREEN}22`
                            : `${RED}22`,
                        border: `1px solid ${c.recommended_side === "YES" ? GREEN : RED}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 7,
                          fontWeight: 800,
                          letterSpacing: "0.4em",
                          color:
                            c.recommended_side === "YES" ? GREEN : RED,
                        }}
                      >
                        {c.recommended_side}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      {
                        label: "MKT",
                        value: `${(c.current_price * 100).toFixed(0)}¢`,
                      },
                      {
                        label: "AI",
                        value: `${(c.ai_probability * 100).toFixed(0)}%`,
                      },
                      {
                        label: "EDGE",
                        value: `+${(c.edge_pct * 100).toFixed(1)}%`,
                      },
                    ].map((m, i) => (
                      <div key={i}>
                        <div
                          style={{
                            fontSize: 7,
                            letterSpacing: "0.4em",
                            fontWeight: 800,
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: i === 2 ? GOLD : "#fff",
                            marginTop: 2,
                          }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => executeTrade(c)}
                    className="w-full"
                    style={{
                      background: GOLD,
                      color: BLACK,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      fontSize: 11,
                      borderRadius: 999,
                      height: 36,
                    }}
                  >
                    OPEN ${c.recommended_size.toFixed(2)} {mode === "live" ? "LIVE" : "PAPER"}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── RECENT TRADES ─── */}
        <div
          className="rounded-[40px] p-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px)",
          }}
        >
          <div className="mb-5">
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.5em",
                fontWeight: 800,
                color: GOLD,
                textTransform: "uppercase",
              }}
            >
              Trade Log
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                marginTop: 4,
              }}
            >
              {trades.length} record{trades.length === 1 ? "" : "s"}
            </div>
          </div>

          {trades.length === 0 ? (
            <div className="py-8 text-center">
              <Activity
                size={28}
                style={{ color: GOLD, opacity: 0.3, margin: "0 auto" }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 10,
                }}
              >
                No trades yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {(t.pnl_usd ?? 0) >= 0 ? (
                      <TrendingUp size={14} style={{ color: GREEN }} />
                    ) : (
                      <TrendingDown size={14} style={{ color: RED }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.market_question}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.4)",
                          letterSpacing: "0.1em",
                          marginTop: 2,
                        }}
                      >
                        {t.side} · ${t.size_usd.toFixed(2)} · {t.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {t.pnl_usd != null && (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: "-0.03em",
                        color: t.pnl_usd >= 0 ? GREEN : RED,
                      }}
                    >
                      {t.pnl_usd >= 0 ? "+" : ""}${t.pnl_usd.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SETTINGS DRAWER ─── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowSettings(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-t-[40px] p-6 space-y-6"
            style={{
              background: BLACK,
              border: `1px solid ${GOLD}33`,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: GOLD,
                }}
              >
                Risk Parameters
              </h3>
              <button onClick={() => setShowSettings(false)}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 24 }}>×</span>
              </button>
            </div>

            {[
              {
                label: "Kelly Fraction",
                value: kellyFraction,
                min: 0.1,
                max: 1,
                step: 0.05,
                onChange: setKellyFraction,
                hint:
                  "Fraction of full Kelly. 0.25 = quarter-Kelly (recommended). Lower = safer.",
                display: `${(kellyFraction * 100).toFixed(0)}%`,
              },
              {
                label: "Min Edge Threshold",
                value: minEdge,
                min: 0.01,
                max: 0.15,
                step: 0.005,
                onChange: setMinEdge,
                hint:
                  "Minimum AI edge over market price required to enter a trade.",
                display: `${(minEdge * 100).toFixed(1)}%`,
              },
              {
                label: "Max Position Size",
                value: maxPosition,
                min: 0.01,
                max: 0.2,
                step: 0.01,
                onChange: setMaxPosition,
                hint: "Hard cap on bankroll fraction per trade.",
                display: `${(maxPosition * 100).toFixed(0)}%`,
              },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex justify-between mb-2">
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.5em",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: GOLD,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.display}
                  </div>
                </div>
                <Slider
                  value={[p.value]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onValueChange={(v) => p.onChange(v[0])}
                />
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {p.hint}
                </p>
              </div>
            ))}

            <Button
              className="w-full"
              onClick={async () => {
                await persistSettings({
                  kelly_fraction: kellyFraction,
                  min_edge_pct: minEdge,
                  max_position_pct: maxPosition,
                });
                toast.success("Parameters saved");
                setShowSettings(false);
              }}
              style={{
                background: GOLD,
                color: BLACK,
                fontWeight: 800,
                letterSpacing: "0.1em",
                borderRadius: 999,
                height: 48,
              }}
            >
              SAVE PARAMETERS
            </Button>

            <div
              className="p-4 rounded-2xl flex gap-3"
              style={{
                background: "rgba(34,211,238,0.05)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <Shield size={16} style={{ color: CYAN, flexShrink: 0, marginTop: 2 }} />
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Quarter-Kelly with 3% min edge and 5% max position is the
                recommended starting profile for $10 bankrolls. Increase only after 100+ paper trades show consistent positive edge.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
