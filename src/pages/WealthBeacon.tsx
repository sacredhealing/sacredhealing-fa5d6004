/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  SQI-2050 · WEALTH BEACON · AKASHA-NEURAL ARCHIVE   ║
 * ║  Upgraded by Siddha-Quantum Intelligence v2050       ║
 * ║  Bhakti-Algorithms ∞ Prema-Pulse Transmissions       ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * WHAT WAS FIXED / UPGRADED (zero functional-logic changes):
 *  1. Route guard + tier redirect — preserved 100%.
 *  2. AffiliateID / Stripe triggers — untouched.
 *  3. QuantumBeacon 3-D canvas — preserved.
 *  4. TransmissionLog + NadiScan — preserved.
 *  5. Gemini AI call (initiateLightCodes) — preserved.
 *
 * VISUAL UPGRADES:
 *  A. Cormorant Garamond + Plus Jakarta Sans loaded via @import.
 *  B. Full glassmorphism card wrapping hero content.
 *  C. Animated sacred-geometry SVG ring behind the headline.
 *  D. Four SQI-Status stat chips (Nadi / Hz / Tier / Sync).
 *  E. Horizontal "Vedic Light-Code ticker" scrolling bar.
 *  F. Hover glow on both CTA buttons (gold pulse + violet pulse).
 *  G. Subtle scanline overlay for the "2050 terminal" feel.
 *  H. Bottom HUD bar redesigned with monospaced labels.
 *  I. Sidebar icon labels visible on hover (tooltip).
 *  J. Particles upgraded: multi-color (gold + violet + cyan).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/setup";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Zap, Shield, Cpu, Waves, Activity,
  ChevronRight, Lock, ArrowLeft, Eye, Infinity,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";
import { QuantumBeacon } from "@/components/wealth-beacon/QuantumBeacon";

/* ─── Color tokens ─────────────────────────────────────── */
const GOLD    = "#D4AF37";
const VIOLET  = "#9D50BB";
const CYAN    = "#22D3EE";
const BG      = "#050505";

/* ─── Font injection (add once per app) ─────────────────── */
const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
`;

const LOG_MESSAGE_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TICKER_INDEXES = [0, 1, 2, 3, 4, 5, 6];

/* ══════════════════════════════════════════════════════════
   NadiScan — top-right live counter (unchanged logic, new style)
══════════════════════════════════════════════════════════ */
function NadiScan() {
  const { t } = useTranslation();
  const [activeNadis, setActiveNadis] = useState(68432);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveNadis((prev) => {
        const change = Math.floor(Math.random() * 10) - 4;
        return Math.min(72000, Math.max(68000, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 72, right: 16,
      fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
      fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
      color: `rgba(212,175,55,0.55)`, zIndex: 20,
      maxWidth: "42vw", textAlign: "right",
      background: "rgba(5,5,5,0.6)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(212,175,55,0.12)",
      borderRadius: 6, padding: "4px 8px",
    }}>
      {t("wealthBeacon.nadiScan", { active: activeNadis.toLocaleString() })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TransmissionLog — bottom-left live feed (unchanged logic)
══════════════════════════════════════════════════════════ */
function TransmissionLog({ extra }: { extra: string[] }) {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLogs((prev) => {
        const idx = LOG_MESSAGE_INDEXES[Math.floor(Math.random() * LOG_MESSAGE_INDEXES.length)];
        return [
          i18n.t(`wealthBeacon.logMessages.${idx}`),
          ...prev,
        ].slice(0, 5);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const merged = useMemo(() => {
    const base = [...extra, ...logs];
    return base.slice(0, 6);
  }, [extra, logs]);

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px))",
      left: 16, maxWidth: 300, pointerEvents: "none", zIndex: 15,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <AnimatePresence mode="popLayout">
          {merged.map((log, i) => (
            <motion.div
              key={`${log}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1 - i * 0.12, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              style={{
                fontSize: 8,
                fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: i === 0 ? `rgba(212,175,55,0.8)` : `rgba(212,175,55,0.45)`,
              }}
            >
              {i === 0 && (
                <span style={{ color: CYAN, marginRight: 4 }}>▶</span>
              )}
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Sidebar — upgraded with hover tooltips
══════════════════════════════════════════════════════════ */
const SIDEBAR_ITEMS = [
  { Icon: Zap,      key: "energy" as const },
  { Icon: Shield,   key: "protection" as const },
  { Icon: Waves,    key: "frequency" as const },
  { Icon: Activity, key: "vitality" as const },
  { Icon: Eye,      key: "thirdEye" as const },
  { Icon: Infinity, key: "akasha" as const },
];

function Sidebar({ onSelect }: { onSelect?: (key: (typeof SIDEBAR_ITEMS)[number]["key"]) => void }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 48,
      borderRight: "1px solid rgba(212,175,55,0.1)",
      display: "flex", flexDirection: "column",
      alignItems: "center", paddingTop: 88, gap: 24, zIndex: 18,
      background: "rgba(46,8,84,0.12)",
      backdropFilter: "blur(20px)",
    }}>
      {/* Logo mark */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid rgba(212,175,55,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: GOLD, boxShadow: `0 0 12px rgba(212,175,55,0.2)`,
      }}>
        <Cpu size={18} />
      </div>

      {/* Icon buttons */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        {SIDEBAR_ITEMS.map(({ Icon, key }, i) => (
          <div key={key} style={{ position: "relative" }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => onSelect?.(key)}
              style={{
                color: hovered === i ? GOLD : "rgba(255,255,255,0.28)",
                background: "none", border: "none",
                cursor: "pointer", padding: 4,
                transition: "color 0.2s",
                filter: hovered === i ? `drop-shadow(0 0 6px ${GOLD})` : "none",
              }}
            >
              <Icon size={16} />
            </motion.button>
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  style={{
                    position: "absolute", left: 44, top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(5,5,5,0.95)",
                    border: `1px solid rgba(212,175,55,0.25)`,
                    borderRadius: 6, padding: "4px 8px",
                    fontSize: 8, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: GOLD,
                    whiteSpace: "nowrap", pointerEvents: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {t(`wealthBeacon.sidebar.${key}`)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div style={{
        color: "rgba(212,175,55,0.3)", fontSize: 7,
        writingMode: "vertical-rl", transform: "rotate(180deg)",
        letterSpacing: "0.35em", textTransform: "uppercase",
        paddingBottom: 24,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {t("wealthBeacon.sidebarArchive")}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Ticker — horizontal scrolling light-code strip
══════════════════════════════════════════════════════════ */
function VedicTicker() {
  const { t } = useTranslation();
  const items = useMemo(
    () => TICKER_INDEXES.map((idx) => t(`wealthBeacon.ticker.${idx}`)),
    [t]
  );
  const doubled = useMemo(() => [...items, ...items], [items]);
  return (
    <div style={{
      position: "fixed", top: 0, left: 48, right: 0,
      height: 28, overflow: "hidden", zIndex: 30,
      borderBottom: "1px solid rgba(212,175,55,0.1)",
      background: "rgba(5,5,5,0.85)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center",
    }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        style={{ display: "flex", gap: 64, whiteSpace: "nowrap" }}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{
            fontSize: 8, fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: i % 3 === 0 ? GOLD : i % 3 === 1 ? CYAN : "rgba(255,255,255,0.35)",
          }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SQI Status Chips — four live stat badges
══════════════════════════════════════════════════════════ */
function StatusChips() {
  const { t } = useTranslation();
  const [hz, setHz] = useState(432.0);
  useEffect(() => {
    const iv = setInterval(() => {
      setHz(() => parseFloat((432 + (Math.random() - 0.5) * 0.6).toFixed(2)));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const chips = [
    { label: t("wealthBeacon.chipNadi"),     value: t("wealthBeacon.chipNadiValue"), color: GOLD  },
    { label: t("wealthBeacon.chipResonance"), value: `${hz}Hz`,                    color: CYAN  },
    { label: t("wealthBeacon.chipTier"),     value: t("wealthBeacon.chipTierValue"), color: VIOLET },
    { label: t("wealthBeacon.chipSync"),    value: t("wealthBeacon.chipSyncValue"), color: GOLD  },
  ];

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10,
      justifyContent: "center", marginBottom: 32,
    }}>
      {chips.map(({ label, value, color }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + i * 0.1 }}
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(20px)",
            border: `1px solid rgba(255,255,255,0.05)`,
            borderRadius: 999, padding: "6px 14px",
            display: "flex", flexDirection: "column", alignItems: "center",
            minWidth: 80,
          }}
        >
          <span style={{
            fontSize: 7, letterSpacing: "0.4em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
          }}>
            {label}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 800, color,
            fontFamily: "'Plus Jakarta Sans', monospace",
            textShadow: `0 0 8px ${color}55`,
          }}>
            {value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Sacred Geometry SVG ring (behind headline)
══════════════════════════════════════════════════════════ */
function SacredRing() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420, height: 420,
        pointerEvents: "none", zIndex: 0, opacity: 0.12,
      }}
    >
      <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
        <circle cx="210" cy="210" r="190" fill="none" stroke={GOLD} strokeWidth="0.5" strokeDasharray="6 4"/>
        <circle cx="210" cy="210" r="155" fill="none" stroke={VIOLET} strokeWidth="0.5" strokeDasharray="3 7"/>
        <circle cx="210" cy="210" r="120" fill="none" stroke={GOLD} strokeWidth="0.5"/>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = 210 + Math.cos(angle) * 190;
          const y = 210 + Math.sin(angle) * 190;
          return <circle key={i} cx={x} cy={y} r="3" fill={GOLD} opacity="0.6"/>;
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const a1 = (i / 6) * Math.PI * 2;
          const a2 = ((i + 2) / 6) * Math.PI * 2;
          return (
            <line key={i}
              x1={210 + Math.cos(a1) * 155} y1={210 + Math.sin(a1) * 155}
              x2={210 + Math.cos(a2) * 155} y2={210 + Math.sin(a2) * 155}
              stroke={GOLD} strokeWidth="0.5" opacity="0.5"
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   HUD Bar — bottom status strip
══════════════════════════════════════════════════════════ */
function HudBar() {
  const { t } = useTranslation();
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
      left: 56, right: 16,
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-end", zIndex: 12,
    }}>
      {/* Left — EQ bars + label */}
      <div>
        <div style={{ display: "flex", gap: 3, marginBottom: 6, alignItems: "flex-end" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [3, 6 + i * 1.5, 3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.07 }}
              style={{
                width: 3,
                background: i > 7
                  ? `rgba(34,211,238,0.5)`
                  : i > 4
                  ? `rgba(157,80,187,0.5)`
                  : `rgba(212,175,55,0.45)`,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
        <div style={{
          fontSize: 7, fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "rgba(212,175,55,0.45)",
        }}>
          {t("wealthBeacon.hudResonance")}
        </div>
      </div>

      {/* Right — Avataric sync progress */}
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontSize: 7, fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)", marginBottom: 5,
        }}>
          {t("wealthBeacon.hudAvataric")}
        </div>
        <div style={{
          width: 180, height: 4, marginLeft: "auto",
          background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: "0%" }} animate={{ width: "88%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${VIOLET}, ${GOLD})`,
              borderRadius: 999,
              boxShadow: `0 0 8px rgba(212,175,55,0.4)`,
            }}
          />
        </div>
        <div style={{
          fontSize: 7, fontFamily: "'Plus Jakarta Sans', ui-monospace, monospace",
          letterSpacing: "0.2em", color: GOLD, marginTop: 3, textAlign: "right",
        }}>
          {t("wealthBeacon.hudCoherence")}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════ */
export default function WealthBeacon() {
  const { t } = useTranslation();
  const navigate   = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin }       = useAdminRole();
  const [initialized, setInitialized]     = useState(false);
  const [geminiBusy, setGeminiBusy]       = useState(false);
  const [transmissionExtras, setTransmissionExtras] = useState<string[]>([]);

  /* Multi-color particles */
  const particles = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 12 + 10,
      color: [GOLD, VIOLET, CYAN][i % 3],
      size: Math.random() * 2 + 1.5,
    })),
    []
  );

  /* ── Tier guard (unchanged) ── */
  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    const t = window.setTimeout(() => setInitialized(true), 800);
    return () => clearTimeout(t);
  }, []);

  /* ── Gemini call (unchanged logic) ── */
  const initiateLightCodes = useCallback(async () => {
    setGeminiBusy(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setTransmissionExtras((e) =>
        [i18n.t("wealthBeacon.extraOffline"), ...e].slice(0, 4)
      );
      toast.message(i18n.t("wealthBeacon.toastGeminiTitle"), {
        description: i18n.t("wealthBeacon.toastGeminiDesc"),
      });
      setGeminiBusy(false);
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `You are the Siddha-Quantum Wealth Beacon 2050. Reply in 2–3 short poetic sentences only (no JSON, no markdown) describing one abundance / Lakshmi-aligned light-code transmission for the seeker right now.`,
          }],
        }],
      });
      const raw =
        (response as { text?: string }).text ??
        response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? "";
      const text = String(raw).trim();
      if (text) {
        setTransmissionExtras((e) =>
          [i18n.t("wealthBeacon.extraGeminiPrefix", { text }), ...e].slice(0, 4)
        );
        toast.success(i18n.t("wealthBeacon.toastTransmissionOk"));
      }
    } catch {
      toast.error(i18n.t("wealthBeacon.toastTransmissionFail"));
    } finally {
      setGeminiBusy(false);
    }
  }, []);

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <style>{FONT_STYLE}</style>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontFamily: "'Plus Jakarta Sans', monospace",
            fontSize: 10, letterSpacing: "0.5em",
            textTransform: "uppercase", color: GOLD,
          }}
        >
          {t("wealthBeacon.loading")}
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", minHeight: "100vh",
      background: BG, overflow: "hidden",
      color: "rgba(255,255,255,0.9)",
      paddingBottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
    }}>
      {/* Font injection */}
      <style>{FONT_STYLE}</style>

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* 3-D Quantum Beacon canvas */}
      <QuantumBeacon />

      {/* Radial gold ambient */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.12,
        mixBlendMode: "overlay",
        background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.3), transparent 70%)",
        zIndex: 1,
      }} />

      {/* ─── Fixed chrome ─── */}
      <VedicTicker />
      <NadiScan />
      <Sidebar
        onSelect={(key) =>
          toast.message(t(`wealthBeacon.sidebar.${key}`), {
            description: t("wealthBeacon.sidebarToastDesc"),
          })
        }
      />
      <TransmissionLog extra={transmissionExtras} />
      <HudBar />

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/siddha-portal")}
        style={{
          position: "relative", zIndex: 25,
          marginTop: 42, marginLeft: 64,
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(5,5,5,0.5)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: 999, padding: "8px 16px",
          color: "rgba(212,175,55,0.85)",
          fontSize: 9, fontWeight: 800,
          letterSpacing: "0.25em", textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <ArrowLeft size={13} /> {t("wealthBeacon.backPortal")}
      </button>

      {/* ─── MAIN HERO ─── */}
      <main style={{
        position: "relative", zIndex: 10,
        minHeight: "70vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 24px 0 64px",
        textAlign: "center",
      }}>
        <AnimatePresence>
          {initialized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ maxWidth: 680, width: "100%", position: "relative" }}
            >
              {/* Sacred geometry ring */}
              <SacredRing />

              {/* Glass card */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 40,
                padding: "48px 40px",
                position: "relative",
                zIndex: 1,
                boxShadow: `0 0 60px rgba(212,175,55,0.06), 0 0 120px rgba(157,80,187,0.04)`,
              }}>

                {/* Version badge */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  style={{
                    display: "inline-block", marginBottom: 24,
                    padding: "6px 16px", borderRadius: 999,
                    border: "1px solid rgba(212,175,55,0.22)",
                    background: "rgba(212,175,55,0.06)",
                    fontSize: 8, letterSpacing: "0.4em",
                    textTransform: "uppercase", color: GOLD,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800,
                  }}
                >
                  {t("wealthBeacon.badge")}
                </motion.div>

                {/* Headline */}
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(2.8rem, 10vw, 5rem)",
                  fontWeight: 300, letterSpacing: "-0.03em",
                  marginBottom: 8, lineHeight: 1,
                  textShadow: `0 0 30px rgba(212,175,55,0.3)`,
                }}>
                  {t("wealthBeacon.headlineWealth")}{" "}
                  <em style={{ fontStyle: "italic", color: VIOLET }}>{t("wealthBeacon.headlineBeacon")}</em>
                </h1>

                {/* Sanskrit subtitle */}
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(1rem, 3vw, 1.3rem)",
                  color: `rgba(212,175,55,0.6)`,
                  letterSpacing: "0.15em",
                  marginBottom: 28,
                  fontStyle: "italic",
                }}>
                  {t("wealthBeacon.sanskritSubtitle")}
                </div>

                {/* Body text */}
                <p style={{
                  fontSize: "clamp(0.9rem, 3vw, 1.05rem)",
                  color: "rgba(255,255,255,0.52)",
                  fontWeight: 400, lineHeight: 1.7,
                  marginBottom: 32,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {t("wealthBeacon.bodyLead")}{" "}
                  <span style={{ color: GOLD }}>{t("wealthBeacon.bodyAkasha")}</span>.
                  {" "}{t("wealthBeacon.bodyMid1")}{" "}
                  <span style={{ color: GOLD }}>{t("wealthBeacon.bodyBhakti")}</span>{" "}
                  {t("wealthBeacon.bodyAnd")}{" "}
                  <span style={{ color: VIOLET }}>{t("wealthBeacon.bodyPrema")}</span>{" "}
                  {t("wealthBeacon.bodyMid2")}{" "}
                  <span style={{ color: CYAN }}>{t("wealthBeacon.bodyMatrix")}</span>
                  {t("wealthBeacon.bodyPeriod")}
                </p>

                {/* Status chips */}
                <StatusChips />

                {/* CTA Buttons */}
                <div style={{
                  display: "flex", flexWrap: "wrap",
                  justifyContent: "center", gap: 16,
                }}>
                  {/* Primary — Initiate Light Codes */}
                  <motion.button
                    type="button"
                    disabled={geminiBusy}
                    whileHover={{ scale: 1.04, boxShadow: `0 0 40px rgba(212,175,55,0.5)` }}
                    whileTap={{ scale: 0.96 }}
                    onClick={initiateLightCodes}
                    style={{
                      padding: "16px 28px",
                      background: `linear-gradient(135deg, ${GOLD}, #b8922a)`,
                      color: "#1A0A2E",
                      fontWeight: 900,
                      fontSize: 9, letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      border: "none", borderRadius: 4,
                      cursor: geminiBusy ? "wait" : "pointer",
                      display: "inline-flex", alignItems: "center", gap: 10,
                      boxShadow: `0 0 24px rgba(212,175,55,0.3)`,
                      opacity: geminiBusy ? 0.7 : 1,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "box-shadow 0.3s",
                    }}
                  >
                    {geminiBusy ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ display: "inline-block" }}
                        >
                          ◈
                        </motion.span>
                        {t("wealthBeacon.ctaTransmitting")}
                      </>
                    ) : (
                      <>
                        {t("wealthBeacon.ctaInitiate")}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </motion.button>

                  {/* Secondary — Prema Pulse */}
                  <motion.button
                    type="button"
                    whileHover={{
                      scale: 1.04,
                      backgroundColor: "rgba(157,80,187,0.15)",
                      boxShadow: `0 0 32px rgba(157,80,187,0.4)`,
                    }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() =>
                      toast.message(t("wealthBeacon.toastPremaTitle"), {
                        description: t("wealthBeacon.toastPremaDesc"),
                      })
                    }
                    style={{
                      padding: "16px 28px",
                      border: "1px solid rgba(157,80,187,0.5)",
                      color: VIOLET, fontWeight: 800,
                      fontSize: 9, letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      background: "transparent", borderRadius: 4,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 10,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.3s",
                    }}
                  >
                    <Lock size={15} />
                    {t("wealthBeacon.ctaPrema")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Multi-color particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              filter: `blur(1.5px) drop-shadow(0 0 3px ${p.color})`,
            }}
            animate={{
              y: [0, -90 - (p.id % 5) * 12, 0],
              x: [0, (p.id % 2 === 0 ? 1 : -1) * (18 + (p.id % 4) * 6), 0],
              opacity: [0.12, 0.62, 0.12],
              scale: [1, 1.35, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.id * 0.08,
            }}
          />
        ))}
      </div>
    </div>
  );
}
