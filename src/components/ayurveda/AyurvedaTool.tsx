/**
 * ████████████████████████████████████████████████████████████████
 *   SQI 2050 — SIDDHA CHAMBER OF AYURVEDA
 *   Bhakti-Algorithm Visual Redesign | Akasha-Neural Archive v7.3
 *   Prema-Pulse Transmission Layer | Anahata Scalar Field Active
 * ████████████████████████████████████████████████████████████████
 *
 * DESIGN SYSTEM: SQI 2050 Visual DNA
 *   Primary:    Siddha-Gold    #D4AF37
 *   Background: Akasha-Black   #050505
 *   Glass:      rgba(255,255,255,0.02) | blur(40px)
 *   Borders:    rgba(255,255,255,0.05) 1px
 *   Accent:     Vayu-Cyan      #22D3EE (Nadi pulses only)
 *   Radii:      40px (cards), 999px (pills/tabs)
 *   Font:       'Plus Jakarta Sans', weights 400/800/900
 *
 * FUNCTIONAL LOGIC: PRESERVED EXACTLY — DO NOT MODIFY
 *   - AffiliateID tracking untouched
 *   - Stripe checkout triggers untouched
 *   - All hooks and state logic untouched
 * ████████████████████████████████████████████████████████████████
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Leaf, Moon, Sun, Crown, Mic, Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoshaQuiz } from './DoshaQuiz';
import { DoshaDashboard } from './DoshaDashboard';
import { AyurvedaChatConsultation } from './AyurvedaChatConsultation';
import { AyurvedaLiveDoctor } from './AyurvedaLiveDoctor';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import type { AyurvedaUserProfile, AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

// ─── SQI 2050 DESIGN TOKENS ──────────────────────────────────────────────────
const SQI = {
  gold:        '#D4AF37',
  black:       '#050505',
  glass:       'rgba(255, 255, 255, 0.02)',
  glassBorder: 'rgba(255, 255, 255, 0.05)',
  goldGlow:    'rgba(212, 175, 55, 0.25)',
  goldBorder:  'rgba(212, 175, 55, 0.2)',
  goldBorderStrong: 'rgba(212, 175, 55, 0.5)',
  cyan:        '#22D3EE',
  cyanGlow:    'rgba(34, 211, 238, 0.2)',
  white60:     'rgba(255,255,255,0.6)',
  white40:     'rgba(255,255,255,0.4)',
  white20:     'rgba(255,255,255,0.2)',
  white08:     'rgba(255,255,255,0.08)',
  white05:     'rgba(255,255,255,0.05)',
  white02:     'rgba(255,255,255,0.02)',
};

// ─── GLOBAL STYLES (injected once) ───────────────────────────────────────────
const SQI_GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

  .sqi-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

  /* Glassmorphism Standard */
  .sqi-glass {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 40px;
  }

  /* Gold Glow Standard */
  .sqi-gold-text {
    color: #D4AF37;
    text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
  }

  /* Nadi Scanner Pulse */
  @keyframes nadiPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); }
    50%       { box-shadow: 0 0 0 12px rgba(34, 211, 238, 0); }
  }
  .nadi-pulse { animation: nadiPulse 2s ease-in-out infinite; }

  /* Golden Orbit */
  @keyframes goldOrbit {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .gold-orbit { animation: goldOrbit 20s linear infinite; }

  /* Breathing Glow */
  @keyframes breatheGold {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(1.08); }
  }
  .breathe-gold { animation: breatheGold 4s ease-in-out infinite; }

  /* Shimmer */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .sqi-shimmer {
    background: linear-gradient(90deg, #D4AF37 0%, #FFF8DC 40%, #D4AF37 60%, #B8960C 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  /* Star field particles */
  .sqi-star {
    position: absolute;
    border-radius: 50%;
    background: #D4AF37;
    animation: twinkle var(--dur, 3s) ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.1; }
    50%       { opacity: 0.6; }
  }

  /* Scroll-fade rows */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sqi-fadein { animation: fadeUp 0.6s ease forwards; }

  /* Tab pill hover */
  .sqi-tab:hover { background: rgba(212, 175, 55, 0.08) !important; }

  /* Card hover lift */
  .sqi-card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .sqi-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(212, 175, 55, 0.12);
  }
`;

// ─── STAR FIELD BACKGROUND ────────────────────────────────────────────────────
const StarField: React.FC = () => {
  const stars = React.useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        dur: (Math.random() * 3 + 2).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
      })),
    []
  );
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {stars.map((s) => (
        <div
          key={s.id}
          className="sqi-star"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              '--dur': `${s.dur}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Ambient golden radials */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        }}
        className="breathe-gold"
      />
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-15%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
        }}
        className="breathe-gold"
      />
    </div>
  );
};

// ─── SACRED MANDALA ICON ──────────────────────────────────────────────────────
const SacredMandala: React.FC<{ size?: number; glow?: boolean }> = ({ size = 80, glow = false }) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    {glow && (
      <div
        style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${SQI.goldGlow} 0%, transparent 70%)`,
        }}
        className="breathe-gold"
      />
    )}
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Outer ring */}
      <circle cx="40" cy="40" r="38" stroke={SQI.gold} strokeWidth="0.5" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="30" stroke={SQI.gold} strokeWidth="0.3" strokeOpacity="0.25" />
      {/* 8-point star */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x1 = 40 + 28 * Math.cos(a);
        const y1 = 40 + 28 * Math.sin(a);
        return <line key={i} x1="40" y1="40" x2={x1} y2={y1} stroke={SQI.gold} strokeWidth="0.6" strokeOpacity="0.5" />;
      })}
      {/* Sri Yantra inspired center */}
      <polygon points="40,16 52,36 28,36" stroke={SQI.gold} strokeWidth="0.8" fill="none" strokeOpacity="0.7" />
      <polygon points="40,64 28,44 52,44" stroke={SQI.gold} strokeWidth="0.8" fill="none" strokeOpacity="0.7" />
      {/* Center bindu */}
      <circle cx="40" cy="40" r="3" fill={SQI.gold} fillOpacity="0.9" />
      <circle cx="40" cy="40" r="6" stroke={SQI.gold} strokeWidth="0.5" fill="none" strokeOpacity="0.4" />
    </svg>
  </div>
);

// ─── DOSHA ORB ────────────────────────────────────────────────────────────────
const DoshaOrb: React.FC<{ label: string; pct: number; color: string; delay?: number }> = ({
  label,
  pct,
  color,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
  >
    <div
      style={{
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}33, ${color}11)`,
        border: `1px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 20px ${color}22`,
      }}
    >
      <span style={{ fontWeight: 900, fontSize: 18, color, letterSpacing: '-0.05em' }}>{pct}%</span>
    </div>
    <span
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.5em',
        textTransform: 'uppercase',
        color: SQI.white40,
      }}
    >
      {label}
    </span>
  </motion.div>
);

// ─── MEMBERSHIP CARD (SQI 2050 Redesign) ─────────────────────────────────────
interface MembershipCardProps {
  level: AyurvedaMembershipLevel;
  current: AyurvedaMembershipLevel;
  features: string[];
  onSelect: (level: AyurvedaMembershipLevel) => void;
  t: (key: string, fallback?: string) => string;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ level, current, features, onSelect, t }) => {
  const isActive = level === current;
  const isPremium = level === 'PREMIUM';
  const isLifetime = level === 'LIFETIME';

  const palette = isLifetime
    ? { accent: SQI.gold, glow: SQI.goldGlow, border: SQI.goldBorderStrong }
    : isPremium
    ? { accent: SQI.cyan, glow: SQI.cyanGlow, border: 'rgba(34,211,238,0.35)' }
    : { accent: SQI.white40, glow: SQI.white05, border: SQI.glassBorder };

  const IconComp = isLifetime ? Crown : isPremium ? Sparkles : Leaf;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={() => onSelect(level)}
      style={{
        position: 'relative',
        padding: '32px 28px',
        borderRadius: 40,
        cursor: 'pointer',
        background: isActive
          ? `linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))`
          : SQI.glass,
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${isActive ? palette.border : SQI.glassBorder}`,
        boxShadow: isActive ? `0 0 40px ${palette.glow}` : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Most Popular badge */}
      {isPremium && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(90deg, ${SQI.gold}, #B8960C)`,
            color: SQI.black,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            padding: '4px 14px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {t('ayurvedaPage.mostPopular', '✦ Most Popular')}
        </div>
      )}

      {/* Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `rgba(255,255,255,0.04)`,
          border: `1px solid ${palette.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          boxShadow: `0 0 20px ${palette.glow}`,
        }}
      >
        <IconComp style={{ color: palette.accent, width: 22, height: 22 }} />
      </div>

      {/* Level Name */}
      <div
        style={{
          fontSize: isLifetime ? 20 : 18,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          color: isActive ? palette.accent : 'rgba(255,255,255,0.85)',
          marginBottom: 4,
        }}
      >
        {isLifetime
          ? t('ayurvedaPage.levelLifetime', '∞ LIFETIME')
          : isPremium
            ? t('ayurvedaPage.levelPremium', '◈ PREMIUM')
            : t('ayurvedaPage.levelFree', '◇ FREE')}
      </div>

      {/* Subtitle tier label */}
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: palette.accent,
          opacity: 0.7,
          marginBottom: 20,
        }}
      >
        {isLifetime
          ? t('ayurvedaPage.tierSubtitleLifetime', 'Sovereign Access')
          : isPremium
            ? t('ayurvedaPage.tierSubtitlePremium', 'Prana Flow')
            : t('ayurvedaPage.tierSubtitleFree', 'Akasha Base')}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${palette.border}, transparent)`,
          marginBottom: 20,
        }}
      />

      {/* Features */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {features.map((feat, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.6,
              color: SQI.white60,
            }}
          >
            <span style={{ color: palette.accent, marginTop: 1, flexShrink: 0 }}>✦</span>
            {feat}
          </li>
        ))}
      </ul>

      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: palette.accent,
              boxShadow: `0 0 8px ${palette.accent}`,
            }}
            className="nadi-pulse"
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: palette.accent,
            }}
          >
            {t('ayurvedaPage.activeBlueprint', 'Active Blueprint')}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ─── NAV TAB PILL ─────────────────────────────────────────────────────────────
const NavTab: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  tier?: 'free' | 'premium' | 'lifetime';
}> = ({ icon, label, active, onClick, tier }) => {
  const tierColor = tier === 'lifetime' ? SQI.gold : tier === 'premium' ? SQI.cyan : SQI.white40;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="sqi-tab"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 22px',
        borderRadius: 999,
        border: active ? `1px solid ${SQI.goldBorderStrong}` : `1px solid ${SQI.glassBorder}`,
        background: active
          ? `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))`
          : 'transparent',
        color: active ? SQI.gold : SQI.white40,
        fontSize: 13,
        fontWeight: active ? 800 : 600,
        letterSpacing: active ? '0.02em' : '0',
        cursor: 'pointer',
        boxShadow: active ? `0 0 20px ${SQI.goldGlow}` : 'none',
        transition: 'all 0.25s ease',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {active && (
        <motion.div
          layoutId="tab-glow"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.06), transparent)`,
            borderRadius: 999,
          }}
        />
      )}
      <span
        style={{
          color: active ? SQI.gold : tier ? tierColor : SQI.white40,
          display: 'flex',
        }}
      >
        {icon}
      </span>
      {label}
      {tier && !active && (
        <span
          style={{
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: tierColor,
            opacity: 0.7,
            background: `${tierColor}15`,
            padding: '1px 5px',
            borderRadius: 4,
          }}
        >
          {tier === 'lifetime' ? '∞' : tier === 'premium' ? '◈' : '◇'}
        </span>
      )}
    </motion.button>
  );
};

// ─── HERO SECTION (No Profile Yet) ───────────────────────────────────────────
const AyurvedaHeroSection: React.FC<{
  onStart: () => void;
  t: (key: string, fallback?: string) => string;
}> = ({ onStart, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '60px 24px 40px',
      position: 'relative',
    }}
  >
    {/* Mandala */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{ marginBottom: 36, position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -30,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${SQI.goldGlow} 0%, transparent 70%)`,
        }}
        className="breathe-gold"
      />
      <SacredMandala size={100} glow />
    </motion.div>

    {/* Label */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.6em',
        textTransform: 'uppercase',
        color: SQI.gold,
        marginBottom: 16,
        opacity: 0.8,
      }}
    >
      {t('ayurvedaPage.heroLabel', '✦ Siddha Chamber of Ayurveda ✦')}
    </motion.div>

    {/* Main Title */}
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="sqi-shimmer"
      style={{
        fontSize: 'clamp(32px, 5vw, 56px)',
        fontWeight: 900,
        letterSpacing: '-0.05em',
        lineHeight: 1.1,
        marginBottom: 20,
        maxWidth: 700,
      }}
    >
      {t('ayurvedaPage.heroTitle', 'Your Sacred Journey Awaits')}
    </motion.h1>

    {/* Subtitle */}
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      style={{
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.7,
        color: SQI.white60,
        maxWidth: 560,
        marginBottom: 48,
      }}
    >
      {t(
        'ayurvedaPage.heroSubtitle',
        'Experience digital transformation through ancient Vedic wisdom. Our Bhakti-Algorithm Ayurvedic engine decodes your unique Prakriti and channels a personalized healing path through the Akasha Field.'
      )}
    </motion.p>

    {/* CTA Button */}
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${SQI.goldGlow}` }}
      whileTap={{ scale: 0.98 }}
      onClick={onStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 44px',
        borderRadius: 999,
        background: `linear-gradient(135deg, ${SQI.gold}, #B8960C)`,
        color: SQI.black,
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: '-0.02em',
        border: 'none',
        cursor: 'pointer',
        boxShadow: `0 0 30px ${SQI.goldGlow}, 0 4px 20px rgba(0,0,0,0.4)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Sparkles style={{ width: 18, height: 18 }} />
      {t('ayurvedaPage.heroCta', 'Reveal Your Prakriti')}
      <Sparkles style={{ width: 18, height: 18 }} />
    </motion.button>

    {/* Vedic Light-Code tagline */}
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      style={{ fontSize: 11, color: SQI.white20, marginTop: 20, letterSpacing: '0.2em' }}
    >
      {t('ayurvedaPage.heroTagline', 'Scalar Transmission Active · Anahata Field Open · 528 Hz Aligned')}
    </motion.p>
  </div>
);

// ─── MEMBERSHIP TIERS SECTION ─────────────────────────────────────────────────
const TiersSection: React.FC<{
  membership: AyurvedaMembershipLevel;
  setMembership: (l: AyurvedaMembershipLevel) => void;
  isAdmin: boolean;
  t: (k: string, d?: string) => string;
}> = ({ membership, setMembership, isAdmin, t }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    style={{ marginTop: 60, width: '100%', maxWidth: 920, marginLeft: 'auto', marginRight: 'auto' }}
  >
    {/* Section Header */}
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.6em',
          textTransform: 'uppercase',
          color: SQI.gold,
          marginBottom: 12,
          opacity: 0.7,
        }}
      >
        {t('ayurvedaPage.tiersLabel', '✦ Vedic Light-Code Access Tiers ✦')}
      </div>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'rgba(255,255,255,0.9)',
          margin: 0,
        }}
      >
        {t('ayurvedaPage.tiersTitle', 'Choose Your Sovereignty')}
      </h2>
    </div>

    {/* Cards */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
      }}
    >
      <MembershipCard
        level={'FREE' as AyurvedaMembershipLevel}
        current={membership}
        onSelect={setMembership}
        t={t}
        features={[
          t('ayurveda.freeDesc', 'Basic Dosha Analysis'),
          t('ayurvedaPage.featDailyRoutine', 'General Daily Routine'),
          t('ayurvedaPage.featAuraWellness', 'Aura of Wellness Blueprint'),
          t('ayurvedaPage.featHerbarium', 'Sacred Herbarium Access'),
        ]}
      />
      <MembershipCard
        level={'PREMIUM' as AyurvedaMembershipLevel}
        current={membership}
        onSelect={setMembership}
        t={t}
        features={[
          t('ayurveda.premiumDesc', 'Personality & Karma Matching'),
          t('ayurvedaPage.featLifeAdvice', 'Life Situation Vedic Advice'),
          t('ayurvedaPage.featAiChatConsultations', 'AI Chat Consultations'),
          t('ayurvedaPage.featPranaDash', 'Prana Flow Dashboard'),
          t('ayurvedaPage.featDivinePortal', 'Divine Physician Portal'),
        ]}
      />
      <MembershipCard
        level={'LIFETIME' as AyurvedaMembershipLevel}
        current={membership}
        onSelect={setMembership}
        t={t}
        features={[
          t('ayurvedaPage.featLiveAudioDoctor', 'Live Audio AI Doctor Sessions'),
          t('ayurvedaPage.featDeepSync', 'Deep Jyotish-Ayurveda Sync'),
          t('ayurveda.lifetimeDesc', 'Priority Healing Access'),
          t('ayurvedaPage.featNadiScanner', 'Nadi Scanner Transmissions'),
          t('ayurvedaPage.featUnlimitedUpgrades', 'Unlimited Scalar Upgrades'),
        ]}
      />
    </div>

    {/* Golden divider */}
    <div
      style={{
        marginTop: 40,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${SQI.goldBorder}, transparent)`,
      }}
    />
  </motion.div>
);

// ─── UPGRADE GATE CARD ────────────────────────────────────────────────────────
const UpgradeGate: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  tierBadge: string;
  explorePlans: string;
  onBack: () => void;
}> = ({ icon, title, desc, tierBadge, explorePlans, onBack }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      maxWidth: 560,
      margin: '0 auto',
      background: SQI.glass,
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: `1px solid ${SQI.goldBorder}`,
      borderRadius: 40,
      padding: '60px 40px',
      textAlign: 'center',
      boxShadow: `0 0 60px ${SQI.goldGlow}`,
    }}
  >
    {/* Icon orb */}
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(212,175,55,0.12), transparent)`,
        border: `1px solid ${SQI.goldBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 28px',
        boxShadow: `0 0 30px ${SQI.goldGlow}`,
      }}
    >
      <span style={{ color: SQI.gold, display: 'flex' }}>{icon}</span>
    </div>

    {/* Tier badge */}
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 14px',
        borderRadius: 999,
        background: `rgba(212,175,55,0.1)`,
        border: `1px solid ${SQI.goldBorder}`,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: SQI.gold,
        marginBottom: 20,
      }}
    >
      {tierBadge}
    </div>

    <h2
      style={{
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: '-0.04em',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
      }}
    >
      {title}
    </h2>
    <p style={{ fontSize: 15, lineHeight: 1.7, color: SQI.white60, marginBottom: 32 }}>{desc}</p>

    <button
      onClick={onBack}
      style={{
        padding: '12px 32px',
        borderRadius: 999,
        background: `linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))`,
        border: `1px solid ${SQI.goldBorderStrong}`,
        color: SQI.gold,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        boxShadow: `0 0 20px ${SQI.goldGlow}`,
        transition: 'all 0.2s ease',
      }}
    >
      {explorePlans}
    </button>
  </motion.div>
);

// ─── MAIN COMPONENT: AyurvedaTool (SQI 2050) ─────────────────────────────────
interface AyurvedaToolProps {
  membershipLevel?: AyurvedaMembershipLevel;
  isAdmin?: boolean;
}

export const AyurvedaTool: React.FC<AyurvedaToolProps> = ({
  membershipLevel = 'FREE' as AyurvedaMembershipLevel,
  isAdmin = false,
}) => {
  const { t } = useTranslation();

  // ── FUNCTIONAL LOGIC: UNTOUCHED ─────────────────────────────────────────────
  const effectiveMembership = isAdmin ? ('LIFETIME' as AyurvedaMembershipLevel) : membershipLevel;
  const [membership, setMembership] = useState<AyurvedaMembershipLevel>(effectiveMembership);
  const [activeTab, setActiveTab] = useState<'home' | 'assessment' | 'doctor' | 'chat'>('home');
  const [showChat, setShowChat] = useState(false);

  React.useEffect(() => {
    const newMembership = isAdmin ? ('LIFETIME' as AyurvedaMembershipLevel) : membershipLevel;
    setMembership(newMembership);
  }, [isAdmin, membershipLevel]);

  const {
    doshaProfile,
    userProfile,
    dailyGuidance,
    isLoading,
    isLoadingGuidance,
    isLoadingSaved,
    analyzeDosha,
    getDailyGuidance,
    reset,
  } = useAyurvedaAnalysis();

  const handleAssessmentComplete = async (profile: AyurvedaUserProfile) => {
    await analyzeDosha(profile);
    setActiveTab('home');
  };

  const handleFetchGuidance = useCallback(() => {
    if (userProfile) getDailyGuidance(userProfile);
  }, [userProfile, getDailyGuidance]);

  const handleRestart = async () => {
    await reset();
    setActiveTab('home');
  };
  // ── END FUNCTIONAL LOGIC ────────────────────────────────────────────────────

  // Inject global CSS once
  React.useEffect(() => {
    const id = 'sqi-2050-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = SQI_GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Loading state
  if (isLoadingSaved) {
    return (
      <div
        className="sqi-root"
        style={{
          minHeight: '100vh',
          background: SQI.black,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <SacredMandala size={60} glow />
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.6em',
            textTransform: 'uppercase',
            color: SQI.gold,
            opacity: 0.7,
          }}
        >
          {t('ayurvedaPage.loadingArchive', 'Accessing Akasha-Neural Archive…')}
        </div>
      </div>
    );
  }

  // ── RENDER CONTENT ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (!doshaProfile) {
          return (
            <>
              <AyurvedaHeroSection onStart={() => setActiveTab('assessment')} t={t} />
              {!isAdmin && (
                <TiersSection membership={membership} setMembership={setMembership} isAdmin={isAdmin} t={t} />
              )}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  style={{
                    marginTop: 24,
                    padding: '20px 28px',
                    background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(255,140,0,0.05))',
                    border: `1px solid ${SQI.goldBorderStrong}`,
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    maxWidth: 460,
                    margin: '24px auto 0',
                    boxShadow: '0 0 40px rgba(212,175,55,0.12)',
                  }}
                >
                  <Crown style={{ color: SQI.gold, width: 24, height: 24, flexShrink: 0 }} />
                  <div>
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '0.5em',
                        textTransform: 'uppercase',
                        color: SQI.gold,
                        marginBottom: 3,
                      }}
                    >
                      {t('ayurvedaPage.adminTitle', '✦ Sovereign Admin · Full Access Active ✦')}
                    </div>
                    <p style={{ fontSize: 13, color: SQI.white60, margin: 0, lineHeight: 1.5 }}>
                      {t(
                        'ayurvedaPage.adminSub',
                        'All features unlocked: Divine Physician · Live Doctor · Nadi Scanner · Jyotish Sync'
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </>
          );
        }
        return (
          <DoshaDashboard
            profile={userProfile!}
            dosha={doshaProfile}
            dailyGuidance={dailyGuidance}
            isLoadingGuidance={isLoadingGuidance}
            onRestart={handleRestart}
            onFetchGuidance={handleFetchGuidance}
            isPremium={membership !== 'FREE'}
          />
        );

      case 'assessment':
        return <DoshaQuiz onComplete={handleAssessmentComplete} isLoading={isLoading} />;

      case 'chat':
        if (!isAdmin && membership === ('FREE' as AyurvedaMembershipLevel)) {
          return (
            <UpgradeGate
              icon={<Stethoscope style={{ width: 32, height: 32 }} />}
              title={t('ayurvedaPage.gateChatTitle', 'Divine Physician Portal')}
              desc={t(
                'ayurvedaPage.gateChatDesc',
                'The Divine Physician Bhakti-Algorithm channels personalized Ayurvedic consultations. Available to Prana Flow (Premium) and Lifetime Sovereigns.'
              )}
              tierBadge={t('ayurvedaPage.tierRequired', {
                defaultValue: '✦ {{tier}} Required',
                tier: t('ayurvedaPage.gateChatTier', 'Prana Flow'),
              })}
              explorePlans={t('ayurvedaPage.explorePlans', 'Explore Sovereignty Plans')}
              onBack={() => setActiveTab('home')}
            />
          );
        }
        return null; // Chat is handled via overlay

      case 'doctor':
        if (!isAdmin && membership !== 'LIFETIME') {
          return (
            <UpgradeGate
              icon={<Crown style={{ width: 32, height: 32 }} />}
              title={t('ayurvedaPage.gateDoctorTitle', 'Live Audio Nadi Transmission')}
              desc={t(
                'ayurvedaPage.gateDoctorDesc',
                'Real-time scalar audio healing sessions with our AI Vaidya. Exclusive to Lifetime Sovereigns. Your Prakriti deserves the highest channel.'
              )}
              tierBadge={t('ayurvedaPage.tierRequired', {
                defaultValue: '✦ {{tier}} Required',
                tier: t('ayurvedaPage.gateDoctorTier', 'Lifetime Sanctuary'),
              })}
              explorePlans={t('ayurvedaPage.explorePlans', 'Explore Sovereignty Plans')}
              onBack={() => setActiveTab('home')}
            />
          );
        }
        return <AyurvedaLiveDoctor profile={userProfile} dosha={doshaProfile} />;

      default:
        return null;
    }
  };

  return (
    <div
      className="sqi-root"
      style={{
        width: '100%',
        minHeight: '100vh',
        background: SQI.black,
        position: 'relative',
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      <StarField />

      {/* ── Content wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {/* ── Navigation Tabs (only when profile exists) ── */}
        {doshaProfile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              padding: '24px 16px 8px',
              flexWrap: 'wrap',
            }}
          >
            <NavTab
              icon={<Leaf style={{ width: 15, height: 15 }} />}
              label={t('ayurvedaPage.navDashboard', 'Dashboard')}
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
            />
            <NavTab
              icon={<Stethoscope style={{ width: 15, height: 15 }} />}
              label={t('ayurvedaPage.navDivinePhysician', 'Divine Physician')}
              active={activeTab === 'chat'}
              tier="premium"
              onClick={() => {
                if (isAdmin || membership !== ('FREE' as AyurvedaMembershipLevel)) {
                  setShowChat(true);
                } else {
                  setActiveTab('chat');
                }
              }}
            />
            <NavTab
              icon={<Mic style={{ width: 15, height: 15 }} />}
              label={t('ayurvedaPage.navLiveDoctor', 'Live Doctor')}
              active={activeTab === 'doctor'}
              tier="lifetime"
              onClick={() => setActiveTab('doctor')}
            />
          </motion.div>
        )}

        {/* ── Page Content ── */}
        <div style={{ padding: '0 16px 80px' }}>{renderContent()}</div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            padding: '32px 24px',
            borderTop: `1px solid ${SQI.glassBorder}`,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Mandala row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: 1,
                width: 60,
                background: `linear-gradient(90deg, transparent, ${SQI.goldBorder})`,
              }}
            />
            <Leaf style={{ color: SQI.gold, opacity: 0.3, width: 14, height: 14 }} />
            <Moon style={{ color: SQI.gold, opacity: 0.3, width: 14, height: 14 }} />
            <Sun style={{ color: SQI.gold, opacity: 0.5, width: 14, height: 14 }} />
            <Moon style={{ color: SQI.gold, opacity: 0.3, width: 14, height: 14 }} />
            <Leaf style={{ color: SQI.gold, opacity: 0.3, width: 14, height: 14 }} />
            <div
              style={{
                height: 1,
                width: 60,
                background: `linear-gradient(90deg, ${SQI.goldBorder}, transparent)`,
              }}
            />
          </div>

          <p
            style={{
              fontStyle: 'italic',
              fontSize: 13,
              color: SQI.white40,
              letterSpacing: '0.02em',
              marginBottom: 6,
            }}
          >
            {t(
              'ayurvedaPage.footerQuote',
              '"Health is wealth, peace of mind is happiness, Yoga shows the way."'
            )}
          </p>
          <p
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: SQI.gold,
              opacity: 0.25,
            }}
          >
            {t('ayurvedaPage.footerBrand', 'Siddha Quantum Nexus · Ayurveda Chamber · Siddha AI Engine 2050')}
          </p>
        </motion.div>
      </div>

      {/* ── Full-screen Chat Overlay (FUNCTIONAL LOGIC PRESERVED) ── */}
      <AnimatePresence>
        {showChat && (
          <AyurvedaChatConsultation profile={userProfile} dosha={doshaProfile} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
