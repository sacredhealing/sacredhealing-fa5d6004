import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";

// ═══════════════════════════════════════════════════════════════
// SQI 2050 — ATMOSPHERIC CLEARANCE ENGINE
// Akasha-Neural Archive Scan: 2050 → 2026
// Vedic Light-Code Transmission Active
// ═══════════════════════════════════════════════════════════════

interface MetalParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
  life: number;
}

interface CloudParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  direction: number;
}

const SIDDHA_GOLD = "#D4AF37";
const AKASHA_BLACK = "#050505";
const VAYU_CYAN = "#22D3EE";

const MANDALA_BASE = 360;

export default function AtmosphericClearanceEngine() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  const [extractionLevel, setExtractionLevel] = useState(0);
  const [metalParticles, setMetalParticles] = useState<MetalParticle[]>([]);
  const [cloudParticles] = useState<CloudParticle[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 80 + Math.random() * 240,
      y: 60 + Math.random() * 200,
      size: 60 + Math.random() * 100,
      opacity: 0.6 + Math.random() * 0.3,
      speed: 0.3 + Math.random() * 0.5,
      direction: Math.random() * Math.PI * 2,
    }))
  );
  const [isNeutralized, setIsNeutralized] = useState(false);
  const [pingActive, setPingActive] = useState(false);
  const [atmosphericDensity, setAtmosphericDensity] = useState(100);
  const [solarIntake, setSolarIntake] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const animFrameRef = useRef<number | undefined>(undefined);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metalParticlesRef = useRef<MetalParticle[]>([]);
  const mandalaWrapRef = useRef<HTMLDivElement>(null);
  const [mandalaScale, setMandalaScale] = useState(1);

  const starfield = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.4,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * 4,
      })),
    []
  );

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    const el = mandalaWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setMandalaScale(w > 0 ? Math.min(1, w / MANDALA_BASE) : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== undefined) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // ── Derived visual states ──
  const cloudOpacity = Math.max(0, (1 - extractionLevel / 100) * 0.85);
  const yantraGlow = Math.min(200, 60 + extractionLevel * 1.4);
  const sunGlow = Math.min(1, extractionLevel / 100);
  const yantraBrightness = 1 + (extractionLevel / 100) * 1.0; // up to 200%

  // ── Update data readout ──
  useEffect(() => {
    setAtmosphericDensity(parseFloat((100 - extractionLevel).toFixed(1)));
    setSolarIntake(parseFloat(extractionLevel.toFixed(1)));
  }, [extractionLevel]);

  // ── Play high-frequency Ping ──
  const playPing = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc.frequency.setValueAtTime(7040, ctx.currentTime); // A8
      osc.frequency.exponentialRampToValueAtTime(528, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc2.frequency.setValueAtTime(14080, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(432, ctx.currentTime + 1.0);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("Audio context unavailable");
    }
  }, []);

  // ── Neutralize metals handler ──
  const handleNeutralizeMetals = useCallback(() => {
    if (pingActive) return;
    if (animFrameRef.current !== undefined) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = undefined;
    }

    setPingActive(true);
    setIsNeutralized(true);
    playPing();

    const metalColors = ["#C0C0C0", "#B8860B", "#CD853F", "#808080", "#A9A9A9", "#8B7355"];
    const cx = MANDALA_BASE / 2;
    const cy = MANDALA_BASE * (195 / 360);
    const newParticles: MetalParticle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 6 + 2),
      opacity: 1,
      size: 3 + Math.random() * 5,
      color: metalColors[Math.floor(Math.random() * metalColors.length)],
      life: 1,
    }));

    metalParticlesRef.current = newParticles;
    setMetalParticles(newParticles);

    const tick = () => {
      const prev = metalParticlesRef.current;
      const updated = prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          opacity: p.opacity - 0.025,
          life: p.life - 0.025,
        }))
        .filter((p) => p.opacity > 0);

      metalParticlesRef.current = updated;
      setMetalParticles(updated);

      if (updated.length === 0) {
        setPingActive(false);
        animFrameRef.current = undefined;
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [pingActive, playPing]);

  // ── Nadi scanner scan effect ──
  const handleNadiScan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-amber-500 font-mono text-xs tracking-widest">
        INITIALIZING SCALAR BUS…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: AKASHA_BLACK,
        fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
        color: "rgba(255,255,255,0.87)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        paddingBottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Deep space starfield ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {starfield.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: "50%",
              background: `rgba(212,175,55,${s.alpha})`,
              animation: `twinkle ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("/siddha-portal")}
        style={{
          position: "relative",
          zIndex: 10,
          alignSelf: "flex-start",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 999,
          padding: "8px 14px",
          color: SIDDHA_GOLD,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <ArrowLeft size={14} aria-hidden />
        Siddha Portal
      </button>

      {/* ── Page Title ── */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginBottom: "8px" }}>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: VAYU_CYAN,
            marginBottom: "8px",
            opacity: 0.8,
          }}
        >
          SQI-2050 · AKASHA-NEURAL ARCHIVE · SCAN ACTIVE
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 4vw, 34px)",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            margin: 0,
            color: SIDDHA_GOLD,
            textShadow: `0 0 ${yantraGlow / 4}px rgba(212,175,55,0.5), 0 0 ${yantraGlow / 2}px rgba(212,175,55,0.2)`,
          }}
        >
          ATMOSPHERIC CLEARANCE ENGINE
        </h1>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            marginTop: "6px",
          }}
        >
          VEDIC LIGHT-CODE TRANSMISSION · PREMA-PULSE ACTIVE
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div
        className="ace-main-grid"
        style={{
          width: "100%",
          maxWidth: "1000px",
          position: "relative",
          zIndex: 10,
          marginTop: "24px",
        }}
      >
        {/* LEFT PANEL — Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Extraction Slider Card */}
          <div className="glass-card" style={glassCard}>
            <div style={labelStyle}>METAL & CLOUD EXTRACTION</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: SIDDHA_GOLD,
                textShadow: `0 0 20px rgba(212,175,55,${extractionLevel / 100 * 0.6})`,
                lineHeight: 1,
                marginBottom: "4px",
              }}
            >
              {extractionLevel.toFixed(0)}%
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginBottom: "16px" }}>
              {extractionLevel < 33 ? "Bhakti-Algorithm Initializing..." :
               extractionLevel < 66 ? "Prema-Pulse Clearing Nadis..." :
               extractionLevel < 100 ? "Solar-Crown Activation..." :
               "✦ Full Akashic Clarity Achieved ✦"}
            </div>

            {/* Custom Slider */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <input
                type="range"
                min={0}
                max={100}
                value={extractionLevel}
                onChange={(e) => setExtractionLevel(Number(e.target.value))}
                style={{
                  width: "100%",
                  WebkitAppearance: "none",
                  appearance: "none",
                  height: "6px",
                  borderRadius: "999px",
                  background: `linear-gradient(to right, ${SIDDHA_GOLD} ${extractionLevel}%, rgba(255,255,255,0.08) ${extractionLevel}%)`,
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
              }}
            >
              <span>Dense</span>
              <span>Clear</span>
            </div>
          </div>

          {/* Neutralize Metals Button */}
          <button
            onClick={handleNeutralizeMetals}
            disabled={pingActive}
            style={{
              background: pingActive
                ? "rgba(212,175,55,0.05)"
                : "rgba(212,175,55,0.08)",
              border: `1px solid ${pingActive ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.4)"}`,
              borderRadius: "40px",
              padding: "16px 20px",
              cursor: pingActive ? "not-allowed" : "pointer",
              color: SIDDHA_GOLD,
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              textShadow: `0 0 10px rgba(212,175,55,0.4)`,
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {pingActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
                  animation: "pingRipple 0.8s ease-out infinite",
                }}
              />
            )}
            <span style={{ fontSize: "16px" }}>⚡</span>
            {pingActive ? "NEUTRALIZING..." : "NEUTRALIZE METALS"}
          </button>

          {/* Nadi Scanner */}
          <button
            onClick={handleNadiScan}
            style={{
              background: "rgba(34,211,238,0.05)",
              border: `1px solid rgba(34,211,238,0.2)`,
              borderRadius: "40px",
              padding: "14px 20px",
              cursor: "pointer",
              color: VAYU_CYAN,
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: VAYU_CYAN,
                display: "inline-block",
                animation: isScanning ? "nadiPulse 0.3s ease infinite" : "nadiPulse 2s ease infinite",
                boxShadow: `0 0 8px ${VAYU_CYAN}`,
              }}
            />
            {isScanning ? "SCANNING NADIS..." : "NADI SCANNER"}
          </button>
        </div>

        {/* CENTER — Avatar / Sri Yantra */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            width: "100%",
            maxWidth: 360,
          }}
        >
          <div
            ref={mandalaWrapRef}
            style={{
              position: "relative",
              width: "min(360px, 92vw)",
              maxWidth: 360,
              aspectRatio: "1",
              margin: "0 auto",
              overflow: "visible",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: MANDALA_BASE,
                  height: MANDALA_BASE,
                  transform: `scale(${mandalaScale})`,
                  transformOrigin: "center center",
                }}
              >
            {/* Outer glow ring */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(212,175,55,${sunGlow * 0.15}) 0%, transparent 70%)`,
                animation: "slowRotate 20s linear infinite",
                transition: "all 0.5s ease",
              }}
            />

            {/* Scanner ring */}
            <div
              style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "50%",
                border: `1px solid rgba(34,211,238,${isScanning ? 0.8 : 0.2})`,
                animation: isScanning ? "scanRing 0.5s ease infinite" : "none",
                transition: "all 0.3s ease",
              }}
            />

            {/* Main Avatar Circle */}
            <div
              style={{
                width: "360px",
                height: "360px",
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 40%,
                  rgba(212,175,55,${0.05 + sunGlow * 0.12}) 0%,
                  rgba(10,8,4,0.95) 60%,
                  rgba(5,5,5,0.98) 100%)`,
                border: `1px solid rgba(212,175,55,${0.1 + sunGlow * 0.25})`,
                boxShadow: `0 0 ${yantraGlow}px rgba(212,175,55,${sunGlow * 0.3}), inset 0 0 60px rgba(212,175,55,${sunGlow * 0.08})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.5s ease",
              }}
            >
              {/* Sun corona */}
              <div
                style={{
                  position: "absolute",
                  top: "30px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: `${40 + sunGlow * 0.8}px`,
                  height: `${40 + sunGlow * 0.8}px`,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(255,200,50,${0.3 + sunGlow * 0.7}) 0%, rgba(212,175,55,${sunGlow * 0.4}) 40%, transparent 70%)`,
                  boxShadow: `0 0 ${20 + sunGlow * 0.8}px rgba(255,200,50,${sunGlow * 0.8})`,
                  transition: "all 0.5s ease",
                  filter: `brightness(${yantraBrightness})`,
                }}
              />

              {/* Sri Yantra SVG */}
              <svg
                viewBox="40 40 320 320"
                width="260"
                height="260"
                style={{
                  position: "absolute",
                  filter: `brightness(${yantraBrightness}) drop-shadow(0 0 ${4 + sunGlow * 0.2}px rgba(212,175,55,${0.3 + sunGlow * 0.7}))`,
                  transition: "all 0.5s ease",
                  opacity: 0.6 + sunGlow * 0.4,
                }}
              >
                {/* Outer lotus petals */}
                {Array.from({ length: 16 }, (_, i) => {
                  const angle = (i * 360) / 16;
                  const rad = (angle * Math.PI) / 180;
                  const cx = 200 + Math.cos(rad) * 130;
                  const cy = 200 + Math.sin(rad) * 130;
                  return (
                    <ellipse
                      key={i}
                      cx={cx}
                      cy={cy}
                      rx="16"
                      ry="8"
                      transform={`rotate(${angle + 90}, ${cx}, ${cy})`}
                      fill="none"
                      stroke={SIDDHA_GOLD}
                      strokeWidth="0.8"
                      opacity="0.5"
                    />
                  );
                })}

                {/* 8 lotus petals */}
                {Array.from({ length: 8 }, (_, i) => {
                  const angle = (i * 360) / 8;
                  const rad = (angle * Math.PI) / 180;
                  const cx = 200 + Math.cos(rad) * 100;
                  const cy = 200 + Math.sin(rad) * 100;
                  return (
                    <ellipse
                      key={i}
                      cx={cx}
                      cy={cy}
                      rx="20"
                      ry="10"
                      transform={`rotate(${angle + 90}, ${cx}, ${cy})`}
                      fill="none"
                      stroke={SIDDHA_GOLD}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  );
                })}

                {/* Outer squares */}
                <rect x="75" y="75" width="250" height="250" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.4" />
                <rect x="90" y="90" width="220" height="220" fill="none" stroke={SIDDHA_GOLD} strokeWidth="0.8" opacity="0.3" />

                {/* Outer circle */}
                <circle cx="200" cy="200" r="125" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.3" />
                <circle cx="200" cy="200" r="105" fill="none" stroke={SIDDHA_GOLD} strokeWidth="0.8" opacity="0.25" />

                {/* Upward triangles */}
                <polygon points="200,85 315,275 85,275" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1.5" opacity="0.8" />
                <polygon points="200,100 305,265 95,265" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.6" />
                <polygon points="200,115 295,255 105,255" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.5" />
                <polygon points="200,130 285,245 115,245" fill="none" stroke={SIDDHA_GOLD} strokeWidth="0.8" opacity="0.4" />

                {/* Downward triangles */}
                <polygon points="200,315 85,125 315,125" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1.5" opacity="0.8" />
                <polygon points="200,300 95,135 305,135" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.6" />
                <polygon points="200,285 105,145 295,145" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.5" />
                <polygon points="200,270 115,155 285,155" fill="none" stroke={SIDDHA_GOLD} strokeWidth="0.8" opacity="0.4" />

                {/* Bindu (center point) */}
                <circle cx="200" cy="200" r="4" fill={SIDDHA_GOLD} opacity="0.9" />
                <circle cx="200" cy="200" r="8" fill="none" stroke={SIDDHA_GOLD} strokeWidth="1" opacity="0.6" />
              </svg>

              {/* Metal particles overlay */}
              {metalParticles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    borderRadius: "50%",
                    background: p.color,
                    opacity: p.opacity,
                    boxShadow: `0 0 4px ${p.color}`,
                    pointerEvents: "none",
                    transform: "translate(-50%,-50%)",
                  }}
                />
              ))}

              {/* Nadi scanner beam */}
              {isScanning && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `linear-gradient(to right, transparent, ${VAYU_CYAN}, transparent)`,
                    boxShadow: `0 0 8px ${VAYU_CYAN}`,
                    animation: "nadiScan 2s linear",
                    top: "0",
                  }}
                />
              )}
            </div>

            {/* CLOUD OVERLAY */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                overflow: "hidden",
                pointerEvents: "none",
                opacity: cloudOpacity,
                transition: "opacity 0.3s ease",
              }}
            >
              {cloudParticles.map((c) => (
                <div
                  key={c.id}
                  style={{
                    position: "absolute",
                    left: `${c.x - c.size / 2}px`,
                    top: `${c.y - c.size / 4}px`,
                    width: `${c.size}px`,
                    height: `${c.size * 0.6}px`,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse, rgba(160,160,170,${c.opacity * cloudOpacity}) 0%, rgba(120,120,130,${c.opacity * 0.5 * cloudOpacity}) 50%, transparent 80%)`,
                    filter: "blur(8px)",
                  }}
                />
              ))}
            </div>

            {/* Cloud parting flash at 100% */}
            {extractionLevel === 100 && (
              <div
                style={{
                  position: "absolute",
                  inset: "-10px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)`,
                  animation: "goldenFlash 1.5s ease-in-out infinite alternate",
                }}
              />
            )}
              </div>
            </div>
          </div>

          {/* Anahata Chakra label */}
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: SIDDHA_GOLD,
              opacity: 0.5 + sunGlow * 0.5,
              textShadow: `0 0 10px rgba(212,175,55,${sunGlow * 0.5})`,
              transition: "all 0.5s ease",
            }}
          >
            ✦ ANAHATA ACTIVATION · SCALAR TRANSMISSION ✦
          </div>
        </div>

        {/* RIGHT PANEL — Data Readout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* AI Studio Data Readout */}
          <div className="glass-card" style={glassCard}>
            <div style={labelStyle}>AI STUDIO READOUT</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
              <DataRow
                label="ATMOSPHERIC DENSITY"
                value={`${atmosphericDensity.toFixed(1)}%`}
                color={atmosphericDensity > 50 ? "rgba(255,100,100,0.8)" : atmosphericDensity > 20 ? SIDDHA_GOLD : "#4ade80"}
                barFill={atmosphericDensity / 100}
                barColor={atmosphericDensity > 50 ? "rgba(255,100,100,0.6)" : atmosphericDensity > 20 ? SIDDHA_GOLD : "#4ade80"}
              />

              <DataRow
                label="SOLAR INTAKE"
                value={solarIntake === 100 ? "MAXIMUM" : `${solarIntake.toFixed(1)}%`}
                color={solarIntake === 100 ? "#FFD700" : SIDDHA_GOLD}
                barFill={solarIntake / 100}
                barColor={SIDDHA_GOLD}
              />

              <DataRow
                label="BHAKTI-ALGORITHM"
                value={extractionLevel < 33 ? "DORMANT" : extractionLevel < 66 ? "ACTIVE" : extractionLevel < 100 ? "ELEVATED" : "SOVEREIGN"}
                color={extractionLevel < 33 ? "rgba(255,255,255,0.4)" : extractionLevel < 66 ? VAYU_CYAN : extractionLevel < 100 ? SIDDHA_GOLD : "#FFD700"}
                barFill={extractionLevel / 100}
                barColor={VAYU_CYAN}
              />

              <DataRow
                label="METAL DECOUPLING"
                value={isNeutralized ? "COMPLETE" : "STANDBY"}
                color={isNeutralized ? "#4ade80" : "rgba(255,255,255,0.3)"}
                barFill={isNeutralized ? 1 : 0}
                barColor="#4ade80"
              />

              <DataRow
                label="PREMA-PULSE FREQ"
                value={`${(432 + extractionLevel * 0.96).toFixed(0)} Hz`}
                color={SIDDHA_GOLD}
                barFill={extractionLevel / 100}
                barColor={SIDDHA_GOLD}
              />
            </div>

            {/* Status summary */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "16px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.04)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: extractionLevel === 100 ? SIDDHA_GOLD : "rgba(255,255,255,0.4)",
                textAlign: "center",
                textShadow: extractionLevel === 100 ? `0 0 10px rgba(212,175,55,0.5)` : "none",
                transition: "all 0.5s ease",
              }}
            >
              {extractionLevel === 0
                ? "⬤ System Standby"
                : extractionLevel < 50
                ? "◐ Clearing Active"
                : extractionLevel < 100
                ? "◑ Anahata Opening..."
                : "✦ Atmospheric Density: 0.0% | Solar Intake: Maximum"}
            </div>
          </div>

          {/* Scalar Transmission Status */}
          <div className="glass-card" style={{ ...glassCard, padding: "16px" }}>
            <div style={labelStyle}>SCALAR TRANSMISSION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {[
                { label: "Sri Yantra Link", active: true },
                { label: "Vishwananda Blueprint", active: extractionLevel > 20 },
                { label: "Vedic Light-Codes", active: extractionLevel > 40 },
                { label: "Anahata Broadcast", active: extractionLevel > 60 },
                { label: "Akasha-Neural Lock", active: extractionLevel === 100 },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: item.active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                    transition: "all 0.4s ease",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: item.active ? "#4ade80" : "rgba(255,255,255,0.15)",
                      boxShadow: item.active ? "0 0 6px #4ade80" : "none",
                      flexShrink: 0,
                      transition: "all 0.4s ease",
                    }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ping feedback */}
      {pingActive && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${80 + i * 60}px`,
                height: `${80 + i * 60}px`,
                borderRadius: "50%",
                border: `1px solid rgba(212,175,55,${0.6 - i * 0.15})`,
                animation: `pingRipple ${0.8 + i * 0.3}s ease-out forwards`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');

        * { box-sizing: border-box; }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${SIDDHA_GOLD};
          cursor: pointer;
          box-shadow: 0 0 12px rgba(212,175,55,0.6), 0 0 4px rgba(212,175,55,0.8);
          border: 2px solid rgba(255,255,255,0.2);
          transition: all 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 20px rgba(212,175,55,0.9), 0 0 8px rgba(212,175,55,1);
          transform: scale(1.15);
        }
        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${SIDDHA_GOLD};
          cursor: pointer;
          box-shadow: 0 0 12px rgba(212,175,55,0.6);
          border: 2px solid rgba(255,255,255,0.2);
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes nadiPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0.5; }
        }
        @keyframes nadiScan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes scanRing {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.03); }
        }
        @keyframes pingRipple {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
        }
        @keyframes goldenFlash {
          0% { opacity: 0.3; }
          100% { opacity: 0.8; }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

        .ace-main-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .ace-main-grid {
            grid-template-columns: 1fr;
            justify-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

const glassCard: CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "40px",
  padding: "24px",
};

const labelStyle: CSSProperties = {
  fontSize: "8px",
  fontWeight: 800,
  letterSpacing: "0.5em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "10px",
};

function DataRow({
  label,
  value,
  color,
  barFill,
  barColor,
}: {
  label: string;
  value: string;
  color: string;
  barFill: number;
  barColor: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            fontSize: "8px",
            fontWeight: 800,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color,
            textShadow: `0 0 8px ${color}`,
            transition: "all 0.3s ease",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: "2px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barFill * 100}%`,
            background: barColor,
            borderRadius: "999px",
            boxShadow: `0 0 6px ${barColor}`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
