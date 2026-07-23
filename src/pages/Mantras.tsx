/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SIDDHA-QUANTUM INTELLIGENCE — MANTRAS PAGE  SQI-2050 v8.0      ║
 * ║  Bhakti-Algorithm v8.0 | Vedic Light-Codes | Anahata: OPEN      ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  NEW in v8.0:                                                    ║
 * ║  • Tier category sections (Free / Prana-Flow / Siddha / Akasha) ║
 * ║  • Compact single-line Hora strip (no more full card)            ║
 * ║  • CSS grid mantra cards (2-4 col responsive)                    ║
 * ║  • Inline compact player (ring + START side-by-side)             ║
 * ║  • Scalar wave rings animate from ring when playing              ║
 * ║  • Fixed-position Sri Yantra background (2% opacity)             ║
 * ║  • Prema-Pulse pulsing divider bar                               ║
 * ║  • Play Guidance bar above the fold                              ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  ✅ ALL functional logic preserved (Bhrigu, Hora, 108 audio,     ║
 * ║     Jyotish, SHC awards) — zero runtime logic changes            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { safePlay } from '@/utils/safeAudioPlay';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getTierRank } from '@/lib/tierAccess';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Lock,
  Orbit,
  Sun,
  Infinity,
  Coins,
  Leaf,
  Wind,
  Shield,
  Gem,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getMantras, type MantraItem, MANTRA_REPETITIONS
} from '@/features/mantras/getMantras';
import { useJyotishMantraRecommendation } from '@/hooks/useJyotishMantraRecommendation';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useBhriguPlanet } from '@/hooks/useBhriguPlanet';
import {
  normalizePlanetName, mantraMatchesPlanet,
  getPlanetOfDay, getDailyMantraFromChart, type Planet
} from '@/lib/jyotishMantraLogic';
import { getPlanetEmoji } from '@/lib/vedicTypes';
import { audioEngine } from '@/lib/audioEngine';
import { getPalmScanResult } from '@/lib/palmScanStore';
import BhriguCard from '@/components/BhriguCard';
import { startPranaMonthlyCheckout } from '@/features/membership/startPranaMonthlyCheckout';

/* ─────────────────────────────────────────────────────
   INLINE SQI-2050 STYLES v8.0
───────────────────────────────────────────────────── */
const SQI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

  :root {
    --gold:    #D4AF37;
    --gold2:   #F5E17A;
    --gold-dim: rgba(212,175,55,0.12);
    --black:   #050505;
    --glass:   rgba(255,255,255,0.02);
    --border:  rgba(255,255,255,0.05);
    --muted:   rgba(255,255,255,0.6);
    --cyan:    #22D3EE;
    --r40:     40px;
    --page-pad: clamp(12px, 4.6vw, 22px);
  }

  @media (prefers-reduced-motion: reduce) {
    .sqi-mantras *, .sqi-mantras *::before, .sqi-mantras *::after {
      animation: none !important;
      transition: none !important;
    }
  }

  .sqi-mantras {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--black);
    min-height: 100vh;
    color: rgba(255,255,255,0.9);
    overflow-x: hidden;
    position: relative;
  }

  /* ── Sri Yantra background ── */
  .sqi-yantra-bg {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: min(600px, 95vw);
    height: min(600px, 95vw);
    opacity: 0.022;
    pointer-events: none;
    z-index: 0;
  }
  .sqi-content { position: relative; z-index: 1; }

  .m-glass {
    background: var(--glass);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--r40);
  }
  .m-glass:hover { border-color: rgba(212,175,55,0.12); }

  @keyframes mShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .m-shimmer {
    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 45%, #D4AF37 65%, #A07C10 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: mShimmer 5s linear infinite;
  }

  @keyframes nadiPulse {
    0%,100% { filter: drop-shadow(0 0 2px rgba(212,175,55,0)); }
    50%      { filter: drop-shadow(0 0 10px rgba(212,175,55,.7)); }
  }
  .nadi { animation: nadiPulse 3s ease-in-out infinite; color: var(--gold); }

  .m-hero {
    position: relative;
    padding: 52px var(--page-pad) 24px;
    overflow: hidden;
  }
  .m-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(212,175,55,.09) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 90% 110%, rgba(34,211,238,.04) 0%, transparent 60%);
    pointer-events: none;
  }
  @keyframes orbFloat {
    0%,100% { transform: translateY(0)   rotate(0deg);   opacity: .25; }
    50%      { transform: translateY(-16px) rotate(180deg); opacity: .55; }
  }
  .m-orb {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,.2), transparent 70%);
    pointer-events: none;
    animation: orbFloat var(--dur,9s) ease-in-out infinite;
    animation-delay: var(--dl,0s);
  }
  .m-hero-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(22px, 5.5vw, 32px);
    font-weight: 600;
    letter-spacing: .05em;
    line-height: 1.1;
    margin-bottom: 6px;
  }

  /* ── Compact Hora strip ── */
  .m-hora-strip {
    margin: 0 var(--page-pad) 8px;
    display: flex; align-items: center;
    gap: 8px; flex-wrap: wrap;
    background: rgba(255,255,255,.02);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 100px;
    padding: 10px 16px;
    font-size: 12.5px;
  }
  .m-hora-strip-planet {
    font-size: 12px; font-weight: 900; color: var(--gold);
    letter-spacing: -.01em;
  }
  .m-hora-strip-time {
    color: rgba(255,255,255,.65);
    font-size: 12px;
  }
  .m-glossary-hint {
    margin: 6px var(--page-pad) 16px;
    padding: 0 4px;
    font-size: 12px; color: rgba(255,255,255,.48); line-height: 1.5; font-style: italic;
  }
  .m-hora-strip-timer {
    font-variant-numeric: tabular-nums;
    font-weight: 900; font-size: 12px; color: var(--gold);
    letter-spacing: -.02em; margin-left: auto;
  }
  .m-hora-remedy-btn {
    background: linear-gradient(135deg,rgba(212,175,55,.15),rgba(212,175,55,.05));
    border: 1px solid rgba(212,175,55,.3);
    border-radius: 100px; padding: 4px 12px;
    font-size: 10px; font-weight: 800; letter-spacing: .06em;
    text-transform: uppercase; color: var(--gold);
    cursor: pointer; font-family: inherit;
    white-space: nowrap;
    transition: all .2s;
  }
  .m-hora-remedy-btn:hover { background: rgba(212,175,55,.2); }

  /* ── Play guidance bar ── */
  @keyframes premaPulse {
    0%,100% { opacity: .7; box-shadow: 0 0 16px rgba(212,175,55,.18); }
    50%      { opacity: 1;  box-shadow: 0 0 32px rgba(212,175,55,.42); }
  }
  .m-play-guidance {
    margin: 0 var(--page-pad) 20px;
    padding: 11px 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.07), rgba(212,175,55,.02));
    border: 1px solid rgba(212,175,55,.22);
    border-radius: 100px;
    display: flex; align-items: center; gap: 10px;
    animation: premaPulse 2.6s ease-in-out infinite;
    cursor: pointer;
  }
  .m-play-guidance-text {
    font-size: 10px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: var(--gold);
    flex: 1;
  }

  /* ── Bhrigu card wrapper ── */
  .m-bhrigu {
    margin: 0 var(--page-pad) 16px;
    background: linear-gradient(135deg, rgba(212,175,55,.05), rgba(139,92,246,.04));
    border: 1px solid rgba(212,175,55,.12);
    border-radius: var(--r40);
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
  }
  .m-bhrigu::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 40% at 80% 50%, rgba(212,175,55,.05), transparent 70%);
  }

  /* ── Category accordions (match Meditations MeditationSectionSQI) ── */
  .m-cat-card {
    background: var(--glass);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--r40);
    margin: 0 var(--page-pad) 12px;
    overflow: visible;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .m-cat-card:hover { border-color: rgba(212,175,55,0.15); }
  .m-cat-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px;
    cursor: pointer;
    border-radius: var(--r40);
    transition: background .2s;
  }
  .m-cat-header:hover { background: rgba(255,255,255,.02); }
  .m-cat-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
  }
  .m-cat-siddha-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(212, 175, 55, 0.06);
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 24px rgba(212, 175, 55, 0.08);
  }
  .m-cat-micro {
    font-size: 8px; font-weight: 800; letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,.45);
    margin-bottom: 4px;
  }
  .m-cat-title {
    font-weight: 800; font-size: 15px; letter-spacing: -0.01em;
    color: rgba(255,255,255,0.9);
  }
  .m-cat-sub {
    font-size: 12.5px; color: rgba(255,255,255,0.48); margin-top: 2px;
  }
  .m-cat-chevron {
    width: 24px; height: 24px;
    border: 1px solid var(--border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    font-size: 12px;
    transition: transform .3s ease, border-color .3s, color .3s;
    flex-shrink: 0;
  }
  .m-cat-chevron.open {
    transform: rotate(180deg);
    border-color: rgba(212,175,55,.3);
    color: var(--gold);
  }
  .m-cat-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent);
    margin: 4px 0 12px;
  }
  .m-cat-grid-wrap { padding: 0 20px 12px; }

  /* ── Mantra grid ── */
  .m-mantra-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }
  @media (min-width: 480px) {
    .m-mantra-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  }

  /* ── Mantra card ── */
  .m-card {
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 14px 13px 12px;
    cursor: pointer;
    transition: all .22s ease;
    position: relative;
    overflow: hidden;
    text-align: left;
    font-family: inherit;
    display: flex; flex-direction: column; gap: 7px;
  }
  .m-card:hover { border-color: rgba(212,175,55,.18); }
  .m-card.m-card-selected {
    border-color: rgba(212,175,55,.45);
    background: linear-gradient(135deg, rgba(212,175,55,.09), rgba(212,175,55,.02));
    box-shadow: 0 0 24px rgba(212,175,55,.1);
  }
  .m-card.m-card-locked {
    opacity: .72;
  }
  @keyframes goldPulse {
    0%, 100% {
      border-color: rgba(212,175,55,.45);
      box-shadow: inset 0 0 24px rgba(212,175,55,.08), 0 0 22px rgba(212,175,55,.2);
    }
    50% {
      border-color: rgba(212,175,55,.85);
      box-shadow: inset 0 0 36px rgba(212,175,55,.14), 0 0 40px rgba(212,175,55,.42);
    }
  }
  .m-card.m-card-aura {
    animation: goldPulse 2.6s ease-in-out infinite;
    border-color: rgba(212,175,55,.55);
    background: linear-gradient(135deg, rgba(212,175,55,.14), rgba(255,230,120,.06) 50%, rgba(212,175,55,.05));
  }

  /* premium indicator dot (for unlocked premium cards) */
  .m-card-premium-dot {
    position: absolute; top: 8px; right: 8px;
    width: 7px; height: 7px; border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 6px rgba(212,175,55,.7);
  }

  /* locked card overlay — blurs content, shows upgrade CTA */
  .m-card-lock-overlay {
    position: absolute; inset: 0;
    background: rgba(5,5,5,.72);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    border-radius: 22px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 6px; padding: 10px;
    text-align: center;
  }
  .m-card-lock-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(212,175,55,.12);
    border: 1px solid rgba(212,175,55,.3);
    display: flex; align-items: center; justify-content: center;
    color: #D4AF37;
  }
  .m-card-lock-label {
    font-size: 8px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: #D4AF37;
    line-height: 1.3;
  }
  @keyframes lockPulse {
    0%,100% { box-shadow: 0 0 16px rgba(212,175,55,.15); border-color: rgba(212,175,55,.25); }
    50%      { box-shadow: 0 0 28px rgba(212,175,55,.35); border-color: rgba(212,175,55,.5); }
  }
  .m-card.m-card-locked {
    animation: lockPulse 3s ease-in-out infinite;
  }

  .m-card-planet-icon {
    width: 36px; height: 36px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .m-card-planet-glyph {
    font-size: 17px;
    font-weight: 650;
    line-height: 1;
  }
  .m-card-title {
    font-size: 12px; font-weight: 700; letter-spacing: -.01em;
    line-height: 1.3; color: rgba(255,255,255,.88);
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .m-card-meta {
    display: flex; gap: 5px; align-items: center; flex-wrap: wrap;
  }
  .m-pill {
    font-size: 8.5px; font-weight: 800; letter-spacing: .07em;
    text-transform: uppercase; padding: 2px 7px;
    border-radius: 100px;
  }
  .m-lock-overlay {
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.4);
  }

  /* ── Prema-Pulse divider ── */
  @keyframes premaDivide {
    0%   { background-position: -200% center; opacity: .6; }
    50%  { opacity: 1; }
    100% { background-position:  200% center; opacity: .6; }
  }
  .m-prema-divider {
    margin: 6px var(--page-pad) 24px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.08), rgba(212,175,55,.6), rgba(245,225,122,.9), rgba(212,175,55,.6), rgba(212,175,55,.08), transparent);
    background-size: 200% auto;
    animation: premaDivide 4s linear infinite;
    border-radius: 2px;
  }

  /* ── Inline Player ── */
  .m-player-wrap {
    margin: 0 var(--page-pad) 16px;
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: var(--r40);
    overflow: hidden;
  }
  .m-player-banner {
    position: relative;
    padding: 22px var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.06), rgba(180,120,20,.03));
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    text-align: center;
  }
  .m-player-banner::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,.07), transparent 70%);
  }
  .m-mantra-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(15px, 3.5vw, 20px);
    font-weight: 600;
    letter-spacing: .04em;
    margin-bottom: 10px;
    overflow-wrap: anywhere;
  }
  .m-tag {
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; padding: 5px 12px;
    border-radius: 100px;
  }

  /* ── Compact ring + controls row ── */
  .m-controls-row {
    padding: 18px var(--page-pad) 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .m-ring-wrap {
    position: relative; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .m-counter-ring { transform: rotate(-90deg); }
  .m-counter-track { fill: none; stroke: rgba(255,255,255,.06); stroke-width: 3; }
  .m-counter-fill {
    fill: none; stroke-width: 3; stroke-linecap: round;
    stroke: url(#goldGradMantra);
    filter: drop-shadow(0 0 6px rgba(212,175,55,.45));
    transition: stroke-dashoffset .35s ease;
  }

  /* scalar wave rings */
  @keyframes scalarWave {
    0%   { transform: translate(-50%,-50%) scale(.7); opacity: .7; }
    100% { transform: translate(-50%,-50%) scale(1.9); opacity: 0; }
  }
  .m-scalar-ring {
    position: absolute; left: 50%; top: 50%;
    width: 100px; height: 100px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,.5);
    animation: scalarWave 2s ease-out infinite;
    pointer-events: none;
  }
  .m-scalar-ring:nth-child(2) { animation-delay: .65s; }
  .m-scalar-ring:nth-child(3) { animation-delay: 1.3s; }

  .m-btn-start {
    flex: 1; min-width: 0;
    padding: 14px 10px;
    border-radius: 100px;
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    color: #050505; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
    border: none; cursor: pointer; font-family: inherit;
    box-shadow: 0 0 24px rgba(212,175,55,.4);
    transition: all .25s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .m-btn-start:hover { box-shadow: 0 0 40px rgba(212,175,55,.6); transform: scale(1.02); }
  @keyframes mantraStartPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,.55), 0 0 40px rgba(245,225,122,.12); transform: scale(1); }
    50% { box-shadow: 0 0 36px rgba(212,175,55,.9), 0 0 56px rgba(212,175,55,.25); transform: scale(1.02); }
  }
  .m-btn-start.m-paused {
    background: linear-gradient(145deg, #F5E17A, #D4AF37, #9A720E);
    animation: mantraStartPulse 2s ease-in-out infinite;
  }
  .m-btn-reset {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--glass); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); font-size: 15px;
    transition: all .2s; font-family: inherit; flex-shrink: 0;
  }
  .m-btn-reset:hover { border-color: rgba(212,175,55,.25); color: var(--gold); }

  .m-micro {
    font-size: 8px; font-weight: 800; letter-spacing: .5em;
    text-transform: uppercase; color: rgba(212,175,55,.45);
  }
  .m-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.08), transparent);
    margin: 8px 0;
  }
  .m-instructions {
    margin: 0 var(--page-pad) 12px;
    background: rgba(255,255,255,.012);
    border: 1px solid rgba(255,255,255,.04);
    border-radius: 20px; padding: 14px 16px;
  }

  /* ── Player, now the hero focal point ── */
  .m-player-top {
    margin-top: 0;
    box-shadow: 0 0 60px rgba(212,175,55,.08), inset 0 1px 0 rgba(255,255,255,.04);
    border-color: rgba(212,175,55,.22);
  }
  .m-player-eyebrow {
    font-size: 8.5px; font-weight: 800; letter-spacing: .35em; text-transform: uppercase;
    color: rgba(212,175,55,.5); margin-bottom: 8px;
  }
  .m-resume-chip {
    margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;
    background: rgba(212,175,55,.09); border: 1px solid rgba(212,175,55,.28);
    color: #D4AF37; font-size: 10px; font-weight: 800; letter-spacing: .04em;
    padding: 7px 14px; border-radius: 100px; cursor: pointer; font-family: inherit;
  }
  .m-scrub-track {
    margin: 0 var(--page-pad) 16px; height: 3px; border-radius: 3px;
    background: rgba(255,255,255,.06); overflow: hidden;
  }
  .m-scrub-fill {
    height: 100%; background: linear-gradient(90deg, #D4AF37, #F5E17A);
    box-shadow: 0 0 8px rgba(212,175,55,.5); transition: width .3s linear;
  }

  /* ── Tier-aware upgrade banner ── */
  .m-upgrade-banner {
    margin: 0 var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(212,175,55,.09), rgba(212,175,55,.02));
    border: 1px solid rgba(212,175,55,.25);
    border-radius: 28px; padding: 15px 17px;
    display: flex; align-items: center; gap: 13px; cursor: pointer;
  }
  .m-upgrade-icon {
    width: 38px; height: 38px; border-radius: 13px; flex-shrink: 0;
    background: rgba(212,175,55,.1); border: 1px solid rgba(212,175,55,.3);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .m-upgrade-title { font-size: 12px; font-weight: 800; color: rgba(255,255,255,.92); margin-bottom: 2px; }
  .m-upgrade-sub { font-size: 10.5px; color: rgba(255,255,255,.42); line-height: 1.4; }
  .m-upgrade-cta {
    font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #050505;
    background: linear-gradient(135deg,#F5E17A,#D4AF37); padding: 9px 14px; border-radius: 100px;
    white-space: nowrap; flex-shrink: 0;
  }

  /* ── Filter chips ── */
  .m-filter-row { margin: 0 var(--page-pad) 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .m-filter-chip {
    font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
    background: var(--glass); border: 1px solid var(--border); color: rgba(255,255,255,.5);
    padding: 7px 14px; border-radius: 100px; cursor: pointer; font-family: inherit;
    transition: all .2s;
  }
  .m-filter-chip.active {
    background: rgba(212,175,55,.12); border-color: rgba(212,175,55,.4); color: #D4AF37;
  }

  /* ── Category glow + count ── */
  .m-cat-glow { border-color: rgba(212,175,55,.35); box-shadow: 0 0 40px rgba(212,175,55,.07), inset 0 1px 0 rgba(255,255,255,.03); }
  .m-cat-count {
    font-size: 9.5px; font-weight: 800; color: rgba(212,175,55,.6);
    background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.2);
    padding: 4px 10px; border-radius: 100px; flex-shrink: 0; margin-left: 6px;
  }

  /* ── Playlist rows (replaces button grid) ── */
  .m-playlist { display: flex; flex-direction: column; gap: 4px; padding: 4px 8px 8px; }
  .m-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 10px; border-radius: 18px; border: 1px solid transparent;
    background: none; cursor: pointer; text-align: left; font-family: inherit;
    transition: background .2s, border-color .2s; width: 100%;
  }
  .m-row:hover { background: rgba(255,255,255,.02); }
  .m-row-active { background: linear-gradient(135deg, rgba(212,175,55,.1), rgba(212,175,55,.02)); border-color: rgba(212,175,55,.32); }
  .m-row-aura:not(.m-row-active) { border-color: rgba(212,175,55,.22); animation: goldPulse 2.6s ease-in-out infinite; }
  .m-row-locked { opacity: .6; }
  .m-row-play {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(212,175,55,.25); color: #D4AF37;
  }
  .m-row-active .m-row-play { background: linear-gradient(135deg,#F5E17A,#D4AF37); color: #050505; box-shadow: 0 0 16px rgba(212,175,55,.5); border-color: transparent; }
  .m-row-locked .m-row-play { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.08); color: rgba(255,255,255,.3); }
  .m-row-body { flex: 1; min-width: 0; }
  .m-row-title {
    font-size: 12.5px; font-weight: 700; letter-spacing: -.01em; color: rgba(255,255,255,.88);
    margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .m-row-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .m-row-dur { font-size: 9.5px; color: rgba(255,255,255,.3); flex-shrink: 0; }
  .m-row-lock-badge {
    font-size: 8px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #D4AF37;
    background: rgba(212,175,55,.08); border: 1px solid rgba(212,175,55,.25);
    padding: 5px 9px; border-radius: 100px; flex-shrink: 0; white-space: nowrap;
  }

  /* ── First-visit onboarding strip ── */
  .m-onboard {
    margin: 0 var(--page-pad) 18px;
    background: linear-gradient(135deg, rgba(34,211,238,.07), rgba(212,175,55,.04));
    border: 1px solid rgba(34,211,238,.25);
    border-radius: 24px; padding: 16px 18px;
    position: relative;
  }
  .m-onboard-close {
    position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.6);
    display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer;
  }
  .m-onboard-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: rgba(34,211,238,.85); margin-bottom: 8px; padding-right: 30px; }
  .m-onboard-body { font-size: 14px; color: rgba(255,255,255,.82); line-height: 1.6; padding-right: 20px; }

  /* ── Player plain-language explainer ── */
  .m-player-explainer { font-size: 12.5px; color: rgba(255,255,255,.55); line-height: 1.5; margin-bottom: 6px; }
`;

/* ─── planet helpers ─── */
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const HORA_SUCCESS_RATINGS: Record<string, number> = {
  Sun: 82, Moon: 78, Mars: 70, Mercury: 85, Jupiter: 92, Venus: 88, Saturn: 65, Rahu: 60, Ketu: 55,
};

const DASHA_MANTRA_DISPLAY: Record<string, string> = {
  Jupiter: 'Om Gurave Namaha', Rahu: 'Om Ram Rahave Namah', Venus: 'Om Shum Shukraya Namah',
  Sun: 'Om Hrim Suryaya Namah', Moon: 'Om Shrim Chandramase Namah', Mars: 'Om Krim Mangalaya Namah',
  Mercury: 'Om Budhaya Namah', Saturn: 'Om Sham Shanaye Namah', Ketu: 'Om Kem Ketave Namah',
};

function getSuccessPercent(planet?: string | null): number {
  if (!planet) return 75;
  return HORA_SUCCESS_RATINGS[planet] || 75;
}

function getPlayableUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  return url;
}

function getPrescribedMantraText(dashaPeriod: string | undefined | null): string | null {
  if (!dashaPeriod) return null;
  const planet = normalizePlanetName(dashaPeriod.split(' ')[0]);
  return planet ? (DASHA_MANTRA_DISPLAY[planet] || getDailyMantraFromChart(dashaPeriod)) : null;
}

function findHeartHealingMantra(mantras: MantraItem[]): MantraItem | undefined {
  return mantras.find((m) => /heart|anahata|432.*heart/i.test(m.title) || (m.description && /heart|anahata/i.test(m.description)));
}

const SINGLE_FILE_108_MIN_DURATION_SEC = 25;
function isSingleFile108Track(durationSec: number): boolean {
  return Number.isFinite(durationSec) && durationSec >= SINGLE_FILE_108_MIN_DURATION_SEC;
}

/* ─── Sri Yantra SVG background ─── */
const SriYantraBg = () => (
  <svg className="sqi-yantra-bg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* outer circles */}
    <circle cx="200" cy="200" r="195" stroke="#D4AF37" strokeWidth="1"/>
    <circle cx="200" cy="200" r="185" stroke="#D4AF37" strokeWidth="0.5"/>
    {/* 16-petal lotus */}
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (i * 22.5) * Math.PI / 180;
      const x = 200 + 155 * Math.cos(a);
      const y = 200 + 155 * Math.sin(a);
      return <ellipse key={i} cx={x} cy={y} rx="16" ry="28" fill="none" stroke="#D4AF37" strokeWidth="0.6" transform={`rotate(${i * 22.5}, ${x}, ${y})`}/>;
    })}
    {/* outer triangle pointing up */}
    <polygon points="200,30 370,320 30,320" stroke="#D4AF37" strokeWidth="1" fill="none"/>
    {/* outer triangle pointing down */}
    <polygon points="200,370 30,80 370,80" stroke="#D4AF37" strokeWidth="1" fill="none"/>
    {/* middle triangles up */}
    <polygon points="200,70 340,300 60,300" stroke="#D4AF37" strokeWidth="0.8" fill="none"/>
    <polygon points="200,330 60,100 340,100" stroke="#D4AF37" strokeWidth="0.8" fill="none"/>
    {/* inner triangles */}
    <polygon points="200,110 310,280 90,280" stroke="#D4AF37" strokeWidth="0.6" fill="none"/>
    <polygon points="200,290 90,120 310,120" stroke="#D4AF37" strokeWidth="0.6" fill="none"/>
    <polygon points="200,150 280,260 120,260" stroke="#D4AF37" strokeWidth="0.5" fill="none"/>
    <polygon points="200,250 120,140 280,140" stroke="#D4AF37" strokeWidth="0.5" fill="none"/>
    {/* central bindu */}
    <circle cx="200" cy="200" r="8" stroke="#D4AF37" strokeWidth="1"/>
    <circle cx="200" cy="200" r="2" fill="#D4AF37"/>
  </svg>
);

/* ─── Category helpers — maps to DB `category` column ─── */
type CatKey = 'planet' | 'deity' | 'intention' | 'karma' | 'wealth' | 'health' | 'peace' | 'protection' | 'spiritual' | 'general';

const CAT_META: Record<CatKey, { label: string; color: string; pillBg: string; pillColor: string; borderColor: string }> = {
  planet:     { label: 'Planetary Mantras',       color: '#D4AF37',             pillBg: 'rgba(212,175,55,.1)',   pillColor: '#D4AF37',            borderColor: 'rgba(212,175,55,.25)' },
  deity:      { label: 'Deity & Ishta Devata',    color: '#F5E17A',             pillBg: 'rgba(245,225,122,.1)', pillColor: '#F5E17A',            borderColor: 'rgba(245,225,122,.2)' },
  intention:  { label: 'Intention & Affirmation', color: 'rgba(34,211,238,.9)', pillBg: 'rgba(34,211,238,.08)', pillColor: 'rgba(34,211,238,.85)', borderColor: 'rgba(34,211,238,.2)' },
  karma:      { label: 'Karma & Deep Healing',    color: 'rgba(167,139,250,.9)',pillBg: 'rgba(167,139,250,.08)',pillColor: 'rgba(167,139,250,.85)',borderColor: 'rgba(167,139,250,.2)' },
  wealth:     { label: 'Wealth & Abundance',      color: '#F5E17A',             pillBg: 'rgba(245,225,122,.1)', pillColor: '#F5E17A',            borderColor: 'rgba(245,225,122,.22)' },
  health:     { label: 'Health & Vitality',       color: 'rgba(52,211,153,.9)', pillBg: 'rgba(52,211,153,.08)', pillColor: 'rgba(52,211,153,.85)', borderColor: 'rgba(52,211,153,.2)' },
  peace:      { label: 'Peace & Calm',            color: 'rgba(147,197,253,.9)',pillBg: 'rgba(147,197,253,.08)',pillColor: 'rgba(147,197,253,.85)',borderColor: 'rgba(147,197,253,.2)' },
  protection: { label: 'Protection & Power',    color: 'rgba(251,146,60,.9)', pillBg: 'rgba(251,146,60,.08)', pillColor: 'rgba(251,146,60,.85)', borderColor: 'rgba(251,146,60,.2)' },
  spiritual:  { label: 'Spiritual Growth',        color: '#D4AF37',             pillBg: 'rgba(212,175,55,.1)',  pillColor: '#D4AF37',             borderColor: 'rgba(212,175,55,.2)' },
  general:    { label: 'Sacred Mantras',          color: 'rgba(255,255,255,.6)',pillBg: 'rgba(255,255,255,.04)',pillColor: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.08)' },
};

/** Crisp vector icons per category (replaces soft emoji in cards / headers). */
const CAT_ICONS: Record<CatKey, LucideIcon> = {
  planet: Orbit,
  deity: Sun,
  intention: Sparkles,
  karma: Infinity,
  wealth: Coins,
  health: Leaf,
  peace: Wind,
  protection: Shield,
  spiritual: Gem,
  general: CircleDot,
};

const CAT_ORDER: CatKey[] = ['planet', 'deity', 'wealth', 'health', 'karma', 'intention', 'protection', 'peace', 'spiritual', 'general'];

function getMantraCategory(m: MantraItem): CatKey {
  const cat = (m.category as string | null | undefined)?.toLowerCase() ?? 'general';
  if (cat in CAT_META) return cat as CatKey;
  return 'general';
}

/* ─── Main component ─── */
const Mantras = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();

  const [mantras, setMantras] = useState<MantraItem[]>([]);
  const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);
  const [purchasedMantraIds, setPurchasedMantraIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userTimezone] = useState<string>('Europe/Stockholm');
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<CatKey>>(new Set());
  const [collapsedCatsInit, setCollapsedCatsInit] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [streakDirty, setStreakDirty] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'mine'>('all');
  const [scrubPct, setScrubPct] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState<{ id: string; count: number } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('sqi_mantras_onboarded')) setShowOnboarding(true);
    } catch { /* ignore */ }
  }, []);
  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('sqi_mantras_onboarded', '1'); } catch { /* ignore */ }
  };

  const playerRef = useRef<HTMLDivElement | null>(null);
  const currentMantraIdRef = useRef<string | null>(null);
  const mantraPlaybackCleanupRef = useRef<(() => void) | null>(null);
  const upgradeLockedRef = useRef(false);

  const clearMantraPlaybackListeners = () => {
    mantraPlaybackCleanupRef.current?.();
    mantraPlaybackCleanupRef.current = null;
  };

  const formatDurationMinutes = (minutes: number): string => {
    if (!Number.isFinite(minutes) || minutes <= 0) return '';
    const rounded = Math.round(minutes);
    return rounded === 1 ? t('mantras.durationMin') : t('mantras.durationMins', { count: rounded });
  };

  // Stripe success toasts (PRESERVED)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('membership_success') === 'true') {
      toast.success('Welcome to Prana-Flow! All mantras unlocked. 🕉');
      window.history.replaceState({}, '', '/mantras');
    }
  }, []);

  // Practice streak — consecutive days with at least one completion
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('mantra_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', since)
        .order('completed_at', { ascending: false });
      if (cancelled || !data) return;
      const days = new Set(data.map((r: any) => new Date(r.completed_at).toDateString()));
      let count = 0;
      const cursor = new Date();
      // allow today to be "not yet practiced" without breaking the streak
      if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
      while (days.has(cursor.toDateString())) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      setStreak(count);
    })();
    return () => { cancelled = true; };
  }, [user, streakDirty]);

  // Resume-in-progress — restore last unfinished count from this device
  useEffect(() => {
    if (!selectedMantraId) return;
    try {
      const raw = localStorage.getItem(`sqi_mantra_progress_${selectedMantraId}`);
      if (raw) {
        const saved = JSON.parse(raw) as { count: number; ts: number };
        if (saved.count > 0 && saved.count < reps && Date.now() - saved.ts < 6 * 60 * 60 * 1000) {
          setResumeAvailable({ id: selectedMantraId, count: saved.count });
          return;
        }
      }
    } catch { /* ignore */ }
    setResumeAvailable(null);
  }, [selectedMantraId]);

  // Persist in-progress count for resume
  useEffect(() => {
    if (!selectedMantraId) return;
    if (count > 0 && count < reps) {
      localStorage.setItem(`sqi_mantra_progress_${selectedMantraId}`, JSON.stringify({ count, ts: Date.now() }));
    } else if (count === 0 || count >= reps) {
      localStorage.removeItem(`sqi_mantra_progress_${selectedMantraId}`);
    }
  }, [count, selectedMantraId]);

  const reps = MANTRA_REPETITIONS;
  const currentMantra = selectedMantraId ? mantras.find((m) => m.id === selectedMantraId) : null;
  const mantraPlanet = currentMantra?.planet_type ? normalizePlanetName(currentMantra.planet_type) : null;

  const { reading, generateReading } = useAIVedicReading();
  const jyotishRecommendation = useJyotishMantraRecommendation(mantras, reading);
  const horaWatch = useHoraWatch({ timezone: userTimezone });
  const currentHoraPlanet = horaWatch.calculation?.currentHora?.planet
    ? normalizePlanetName(horaWatch.calculation.currentHora.planet)
    : null;
  const dashaPlanet = useBhriguPlanet(reading);
  const userRank = getTierRank(tier);

  useEffect(() => {
    if (!user || reading || !generateReading) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('birth_name, birth_date, birth_time, birth_place').eq('user_id', user.id).maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        await generateReading({ name: data.birth_name, birthDate: data.birth_date, birthTime: data.birth_time, birthPlace: data.birth_place, plan: 'compass' }, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, reading, generateReading]);

  const palmScan = getPalmScanResult();
  const handAnalysisComplete = !!palmScan;
  const palmArchetype = palmScan?.palmArchetype ?? null;
  const heartLineLeak = palmScan?.heartLineLeak ?? false;
  const heartHealingMantra = findHeartHealingMantra(mantras);
  const heartHealingMantraTitle = heartHealingMantra?.title ?? null;

  const userBirthPlanet: string | null = null;
  const shouldGlowGold = (m: MantraItem) => {
    const mp = m.planet_type ? normalizePlanetName(m.planet_type) : null;
    return !!(
      (dashaPlanet && mp === dashaPlanet) ||
      (userBirthPlanet && mp === userBirthPlanet) ||
      (currentHoraPlanet && mp === currentHoraPlanet && dashaPlanet && currentHoraPlanet === dashaPlanet)
    );
  };
  const isCelestialMatch = currentHoraPlanet && dashaPlanet && currentHoraPlanet === dashaPlanet;

  /* ── Load + sort mantras ── */
  useEffect(() => {
    let cancelled = false;
    getMantras({ userRank: isAdmin ? 3 : userRank, isAdmin }).then((data) => {
      if (cancelled) return;
      const dayPlanet = getPlanetOfDay();
      const sorted = [...data].sort((a, b) => {
        const aD = dashaPlanet && mantraMatchesPlanet(a, dashaPlanet);
        const bD = dashaPlanet && mantraMatchesPlanet(b, dashaPlanet);
        const aDay = mantraMatchesPlanet(a, dayPlanet);
        const bDay = mantraMatchesPlanet(b, dayPlanet);
        if (aD && !bD) return -1;
        if (!aD && bD) return 1;
        if (aDay && !bDay) return -1;
        if (!aDay && bDay) return 1;
        return 0;
      });
      setMantras(sorted);
      if (sorted.length > 0 && !selectedMantraId) {
        const dashaMid = dashaPlanet ? sorted.find((m) => mantraMatchesPlanet(m, dashaPlanet))?.id : null;
        const dayMid = sorted.find((m) => mantraMatchesPlanet(m, dayPlanet))?.id;
        const recId = jyotishRecommendation?.recommendedMantraId;
        setSelectedMantraId(
          dashaMid ?? dayMid ?? (recId && sorted.find((m) => m.id === recId) ? recId : null) ?? sorted[0].id
        );
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { toast.error(t('mantras.errorFetch')); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [tier, isAdmin, jyotishRecommendation?.recommendedMantraId, dashaPlanet]);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('mantra_purchases')
      .select('mantra_id')
      .eq('user_id', user.id)
      .then(({ data }: any) => {
        setPurchasedMantraIds(new Set((data || []).map((r: any) => r.mantra_id)));
      });
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mantra_unlocked') && user) {
      (supabase as any)
        .from('mantra_purchases')
        .select('mantra_id')
        .eq('user_id', user.id)
        .then(({ data }: any) => {
          setPurchasedMantraIds(new Set((data || []).map((r: any) => r.mantra_id)));
        });
      window.history.replaceState({}, '', '/mantras');
    }
  }, [user]);

  useEffect(() => {
    if (jyotishRecommendation?.recommendedMantraId && mantras.length > 0 && !selectedMantraId) {
      const rec = mantras.find((m) => m.id === jyotishRecommendation.recommendedMantraId);
      if (rec) setSelectedMantraId(rec.id);
    }
  }, [jyotishRecommendation?.recommendedMantraId, mantras, selectedMantraId]);

  useEffect(() => {
    return () => {
      clearMantraPlaybackListeners();
      audioEngine.stop();
    };
  }, []);

  useEffect(() => {
    if (!dashaPlanet || mantras.length === 0) return;
    const remedyMantra = mantras.find((m) => m.planet_type && normalizePlanetName(m.planet_type) === dashaPlanet);
    if (!remedyMantra?.audio_url) return;
    const url = getPlayableUrl(remedyMantra.audio_url);
    const preload = new Audio();
    preload.preload = 'auto';
    preload.src = url;
    preload.load();
    return () => { preload.src = ''; };
  }, [dashaPlanet, mantras]);

  const recordMantraCompletion = async (mantra: MantraItem) => {
    if (!user) return;
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('mantra_completions').select('id')
        .eq('user_id', user.id).eq('mantra_id', mantra.id)
        .gte('completed_at', twentyFourHoursAgo).limit(1);
      if (recent?.length) return;
      await supabase.from('mantra_completions').insert({ user_id: user.id, mantra_id: mantra.id });
      toast.success(t('mantras.completionToast', { defaultValue: '108 recitations complete 🕉' }));
      setStreakDirty(true);
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
    } catch (e) { console.error(e); }
  };

  const playNextRep = (mantra: MantraItem) => {
    if (!mantra.audio_url) return;
    clearMantraPlaybackListeners();
    const url = getPlayableUrl(mantra.audio_url);
    currentMantraIdRef.current = mantra.id;
    const el = audioEngine.play(url, undefined, { onPlayError: () => toast.error(t('mantras.errorAudioPlay')) });
    let modeAttached = false;
    let lastSyncedCount = -1;
    const bundle: { modeDetach?: () => void } = {};
    const attachPlaybackMode = () => {
      if (modeAttached) return;
      const d = el.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      modeAttached = true;
      el.removeEventListener('loadedmetadata', attachPlaybackMode);
      el.removeEventListener('durationchange', attachPlaybackMode);
      if (isSingleFile108Track(d)) {
        const onTime = () => {
          if (!Number.isFinite(el.duration) || el.duration <= 0) return;
          const n = Math.min(reps - 1, Math.floor((el.currentTime / el.duration) * reps));
          if (n !== lastSyncedCount) { lastSyncedCount = n; setCount(n); }
          setScrubPct(Math.min(100, (el.currentTime / el.duration) * 100));
        };
        const onFullEnd = () => {
          clearMantraPlaybackListeners();
          lastSyncedCount = reps; setCount(reps); setIsPlaying(false); setCompleted(true);
          setScrubPct(100);
          currentMantraIdRef.current = null; audioEngine.stop();
          if (user) void recordMantraCompletion(mantra);
        };
        el.addEventListener('timeupdate', onTime);
        el.addEventListener('ended', onFullEnd, { once: true });
        bundle.modeDetach = () => { el.removeEventListener('timeupdate', onTime); el.removeEventListener('ended', onFullEnd); };
        onTime();
      } else {
        const onShortEnded = () => {
          setCount((c) => {
            const next = c + 1;
            if (next >= reps) {
              setIsPlaying(false); setCompleted(true); currentMantraIdRef.current = null;
              clearMantraPlaybackListeners(); audioEngine.stop();
              if (user) void recordMantraCompletion(mantra);
              return reps;
            }
            const cur = audioEngine.getCurrent();
            if (cur) { cur.currentTime = 0; void safePlay(cur); }
            return next;
          });
        };
        el.addEventListener('ended', onShortEnded);
        bundle.modeDetach = () => { el.removeEventListener('ended', onShortEnded); };
      }
    };
    mantraPlaybackCleanupRef.current = () => {
      bundle.modeDetach?.(); bundle.modeDetach = undefined;
      el.removeEventListener('loadedmetadata', attachPlaybackMode);
      el.removeEventListener('durationchange', attachPlaybackMode);
    };
    el.addEventListener('loadedmetadata', attachPlaybackMode);
    el.addEventListener('durationchange', attachPlaybackMode);
    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) queueMicrotask(attachPlaybackMode);
  };

  const handleStart = () => {
    if (!currentMantra?.audio_url) { toast.error(t('mantras.noAudio')); return; }
    if (count >= reps) setCount(0);
    if (audioEngine.getCurrent() && currentMantraIdRef.current === currentMantra.id && count < reps) {
      if (audioEngine.isPlaying()) return;
      setIsPlaying(true); audioEngine.resume(); return;
    }
    setIsPlaying(true); setCompleted(false); playNextRep(currentMantra);
  };

  const handlePause = () => { audioEngine.pause(); setIsPlaying(false); };

  const handleReset = () => {
    clearMantraPlaybackListeners(); audioEngine.stop();
    currentMantraIdRef.current = null; setCount(0); setIsPlaying(false); setCompleted(false); setScrubPct(0);
  };

  const handleRestartFrom1 = () => {
    handleReset();
    if (currentMantra?.audio_url) { setIsPlaying(true); playNextRep(currentMantra); }
  };

  const handleUpgradeCheckout = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    if (upgradeLockedRef.current) return;
    upgradeLockedRef.current = true;
    try {
      await startPranaMonthlyCheckout({ successPath: '/mantras?membership_success=true', sourcePage: 'mantras-upgrade' });
    } catch (e) {
      upgradeLockedRef.current = false;
      toast.error(e instanceof Error ? e.message : 'Checkout failed.');
    }
  }, [user, navigate]);

  const handleBuyMantra = useCallback(async (m: MantraItem) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('create-mantra-checkout', {
        body: { mantraId: m.id },
      });
      if (error) throw error;
      if (data?.alreadyPurchased) {
        setPurchasedMantraIds((prev) => new Set(prev).add(m.id));
        return;
      }
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || 'No checkout URL returned');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed.');
    }
  }, [user, navigate]);

  const handleMantraSelect = useCallback((m: MantraItem, locked: boolean) => {
    if (locked) {
      if (!user) { navigate('/auth'); return; }
      // Individual purchase, if this mantra has its own price — otherwise
      // fall back to the tier upgrade flow (Stripe — PRESERVED).
      if (m.price_usd && m.price_usd > 0) {
        void handleBuyMantra(m);
      } else {
        void handleUpgradeCheckout();
      }
      return;
    }
    setSelectedMantraId(m.id);
    clearMantraPlaybackListeners();
    if (audioEngine.isPlaying() || audioEngine.getCurrent()) audioEngine.stop();
    setIsPlaying(false); currentMantraIdRef.current = null; setCount(0); setCompleted(false);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [user, navigate, handleUpgradeCheckout]);

  const CIRC = 97;
  const progressOffset = CIRC - (CIRC * (count / reps) * 0.97);
  const planetSymbol = mantraPlanet ? PLANET_SYMBOLS[mantraPlanet] ?? '' : '';

  /* ── Hora strip remedy ── */
  const handleHoraRemedy = useCallback(() => {
    if (!currentHoraPlanet) return;
    const remedyMantra = mantras.find((m) => m.planet_type && normalizePlanetName(m.planet_type) === currentHoraPlanet);
    if (remedyMantra) {
      handleMantraSelect(remedyMantra, false);
      if (remedyMantra.audio_url) setTimeout(() => handleStart(), 300);
    } else {
      const text = DASHA_MANTRA_DISPLAY[currentHoraPlanet];
      if (text) toast.info(text);
    }
  }, [currentHoraPlanet, mantras, handleMantraSelect]);

  /* ── Group mantras by DB category ── */
  const categorisedMantras = useMemo(() => {
    const groups: Record<CatKey, MantraItem[]> = {
      planet: [], deity: [], intention: [], karma: [],
      wealth: [], health: [], peace: [], protection: [], spiritual: [], general: [],
    };
    mantras.forEach((m) => {
      const ck = getMantraCategory(m);
      groups[ck].push(m);
    });
    return groups;
  }, [mantras]);

  /* ── Today's most relevant category (Dasha, else Hora) floats to the top ── */
  const priorityCat: CatKey | null = useMemo(() => {
    const relevantPlanet = dashaPlanet ?? currentHoraPlanet;
    if (!relevantPlanet) return null;
    const match = mantras.find((m) => m.planet_type && normalizePlanetName(m.planet_type) === relevantPlanet);
    return match ? getMantraCategory(match) : null;
  }, [mantras, dashaPlanet, currentHoraPlanet]);

  const orderedCats: CatKey[] = useMemo(() => {
    if (!priorityCat) return CAT_ORDER;
    return [priorityCat, ...CAT_ORDER.filter((c) => c !== priorityCat)];
  }, [priorityCat]);

  /* ── Auto-collapse every category except today's relevant one, once ── */
  useEffect(() => {
    if (collapsedCatsInit || mantras.length === 0) return;
    const allCats = CAT_ORDER.filter((ck) => categorisedMantras[ck].length > 0);
    const openCat = priorityCat ?? allCats[0] ?? null;
    setCollapsedCats(new Set(allCats.filter((c) => c !== openCat)));
    setCollapsedCatsInit(true);
  }, [mantras, categorisedMantras, priorityCat, collapsedCatsInit]);

  /* ── Filter chips: All / Unlocked / My Planet ── */
  const filteredGroup = useCallback((ck: CatKey): MantraItem[] => {
    const group = categorisedMantras[ck];
    if (filterMode === 'all') return group;
    if (filterMode === 'unlocked') {
      return group.filter((m) => {
        const requiredTier = (m.required_tier ?? (m.is_premium ? 1 : 0)) as number;
        return isAdmin || requiredTier <= userRank || purchasedMantraIds.has(m.id);
      });
    }
    // 'mine' — matches today's Dasha or Hora planet
    const relevantPlanet = dashaPlanet ?? currentHoraPlanet;
    return group.filter((m) => m.planet_type && normalizePlanetName(m.planet_type) === relevantPlanet);
  }, [categorisedMantras, filterMode, isAdmin, userRank, dashaPlanet, currentHoraPlanet, purchasedMantraIds]);

  /* ── Tier-aware upgrade banner — hidden once nothing is left to unlock ── */
  const TIER_NAMES = ['Atma-Seed', 'Prana-Flow', 'Siddha-Quantum', 'Akasha-Infinity'];
  const upgradeInfo = useMemo(() => {
    if (isAdmin) return null;
    let minLockedTier = Number.POSITIVE_INFINITY;
    mantras.forEach((m) => {
      const rt = (m.required_tier ?? (m.is_premium ? 1 : 0)) as number;
      if (rt > userRank && rt < minLockedTier) minLockedTier = rt;
    });
    if (!Number.isFinite(minLockedTier)) return null; // nothing locked above current tier
    return {
      targetTier: minLockedTier,
      targetName: TIER_NAMES[minLockedTier] ?? 'higher tier',
    };
  }, [mantras, userRank, isAdmin]);

  if (loading) {
    return (
      <div className="sqi-mantras" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <style>{SQI_CSS}</style>
        <SriYantraBg />
        <div style={{ textAlign: 'center' }}>
          <div className="nadi" style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
          <div className="m-micro">{t('mantras.loading')}</div>
        </div>
      </div>
    );
  }

  const horaRange = horaWatch.calculation
    ? `${horaWatch.calculation.currentHora.startTimeStr} – ${horaWatch.calculation.currentHora.endTimeStr}`
    : null;

  return (
    <div className="sqi-mantras">
      <style>{SQI_CSS}</style>
      <SriYantraBg />
      <div className="sqi-content">

        {/* ── HERO ── */}
        <div className="m-hero">
          <div className="m-orb" style={{ width: 200, height: 200, top: -70, right: -60, '--dur': '11s', '--dl': '0s' } as React.CSSProperties} />
          <div className="m-orb" style={{ width: 90, height: 90, top: 80, left: -30, '--dur': '8s', '--dl': '-3s' } as React.CSSProperties} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,.05)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 14 }}
            >←</button>
            <Sparkles size={18} className="nadi" />
          </div>
          <div className="m-micro" style={{ marginBottom: 8 }}>{t('mantras.heroMicro')}</div>
          <h1 className="m-hero-title m-shimmer">{t('mantras.title')}</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: streak > 0 ? 12 : 0 }}>
            {t('mantras.subtitle')}
          </p>
          {streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.22)', borderRadius: 100, padding: '5px 12px' }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#D4AF37', letterSpacing: '.02em' }}>
                {streak}-{t('mantras.dayStreak', { defaultValue: 'day streak' })}
              </span>
            </div>
          )}
        </div>

        {/* ── FIRST-VISIT ONBOARDING STRIP — plain language, dismissible, shown once ── */}
        {showOnboarding && (
          <div className="m-onboard">
            <button type="button" className="m-onboard-close" onClick={dismissOnboarding} aria-label={t('mantras.onboardDismiss', { defaultValue: 'Dismiss' })}>✕</button>
            <div className="m-onboard-eyebrow">{t('mantras.onboardEyebrow', { defaultValue: 'New here? Start in 30 seconds' })}</div>
            <div className="m-onboard-body">
              {t('mantras.onboardBody', { defaultValue: "A mantra is a short sacred phrase you repeat while it plays. This page suggests one based on today's date and your birth chart — or you can pick any one below. Press play, and it counts your repetitions for you." })}
            </div>
          </div>
        )}


        {/* ── BHRIGU CARD ── */}
        {showOnboarding && (
          <div style={{ margin: '0 var(--page-pad) 8px', padding: '0 4px', fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
            {t('mantras.bhriguPlain', { defaultValue: "We looked at your birth chart and today's planetary hour — here's the mantra suited to you right now." })}
          </div>
        )}
        <div className="m-bhrigu">
          <BhriguCard
            handAnalysisComplete={handAnalysisComplete}
            palmArchetype={palmArchetype}
            activeDasha={dashaPlanet}
            prescribedText={reading?.personalCompass?.currentDasha?.period ? getPrescribedMantraText(reading.personalCompass.currentDasha.period) : null}
            onPlayRemedy={(planet) => {
              const remedyMantra = mantras.find((m) => m.planet_type && normalizePlanetName(m.planet_type) === planet);
              if (remedyMantra) {
                handleMantraSelect(remedyMantra, false);
                if (remedyMantra.audio_url) setTimeout(() => handleStart(), 300);
                else toast.error(t('mantras.errorMantraNoAudio'));
              } else {
                const prescribedText = DASHA_MANTRA_DISPLAY[planet] ?? null;
                if (prescribedText) toast.info(`${prescribedText} — ${t('mantras.findMantraHint')}`);
              }
            }}
            t={t}
            heartLineLeak={heartLineLeak}
            onPlayHeartHealing={
              heartLineLeak && heartHealingMantra
                ? () => {
                    handleMantraSelect(heartHealingMantra, false);
                    if (heartHealingMantra.audio_url) setTimeout(() => handleStart(), 300);
                    else toast.error(t('mantras.errorMantraNoAudio'));
                  }
                : undefined
            }
            heartHealingMantraTitle={heartHealingMantraTitle}
          />
        </div>

        {/* ── Celestial Match Banner ── */}
        {isCelestialMatch && dashaPlanet && (
          <div className="m-glass" style={{ margin: '0 var(--page-pad) 14px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,.9)', marginBottom: 2 }}>{t('mantras.celestialMatchTitle')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{t('mantras.celestialMatchBody', { hora: currentHoraPlanet, dasha: dashaPlanet })}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPACT HORA STRIP ── */}
        {horaWatch.calculation && horaRange && (
          <>
            <div className="m-hora-strip">
              <span style={{ fontSize: 13 }}>{PLANET_SYMBOLS[currentHoraPlanet ?? ''] ?? '🌙'}</span>
              <span className="m-hora-strip-planet">{currentHoraPlanet ?? '--'} Hora</span>
              <span className="m-hora-strip-time">· {horaRange}</span>
              <span className="m-hora-strip-timer">{horaWatch.remainingTimeStr}</span>
              {currentHoraPlanet && (
                <button className="m-hora-remedy-btn" onClick={handleHoraRemedy}>
                  ▶ {currentHoraPlanet} Remedy
                </button>
              )}
            </div>
            {showOnboarding && (
              <div className="m-glossary-hint">
                {t('mantras.horaGlossary', { defaultValue: 'A "Hora" is a planetary hour — Vedic tradition holds each hour of the day is ruled by a different planet, and certain mantras suit each one.' })}
              </div>
            )}
          </>
        )}

        {/* ════ INLINE PLAYER — now the page's focal point ════ */}
        <div ref={playerRef} className="m-player-wrap m-player-top">
          {/* banner */}
          <div className="m-player-banner">
            <div className="m-player-eyebrow">{t('mantras.nowReciting', { defaultValue: 'Now Reciting' })}</div>
            <div className="m-mantra-name m-shimmer">
              {currentMantra?.title ?? t('mantras.selectPrompt')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {mantraPlanet && (
                <span className="m-tag" style={{ background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.22)', color: '#D4AF37' }}>
                  {planetSymbol} {t('mantras.planetMantraTag', { planet: mantraPlanet })}
                </span>
              )}
              <span className="m-tag" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(255,255,255,.4)' }}>
                ✦ {t('mantras.sacredReverb')}
              </span>
            </div>
            {resumeAvailable && resumeAvailable.id === selectedMantraId && count === 0 && !isPlaying && (
              <button
                type="button"
                className="m-resume-chip"
                onClick={() => { setCount(resumeAvailable.count); handleStart(); }}
              >
                ↺ {t('mantras.resumeFrom', { count: resumeAvailable.count, defaultValue: `Resume from ${resumeAvailable.count}/108` })}
              </button>
            )}
          </div>

          {/* compact ring + controls row */}
          {!completed ? (
            <>
              <div className="m-controls-row">
                {/* ring counter */}
                <div className="m-ring-wrap">
                  {isPlaying && (
                    <>
                      <div className="m-scalar-ring" />
                      <div className="m-scalar-ring" />
                      <div className="m-scalar-ring" />
                    </>
                  )}
                  <svg className="m-counter-ring" width="100" height="100" viewBox="0 0 36 36">
                    <defs>
                      <linearGradient id="goldGradMantra" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#F5D77A" stopOpacity="1" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                    <circle className="m-counter-track" cx="18" cy="18" r="15.5" />
                    <circle
                      className="m-counter-fill"
                      cx="18" cy="18" r="15.5"
                      strokeDasharray={`${CIRC} ${CIRC}`}
                      strokeDashoffset={progressOffset}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.04em', color: '#D4AF37', lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.4)', marginTop: 2 }}>
                      {t('mantras.slash108')}
                    </div>
                  </div>
                </div>

                {/* buttons */}
                <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`m-btn-start${isPlaying ? ' m-paused' : ''}`}
                    onClick={() => {
                      if (isPlaying) handlePause();
                      else handleStart();
                      if ('vibrate' in navigator) navigator.vibrate(15);
                    }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isPlaying ? t('mantras.pauseUpper') : t('mantras.startUpper')}
                  </button>
                  <button type="button" className="m-btn-reset" onClick={() => { handleReset(); if ('vibrate' in navigator) navigator.vibrate([10, 20, 10]); }} title={t('mantras.resetAria')}>
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
              {scrubPct > 0 && (
                <div className="m-scrub-track">
                  <div className="m-scrub-fill" style={{ width: `${scrubPct}%` }} />
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: 16, background: 'linear-gradient(135deg,rgba(212,175,55,.1),rgba(212,175,55,.04))', border: '1px solid rgba(212,175,55,.3)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🕉</div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-.02em', color: '#D4AF37', marginBottom: 4 }}>{t('mantras.completed108Title')}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>{t('mantras.completed108Sub')}</div>
              <button
                type="button"
                className="m-btn-start"
                style={{ margin: '0 auto', width: 'auto', padding: '10px 28px', display: 'inline-flex' }}
                onClick={() => { setCount(0); setCompleted(false); setScrubPct(0); handleStart(); if ('vibrate' in navigator) navigator.vibrate([15, 50, 15]); }}
              >
                {t('mantras.practiceAgain')}
              </button>
            </div>
          )}

          {/* plain-language explainer */}
          <div className="m-player-explainer" style={{ margin: '0 var(--page-pad) 4px', textAlign: 'center' }}>
            {t('mantras.playerExplainer', { defaultValue: 'Press the gold button below. It repeats this chant 108 times and counts each one for you.' })}
          </div>

          {/* instructions */}
          <div className="m-instructions">
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)', marginBottom: 8 }}>
              {t('mantras.instructions.title')}
            </div>
            {[t('mantras.instructions.step1'), t('mantras.instructions.step2'), t('mantras.instructions.step3')].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,.62)', lineHeight: 1.55, marginBottom: i < 2 ? 7 : 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'rgba(212,175,55,.7)', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* ── TIER-AWARE UPGRADE BANNER — hidden entirely once nothing is left to unlock (e.g. Akasha-Infinity) ── */}
        {upgradeInfo && (
          <div className="m-upgrade-banner" onClick={handleUpgradeCheckout}>
            <div className="m-upgrade-icon">🔓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m-upgrade-title">{t('mantras.upgradeTitle', { defaultValue: 'Unlock the full mantra library' })}</div>
              <div className="m-upgrade-sub">{t('mantras.upgradeSub', { tier: upgradeInfo.targetName, defaultValue: `${upgradeInfo.targetName} unlocks every remaining mantra` })}</div>
            </div>
            <div className="m-upgrade-cta">{t('mantras.upgradeCta', { defaultValue: 'Upgrade' })}</div>
          </div>
        )}

        {/* ── FILTER CHIPS ── */}
        <div className="m-filter-row">
          {(['all', 'unlocked', 'mine'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`m-filter-chip${filterMode === f ? ' active' : ''}`}
              onClick={() => setFilterMode(f)}
            >
              {f === 'all' ? t('mantras.filterAll', { defaultValue: 'All' })
                : f === 'unlocked' ? t('mantras.filterUnlocked', { defaultValue: 'Unlocked' })
                : t('mantras.filterMine', { defaultValue: 'My Planet' })}
            </button>
          ))}
        </div>

        {/* ════ MANTRA GRID BY CATEGORY ════ */}
        {orderedCats.map((ck) => {
          const fullGroup = categorisedMantras[ck];
          if (fullGroup.length === 0) return null;
          const group = filteredGroup(ck);
          const meta = CAT_META[ck];
          const CatSectionIcon = CAT_ICONS[ck];
          const isCollapsed = collapsedCats.has(ck);
          const isPriority = ck === priorityCat;

          return (
            <div key={ck} className={`m-cat-card${isPriority ? ' m-cat-glow' : ''}`}>
              <div
                className="m-cat-header"
                onClick={() => setCollapsedCats((prev) => {
                  const next = new Set(prev);
                  next.has(ck) ? next.delete(ck) : next.add(ck);
                  return next;
                })}
              >
                <div className="m-cat-header-left">
                  <div
                    className="m-cat-siddha-icon"
                    style={{ borderColor: meta.borderColor, color: meta.color }}
                    aria-hidden
                  >
                    <CatSectionIcon size={24} strokeWidth={1.65} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="m-cat-micro">{t('meditations.sectionMicroLabel')}</div>
                    <div className="m-cat-title">{t(`mantras.categorySections.${ck}.title`, { defaultValue: meta.label })}</div>
                    <div className="m-cat-sub">{t(`mantras.categorySections.${ck}.subtitle`)}</div>
                  </div>
                </div>
                <div className="m-cat-count">{fullGroup.length}</div>
                <div className={`m-cat-chevron${!isCollapsed ? ' open' : ''}`} aria-hidden>
                  {!isCollapsed ? '▲' : '▼'}
                </div>
              </div>

              {!isCollapsed && (
                <>
                  <div className="m-cat-divider" style={{ marginLeft: 20, marginRight: 20 }} />
                  <div className="m-cat-grid-wrap">
                {group.length === 0 && (
                  <div style={{ padding: '4px 8px 16px', fontSize: 11.5, color: 'rgba(255,255,255,.3)' }}>
                    {t('mantras.noMatchesFilter', { defaultValue: 'No mantras match this filter in this category.' })}
                  </div>
                )}
                <div className="m-playlist">
                  {group.map((m) => {
                    const mp = m.planet_type ? normalizePlanetName(m.planet_type) : null;
                    const isSel = selectedMantraId === m.id;
                    const isAura = shouldGlowGold(m);
                    const pSym = mp ? PLANET_SYMBOLS[mp] ?? '' : '';
                    const CardCatIcon = CAT_ICONS[ck];
                    const pct = getSuccessPercent(mp);
                    const requiredTier = (m.required_tier ?? (m.is_premium ? 1 : 0)) as number;
                    const cardLocked = (requiredTier > userRank) && !isAdmin && !purchasedMantraIds.has(m.id);
                    const tierLabel = m.price_usd && m.price_usd > 0 ? `$${m.price_usd.toFixed(2)}`
                      : requiredTier >= 3 ? 'Akasha-Infinity'
                      : requiredTier === 2 ? 'Siddha-Quantum'
                      : requiredTier === 1 ? 'Prana-Flow+'
                      : '';

                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={[
                          'm-row',
                          isSel ? 'm-row-active' : '',
                          isAura && !isSel ? 'm-row-aura' : '',
                          cardLocked ? 'm-row-locked' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleMantraSelect(m, cardLocked)}
                      >
                        {/* play state / planet-or-category icon */}
                        <div className="m-row-play" style={{ background: isSel ? undefined : `${meta.borderColor}22`, borderColor: meta.borderColor }}>
                          {cardLocked ? (
                            <Lock size={13} />
                          ) : isSel ? (
                            isPlaying ? <Pause size={13} /> : <Play size={13} />
                          ) : pSym ? (
                            <span style={{ color: meta.pillColor, fontSize: 14, fontWeight: 650 }}>{pSym}</span>
                          ) : (
                            <CardCatIcon size={15} strokeWidth={1.8} color={meta.pillColor} aria-hidden />
                          )}
                        </div>

                        {/* title + meta */}
                        <div className="m-row-body">
                          <div className="m-row-title">{m.title}</div>
                          <div className="m-row-meta">
                            {mp && (
                              <span className="m-pill" style={{ background: meta.pillBg, border: `1px solid ${meta.borderColor}`, color: meta.pillColor }}>
                                {pSym} {mp}
                              </span>
                            )}
                            <span className="m-pill" style={{ background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.15)', color: 'rgba(212,175,55,.55)' }}>
                              {pct}% ✦
                            </span>
                          </div>
                        </div>

                        {/* duration or lock badge */}
                        {cardLocked ? (
                          <div className="m-row-lock-badge">{tierLabel}</div>
                        ) : m.duration_minutes > 0 ? (
                          <div className="m-row-dur">{formatDurationMinutes(m.duration_minutes)}</div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* ── Jyotish Recommendations ── */}
        {jyotishRecommendation && (
          <div className="m-glass" style={{ margin: '16px var(--page-pad) 0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🔭</span>
              <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '-.01em' }}>{t('mantras.jyotishTitle')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {jyotishRecommendation.dayPlanet && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{t('mantras.recommendationDay', { planet: jyotishRecommendation.dayPlanet })}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
                    {jyotishRecommendation.dayMantraId ? mantras.find((m) => m.id === jyotishRecommendation.dayMantraId)?.title ?? '–' : '–'}
                  </span>
                </div>
              )}
              {jyotishRecommendation.periodPlanet && (
                <>
                  <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{t('mantras.recommendationPeriod', { planet: jyotishRecommendation.periodPlanet })}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
                      {jyotishRecommendation.periodMantraId ? mantras.find((m) => m.id === jyotishRecommendation.periodMantraId)?.title ?? '–' : '–'}
                    </span>
                  </div>
                </>
              )}
              {jyotishRecommendation.horaPlanet && (
                <>
                  <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{t('mantras.recommendationHora', { planet: jyotishRecommendation.horaPlanet })} </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
                      {jyotishRecommendation.horaMantraId ? mantras.find((m) => m.id === jyotishRecommendation.horaMantraId)?.title ?? '–' : '–'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 120 }} />
      </div>
    </div>
  );
};

export default Mantras;
