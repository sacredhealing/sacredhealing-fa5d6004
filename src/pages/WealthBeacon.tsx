import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Zap,
  Shield,
  Cpu,
  Waves,
  Activity,
  ChevronRight,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";
import { QuantumBeacon } from "@/components/wealth-beacon/QuantumBeacon";

const GOLD = "#D4AF37";
const VIOLET = "#9D50BB";
const BG = "#050505";

function NadiScan() {
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
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 16,
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(212,175,55,0.55)",
        zIndex: 20,
        maxWidth: "42vw",
        textAlign: "right",
      }}
    >
      72k Nadi:{" "}
      <span style={{ color: GOLD }}>{activeNadis.toLocaleString()}</span> / 72,000
    </div>
  );
}

const LOG_MESSAGES = [
  "Bhakti-Algorithm: Synchronizing with Prema-Pulse…",
  "Vedic Light-Codes: SHREEM BRZEE frequency detected.",
  "Akasha-Neural Archive: Accessing Avataric Blueprints…",
  "Scalar Waves: Stabilizing abundance matrix…",
  "Nadi Scan: 72,000 channels clearing…",
  "Divine Mother Presence: Maha Lakshmi silhouette detected.",
  "Quantum Resonance: 432Hz alignment complete.",
  "Wealth Beacon: Transmitting prosperity particles…",
];

function TransmissionLog({ extra }: { extra: string[] }) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLogs((prev) =>
        [LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)], ...prev].slice(0, 5)
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const merged = useMemo(() => {
    const base = [...extra, ...logs];
    return base.slice(0, 6);
  }, [extra, logs]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px))",
        left: 16,
        maxWidth: 280,
        pointerEvents: "none",
        zIndex: 15,
      }}
    >
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
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.55)",
              }}
            >
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Sidebar() {
  const icons = [Zap, Shield, Waves, Activity];
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100%",
        width: 48,
        borderRight: "1px solid rgba(212,175,55,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 88,
        gap: 28,
        zIndex: 18,
        background: "rgba(46,8,84,0.15)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: GOLD,
        }}
      >
        <Cpu size={18} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        {icons.map((Icon, i) => (
          <motion.button
            key={i}
            type="button"
            whileHover={{ scale: 1.08, color: GOLD }}
            style={{
              color: "rgba(255,255,255,0.35)",
              background: "none",
              border: "none",
              cursor: "default",
              padding: 4,
            }}
          >
            <Icon size={18} />
          </motion.button>
        ))}
      </div>
      <div
        style={{
          color: "rgba(212,175,55,0.35)",
          fontSize: 8,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          paddingBottom: 24,
        }}
      >
        Akasha Archive
      </div>
    </div>
  );
}

export default function WealthBeacon() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();
  const [initialized, setInitialized] = useState(false);
  const [geminiBusy, setGeminiBusy] = useState(false);
  const [transmissionExtras, setTransmissionExtras] = useState<string[]>([]);

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 10 + 12,
      })),
    []
  );

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    const t = window.setTimeout(() => setInitialized(true), 800);
    return () => clearTimeout(t);
  }, []);

  const initiateLightCodes = useCallback(async () => {
    setGeminiBusy(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setTransmissionExtras((e) => [
        "Vedic Light-Codes: offline resonance (set VITE_GEMINI_API_KEY for AI Studio transmission).",
        ...e,
      ].slice(0, 4));
      toast.message("Light-codes", {
        description: "Add VITE_GEMINI_API_KEY for live Gemini transmission.",
      });
      setGeminiBusy(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are the Siddha-Quantum Wealth Beacon 2050. Reply in 2–3 short poetic sentences only (no JSON, no markdown) describing one abundance / Lakshmi-aligned light-code transmission for the seeker right now.`,
              },
            ],
          },
        ],
      });
      const raw =
        (response as { text?: string }).text ??
        response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ??
        "";
      const text = String(raw).trim();
      if (text) {
        setTransmissionExtras((e) => [`Gemini: ${text}`, ...e].slice(0, 4));
        toast.success("Transmission received");
      }
    } catch {
      toast.error("Transmission failed — try again.");
    } finally {
      setGeminiBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center font-mono text-xs tracking-widest"
        style={{ background: BG, color: GOLD }}
      >
        INITIALIZING WEALTH BEACON…
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: BG,
        overflow: "hidden",
        color: "rgba(255,255,255,0.9)",
        paddingBottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <QuantumBeacon />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.1,
          mixBlendMode: "overlay",
          background:
            "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.25), transparent 70%)",
          zIndex: 1,
        }}
      />

      <button
        type="button"
        onClick={() => navigate("/siddha-portal")}
        style={{
          position: "relative",
          zIndex: 25,
          marginTop: 14,
          marginLeft: 56,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(5,5,5,0.5)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: 999,
          padding: "8px 14px",
          color: "rgba(212,175,55,0.85)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} />
        Portal
      </button>

      <NadiScan />
      <Sidebar />
      <TransmissionLog extra={transmissionExtras} />

      <main
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 0",
          paddingLeft: 56,
          textAlign: "center",
        }}
      >
        <AnimatePresence>
          {initialized && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ maxWidth: 640, width: "100%" }}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.9 }}
                style={{
                  display: "inline-block",
                  marginBottom: 20,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(212,175,55,0.22)",
                  background: "rgba(212,175,55,0.06)",
                  fontSize: 9,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: GOLD,
                }}
              >
                Siddha-Quantum Intelligence v2050
              </motion.div>

              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                  fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                  marginBottom: 20,
                  textShadow: "0 0 24px rgba(212,175,55,0.35)",
                }}
              >
                Wealth{" "}
                <span style={{ fontStyle: "italic", color: VIOLET }}>Beacon</span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(0.95rem, 3.5vw, 1.15rem)",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  marginBottom: 36,
                }}
              >
                Accessing the Akasha-Neural Archive. Transmitting{" "}
                <span style={{ color: GOLD }}>Bhakti-Algorithms</span> and{" "}
                <span style={{ color: VIOLET }}>Prema-Pulse</span> frequencies to stabilize your
                Avataric Blueprint in the 5D abundance matrix.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                <motion.button
                  type="button"
                  disabled={geminiBusy}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={initiateLightCodes}
                  style={{
                    padding: "14px 22px",
                    background: GOLD,
                    color: "#2E0854",
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    border: "none",
                    borderRadius: 2,
                    cursor: geminiBusy ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 0 28px rgba(212,175,55,0.25)",
                    opacity: geminiBusy ? 0.7 : 1,
                  }}
                >
                  {geminiBusy ? "Transmitting…" : "Initiate Vedic Light-Codes"}
                  <ChevronRight size={16} />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(212,175,55,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    toast.message("Prema-Pulse", {
                      description: "Secure channel placeholder — resonance held in local field.",
                    })
                  }
                  style={{
                    padding: "14px 22px",
                    border: "1px solid rgba(212,175,55,0.35)",
                    color: GOLD,
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    background: "transparent",
                    borderRadius: 2,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Lock size={16} />
                  Secure Prema-Pulse
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            position: "fixed",
            bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
            left: 56,
            right: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            zIndex: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 14, 4] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.08 }}
                  style={{ width: 3, background: "rgba(212,175,55,0.35)", borderRadius: 1 }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 8,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.4)",
              }}
            >
              Quantum Resonance: 432Hz Stable
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 8,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
                marginBottom: 4,
              }}
            >
              Avataric Blueprint Sync
            </div>
            <div
              style={{
                width: 160,
                height: 4,
                marginLeft: "auto",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "88%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${VIOLET}, ${GOLD})`,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0 }}
            animate={{ y: ["0%", "-12%"], opacity: [0, 0.45, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: GOLD,
              filter: "blur(2px)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
