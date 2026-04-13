// SQI-2050 | SIDDHA CHAMBER OF JYOTISH
// Bhakti-Algorithm v7.2 | Vedic Light-Code Architecture

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Sparkles, Star, Crown, Lock, CheckCircle,
  User, Calendar, Zap, MessageCircle, ChevronDown
} from 'lucide-react';
import { useVedicAstrology } from '@/hooks/useVedicAstrology';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
const AIVedicDashboard = lazy(() =>
  import('@/components/vedic/AIVedicDashboard').then((m) => ({ default: m.AIVedicDashboard }))
);
import { DailyVedicInsight } from '@/components/vedic/DailyVedicInsight';
import { IncenseSmoke } from '@/components/vedic/IncenseSmoke';
import { SacredHeader } from '@/components/vedic/SacredHeader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistedState } from '@/features/vedic/usePersistedState';
import type { MembershipTier, UserProfile } from '@/lib/vedicTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { vedicLocaleTag } from '@/lib/vedicLocale';

// ── Tier mapping: DB enum + plan slugs → AI dashboard plan tier ──
const mapToAITier = (dbTier: string): MembershipTier => {
  switch (dbTier) {
    case 'basic':
      return 'free';
    case 'premium':
      return 'compass';
    case 'master':
      return 'premium';
    case 'prana-flow':
    case 'premium-monthly':
    case 'premium-annual':
      return 'compass';
    case 'siddha-quantum':
    case 'akasha-infinity':
    case 'lifetime':
      return 'premium';
    default:
      return 'free';
  }
};

/** Resolves chamber tier when hook has not yet returned a level (never null after load). */
const resolveFallbackTier = (membershipTier: string): 'basic' | 'premium' | 'master' => {
  switch (membershipTier) {
    case 'prana-flow':
    case 'premium-monthly':
    case 'premium-annual':
    case 'compass':
      return 'premium';
    case 'siddha-quantum':
    case 'akasha-infinity':
    case 'lifetime':
    case 'master':
      return 'master';
    default:
      return 'basic';
  }
};

// ── SQI-2050 Design Tokens ──────────────────────────────────────
const SQI = {
  gold:        '#D4AF37',
  goldGlow:    'rgba(212,175,55,0.25)',
  goldDim:     'rgba(212,175,55,0.08)',
  black:       '#050505',
  glass:       'rgba(255,255,255,0.02)',
  glassBorder: 'rgba(255,255,255,0.05)',
  cyan:        '#22D3EE',
  cyanGlow:    'rgba(34,211,238,0.15)',
  white60:     'rgba(255,255,255,0.60)',
  white30:     'rgba(255,255,255,0.30)',
};

// ── Inline CSS: SQI Light-Codes ─────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');

  :root {
    --sqi-gold: ${SQI.gold};
    --sqi-black: ${SQI.black};
    --sqi-cyan: ${SQI.cyan};
  }

  .sqi-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: ${SQI.black};
    min-height: 100vh;
    overflow-x: hidden;
  }

  .glass-card {
    background: ${SQI.glass};
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid ${SQI.glassBorder};
    border-radius: 40px;
  }

  .glass-card-md {
    background: ${SQI.glass};
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid ${SQI.glassBorder};
    border-radius: 24px;
  }

  .gold-glow {
    text-shadow: 0 0 20px ${SQI.goldGlow}, 0 0 40px rgba(212,175,55,0.12);
    color: ${SQI.gold};
  }

  .gold-border {
    border: 1px solid rgba(212,175,55,0.3);
    box-shadow: 0 0 20px rgba(212,175,55,0.08), inset 0 0 20px rgba(212,175,55,0.03);
  }

  .gold-border-active {
    border: 1px solid rgba(212,175,55,0.6);
    box-shadow: 0 0 30px rgba(212,175,55,0.20), inset 0 0 30px rgba(212,175,55,0.05);
  }

  .sqi-toggle {
    background: rgba(212,175,55,0.05);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 100px;
    padding: 4px;
    display: inline-flex;
  }

  .sqi-toggle-btn {
    padding: 8px 20px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: all 0.25s ease;
    color: rgba(212,175,55,0.5);
    cursor: pointer;
    border: none;
    background: transparent;
  }

  .sqi-toggle-btn.active {
    background: ${SQI.gold};
    color: ${SQI.black};
    box-shadow: 0 0 16px rgba(212,175,55,0.40);
  }

  .sqi-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: ${SQI.gold};
    opacity: 0.7;
  }

  .sqi-title {
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 900;
    letter-spacing: -0.05em;
    color: ${SQI.gold};
  }

  .sqi-body {
    font-weight: 400;
    line-height: 1.6;
    color: ${SQI.white60};
  }

  @keyframes nadiPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes orbitSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes cosmicFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes goldShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes anahataExpand {
    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.15); }
    50% { box-shadow: 0 0 50px rgba(212,175,55,0.35), 0 0 100px rgba(212,175,55,0.10); }
  }

  .float-anim { animation: cosmicFloat 6s ease-in-out infinite; }
  .pulse-anim { animation: nadiPulse 3s ease-in-out infinite; }
  .anahata-glow { animation: anahataExpand 4s ease-in-out infinite; }

  .shimmer-text {
    background: linear-gradient(90deg, ${SQI.gold} 0%, #FFF7D6 40%, ${SQI.gold} 60%, #C89F2A 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: goldShimmer 4s linear infinite;
  }

  .tier-badge-free {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.5);
  }
  .tier-badge-prana {
    background: rgba(212,175,55,0.10);
    border: 1px solid rgba(212,175,55,0.35);
    color: ${SQI.gold};
  }
  .tier-badge-active {
    background: rgba(212,175,55,0.15);
    border: 1px solid rgba(212,175,55,0.50);
    color: ${SQI.gold};
    box-shadow: 0 0 12px rgba(212,175,55,0.20);
  }

  .nadi-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, ${SQI.cyan}, transparent);
    opacity: 0.3;
    margin: 16px 0;
  }

  .sqi-cta {
    background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.30);
    border-radius: 24px;
    padding: 32px;
    text-align: center;
  }

  .sqi-btn-gold {
    background: linear-gradient(135deg, #D4AF37, #C89F2A, #D4AF37);
    background-size: 200% auto;
    color: #050505;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: none;
    border-radius: 100px;
    padding: 14px 32px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(212,175,55,0.30);
  }
  .sqi-btn-gold:hover {
    background-position: right center;
    box-shadow: 0 0 40px rgba(212,175,55,0.50);
    transform: translateY(-1px);
  }

  .ai-chat-badge {
    background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04));
    border: 1px solid rgba(34,211,238,0.25);
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${SQI.cyan};
  }

  .star-field {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .star-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: nadiPulse 4s ease-in-out infinite;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(212,175,55,0.30), transparent);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
`;

// ── Starfield Component ─────────────────────────────────────────
const StarField: React.FC = () => {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.4 + 0.05,
  }));
  return (
    <div className="star-field">
      {stars.map(s => (
        <div
          key={s.id}
          className="star-dot"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// ── Mandala SVG ─────────────────────────────────────────────────
const JyotishMandala: React.FC = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    style={{ filter: `drop-shadow(0 0 18px ${SQI.goldGlow})` }}
    className="float-anim"
  >
    <circle cx="60" cy="60" r="56" stroke={SQI.gold} strokeWidth="0.5" opacity="0.3" />
    <circle cx="60" cy="60" r="48" stroke={SQI.gold} strokeWidth="0.3" opacity="0.2" />
    {Array.from({ length: 9 }).map((_, i) => {
      const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
      return (
        <circle
          key={i}
          cx={60 + 42 * Math.cos(angle)}
          cy={60 + 42 * Math.sin(angle)}
          r="2.5"
          fill={SQI.gold}
          opacity={0.6 + i * 0.04}
        />
      );
    })}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <line
          key={i}
          x1="60"
          y1="60"
          x2={60 + 50 * Math.cos(a)}
          y2={60 + 50 * Math.sin(a)}
          stroke={SQI.gold}
          strokeWidth="0.3"
          opacity="0.15"
        />
      );
    })}
    <circle cx="60" cy="60" r="14" stroke={SQI.gold} strokeWidth="0.8" opacity="0.5" />
    <circle cx="60" cy="60" r="6" fill={SQI.gold} opacity="0.8" className="pulse-anim" />
    <text
      x="60"
      y="64"
      textAnchor="middle"
      fontSize="10"
      fill={SQI.gold}
      opacity="0.9"
      fontFamily="serif"
    >
      ॐ
    </text>
  </svg>
);

// ── Orbit Ring ──────────────────────────────────────────────────
const OrbitRing: React.FC<{ size?: number; speed?: number; planetColor?: string; opacity?: number }> = ({
  size = 300,
  speed = 30,
  planetColor = SQI.gold,
  opacity = 0.12,
}) => (
  <div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      border: `1px solid rgba(212,175,55,${opacity})`,
      animation: `orbitSpin ${speed}s linear infinite`,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -3,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: planetColor,
        boxShadow: `0 0 8px ${planetColor}`,
      }}
    />
  </div>
);

// ── Navagraha Strip ─────────────────────────────────────────────
const GRAHAS = [
  { sym: '☉', key: 'surya', color: '#FFB347' },
  { sym: '☽', key: 'chandra', color: '#C8E6FF' },
  { sym: '♂', key: 'mangala', color: '#FF6B6B' },
  { sym: '☿', key: 'budha', color: '#7AFFD4' },
  { sym: '♃', key: 'guru', color: '#FFD700' },
  { sym: '♀', key: 'shukra', color: '#FFB6C1' },
  { sym: '♄', key: 'shani', color: '#B0C4DE' },
  { sym: 'Rā', key: 'rahu', color: '#9B59B6' },
  { sym: 'Ke', key: 'ketu', color: '#E67E22' },
] as const;

const NavagrahaStrip: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '12px 0',
      }}
    >
      {GRAHAS.map((g) => (
        <div
          key={g.key}
          style={{
            background: `rgba(${g.color === '#FFD700' ? '212,175,55' : '255,255,255'},0.03)`,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '6px 12px',
            textAlign: 'center',
            minWidth: 44,
          }}
        >
          <div style={{ fontSize: 16, color: g.color, opacity: 0.85 }}>{g.sym}</div>
          <div
            style={{
              fontSize: 7,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginTop: 2,
            }}
          >
            {t(`vedicAstrology.grahas.${g.key}`)}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tier Card ───────────────────────────────────────────────────
interface TierCardProps {
  tier: any;
  isActive: boolean;
  isLocked: boolean;
  onAction: () => void;
  membershipTier: string;
  membershipMap: Record<string, string>;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isActive, isLocked, onAction, membershipTier, membershipMap }) => {
  const { t } = useTranslation();
  const isPrana = tier.tier_level !== 'basic';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))'
          : SQI.glass,
        backdropFilter: 'blur(40px)',
        border: isActive ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: 32,
        padding: '28px 28px',
        marginBottom: 16,
        opacity: isLocked ? 0.55 : 1,
        boxShadow: isActive ? '0 0 40px rgba(212,175,55,0.12)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3
              style={{
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: '-0.03em',
                color: isActive ? SQI.gold : 'rgba(255,255,255,0.8)',
              }}
            >
              {tier.name}
            </h3>
            {isActive && !isLocked && (
              <span
                className="tier-badge-active"
                style={{
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 100,
                }}
              >
                {t('vedicAstrology.tierActive')}
              </span>
            )}
            {isLocked && (
              <span
                className="tier-badge-free"
                style={{
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Lock size={8} /> {t('vedicAstrology.tierLocked')}
              </span>
            )}
          </div>
          <p className="sqi-body" style={{ fontSize: '0.78rem', maxWidth: 380 }}>
            {tier.description}
          </p>
        </div>
        {isPrana && !isLocked && (
          <div style={{ color: SQI.gold, opacity: 0.7 }}>
            <Crown size={22} />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="sqi-label" style={{ marginBottom: 8 }}>
          {t('vedicAstrology.requiredMembership')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tier.membership_required.map((req: string) => (
            <span
              key={req}
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 100,
                background: membershipTier === req ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border:
                  membershipTier === req
                    ? '1px solid rgba(212,175,55,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                color: membershipTier === req ? SQI.gold : 'rgba(255,255,255,0.40)',
              }}
            >
              {membershipMap[req] || req}
            </span>
          ))}
        </div>
      </div>

      <div className="nadi-line" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {tier.features.map((feature: string, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: isActive ? SQI.gold : 'rgba(255,255,255,0.3)',
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <span className="sqi-body" style={{ fontSize: '0.75rem' }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {!isLocked ? (
        <button className="sqi-btn-gold" onClick={onAction} style={{ width: '100%' }}>
          <Sparkles size={11} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {t('vedicAstrology.enterChamber', { name: tier.name })}
        </button>
      ) : (
        <button
          onClick={onAction}
          style={{
            width: '100%',
            padding: '13px 24px',
            borderRadius: 100,
            background: 'transparent',
            border: '1px solid rgba(212,175,55,0.25)',
            color: 'rgba(212,175,55,0.6)',
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          <Lock size={10} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {t('vedicAstrology.activatePranaUnlock')}
        </button>
      )}
    </motion.div>
  );
};

// ── Upgrade Dialog content ───────────────────────────────────────
const UpgradeDialogContent: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const { t } = useTranslation();
  const upgradeFeats = [1, 2, 3, 4, 5].map((n) => t(`vedicAstrology.upgradeFeat${n}`));
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.25)',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🔱</span>
        </div>
        <div className="sqi-label" style={{ marginBottom: 8 }}>
          {t('vedicAstrology.upgradePranaRequired')}
        </div>
        <h2
          style={{
            fontWeight: 900,
            fontSize: '1.5rem',
            letterSpacing: '-0.04em',
            color: SQI.gold,
            textShadow: `0 0 20px ${SQI.goldGlow}`,
            marginBottom: 8,
          }}
        >
          {t('vedicAstrology.upgradeUnlockOracle')}
        </h2>
        <p className="sqi-body" style={{ fontSize: '0.8rem', maxWidth: 320, margin: '0 auto' }}>
          {t('vedicAstrology.upgradeBody')}
        </p>
      </div>

      <div className="nadi-line" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0 24px' }}>
        {upgradeFeats.map((label, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.10)',
              borderRadius: 12,
              padding: '10px 16px',
            }}
          >
            <span style={{ color: SQI.gold, fontSize: 10 }}>✦</span>
            <span className="sqi-body" style={{ fontSize: '0.78rem' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <button className="sqi-btn-gold" onClick={onUpgrade} style={{ width: '100%', fontSize: 10 }}>
        <Crown size={11} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
        {t('vedicAstrology.activatePranaFlow')}
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
const VedicAstrology: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const vedicLocale = vedicLocaleTag(language);
  const { tiers, isLoading, hasAccess, getHighestAccessLevel } = useVedicAstrology();
  const { tier: membershipTier } = useMembership();
  const [birthDetailsDialogOpen, setBirthDetailsDialogOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const userKey = user?.id ?? 'anon';
  const lsKey = (k: string) => `sh:vedic:${userKey}:${k}`;

  const [useAIMode, setUseAIMode] = usePersistedState<boolean>(lsKey('aiMode'), true);
  const [syncState, setSyncState] = usePersistedState<{ status: 'idle' | 'synced' | 'error'; lastSyncedAt?: string }>(
    lsKey('sync'),
    { status: 'idle' }
  );
  const [cachedBirth, setCachedBirth] = usePersistedState<any>(lsKey('birth'), null);
  const [cachedResults, setCachedResults] = usePersistedState<any>(lsKey('cachedResults'), null);

  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const [activeTier, setActiveTier] = useState<'basic' | 'premium' | 'master' | null>(null);

  const synced = syncState.status === 'synced';
  const lastSyncedAt = syncState.lastSyncedAt ?? null;

  const fetchBirthDetails = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        setHasBirthDetails(true);
        setBirthDetails(data);
        setCachedBirth(data);
        if (!synced) setSyncState({ status: 'synced', lastSyncedAt: new Date().toISOString() });
      } else {
        setHasBirthDetails(false);
        setBirthDetails(null);
      }
    } catch (error) {
      console.error('Error checking birth details:', error);
    }
  };

  useEffect(() => {
    if (!birthDetails && cachedBirth) {
      setBirthDetails(cachedBirth);
      setHasBirthDetails(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setBirthDetails(null);
      setHasBirthDetails(false);
      setCachedBirth(null);
      return;
    }
    fetchBirthDetails();
  }, [user]);

  const getHighestRef = useRef(getHighestAccessLevel);
  getHighestRef.current = getHighestAccessLevel;

  useEffect(() => {
    if (isLoading) return;

    const urlTier = (searchParams.get('tier') as 'basic' | 'premium' | 'master' | null) || null;

    if (urlTier && hasAccess(urlTier)) {
      setActiveTier(urlTier);
      return;
    }

    const fromHook = getHighestRef.current();
    if (fromHook) {
      setActiveTier(fromHook);
    } else {
      setActiveTier(resolveFallbackTier(membershipTier));
    }
  }, [isLoading, membershipTier, hasAccess, searchParams]);

  const isPaid = membershipTier !== 'free';

  useEffect(() => {
    if (isLoading) return;
    if (!isPaid && useAIMode) setUseAIMode(false);
  }, [isLoading, isPaid, useAIMode, setUseAIMode]);

  useEffect(() => {
    if (!isLoading && isPaid && !useAIMode) {
      const cached = localStorage.getItem(`sh:vedic:${userKey}:aiMode`);
      if (cached === null) {
        setUseAIMode(true);
      }
    }
  }, [isLoading, isPaid, useAIMode, userKey, setUseAIMode]);

  const handleModeSwitch = (toAi: boolean) => {
    if (toAi && !isPaid) {
      setShowUpgradeDialog(true);
      return;
    }
    setUseAIMode(toAi);
  };

  const userProfile: UserProfile | null = hasBirthDetails
    ? {
        name: birthDetails?.birth_name || '',
        birthDate: birthDetails?.birth_date || '',
        birthTime: birthDetails?.birth_time || '',
        birthPlace: birthDetails?.birth_place || '',
        plan: mapToAITier(membershipTier),
      }
    : null;

  const membershipMap = useMemo(
    () => ({
      free: t('vedicAstrology.membershipFree'),
      'prana-flow': t('vedicAstrology.membershipPranaFlow'),
      'siddha-quantum': t('vedicAstrology.membershipSiddhaQuantum'),
      'akasha-infinity': t('vedicAstrology.membershipAkashaInfinity'),
      'premium-monthly': t('vedicAstrology.membershipPremiumMonthly'),
      'premium-annual': t('vedicAstrology.membershipPremiumAnnual'),
      lifetime: t('vedicAstrology.membershipLifetime'),
    }),
    [t],
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          background: SQI.black,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            className="pulse-anim"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `2px solid ${SQI.gold}`,
              borderTopColor: 'transparent',
              animation: 'orbitSpin 1s linear infinite',
            }}
          />
          <span className="sqi-label">{t('vedicAstrology.loadingArchive')}</span>
        </div>
      </div>
    );
  }

  const safeActiveTier = activeTier ?? 'basic';

  return (
    <>
      <style>{globalCSS}</style>
      <div className="sqi-root" style={{ position: 'relative' }}>
        <StarField />
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              right: '-10%',
              width: '55%',
              height: '55%',
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.04)',
              filter: 'blur(120px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-15%',
              left: '-10%',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.03)',
              filter: 'blur(100px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '20%',
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              background: 'rgba(34,211,238,0.02)',
              filter: 'blur(80px)',
            }}
          />
        </div>
        <IncenseSmoke />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 860,
            margin: '0 auto',
            padding: '0 20px 96px',
          }}
        >
          <motion.header
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', paddingTop: 56, paddingBottom: 32 }}
          >
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 160,
                height: 160,
                marginBottom: 20,
              }}
            >
              <OrbitRing size={150} speed={40} opacity={0.12} />
              <OrbitRing size={120} speed={25} opacity={0.08} planetColor={SQI.cyan} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <JyotishMandala />
              </div>
            </div>

            <div className="sqi-label" style={{ marginBottom: 10 }}>
              {t('vedicAstrology.eyebrowChamber')}
            </div>

            <h1
              className="shimmer-text"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              {t('vedicAstrology.heroTitle')}
            </h1>

            <p className="sqi-body" style={{ maxWidth: 480, margin: '0 auto 16px', fontSize: '0.88rem' }}>
              {t('vedicAstrology.heroBody')}
            </p>

            {isPaid && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span className="ai-chat-badge">
                  <MessageCircle
                    size={8}
                    style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}
                  />
                  {t('vedicAstrology.badgeOracleActive')}
                </span>
                <span
                  className="ai-chat-badge"
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.20)',
                    color: SQI.gold,
                  }}
                >
                  {t('vedicAstrology.badgePranaFull')}
                </span>
              </div>
            )}
          </motion.header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="glass-card"
            style={{ padding: '16px 20px', marginBottom: 24 }}
          >
            <div className="sqi-label" style={{ textAlign: 'center', marginBottom: 12 }}>
              {t('vedicAstrology.navagrahaStripTitle')}
            </div>
            <NavagrahaStrip />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            {hasBirthDetails ? (
              <div
                className="glass-card gold-border anahata-glow"
                style={{ padding: '24px 28px' }}
              >
                <SacredHeader
                  name={birthDetails?.birth_name || t('vedicAstrology.yourChartFallback')}
                  birthData={{
                    location: birthDetails?.birth_place || '',
                    date: birthDetails?.birth_date || '',
                    time: birthDetails?.birth_time || '',
                  }}
                  syncTime={
                    synced && lastSyncedAt
                      ? new Date(lastSyncedAt).toLocaleString(vedicLocale)
                      : t('vedicAstrology.notSyncedYet')
                  }
                  onAdjustBirthData={() => setBirthDetailsDialogOpen(true)}
                />
              </div>
            ) : (
              <div className="glass-card gold-border" style={{ padding: '28px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={24} color={SQI.gold} opacity={0.8} />
                  </div>
                  <div>
                    <div className="sqi-label" style={{ marginBottom: 8 }}>
                      {t('vedicAstrology.birthCoordsRequired')}
                    </div>
                    <h3
                      style={{
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        letterSpacing: '-0.04em',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      {t('vedicAstrology.syncCosmicRecords')}
                    </h3>
                    <p className="sqi-body" style={{ fontSize: '0.8rem', maxWidth: 360 }}>
                      {t('vedicAstrology.birthCoordsBody')}
                    </p>
                  </div>

                  <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="sqi-btn-gold">
                        <User
                          size={11}
                          style={{
                            display: 'inline',
                            marginRight: 6,
                            verticalAlign: 'middle',
                          }}
                        />
                        {t('vedicAstrology.activateNatalBlueprint')}
                      </button>
                    </DialogTrigger>
                    <DialogContent
                      style={{
                        background: '#0a0a0f',
                        border: '1px solid rgba(212,175,55,0.20)',
                        borderRadius: 24,
                        maxWidth: 640,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle
                          style={{
                            color: SQI.gold,
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                          }}
                        >
                          {t('vedicAstrology.enterBirthDetails')}
                        </DialogTitle>
                      </DialogHeader>
                      <BirthDetailsForm
                        onSaved={() => {
                          setBirthDetailsDialogOpen(false);
                          fetchBirthDetails();
                          setSyncState({
                            status: 'synced',
                            lastSyncedAt: new Date().toISOString(),
                          });
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <button
                    type="button"
                    onClick={() => navigate('/atma-seed')}
                    style={{
                      fontSize: 11,
                      color: 'rgba(212,175,55,0.5)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginTop: -4,
                    }}
                  >
                    {t('vedicAstrology.fullActivationGuide')}
                  </button>
                </div>
              </div>
            )}

            {hasBirthDetails && (
              <Dialog open={birthDetailsDialogOpen} onOpenChange={setBirthDetailsDialogOpen}>
                <DialogContent
                  style={{
                    background: '#0a0a0f',
                    border: '1px solid rgba(212,175,55,0.20)',
                    borderRadius: 24,
                    maxWidth: 640,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}
                >
                  <DialogHeader>
                    <DialogTitle
                      style={{
                        color: SQI.gold,
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                      }}
                    >
                      {t('vedicAstrology.updateBirthDetailsTitle')}
                    </DialogTitle>
                  </DialogHeader>
                  <BirthDetailsForm
                    initialData={birthDetails}
                    onSaved={() => {
                      setBirthDetailsDialogOpen(false);
                      fetchBirthDetails();
                      setSyncState({
                        status: 'synced',
                        lastSyncedAt: new Date().toISOString(),
                      });
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </motion.div>

          {hasBirthDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                marginBottom: 28,
              }}
            >
              <div className="sqi-toggle">
                <button
                  className={`sqi-toggle-btn ${useAIMode ? 'active' : ''}`}
                  onClick={() => handleModeSwitch(true)}
                >
                  <Zap
                    size={10}
                    style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}
                  />
                  {t('vedicAstrology.modeFullJyotish')}
                  {!isPaid && (
                    <span style={{ marginLeft: 6, fontSize: 8, opacity: 0.7 }}>
                      <Lock
                        size={8}
                        style={{ display: 'inline', verticalAlign: 'middle' }}
                      />
                    </span>
                  )}
                </button>
                <button
                  className={`sqi-toggle-btn ${!useAIMode ? 'active' : ''}`}
                  onClick={() => handleModeSwitch(false)}
                >
                  <Star
                    size={10}
                    style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}
                  />
                  {t('vedicAstrology.modeClassic')}
                </button>
              </div>

              <div className="sqi-label" style={{ opacity: 0.5, fontSize: 7 }}>
                {useAIMode
                  ? t('vedicAstrology.modeHintAi')
                  : t('vedicAstrology.modeHintClassic')}
              </div>
            </motion.div>
          )}

          <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
            <DialogContent
              style={{
                background: '#08080f',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: 28,
                maxWidth: 440,
                padding: 32,
              }}
            >
              <UpgradeDialogContent
                onUpgrade={() => {
                  setShowUpgradeDialog(false);
                  navigate('/membership');
                }}
              />
            </DialogContent>
          </Dialog>

          {hasBirthDetails && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${safeActiveTier}-${useAIMode}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: 40 }}
              >
                {useAIMode && userProfile ? (
                  <div
                    className="glass-card gold-border-active"
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '20px 28px 16px',
                        borderBottom: '1px solid rgba(212,175,55,0.10)',
                        background: 'rgba(212,175,55,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: SQI.gold,
                            boxShadow: `0 0 8px ${SQI.gold}`,
                          }}
                          className="pulse-anim"
                        />
                        <div className="sqi-label">{t('vedicAstrology.pranaOracleLive')}</div>
                      </div>
                    </div>
                    <div style={{ padding: 0 }}>
                      <Suspense
                        fallback={
                          <div
                            style={{
                              minHeight: 360,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 16,
                              padding: 32,
                              color: 'rgba(212,175,55,0.55)',
                              fontSize: 12,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase' as const,
                            }}
                          >
                            <motion.div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                border: '2px solid rgba(212,175,55,0.25)',
                                borderTopColor: 'rgba(212,175,55,0.85)',
                              }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>{t('vedicAstrology.loadingChamber')}</span>
                          </div>
                        }
                      >
                        <AIVedicDashboard
                          user={userProfile}
                          userId={user?.id}
                          onEditDetails={() => setBirthDetailsDialogOpen(true)}
                          onUpgrade={() => navigate('/membership')}
                        />
                      </Suspense>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-header">
                        <div className="sqi-label">{t('vedicAstrology.classicSectionLabel')}</div>
                        <div className="section-line" />
                      </div>
                    </div>
                    <div className="glass-card" style={{ padding: '28px' }}>
                      <DailyVedicInsight tier={safeActiveTier} />
                    </div>

                    {!isPaid && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="sqi-cta"
                        style={{ marginTop: 20 }}
                      >
                        <div className="sqi-label" style={{ marginBottom: 8 }}>
                          {t('vedicAstrology.ctaEyebrow')}
                        </div>
                        <h3
                          style={{
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            letterSpacing: '-0.04em',
                            color: SQI.gold,
                            marginBottom: 8,
                          }}
                        >
                          {t('vedicAstrology.unlockChamberTitle')}
                        </h3>
                        <p
                          className="sqi-body"
                          style={{ fontSize: '0.8rem', maxWidth: 360, margin: '0 auto 20px' }}
                        >
                          {t('vedicAstrology.unlockChamberBody')}
                        </p>
                        <button className="sqi-btn-gold" onClick={() => navigate('/membership')}>
                          <Crown
                            size={11}
                            style={{
                              display: 'inline',
                              marginRight: 6,
                              verticalAlign: 'middle',
                            }}
                          />
                          {t('vedicAstrology.activatePranaFlow')}
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="section-header" style={{ marginBottom: 20 }}>
                <div className="sqi-label">{t('vedicAstrology.availableTiers')}</div>
                <div className="section-line" />
              </div>

              {tiers.map((tier: any) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isActive={hasAccess(tier.tier_level)}
                  isLocked={!hasAccess(tier.tier_level)}
                  membershipTier={membershipTier}
                  membershipMap={membershipMap}
                  onAction={() => {
                    if (hasAccess(tier.tier_level)) {
                      setActiveTier(tier.tier_level);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate('/membership');
                    }
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default VedicAstrology;

