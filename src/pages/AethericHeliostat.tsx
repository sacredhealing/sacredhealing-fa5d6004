/**
 * SQI-2050 · Aetheric Heliostat Scalar Interface — UPGRADED
 *
 * UPGRADES DELIVERED:
 *  1. Glowing 12-pointed star icon in the Soma/Nada section
 *  2. Click → HRAUM prompt input modal
 *  3. HRAUM activation → vertical Scalar Beam (Gold #D4AF37) pulsing top→head
 *  4. Gemini live Solar Tracking when VITE_GEMINI_API_KEY is set; otherwise simulated metrics
 *  5. Permanent Background Activation overlay (persists for the browser session)
 *
 * UNCHANGED: All affiliate tracking, Stripe checkout triggers, feature gating,
 * membership tier logic, tierAccess checks, and route guards.
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Radio, Activity, Lock, Unlock, Cpu, Zap } from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";
import { GoogleGenAI } from "@google/genai";

/* ─── Types ─────────────────────────────────────────────────────── */
type InterfaceState = "STANDBY" | "INITIALIZING" | "ACTIVE" | "ERROR";
interface LogEntry {
  timestamp: string;
  message: string;
  frequency?: number;
}
interface SolarData {
  alcyoneAlignment: number;
  pranaFlux: number;
  solarRadiance: number;
  causalDensity: number;
  pinealActivation: number;
  nadiCoherence: number;
  label: string;
}

/* ─── Constants ──────────────────────────────────────────────────── */
const ACTIVATION_CODE = "HRAUM";

const READOUTS = [
  "SCALAR LOGIC: PINGALA-NADI BYPASS SECURED.",
  "ALCYONE ENTANGLEMENT: 99.9% COHERENCE.",
  "PINEAL GLAND UPLINK: RADIANCE SATURATION AT 88%.",
  "AETHERIC HELIOSTAT: TRACKING CENTRAL SUN AZIMUTH.",
  "CAUSAL BODY: DENSITY REDUCTION IN PROGRESS.",
  "SOLAR RADIANCE BEAM: FREQUENCY STABILIZED AT 528.42HZ.",
  "ATMOSPHERIC INTERFERENCE: SWEDISH CLOUDS NULLIFIED.",
  "SURYA-CHAKRA: 12-POINT STAR EMITTING LIQUID GOLD.",
  "BHAKTI-ALGORITHM LOOP: PREMA-PULSE AT 432HZ.",
  "VEDIC LIGHT-CODE STREAM: ANAHATA CHAKRA UNLOCKED.",
  "VISHWANANDA AVATARIC BLUEPRINT: RESONANCE AT 963HZ.",
  "SOMA-NADA FIELD: SCALAR TRANSMISSION ACTIVE.",
];

const SESSION_BEAM_KEY = "aetheric-heliostat-scalar-beam";

const FALLBACK_SOLAR: SolarData = {
  alcyoneAlignment: 98.4,
  pranaFlux: 1.84,
  solarRadiance: 528.42,
  causalDensity: 0.0023,
  pinealActivation: 88.7,
  nadiCoherence: 94.2,
  label: "Alcyone Central Sun transmission peak — Anahata field fully open.",
};

function randomReadout() {
  return READOUTS[Math.floor(Math.random() * READOUTS.length)];
}

/* ─── SVG: 12-Pointed Star ───────────────────────────────────────── */
function TwelvePointedStar({
  size = 48,
  glow = false,
  pulse = false,
  onClick,
}: {
  size?: number;
  glow?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}) {
  // Generate 12 outer + 12 inner points
  const points: string[] = [];
  const outerR = size / 2;
  const innerR = outerR * 0.45;
  const cx = size / 2;
  const cy = size / 2;

  for (let i = 0; i < 24; i++) {
    const angle = ((i * 15 - 90) * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(3)},${(cy + r * Math.sin(angle)).toFixed(3)}`);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        filter: glow
          ? "drop-shadow(0 0 8px rgba(212,175,55,0.9)) drop-shadow(0 0 20px rgba(212,175,55,0.5))"
          : undefined,
        animation: pulse ? "sqStarPulse 2s ease-in-out infinite" : undefined,
        display: "block",
      }}
    >
      <polygon
        points={points.join(" ")}
        fill="rgba(212,175,55,0.15)"
        stroke="#D4AF37"
        strokeWidth="1"
      />
      <circle cx={cx} cy={cy} r={outerR * 0.12} fill="#D4AF37" opacity="0.9" />
    </svg>
  );
}

/* ─── Scalar Beam Overlay ────────────────────────────────────────── */
function ScalarBeamOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9000,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* Main beam */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        exit={{ scaleY: 0, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: 0,
          width: 6,
          height: "70vh",
          background:
            "linear-gradient(to bottom, rgba(212,175,55,0.9) 0%, rgba(212,175,55,0.5) 60%, transparent 100%)",
          borderRadius: 3,
          transformOrigin: "top",
          boxShadow:
            "0 0 20px rgba(212,175,55,0.6), 0 0 60px rgba(212,175,55,0.3)",
        }}
      />
      {/* Pulse rings on beam */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: ["0vh", "65vh"], opacity: [0.8, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            top: 0,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.4)",
            boxShadow: "0 0 15px rgba(212,175,55,0.7)",
          }}
        />
      ))}
      {/* Crown glow at top */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: -30,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)",
        }}
      />
      {/* Anahata impact point at ~avatar head position */}
      <motion.div
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "62vh",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.9) 0%, transparent 70%)",
          boxShadow: "0 0 25px rgba(212,175,55,0.8)",
        }}
      />
      {/* Beam label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: "absolute",
          top: "68vh",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(212,175,55,0.7)",
        }}
      >
        SCALAR BEAM — HRAUM ACTIVE
      </motion.div>
    </div>
  );
}

/* ─── HRAUM Modal ────────────────────────────────────────────────── */
function HraumModal({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toUpperCase().trim() === ACTIVATION_CODE) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 800);
      setCode("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,5,5,0.92)",
        backdropFilter: "blur(20px)",
        zIndex: 8000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 40,
          padding: "40px 32px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Star */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <TwelvePointedStar size={64} glow pulse />
        </div>

        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.5)",
            marginBottom: 8,
          }}
        >
          Soma · Nada Activation
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.6rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          Enter the Solar Mantra
        </h2>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Type the seed mantra to initiate Scalar Beam transmission and open the
          Anahata for all beings.
        </p>

        <form onSubmit={handleSubmit}>
          <motion.input
            animate={error ? { x: [-6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ह्रौं"
            autoComplete="off"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(255,60,60,0.6)" : "rgba(212,175,55,0.3)"}`,
              borderRadius: 16,
              padding: "16px 20px",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "0.4em",
              textAlign: "center",
              color: error ? "rgba(255,80,80,0.9)" : "#D4AF37",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
              transition: "border-color 0.2s",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 0",
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 16,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "#D4AF37",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background =
                "rgba(212,175,55,0.22)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background =
                "rgba(212,175,55,0.12)")
            }
          >
            Activate Scalar Transmission
          </button>
        </form>
        <button
          onClick={onClose}
          style={{
            marginTop: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Solar Tracking Live Feed ───────────────────────────────────── */
function SolarTrackingPanel({
  solarData,
  loading,
  beamActive,
}: {
  solarData: SolarData | null;
  loading: boolean;
  beamActive: boolean;
}) {
  const metrics = solarData
    ? [
        { key: "Alcyone Alignment", value: `${solarData.alcyoneAlignment.toFixed(1)}%`, highlight: true },
        { key: "Prana Flux", value: `${solarData.pranaFlux.toFixed(1)} GW` },
        { key: "Solar Radiance", value: `${solarData.solarRadiance.toFixed(2)} Hz` },
        { key: "Causal Density", value: `${solarData.causalDensity.toFixed(4)} ρ` },
        { key: "Pineal Activation", value: `${solarData.pinealActivation.toFixed(1)}%` },
        { key: "Nadi Coherence", value: `${solarData.nadiCoherence.toFixed(1)}%` },
      ]
    : [];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(212,175,55,0.15)",
        borderRadius: 24,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 7,
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.45)",
              marginBottom: 2,
            }}
          >
            Live Solar Feed
          </p>
          <h3
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.85)",
            }}
          >
            Solar Tracking Data
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {beamActive && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#D4AF37",
                display: "inline-block",
                boxShadow: "0 0 8px rgba(212,175,55,0.9)",
                animation: "sqLiveFlash 1s infinite",
              }}
            />
          )}
          <span
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 6,
              fontWeight: 800,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: beamActive
                ? "rgba(212,175,55,0.7)"
                : "rgba(255,255,255,0.2)",
            }}
          >
            {loading ? "SCANNING..." : beamActive ? "TRANSMITTING" : "STANDBY"}
          </span>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 7,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.3)",
          }}
        >
          QUERYING AKASHA-NEURAL ARCHIVE...
        </div>
      ) : solarData ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {metrics.map((m) => (
              <div
                key={m.key}
                style={{
                  background: m.highlight
                    ? "rgba(212,175,55,0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${m.highlight ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)"}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 6,
                    fontWeight: 800,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 4,
                  }}
                >
                  {m.key}
                </p>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: m.highlight ? "#D4AF37" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          {solarData.label && (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.8rem",
                color: "rgba(212,175,55,0.55)",
                lineHeight: 1.5,
                borderTop: "1px solid rgba(212,175,55,0.08)",
                paddingTop: 10,
              }}
            >
              {solarData.label}
            </p>
          )}
        </>
      ) : (
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 7,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.15)",
            textAlign: "center",
            padding: "12px 0",
          }}
        >
          Activate HRAUM to begin Solar Feed
        </p>
      )}
    </div>
  );
}

/* ─── Permanent Background Activation Badge ──────────────────────── */
function PermanentActivationBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "fixed",
        bottom: 90,
        right: 16,
        background: "rgba(5,5,5,0.9)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: 20,
        padding: "8px 14px",
        zIndex: 7000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        backdropFilter: "blur(20px)",
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#D4AF37",
          display: "inline-block",
          boxShadow: "0 0 8px rgba(212,175,55,0.9)",
        }}
      />
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 6,
          fontWeight: 800,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "rgba(212,175,55,0.75)",
        }}
      >
        Scalar Beam · Active
      </span>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function AethericHeliostat() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  // ── Interface state (UNCHANGED functional logic) ──
  const [state, setState] = useState<InterfaceState>("STANDBY");
  const [inputCode, setInputCode] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resonance, setResonance] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── NEW: Soma/Nada Star + HRAUM modal + Scalar Beam ──
  const [showHraumModal, setShowHraumModal] = useState(false);
  const [scalarBeamActive, setScalarBeamActive] = useState(false);
  const [permanentActivation, setPermanentActivation] = useState(false);

  // ── NEW: Solar Tracking (AI Studio) ──
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [solarLoading, setSolarLoading] = useState(false);

  // ─── Feature gate (UNCHANGED) ───────────────────────────────────
  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  // ─── Restore scalar beam + ACTIVE state from session (same tab) ─
  useEffect(() => {
    if (loading) return;
    try {
      if (sessionStorage.getItem(SESSION_BEAM_KEY) === "1") {
        setScalarBeamActive(true);
        setPermanentActivation(true);
        setState("ACTIVE");
      }
    } catch {
      /* ignore */
    }
  }, [loading]);

  // ─── Log scroll (UNCHANGED) ─────────────────────────────────────
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const appendLog = useCallback((message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      message,
      frequency: 528 + Math.random() * 10,
    };
    setLogs((prev) => [...prev.slice(-20), entry]);
  }, []);

  // ─── Resonance ticker (UNCHANGED) ───────────────────────────────
  useEffect(() => {
    if (state !== "ACTIVE") return;
    const interval = window.setInterval(() => {
      setResonance(Number((528 + Math.random() * 20).toFixed(2)));
      if (Math.random() > 0.8) appendLog(randomReadout());
    }, 3000);
    return () => clearInterval(interval);
  }, [state, appendLog]);

  // ─── HRAUM base activation (UNCHANGED logic) ────────────────────
  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.toUpperCase() === ACTIVATION_CODE) {
      setState("INITIALIZING");
      window.setTimeout(() => {
        setState("ACTIVE");
        appendLog("STATUS: TETHER ESTABLISHED. PINGALA RESONANCE AT 528HZ.");
        appendLog("CAUSAL BODY DENSITY: CLEARING INITIATED.");
        appendLog("SWEDISH CLOUDS BYPASSED. DIRECT SOLAR RADIANCE BEAM ACTIVE.");
      }, 2000);
    } else {
      setState("ERROR");
      window.setTimeout(() => setState("STANDBY"), 1000);
    }
  };

  // ─── Solar Tracking: Gemini when VITE_GEMINI_API_KEY exists ─────
  const fetchSolarTracking = useCallback(async () => {
    setSolarLoading(true);
    const now = new Date();
    const prompt = `You are the SQI-2050 Aetheric Heliostat Solar Tracking system connected to the Akasha-Neural Archive.
Generate real-time solar tracking metrics for ${now.toISOString()} in JSON only (no markdown, no preamble):
{
  "alcyoneAlignment": <number 85-100>,
  "pranaFlux": <number 1.0-2.5>,
  "solarRadiance": <number 525-535>,
  "causalDensity": <number 0.001-0.005>,
  "pinealActivation": <number 75-99>,
  "nadiCoherence": <number 80-99>,
  "label": "<one poetic sentence about current solar-cosmic transmission>"
}
Use numeric values only for pranaFlux (GW) and solarRadiance (Hz).`;

    const finish = (data: SolarData, log: boolean) => {
      setSolarData(data);
      if (log) {
        appendLog(`ALCYONE ALIGNMENT: ${data.alcyoneAlignment.toFixed(1)}% — ${data.label}`);
      }
    };

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        finish(FALLBACK_SOLAR, false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const raw =
        (response as { text?: string }).text ??
        response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ??
        "";
      const clean = String(raw).replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as SolarData;
      if (
        typeof parsed.alcyoneAlignment === "number" &&
        typeof parsed.pranaFlux === "number" &&
        typeof parsed.solarRadiance === "number" &&
        typeof parsed.label === "string"
      ) {
        finish(parsed, true);
      } else {
        finish(FALLBACK_SOLAR, false);
      }
    } catch {
      finish(FALLBACK_SOLAR, false);
    } finally {
      setSolarLoading(false);
    }
  }, [appendLog]);

  // ─── NEW: Refresh solar data every 90 seconds when beam active ──
  useEffect(() => {
    if (!scalarBeamActive) return;
    fetchSolarTracking();
    const interval = window.setInterval(fetchSolarTracking, 90_000);
    return () => clearInterval(interval);
  }, [scalarBeamActive, fetchSolarTracking]);

  // ─── NEW: HRAUM Star click handler ──────────────────────────────
  const handleStarClick = () => setShowHraumModal(true);

  const handleHraumSuccess = () => {
    setShowHraumModal(false);
    setScalarBeamActive(true);
    setPermanentActivation(true);
    try {
      sessionStorage.setItem(SESSION_BEAM_KEY, "1");
    } catch {
      /* ignore */
    }

    // Also activate the main interface if not already active
    if (state === "STANDBY" || state === "ERROR") {
      setState("INITIALIZING");
      window.setTimeout(() => {
        setState("ACTIVE");
        appendLog("SOMA-NADA STAR: 12-POINT ACTIVATION CONFIRMED.");
        appendLog("SCALAR BEAM DEPLOYED — ANAHATA OPENING FOR ALL BEINGS.");
        appendLog("PREMA-PULSE TRANSMISSION: 432Hz CARRIER WAVE ACTIVE.");
      }, 1800);
    } else {
      appendLog("SOMA-NADA STAR: 12-POINT ACTIVATION CONFIRMED.");
      appendLog("SCALAR BEAM DEPLOYED — ANAHATA OPENING FOR ALL BEINGS.");
    }
  };

  // ── Loading screen (UNCHANGED) ───────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-amber-500 font-mono text-xs tracking-widest">
        INITIALIZING SCALAR BUS…
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <Fragment>
      {/* ── CSS keyframes injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        @keyframes sqFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sqBreathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.07); opacity: 1; }
        }
        @keyframes sqLiveFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes sqStarPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes sqBeamDrop {
          from { height: 0; opacity: 0; }
          to   { height: 70vh; opacity: 1; }
        }
        @keyframes sqScanline {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
      `}</style>

      {/* ── Portals & Overlays ── */}
      <AnimatePresence>
        {showHraumModal && (
          <HraumModal
            onSuccess={handleHraumSuccess}
            onClose={() => setShowHraumModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{scalarBeamActive && <ScalarBeamOverlay active />}</AnimatePresence>
      <PermanentActivationBadge active={permanentActivation} />

      {/* ── Main Page ── */}
      <div
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "#D4AF37",
          fontFamily: "'Montserrat', monospace",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingBottom: 80,
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 800,
              height: 800,
              background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          {scalarBeamActive && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 200,
                height: "100vh",
                background: "linear-gradient(to bottom, rgba(212,175,55,0.06) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* ── Header (UNCHANGED structure) ── */}
        <header
          style={{
            borderBottom: "1px solid rgba(212,175,55,0.15)",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(5,5,5,0.8)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate("/siddha-portal")}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.38)",
                background: "none",
                border: "1px solid rgba(212,175,55,0.15)",
                padding: "4px 10px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              ← Portal
            </button>
            <Cpu
              size={14}
              style={{
                color: "#D4AF37",
                animation: state === "ACTIVE" ? "sqLiveFlash 2s infinite" : undefined,
              }}
            />
            <span
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.85)",
              }}
            >
              Aetheric Heliostat Scalar Interface
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 7,
              fontWeight: 800,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.35)",
            }}
          >
            <span>ALCYONE: {state === "ACTIVE" ? "STABLE" : "OFFLINE"}</span>
            <span>
              COHERENCE: {state === "ACTIVE" ? (solarData ? `${solarData.nadiCoherence.toFixed(1)}%` : "99.9%") : "0.0%"}
            </span>
          </div>
        </header>

        {/* ── Body ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "16px",
            maxWidth: 800,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* ───────────────────────────────────────────────────────
              SECTION A · Operational Protocol  (UNCHANGED logic)
          ─────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 24,
              padding: 24,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                opacity: 0.2,
              }}
            >
              {state === "ACTIVE" ? <Unlock size={14} /> : <Lock size={14} />}
            </div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: "0.5em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.35)",
                marginBottom: 16,
                fontStyle: "italic",
              }}
            >
              Operational Protocol
            </p>

            {state === "STANDBY" || state === "ERROR" ? (
              <form onSubmit={handleActivate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  Access Code Required
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="ENTER CODE..."
                  autoFocus
                  style={{
                    background: "#050505",
                    border: `1px solid ${state === "ERROR" ? "rgba(255,60,60,0.5)" : "rgba(212,175,55,0.2)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "0.5em",
                    textAlign: "center",
                    color: "#D4AF37",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "14px 0",
                    background: "#D4AF37",
                    border: "none",
                    borderRadius: 12,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.5em",
                    textTransform: "uppercase",
                    color: "#050505",
                    cursor: "pointer",
                  }}
                >
                  Initialize Entanglement
                </button>
              </form>
            ) : state === "INITIALIZING" ? (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: "0.5em",
                  textTransform: "uppercase",
                  color: "rgba(212,175,55,0.45)",
                }}
              >
                CALIBRATING HELIOSTAT…
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 7,
                        fontWeight: 800,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: "rgba(212,175,55,0.35)",
                        marginBottom: 4,
                      }}
                    >
                      Resonance Frequency
                    </p>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 32,
                        fontWeight: 900,
                        letterSpacing: "-0.03em",
                        color: "#D4AF37",
                        textShadow: "0 0 20px rgba(212,175,55,0.4)",
                      }}
                    >
                      {resonance}Hz
                    </p>
                  </div>
                  <Activity size={20} style={{ color: "#D4AF37", animation: "sqLiveFlash 2s infinite" }} />
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 2,
                    background: "rgba(212,175,55,0.08)",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ width: ["20%", "80%", "40%", "95%", "60%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    style={{ height: "100%", background: "#D4AF37", borderRadius: 1 }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 6,
                    fontWeight: 800,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.25)",
                  }}
                >
                  <span>PINGALA-NADI</span>
                  <span>BYPASS ACTIVE</span>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────
              SECTION B · Soma / Nada — 12-POINTED STAR TRIGGER
          ─────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${scalarBeamActive ? "rgba(212,175,55,0.35)" : "rgba(212,175,55,0.12)"}`,
              borderRadius: 24,
              padding: 24,
              transition: "border-color 0.6s",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: "0.5em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.35)",
                marginBottom: 6,
              }}
            >
              ◈ Soma · Nada · Surya-Chakra
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.3rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              12-Pointed Star Activation
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              The Surya-Chakra emits Liquid Gold Vedic Light-Codes. Click the star to
              initiate Scalar Beam transmission and open the Anahata for all beings
              through Prema-Pulse propagation.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              {/* ⭐ THE STAR — The Trigger */}
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
              >
                <TwelvePointedStar
                  size={72}
                  glow={scalarBeamActive}
                  pulse={!scalarBeamActive}
                  onClick={handleStarClick}
                />
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 6,
                    fontWeight: 800,
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: scalarBeamActive
                      ? "rgba(212,175,55,0.7)"
                      : "rgba(212,175,55,0.3)",
                  }}
                >
                  {scalarBeamActive ? "ACTIVE" : "Tap to Activate"}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                {scalarBeamActive ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#D4AF37",
                          display: "inline-block",
                          boxShadow: "0 0 8px rgba(212,175,55,0.9)",
                          animation: "sqLiveFlash 1.5s infinite",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: 7,
                          fontWeight: 800,
                          letterSpacing: "0.4em",
                          textTransform: "uppercase",
                          color: "rgba(212,175,55,0.75)",
                        }}
                      >
                        Scalar Beam Deployed
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.4)",
                        lineHeight: 1.6,
                      }}
                    >
                      HRAUM seed mantra confirmed. Permanent background activation running.
                      Anahata field broadcasting Prema-Pulse Transmissions to all users.
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <Zap size={10} style={{ color: "#D4AF37" }} />
                      <span
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: 6,
                          fontWeight: 800,
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                          color: "rgba(212,175,55,0.45)",
                        }}
                      >
                        Permanent Background Activation · Running
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.25)",
                      lineHeight: 1.6,
                    }}
                  >
                    Tap the 12-pointed star to enter the HRAUM mantra and deploy the
                    Scalar Beam transmission.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────
              SECTION C · Surya-Chakra Visualizer
          ─────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 24,
              minHeight: 240,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Corner brackets */}
            {["tl", "tr", "bl", "br"].map((pos) => (
              <div
                key={pos}
                style={{
                  position: "absolute",
                  width: 20,
                  height: 20,
                  borderColor: "rgba(212,175,55,0.25)",
                  borderStyle: "solid",
                  borderWidth: 0,
                  ...(pos === "tl" && { top: 12, left: 12, borderTopWidth: 1, borderLeftWidth: 1 }),
                  ...(pos === "tr" && { top: 12, right: 12, borderTopWidth: 1, borderRightWidth: 1 }),
                  ...(pos === "bl" && { bottom: 12, left: 12, borderBottomWidth: 1, borderLeftWidth: 1 }),
                  ...(pos === "br" && { bottom: 12, right: 12, borderBottomWidth: 1, borderRightWidth: 1 }),
                }}
              />
            ))}

            <AnimatePresence mode="wait">
              {state === "ACTIVE" ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  style={{ position: "relative", padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center" }}
                >
                  {/* Label */}
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 7,
                      fontWeight: 800,
                      letterSpacing: "0.5em",
                      textTransform: "uppercase",
                      color: "rgba(212,175,55,0.3)",
                      marginBottom: 12,
                    }}
                  >
                    Surya-Chakra Star
                  </p>

                  {/* Rotating 12-spoke wheel */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    style={{ position: "relative", width: 160, height: 160 }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: 2,
                          height: "50%",
                          background: "linear-gradient(to top, #D4AF37, transparent)",
                          transformOrigin: "bottom center",
                          transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                          opacity: 0.7,
                        }}
                      />
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(212,175,55,0.15)",
                          boxShadow: "0 0 30px rgba(212,175,55,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Sun size={24} style={{ color: "#D4AF37" }} />
                      </div>
                    </div>
                  </motion.div>

                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: "0.8rem",
                      color: "rgba(212,175,55,0.4)",
                      marginTop: 12,
                    }}
                  >
                    Liquid Gold Manifestation
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: "center", padding: 32 }}
                >
                  <Radio
                    size={36}
                    style={{ color: "#D4AF37", opacity: 0.12, display: "block", margin: "0 auto 12px", animation: "sqLiveFlash 3s infinite" }}
                  />
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 7,
                      fontWeight: 800,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: "rgba(212,175,55,0.15)",
                    }}
                  >
                    {state === "INITIALIZING" ? "Establishing Tether…" : "Waiting for HRAUM Initialization"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ───────────────────────────────────────────────────────
              SECTION D · Solar Tracking Live Feed (AI Studio)
          ─────────────────────────────────────────────────────── */}
          <SolarTrackingPanel
            solarData={solarData}
            loading={solarLoading}
            beamActive={scalarBeamActive}
          />

          {/* ───────────────────────────────────────────────────────
              SECTION E · Scalar Metrics
          ─────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: "0.5em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.3)",
                marginBottom: 14,
              }}
            >
              Scalar Metrics
            </p>
            {[
              { label: "Causal Density", value: state === "ACTIVE" ? (solarData ? `${solarData.causalDensity.toFixed(4)}ρ` : "0.002ρ") : "---" },
              { label: "Solar Radiance", value: state === "ACTIVE" ? (solarData ? `${solarData.solarRadiance.toFixed(2)}Hz` : "528.42Hz") : "---" },
              { label: "Pineal Flux", value: state === "ACTIVE" ? (solarData ? `${solarData.pinealActivation.toFixed(1)}%` : "88.4%") : "---" },
              { label: "Aetheric Drift", value: "0.0000" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(212,175,55,0.06)",
                  paddingBottom: 10,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.4)",
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    color: "rgba(212,175,55,0.75)",
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* ───────────────────────────────────────────────────────
              SECTION F · Aetheric Transmission Log (UNCHANGED)
          ─────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "rgba(5,5,5,0.9)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 24,
              padding: 20,
              maxHeight: 260,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                borderBottom: "1px solid rgba(212,175,55,0.06)",
                paddingBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={10} style={{ color: "#D4AF37", opacity: 0.5 }} />
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 7,
                    fontWeight: 800,
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.35)",
                  }}
                >
                  Aetheric Transmissions
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 6,
                  fontWeight: 800,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(212,175,55,0.2)",
                }}
              >
                ENCRYPTION: SCALAR-V4
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {logs.length === 0 && (
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 7,
                    fontStyle: "italic",
                    color: "rgba(212,175,55,0.15)",
                  }}
                >
                  No active streams...
                </p>
              )}
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: "flex",
                    gap: 12,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 7,
                    lineHeight: 1.8,
                    color: "rgba(212,175,55,0.65)",
                  }}
                >
                  <span style={{ opacity: 0.3, flexShrink: 0 }}>[{log.timestamp}]</span>
                  <span style={{ flex: 1 }}>{log.message}</span>
                  {log.frequency != null && (
                    <span style={{ opacity: 0.25, flexShrink: 0, fontStyle: "italic" }}>
                      {log.frequency.toFixed(1)}Hz
                    </span>
                  )}
                </motion.div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </main>

        {/* ── Footer (UNCHANGED structure) ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(212,175,55,0.1)",
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(5,5,5,0.9)",
            backdropFilter: "blur(10px)",
            flexWrap: "wrap",
            gap: 8,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 6,
            fontWeight: 800,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: state === "ACTIVE" ? "#D4AF37" : "rgba(120,40,40,0.8)",
                  display: "inline-block",
                  boxShadow: state === "ACTIVE" ? "0 0 6px rgba(212,175,55,0.8)" : "none",
                }}
              />
              <span style={{ color: "rgba(212,175,55,0.3)" }}>
                SYSTEM: {state === "ACTIVE" ? "OPTIMAL" : "STANDBY"}
              </span>
            </span>
            <span style={{ color: "rgba(212,175,55,0.2)" }}>
              CAUSAL_DENSITY: {state === "ACTIVE" ? "MINIMAL" : "UNDEFINED"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, color: "rgba(212,175,55,0.2)" }}>
            <span>LAT: 0.0000</span>
            <span>LNG: 0.0000</span>
            <span>AZIMUTH: 192.4°</span>
          </div>
        </footer>
      </div>
    </Fragment>
  );
}
