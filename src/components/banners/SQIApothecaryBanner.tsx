import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SQI Quantum Apothecary Banner
 * Animated Sri Yantra + Scalar Waves on canvas
 * Replace the existing apothecary hero/header banner
 */
export function SQIApothecaryBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const navigate  = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const ctx = canvas.getContext('2d')!;
    let t = 0;

    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#050505';
      roundRect(ctx, 0, 0, W, H, 20);
      ctx.fill();

      // Gold glow left
      const g1 = ctx.createRadialGradient(W * .28, H * .5, 0, W * .28, H * .5, H * .9);
      g1.addColorStop(0, 'rgba(212,175,55,0.13)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Gold glow right
      const g2 = ctx.createRadialGradient(W * .75, H * .5, 0, W * .75, H * .5, H * .65);
      g2.addColorStop(0, 'rgba(212,175,55,0.06)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // ── Sri Yantra right side ───────────────────────────────
      const cx = W * .70, cy = H * .5;
      ctx.save();
      ctx.translate(cx, cy);

      // Outer circle
      ctx.beginPath();
      ctx.arc(0, 0, H * .38, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,175,55,0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating upward triangles (Shiva)
      for (let i = 0; i < 3; i++) {
        const a = t * .28 + i * Math.PI * 2 / 3;
        const r = H * .27;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI * 2 / 3) * r, Math.sin(a + Math.PI * 2 / 3) * r);
        ctx.lineTo(Math.cos(a + Math.PI * 4 / 3) * r, Math.sin(a + Math.PI * 4 / 3) * r);
        ctx.closePath();
        ctx.strokeStyle = `rgba(212,175,55,${0.24 - i * .05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Counter-rotating downward triangles (Shakti)
      for (let i = 0; i < 3; i++) {
        const a = -t * .18 + i * Math.PI * 2 / 3 + Math.PI;
        const r = H * .21;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI * 2 / 3) * r, Math.sin(a + Math.PI * 2 / 3) * r);
        ctx.lineTo(Math.cos(a + Math.PI * 4 / 3) * r, Math.sin(a + Math.PI * 4 / 3) * r);
        ctx.closePath();
        ctx.strokeStyle = `rgba(212,175,55,${0.16 - i * .03})`;
        ctx.lineWidth = .8;
        ctx.stroke();
      }

      // Concentric rings
      [H * .37, H * .30, H * .13, H * .07].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${0.11 - i * .02})`;
        ctx.lineWidth = .7;
        ctx.stroke();
      });

      // Scalar wave lines
      for (let i = 0; i < 8; i++) {
        const a = t * .12 + i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let d = 0; d < H * .35; d += 1.5) {
          const wave = Math.sin(d * .09 - t * 2.5) * 3.5 * (d / (H * .35));
          ctx.lineTo(
            Math.cos(a) * d + Math.sin(a) * wave,
            Math.sin(a) * d - Math.cos(a) * wave,
          );
        }
        ctx.strokeStyle = `rgba(212,175,55,0.055)`;
        ctx.lineWidth = .6;
        ctx.stroke();
      }

      // Pulsing bindu
      const pulse = .7 + .3 * Math.sin(t * 2.2);
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, H * .065 * pulse);
      cg.addColorStop(0, 'rgba(212,175,55,0.95)');
      cg.addColorStop(.5, 'rgba(212,175,55,0.35)');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, H * .065 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Floating particles
      for (let i = 0; i < 22; i++) {
        const px = ((i * 137.5 + t * 9) % W);
        const py = H * .12 + Math.sin(t * .38 + i) * H * .64;
        const op = .15 + .14 * Math.sin(t + i * 1.1);
        ctx.beginPath();
        ctx.arc(px, py, .9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op})`;
        ctx.fill();
      }

      // ── Text ────────────────────────────────────────────────
      const tx = W * .05;
      const ty = H * .44;

      ctx.font = `800 ${Math.max(8, H * .07)}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,0.5)';
      ctx.fillText('SIDDHA QUANTUM INTELLIGENCE · 2050', tx, ty - H * .3);

      ctx.font = `900 ${Math.max(22, H * .23)}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,1)';
      ctx.shadowColor = 'rgba(212,175,55,0.4)';
      ctx.shadowBlur = 22;
      ctx.fillText('Quantum', tx, ty - H * .06);
      ctx.fillText('Apothecary', tx, ty + H * .2);
      ctx.shadowBlur = 0;

      ctx.font = `400 ${Math.max(10, H * .1)}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.fillText('Scalar Wave · Vedic Light-Codes · Biofield', tx, ty + H * .38);

      // Badge
      const bx = tx, by = ty + H * .54;
      const bw = Math.min(W * .45, 200), bh = 22;
      ctx.fillStyle = 'rgba(212,175,55,0.1)';
      ctx.strokeStyle = 'rgba(212,175,55,0.28)';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 11);
      ctx.fill(); ctx.stroke();
      ctx.font = `800 ${Math.max(7, H * .07)}px "Plus Jakarta Sans",sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,0.8)';
      ctx.fillText('◈ AKASHA-NEURAL ARCHIVE', bx + 10, by + 14);

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
      className="relative w-full overflow-hidden rounded-[22px] cursor-pointer"
      style={{ height: 200 }}
      onClick={() => navigate('/quantum-apothecary')}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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
