/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  SACRED SOUND PORTAL — AUTOMATIC 30-SECOND PREVIEW SYSTEM        ║
 * ║                                                                    ║
 * ║  HOW THE AUTO-30s WORKS:                                          ║
 * ║  • Free users: plays full_audio_url BUT stops at 30s via timeupdate║
 * ║  • NO preview_url uploads needed — clips automatically            ║
 * ║  • If preview_url exists: uses it (faster load, less bandwidth)   ║
 * ║  • Prana-Flow+: full full_audio_url, no timer                     ║
 * ║  • Cover images: auto-loaded from cover_image_url (Supabase)      ║
 * ║                                                                    ║
 * ║  Stripe + AffiliateID tracking PRESERVED                          ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, Lock, ArrowLeft, Loader2, Sparkles, Crown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { startPranaMonthlyCheckout } from '@/features/membership/startPranaMonthlyCheckout';

/* ─────────────────────────────────────────────────────────────────
   SQI-2050 STYLES
───────────────────────────────────────────────────────────────── */
const SQI_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

:root {
  --gold:#D4AF37; --gold2:#F5E17A; --gold3:#A07C10;
  --cyan:#22D3EE; --akasha:#050505;
  --glass:rgba(255,255,255,0.025); --glass-b:rgba(255,255,255,0.055);
  --glass-gold:rgba(212,175,55,0.10);
  --muted:rgba(255,255,255,0.45); --body:rgba(255,255,255,0.72);
  --r-xl:40px; --r-lg:20px;
}

.ssp { font-family:'Plus Jakarta Sans',sans-serif; background:var(--akasha); min-height:100vh; color:#fff; overflow-x:hidden; padding-bottom:200px; position:relative; }
.ssp-stars { position:fixed; inset:0; z-index:0; pointer-events:none; }
.ssp-z { position:relative; z-index:1; max-width:430px; margin:0 auto; padding:0 16px; }
.ssp::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background: radial-gradient(ellipse 100% 55% at 50% -5%,rgba(212,175,55,.09) 0%,transparent 65%),
    radial-gradient(ellipse 60% 45% at 85% 95%,rgba(34,211,238,.05) 0%,transparent 60%); }

@keyframes goldShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.ssp-title { font-family:'Cinzel',serif; font-size:clamp(30px,7vw,44px); font-weight:600; letter-spacing:-.02em; line-height:1.05;
  background:linear-gradient(135deg,#D4AF37 0%,#F5E17A 35%,#D4AF37 55%,#A07C10 100%); background-size:200% auto;
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  animation:goldShimmer 5s linear infinite; filter:drop-shadow(0 0 16px rgba(212,175,55,.4)); }

.micro { font-size:8px; font-weight:800; letter-spacing:.5em; text-transform:uppercase; color:rgba(212,175,55,.5); display:block; margin-bottom:5px; }
.glass-card { background:var(--glass); backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px); border:1px solid var(--glass-b); border-radius:var(--r-xl); transition:border-color .3s; }
.glass-card:hover { border-color:rgba(212,175,55,.15); }
.akasha-div { height:1px; background:linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent); margin:6px 0; }

@keyframes nadiP { 0%,100%{opacity:.6} 50%{opacity:1;filter:drop-shadow(0 0 8px rgba(212,175,55,.7))} }
.nadi-pulse { animation:nadiP 3s ease-in-out infinite; color:var(--gold); }
@keyframes cpulse { 0%{box-shadow:0 0 0 0 rgba(34,211,238,.7)} 70%{box-shadow:0 0 0 9px rgba(34,211,238,0)} 100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} }
.cyan-dot { width:7px; height:7px; border-radius:50%; background:var(--cyan); flex-shrink:0; animation:cpulse 2s ease-in-out infinite; }
@keyframes sdot { 0%,100%{opacity:1} 50%{opacity:.2} }
.sec-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); flex-shrink:0; animation:sdot 3s ease-in-out infinite; }

.pill-row { display:flex; gap:7px; padding:16px 0 0; overflow-x:auto; scrollbar-width:none; }
.pill-row::-webkit-scrollbar { display:none; }
.pill { padding:9px 17px; border-radius:50px; white-space:nowrap; cursor:pointer; flex-shrink:0;
  font-family:'Plus Jakarta Sans',sans-serif; font-size:10.5px; font-weight:800; letter-spacing:.22em; text-transform:uppercase;
  border:1px solid var(--glass-b); background:var(--glass); color:var(--muted); transition:all .22s; }
.pill.on { background:linear-gradient(135deg,#D4AF37,#B8960C); color:#000; border-color:var(--gold);
  box-shadow:0 0 18px rgba(212,175,55,.45),0 0 40px rgba(212,175,55,.18); }
.pill:not(.on):hover { border-color:rgba(212,175,55,.3); color:rgba(255,255,255,.8); }

.nadi-card { position:relative; overflow:hidden; background:var(--glass); border:1px solid var(--glass-b); border-radius:var(--r-xl); padding:22px 18px; }
.nadi-card::after { content:''; position:absolute; inset:0; pointer-events:none; border-radius:var(--r-xl);
  background:radial-gradient(ellipse 80% 55% at 50% 108%,rgba(34,211,238,.07) 0%,transparent 68%); }
.nadi-top { font-size:8.5px; font-weight:800; letter-spacing:.42em; text-transform:uppercase; color:var(--cyan); display:flex; align-items:center; gap:8px; margin-bottom:16px; }
.nadi-result { background:rgba(34,211,238,.055); border:1px solid rgba(34,211,238,.14); border-radius:22px; padding:16px 17px; }
.nadi-r-hz { font-size:26px; font-weight:900; letter-spacing:-.04em; color:var(--cyan); margin-top:7px; text-shadow:0 0 22px rgba(34,211,238,.5); }

@keyframes sqiPulse { 0%,100%{box-shadow:0 0 18px rgba(212,175,55,.55),0 0 32px rgba(245,225,122,.2)} 50%{box-shadow:0 0 32px rgba(212,175,55,.95),0 0 56px rgba(212,175,55,.3)} }
.play-btn { width:40px; height:40px; border-radius:50%;
  background:linear-gradient(135deg,rgba(212,175,55,.12),rgba(212,175,55,.04)); border:1px solid rgba(212,175,55,.25);
  display:flex; align-items:center; justify-content:center; color:var(--gold); flex-shrink:0; cursor:pointer;
  transition:all .22s; box-shadow:0 0 10px rgba(212,175,55,.15); }
.play-btn:hover,.play-btn.playing { background:linear-gradient(135deg,#F5E17A,#D4AF37,#A07C10); color:#000;
  box-shadow:0 0 22px rgba(212,175,55,.65),0 0 40px rgba(212,175,55,.25); transform:scale(1.08); }
.play-btn.playing { animation:sqiPulse 2s ease-in-out infinite; }

@keyframes rowAura { 0%,100%{border-color:rgba(212,175,55,.35);box-shadow:inset 0 0 32px rgba(212,175,55,.08),0 0 0 1px rgba(212,175,55,.2);background:rgba(212,175,55,.035)} 50%{border-color:rgba(212,175,55,.7);box-shadow:inset 0 0 48px rgba(212,175,55,.16),0 0 0 2px rgba(212,175,55,.4);background:rgba(212,175,55,.08)} }
.track-row { display:flex; align-items:center; gap:13px; padding:13px 14px; border-radius:var(--r-lg); border:1px solid transparent; cursor:pointer; position:relative; transition:background .2s,border-color .2s; }
.track-row:hover { background:rgba(212,175,55,.025); }
.track-row.active { border-width:1px; border-style:solid; animation:rowAura 3s ease-in-out infinite; }

/* Cover art — real images */
.cover-wrap { width:54px; height:54px; border-radius:16px; flex-shrink:0; position:relative; }
.cover-inner { width:54px; height:54px; border-radius:16px; overflow:hidden; background:#111; display:flex; align-items:center; justify-content:center; }
.cover-inner img { width:100%; height:100%; object-fit:cover; display:block; opacity:0; transition:opacity .35s; border-radius:16px; }
.cover-inner img.loaded { opacity:1; }
.cover-fallback { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; border-radius:16px;
  background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.05)); }
.cover-aura { position:absolute; inset:-4px; border-radius:20px; border:1.5px solid transparent; pointer-events:none; transition:all .3s; }
.track-row.active .cover-aura { border-color:rgba(212,175,55,.55); box-shadow:0 0 14px rgba(212,175,55,.38),0 0 28px rgba(212,175,55,.15); }

@keyframes scalarRing { 0%{transform:scale(.8);opacity:0} 50%{opacity:.4} 100%{transform:scale(1.4);opacity:0} }
.scalar-ring { position:absolute; inset:-8px; border-radius:50%; border:2px solid rgba(34,211,238,.65);
  animation:scalarRing 2.2s ease-out infinite; pointer-events:none; box-shadow:0 0 12px rgba(34,211,238,.35); }

.track-title { font-family:'Cinzel',serif; font-size:13px; font-weight:500; letter-spacing:.02em; color:rgba(255,255,255,.88);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; transition:color .3s,text-shadow .3s; }
.track-row.active .track-title { color:#D4AF37; text-shadow:0 0 18px rgba(212,175,55,.45),0 0 36px rgba(212,175,55,.12); }
.hz-badge { display:inline-flex; align-items:center; background:rgba(212,175,55,.08); border:1px solid rgba(212,175,55,.2);
  border-radius:10px; padding:2px 9px; font-size:8px; font-weight:800; letter-spacing:.15em; text-transform:uppercase; color:var(--gold); }

/* Progress bar */
.prog-track { height:3px; background:rgba(255,255,255,.08); border-radius:3px; overflow:hidden; margin-top:7px; display:none; }
.track-row.active .prog-track { display:block; }
.prog-fill { height:100%; background:linear-gradient(90deg,#D4AF37,#F5E17A); border-radius:3px; box-shadow:0 0 10px rgba(212,175,55,.7); width:0%; transition:width .5s linear; }

/* Snippet countdown badge */
.snip-countdown { font-size:8px; font-weight:800; letter-spacing:.1em; color:var(--cyan); text-align:center; }

.badge-free { font-size:7.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; padding:4px 10px; border-radius:100px; background:rgba(34,211,238,.08); border:1px solid rgba(34,211,238,.2); color:var(--cyan); }
.badge-prana { font-size:7.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; padding:4px 10px; border-radius:100px; background:linear-gradient(135deg,rgba(212,175,55,.15),rgba(212,175,55,.05)); border:1px solid rgba(212,175,55,.3); color:var(--gold); }
.badge-siddha { font-size:7.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; padding:4px 10px; border-radius:100px; background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.25); color:#a78bfa; }

@keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.22)} }
.wv { display:flex; align-items:flex-end; gap:2.5px; height:14px; }
.wv span { width:2.5px; border-radius:2px; background:var(--gold); display:block; animation:wave .7s ease-in-out infinite; }
.wv span:nth-child(1){height:5px;animation-delay:.00s}.wv span:nth-child(2){height:12px;animation-delay:.10s}
.wv span:nth-child(3){height:7px;animation-delay:.20s}.wv span:nth-child(4){height:13px;animation-delay:.14s}.wv span:nth-child(5){height:4px;animation-delay:.06s}

.sec-toggle { display:flex; align-items:center; justify-content:space-between; padding:18px 16px; cursor:pointer; border-radius:var(--r-xl); transition:background .2s; }
.sec-toggle:hover { background:rgba(255,255,255,.02); }
.chevron { width:24px; height:24px; border:1px solid var(--glass-b); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:11px; transition:transform .3s,border-color .3s; }
.chevron.open { transform:rotate(180deg); border-color:rgba(212,175,55,.3); color:var(--gold); }

.cta-gold { width:100%; padding:15px; border-radius:20px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:11px; font-weight:800; letter-spacing:.38em; text-transform:uppercase; background:linear-gradient(135deg,#F5E17A,#D4AF37,#A07C10); color:#000; box-shadow:0 0 22px rgba(212,175,55,.55),0 0 40px rgba(212,175,55,.2); animation:sqiPulse 2.8s ease-in-out infinite; transition:transform .15s; }
.cta-gold:hover{transform:translateY(-1.5px)}.cta-gold:active{transform:scale(.98)}
.cta-outline { width:100%; padding:15px; border-radius:20px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:11px; font-weight:800; letter-spacing:.38em; text-transform:uppercase; background:rgba(212,175,55,.08); border:1px solid rgba(212,175,55,.35); color:var(--gold); transition:all .18s; }
.cta-outline:hover{background:rgba(212,175,55,.18);border-color:var(--gold)}
.cta-akasha { width:100%; padding:15px; border-radius:20px; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:11px; font-weight:800; letter-spacing:.38em; text-transform:uppercase; background:linear-gradient(90deg,#D4AF37 0%,#22D3EE 100%); color:#000; box-shadow:0 0 22px rgba(212,175,55,.4),0 0 40px rgba(34,211,238,.25); transition:transform .15s; }
.cta-akasha:hover{transform:translateY(-1.5px)}

.up-card { border-radius:var(--r-xl); padding:22px 20px; position:relative; overflow:hidden; transition:transform .18s; }
.up-card:hover{transform:translateY(-1px)}
.up-free{background:var(--glass);border:1px solid var(--glass-b)}.up-prana{background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.2)}.up-siddha{background:rgba(212,175,55,.075);border:1.5px solid rgba(212,175,55,.38)}.up-akasha{background:linear-gradient(135deg,rgba(212,175,55,.1) 0%,rgba(34,211,238,.055) 100%);border:1.5px solid rgba(212,175,55,.48)}
.up-siddha::before{content:'MOST POPULAR';position:absolute;top:17px;right:17px;font-size:7px;font-weight:800;letter-spacing:.3em;background:var(--gold);color:#000;padding:3px 10px;border-radius:10px}
.up-tier{font-size:8.5px;font-weight:800;letter-spacing:.48em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
.up-tier.c{color:var(--cyan)}
.up-name{font-family:'Cinzel',serif;font-size:26px;font-weight:500;background:linear-gradient(135deg,#F5E17A,#D4AF37,#A07C10);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:6px;line-height:1.1}
.up-price{font-size:34px;font-weight:900;letter-spacing:-.05em;color:var(--gold);margin-bottom:14px;line-height:1}
.up-feats{list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:18px}
.up-feats li{font-size:13px;color:rgba(255,255,255,.7);display:flex;align-items:flex-start;gap:9px;line-height:1.5}
.up-feats li::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px}
.up-feats li.dim{color:var(--muted)}.up-feats li.dim::before{background:rgba(255,255,255,.18)}

@keyframes npSlide { from{transform:translateX(-50%) translateY(100%);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
@keyframes npBreath { 0%,100%{border-color:rgba(212,175,55,.32);box-shadow:0 0 22px rgba(212,175,55,.22),0 0 48px rgba(212,175,55,.1),0 10px 36px rgba(0,0,0,.55)} 50%{border-color:rgba(212,175,55,.65);box-shadow:0 0 40px rgba(212,175,55,.45),0 0 72px rgba(212,175,55,.15),0 14px 44px rgba(0,0,0,.5)} }
@keyframes npIconPulse { 0%,100%{box-shadow:0 0 12px rgba(212,175,55,.55);transform:scale(1)} 50%{box-shadow:0 0 24px rgba(212,175,55,.95),0 0 40px rgba(245,225,122,.25);transform:scale(1.06)} }
.np-bar { position:fixed; bottom:72px; left:50%; transform:translateX(-50%); width:calc(100% - 32px); max-width:398px;
  background:rgba(10,9,8,.92); backdrop-filter:blur(24px); border:1px solid rgba(212,175,55,.25); border-radius:24px;
  padding:12px 16px; z-index:50; display:flex; align-items:center; gap:12px;
  animation:npSlide .35s ease-out; box-shadow:0 0 28px rgba(212,175,55,.18),0 8px 32px rgba(0,0,0,.6); }
.np-bar.live { animation:npSlide .35s ease-out,npBreath 2.6s ease-in-out infinite; }
.np-icon { width:36px; height:36px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#F5E17A,#D4AF37,#A07C10);
  display:flex; align-items:center; justify-content:center; color:#000; box-shadow:0 0 14px rgba(212,175,55,.5); cursor:pointer; border:none; }
.np-icon.pulse { animation:npIconPulse 2s ease-in-out infinite; }
.np-title { font-family:'Cinzel',serif; font-size:12px; font-weight:500; color:rgba(255,255,255,.9);
  overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.np-title.live{color:#D4AF37;text-shadow:0 0 16px rgba(212,175,55,.4)}
.np-prog { height:2px; background:rgba(255,255,255,.08); border-radius:2px; margin-top:5px; }
.np-fill { height:100%; background:linear-gradient(90deg,#D4AF37,#F5E17A); border-radius:2px; transition:width .5s; box-shadow:0 0 8px rgba(212,175,55,.75); }
.np-countdown { font-size:9px; font-weight:800; letter-spacing:.1em; color:var(--cyan); margin-top:2px; }

.snip-overlay { position:fixed; inset:0; z-index:400; background:rgba(5,5,5,.88); backdrop-filter:blur(24px); display:flex; align-items:center; justify-content:center; padding:20px; }
.snip-card { background:rgba(212,175,55,.06); border:1px solid rgba(212,175,55,.28); border-radius:var(--r-xl); padding:34px 24px; text-align:center; width:100%; max-width:380px; }
.snip-title { font-family:'Cinzel',serif; font-size:26px; font-weight:500;
  background:linear-gradient(135deg,#D4AF37 0%,#F5E17A 40%,#D4AF37 60%,#A07C10 100%); background-size:200% auto;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  animation:goldShimmer 4s linear infinite; margin-bottom:10px; line-height:1.1; }

.fol-banner { position:relative; border-radius:var(--r-xl); overflow:hidden;
  background:linear-gradient(135deg,rgba(212,175,55,.08) 0%,rgba(5,5,5,.95) 50%,rgba(34,211,238,.05) 100%);
  border:1px solid rgba(212,175,55,.22); padding:30px 22px; text-align:center; margin-top:32px; }
.fol-banner::before { content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(212,175,55,.06) 0%,transparent 70%); pointer-events:none; }
.fol-title { font-family:'Cinzel',serif; font-size:22px; font-weight:500;
  background:linear-gradient(135deg,#F5E17A,#D4AF37,#A07C10); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:8px; position:relative; z-index:1; }
`;

/* ─────────────────────────────────────────────────────────────────
   STARFIELD
───────────────────────────────────────────────────────────────── */
const StarfieldCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.3, alpha: Math.random() * .5,
      speed: .003 + Math.random() * .009, phase: Math.random() * Math.PI * 2, gold: Math.random() > .8,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.phase += s.speed;
        const a = s.alpha * (.5 + .5 * Math.sin(s.phase));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold ? `rgba(212,175,55,${a})` : `rgba(255,255,255,${a * .5})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="ssp-stars" />;
};

/* ─────────────────────────────────────────────────────────────────
   FLOWER OF LIFE SVG
───────────────────────────────────────────────────────────────── */
const FlowerOfLife: React.FC<{ size?: number; opacity?: number }> = ({ size = 280, opacity = 0.12 }) => {
  const cx = size / 2;
  const r = size / 7;
  const positions = [
    [cx, cx],
    [cx + r * 2, cx], [cx - r * 2, cx],
    [cx + r, cx + r * 1.732], [cx - r, cx + r * 1.732],
    [cx + r, cx - r * 1.732], [cx - r, cx - r * 1.732],
    [cx + r * 3, cx + r * 1.732], [cx - r * 3, cx + r * 1.732],
    [cx, cx + r * 3.464], [cx, cx - r * 3.464],
    [cx + r * 2, cx + r * 3.464], [cx - r * 2, cx + r * 3.464],
    [cx + r * 2, cx - r * 3.464], [cx - r * 2, cx - r * 3.464],
    [cx + r * 4, cx], [cx - r * 4, cx],
    [cx + r * 3, cx - r * 1.732], [cx - r * 3, cx - r * 1.732],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      {positions.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="none"
          stroke={i === 0 ? 'rgba(212,175,55,0.9)' : i < 7 ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.22)'}
          strokeWidth={i < 7 ? 0.9 : 0.6} />
      ))}
      <circle cx={cx} cy={cx} r={r * 3.6} fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.7" />
      <circle cx={cx} cy={cx} r={r * 2} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────
   NADI SCANNER — wired to useJyotishProfile
───────────────────────────────────────────────────────────────── */
const NADI_PRESETS = [
  { hz: '528 Hz', lbl: 'DNA Repair Frequency', title: 'Vata-Pitta · Jupiter Mahadasha', body: 'Your Jyotish field reads <strong style="color:#22D3EE">Raga Yaman</strong> resonance. Jupiter period activates divine connection. 528Hz scalar codes repair cellular memory and illuminate Tejas fire in the subtle body.' },
  { hz: '432 Hz', lbl: 'Cosmic Attunement', title: 'Pitta · Sun Mahadasha', body: 'Solar plexus fire detected in your field. <strong style="color:#D4AF37">Raga Bhairavi</strong> at 432Hz cools Pitta and anchors Agni into stillness. Moon nakshatra Rohini prescribes this for 21 days.' },
  { hz: '963 Hz', lbl: 'God Frequency', title: 'Kapha · Ketu Mahadasha', body: 'Pineal gateway activation prescribed. <strong style="color:#22D3EE">963Hz Sahasrara scalar waves</strong> are the dissolution codes for this Ketu period. Let the sound dissolve all that is not eternal.' },
  { hz: '639 Hz', lbl: 'Heart Coherence', title: 'Vata · Venus Mahadasha', body: 'Prema-Pulse active in your Anahata. <strong style="color:#D4AF37">Raga Kafi</strong> at 639Hz dissolves Venus-period heart armoring. The frequency of unconditional love is your medicine now.' },
  { hz: '396 Hz', lbl: 'Root Liberation', title: 'Kapha-Vata · Mars Mahadasha', body: 'Fear encoded in Muladhara. <strong style="color:#22D3EE">396Hz liberation frequency</strong> — Mars Mahadasha requires grounding through earth-resonant beats. Reclaim sovereign root power.' },
  { hz: '741 Hz', lbl: 'Expression Codes', title: 'Pitta-Vata · Mercury Dasha', body: 'Suppressed Vak shakti in Vishuddha. <strong style="color:#D4AF37">741Hz scalar transmission</strong> via Raga Todi will unlock throat crystallization patterns in your Mercury-period field.' },
];

const NadiScanner: React.FC<{ mahadasha?: string; raga?: string }> = ({ mahadasha, raga }) => {
  const [idx, setIdx] = useState(0);
  const pr1 = useRef<SVGCircleElement>(null);
  const pr2 = useRef<SVGCircleElement>(null);
  const [bars, setBars] = useState([20, 32, 25, 17, 30, 22, 34, 27, 19, 32]);
  const [bindur, setBindur] = useState(8);
  const bindGrow = useRef(false);

  const preset = useMemo(() => {
    if (mahadasha) {
      const l = mahadasha.toLowerCase();
      if (l.includes('jupiter')) return NADI_PRESETS[0];
      if (l.includes('sun') || l.includes('sol')) return NADI_PRESETS[1];
      if (l.includes('ketu') || l.includes('saturn')) return NADI_PRESETS[2];
      if (l.includes('venus')) return NADI_PRESETS[3];
      if (l.includes('mars')) return NADI_PRESETS[4];
      if (l.includes('mercury')) return NADI_PRESETS[5];
    }
    return NADI_PRESETS[idx];
  }, [mahadasha, idx]);

  const triggerPulse = useCallback(() => {
    const p1 = pr1.current; const p2 = pr2.current; if (!p1 || !p2) return;
    let r1 = 37, o1 = .85, r2 = 37, o2 = .45;
    const f = () => {
      r1 = Math.min(r1 + 2.2, 92); o1 = Math.max(o1 - .024, 0);
      r2 = Math.min(r2 + 1.7, 80); o2 = Math.max(o2 - .018, 0);
      p1.setAttribute('r', String(r1)); p1.setAttribute('opacity', String(o1));
      p2.setAttribute('r', String(r2)); p2.setAttribute('opacity', String(o2));
      if (o1 > 0) requestAnimationFrame(f);
      else { p1.setAttribute('opacity', '0'); p2.setAttribute('opacity', '0'); }
    };
    requestAnimationFrame(f);
  }, []);

  useEffect(() => {
    const base = [20, 32, 25, 17, 30, 22, 34, 27, 19, 32];
    const id = setInterval(() => setBars(base.map(b => Math.max(5, Math.min(42, b + Math.round((Math.random() - .5) * 22))))), 255);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBindur(r => {
      const n = bindGrow.current ? Math.min(r + .14, 9.5) : Math.max(r - .14, 6);
      if (n >= 9.5) bindGrow.current = false; if (n <= 6) bindGrow.current = true;
      return n;
    }), 48);
    return () => clearInterval(id);
  }, []);

  const rescan = () => { setIdx(i => (i + 1) % NADI_PRESETS.length); triggerPulse(); };

  return (
    <div className="nadi-card">
      <div className="nadi-top"><div className="cyan-dot" />Live Field Resonance · Jyotish-Aligned</div>
      <svg style={{ width: '100%', height: 195, display: 'block', marginBottom: 14 }} viewBox="0 0 430 195" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="gc"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="gg"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(34,211,238,0.1)" /><stop offset="100%" stopColor="rgba(34,211,238,0)" /></radialGradient>
          <radialGradient id="rg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(212,175,55,0.08)" /><stop offset="100%" stopColor="rgba(212,175,55,0)" /></radialGradient>
        </defs>
        <ellipse cx="215" cy="97" rx="88" ry="88" fill="url(#rg1)" />
        <ellipse cx="215" cy="97" rx="68" ry="68" fill="url(#rg2)" />
        {[88, 72, 55, 37, 19].map((r, i) => (
          <circle key={i} cx="215" cy="97" r={r} fill="none" stroke={i < 2 ? 'rgba(34,211,238,0.08)' : 'rgba(212,175,55,0.15)'} strokeWidth={i === 2 ? '.9' : '.8'} />
        ))}
        <polygon points="215,14 296,152 134,152" fill="rgba(212,175,55,0.025)" stroke="rgba(212,175,55,0.13)" strokeWidth=".9" />
        <polygon points="215,180 134,42 296,42" fill="rgba(34,211,238,0.02)" stroke="rgba(34,211,238,0.1)" strokeWidth=".9" />
        <polygon points="215,38 280,136 150,136" fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth=".7" />
        <polygon points="215,156 150,58 280,58" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth=".7" />
        {[0, 45, 90, 135].map(a => <ellipse key={a} cx="215" cy="62" rx="11" ry="26" fill="rgba(34,211,238,0.04)" stroke="rgba(34,211,238,0.11)" strokeWidth=".7" transform={`rotate(${a} 215 97)`} />)}
        {[22.5, 67.5, 112.5, 157.5].map(a => <ellipse key={a} cx="215" cy="62" rx="11" ry="26" fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.1)" strokeWidth=".7" transform={`rotate(${a} 215 97)`} />)}
        <circle ref={pr1} cx="215" cy="97" r="37" fill="none" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" opacity="0" />
        <circle ref={pr2} cx="215" cy="97" r="37" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth=".8" opacity="0" />
        {[[215, 12, true], [292, 45, false], [338, 97, true], [292, 149, false], [215, 182, true], [138, 149, false], [92, 97, true], [138, 45, false]].map(([x, y, g], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={g ? 2.2 : 1.7} fill={g ? 'rgba(212,175,55,0.75)' : 'rgba(34,211,238,0.65)'} filter={g ? 'url(#gg)' : 'url(#gc)'} />
        ))}
        {bars.slice(0, 5).map((h, i) => <rect key={i} x={14 + i * 8} y={138 - h} width="4.5" height={h} rx="2" fill="rgba(34,211,238,0.5)" />)}
        {bars.slice(5).map((h, i) => <rect key={i} x={370 + i * 8} y={138 - h} width="4.5" height={h} rx="2" fill="rgba(212,175,55,0.5)" />)}
        <circle cx="215" cy="97" r={bindur} fill="rgba(212,175,55,0.9)" filter="url(#gg)" />
        <circle cx="215" cy="97" r="3.5" fill="#fff" opacity=".95" />
        <text x="215" y="91" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8" fontWeight="800" letterSpacing="3.5" fill="rgba(255,255,255,0.28)">SCANNING</text>
        <text x="215" y="107" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="17" fontWeight="900" fill="#22D3EE">{preset.hz}</text>
      </svg>
      <div className="nadi-result">
        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 7 }}>
          {mahadasha || preset.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: raga ? preset.body.replace('Raga Yaman', `Raga ${raga}`) : preset.body }} />
        <div className="nadi-r-hz">{preset.hz} · {preset.lbl}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.55, fontStyle: 'italic' }}>
          ↳ {mahadasha ? `Reading your live ${mahadasha} period from Jyotish profile.` : 'Add birth data in Vedic Astrology for a fully personalised Jyotish frequency prescription.'}
        </div>
      </div>
      <button className="cta-gold" style={{ marginTop: 16 }} onClick={rescan}>⟳ &nbsp;&nbsp;Re-Scan My Field</button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MUSIC TRACK TYPE — matches actual music_tracks DB schema
───────────────────────────────────────────────────────────────── */
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover_image_url?: string | null;
  full_audio_url: string;   // the real column name in DB
  preview_url: string;      // 30s preview (required in DB)
  genre: string;
  spiritual_path?: string | null;
  frequency_band?: string | null;  // e.g. "528hz", "432hz"
  price_usd: number;               // 0 = free, >0 = paid
  duration_seconds: number;
  bpm?: number | null;
  mood?: string | null;
  energy_level?: string | null;
}

// Parse frequency_band like "528hz" → display label
const HZ_BAND_LABELS: Record<string, string> = {
  '174hz': '174 Hz · Foundation', '285hz': '285 Hz · Energy Fields',
  '396hz': '396 Hz · Root Liberation', '417hz': '417 Hz · Change',
  '432hz': '432 Hz · Cosmic Tune', '444hz': '444 Hz · Angelic Gate',
  '528hz': '528 Hz · DNA Repair', '639hz': '639 Hz · Heart Coherence',
  '741hz': '741 Hz · Expression', '852hz': '852 Hz · Intuition',
  '963hz': '963 Hz · God Frequency',
};

function getHzLabel(band?: string | null): string | null {
  if (!band) return null;
  const key = band.toLowerCase().replace(/\s/g, '');
  return HZ_BAND_LABELS[key] ?? band;
}

// free (price_usd === 0) = rank 0; paid = rank 1 (needs Prana-Flow+)
function getTierRank(price_usd: number): number {
  return price_usd === 0 ? 0 : 1;
}

/* ─────────────────────────────────────────────────────────────────
   AUTO 30-SECOND PREVIEW HOOK
   ─────────────────────────────────────────────────────────────────
   How it works:
   1. When free user plays → uses preview_url if available (30s clip)
   2. If NO preview_url → loads full_audio_url but programmatically stops at 30s
      via HTML5 Audio timeupdate event: when currentTime >= 30, pause + fire callback
   3. Prana-Flow+ → plays full_audio_url with no time limit
   4. A countdown (30→0) is shown in the UI so user sees the preview ending
───────────────────────────────────────────────────────────────── */
const PREVIEW_SECONDS = 30;

interface PreviewState {
  trackId: string | null;
  isPlaying: boolean;
  currentTime: number;   // seconds elapsed
  duration: number;      // full track duration
  hasFullAccess: boolean;
}

function useAutoPreview(onSnippetEnd: (track: MusicTrack) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PreviewState>({
    trackId: null, isPlaying: false, currentTime: 0, duration: 0, hasFullAccess: false,
  });
  const currentTrackRef = useRef<MusicTrack | null>(null);

  // Clean up audio element
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current = null;
    }
    setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
  }, []);

  const play = useCallback((track: MusicTrack, hasFullAccess: boolean) => {
    // Stop any existing audio
    stopAudio();
    currentTrackRef.current = track;

    // Choose URL:
    // - Full access → full_audio_url (full track, no limit)
    // - Free user with preview_url → use preview_url (pre-cut 30s clip)
    // - Free user WITHOUT preview_url → use full_audio_url but stop at 30s via timeupdate
    let url: string | null = null;
    if (hasFullAccess) {
      url = track.full_audio_url || null;
    } else {
      // Prefer preview_url (manual 30s clip) → fallback to auto-truncating full_audio_url
      url = track.preview_url || track.full_audio_url || null;
    }

    if (!url) {
      toast.error('Audio not yet available for this track');
      return;
    }

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setState(s => ({ ...s, duration: audio.duration }));
    };

    audio.ontimeupdate = () => {
      const ct = audio.currentTime;
      setState(s => ({ ...s, currentTime: ct }));

      // Auto-stop at 30s for free users (only when using full_audio_url without preview_url)
      if (!hasFullAccess && !track.preview_url && ct >= PREVIEW_SECONDS) {
        audio.pause();
        setState(s => ({ ...s, isPlaying: false }));
        if (currentTrackRef.current) {
          onSnippetEnd(currentTrackRef.current);
        }
      }
    };

    // When preview_url ends naturally (it's a 30s file), also fire the callback
    audio.onended = () => {
      setState(s => ({ ...s, isPlaying: false }));
      if (!hasFullAccess && currentTrackRef.current) {
        onSnippetEnd(currentTrackRef.current);
      }
    };

    audio.play()
      .then(() => setState(s => ({ ...s, trackId: track.id, isPlaying: true, hasFullAccess })))
      .catch(e => { console.error('Audio play failed:', e); stopAudio(); });

  }, [stopAudio, onSnippetEnd]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setState(s => ({ ...s, isPlaying: true }))).catch(console.error);
    } else {
      audio.pause();
      setState(s => ({ ...s, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => { stopAudio(); setState({ trackId: null, isPlaying: false, currentTime: 0, duration: 0, hasFullAccess: false }); currentTrackRef.current = null; }, [stopAudio]);

  // Cleanup on unmount
  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  return { state, play, togglePause, stop };
}

/* ─────────────────────────────────────────────────────────────────
   TRACK ROW COMPONENT
───────────────────────────────────────────────────────────────── */
const TrackRow: React.FC<{
  track: MusicTrack;
  isActive: boolean;
  isPlaying: boolean;
  progress: number;        // 0-1
  secondsLeft: number;     // countdown for free users
  userTierRank: number;
  onPlay: (t: MusicTrack) => void;
  onLock: (t: MusicTrack) => void;
}> = ({ track, isActive, isPlaying, progress, secondsLeft, userTierRank, onPlay, onLock }) => {
  const trackTierRank = getTierRank(track.price_usd);
  const locked = userTierRank < trackTierRank;
  const live = isActive && isPlaying;
  const hzLabel = getHzLabel(track.frequency_band);
  const hasFullAccess = userTierRank >= trackTierRank;
  const showCountdown = isActive && !hasFullAccess && secondsLeft > 0 && secondsLeft <= PREVIEW_SECONDS;

  return (
    <div
      className={`track-row${live ? ' active' : ''}`}
      style={!live ? { border: isActive ? '1px solid rgba(212,175,55,.3)' : '1px solid transparent', background: isActive ? 'rgba(212,175,55,.04)' : undefined } : undefined}
      onClick={() => locked ? onLock(track) : onPlay(track)}
    >
      {/* Cover — real image from Supabase cover_image_url */}
      <div className="cover-wrap">
        <div className="cover-inner">
          {track.cover_image_url ? (
            <img
              src={track.cover_image_url}
              alt={track.title}
              loading="lazy"
              onLoad={e => (e.currentTarget as HTMLImageElement).classList.add('loaded')}
            />
          ) : null}
          {/* Fallback shown while image loads or if no cover */}
          <div className="cover-fallback" style={{ opacity: track.cover_image_url ? 0 : 1, transition: 'opacity .3s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(212,175,55,0.5)" strokeWidth="1"/>
              <circle cx="12" cy="12" r="4" fill="rgba(212,175,55,0.4)"/>
              <path d="M9 9 L9 5 L18 3 L18 7" stroke="rgba(212,175,55,0.6)" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        </div>
        <div className="cover-aura" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="track-title">{track.title}</div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.4)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 4 }}>
          {track.spiritual_path || track.genre || 'Sacred Sound'}{track.bpm ? ` · ${track.bpm} BPM` : ''}
        </div>
        {hzLabel && <div className="hz-badge">{hzLabel}</div>}
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        {showCountdown && (
          <div className="snip-countdown" style={{ marginTop: 4 }}>
            {Math.ceil(secondsLeft)}s preview remaining
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {locked ? (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={13} style={{ color: 'rgba(255,255,255,.3)' }} />
            </div>
            <span className={trackTierRank >= 2 ? 'badge-siddha' : 'badge-prana'}>
              {trackTierRank >= 2 ? 'SIDDHA' : 'PRANA'}
            </span>
          </>
        ) : (
          <>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                className={`play-btn${live ? ' playing' : ''}`}
                onClick={e => { e.stopPropagation(); onPlay(track); }}
              >
                {live ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
              </button>
              {live && <div className="scalar-ring" />}
            </div>
            {live
              ? <div className="wv"><span /><span /><span /><span /><span /></div>
              : <>
                  <span className={trackTierRank === 0 ? 'badge-free' : 'badge-prana'}>
                    {trackTierRank === 0 ? 'FREE' : 'PRANA'}
                  </span>
                  <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {hasFullAccess ? 'FULL' : '30s'}
                  </span>
                </>
            }
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SECTION COMPONENT (collapsible)
───────────────────────────────────────────────────────────────── */
const Section: React.FC<{
  title: string; micro: string; tracks: MusicTrack[];
  activeId?: string; isPlaying: boolean; progress: number; secondsLeft: number;
  userTierRank: number; onPlay: (t: MusicTrack) => void; onLock: (t: MusicTrack) => void;
  defaultOpen?: boolean;
}> = ({ title, micro, tracks, activeId, isPlaying, progress, secondsLeft, userTierRank, onPlay, onLock, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!tracks.length) return null;
  return (
    <div className="glass-card" style={{ marginBottom: 11, overflow: 'visible' }}>
      <div className="sec-toggle" onClick={() => setOpen(o => !o)}>
        <div>
          <span className="micro" style={{ marginBottom: 3 }}>{micro}</span>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.32)', marginTop: 2 }}>{tracks.length} transmissions</div>
        </div>
        <div className={`chevron${open ? ' open' : ''}`}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ paddingBottom: 10 }}>
          <div className="akasha-div" />
          {tracks.map((t, i) => (
            <React.Fragment key={t.id}>
              <TrackRow track={t} isActive={activeId === t.id} isPlaying={isPlaying} progress={activeId === t.id ? progress : 0} secondsLeft={activeId === t.id ? secondsLeft : 0} userTierRank={userTierRank} onPlay={onPlay} onLock={onLock} />
              {i < tracks.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,.03)', margin: '0 14px' }} />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SNIPPET ENDED MODAL
───────────────────────────────────────────────────────────────── */
const SnippetModal: React.FC<{
  track: MusicTrack; onClose: () => void; onUpgrade: () => void;
}> = ({ track, onClose, onUpgrade }) => (
  <div className="snip-overlay" onClick={onClose}>
    <div className="snip-card" onClick={e => e.stopPropagation()}>
      <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 18px' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <FlowerOfLife size={72} opacity={0.55} />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🔓</div>
      </div>
      <div className="snip-title">Unlock Full Access</div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.65, marginBottom: 22 }}>
        Your 30-second Prema-Pulse preview of <strong style={{ color: '#D4AF37' }}>{track.title}</strong> has ended.<br /><br />
        Activate <strong style={{ color: '#D4AF37' }}>Prana-Flow</strong> to stream every track in full — unlimited, forever.
      </p>
      <button className="cta-gold" style={{ maxWidth: 340, margin: '0 auto', display: 'block' }} onClick={onUpgrade}>
        Activate Prana-Flow · €19/mo
      </button>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 14, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }} onClick={onClose}>
        Continue with free access
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN MUSIC PAGE
───────────────────────────────────────────────────────────────── */
const Music: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, adminGranted, isPremium, tier: membershipTier } = useMembership();
  const jyotish = useJyotishProfile();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [snippetTrack, setSnippetTrack] = useState<MusicTrack | null>(null);
  const upgradeLockedRef = useRef(false);

  // ── Stripe success toasts (PRESERVED) ──
  useEffect(() => {
    const s = searchParams.get('success');
    const ms = searchParams.get('membership_success');
    const c = searchParams.get('cancelled');
    if (s === 'true') toast.success(t('music.paymentSuccess', 'Payment successful!'));
    else if (ms === 'true') toast.success(t('music.membershipSuccess', 'Welcome to your new tier!'));
    else if (c === 'true') toast.info(t('music.paymentCancelled', 'Payment cancelled.'));
  }, [searchParams, t]);

  // ── Fetch ALL tracks using real DB column names ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('music_tracks')
          .select('id,title,artist,cover_image_url,full_audio_url,preview_url,genre,spiritual_path,frequency_band,price_usd,duration_seconds,bpm,mood,energy_level')
          .order('created_at', { ascending: false });
        if (data && !error) setTracks(data as MusicTrack[]);
        else if (error) console.error('music_tracks fetch error:', error);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // ── User tier rank: admin/paid = full access; free = 30s preview only ──
  const userTierRank = useMemo(() => {
    if (!user) return 0;
    if (isAdmin || adminGranted) return 3;
    const tier = (membershipTier || '').toLowerCase();
    if (tier.includes('akasha') || tier.includes('infinity') || tier.includes('lifetime')) return 3;
    if (tier.includes('siddha') || tier.includes('quantum')) return 2;
    if (tier.includes('prana') || isPremium) return 1;
    return 0;
  }, [user, isAdmin, adminGranted, isPremium, membershipTier]);

  // ── Auto-preview hook ──
  const { state: previewState, play: playPreview, togglePause, stop: stopPreview } = useAutoPreview(
    useCallback((endedTrack: MusicTrack) => {
      setSnippetTrack(endedTrack);
    }, [])
  );

  // Compute progress and seconds left for UI
  const progress = useMemo(() => {
    if (!previewState.trackId) return 0;
    const hasFullAccess = previewState.hasFullAccess;
    if (hasFullAccess) {
      return previewState.duration > 0 ? previewState.currentTime / previewState.duration : 0;
    }
    // Free user — show progress against 30s
    return Math.min(previewState.currentTime / PREVIEW_SECONDS, 1);
  }, [previewState]);

  const secondsLeft = useMemo(() => {
    if (!previewState.trackId || previewState.hasFullAccess) return 0;
    return Math.max(0, PREVIEW_SECONDS - previewState.currentTime);
  }, [previewState]);

  // ── Categorize tracks ──
  const { beats, meditations, songs } = useMemo(() => {
    const beats: MusicTrack[] = [], meditations: MusicTrack[] = [], songs: MusicTrack[] = [];
    tracks.forEach(t => {
      const g = (t.genre || t.spiritual_path || '').toLowerCase();
      const isMed = g.includes('meditat') || g.includes('deep_healing') || g.includes('healing') || g.includes('sleep') || g.includes('sanctuary');
      const isBeat = g.includes('beat') || g.includes('reggaeton') || g.includes('hip hop') || g.includes('mystic') || g.includes('indian') || (t.title || '').includes('(Beat)');
      if (isMed) meditations.push(t);
      else if (isBeat) beats.push(t);
      else songs.push(t);
    });
    return { beats, meditations, songs };
  }, [tracks]);

  const displayed = useMemo(() => {
    if (filter === 'all') return tracks;
    if (filter === 'beats') return beats;
    if (filter === 'meditation') return meditations;
    if (filter === 'songs') return songs;
    return tracks;
  }, [filter, tracks, beats, meditations, songs]);

  // ── Play handler ──
  const handlePlay = useCallback((track: MusicTrack) => {
    // If same track → toggle pause/play
    if (previewState.trackId === track.id) { togglePause(); return; }
    const trackTierRank = getTierRank(track.price_usd);
    const hasFullAccess = userTierRank >= trackTierRank;
    playPreview(track, hasFullAccess);
  }, [previewState.trackId, userTierRank, playPreview, togglePause]);

  // ── Lock handler ──
  const handleLock = useCallback((track: MusicTrack) => {
    if (!user) { navigate('/auth'); return; }
    setSnippetTrack(track);
  }, [user, navigate]);

  // ── Upgrade (Stripe — PRESERVED) ──
  const handleUpgrade = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    if (upgradeLockedRef.current) return;
    upgradeLockedRef.current = true;
    try {
      await startPranaMonthlyCheckout({
        successPath: '/music?membership_success=true',
        sourcePage: 'music-upgrade',
      });
    } catch (e) {
      upgradeLockedRef.current = false;
      toast.error(e instanceof Error ? e.message : 'Checkout failed.');
    }
  }, [user, navigate]);

  if (loading) return (
    <div className="ssp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: SQI_STYLES }} />
      <Loader2 size={28} style={{ color: '#22D3EE', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
      <span className="micro" style={{ textAlign: 'center' }}>Channelling Sacred Sound Portal…</span>
    </div>
  );

  const activeTrack = tracks.find(t => t.id === previewState.trackId) || null;

  return (
    <div className="ssp">
      <style dangerouslySetInnerHTML={{ __html: SQI_STYLES }} />
      <StarfieldCanvas />

      <div className="ssp-z">

        {/* HERO */}
        <div style={{ position: 'relative', padding: '48px 0 16px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,.2),transparent 70%)', animation: 'orbFloat 12s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(212,175,55,.07),transparent 65%)', pointerEvents: 'none' }} />
          <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--glass)', border: '1px solid var(--glass-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <ArrowLeft size={16} />
          </button>
          <span className="micro" style={{ position: 'relative', zIndex: 1 }}>Nada Brahma · Sound is the Universe · SQI-2050</span>
          <h1 className="ssp-title" style={{ position: 'relative', zIndex: 1 }}>Sacred Sound Portal</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', marginTop: 8, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
            Scalar Waves · Prema-Pulse Transmissions · Ecstatic Consciousness Light-Codes
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.2))' }} />
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="9" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="0.7" />
              <circle cx="10" cy="10" r="4.5" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="0.7" />
              {[[10,2],[10,18],[2,7],[18,7],[2,13],[18,13]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="4.5" fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.55"/>))}
            </svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(212,175,55,.2),transparent)' }} />
          </div>
        </div>

        {/* FILTER PILLS */}
        <div className="pill-row">
          {[{ k: 'all', l: 'All Frequencies' }, { k: 'beats', l: 'Sacred Beats' }, { k: 'meditation', l: 'Meditations' }, { k: 'songs', l: 'Songs' }].map(p => (
            <button key={p.k} className={`pill${filter === p.k ? ' on' : ''}`} onClick={() => setFilter(p.k)}>{p.l}</button>
          ))}
        </div>

        {/* NADI SCANNER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '20px 0 12px' }}>
          <div className="sec-dot" />
          <div>
            <span className="micro" style={{ marginBottom: 2 }}>Jyotish-Aligned · Live Field Reading</span>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Nadi Scanner · Your Frequency Prescription</div>
          </div>
        </div>
        <NadiScanner mahadasha={jyotish?.mahadasha} raga={jyotish?.meditationType} />

        {/* ACCESS BANNER — only for guests / free users */}
        {userTierRank === 0 && (
          <div style={{ margin: '16px 0', padding: '14px 18px', background: 'linear-gradient(135deg,rgba(212,175,55,.06),rgba(212,175,55,.02))', border: '1px solid rgba(212,175,55,.18)', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>🎵</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 3 }}>Free Seeker · Automatic 30-Second Previews</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                Every track plays a 30-second Prema-Pulse preview automatically — no setup needed. Upgrade for full transmissions.
              </div>
            </div>
          </div>
        )}

        {/* TRACK LIBRARY */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div className="sec-dot" />
            <div>
              <span className="micro" style={{ marginBottom: 2 }}>Prema-Pulse Transmissions · {tracks.length} Tracks</span>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Sacred Sound Library</div>
            </div>
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', background: 'var(--glass)', border: '1px solid var(--glass-b)', borderRadius: 30, padding: '4px 12px', flexShrink: 0 }}>
            {userTierRank === 0 ? 'FREE · 30s' : userTierRank === 1 ? 'PRANA · FULL' : userTierRank === 2 ? 'SIDDHA · DL' : 'AKASHA · ∞'}
          </div>
        </div>

        {filter === 'all' ? (
          <>
            <Section title="Sacred Beats" micro="Bhakti-Algorithms · Rhythm Transmissions" tracks={beats} activeId={previewState.trackId ?? undefined} isPlaying={previewState.isPlaying} progress={progress} secondsLeft={secondsLeft} userTierRank={userTierRank} onPlay={handlePlay} onLock={handleLock} defaultOpen={true} />
            <Section title="Meditation Music" micro="Scalar Wave · Deep Healing Codes" tracks={meditations} activeId={previewState.trackId ?? undefined} isPlaying={previewState.isPlaying} progress={progress} secondsLeft={secondsLeft} userTierRank={userTierRank} onPlay={handlePlay} onLock={handleLock} defaultOpen={true} />
            <Section title="Sacred Songs" micro="Vedic Light-Codes · Soul Transmissions" tracks={songs} activeId={previewState.trackId ?? undefined} isPlaying={previewState.isPlaying} progress={progress} secondsLeft={secondsLeft} userTierRank={userTierRank} onPlay={handlePlay} onLock={handleLock} defaultOpen={true} />
          </>
        ) : (
          <div className="glass-card" style={{ overflow: 'visible', padding: '8px 0' }}>
            {displayed.length === 0
              ? <div style={{ padding: '32px 20px', textAlign: 'center' }}><span className="micro" style={{ textAlign: 'center' }}>No transmissions in this category yet</span></div>
              : displayed.map((track, i) => (
                <React.Fragment key={track.id}>
                  <TrackRow track={track} isActive={previewState.trackId === track.id} isPlaying={previewState.isPlaying} progress={previewState.trackId === track.id ? progress : 0} secondsLeft={previewState.trackId === track.id ? secondsLeft : 0} userTierRank={userTierRank} onPlay={handlePlay} onLock={handleLock} />
                  {i < displayed.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,.03)', margin: '0 14px' }} />}
                </React.Fragment>
              ))
            }
          </div>
        )}

        <div className="akasha-div" style={{ margin: '28px 0 8px' }} />

        {/* UPGRADE SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 0 18px' }}>
          <div className="sec-dot" />
          <div>
            <span className="micro" style={{ marginBottom: 2 }}>Akasha-Infinity Access Architecture</span>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Unlock Your Frequency</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div className="up-card up-free">
            <div className="up-tier">Free · Seeker</div>
            <div className="up-name">Taste the Field</div>
            <div className="up-price">€0 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/ forever</span></div>
            <ul className="up-feats">
              <li>Automatic 30-second preview of every track</li>
              <li>No uploads needed — browser clips automatically</li>
              <li>Nadi Scanner — 1 Jyotish field scan per day</li>
              <li className="dim">Full streaming (Prana-Flow+)</li>
              <li className="dim">Downloads (Siddha-Quantum+)</li>
            </ul>
            <button className="cta-outline">Explore Free Access</button>
          </div>

          <div className="up-card up-prana">
            <div className="up-tier">Prana-Flow</div>
            <div className="up-name">Practitioner</div>
            <div className="up-price">€19 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/ month</span></div>
            <ul className="up-feats">
              <li>Full streaming — all {tracks.length} tracks unlimited</li>
              <li>Nadi Scanner — unlimited daily scans</li>
              <li>Jyotish frequency prescription (full depth)</li>
              <li>33 SHC Vedic coins per track streamed</li>
              <li className="dim">Downloads (Siddha-Quantum+)</li>
            </ul>
            <button className="cta-gold" onClick={handleUpgrade}>Activate Prana-Flow · €19/mo</button>
          </div>

          <div className="up-card up-siddha">
            <div className="up-tier">Siddha-Quantum</div>
            <div className="up-name">Siddha</div>
            <div className="up-price">€45 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/ month</span></div>
            <ul className="up-feats">
              <li>Everything in Prana-Flow</li>
              <li>Full high-quality downloads — all formats</li>
              <li>Custom mantra creation with Kritagya Das</li>
              <li>Custom healing beat production request</li>
              <li>Early access to all new releases</li>
            </ul>
            <button className="cta-gold" onClick={handleUpgrade}>Activate Siddha-Quantum · €45/mo</button>
          </div>

          <div className="up-card up-akasha">
            <div className="up-tier c">Akasha-Infinity · Eternal</div>
            <div className="up-name">Akasha Master</div>
            <div className="up-price" style={{ background: 'linear-gradient(90deg,#D4AF37,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              €1111 <span style={{ fontSize: 13, fontWeight: 500, WebkitTextFillColor: 'var(--muted)' }}>/ lifetime</span>
            </div>
            <ul className="up-feats">
              <li>Everything — unlocked eternally</li>
              <li>Lifetime download vault — all future releases</li>
              <li>Custom mantra + healing beat co-creation</li>
              <li>Zero cost on all future releases — forever</li>
            </ul>
            <button className="cta-akasha" onClick={handleUpgrade}>Activate Akasha-Infinity · €1111</button>
          </div>
        </div>

        {/* FLOWER OF LIFE — MASTERING BANNER */}
        <div className="fol-banner">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0 }}>
            <FlowerOfLife size={320} opacity={0.1} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 16px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0 }}><FlowerOfLife size={72} opacity={0.55} /></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={26} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 8px rgba(212,175,55,.6))' }} />
              </div>
            </div>
            <span className="micro" style={{ textAlign: 'center', display: 'block', color: 'rgba(212,175,55,.6)' }}>Sacred Sound Alchemy</span>
            <div className="fol-title">Music Mastering Service</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.52)', lineHeight: 1.65, marginBottom: 20 }}>
              Have your music mastered through the SQI-2050 Scalar Wave Architecture. Professional mastering infused with Vedic Light-Codes, sacred geometry frequency alignment, and Anahata activation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['⚡', 'Scalar Alignment', '528Hz + harmonics'], ['🕉️', 'Vedic Light-Code Imprint', 'Sacred intention encoded'], ['🎵', 'Full Mastering Suite', 'Dynamics, EQ, limiter'], ['📀', 'All Formats', 'WAV · MP3 · FLAC']].map(([icon, title, desc], i) => (
                <div key={i} style={{ background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.14)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {['From €147', '1-week turnaround', 'Unlimited revisions'].map((item, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(212,175,55,.7)' }}>{i > 0 ? '· ' : ''}{item}</span>
              ))}
            </div>
            <button className="cta-gold" onClick={() => window.open('mailto:info@siddhaquantumnexus.com?subject=Music Mastering Service', '_blank')}>
              ✦ &nbsp;Book Music Mastering · From €147
            </button>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* NOW PLAYING BAR */}
      {activeTrack && (
        <div className={`np-bar${previewState.isPlaying ? ' live' : ''}`}>
          <button className={`np-icon${previewState.isPlaying ? ' pulse' : ''}`} onClick={togglePause}>
            {previewState.isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={`np-title${previewState.isPlaying ? ' live' : ''}`}>{activeTrack.title}</div>
            {!previewState.hasFullAccess && secondsLeft > 0 && (
              <div className="np-countdown">{Math.ceil(secondsLeft)}s preview remaining</div>
            )}
            <div className="np-prog">
              <div className="np-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <Sparkles size={14} className="nadi-pulse" />
          <button
            onClick={() => stopPreview()}
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SNIPPET END MODAL */}
      {snippetTrack && (
        <SnippetModal
          track={snippetTrack}
          onClose={() => setSnippetTrack(null)}
          onUpgrade={() => { setSnippetTrack(null); handleUpgrade(); }}
        />
      )}
    </div>
  );
};

export default Music;
