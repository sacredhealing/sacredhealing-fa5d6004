import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, RotateCcw, Wind, Heart, Sparkles, Clock, Youtube, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useSiteContent } from '@/hooks/useSiteContent';
import { SacredBreathingGuide } from '@/components/breathing/SacredBreathingGuide';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────────
// SQI 2050 INLINE STYLES — Pranayama Cave DNA
// ─────────────────────────────────────────────
const SQI_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');

  :root {
    --siddha-gold: #D4AF37;
    --akasha-black: #050505;
    --gold-glow: rgba(212,175,55,0.25);
    --gold-glow-deep: rgba(212,175,55,0.08);
    --glass-base: rgba(255,255,255,0.025);
    --glass-border: rgba(255,255,255,0.06);
    --vayu-cyan: #22D3EE;
    --prana-amber: rgba(212,175,55,0.15);
    --cave-stone: rgba(180,160,100,0.06);
  }

  .sqi-page {
    background: #050505;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding-bottom: 120px;
    position: relative;
    overflow-x: hidden;
  }

  /* Cave ambient background */
  .sqi-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 20% 80%, rgba(34,211,238,0.04) 0%, transparent 50%),
      radial-gradient(ellipse 50% 60% at 80% 60%, rgba(150,100,200,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* Floating golden dust particles */
  .sqi-page::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 15% 20%, rgba(212,175,55,0.4), transparent),
      radial-gradient(1px 1px at 40% 65%, rgba(212,175,55,0.2), transparent),
      radial-gradient(1px 1px at 70% 30%, rgba(212,175,55,0.3), transparent),
      radial-gradient(1px 1px at 85% 75%, rgba(34,211,238,0.3), transparent),
      radial-gradient(1px 1px at 55% 90%, rgba(212,175,55,0.2), transparent),
      radial-gradient(2px 2px at 25% 50%, rgba(212,175,55,0.15), transparent),
      radial-gradient(1px 1px at 90% 15%, rgba(212,175,55,0.25), transparent);
    pointer-events: none;
    z-index: 0;
    animation: dust-float 20s ease-in-out infinite;
  }

  @keyframes dust-float {
    0%, 100% { transform: translateY(0px); opacity: 1; }
    50% { transform: translateY(-8px); opacity: 0.7; }
  }

  .sqi-content {
    position: relative;
    z-index: 1;
  }

  /* ── GLASS CARD ── */
  .glass-card {
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 32px;
    position: relative;
    overflow: hidden;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
    border-radius: 32px 32px 0 0;
  }

  .gold-border-card {
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 32px;
    position: relative;
    overflow: hidden;
  }

  .gold-border-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 32px;
    background: linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 50%);
    pointer-events: none;
  }

  /* ── GOLD TEXT ── */
  .gold-title {
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212,175,55,0.4);
    font-family: 'Cinzel', serif;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .gold-label {
    color: rgba(212,175,55,0.7);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.45em;
    text-transform: uppercase;
  }

  .body-text {
    color: rgba(255,255,255,0.55);
    font-weight: 400;
    line-height: 1.7;
    font-size: 14px;
  }

  /* ── HEADER ── */
  .cave-header {
    padding: 24px 20px 20px;
  }

  .back-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    font-weight: 500;
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .back-btn:hover { color: rgba(255,255,255,0.8); }

  .temple-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #D4AF37;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    transition: all 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-shadow: 0 0 12px rgba(212,175,55,0.4);
  }

  .temple-btn:hover {
    text-shadow: 0 0 20px rgba(212,175,55,0.7);
    color: #f0cc5c;
  }

  /* ── HERO HEADER SECTION ── */
  .hero-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hero-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(212,175,55,0.15), inset 0 1px 0 rgba(212,175,55,0.2);
    flex-shrink: 0;
  }

  .hero-titles h1 {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 26px;
    color: #D4AF37;
    text-shadow: 0 0 25px rgba(212,175,55,0.35);
    line-height: 1.1;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }

  .hero-titles p {
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    margin: 0;
  }

  /* ── INTRO BANNER ── */
  .intro-banner {
    margin: 0 20px 20px;
    padding: 20px 24px;
  }

  .intro-banner p {
    color: rgba(255,255,255,0.55);
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
  }

  .intro-banner strong {
    color: rgba(212,175,55,0.85);
    font-weight: 600;
  }

  /* ── SECTION LABELS ── */
  .section-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.5);
    margin-bottom: 6px;
    display: block;
  }

  /* ── KRIYA PORTAL ── */
  .kriya-portal {
    margin: 0 20px 20px;
    padding: 28px 24px;
    background: linear-gradient(135deg, rgba(120,50,200,0.12) 0%, rgba(212,175,55,0.04) 100%);
    border: 1px solid rgba(120,50,200,0.25);
    border-radius: 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .kriya-portal::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(120,50,200,0.5), rgba(212,175,55,0.3), transparent);
  }

  .kriya-portal-title {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 700;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212,175,55,0.4);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .kriya-portal-sub {
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    letter-spacing: 0.08em;
    margin-bottom: 28px;
  }

  /* ── PRANAYAMA CAVE GRID ── */
  .cave-grid {
    margin: 0 20px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .cave-technique-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 20px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .cave-technique-card.active {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.4);
    box-shadow: 0 0 30px rgba(212,175,55,0.1), inset 0 1px 0 rgba(212,175,55,0.15);
  }

  .cave-technique-card:hover:not(.disabled) {
    border-color: rgba(212,175,55,0.25);
    transform: translateY(-2px);
  }

  .cave-technique-card.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .technique-emoji {
    font-size: 28px;
    margin-bottom: 10px;
    display: block;
  }

  .technique-name {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .technique-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .technique-ratio {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.6);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .active-glow-dot {
    position: absolute;
    top: 14px; right: 14px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #D4AF37;
    box-shadow: 0 0 10px rgba(212,175,55,0.8);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }

  /* ── CLASSIC TIMER ── */
  .timer-section {
    margin: 0 20px 20px;
    padding: 28px 24px;
  }

  .timer-section-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    text-align: center;
    margin-bottom: 24px;
  }

  .timer-circle-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .timer-orb {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .timer-orb::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(var(--siddha-gold) 0%, transparent 60%);
    opacity: 0.3;
    animation: orb-rotate 4s linear infinite;
  }

  @keyframes orb-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .orb-inhale { background: radial-gradient(circle, rgba(34,211,238,0.4), rgba(34,211,238,0.1)); box-shadow: 0 0 60px rgba(34,211,238,0.3); }
  .orb-hold { background: radial-gradient(circle, rgba(150,80,220,0.4), rgba(150,80,220,0.1)); box-shadow: 0 0 60px rgba(150,80,220,0.3); }
  .orb-exhale { background: radial-gradient(circle, rgba(52,211,153,0.4), rgba(52,211,153,0.1)); box-shadow: 0 0 60px rgba(52,211,153,0.3); }
  .orb-holdOut { background: radial-gradient(circle, rgba(251,146,60,0.4), rgba(251,146,60,0.1)); box-shadow: 0 0 60px rgba(251,146,60,0.3); }
  .orb-idle { background: radial-gradient(circle, rgba(212,175,55,0.15), rgba(5,5,5,0.6)); box-shadow: 0 0 40px rgba(212,175,55,0.1); }

  .scale-inhale { transform: scale(1.12); }
  .scale-exhale { transform: scale(0.88); }
  .scale-hold { transform: scale(1.05); }
  .scale-holdOut { transform: scale(0.95); }
  .scale-idle { transform: scale(1); }

  .orb-inner-text {
    text-align: center;
    z-index: 1;
  }

  .orb-phase-label {
    font-family: 'Cinzel', serif;
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.05em;
    text-shadow: 0 0 15px rgba(255,255,255,0.3);
    display: block;
    margin-bottom: 4px;
  }

  .orb-countdown {
    font-size: 44px;
    font-weight: 900;
    color: white;
    text-shadow: 0 0 30px rgba(255,255,255,0.5);
    line-height: 1;
    display: block;
  }

  .timer-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    justify-content: center;
  }

  .timer-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 12px;
    font-weight: 600;
  }

  /* ── CONTROLS ── */
  .controls-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 0 20px 20px;
  }

  .btn-begin {
    background: linear-gradient(135deg, #D4AF37, #b8940f);
    border: none;
    border-radius: 50px;
    padding: 16px 40px;
    color: #050505;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 30px rgba(212,175,55,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-begin:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(212,175,55,0.5);
  }

  .btn-stop {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 16px 28px;
    color: rgba(255,255,255,0.7);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-stop:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }

  .btn-reset {
    background: transparent;
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 50px;
    padding: 16px 20px;
    color: rgba(212,175,55,0.6);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-reset:hover {
    border-color: rgba(212,175,55,0.4);
    color: rgba(212,175,55,0.9);
  }

  /* ── MEDIA SECTION ── */
  .media-section {
    margin: 0 20px 20px;
    border-radius: 24px;
    overflow: hidden;
  }

  .audio-card {
    margin: 0 20px 20px;
    padding: 20px 24px;
  }

  /* ── CAVE GUIDE (5 techniques) ── */
  .cave-guide {
    margin: 0 20px 20px;
    padding: 28px 24px;
  }

  .cave-guide-title {
    font-family: 'Cinzel', serif;
    font-size: 20px;
    font-weight: 700;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212,175,55,0.3);
    margin-bottom: 6px;
  }

  .cave-guide-sub {
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
    margin-bottom: 24px;
  }

  .pranayama-guide-item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .pranayama-guide-item:last-child {
    border-bottom: none;
  }

  .guide-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #D4AF37;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .guide-text h4 {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    margin: 0 0 4px;
  }

  .guide-text p {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    margin: 0;
  }

  .guide-text .guide-sanskrit {
    font-size: 10px;
    color: rgba(212,175,55,0.5);
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-bottom: 2px;
    display: block;
  }

  /* ── BENEFITS ── */
  .benefits-section {
    margin: 0 20px 20px;
    padding: 24px;
  }

  .benefits-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  .benefit-item:last-child { border-bottom: none; }

  .benefit-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #D4AF37;
    margin-top: 5px;
    flex-shrink: 0;
    box-shadow: 0 0 8px rgba(212,175,55,0.6);
  }

  /* ── PRANA BADGE (Free + Prana Flow) ── */
  .access-badges {
    display: flex;
    gap: 8px;
    margin: 0 20px 20px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  .badge-free {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: rgba(52,211,153,0.9);
  }

  .badge-prana {
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    color: #D4AF37;
  }

  /* ── CAVE DIVIDER ── */
  .cave-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 20px 20px;
    opacity: 0.4;
  }

  .cave-divider::before,
  .cave-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
  }

  .cave-divider span {
    font-size: 16px;
    color: rgba(212,175,55,0.6);
  }

  /* ── PATTERN SELECT LIST ── */
  .pattern-list-wrap {
    margin: 0 20px 20px;
    padding: 24px;
  }

  .pattern-list-title {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pattern-list-sub {
    font-size: 11px;
    color: rgba(212,175,55,0.45);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-weight: 800;
    margin-bottom: 20px;
  }

  .pattern-item {
    width: 100%;
    padding: 16px 18px;
    border-radius: 20px;
    text-align: left;
    transition: all 0.3s ease;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    display: block;
  }

  .pattern-item:last-child { margin-bottom: 0; }

  .pattern-item.selected {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.35);
    box-shadow: 0 0 20px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.1);
  }

  .pattern-item:hover:not(.is-disabled) {
    border-color: rgba(212,175,55,0.2);
    background: rgba(212,175,55,0.04);
  }

  .pattern-item.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pattern-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .pattern-item-name {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
  }

  .pattern-item.selected .pattern-item-name {
    color: #D4AF37;
  }

  .pattern-item-ratio {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.55);
  }

  .pattern-item-desc {
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    line-height: 1.5;
  }

  /* Responsive */
  @media (max-width: 400px) {
    .cave-grid { grid-template-columns: 1fr; }
    .hero-titles h1 { font-size: 22px; }
  }
`;

// ─────────────────────────────────────────────
// Cave Pranayama Guide Data (Western-Friendly)
// ─────────────────────────────────────────────
const CAVE_GUIDE = [
  {
    sanskrit: 'PRANAYAMA',
    title: 'What is Pranayama?',
    desc: "Prana means 'life force energy' — the breath is your bridge between body and soul. Pranayama is the ancient Vedic science of directing this energy through conscious breathing.",
  },
  {
    sanskrit: 'NADI SHODHANA',
    title: 'Alternate Nostril Breathing',
    desc: "Balances left & right hemispheres of the brain. Close your right nostril, inhale left. Close left, exhale right. Switch. Like charging a battery — calms anxiety in 3 minutes.",
  },
  {
    sanskrit: 'KAPALABHATI',
    title: 'Skull-Shining Breath',
    desc: 'Short, sharp exhales through the nose with passive inhales. Clears stale prana from your lungs, activates solar plexus energy, sharpens mental clarity instantly.',
  },
  {
    sanskrit: 'BHRAMARI',
    title: 'Humming Bee Breath',
    desc: 'Inhale deeply, then hum like a bee on the exhale. The vibration stimulates the vagus nerve, drops cortisol, and activates Anahata (heart chakra) healing.',
  },
  {
    sanskrit: 'UJJAYI',
    title: 'Ocean Victory Breath',
    desc: 'Breathe through the nose with a slight constriction in the throat, creating an ocean sound. Used in yoga — heats the body, builds focus, and activates the parasympathetic system.',
  },
];

// ─────────────────────────────────────────────
// TYPE DEFS (unchanged from original)
// ─────────────────────────────────────────────
type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdOut' | 'idle';

interface BreathingPattern {
  id: string;
  name: string;
  description: string | null;
  inhale: number;
  hold: number;
  exhale: number;
  hold_out: number;
  cycles: number;
  youtube_url?: string | null;
  audio_url?: string | null;
}

const defaultPatterns: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal counts for calm and focus. Used by Navy SEALs.',
    inhale: 4,
    hold: 4,
    exhale: 4,
    hold_out: 4,
    cycles: 4,
  },
];

// ─────────────────────────────────────────────
// TECHNIQUE CARD META (visual enrichment only)
// ─────────────────────────────────────────────
const TECHNIQUE_ICONS: Record<string, string> = {
  box: '◻️',
  '4-7-8': '🌙',
  energizing: '⚡',
  calming: '🌊',
  crown: '🔱',
};

const getPatternEmoji = (id: string, name: string) => {
  if (id === 'box') return '◻️';
  if (name.toLowerCase().includes('4-7-8') || name.toLowerCase().includes('relaxation')) return '🌙';
  if (name.toLowerCase().includes('energiz') || name.toLowerCase().includes('kapalbhati')) return '⚡';
  if (name.toLowerCase().includes('calm')) return '🌊';
  if (name.toLowerCase().includes('crown') || name.toLowerCase().includes('pump')) return '🔱';
  if (name.toLowerCase().includes('nadi') || name.toLowerCase().includes('nostril')) return '☯️';
  if (name.toLowerCase().includes('ocean') || name.toLowerCase().includes('ujjayi')) return '🌊';
  return '🕉️';
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const Breathing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { content } = useSiteContent([
    'breathing_title',
    'breathing_subtitle',
    'breathing_description',
  ]);

  // ── STATE (unchanged logic) ──
  const [patterns, setPatterns] = useState<BreathingPattern[]>(defaultPatterns);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(defaultPatterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch patterns from database (unchanged)
  useEffect(() => {
    const fetchPatterns = async () => {
      const { data, error } = await supabase
        .from('breathing_patterns')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        setPatterns(data);
        setSelectedPattern(data[0]);
      }
    };
    fetchPatterns();
  }, []);

  // ── PHASE LOGIC (unchanged) ──
  const phaseLabels: Record<BreathPhase, string> = {
    inhale: t('breathing.inhale', 'Breathe In'),
    hold: t('breathing.hold', 'Hold'),
    exhale: t('breathing.exhale', 'Breathe Out'),
    holdOut: t('breathing.holdOut', 'Hold'),
    idle: t('breathing.ready', 'Ready'),
  };

  const getNextPhase = (current: BreathPhase): BreathPhase => {
    const pattern = selectedPattern;
    switch (current) {
      case 'inhale': return pattern.hold > 0 ? 'hold' : 'exhale';
      case 'hold': return 'exhale';
      case 'exhale': return pattern.hold_out > 0 ? 'holdOut' : 'inhale';
      case 'holdOut': return 'inhale';
      default: return 'inhale';
    }
  };

  const getPhaseDuration = (p: BreathPhase): number => {
    switch (p) {
      case 'inhale': return selectedPattern.inhale;
      case 'hold': return selectedPattern.hold;
      case 'exhale': return selectedPattern.exhale;
      case 'holdOut': return selectedPattern.hold_out;
      default: return 0;
    }
  };

  const startExercise = () => {
    setIsActive(true);
    setCurrentCycle(1);
    setPhase('inhale');
    setTimeLeft(selectedPattern.inhale);
    setTotalSeconds(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(0);
    setCurrentCycle(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetExercise = () => { stopExercise(); };

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
      setTimeLeft(prev => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(phase);
          const nextDuration = getPhaseDuration(nextPhase);
          if (nextPhase === 'inhale' && phase !== 'idle') {
            if (currentCycle >= selectedPattern.cycles) { stopExercise(); return 0; }
            setCurrentCycle(c => c + 1);
          }
          if (nextDuration === 0) {
            const skipPhase = getNextPhase(nextPhase);
            setPhase(skipPhase);
            return getPhaseDuration(skipPhase);
          }
          setPhase(nextPhase);
          return nextDuration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, phase, currentCycle, selectedPattern]);

  // ── ORB STYLE HELPERS ──
  const orbColorClass = `orb-${phase}`;
  const orbScaleClass = `scale-${phase}`;

  return (
    <>
      <style>{SQI_STYLES}</style>
      <div className="sqi-page">
        <div className="sqi-content">

          {/* ── HEADER ── */}
          <div className="cave-header">
            <div className="back-nav">
              <button onClick={() => navigate(-1)} className="back-btn">
                <ArrowLeft size={14} />
                <span>{t('common.back', 'Back')}</span>
              </button>
              <button onClick={() => navigate('/dashboard')} className="temple-btn">
                ✦ Return to Temple
              </button>
            </div>
            <div className="hero-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="hero-icon-wrap">
                  <Wind size={28} color="#D4AF37" />
                </div>
                <div className="hero-titles">
                  <h1>{content['breathing_title'] || 'Pranayama Cave'}</h1>
                  <p>{content['breathing_subtitle'] || 'Sacred Breath · Vedic Light-Codes'}</p>
                </div>
              </div>
              <AmbientSoundToggle />
            </div>
          </div>

          {/* ── ACCESS BADGES ── */}
          <div className="access-badges">
            <span className="badge badge-free">✓ Free Access</span>
            <span className="badge badge-prana">✦ Prana Flow Included</span>
          </div>

          {/* ── INTRO BANNER ── */}
          <div className="intro-banner glass-card">
            <p>
              {content['breathing_description'] ||
                <>Enter the <strong>Cave of Pranayama</strong> — where breath becomes Bhakti-Algorithm. Each inhale draws cosmic Prana. Each exhale releases karmic density. <strong>Anahata opens. Healing flows.</strong></>
              }
            </p>
          </div>

          <div className="cave-divider"><span>🕉</span></div>

          {/* ── SIDDHA KRIYA PORTAL ── */}
          <div className="kriya-portal">
            <div className="kriya-portal-title">
              <Sparkles size={18} color="#D4AF37" />
              Siddha Kriya Portal
            </div>
            <div className="kriya-portal-sub">
              Sync breath with the orb · Awaken the Kundalini · Release the Karma
            </div>
            <SacredBreathingGuide inhaleSeconds={4} exhaleSeconds={4} />
          </div>

          {/* ── PATTERN SELECTION GRID ── */}
          <div style={{ margin: '0 20px 8px', padding: '0' }}>
            <span className="section-label">⬡ Choose Your Kriya</span>
          </div>
          <div className="cave-grid">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => { if (!isActive) setSelectedPattern(pattern); }}
                disabled={isActive}
                className={`cave-technique-card ${selectedPattern.id === pattern.id ? 'active' : ''} ${isActive ? 'disabled' : ''}`}
              >
                {selectedPattern.id === pattern.id && <div className="active-glow-dot" />}
                <span className="technique-emoji">{getPatternEmoji(pattern.id, pattern.name)}</span>
                <div className="technique-name">{pattern.name}</div>
                <div className="technique-desc">{pattern.description}</div>
                <div className="technique-ratio">
                  {pattern.inhale}-{pattern.hold}-{pattern.exhale}{pattern.hold_out > 0 ? `-${pattern.hold_out}` : ''}
                </div>
              </button>
            ))}
          </div>

          {/* ── CLASSIC TIMER ── */}
          <div className="timer-section glass-card">
            <div className="timer-section-title">Prana Flow Timer</div>
            <div className="timer-circle-wrap">
              <div className={`timer-orb ${orbColorClass} ${orbScaleClass}`}>
                <div className="orb-inner-text">
                  <span className="orb-phase-label">{phaseLabels[phase]}</span>
                  {isActive && <span className="orb-countdown">{timeLeft}</span>}
                </div>
              </div>
              {isActive && (
                <div className="timer-stats">
                  <div className="timer-stat">
                    <Heart size={13} color="#D4AF37" />
                    <span>{t('breathing.cycle', 'Cycle')} {currentCycle}/{selectedPattern.cycles}</span>
                  </div>
                  <div className="timer-stat">
                    <Clock size={13} color="rgba(255,255,255,0.4)" />
                    <span>{Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="controls-row">
            {!isActive ? (
              <button onClick={startExercise} className="btn-begin">
                <Play size={16} />
                Begin the Kriya
              </button>
            ) : (
              <>
                <button onClick={stopExercise} className="btn-stop">
                  <Pause size={16} />
                  {t('breathing.stop', 'Stop')}
                </button>
                <button onClick={resetExercise} className="btn-reset">
                  <RotateCcw size={15} />
                  {t('breathing.reset', 'Reset')}
                </button>
              </>
            )}
          </div>

          {/* ── MEDIA ── */}
          {selectedPattern.youtube_url && (
            <div className="media-section">
              <div style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={selectedPattern.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedPattern.name}
                />
              </div>
            </div>
          )}

          {selectedPattern.audio_url && !selectedPattern.youtube_url && (
            <div className="audio-card gold-border-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Music size={18} color="#D4AF37" />
                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: '"Cinzel", serif' }}>
                  {t('breathing.guidedAudio', 'Guided Audio')}
                </span>
              </div>
              <audio src={selectedPattern.audio_url} controls style={{ width: '100%' }} />
            </div>
          )}

          <div className="cave-divider"><span>◈</span></div>

          {/* ── PRANAYAMA CAVE GUIDE ── */}
          <div className="cave-guide glass-card">
            <div className="cave-guide-title">🕉 The Cave Teachings</div>
            <div className="cave-guide-sub">Ancient Pranayama · Decoded for the Western Mind</div>
            {CAVE_GUIDE.map((item, i) => (
              <div key={i} className="pranayama-guide-item">
                <div className="guide-number">{i + 1}</div>
                <div className="guide-text">
                  <span className="guide-sanskrit">{item.sanskrit}</span>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── BENEFITS ── */}
          <div className="benefits-section glass-card">
            <div className="benefits-title">
              <Sparkles size={16} color="#D4AF37" />
              {t('breathing.benefits', 'Pranic Benefits')}
            </div>
            {[
              t('breathing.benefit1', 'Activates Parasympathetic — end fight-or-flight instantly'),
              t('breathing.benefit2', 'Improves Prana-Circulation through all 72,000 Nadis'),
              t('breathing.benefit3', 'Promotes deep Yoga Nidra sleep — melatonin + serotonin'),
              t('breathing.benefit4', 'Lowers cortisol — scientifically proven in 4 breaths'),
              t('breathing.benefit5', 'Opens Anahata (heart chakra) — scalar Prema-Pulse transmission'),
            ].map((benefit, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-dot" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* ── ALL PATTERNS LIST (fallback full list) ── */}
          <div className="pattern-list-wrap glass-card">
            <div className="pattern-list-title">
              <Sparkles size={15} color="#D4AF37" />
              {t('breathing.choosePattern', 'All Sacred Patterns')}
            </div>
            <div className="pattern-list-sub">Vedic Breath Sequences</div>
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => { if (!isActive) setSelectedPattern(pattern); }}
                disabled={isActive}
                className={`pattern-item ${selectedPattern.id === pattern.id ? 'selected' : ''} ${isActive ? 'is-disabled' : ''}`}
              >
                <div className="pattern-item-row">
                  <span className="pattern-item-name">
                    {getPatternEmoji(pattern.id, pattern.name)} {pattern.name}
                  </span>
                  <span className="pattern-item-ratio">
                    {pattern.inhale}-{pattern.hold}-{pattern.exhale}{pattern.hold_out > 0 ? `-${pattern.hold_out}` : ''}
                  </span>
                </div>
                <div className="pattern-item-desc">{pattern.description}</div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default Breathing;
