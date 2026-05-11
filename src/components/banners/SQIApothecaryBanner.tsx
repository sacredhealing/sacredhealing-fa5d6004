import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SQI Quantum Apothecary Banner
 * Animated Sri Yantra + Scalar Waves on canvas — fully responsive
 * with golden halo glow around the frame.
 */
export function SQIApothecaryBanner() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const navigate = useNavigate();
  const [height, setHeight] = useState(180);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const computeHeight = (w: number) => {
      // Aspect-driven height with sane bounds across devices
      const h = Math.round(w * 0.42);
      return Math.max(150, Math.min(240, h));
    };

    const resize = () => {
      const w = wrap.offsetWidth;
      const h = computeHeight(w);
      setHeight(h);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const ctx = canvas.getContext('2d')!;
    let t = 0;

    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const isNarrow = W < 480;
      const scale = Math.min(1, W / 640);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#050505';
      roundRect(ctx, 0, 0, W, H, 20);
      ctx.fill();

      // Gold ambient glows
      const g1 = ctx.createRadialGradient(W * 0.28, H * 0.5, 0, W * 0.28, H * 0.5, H * 0.95);
      g1.addColorStop(0, 'rgba(212,175,55,0.13)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(W * 0.78, H * 0.5, 0, W * 0.78, H * 0.5, H * 0.7);
      g2.addColorStop(0, 'rgba(212,175,55,0.08)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // ── Sri Yantra ───────────────────────────────
      const yantraSize = Math.min(H * 0.42, W * 0.22);
      const cx = isNarrow ? W - yantraSize - 14 : W * 0.78;
      const cy = isNarrow ? yantraSize + 14 : H * 0.5;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, yantraSize, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,175,55,0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const a = t * 0.28 + (i * Math.PI * 2) / 3;
        const r = yantraSize * 0.72;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + (Math.PI * 2) / 3) * r, Math.sin(a + (Math.PI * 2) / 3) * r);
        ctx.lineTo(Math.cos(a + (Math.PI * 4) / 3) * r, Math.sin(a + (Math.PI * 4) / 3) * r);
        ctx.closePath();
        ctx.strokeStyle = `rgba(212,175,55,${0.26 - i * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 3; i++) {
        const a = -t * 0.18 + (i * Math.PI * 2) / 3 + Math.PI;
        const r = yantraSize * 0.55;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + (Math.PI * 2) / 3) * r, Math.sin(a + (Math.PI * 2) / 3) * r);
        ctx.lineTo(Math.cos(a + (Math.PI * 4) / 3) * r, Math.sin(a + (Math.PI * 4) / 3) * r);
        ctx.closePath();
        ctx.strokeStyle = `rgba(212,175,55,${0.18 - i * 0.03})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Pulsing bindu
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.2);
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, yantraSize * 0.18 * pulse);
      cg.addColorStop(0, 'rgba(212,175,55,0.95)');
      cg.addColorStop(0.5, 'rgba(212,175,55,0.35)');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, yantraSize * 0.18 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Text block (left) ───────────────────────────
      const tx = Math.max(14, W * 0.045);
      const titleSize = Math.max(22, Math.min(40, W * 0.075));
      const eyebrowSize = Math.max(9, Math.min(12, W * 0.022));
      const subSize = Math.max(10, Math.min(14, W * 0.026));

      let y = isNarrow ? H * 0.55 : H * 0.32;

      ctx.font = `800 ${eyebrowSize}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,0.55)';
      ctx.fillText(isNarrow ? 'SQI · 2050' : 'SIDDHA QUANTUM INTELLIGENCE · 2050', tx, y);

      y += titleSize * 0.9;
      ctx.font = `900 ${titleSize}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,1)';
      ctx.shadowColor = 'rgba(212,175,55,0.45)';
      ctx.shadowBlur = 22;
      ctx.fillText('Quantum', tx, y);
      y += titleSize;
      ctx.fillText('Apothecary', tx, y);
      ctx.shadowBlur = 0;

      y += subSize * 1.6;
      ctx.font = `400 ${subSize}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const tagline = isNarrow ? 'Scalar · Vedic · Biofield' : 'Scalar Wave · Vedic Light-Codes · Biofield';
      ctx.fillText(tagline, tx, y);

      t += 0.012;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full cursor-pointer rounded-[22px]"
      style={{
        height,
        boxShadow:
          '0 0 0 1px rgba(212,175,55,0.35), 0 0 24px rgba(212,175,55,0.35), 0 0 60px rgba(212,175,55,0.25), 0 0 110px rgba(212,175,55,0.18)',
      }}
      onClick={() => navigate('/quantum-apothecary')}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-[22px] block"
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
