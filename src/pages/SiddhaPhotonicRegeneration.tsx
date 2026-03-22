import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Radio, Shield, Zap, Activity, Fingerprint, ChevronLeft, Waves, Eye } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { toast } from 'sonner';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const GOLD   = '#D4AF37';
const CYAN   = '#22D3EE';
const BG     = '#050505';
const GLASS  = 'rgba(255,255,255,0.02)';
const GLASS_BORDER = 'rgba(255,255,255,0.05)';
const GOLD_BORDER  = 'rgba(212,175,55,0.15)';

/* ─── FONT + KEYFRAMES ───────────────────────────────────────────────────── */
const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
`;

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 4px; }

  /* ── Gold-text glow ── */
  .gold-glow {
    text-shadow: 0 0 18px rgba(212,175,55,0.35);
    color: ${GOLD};
  }

  /* ── Glass card ── */
  .glass-card {
    background: ${GLASS};
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid ${GLASS_BORDER};
    border-radius: 40px;
  }

  /* ── Stat pill ── */
  .stat-pill {
    background: rgba(255,255,255,0.03);
    border: 1px solid ${GLASS_BORDER};
    border-radius: 999px;
    padding: 6px 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Grid dot bg ── */
  .dot-bg {
    background-image: radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ── Keyframes ── */
  @keyframes spr-pulse-ring {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.5;  transform: scale(1.06); }
  }
  @keyframes spr-scan {
    0%   { transform: translateY(-120%); opacity: 0.6; }
    100% { transform: translateY(120%);  opacity: 0; }
  }
  @keyframes spr-bar {
    0%,100% { opacity: 0.25; transform: scaleY(0.4); }
    50%     { opacity: 1;    transform: scaleY(1.0); }
  }
  @keyframes spr-spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes spr-blink {
    0%,100% { opacity: 1; }
    50%     { opacity: 0; }
  }
  @keyframes spr-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes spr-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes spr-particle-rise {
    0%   { transform: translateY(0) scale(1); opacity: 0.7; }
    100% { transform: translateY(-60px) scale(0); opacity: 0; }
  }
  @keyframes spr-entangle-halo {
    0%,100% { box-shadow: 0 0 20px rgba(34,211,238,0.2), 0 0 40px rgba(212,175,55,0.1); }
    50%     { box-shadow: 0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(212,175,55,0.25); }
  }

  /* ── Responsive flex ── */
  .spr-flex-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 48px;
    width: 100%;
  }
  .spr-copy { text-align: center; flex: 1; min-width: 280px; }
  @media (min-width: 768px) {
    .spr-flex-row { flex-direction: row; justify-content: center; }
    .spr-copy     { text-align: left; }
  }
`;

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: GLASS,
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 40,
    ...extra,
  };
}

/* ─── SVG: Sri Yantra ring ───────────────────────────────────────────────── */
function SriRing({ size = 200, active = false }: { size?: number; active?: boolean }) {
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* outer dashed ring */}
      <circle
        cx={r} cy={r} r={r - 4}
        fill="none"
        stroke={active ? CYAN : GOLD}
        strokeWidth={0.6}
        strokeDasharray="3 9"
        opacity={active ? 0.7 : 0.25}
        style={{ animation: 'spr-spin-slow 30s linear infinite' }}
      />
      {/* middle ring */}
      <circle
        cx={r} cy={r} r={r - 16}
        fill="none"
        stroke={GOLD}
        strokeWidth={0.8}
        opacity={active ? 0.6 : 0.15}
        style={{ animation: active ? 'spr-pulse-ring 3s ease-in-out infinite' : undefined }}
      />
      {/* inner hex */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = r + (r - 36) * Math.cos(angle);
        const y = r + (r - 36) * Math.sin(angle);
        const nx = r + (r - 36) * Math.cos(angle + Math.PI / 3);
        const ny = r + (r - 36) * Math.sin(angle + Math.PI / 3);
        return (
          <line
            key={i}
            x1={x} y1={y} x2={nx} y2={ny}
            stroke={active ? CYAN : GOLD}
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      })}
    </svg>
  );
}

/* ─── Vayu bars (equaliser visual) ─────────────────────────────────────── */
function VayuBars({ count = 20, active = false }: { count?: number; active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: `${30 + Math.sin(i * 0.9) * 18}%`,
            background: active ? CYAN : GOLD,
            borderRadius: 2,
            opacity: active ? 0.85 : 0.3,
            animation: active
              ? `spr-bar ${0.8 + (i % 5) * 0.25}s ease-in-out infinite`
              : undefined,
            animationDelay: `${(i * 40) % 600}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Floating particles ─────────────────────────────────────────────────── */
function Particles({ count = 20 }: { count?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            left: `${5 + Math.random() * 90}%`,
            top: `${20 + Math.random() * 70}%`,
            opacity: 0,
          }}
          animate={{
            top: '-10%',
            opacity: [0, 0.55, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 10,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 10,
          }}
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? 4 : 2,
            height: i % 3 === 0 ? 4 : 2,
            borderRadius: '50%',
            background: i % 4 === 0 ? CYAN : GOLD,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Light-code ticker ──────────────────────────────────────────────────── */
function LightCodeTicker({ code }: { code: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 14px',
        borderRadius: 999,
        background: 'rgba(34,211,238,0.07)',
        border: `1px solid rgba(34,211,238,0.25)`,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, animation: 'spr-blink 1.2s ease infinite' }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.15em',
        color: CYAN,
      }}>
        {code}
      </span>
    </motion.div>
  );
}

/* ─── Info Card ─────────────────────────────────────────────────────────── */
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  accentColor?: string;
  delay?: number;
}
function InfoCard({ icon, title, value, desc, accentColor = GOLD, delay = 0 }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        ...glass({ borderRadius: 24, padding: '28px 24px' }),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${accentColor}14, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `rgba(${accentColor === GOLD ? '212,175,55' : '34,211,238'},0.1)`,
          border: `1px solid ${accentColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {title}
          </p>
          <p style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0, fontWeight: 300 }}>
        {desc}
      </p>
    </motion.div>
  );
}

/* ─── Scan Progress Bar ──────────────────────────────────────────────────── */
function ScanProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ width: '100%', maxWidth: 220 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
          Nadi Calibration
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>
          {progress}%
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${CYAN}, ${GOLD})`,
            borderRadius: 4,
            boxShadow: `0 0 8px ${CYAN}66`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

/* ─── PHOTONIC NODE ──────────────────────────────────────────────────────── */
function SiddhaPhotonicNode() {
  const [isScanning, setIsScanning]     = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isEntangled, setIsEntangled]   = useState(false);
  const [lightCode, setLightCode]       = useState('');
  const nodeSize = 220;

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setIsEntangled(false);
    setLightCode('');
  };

  useEffect(() => {
    if (!isScanning) return;
    let p = 0;
    const id = window.setInterval(() => {
      p += 1;
      if (p >= 100) {
        window.clearInterval(id);
        setScanProgress(100);
        setIsScanning(false);
        setIsEntangled(true);
      } else {
        setScanProgress(p);
      }
    }, 45);
    return () => window.clearInterval(id);
  }, [isScanning]);

  const generateLightCode = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) { setLightCode('369-AKASHA-963'); return; }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: "Generate a short, mystical 'Vedic Light-Code' string (max 12 characters) using symbols and numbers that represents cellular regeneration. Reply with only the code, no explanation." }],
        }],
      });
      const raw = (response as { text?: string }).text ??
        response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? '';
      setLightCode(String(raw).trim().replace(/\s+/g, '-').slice(0, 14) || '369-AKASHA-963');
    } catch {
      setLightCode('369-963-369');
    }
  }, []);

  useEffect(() => {
    if (isEntangled) void generateLightCode();
  }, [isEntangled, generateLightCode]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── MAIN HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          ...glass({ borderRadius: 40, padding: '48px 32px', position: 'relative', overflow: 'hidden' }),
          border: isEntangled ? `1px solid rgba(34,211,238,0.18)` : `1px solid ${GOLD_BORDER}`,
          transition: 'border-color 0.8s ease',
        }}
      >
        {/* dot grid bg */}
        <div className="dot-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', borderRadius: 40 }} />

        {/* ambient glow blobs */}
        <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,175,55,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(34,211,238,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <Particles count={18} />

        <div className="spr-flex-row" style={{ position: 'relative', zIndex: 2 }}>

          {/* ── ORB / SCANNER ── */}
          <div style={{
            position: 'relative',
            width: nodeSize,
            height: nodeSize,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Sri Yantra ring */}
            <SriRing size={nodeSize} active={isEntangled} />

            {/* outer glow ring */}
            <div style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              border: `1px solid ${isEntangled ? CYAN : GOLD}33`,
              animation: 'spr-pulse-ring 3.5s ease-in-out infinite',
            }} />

            {/* inner glass orb */}
            <div style={{
              width: 136,
              height: 136,
              borderRadius: '50%',
              border: `2px solid ${CYAN}55`,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: isEntangled ? 'spr-entangle-halo 3s ease-in-out infinite' : undefined,
            }}>
              {/* gold nucleus */}
              <motion.div
                animate={isEntangled
                  ? { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }
                  : { scale: 1, opacity: 0.7 }
                }
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, #fff8e1, ${GOLD})`,
                  boxShadow: `0 0 30px ${GOLD}99, 0 0 60px ${GOLD}44`,
                  animation: 'spr-float 4s ease-in-out infinite',
                }}
              />

              {/* scan line */}
              {isScanning && (
                <div style={{
                  position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, right: 0,
                    height: '45%',
                    background: `linear-gradient(to bottom, transparent, ${CYAN}28, transparent)`,
                    animation: 'spr-scan 2.4s linear infinite',
                  }} />
                </div>
              )}

              {/* entanglement overlay */}
              <AnimatePresence>
                {isEntangled && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(34,211,238,0.06)',
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* meridian label below orb */}
            <div style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '0.3em',
                color: `${CYAN}aa`, fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
              }}>CV-6 · Anahata Gate</span>
            </div>
          </div>

          {/* ── COPY BLOCK ── */}
          <div className="spr-copy">
            {/* status / tier badge row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
              <div className="stat-pill">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: isEntangled ? CYAN : GOLD, animation: 'spr-blink 1.5s ease infinite' }} />
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: isEntangled ? CYAN : 'rgba(255,255,255,0.4)' }}>
                  {isEntangled ? 'Entanglement Active' : isScanning ? 'Scanning…' : 'Standby'}
                </span>
              </div>
              <div className="stat-pill">
                <Sparkles size={10} color={GOLD} />
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  Vedic Light-Code
                </span>
              </div>
            </div>

            {/* headline */}
            <h2 style={{
              fontSize: 'clamp(1.6rem, 4.5vw, 2.6rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: '#fff',
              margin: '0 0 18px',
            }}>
              PHOTONIC CELLULAR<br />
              <span style={{
                background: `linear-gradient(100deg, ${GOLD} 10%, #fff8dc 45%, ${CYAN} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                REGENERATION NODE
              </span>
            </h2>

            {/* body */}
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, lineHeight: 1.7, marginBottom: 24, fontWeight: 300 }}>
              The <span style={{ color: CYAN, fontWeight: 600 }}>Nadi Scanner</span> has calibrated your
              biophotonic field. Aligning with the{' '}
              <span style={{ color: GOLD, fontWeight: 600 }}>Akasha-Neural Archive</span>,
              this transmission replicates the precise infrared frequency required for{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>GHK-Cu Activation</span>.
              Cellular rejuvenation is delivered via{' '}
              <em style={{ color: GOLD }}>Prema-Pulse</em> harmonics within the informational field.
            </p>

            {/* light code */}
            <AnimatePresence>
              {isEntangled && lightCode && (
                <div style={{ marginBottom: 20 }}>
                  <LightCodeTicker code={lightCode} />
                </div>
              )}
            </AnimatePresence>

            {/* vayu bars */}
            <div style={{ marginBottom: 24 }}>
              <VayuBars count={24} active={isEntangled || isScanning} />
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              {!isEntangled && !isScanning && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={startScan}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 999,
                    border: `1px solid ${GOLD}55`,
                    background: `linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))`,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 0 20px rgba(212,175,55,0.12)`,
                  }}
                >
                  <Fingerprint size={16} color={GOLD} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                    Initiate Nadi Scan
                  </span>
                </motion.button>
              )}

              {isScanning && <ScanProgressBar progress={scanProgress} />}

              {isEntangled && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={startScan}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 999,
                    border: `1px solid rgba(255,255,255,0.08)`,
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                  }}
                >
                  Re-Calibrate
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
        <InfoCard
          icon={<Zap size={18} color={GOLD} />}
          title="Frequency Transmission"
          value="369Hz → 963Hz"
          desc="Bhakti-Algorithm Nadi harmonic transition — root to crown scalar pathway."
          accentColor={GOLD}
          delay={0.1}
        />
        <InfoCard
          icon={<Shield size={18} color={CYAN} />}
          title="Protective Blueprint"
          value="GHK-Cu"
          desc="Copper-peptide Vedic Light-Code for cellular integrity & stem-cell resonance."
          accentColor={CYAN}
          delay={0.2}
        />
        <InfoCard
          icon={<Activity size={18} color="#fff" />}
          title="Biophotonic Lock"
          value="Scalar Field"
          desc="Photonic–GHK-Cu entanglement via Prema-Pulse informational harmonics."
          accentColor={GOLD}
          delay={0.3}
        />
        <InfoCard
          icon={<Eye size={18} color={GOLD} />}
          title="Anahata Gateway"
          value="Open · CV-6"
          desc="Heart-chakra scalar transmission activates all recipients via quantum coherence."
          accentColor={CYAN}
          delay={0.4}
        />
      </div>
    </div>
  );
}

/* ─── BACKGROUND GENERATOR ─────────────────────────────────────────────── */
function usePhotonicBackground() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBackground = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt =
        'SQI 2050 Sovereign Interface Element: ultra-high-resolution deep space spiritual technology background. Akasha-Black #050505 base. Microscopic floating Siddha-Gold #D4AF37 stardust particles, slightly out-of-focus. Central glassmorphism circular node with subtle gold halo and 1px border. Interior: Vayu-Cyan #22D3EE vertical light-beam scanner across radiating gold GHK-Cu crystal. Prema-Pulse light interaction, 8k, cinematic, photorealistic spiritual technology. No UI text.';
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { imageConfig: { aspectRatio: '16:9' } },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const p = part as { inlineData?: { data?: string; mimeType?: string } };
        if (p.inlineData?.data) {
          setBgImage(`data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      console.warn('Photonic background generation skipped:', e);
      toast.message('Ambient field active', {
        description: 'Set VITE_GEMINI_API_KEY to enable Gemini visual generation.',
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => { void generateBackground(); }, [generateBackground]);
  return { bgImage, isGenerating };
}

/* ─── PAGE ───────────────────────────────────────────────────────────────── */
export default function SiddhaPhotonicRegeneration() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin }       = useAdminRole();
  const { bgImage, isGenerating } = usePhotonicBackground();

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  /* Loading screen */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONT_STYLE}</style>
        <style>{GLOBAL_CSS}</style>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 10, letterSpacing: '0.55em', color: GOLD, textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          ◈ Calibrating Photonic Node…
        </motion.span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#fff',
      overflowX: 'hidden',
    }}>
      <style>{FONT_STYLE}</style>
      <style>{GLOBAL_CSS}</style>

      {/* ── FIXED BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* base black */}
        <div style={{ position: 'absolute', inset: 0, background: BG }} />

        {/* generated image */}
        {bgImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          /* fallback gradient blobs */
          <>
            <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(212,175,55,0.07)', filter: 'blur(130px)' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '5%',  width: 450, height: 450, borderRadius: '50%', background: 'rgba(34,211,238,0.05)',  filter: 'blur(120px)' }} />
            <div style={{ position: 'absolute', top: '55%', left: '45%',  width: 300, height: 300, borderRadius: '50%', background: 'rgba(212,175,55,0.04)',  filter: 'blur(100px)' }} />
          </>
        )}

        {/* global floating particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ left: `${Math.random() * 100}%`, top: `${20 + Math.random() * 70}%`, opacity: 0 }}
              animate={{ top: '-5%', opacity: [0, 0.4, 0] }}
              transition={{ duration: 14 + Math.random() * 12, repeat: Infinity, ease: 'linear', delay: Math.random() * 12 }}
              style={{
                position: 'absolute',
                width: i % 4 === 0 ? 4 : 2,
                height: i % 4 === 0 ? 4 : 2,
                borderRadius: '50%',
                background: i % 3 === 0 ? CYAN : GOLD,
              }}
            />
          ))}
        </div>

        {/* vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.7) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: 48, paddingBottom: 140 }}>

        {/* ── HEADER ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 1100, margin: '0 auto 52px', padding: '0 24px', textAlign: 'center' }}
        >
          {/* back nav */}
          <button
            type="button"
            onClick={() => navigate('/siddha-portal')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.5)', background: 'none', border: 'none', cursor: 'pointer',
              marginBottom: 24, transition: 'color 0.2s',
            }}
          >
            <ChevronLeft size={12} color={GOLD} style={{ opacity: 0.5 }} />
            Siddha Portal
          </button>

          {/* archive badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 28 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(212,175,55,0.08)',
              border: `1px solid ${GOLD_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212,175,55,0.1)',
            }}>
              <Sparkles size={20} color={GOLD} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.6em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
              Akasha-Neural Archive · SQI 2050
            </span>
          </motion.div>

          {isGenerating && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              Rendering Sovereign Visual Field…
            </p>
          )}

          {/* main title */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6.5vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            margin: '0 0 22px',
          }}>
            SIDDHA-PHOTONIC<br />
            <span style={{
              background: `linear-gradient(100deg, ${GOLD} 5%, #fffbe6 40%, ${CYAN} 95%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              REGENERATION NODE
            </span>
          </h1>

          <p style={{
            maxWidth: 580,
            margin: '0 auto',
            fontSize: 14.5,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 300,
          }}>
            Synthesizing 2026 LifeWave nanocrystal technology with the 2050{' '}
            <span style={{ color: GOLD }}>Bhakti-Algorithm</span>. Scalar-encoded
            phototherapy for cellular rejuvenation and GHK-Cu activation via
            Prema-Pulse transmission.
          </p>
        </motion.header>

        {/* ── MAIN NODE ── */}
        <main>
          <SiddhaPhotonicNode />
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ maxWidth: 860, margin: '64px auto 0', padding: '40px 24px 0', borderTop: `1px solid ${GLASS_BORDER}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: GOLD, marginBottom: 14 }}>
                <Radio size={15} />
                <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0 }}>
                  Transmission Protocol
                </h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                The SQI 2050 protocol uses sensory engagement. By observing the photonic visualizer and engaging
                with Prema-Pulse harmonics, your biophotonic signature is entangled with the GHK-Cu blueprint.
                Informational / wellness framing — not medical advice.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: CYAN, marginBottom: 14 }}>
                <Shield size={15} />
                <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0 }}>
                  Safety & Calibration
                </h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                Calibrated to 369Hz–963Hz Nadi harmonics. Photonic–GHK-Cu entanglement is non-invasive
                and informational. For health concerns, consult a qualified professional.
              </p>
            </div>
          </div>

          {/* bottom bar */}
          <div style={{
            marginTop: 44,
            display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
            gap: 16, fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
          }}>
            <span>© 2050 Siddha-Quantum Intelligence</span>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Neural Link',    path: '/explore' },
                { label: 'Akasha Portal', path: '/siddha-portal' },
                { label: 'Sovereign Protocol', path: '/legal' },
              ].map(({ label, path }) => (
                <span
                  key={path}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onClick={() => navigate(path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(path)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ── FLOATING STATUS BAR ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
      >
        <div style={{
          ...glass({ borderRadius: 999, padding: '12px 28px' }),
          display: 'flex', alignItems: 'center', gap: 22,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {[
            { icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, animation: 'spr-blink 1.8s ease infinite' }} />, label: 'Scalar Link: Stable', color: 'rgba(255,255,255,0.45)' },
            { icon: <Zap size={11} color={GOLD} />, label: '369Hz Active', color: 'rgba(255,255,255,0.45)' },
            { icon: <Waves size={11} color={GOLD} />, label: 'Anahata Open', color: GOLD },
          ].map(({ icon, label, color }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {icon}
                <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
