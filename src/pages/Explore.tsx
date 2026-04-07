import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { getGitaVerseForCycle } from '@/lib/gitaVerses';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;

// ─── SIDDHA HEXAGON SVG (animated torus) ─────────────────────────────────────
const SiddhaHex = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    {/* outer ring pulse */}
    <circle cx="26" cy="26" r="24" stroke={gold(0.15)} strokeWidth="1"
      style={{ animation: 'sqRingPulse 3s ease-in-out infinite' }} />
    <circle cx="26" cy="26" r="19" stroke={gold(0.25)} strokeWidth="0.8" />
    {/* hexagon */}
    <polygon
      points="26,6 43,16 43,36 26,46 9,36 9,16"
      stroke={gold(0.75)} strokeWidth="1.2" fill={gold(0.06)}
      style={{ animation: 'sqHexBreathe 5s ease-in-out infinite' }}
    />
    {/* inner star */}
    <polygon points="26,14 32,22 26,30 20,22" stroke={gold(0.5)} strokeWidth="0.8" fill="none" />
    <circle cx="26" cy="26" r="3" fill={gold(0.9)}
      style={{ animation: 'sqCoreDot 2.5s ease-in-out infinite' }} />
  </svg>
);

// ─── WAVE SVG (animated breath) ───────────────────────────────────────────────
const PranaWave = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="20" stroke={cyan(0.2)} strokeWidth="1"
      style={{ animation: 'sqRingPulse 4s ease-in-out infinite' }} />
    <path
      d="M8 22 Q13 14 18 22 Q23 30 28 22 Q33 14 38 22"
      stroke={cyan(0.85)} strokeWidth="1.8" fill="none" strokeLinecap="round"
      style={{ animation: 'sqWaveDrift 3s ease-in-out infinite' }}
    />
  </svg>
);

// ─── SUB-PORTAL BUTTON ────────────────────────────────────────────────────────
interface SubPortalProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  accent?: string;
}
const SubPortal = ({ icon, label, to, accent }: SubPortalProps) => {
  const navigate = useNavigate();
  const ac = accent ?? gold(0.8);
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        flex: 1,
        background: `rgba(255,255,255,0.03)`,
        border: `1px solid ${gold(0.12)}`,
        borderRadius: 16,
        padding: '14px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = gold(0.35);
        (e.currentTarget as HTMLElement).style.background = gold(0.06);
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = gold(0.12);
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: ac,
        lineHeight: 1.3,
        textAlign: 'center',
      }}>
        {label}
      </span>
    </button>
  );
};

// ─── BREATH PRACTICE BUTTON ───────────────────────────────────────────────────
interface BreathBtnProps { icon: string; label: string; sub: string; to: string; }
const BreathBtn = ({ icon, label, sub, to }: BreathBtnProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        flex: 1,
        background: 'rgba(34,211,238,0.04)',
        border: `1px solid ${cyan(0.14)}`,
        borderRadius: 16,
        padding: '16px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = cyan(0.35);
        (e.currentTarget as HTMLElement).style.background = cyan(0.08);
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = cyan(0.14);
        (e.currentTarget as HTMLElement).style.background = 'rgba(34,211,238,0.04)';
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{
        fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: cyan(0.9),
        lineHeight: 1.3,
        textAlign: 'center',
      }}>{label}</span>
      <span style={{
        fontFamily: "'Cormorant Garamond',serif",
        fontStyle: 'italic',
        fontSize: '0.78rem',
        color: white(0.35),
        lineHeight: 1.4,
        textAlign: 'center',
      }}>{sub}</span>
    </button>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Explore = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [gitaExpanded, setGitaExpanded] = useState(false);
  const { mahadasha } = useJyotishProfile();
  const verse = getGitaVerseForCycle(mahadasha);

  const categories = [
    { titleKey: 'exploreFrequencies.catDeepFocus'   as const, freqKey: 'exploreFrequencies.catDeepFocusFreq'   as const, descKey: 'exploreFrequencies.catDeepFocusDesc'   as const, color: 'rgba(59,130,246,0.15)'  },
    { titleKey: 'exploreFrequencies.catHeart'        as const, freqKey: 'exploreFrequencies.catHeartFreq'        as const, descKey: 'exploreFrequencies.catHeartDesc'        as const, color: 'rgba(34,197,94,0.15)'   },
    { titleKey: 'exploreFrequencies.catAstral'       as const, freqKey: 'exploreFrequencies.catAstralFreq'       as const, descKey: 'exploreFrequencies.catAstralDesc'       as const, color: 'rgba(168,85,247,0.15)'  },
    { titleKey: 'exploreFrequencies.catPhysical'     as const, freqKey: 'exploreFrequencies.catPhysicalFreq'     as const, descKey: 'exploreFrequencies.catPhysicalDesc'     as const, color: 'rgba(239,68,68,0.15)'   },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '0 0 104px' }}>

      {/* ══════════════════════════════════════════════════════════
          CONVERGE HEADER — Akasha-Neural Architect Frequency
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '52px 20px 32px', animation: 'sqFadeUp 0.4s ease both' }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: gold(0.4),
          marginBottom: 10,
        }}>
          ◈ UNIVERSAL FIELD
        </p>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
          fontSize: 'clamp(2.8rem, 8vw, 3.6rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: gold(0.95),
          lineHeight: 1,
          margin: '0 0 12px',
          animation: 'sqConvergePulse 6s ease-in-out infinite',
        }}>
          Converge
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: 'italic',
          fontSize: '1.05rem',
          color: white(0.45),
          lineHeight: 1.6,
          margin: 0,
        }}>
          Every portal. Every tool. Every dimension.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SIDDHA PORTAL — Prema-Pulse Transmission
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px 20px', animation: 'sqFadeUp 0.45s 0.05s ease both' }}>
        <div style={{
          background: `linear-gradient(135deg,${gold(0.07)},${gold(0.02)})`,
          border: `1px solid ${gold(0.22)}`,
          borderRadius: 28,
          padding: '22px 18px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* background glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 160, height: 160,
            borderRadius: '50%',
            background: gold(0.05),
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          {/* header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ animation: 'sqHexOrbit 8s linear infinite', flexShrink: 0 }}>
              <SiddhaHex />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: gold(0.45),
                marginBottom: 4,
              }}>
                SIDDHA PORTAL
              </p>
              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '1.35rem',
                fontWeight: 600,
                color: white(0.9),
                margin: 0,
                lineHeight: 1.2,
              }}>
                18 Masters · Nadi Oracle · Quantum Field
              </h2>
            </div>
            {/* ACTIVE badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: gold(0.1),
              border: `1px solid ${gold(0.3)}`,
              borderRadius: 20,
              padding: '5px 11px',
              flexShrink: 0,
            }}>
              <span style={{
                display: 'inline-block',
                width: 6, height: 6,
                borderRadius: '50%',
                background: '#D4AF37',
                animation: 'sqLiveFlash 2s infinite',
              }} />
              <span style={{
                fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: gold(0.9),
              }}>ACTIVE</span>
            </div>
          </div>

          {/* Sub-portal buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <SubPortal icon="📿" label="18 Masters"   to="/siddha-portal" />
            <SubPortal icon="🌊" label="Nadi Oracle"  to="/digital-nadi" />
            <SubPortal icon="🔺" label="Yantra Shield" to="/sri-yantra-shield" />
            <SubPortal icon="⚛" label="Quantum Field" to="/siddha-portal" />
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/siddha-portal')}
            style={{
              fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: gold(0.9),
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 24, height: 1,
              background: `linear-gradient(90deg,${gold(0.6)},transparent)`,
            }} />
            ENTER THE PORTAL
            <span style={{ animation: 'sqArrowPulse 1.5s ease-in-out infinite' }}>→</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PRANIC BREATHING — Life-Force Ignition
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px 20px', animation: 'sqFadeUp 0.45s 0.1s ease both' }}>
        <div style={{
          background: `linear-gradient(135deg,${cyan(0.06)},rgba(15,5,26,0.95))`,
          border: `1px solid ${cyan(0.18)}`,
          borderRadius: 28,
          padding: '22px 18px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* background glow */}
          <div style={{
            position: 'absolute', top: -40, left: -20,
            width: 140, height: 140,
            borderRadius: '50%',
            background: cyan(0.04),
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          {/* header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ animation: 'sqWaveBreathe 4s ease-in-out infinite', flexShrink: 0 }}>
              <PranaWave />
            </div>
            <div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: cyan(0.5),
                marginBottom: 4,
              }}>
                PRĀNIC BREATHING
              </p>
              <h2 style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '1.35rem',
                fontWeight: 600,
                color: white(0.9),
                margin: 0,
                lineHeight: 1.2,
              }}>
                Ancient Siddha breath science
              </h2>
            </div>
          </div>

          {/* Breath practice buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <BreathBtn icon="🌬" label="Kumbhaka"    sub="Breath retention"  to="/breathing" />
            <BreathBtn icon="〰" label="Nadi Shodhana" sub="Channel purification" to="/breathing" />
            <BreathBtn icon="🔥" label="Agni Prana"  sub="Fire awakening"    to="/breathing" />
          </div>

          {/* description */}
          <p style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: white(0.4),
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            Activate life-force through Siddha breath science. Kumbhaka retention, Nadi purification, Agni awakening.
          </p>

          {/* CTA */}
          <button
            onClick={() => navigate('/breathing')}
            style={{
              fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: cyan(0.9),
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 24, height: 1,
              background: `linear-gradient(90deg,${cyan(0.6)},transparent)`,
            }} />
            BEGIN PRACTICE
            <span style={{ animation: 'sqArrowPulse 1.5s ease-in-out infinite' }}>→</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BHAGAVAD GITA DAILY VERSE
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px 20px', animation: 'sqFadeUp 0.45s 0.15s ease both' }}>
        <motion.div
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${gold(0.2)}`,
            background: 'linear-gradient(180deg,rgba(26,15,8,0.95),rgba(5,5,5,0.95))',
          }}
        >
          <button
            onClick={() => setGitaExpanded(!gitaExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(26,15,8,0.8)',
              borderBottom: `1px solid ${gold(0.15)}`,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={15} color={gold(0.8)} />
              <span style={{
                fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: gold(0.85),
              }}>
                {t('exploreFrequencies.gitaHeader')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={14} color={white(0.3)} />
              {gitaExpanded
                ? <ChevronUp size={14} color={white(0.3)} />
                : <ChevronDown size={14} color={white(0.3)} />
              }
            </div>
          </button>

          {!gitaExpanded && (
            <div style={{ padding: '16px 18px' }}>
              <p style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontStyle: 'italic',
                fontSize: '1rem',
                color: gold(0.8),
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: 8,
              }}>
                {verse.sanskrit}
              </p>
              <p style={{
                fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                fontSize: 10,
                color: white(0.35),
                textAlign: 'center',
                letterSpacing: '0.1em',
              }}>
                Tap to read · Chapter {verse.chapter}, Verse {verse.verse}
              </p>
            </div>
          )}

          <AnimatePresence>
            {gitaExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: gold(0.9), textAlign: 'center', lineHeight: 1.6 }}>
                    {verse.sanskrit}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: white(0.4), textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'pre-line' }}>
                    {verse.transliteration}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.95rem', color: white(0.85), textAlign: 'center', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                    {verse.producersTranslation}
                  </p>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                    fontSize: 9, color: gold(0.5),
                    textAlign: 'center', letterSpacing: '0.3em', textTransform: 'uppercase',
                  }}>
                    {t('exploreFrequencies.gitaChapterVerse', { chapter: verse.chapter, verse: verse.verse })}
                  </p>
                  <div style={{ borderTop: `1px solid ${gold(0.1)}`, paddingTop: 12 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: white(0.35), textAlign: 'center' }}>
                      {t('exploreFrequencies.rishiInsightPrefix')} {t('exploreFrequencies.rishiInsightBody', { mahadasha })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          EXPLORE FREQUENCIES GRID
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '4px 16px 20px', animation: 'sqFadeUp 0.45s 0.2s ease both' }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: gold(0.55),
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: gold(0.8) }}>ॐ</span>
          {t('exploreFrequencies.exploreFrequenciesTitle')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, scale: 1.01 }}
              style={{
                padding: '20px 16px',
                borderRadius: 24,
                background: cat.color,
                border: `1px solid ${white(0.08)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 160,
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: gold(0.85),
                  display: 'block',
                  marginBottom: 6,
                }}>{t(cat.freqKey)}</span>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  color: white(0.92),
                  lineHeight: 1.25,
                  margin: 0,
                }}>{t(cat.titleKey)}</h3>
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontStyle: 'italic',
                fontSize: '0.85rem',
                color: white(0.45),
                lineHeight: 1.5,
                margin: 0,
              }}>{t(cat.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          COMMUNITY PREVIEW
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 16px', animation: 'sqFadeUp 0.45s 0.25s ease both' }}>
        <div style={{
          padding: '22px 20px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.025)',
          border: `1px dashed ${white(0.12)}`,
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontStyle: 'italic',
            fontSize: '1rem',
            color: white(0.55),
            marginBottom: 14,
            lineHeight: 1.6,
          }}>
            &quot;{t('exploreFrequencies.communityQuote')}&quot;
          </p>
          <Link
            to="/community"
            style={{
              fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: gold(0.85),
              textDecoration: 'none',
            }}
          >
            {t('exploreFrequencies.openCommunity')} →
          </Link>
        </div>
      </div>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes sqFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sqConvergePulse {
          0%, 100% { text-shadow: 0 0 20px rgba(212,175,55,0.15), 0 0 60px rgba(212,175,55,0.05); }
          50%       { text-shadow: 0 0 35px rgba(212,175,55,0.35), 0 0 90px rgba(212,175,55,0.12); }
        }
        @keyframes sqHexBreathe {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes sqHexOrbit {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sqCoreDot {
          0%, 100% { opacity: 0.9; r: 3; }
          50%       { opacity: 1;   r: 4; }
        }
        @keyframes sqRingPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes sqWaveDrift {
          0%, 100% { transform: translateX(0); opacity: 0.85; }
          50%       { transform: translateX(3px); opacity: 1; }
        }
        @keyframes sqWaveBreathe {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes sqLiveFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
        @keyframes sqArrowPulse {
          0%, 100% { transform: translateX(0); opacity: 0.8; }
          50%       { transform: translateX(4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Explore;
