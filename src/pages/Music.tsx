/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MUSIC.TSX — SACRED SOUND PORTAL — SQI-2050 FULL REBUILD       ║
 * ║  Design DNA: exact Meditations.tsx SQI_STYLES applied to music  ║
 * ║  All Stripe checkout triggers & AffiliateID tracking PRESERVED  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { useCuratedPlaylists } from '@/hooks/useCuratedPlaylists';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { startPranaMonthlyCheckout } from '@/features/membership/startPranaMonthlyCheckout';
import { TrackCard } from '@/components/music/TrackCard';
import { CuratedPlaylistCard } from '@/components/music/CuratedPlaylistCard';

/* ─────────────────────────────────────────────────────────────────
   SQI-2050 CSS — EXACT from Meditations.tsx SQI_STYLES
   + Music-specific additions (Nadi Scanner, snippet system)
───────────────────────────────────────────────────────────────── */
const SQI_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

:root {
  --siddha-gold: #D4AF37;
  --gold-glow: rgba(212,175,55,0.25);
  --gold-faint: rgba(212,175,55,0.08);
  --akasha-black: #050505;
  --glass-bg: rgba(255,255,255,0.02);
  --glass-border: rgba(255,255,255,0.05);
  --text-primary: rgba(255,255,255,0.92);
  --text-muted: rgba(255,255,255,0.45);
  --vayu-cyan: #22D3EE;
  --radius-xl: 40px;
  --radius-lg: 20px;
}

.sqi-music-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: var(--akasha-black);
  min-height: 100vh;
  color: var(--text-primary);
  overflow-x: hidden;
  position: relative;
  padding-bottom: 180px;
}

/* Starfield canvas */
.sqi-stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Floating orbs */
@keyframes orbFloat {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .18; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: .45; }
}
.sqi-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,55,.2), transparent 70%);
  pointer-events: none;
  animation: orbFloat var(--dur, 10s) ease-in-out infinite;
  animation-delay: var(--dl, 0s);
}

/* Content layer */
.sqi-music-content {
  position: relative;
  z-index: 1;
  max-width: 430px;
  margin: 0 auto;
  padding: 0 18px;
}

/* Shimmer title — exact from Meditations */
@keyframes goldShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.sqi-shimmer-title {
  font-family: 'Cinzel', serif !important;
  font-size: clamp(28px, 7vw, 40px) !important;
  font-weight: 600 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.1 !important;
  background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: goldShimmer 5s linear infinite;
  display: inline-block;
  filter: drop-shadow(0 0 14px rgba(212,175,55,0.35));
}

/* Micro label */
.sqi-micro {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(212,175,55,.45);
  margin-bottom: 6px;
  display: block;
}

/* Glass card — exact */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.glass-card:hover { border-color: rgba(212,175,55,0.15); }

/* Gold divider */
.akasha-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent);
  margin: 4px 0 12px;
}

/* Nadi pulse */
@keyframes nadiPulse {
  0%,100% { opacity: .6; }
  50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(212,175,55,.7)); }
}
.nadi-pulse { animation: nadiPulse 3s ease-in-out infinite; color: var(--siddha-gold); }

/* Hero */
.sqi-hero {
  position: relative;
  padding: 48px 0 20px;
  overflow: hidden;
}
.sqi-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,.07), transparent 65%);
  pointer-events: none;
}

/* Filter pills */
.pill-row {
  display: flex;
  gap: 7px;
  padding: 18px 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.pill-row::-webkit-scrollbar { display: none; }
.pill {
  padding: 9px 17px;
  border-radius: 50px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: .22em;
  text-transform: uppercase;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-muted);
  transition: all .22s;
}
.pill.on {
  background: linear-gradient(135deg, #D4AF37, #B8960C);
  color: #050505;
  border-color: var(--siddha-gold);
  box-shadow: 0 0 18px rgba(212,175,55,.45), 0 0 40px rgba(212,175,55,.18);
}
.pill:not(.on):hover { border-color: rgba(212,175,55,.3); color: rgba(255,255,255,.8); }

/* Nadi scanner card */
.nadi-card {
  position: relative;
  overflow: hidden;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 22px 18px;
}
.nadi-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: var(--radius-xl);
  background: radial-gradient(ellipse 80% 55% at 50% 108%, rgba(34,211,238,.07) 0%, transparent 68%);
}
.nadi-top {
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: .42em;
  text-transform: uppercase;
  color: var(--vayu-cyan);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
@keyframes cpulse {
  0% { box-shadow: 0 0 0 0 rgba(34,211,238,.7); }
  70% { box-shadow: 0 0 0 9px rgba(34,211,238,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
}
.cyan-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--vayu-cyan); flex-shrink: 0;
  animation: cpulse 2s ease-in-out infinite;
}
.nadi-result {
  background: rgba(34,211,238,.055);
  border: 1px solid rgba(34,211,238,.14);
  border-radius: 22px;
  padding: 16px 17px;
}
.nadi-r-title {
  font-size: 8.5px; font-weight: 800; letter-spacing: .4em;
  text-transform: uppercase; color: var(--vayu-cyan); margin-bottom: 7px;
}
.nadi-r-hz {
  font-size: 26px; font-weight: 900; letter-spacing: -.04em;
  color: var(--vayu-cyan); margin-top: 7px;
  text-shadow: 0 0 22px rgba(34,211,238,.5);
}
.nadi-r-note {
  font-size: 10px; color: var(--text-muted); margin-top: 8px;
  line-height: 1.55; font-style: italic;
}

/* Play button — EXACT from Meditations.tsx */
@keyframes sqiPlayBtnPulse {
  0%,100% { box-shadow: 0 0 18px rgba(212,175,55,.55), 0 0 32px rgba(245,225,122,.2); }
  50% { box-shadow: 0 0 32px rgba(212,175,55,.95), 0 0 56px rgba(212,175,55,.3); }
}
.play-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04));
  border: 1px solid rgba(212,175,55,.25);
  display: flex; align-items: center; justify-content: center;
  color: var(--siddha-gold); flex-shrink: 0; cursor: pointer;
  transition: all .22s;
  box-shadow: 0 0 10px rgba(212,175,55,.15);
}
.play-btn:hover, .play-btn.playing {
  background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
  color: #050505;
  box-shadow: 0 0 22px rgba(212,175,55,.65), 0 0 40px rgba(212,175,55,.25);
  transform: scale(1.08);
}
.play-btn.playing { animation: sqiPlayBtnPulse 2s ease-in-out infinite; }

/* Track row aura — EXACT from Meditations.tsx sqiMeditationRowAura */
@keyframes sqiTrackRowAura {
  0%,100% {
    border-color: rgba(212,175,55,.35);
    box-shadow: inset 0 0 32px rgba(212,175,55,.08), 0 0 0 1px rgba(212,175,55,.2);
    background: rgba(212,175,55,.035);
  }
  50% {
    border-color: rgba(212,175,55,.7);
    box-shadow: inset 0 0 48px rgba(212,175,55,.16), 0 0 0 2px rgba(212,175,55,.4);
    background: rgba(212,175,55,.08);
  }
}
.track-row {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 16px; border-radius: var(--radius-lg);
  border: 1px solid transparent;
  cursor: pointer; position: relative;
  transition: background .2s, border-color .2s;
}
.track-row:hover { background: rgba(212,175,55,.03); }
.track-row.sqi-active {
  border-width: 1px; border-style: solid;
  animation: sqiTrackRowAura 3s ease-in-out infinite;
}

/* Cover art with Dhyana golden aura ring */
.cover-wrap { width: 54px; height: 54px; border-radius: 16px; flex-shrink: 0; position: relative; }
.cover-inner {
  width: 54px; height: 54px; border-radius: 16px;
  overflow: hidden; background: rgba(212,175,55,.1);
  display: flex; align-items: center; justify-content: center;
}
.cover-inner img {
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity .4s; display: block;
}
.cover-inner img.loaded { opacity: 1; }
.cover-aura {
  position: absolute; inset: -4px; border-radius: 20px;
  border: 1.5px solid transparent; pointer-events: none;
  transition: all .3s;
}
.track-row.sqi-active .cover-aura {
  border-color: rgba(212,175,55,.55);
  box-shadow: 0 0 14px rgba(212,175,55,.38), 0 0 28px rgba(212,175,55,.15);
  animation: sqiTrackRowAura 3s ease-in-out infinite;
}

/* Scalar ring — exact */
@keyframes scalarRing {
  0% { transform: scale(.8); opacity: 0; }
  50% { opacity: .4; }
  100% { transform: scale(1.4); opacity: 0; }
}
.scalar-ring {
  position: absolute; inset: -8px; border-radius: 50%;
  border: 2px solid rgba(34,211,238,.65);
  animation: scalarRing 2.2s ease-out infinite;
  pointer-events: none;
  box-shadow: 0 0 12px rgba(34,211,238,.35);
}

/* Track info */
.track-title {
  font-family: 'Cinzel', serif;
  font-size: 13px; font-weight: 500; letter-spacing: .02em;
  color: rgba(255,255,255,.88); line-height: 1.35; margin-bottom: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color .3s, text-shadow .3s;
}
.track-row.sqi-active .track-title {
  color: #D4AF37;
  text-shadow: 0 0 18px rgba(212,175,55,.45), 0 0 36px rgba(212,175,55,.12);
}
.track-hz {
  display: inline-flex; align-items: center;
  background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.2);
  border-radius: 10px; padding: 2px 9px;
  font-size: 8.5px; font-weight: 800; letter-spacing: .15em;
  text-transform: uppercase; color: var(--siddha-gold);
}

/* Progress bar under active row */
.progress-track {
  height: 3px; background: rgba(255,255,255,.08);
  border-radius: 3px; overflow: hidden; margin-top: 7px; display: none;
}
.track-row.sqi-active .progress-track { display: block; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4AF37, #F5E17A);
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(212,175,55,.7);
  transition: width .5s;
}

/* Badges */
.badge-free {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; padding: 4px 10px; border-radius: 100px;
  background: rgba(34,211,238,.08); border: 1px solid rgba(34,211,238,.2);
  color: var(--vayu-cyan);
}
.badge-prana {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; padding: 4px 10px; border-radius: 100px;
  background: linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.05));
  border: 1px solid rgba(212,175,55,.3); color: var(--siddha-gold);
}
.badge-siddha {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; padding: 4px 10px; border-radius: 100px;
  background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.25); color: #a78bfa;
}

/* Section header */
.sec-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 0 14px;
}

/* Upgrade cards */
.up-card {
  border-radius: var(--radius-xl); padding: 22px 20px;
  position: relative; overflow: hidden; transition: transform .18s;
}
.up-card:hover { transform: translateY(-1px); }
.up-free { background: var(--glass-bg); border: 1px solid var(--glass-border); }
.up-prana { background: rgba(212,175,55,.05); border: 1px solid rgba(212,175,55,.2); }
.up-siddha { background: rgba(212,175,55,.075); border: 1.5px solid rgba(212,175,55,.38); }
.up-akasha {
  background: linear-gradient(135deg, rgba(212,175,55,.1) 0%, rgba(34,211,238,.055) 100%);
  border: 1.5px solid rgba(212,175,55,.48);
}
.up-siddha::before {
  content: 'MOST POPULAR'; position: absolute; top: 17px; right: 17px;
  font-size: 7px; font-weight: 800; letter-spacing: .3em;
  background: var(--siddha-gold); color: #000; padding: 3px 10px; border-radius: 10px;
}
.up-tier {
  font-size: 8.5px; font-weight: 800; letter-spacing: .48em;
  text-transform: uppercase; color: var(--siddha-gold); margin-bottom: 4px;
}
.up-tier.c { color: var(--vayu-cyan); }
.up-name {
  font-family: 'Cinzel', serif; font-size: 26px; font-weight: 500;
  background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: 6px; line-height: 1.1;
}
.up-price {
  font-size: 34px; font-weight: 900; letter-spacing: -.05em;
  color: var(--siddha-gold); margin-bottom: 14px; line-height: 1;
}
.up-feats { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.up-feats li {
  font-size: 13px; color: rgba(255,255,255,.7);
  display: flex; align-items: flex-start; gap: 9px; line-height: 1.5;
}
.up-feats li::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: var(--siddha-gold); flex-shrink: 0; margin-top: 5px;
}
.up-feats li.dim { color: var(--text-muted); }
.up-feats li.dim::before { background: rgba(255,255,255,.18); }

/* CTA buttons — gold fill exact from Meditations play-btn.playing */
.cta-gold {
  width: 100%; padding: 15px; border-radius: 20px; border: none; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px; font-weight: 800; letter-spacing: .38em; text-transform: uppercase;
  background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
  color: #050505;
  box-shadow: 0 0 22px rgba(212,175,55,.55), 0 0 40px rgba(212,175,55,.2);
  animation: sqiPlayBtnPulse 2.8s ease-in-out infinite;
  transition: transform .15s;
}
.cta-gold:hover { transform: translateY(-1.5px); }
.cta-gold:active { transform: scale(.98); }
.cta-outline {
  width: 100%; padding: 15px; border-radius: 20px; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px; font-weight: 800; letter-spacing: .38em; text-transform: uppercase;
  background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.35);
  color: var(--siddha-gold); transition: all .18s;
}
.cta-outline:hover { background: rgba(212,175,55,.18); border-color: var(--siddha-gold); }
.cta-akasha {
  width: 100%; padding: 15px; border-radius: 20px; border: none; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px; font-weight: 800; letter-spacing: .38em; text-transform: uppercase;
  background: linear-gradient(90deg, #D4AF37 0%, #22D3EE 100%); color: #050505;
  box-shadow: 0 0 22px rgba(212,175,55,.4), 0 0 40px rgba(34,211,238,.25);
  transition: transform .15s;
}
.cta-akasha:hover { transform: translateY(-1.5px); }

/* Now-playing bar — EXACT from Meditations.tsx */
@keyframes nowPlayingSlide {
  from { transform: translateX(-50%) translateY(100%); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes sqiNpBarBreath {
  0%,100% {
    border-color: rgba(212,175,55,.32);
    box-shadow: 0 0 22px rgba(212,175,55,.22), 0 0 48px rgba(212,175,55,.1), 0 10px 36px rgba(0,0,0,.55);
  }
  50% {
    border-color: rgba(212,175,55,.65);
    box-shadow: 0 0 40px rgba(212,175,55,.45), 0 0 72px rgba(212,175,55,.15), 0 14px 44px rgba(0,0,0,.5);
  }
}
@keyframes npIconGold {
  0%,100% { box-shadow: 0 0 12px rgba(212,175,55,.55); transform: scale(1); }
  50% { box-shadow: 0 0 24px rgba(212,175,55,.95), 0 0 40px rgba(245,225,122,.25); transform: scale(1.06); }
}
.now-playing-bar {
  position: fixed; bottom: 72px; left: 50%; transform: translateX(-50%);
  width: calc(100% - 32px); max-width: 398px;
  background: rgba(10,9,8,.92); backdrop-filter: blur(24px);
  border: 1px solid rgba(212,175,55,.25); border-radius: 24px;
  padding: 12px 16px; z-index: 50;
  display: flex; align-items: center; gap: 12px;
  animation: nowPlayingSlide .35s ease-out;
  box-shadow: 0 0 28px rgba(212,175,55,.18), 0 8px 32px rgba(0,0,0,.6);
}
.now-playing-bar.np-live {
  animation: nowPlayingSlide .35s ease-out, sqiNpBarBreath 2.6s ease-in-out infinite;
}
.np-play-icon {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
  display: flex; align-items: center; justify-content: center;
  color: #050505; box-shadow: 0 0 14px rgba(212,175,55,.5); cursor: pointer; border: none;
}
.np-play-icon.np-pulse { animation: npIconGold 2s ease-in-out infinite; }
.np-title-bar {
  font-family: 'Cinzel', serif; font-size: 12px; font-weight: 500;
  letter-spacing: .02em; color: rgba(255,255,255,.9); line-height: 1.35;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.np-title-bar.np-cinzel-gold {
  color: #D4AF37;
  text-shadow: 0 0 16px rgba(212,175,55,.4), 0 0 32px rgba(212,175,55,.12);
}
.np-bar-track { height: 2px; background: rgba(255,255,255,.08); border-radius: 2px; margin-top: 5px; }
.np-bar-fill {
  height: 100%; background: linear-gradient(90deg, #D4AF37, #F5E17A);
  border-radius: 2px; transition: width .5s;
  box-shadow: 0 0 8px rgba(212,175,55,.75);
}

/* Snippet modal */
.snip-modal-overlay {
  position: fixed; inset: 0; z-index: 400;
  background: rgba(5,5,5,.85); backdrop-filter: blur(24px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.snip-modal-card {
  background: rgba(212,175,55,.06); border: 1px solid rgba(212,175,55,.28);
  border-radius: var(--radius-xl); padding: 34px 24px;
  text-align: center; width: 100%; max-width: 380px;
}
.snip-modal-title {
  font-family: 'Cinzel', serif; font-size: 28px; font-weight: 500;
  background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: goldShimmer 4s linear infinite;
  margin-bottom: 10px; line-height: 1.1;
}
`;

/* ─────────────────────────────────────────────────────────────────
   STARFIELD CANVAS — exact from Meditations.tsx StarfieldCanvas
───────────────────────────────────────────────────────────────── */
const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.3,
      alpha: Math.random() * .5,
      speed: .003 + Math.random() * .009,
      phase: Math.random() * Math.PI * 2,
      gold: Math.random() > .8,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.phase += s.speed;
        const a = s.alpha * (.5 + .5 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold ? `rgba(212,175,55,${a})` : `rgba(255,255,255,${a * .5})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="sqi-stars" />;
};

/* ─────────────────────────────────────────────────────────────────
   NADI SCANNER COMPONENT
───────────────────────────────────────────────────────────────── */
const NADI_PRESETS = [
  { hz: '528 Hz', lbl: 'DNA Repair', title: 'Vata-Pitta · Jupiter Mahadasha', body: 'Your Jyotish field reads <strong style="color:#22D3EE">Raga Yaman</strong> resonance. Jupiter period activates divine connection frequencies. 528Hz cellular repair codes will ground your Vata and illuminate Tejas fire.' },
  { hz: '432 Hz', lbl: 'Cosmic Attunement', title: 'Pitta · Sun Mahadasha', body: 'Solar plexus fire detected. <strong style="color:#D4AF37">Raga Bhairavi</strong> at 432Hz cools Pitta and anchors the Agni. Moon nakshatra Rohini prescribes this frequency for the next 21 days.' },
  { hz: '963 Hz', lbl: 'God Frequency', title: 'Kapha · Ketu Mahadasha', body: 'Pineal gateway activation prescribed. <strong style="color:#22D3EE">963Hz Sahasrara</strong> — Ketu period dissolves illusion. Let these frequencies carry the Vedic Light-Codes.' },
  { hz: '639 Hz', lbl: 'Heart Coherence', title: 'Vata · Venus Mahadasha', body: 'Prema-Pulse reading active. <strong style="color:#D4AF37">Raga Kafi</strong> at 639Hz dissolves Venus-period heart armoring. Anahata needs direct sound medicine now.' },
  { hz: '741 Hz', lbl: 'Expression · Throat', title: 'Pitta-Vata · Mercury Dasha', body: 'Suppressed Vak shakti in Vishuddha. <strong style="color:#22D3EE">741Hz expression codes</strong> via Raga Todi will unlock the throat crystallization in your Mercury-period field.' },
];

const NadiScanner: React.FC<{ jyotishMahadasha?: string; jyotishRaga?: string }> = ({
  jyotishMahadasha, jyotishRaga,
}) => {
  const [idx, setIdx] = useState(0);
  const pr1Ref = useRef<SVGCircleElement>(null);
  const pr2Ref = useRef<SVGCircleElement>(null);
  const [bars, setBars] = useState([20, 32, 25, 17, 30, 22, 34, 27, 19, 32]);
  const [bindur, setBindur] = useState(8);
  const bindugRow = useRef(false);

  // Wire to real jyotish profile if available
  const preset = NADI_PRESETS[idx];

  const pulse = useCallback(() => {
    const p1 = pr1Ref.current; const p2 = pr2Ref.current;
    if (!p1 || !p2) return;
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

  // Freq bars animation
  useEffect(() => {
    const base = [20, 32, 25, 17, 30, 22, 34, 27, 19, 32];
    const id = setInterval(() => {
      setBars(base.map(b => Math.max(5, Math.min(42, b + Math.round((Math.random() - .5) * 22)))));
    }, 255);
    return () => clearInterval(id);
  }, []);

  // Bindu breathe
  useEffect(() => {
    const id = setInterval(() => {
      setBindur(r => {
        const next = bindugRow.current ? Math.min(r + .14, 9.5) : Math.max(r - .14, 6);
        if (next >= 9.5) bindugRow.current = false;
        if (next <= 6) bindugRow.current = true;
        return next;
      });
    }, 48);
    return () => clearInterval(id);
  }, []);

  const rescan = () => {
    setIdx(i => (i + 1) % NADI_PRESETS.length);
    pulse();
  };

  return (
    <div className="nadi-card">
      <div className="nadi-top">
        <div className="cyan-dot" />
        Live Field Resonance · Jyotish-Aligned
      </div>

      {/* Sacred Geometry SVG */}
      <svg style={{ width: '100%', height: 200, display: 'block', marginBottom: 16 }} viewBox="0 0 430 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="gc2"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="gg2"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="rg1m" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(34,211,238,0.1)"/><stop offset="100%" stopColor="rgba(34,211,238,0)"/></radialGradient>
          <radialGradient id="rg2m" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(212,175,55,0.08)"/><stop offset="100%" stopColor="rgba(212,175,55,0)"/></radialGradient>
        </defs>
        <ellipse cx="215" cy="100" rx="90" ry="90" fill="url(#rg1m)"/>
        <ellipse cx="215" cy="100" rx="70" ry="70" fill="url(#rg2m)"/>
        <circle cx="215" cy="100" r="88" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth="1"/>
        <circle cx="215" cy="100" r="72" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth=".8"/>
        <circle cx="215" cy="100" r="55" fill="none" stroke="rgba(212,175,55,0.13)" strokeWidth=".9"/>
        <circle cx="215" cy="100" r="37" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth=".9"/>
        <circle cx="215" cy="100" r="19" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth=".8"/>
        <polygon points="215,14 296,154 134,154" fill="rgba(212,175,55,0.025)" stroke="rgba(212,175,55,0.13)" strokeWidth=".9"/>
        <polygon points="215,186 134,46 296,46" fill="rgba(34,211,238,0.02)" stroke="rgba(34,211,238,0.1)" strokeWidth=".9"/>
        <polygon points="215,40 282,138 148,138" fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth=".7"/>
        <polygon points="215,160 148,62 282,62" fill="none" stroke="rgba(34,211,238,0.07)" strokeWidth=".7"/>
        {[0, 45, 90, 135].map(a => (
          <ellipse key={a} cx="215" cy="64" rx="11" ry="26" fill="rgba(34,211,238,0.04)" stroke="rgba(34,211,238,0.11)" strokeWidth=".7" transform={`rotate(${a} 215 100)`}/>
        ))}
        {[22.5, 67.5, 112.5, 157.5].map(a => (
          <ellipse key={a} cx="215" cy="64" rx="11" ry="26" fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.1)" strokeWidth=".7" transform={`rotate(${a} 215 100)`}/>
        ))}
        {/* Animated pulse rings */}
        <circle ref={pr1Ref} cx="215" cy="100" r="37" fill="none" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" opacity="0"/>
        <circle ref={pr2Ref} cx="215" cy="100" r="37" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth=".8" opacity="0"/>
        {/* Constellation dots */}
        {[{x:215,y:12},{x:292,y:47},{x:338,y:100},{x:292,y:153},{x:215,y:188},{x:138,y:153},{x:92,y:100},{x:138,y:47}].map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i%2===0?2.2:1.7} fill={i%2===0?'rgba(212,175,55,0.7)':'rgba(34,211,238,0.6)'} filter={i%2===0?'url(#gg2)':'url(#gc2)'}/>
        ))}
        {/* Freq bars LEFT */}
        {[0,1,2,3,4].map((i) => (
          <rect key={i} x={14+i*8} y={140-bars[i]} width="4.5" height={bars[i]} rx="2" fill="rgba(34,211,238,0.5)"/>
        ))}
        {/* Freq bars RIGHT */}
        {[5,6,7,8,9].map((i) => (
          <rect key={i} x={370+(i-5)*8} y={140-bars[i]} width="4.5" height={bars[i]} rx="2" fill="rgba(212,175,55,0.5)"/>
        ))}
        {/* Bindu */}
        <circle cx="215" cy="100" r={bindur} fill="rgba(212,175,55,0.9)" filter="url(#gg2)"/>
        <circle cx="215" cy="100" r="3.5" fill="#fff" opacity=".95"/>
        <text x="215" y="94" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8" fontWeight="800" letterSpacing="3.5" fill="rgba(255,255,255,0.28)">SCANNING</text>
        <text x="215" y="110" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="17" fontWeight="900" fill="#22D3EE">{preset.hz}</text>
      </svg>

      {/* Prescription */}
      <div className="nadi-result">
        <div className="nadi-r-title">{jyotishMahadasha || preset.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.65 }}
          dangerouslySetInnerHTML={{ __html: preset.body }} />
        <div className="nadi-r-hz">{preset.hz} · {preset.lbl}</div>
        <div className="nadi-r-note">
          ↳ Reads your Jyotish birth chart + current Dasha — same data as your main Nadi Scanner. Tap Re-Scan to refresh your live planetary field prescription.
        </div>
      </div>

      <button className="cta-gold" style={{ marginTop: 16 }} onClick={rescan}>
        ⟳ &nbsp;&nbsp;Re-Scan My Field
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MUSIC TRACK ROW COMPONENT
───────────────────────────────────────────────────────────────── */
interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  cover_image_url?: string | null;
  preview_url?: string | null;
  full_audio_url?: string | null;
  genre?: string | null;
  hz_frequency?: number | null;
  tier_required?: string | null;
  category?: string | null;
  duration_seconds?: number | null;
  shc_reward?: number | null;
}

const TIER_RANK: Record<string, number> = { free: 0, prana_flow: 1, siddha_quantum: 2, akasha_infinity: 3 };

const MusicTrackRow: React.FC<{
  track: MusicTrack;
  isActive: boolean;
  isPlaying: boolean;
  progress: number;
  hasAccess: boolean;
  onPlay: (track: MusicTrack) => void;
  onLock: (track: MusicTrack) => void;
}> = ({ track, isActive, isPlaying, progress, hasAccess, onPlay, onLock }) => {
  const tier = track.tier_required || 'free';
  const locked = !hasAccess && tier !== 'free';
  const live = isActive && isPlaying;
  const hz = track.hz_frequency;
  const hzLabel = hz
    ? `${hz} Hz · ${hz === 432 ? 'Cosmic Attunement' : hz === 528 ? 'DNA Repair' : hz === 639 ? 'Heart Coherence' : hz === 963 ? 'God Frequency' : hz === 741 ? 'Expression' : hz === 396 ? 'Liberation' : hz === 285 ? 'Energy Fields' : hz === 174 ? 'Foundation' : 'Sacred Frequency'}`
    : 'Sacred Frequency';

  return (
    <div
      className={`track-row${live ? ' sqi-active' : ''}`}
      style={!live ? { border: isActive ? '1px solid rgba(212,175,55,.3)' : '1px solid transparent', background: isActive ? 'rgba(212,175,55,.04)' : undefined } : undefined}
      onClick={() => locked ? onLock(track) : onPlay(track)}
    >
      {/* Cover art */}
      <div className="cover-wrap">
        <div className="cover-inner">
          {track.cover_image_url
            ? <img src={track.cover_image_url} alt={track.title} onLoad={e => (e.currentTarget as HTMLImageElement).classList.add('loaded')} />
            : <div style={{ fontSize: 22, background: 'linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.05))', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♪</div>
          }
        </div>
        <div className="cover-aura" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="track-title">{track.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
          {track.artist || 'Kritagya Das'}
        </div>
        {hz && <div className="track-hz">{hzLabel}</div>}
        <div className="progress-track">
          <div className="progress-fill" style={live ? { width: `${progress * 100}%` } : { width: 0 }} />
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {locked ? (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={13} style={{ color: 'rgba(255,255,255,.3)' }} />
            </div>
            <span className={tier === 'siddha_quantum' ? 'badge-siddha' : 'badge-prana'}>
              {tier === 'siddha_quantum' ? 'SIDDHA' : 'PRANA'}
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
              ? <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                  {[5, 12, 7, 13, 4].map((h, i) => (
                    <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: '#D4AF37', display: 'block', animation: `wave .7s ease-in-out ${i * 0.1}s infinite` }} />
                  ))}
                </div>
              : <span className={tier === 'free' ? 'badge-free' : 'badge-prana'}>
                  {tier === 'free' ? 'FREE' : 'PRANA'}
                </span>
            }
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SNIPPET ENDED MODAL
───────────────────────────────────────────────────────────────── */
const SnippetModal: React.FC<{
  track: MusicTrack | null;
  onClose: () => void;
  onUpgrade: () => void;
}> = ({ track, onClose, onUpgrade }) => {
  if (!track) return null;
  return (
    <div className="snip-modal-overlay" onClick={onClose}>
      <div className="snip-modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔓</div>
        <div className="snip-modal-title">Unlock Full Access</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.65, marginBottom: 22 }}>
          Your 30-second snippet of <strong style={{ color: '#D4AF37' }}>{track.title}</strong> has ended.<br /><br />
          Activate <strong style={{ color: '#D4AF37' }}>Prana-Flow</strong> to stream every track in full — unlimited, forever.
        </p>
        <button className="cta-gold" style={{ maxWidth: 340, margin: '0 auto', display: 'block' }} onClick={onUpgrade}>
          Activate Prana-Flow · €19/mo
        </button>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', marginTop: 14, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '.08em' }} onClick={onClose}>
          Continue with free access
        </div>
      </div>
    </div>
  );
};

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
  const { playUniversalAudio, currentAudio, isPlaying, togglePlay, progress: playerProgress } = useMusicPlayer();
  const { playlists: curatedPlaylists, getPlaylistItems } = useCuratedPlaylists('music');

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [snippetEndedTrack, setSnippetEndedTrack] = useState<MusicTrack | null>(null);
  const snippetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upgradeLockedRef = useRef(false);

  // ── Stripe success toasts (ALL PRESERVED) ──
  useEffect(() => {
    const success = searchParams.get('success');
    const membershipSuccess = searchParams.get('membership_success');
    const cancelled = searchParams.get('cancelled');
    if (success === 'true') toast.success(t('music.paymentSuccess', 'Payment successful!'));
    else if (membershipSuccess === 'true') toast.success(t('music.membershipSuccess', 'Welcome to Prana-Flow!'));
    else if (cancelled === 'true') toast.info(t('music.paymentCancelled', 'Payment cancelled.'));
  }, [searchParams, t]);

  // ── Fetch tracks via curated playlists (real hook) ──
  useEffect(() => {
    fetchAllTracks();
  }, []);

  const fetchAllTracks = async () => {
    setLoading(true);
    try {
      // Fetch from music_tracks table directly
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, cover_image_url, preview_url, full_audio_url, genre, tier_required, category, duration_seconds, shc_reward')
        .order('created_at', { ascending: false });
      if (data && !error) setTracks(data as unknown as MusicTrack[]);
    } catch (e) {
      console.error('Failed to fetch tracks', e);
    }
    setLoading(false);
  };

  // Access check — exact pattern from Meditations.tsx
  const legacyTier = ((user as { subscription_tier?: string } | null)?.subscription_tier ?? membershipTier ?? 'free')
    .toString().toLowerCase();
  const tierSlugUnlocks = ['prana_flow', 'soma', 'brahman', 'admin', 'lifetime', 'akasha-infinity', 'siddha-quantum'].includes(legacyTier) || legacyTier.includes('premium');
  const hasMusicAccess = !!user && (isAdmin || adminGranted || isPremium || tierSlugUnlocks);

  // Filtered tracks
  const filtered = filter === 'all' ? tracks : tracks.filter(t => {
    const cat = (t.category || t.genre || '').toLowerCase();
    return cat.includes(filter) || (filter === 'beats' && cat.includes('beat')) || (filter === 'meditation' && cat.includes('medit'));
  });

  // ── Play handler ──
  const handlePlay = useCallback((track: MusicTrack) => {
    // Full access users get full_audio_url; free users get preview_url (30s snippet)
    const audioSrc = hasMusicAccess ? (track.full_audio_url || track.preview_url) : track.preview_url;
    if (!audioSrc) return;
    if (snippetTimerRef.current) { clearTimeout(snippetTimerRef.current); snippetTimerRef.current = null; }
    playUniversalAudio({
      id: track.id,
      title: track.title,
      audio_url: audioSrc,
      artist: track.artist || 'Kritagya Das',
      cover_image_url: track.cover_image_url || null,
      duration_seconds: track.duration_seconds || 0,
      shc_reward: track.shc_reward || 0,
      contentType: 'music',
    });
    // 30-second snippet for free users
    if (!hasMusicAccess) {
      snippetTimerRef.current = setTimeout(() => {
        setSnippetEndedTrack(track);
      }, 30000);
    }
  }, [playUniversalAudio, hasMusicAccess]);

  // ── Lock handler → upgrade ──
  const handleLock = useCallback(async (track: MusicTrack) => {
    if (!user) { navigate('/auth'); return; }
    setSnippetEndedTrack(track);
  }, [user, navigate]);

  // ── Upgrade (Stripe — PRESERVED) ──
  const handleUpgrade = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    if (upgradeLockedRef.current) return;
    upgradeLockedRef.current = true;
    try {
      await startPranaMonthlyCheckout({
        successPath: '/music?membership_success=true',
        sourcePage: 'music-prana-upgrade',
      });
    } catch (e) {
      upgradeLockedRef.current = false;
      toast.error(e instanceof Error ? e.message : 'Checkout failed. Please try again.');
    }
  }, [user, navigate]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="sqi-music-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: SQI_STYLES }} />
        <Loader2 size={28} style={{ color: '#22D3EE', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <div className="sqi-micro">Loading Sacred Sound Portal…</div>
      </div>
    );
  }

  return (
    <div className="sqi-music-page">
      <style dangerouslySetInnerHTML={{ __html: SQI_STYLES }} />
      <StarfieldCanvas />

      <div className="sqi-music-content">

        {/* ══ HERO ══ */}
        <div className="sqi-hero" style={{ position: 'relative' }}>
          {/* Floating orbs */}
          <div className="sqi-orb" style={{ width: 200, height: 200, top: -60, right: -60, '--dur': '12s', '--dl': '0s' } as React.CSSProperties} />
          <div className="sqi-orb" style={{ width: 100, height: 100, top: '60%', left: -30, '--dur': '8s', '--dl': '-3s' } as React.CSSProperties} />

          {/* Back button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          <div className="sqi-micro">Nada Brahma · Sound is the Universe</div>
          <h1 className="sqi-shimmer-title">Sacred Sound Portal</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', marginTop: 8, lineHeight: 1.6 }}>
            Every frequency is a doorway. Every sound a Prema-Pulse Transmission.
          </p>
        </div>

        {/* ══ FILTER PILLS ══ */}
        <div className="pill-row">
          {[
            { key: 'all', label: 'All Frequencies' },
            { key: 'beats', label: 'Healing Beats' },
            { key: 'meditation', label: 'Meditations' },
            { key: 'mantra', label: 'Mantras' },
            { key: 'music', label: 'Sacred Music' },
          ].map(p => (
            <button key={p.key} className={`pill${filter === p.key ? ' on' : ''}`} onClick={() => setFilter(p.key)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ══ NADI SCANNER ══ */}
        <div className="sec-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'nadiPulse 3s ease-in-out infinite' }} />
            <div>
              <div className="sqi-micro" style={{ marginBottom: 2 }}>Jyotish-Aligned</div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Nadi Scanner · Frequency Prescription</div>
            </div>
          </div>
        </div>

        <NadiScanner
          jyotishMahadasha={jyotish?.mahadasha}
          jyotishRaga={jyotish?.meditationType}
        />

        {/* ══ TRACK LIST ══ */}
        <div className="sec-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'nadiPulse 3s ease-in-out infinite' }} />
            <div>
              <div className="sqi-micro" style={{ marginBottom: 2 }}>Prema-Pulse Transmissions</div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Sacred Transmissions</div>
            </div>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 30, padding: '4px 12px' }}>
            {hasMusicAccess ? 'FULL ACCESS' : 'FREE · 30s SNIPPETS'}
          </span>
        </div>

        <div className="glass-card" style={{ overflow: 'visible', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div className="sqi-micro" style={{ textAlign: 'center' }}>No transmissions found in this category</div>
            </div>
          ) : filtered.map((track, i) => (
            <React.Fragment key={track.id}>
              <MusicTrackRow
                track={track}
                isActive={currentAudio?.id === track.id}
                isPlaying={isPlaying}
                progress={playerProgress ?? 0}
                hasAccess={hasMusicAccess}
                onPlay={handlePlay}
                onLock={handleLock}
              />
              {i < filtered.length - 1 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,.03)', margin: '0 16px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ══ CURATED PLAYLISTS ══ */}
        {curatedPlaylists.length > 0 && (
          <>
            <div className="sec-hd" style={{ paddingTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'nadiPulse 3s ease-in-out infinite' }} />
                <div>
                  <div className="sqi-micro" style={{ marginBottom: 2 }}>Akasha-Neural Collections</div>
                  <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Curated Playlists</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {curatedPlaylists.map(pl => (
                <CuratedPlaylistCard key={pl.id} playlist={pl} onClick={() => {}} />
              ))}
            </div>
          </>
        )}

        <div className="akasha-divider" style={{ margin: '28px 0 8px' }} />

        {/* ══ UPGRADE SECTION ══ */}
        <div className="sec-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'nadiPulse 3s ease-in-out infinite' }} />
            <div>
              <div className="sqi-micro" style={{ marginBottom: 2 }}>Akasha-Infinity Architecture</div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', color: 'rgba(255,255,255,.9)' }}>Unlock Your Frequency</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* FREE */}
          <div className="up-card up-free">
            <div className="up-tier">Free · Seeker</div>
            <div className="up-name">Taste the Field</div>
            <div className="up-price">€0 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ forever</span></div>
            <ul className="up-feats">
              <li>30-second snippets of every track</li>
              <li>Nadi Scanner — 1 scan per day</li>
              <li>Cosmic Sound Prescription</li>
              <li className="dim">Full streaming (Prana-Flow+)</li>
              <li className="dim">Downloads (Siddha-Quantum+)</li>
            </ul>
            <button className="cta-outline">Explore Free Access</button>
          </div>

          {/* PRANA-FLOW */}
          <div className="up-card up-prana">
            <div className="up-tier">Prana-Flow</div>
            <div className="up-name">Practitioner</div>
            <div className="up-price">€19 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span></div>
            <ul className="up-feats">
              <li>Full streaming — all tracks unlimited</li>
              <li>Nadi Scanner — unlimited scans</li>
              <li>Jyotish frequency prescription (full)</li>
              <li>33 SHC coins per track streamed</li>
              <li>Healing Beats + Meditations complete</li>
              <li className="dim">Downloads (Siddha-Quantum+)</li>
            </ul>
            <button className="cta-gold" onClick={handleUpgrade}>Activate Prana-Flow · €19/mo</button>
          </div>

          {/* SIDDHA-QUANTUM */}
          <div className="up-card up-siddha">
            <div className="up-tier">Siddha-Quantum</div>
            <div className="up-name">Siddha</div>
            <div className="up-price">€45 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ month</span></div>
            <ul className="up-feats">
              <li>Everything in Prana-Flow</li>
              <li>Full downloads — all audio formats</li>
              <li>Custom mantra creation with Kritagya</li>
              <li>Custom healing beat production request</li>
              <li>Full Sacred Music library</li>
              <li>Early access to all new releases</li>
            </ul>
            <button className="cta-gold">Activate Siddha-Quantum · €45/mo</button>
          </div>

          {/* AKASHA-INFINITY */}
          <div className="up-card up-akasha">
            <div className="up-tier c">Akasha-Infinity · Eternal</div>
            <div className="up-name">Akasha Master</div>
            <div className="up-price" style={{ background: 'linear-gradient(90deg,#D4AF37,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              €1111 <span style={{ fontSize: 13, fontWeight: 500, WebkitTextFillColor: 'var(--text-muted)' }}>/ lifetime</span>
            </div>
            <ul className="up-feats">
              <li>Everything — unlocked eternally</li>
              <li>Lifetime download vault — all future releases</li>
              <li>Custom mantra + healing beat creation</li>
              <li>Dedicated Akasha community channel</li>
              <li>Zero cost on all future releases forever</li>
            </ul>
            <button className="cta-akasha">Activate Akasha-Infinity · €1111</button>
          </div>

        </div>

      </div>{/* /sqi-music-content */}

      {/* ══ NOW PLAYING BAR (exact from Meditations.tsx) ══ */}
      {currentAudio && currentAudio.contentType === 'music' && (
        <div className={`now-playing-bar${isPlaying ? ' np-live' : ''}`}>
          <button
            className={`np-play-icon${isPlaying ? ' np-pulse' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={`np-title-bar${isPlaying ? ' np-cinzel-gold' : ''}`}>
              {currentAudio.title}
            </div>
            <div className="np-bar-track">
              <div className="np-bar-fill" style={{ width: `${(playerProgress ?? 0) * 100}%` }} />
            </div>
          </div>
          <Sparkles size={14} className="nadi-pulse" />
        </div>
      )}

      {/* ══ SNIPPET END MODAL ══ */}
      {snippetEndedTrack && (
        <SnippetModal
          track={snippetEndedTrack}
          onClose={() => setSnippetEndedTrack(null)}
          onUpgrade={() => { setSnippetEndedTrack(null); handleUpgrade(); }}
        />
      )}

    </div>
  );
};

export default Music;
