import React from 'react';

/** High-resolution gold-etched icon for each Siddha — sacred geometry + ॐ */
const GOLD = '#D4AF37';
const GOLD_LIGHT = 'rgba(212,175,55,0.6)';

/** Siddha name → simple geometric seal (lotus/om variant) */
export const SiddhaIcon: React.FC<{ guideName: string; className?: string; size?: number }> = ({
  guideName,
  className = '',
  size = 80,
}) => {
  const seed = guideName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = seed % 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id="siddha-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="gold-etch" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="1" />
          <stop offset="50%" stopColor={GOLD_LIGHT} stopOpacity="0.9" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g filter="url(#siddha-glow)" stroke="url(#gold-etch)" strokeWidth="1.2" fill="none">
        {/* Outer circle */}
        <circle cx="50" cy="50" r="44" strokeOpacity="0.9" />
        {/* Inner lotus petals (8) */}
        {[...Array(8)].map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const x1 = 50 + 25 * Math.cos(a);
          const y1 = 50 - 25 * Math.sin(a);
          const x2 = 50 + 38 * Math.cos(a);
          const y2 = 50 - 38 * Math.sin(a);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity="0.7" />
          );
        })}
        {/* Central ॐ or bindu */}
        {variant === 0 && (
          <text x="50" y="58" textAnchor="middle" fill={GOLD} fontSize="28" fontFamily="serif" opacity="0.95">
            ॐ
          </text>
        )}
        {variant === 1 && (
          <circle cx="50" cy="50" r="8" strokeOpacity="0.8" fill="none" />
        )}
        {variant === 2 && (
          <path
            d="M50 35 Q55 50 50 65 Q45 50 50 35"
            strokeOpacity="0.85"
            fill="none"
          />
        )}
        {variant === 3 && (
          <polygon
            points="50,32 58,50 50,68 42,50"
            strokeOpacity="0.85"
            fill="none"
          />
        )}
      </g>
    </svg>
  );
};
