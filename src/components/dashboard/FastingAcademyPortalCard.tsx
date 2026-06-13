// src/components/dashboard/FastingAcademyPortalCard.tsx
// ⟡ SQI 2050 — Siddha Fasting Academy — Portal Card ⟡
// Links from the Siddha Portal / Dashboard to /siddha-fasting-academy

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, ChevronRight } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';

const gold  = (a: number) => `rgba(212,175,55,${a})`;
const amber = (a: number) => `rgba(251,146,60,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const FONT  = "'Plus Jakarta Sans','Montserrat',sans-serif";
const SERIF = "'Cormorant Garamond',serif";

const TIER_PREVIEWS = [
  { label: 'FREE',           color: white(0.6),  modules: 4,  lessons: 32 },
  { label: 'PRANA FLOW',     color: '#4ADE80',   modules: 6,  lessons: 52 },
  { label: 'SIDDHA QUANTUM', color: '#D4AF37',   modules: 7,  lessons: 74 },
  { label: 'AKASHA ∞',       color: '#A78BFA',   modules: 6,  lessons: 44 },
];

const FastingAcademyPortalCard: React.FC = () => {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate('/siddha-fasting-academy')}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${hovered ? amber(0.35) : gold(0.12)}`,
        borderRadius: 28,
        padding: '20px 18px 18px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px) scale(1.012)' : 'none',
        boxShadow: hovered
          ? `0 0 30px ${amber(0.18)}, 0 0 60px ${gold(0.06)}`
          : `0 0 0 transparent`,
        overflow: 'hidden',
      }}
    >
      {/* Background flame glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: `radial-gradient(ellipse at 50% 0%,${amber(hovered ? 0.1 : 0.05)},transparent 70%)`,
        pointerEvents: 'none',
        transition: 'all 0.4s ease',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: `linear-gradient(135deg,${amber(0.18)},${gold(0.08)})`,
            border: `1px solid ${amber(0.3)}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🔥
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: amber(0.65), marginBottom: 3 }}>
              SIDDHA ACADEMY
            </div>
            <div style={{ fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 700, color: gold(0.95), lineHeight: 1.2 }}>
              Sacred Fasting
            </div>
          </div>
        </div>
        <ChevronRight size={16} color={hovered ? amber(0.8) : white(0.25)} style={{ transition: 'color 0.2s', marginTop: 4 }} />
      </div>

      {/* Tagline */}
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.85rem', color: white(0.5), lineHeight: 1.5, margin: '0 0 14px' }}>
        Upavasa · Tapas · Kaya Kalpa · Breatharianism — the complete Siddha science of fasting, never before encoded in one place.
      </p>

      {/* Tier pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {TIER_PREVIEWS.map(t => (
          <div key={t.label} style={{
            fontFamily: FONT, fontSize: 7, fontWeight: 800, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: t.color,
            background: `${t.color}12`,
            border: `1px solid ${t.color}30`,
            borderRadius: 50, padding: '4px 10px',
          }}>
            {t.label} · {t.modules}M / {t.lessons}L
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, borderTop: `1px solid ${white(0.06)}`, paddingTop: 12 }}>
        {[
          { value: '23', label: 'MODULES' },
          { value: '202', label: 'LESSONS' },
          { value: '5K', label: 'YRS WISDOM' },
          { value: '∞', label: 'DEPTH' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: '1rem', fontWeight: 900, color: gold(0.85), letterSpacing: '-0.04em' }}>{s.value}</div>
            <div style={{ fontFamily: FONT, fontSize: 7, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: white(0.3), marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FastingAcademyPortalCard;
