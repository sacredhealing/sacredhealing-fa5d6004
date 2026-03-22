import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Play, Sparkles } from 'lucide-react';
import { normalizePlanetName, getPlanetOfDay, type Planet } from '@/lib/jyotishMantraLogic';
import type { PalmArchetype } from '@/lib/palmScanStore';

const DASHA_MANTRA_DISPLAY: Record<string, string> = {
  Jupiter: 'Om Gurave Namaha',
  Rahu: 'Om Ram Rahave Namah',
  Venus: 'Om Shum Shukraya Namah',
  Sun: 'Om Hrim Suryaya Namah',
  Moon: 'Om Shrim Chandramase Namah',
  Mars: 'Om Krim Mangalaya Namah',
  Mercury: 'Om Budhaya Namah',
  Saturn: 'Om Sham Shanaye Namah',
  Ketu: 'Om Kem Ketave Namah',
};

function getRevealedMantra(
  handAnalysisComplete: boolean,
  palmArchetype: PalmArchetype | null | undefined,
  dashaPlanet: Planet | null,
  prescribedText: string | null
): { text: string; planet: Planet } {
  // Palm + Dasha combo
  if (handAnalysisComplete && palmArchetype && dashaPlanet) {
    if (palmArchetype === 'Spiritual Mastery' && dashaPlanet === 'Jupiter') {
      return { text: 'Om Gurave Namaha', planet: 'Jupiter' };
    }
    if (palmArchetype === 'Karmic Debt' && dashaPlanet === 'Rahu') {
      return { text: 'Om Ram Rahave Namah', planet: 'Rahu' };
    }
  }
  // Dasha planet with prescribed text
  if (dashaPlanet && prescribedText) {
    return { text: prescribedText, planet: dashaPlanet };
  }
  // Dasha planet from known map
  if (dashaPlanet && DASHA_MANTRA_DISPLAY[dashaPlanet]) {
    return { text: DASHA_MANTRA_DISPLAY[dashaPlanet], planet: dashaPlanet };
  }
  // Palm-only fallbacks
  if (handAnalysisComplete && palmArchetype) {
    if (palmArchetype === 'Spiritual Mastery') return { text: 'Om Gurave Namaha', planet: 'Jupiter' };
    if (palmArchetype === 'Karmic Debt') return { text: 'Om Ram Rahave Namah', planet: 'Rahu' };
  }
  // FALLBACK: use today's day ruler planet — always reveals
  const dayPlanet = getPlanetOfDay();
  return { text: DASHA_MANTRA_DISPLAY[dayPlanet] || 'Om Gurave Namaha', planet: dayPlanet };
}

export interface BhriguCardProps {
  handAnalysisComplete: boolean;
  palmArchetype?: PalmArchetype | null;
  activeDasha: Planet | null;
  prescribedText: string | null;
  onPlayRemedy: (planet: Planet) => void;
  t: (key: string, fallbackOrOptions?: string | Record<string, unknown>) => string;
  heartLineLeak?: boolean;
  onPlayHeartHealing?: () => void;
  heartHealingMantraTitle?: string | null;
}

const BhriguCard: React.FC<BhriguCardProps> = ({
  handAnalysisComplete,
  palmArchetype,
  activeDasha,
  prescribedText,
  onPlayRemedy,
  t,
  heartLineLeak,
  onPlayHeartHealing,
  heartHealingMantraTitle,
}) => {
  const revealed = getRevealedMantra(handAnalysisComplete, palmArchetype, activeDasha, prescribedText);

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 28,
      border: '2px solid rgba(212,175,55,0.5)',
      background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(0,0,0,0.6) 100%)',
      boxShadow: heartLineLeak
        ? '0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(244,63,94,0.15)'
        : '0 0 0 1px rgba(212,175,55,0.3), 0 0 24px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.1)',
      padding: '20px 22px',
    }}>
      {/* Leaf icon top-right */}
      <div style={{ position: 'absolute', top: 14, right: 14, color: 'rgba(212,175,55,0.6)' }}>
        <Leaf size={20} strokeWidth={1.5} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Sparkles size={18} style={{ color: '#D4AF37' }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4AF37' }}>
          {t('mantras.bhriguSamhita')}
        </span>
      </div>

      {/* Heart healing section */}
      {heartLineLeak && (
        <div style={{
          marginBottom: 16, padding: 14, borderRadius: 16,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(244,63,94,0.8)', marginBottom: 4 }}>
            {t('mantras.bhriguFromPalmScan')}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
            {t('mantras.bhriguHeartHealingLine')}
          </p>
          {onPlayHeartHealing && (
            <button
              onClick={onPlayHeartHealing}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 12,
                background: 'transparent', border: '1px solid rgba(244,63,94,0.4)',
                color: 'rgba(244,63,94,0.8)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Play size={12} />
              {heartHealingMantraTitle
                ? t('mantras.bhriguPlayHeartHealingNamed', { title: heartHealingMantraTitle })
                : t('mantras.bhriguPlayHeartHealing')}
            </button>
          )}
        </div>
      )}

      {/* Siddha verdict */}
      {handAnalysisComplete && (
        <p style={{ fontSize: 11, color: 'rgba(212,175,55,0.7)', fontStyle: 'italic', marginBottom: 8 }}>
          {t('mantras.bhriguSiddhaVerdict')}
        </p>
      )}

      {/* Holy Remedy */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>
        {t('mantras.bhriguHolyRemedy')}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
        {t('mantras.bhriguPlanetRemedy', { planet: revealed.planet })}
      </p>

      {/* Mantra text with shimmer */}
      <motion.p
        key={revealed.text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: 22,
          fontWeight: 600,
          color: '#D4AF37',
          letterSpacing: '0.03em',
          marginBottom: 18,
          lineHeight: 1.3,
        }}
      >
        {revealed.text}
      </motion.p>

      {/* Play button — outlined gold style matching reference */}
      <button
        onClick={() => onPlayRemedy(revealed.planet)}
        style={{
          width: '100%',
          padding: '13px 20px',
          borderRadius: 14,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.35)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)';
          e.currentTarget.style.background = 'rgba(212,175,55,0.12)';
          e.currentTarget.style.color = '#D4AF37';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
          e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
        }}
      >
        <Play size={14} />
        {t('mantras.bhriguPlayPlanetRemedy', { planet: revealed.planet })}
      </button>
    </div>
  );
};

export default BhriguCard;
