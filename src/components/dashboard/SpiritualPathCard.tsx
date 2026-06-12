import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpiritualPaths } from '@/hooks/useSpiritualPaths';
import { Skeleton } from '@/components/ui/skeleton';
import { isInnerPeacePathSlug, normalizeSpiritualPathSlugKey } from '@/lib/spiritualPathSlug';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}


// Inject global keyframes for scalar card
if (typeof document !== 'undefined' && !document.getElementById('sq-scalar-keyframes')) {
  const s = document.createElement('style');
  s.id = 'sq-scalar-keyframes';
  s.textContent = `
    @keyframes sqPathCardGlow {
      0%,100% { box-shadow: inset 0 0 0 1px rgba(212,175,55,0.18), inset 0 0 50px rgba(212,175,55,0.05), 0 0 25px rgba(212,175,55,0.14), 0 0 60px rgba(212,175,55,0.09), 0 0 120px rgba(212,175,55,0.05), 0 20px 60px rgba(0,0,0,0.8); }
      50%      { box-shadow: inset 0 0 0 1px rgba(212,175,55,0.3),  inset 0 0 80px rgba(212,175,55,0.08), 0 0 45px rgba(212,175,55,0.25), 0 0 90px rgba(212,175,55,0.15), 0 0 180px rgba(212,175,55,0.08), 0 20px 60px rgba(0,0,0,0.8); }
    }
    @keyframes sqCaveLight {
      0%,100% { opacity: 0.7; transform: translateX(-50%) scaleX(1); }
      50%      { opacity: 1;   transform: translateX(-50%) scaleX(1.15); }
    }
    @keyframes sqGeoRotate {
      from { transform: translate(-50%,-50%) rotate(0deg); }
      to   { transform: translate(-50%,-50%) rotate(360deg); }
    }
    @keyframes sqTorusRing {
      0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.8; }
      70%  { opacity: 0.15; }
      100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
    }
    @keyframes sqShimmerSweep {
      0%   { left: -100%; }
      100% { left: 150%; }
    }
    @keyframes sqTitleShimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes sqBarShimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes sqCtaPulse {
      0%,100% { box-shadow: 0 0 14px rgba(212,175,55,0.18), 0 0 35px rgba(212,175,55,0.08), inset 0 0 18px rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.3); }
      50%      { box-shadow: 0 0 24px rgba(212,175,55,0.32), 0 0 60px rgba(212,175,55,0.15), inset 0 0 28px rgba(212,175,55,0.09); border-color: rgba(212,175,55,0.5); }
    }
  `;
  document.head.appendChild(s);
}

function ScalarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width  = parent.offsetWidth;
      canvas!.height = parent.offsetHeight;
    }
    resize();

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Horizontal scalar waves
      for (let layer = 0; layer < 5; layer++) {
        const freq = 0.018 + layer * 0.006;
        const amp  = 6 + layer * 2;
        const yBase = H * (0.25 + layer * 0.14);
        const speed = t * (0.4 + layer * 0.1);
        const alpha = 0.18 - layer * 0.025;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = yBase + Math.sin(x * freq + speed) * amp + Math.sin(x * freq * 0.5 + speed * 0.7) * (amp * 0.4);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Deep slow waves
      for (let layer = 0; layer < 3; layer++) {
        const freq = 0.008 + layer * 0.004;
        const amp  = 14 + layer * 5;
        const yBase = H * (0.4 + layer * 0.2);
        const speed = t * (0.15 + layer * 0.08);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = yBase + Math.sin(x * freq + speed) * amp + Math.cos(x * freq * 1.3 + speed * 0.5) * (amp * 0.5);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(212,175,55,${0.06 - layer * 0.015})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Interference rings from two sources
      const src1x = cx * 0.4, src1y = cy * 0.5;
      const src2x = cx * 1.6, src2y = cy * 1.3;
      for (let ring = 1; ring <= 8; ring++) {
        const r = ring * 28 + (t * 18) % 28;
        const alpha = Math.max(0, 0.12 - ring * 0.012);
        if (alpha <= 0) continue;
        ctx.beginPath(); ctx.arc(src1x, src1y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${alpha})`; ctx.lineWidth = 0.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(src2x, src2y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${alpha * 0.7})`; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Central radial burst
      const burstAlpha = 0.04 + Math.sin(t * 1.2) * 0.025;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55);
      grad.addColorStop(0, `rgba(212,175,55,${burstAlpha * 4})`);
      grad.addColorStop(0.3, `rgba(212,175,55,${burstAlpha})`);
      grad.addColorStop(1, 'rgba(212,175,55,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Vertical energy streams
      for (let i = 0; i < 6; i++) {
        const x = (W / 7) * (i + 1);
        const a = 0.04 + Math.sin(t * 0.8 + i) * 0.025;
        const g2 = ctx.createLinearGradient(x, 0, x, H);
        g2.addColorStop(0, 'rgba(212,175,55,0)');
        g2.addColorStop(0.3, `rgba(212,175,55,${a})`);
        g2.addColorStop(0.7, `rgba(212,175,55,${a * 0.6})`);
        g2.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.fillStyle = g2; ctx.fillRect(x - 0.5, 0, 1, H);
      }

      tRef.current += 0.025;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

const cardStyle: React.CSSProperties = {
  position: 'relative',
  borderRadius: '24px',
  padding: '22px 20px 20px',
  overflow: 'hidden',
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  background: 'linear-gradient(145deg, rgba(28,20,8,0.95) 0%, rgba(18,13,4,0.98) 50%, rgba(22,16,6,0.96) 100%)',
  border: '1px solid rgba(212,175,55,0.25)',
  boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.12), inset 0 0 60px rgba(212,175,55,0.05), 0 0 35px rgba(212,175,55,0.18), 0 0 80px rgba(212,175,55,0.10), 0 0 160px rgba(212,175,55,0.05), 0 20px 60px rgba(0,0,0,0.8)',
  animation: 'sqPathCardGlow 4s ease-in-out infinite',
};

const scalarFieldStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', borderRadius: '24px',
};

const innerStyle: React.CSSProperties = { position: 'relative', zIndex: 1 };

export const SpiritualPathCard: React.FC = () => {
  const { t } = useTranslation();
  const { paths, isLoading, getActiveProgress } = useSpiritualPaths();

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={scalarFieldStyle}><ScalarCanvas /></div>
        <div style={innerStyle} className="flex flex-col gap-4">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" style={{ background: 'rgba(212,175,55,0.1)' }} />
            <Skeleton className="h-3 w-16" style={{ background: 'rgba(212,175,55,0.1)' }} />
          </div>
          <Skeleton className="h-6 w-full" style={{ background: 'rgba(212,175,55,0.08)' }} />
          <Skeleton className="h-3 w-3/4" style={{ background: 'rgba(212,175,55,0.06)' }} />
          <Skeleton className="h-2 w-full rounded-full" style={{ background: 'rgba(212,175,55,0.06)' }} />
        </div>
      </div>
    );
  }

  const activeProgress = getActiveProgress();

  const renderCard = (
    slug: string,
    displayLabel: string,
    displayTitle: string,
    pathDesc: string,
    currentDay: number,
    totalDays: number,
    progressPercent: number,
    ctaLabel: string
  ) => {
    const barTipStyle: React.CSSProperties = progressPercent > 0 ? {
      content: '\'\'',
      position: 'absolute',
      right: '-1px', top: '-4px',
      width: '10px', height: '10px',
      borderRadius: '50%',
      background: '#F5E090',
      boxShadow: '0 0 10px 4px rgba(245,224,144,1), 0 0 26px 8px rgba(212,175,55,0.9), 0 0 50px 14px rgba(212,175,55,0.5)',
    } : {};

    return (
      <Link to={`/paths/${slug}`} style={cardStyle}>
        {/* Scalar field — purely visual, no labels */}
        <div style={scalarFieldStyle}>
          {/* Cave light from top */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%',
            transform: 'translateX(-50%)',
            width: '300px', height: '160px',
            background: 'radial-gradient(ellipse at center top, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 30%, rgba(212,175,55,0.03) 60%, transparent 80%)',
            animation: 'sqCaveLight 5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          {/* Side glows */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '70px', height: '100%', background: 'linear-gradient(90deg, rgba(212,175,55,0.07) 0%, transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '70px', height: '100%', background: 'linear-gradient(270deg, rgba(212,175,55,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
          {/* Sacred geometry */}
          <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '260px', height: '260px', opacity: 0.04, animation: 'sqGeoRotate 30s linear infinite', pointerEvents: 'none' }}
            viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#D4AF37" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="60" stroke="#D4AF37" strokeWidth="0.4"/>
            <circle cx="100" cy="100" r="35" stroke="#D4AF37" strokeWidth="0.3"/>
            <polygon points="100,18 174,145 26,145" stroke="#D4AF37" strokeWidth="0.4" fill="none"/>
            <polygon points="100,182 26,55 174,55" stroke="#D4AF37" strokeWidth="0.4" fill="none"/>
          </svg>
          {/* Torus rings */}
          {[60,120,200,300,420].map((size, i) => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              width: size, height: size,
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%) scale(0)',
              border: `1px solid rgba(212,175,55,${0.35 - i * 0.05})`,
              animation: `sqTorusRing 5s ease-out infinite`,
              animationDelay: `${i * 1.2}s`,
              pointerEvents: 'none',
            }} />
          ))}
          {/* Live scalar canvas */}
          <ScalarCanvas />
          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
            background: 'linear-gradient(105deg, transparent 0%, rgba(212,175,55,0.04) 40%, rgba(212,175,55,0.07) 50%, rgba(212,175,55,0.04) 60%, transparent 100%)',
            animation: 'sqShimmerSweep 8s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Content */}
        <div style={innerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.75)', textShadow: '0 0 12px rgba(212,175,55,0.4)' }}>
              {displayLabel}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
              {t('spiritualPath.daySlashTotal', { current: currentDay, total: totalDays })}
            </span>
          </div>

          <div style={{
            fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '8px',
            background: 'linear-gradient(135deg, #8B6914 0%, #C9A227 20%, #F5E090 45%, #D4AF37 65%, #F5E090 80%, #C9A227 100%)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'sqTitleShimmer 4s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))',
          }}>
            {displayTitle}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '18px' }}>
            {pathDesc}
          </div>

          <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', marginBottom: '14px', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: '1px', width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #6B4E0A, #D4AF37, #FFF0A0, #D4AF37)',
              backgroundSize: '200% 100%',
              animation: 'sqBarShimmer 3s linear infinite',
              position: 'relative', transition: 'width 1s ease',
              boxShadow: '0 0 10px rgba(212,175,55,0.5)',
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
              {t('spiritualPath.progressComplete', { percent: progressPercent })}
            </div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '11px 16px', borderRadius: '100px',
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#F5E090',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)',
              border: '1px solid rgba(212,175,55,0.35)',
              boxShadow: '0 0 20px rgba(212,175,55,0.2), 0 0 45px rgba(212,175,55,0.1), inset 0 0 20px rgba(212,175,55,0.06)',
              animation: 'sqCtaPulse 3s ease-in-out infinite',
              textShadow: '0 0 10px rgba(212,175,55,0.6)',
              overflow: 'hidden', position: 'relative',
            }}>
              ▷ &nbsp;{ctaLabel}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (activeProgress) {
    const activePath = paths.find(p => p.id === activeProgress.path_id);
    if (activePath) {
      const progressPercent = Math.round((activeProgress.current_day / activePath.duration_days) * 100);
      const pathSlugKey = normalizeSpiritualPathSlugKey(activePath.slug);
      const pathDesc = t(`spiritualPath.paths.${pathSlugKey}.description`, activePath.description || '');
      const isInnerPeace = isInnerPeacePathSlug(activePath.slug);
      const displayLabel = isInnerPeace ? 'SHANTI · SATTVA PROTOCOL' : toTitleCase(activePath.slug);
      const displayTitle = isInnerPeace ? '21-Day Siddha-Path' : t(`spiritualPath.paths.${pathSlugKey}.title`, activePath.title);
      const ctaLabel = t('spiritualPath.resumeTransmissionCycle', { day: activeProgress.current_day });
      return renderCard(activePath.slug, displayLabel, displayTitle, pathDesc, activeProgress.current_day, activePath.duration_days, progressPercent, ctaLabel);
    }
  }

  const recommended = paths[0];
  if (!recommended) return null;
  const recSlugKey = normalizeSpiritualPathSlugKey(recommended.slug);
  const pathDesc = t(`spiritualPath.paths.${recSlugKey}.description`, recommended.description || '');
  const isInnerPeaceRec = isInnerPeacePathSlug(recommended.slug);
  const displayLabel = isInnerPeaceRec ? 'SHANTI · SATTVA PROTOCOL' : toTitleCase(recommended.slug);
  const displayTitle = isInnerPeaceRec ? '21-Day Siddha-Path' : t(`spiritualPath.paths.${recSlugKey}.title`, recommended.title);
  return renderCard(recommended.slug, displayLabel, displayTitle, pathDesc, 0, recommended.duration_days, 0, t('spiritualPath.startJourney'));
};
