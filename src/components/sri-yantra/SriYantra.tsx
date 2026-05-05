import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface SriYantraProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

const SriYantra: React.FC<SriYantraProps> = ({ size = 400, animate = true, className = '' }) => {
  const { t } = useTranslation();
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.43;

  const up = [
    [[cx, cy - R * 0.96], [cx - R * 0.83, cy + R * 0.48], [cx + R * 0.83, cy + R * 0.48]],
    [[cx, cy - R * 0.62], [cx - R * 0.54, cy + R * 0.31], [cx + R * 0.54, cy + R * 0.31]],
    [[cx, cy - R * 0.3], [cx - R * 0.26, cy + R * 0.15], [cx + R * 0.26, cy + R * 0.15]],
    [[cx, cy - R * 0.11], [cx - R * 0.1, cy + R * 0.055], [cx + R * 0.1, cy + R * 0.055]],
  ];
  const dn = [
    [[cx, cy + R * 0.96], [cx - R * 0.83, cy - R * 0.48], [cx + R * 0.83, cy - R * 0.48]],
    [[cx, cy + R * 0.7], [cx - R * 0.61, cy - R * 0.35], [cx + R * 0.61, cy - R * 0.35]],
    [[cx, cy + R * 0.44], [cx - R * 0.38, cy - R * 0.22], [cx + R * 0.38, cy - R * 0.22]],
    [[cx, cy + R * 0.24], [cx - R * 0.21, cy - R * 0.12], [cx + R * 0.21, cy - R * 0.12]],
    [[cx, cy + R * 0.09], [cx - R * 0.08, cy - R * 0.045], [cx + R * 0.08, cy - R * 0.045]],
  ];
  const pts = (arr: number[][]) => arr.map((p) => p.join(',')).join(' ');

  const petalRing = (count: number, radiusFactor: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = (i * (360 / count) - 90) * (Math.PI / 180);
      const px = cx + Math.cos(a) * R * radiusFactor;
      const py = cy + Math.sin(a) * R * radiusFactor;
      return { px, py, rot: (a * 180) / Math.PI + 90 };
    });

  const inner8 = petalRing(8, 0.73);
  const outer16 = petalRing(16, 0.9);

  const scalarRings = [1.05, 1.2, 1.38, 1.58];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 0 28px rgba(212,175,55,0.55))' }}
      aria-label={t('sriYantra.ariaLabel')}
    >
      <defs>
        <radialGradient id="sgCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E27B" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A07820" />
        </linearGradient>

        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="binduGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {animate && (
          <style>{`
            @keyframes sriSlowSpin  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
            @keyframes sriRevSpin   { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
            @keyframes sriBreath    { 0%,100% { opacity:.65; } 50% { opacity:1; } }
            @keyframes binduPulse   { 0%,100% { r:4; opacity:1; } 50% { r:7; opacity:.7; } }
            @keyframes scalarPulse  { 0% { stroke-opacity:.5; r:var(--r0); } 100% { stroke-opacity:0; r:var(--r1); } }
            .sri-outer16  { animation: sriSlowSpin 90s linear infinite;  transform-box:fill-box; transform-origin:${cx}px ${cy}px; }
            .sri-inner8   { animation: sriRevSpin  60s linear infinite;  transform-box:fill-box; transform-origin:${cx}px ${cy}px; }
            .sri-tris     { animation: sriBreath    4s ease-in-out infinite; }
            .sri-bindu    { animation: sriBreath  1.8s ease-in-out infinite; }
            .scalar-0     { animation: scalarPulse 3.0s ease-out infinite 0.0s; }
            .scalar-1     { animation: scalarPulse 3.0s ease-out infinite 0.7s; }
            .scalar-2     { animation: scalarPulse 3.0s ease-out infinite 1.4s; }
            .scalar-3     { animation: scalarPulse 3.0s ease-out infinite 2.1s; }
          `}</style>
        )}
      </defs>

      <circle cx={cx} cy={cy} r={R * 1.2} fill="url(#sgCore)" />

      {[0, 6, 12, 18].map((offset) => (
        <rect
          key={offset}
          x={cx - R * (1.1 + offset * 0.003)}
          y={cy - R * (1.1 + offset * 0.003)}
          width={R * (2.2 + offset * 0.006)}
          height={R * (2.2 + offset * 0.006)}
          fill="none"
          stroke="url(#goldLine)"
          strokeWidth={offset === 0 ? 1.5 : 0.5}
          strokeOpacity={offset === 0 ? 0.7 : 0.3}
        />
      ))}

      {scalarRings.map((f, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={R * f}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={0.8}
          strokeOpacity={0}
          className={`scalar-${i}`}
        />
      ))}

      {[1.0, 0.78, 0.6].map((f, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={R * f}
          fill="none"
          stroke="url(#goldLine)"
          strokeWidth={0.9}
          strokeOpacity={0.45 + i * 0.1}
        />
      ))}

      <g className="sri-outer16">
        {outer16.map(({ px, py, rot }, i) => (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={R * 0.1}
            ry={R * 0.18}
            transform={`rotate(${rot},${px},${py})`}
            fill="rgba(212,175,55,0.04)"
            stroke="url(#goldLine)"
            strokeWidth={0.8}
            strokeOpacity={0.5}
          />
        ))}
      </g>

      <g className="sri-inner8">
        {inner8.map(({ px, py, rot }, i) => (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={R * 0.11}
            ry={R * 0.2}
            transform={`rotate(${rot},${px},${py})`}
            fill="rgba(212,175,55,0.06)"
            stroke="url(#goldLine)"
            strokeWidth={1.0}
            strokeOpacity={0.65}
          />
        ))}
      </g>

      <g className="sri-tris" filter="url(#goldGlow)">
        {up.map((tri, i) => (
          <polygon
            key={`u${i}`}
            points={pts(tri)}
            fill="rgba(212,175,55,0.03)"
            stroke="url(#goldLine)"
            strokeWidth={1.6 - i * 0.25}
            strokeOpacity={0.95 - i * 0.1}
          />
        ))}
        {dn.map((tri, i) => (
          <polygon
            key={`d${i}`}
            points={pts(tri)}
            fill="rgba(212,175,55,0.03)"
            stroke="url(#goldLine)"
            strokeWidth={1.6 - i * 0.2}
            strokeOpacity={0.9 - i * 0.1}
          />
        ))}
      </g>

      <circle cx={cx} cy={cy} r={R * 0.035} fill="rgba(212,175,55,0.25)" className="sri-bindu" filter="url(#binduGlow)" />
      <circle cx={cx} cy={cy} r={R * 0.016} fill="#D4AF37" className="sri-bindu" />

      <text
        x={cx}
        y={cy + R * 0.55}
        textAnchor="middle"
        fill="#D4AF37"
        fillOpacity={0.45}
        fontSize={R * 0.09}
        fontFamily="serif"
        letterSpacing={1}
      >
        {t('sriYantra.glyph')}
      </text>
    </svg>
  );
};

export { SriYantra };
export default SriYantra;
