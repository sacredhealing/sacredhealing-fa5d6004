import{i as R,r as o,j as e}from"./vendor-react-DdWqvjvq.js";import{u as B}from"./useSiteContent-DrtXRrOo.js";import{A as T,S as q}from"./SacredBreathingGuide-Cr82_DN9.js";import{s as _}from"./index-DPalQnOV.js";import{u as O}from"./vendor-i18n-CLO2ZSBh.js";import{A as H,W as Y,a as y,g as $,z as M,c as V,P as G,aZ as K,M as J}from"./vendor-icons-DQ9y02-X.js";import"./vendor-crypto-Cz0s2Wb9.js";import"./slider-B84ob8FC.js";import"./vendor-radix-E_JnJsxb.js";import"./vendor-motion-BWTr00U0.js";import"./vendor-query-DDdS-q50.js";import"./vendor-supabase-C8XXFrAR.js";const U=`
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
`,W=[{sanskrit:"PRANAYAMA",title:"What is Pranayama?",desc:"Prana means 'life force energy' — the breath is your bridge between body and soul. Pranayama is the ancient Vedic science of directing this energy through conscious breathing."},{sanskrit:"NADI SHODHANA",title:"Alternate Nostril Breathing",desc:"Balances left & right hemispheres of the brain. Close your right nostril, inhale left. Close left, exhale right. Switch. Like charging a battery — calms anxiety in 3 minutes."},{sanskrit:"KAPALABHATI",title:"Skull-Shining Breath",desc:"Short, sharp exhales through the nose with passive inhales. Clears stale prana from your lungs, activates solar plexus energy, sharpens mental clarity instantly."},{sanskrit:"BHRAMARI",title:"Humming Bee Breath",desc:"Inhale deeply, then hum like a bee on the exhale. The vibration stimulates the vagus nerve, drops cortisol, and activates Anahata (heart chakra) healing."},{sanskrit:"UJJAYI",title:"Ocean Victory Breath",desc:"Breathe through the nose with a slight constriction in the throat, creating an ocean sound. Used in yoga — heats the body, builds focus, and activates the parasympathetic system."}],z=[{id:"box",name:"Box Breathing",description:"Equal counts for calm and focus. Used by Navy SEALs.",inhale:4,hold:4,exhale:4,hold_out:4,cycles:4}],C=(t,s)=>t==="box"?"◻️":s.toLowerCase().includes("4-7-8")||s.toLowerCase().includes("relaxation")?"🌙":s.toLowerCase().includes("energiz")||s.toLowerCase().includes("kapalbhati")?"⚡":s.toLowerCase().includes("calm")?"🌊":s.toLowerCase().includes("crown")||s.toLowerCase().includes("pump")?"🔱":s.toLowerCase().includes("nadi")||s.toLowerCase().includes("nostril")?"☯️":s.toLowerCase().includes("ocean")||s.toLowerCase().includes("ujjayi")?"🌊":"🕉️",de=()=>{const{t}=O(),s=R(),{content:x}=B(["breathing_title","breathing_subtitle","breathing_description"]),[v,S]=o.useState(z),[r,b]=o.useState(z[0]),[n,w]=o.useState(!1),[l,c]=o.useState("idle"),[P,h]=o.useState(0),[m,u]=o.useState(0),[j,k]=o.useState(0),d=o.useRef(null);o.useEffect(()=>{(async()=>{const{data:i,error:p}=await _.from("breathing_patterns").select("*").eq("is_active",!0).order("order_index",{ascending:!0});!p&&i&&i.length>0&&(S(i),b(i[0]))})()},[]);const E={inhale:t("breathing.inhale","Breathe In"),hold:t("breathing.hold","Hold"),exhale:t("breathing.exhale","Breathe Out"),holdOut:t("breathing.holdOut","Hold"),idle:t("breathing.ready","Ready")},N=a=>{const i=r;switch(a){case"inhale":return i.hold>0?"hold":"exhale";case"hold":return"exhale";case"exhale":return i.hold_out>0?"holdOut":"inhale";case"holdOut":return"inhale";default:return"inhale"}},A=a=>{switch(a){case"inhale":return r.inhale;case"hold":return r.hold;case"exhale":return r.exhale;case"holdOut":return r.hold_out;default:return 0}},D=()=>{w(!0),u(1),c("inhale"),h(r.inhale),k(0)},f=()=>{w(!1),c("idle"),h(0),u(0),d.current&&clearInterval(d.current)},F=()=>{f()};o.useEffect(()=>{if(n)return d.current=setInterval(()=>{k(a=>a+1),h(a=>{if(a<=1){const i=N(l),p=A(i);if(i==="inhale"&&l!=="idle"){if(m>=r.cycles)return f(),0;u(g=>g+1)}if(p===0){const g=N(i);return c(g),A(g)}return c(i),p}return a-1})},1e3),()=>{d.current&&clearInterval(d.current)}},[n,l,m,r]);const I=`orb-${l}`,L=`scale-${l}`;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:U}),e.jsx("div",{className:"sqi-page",children:e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"cave-header",children:[e.jsxs("div",{className:"back-nav",children:[e.jsxs("button",{onClick:()=>s(-1),className:"back-btn",children:[e.jsx(H,{size:14}),e.jsx("span",{children:t("common.back","Back")})]}),e.jsx("button",{onClick:()=>s("/dashboard"),className:"temple-btn",children:"✦ Return to Temple"})]}),e.jsxs("div",{className:"hero-header",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14},children:[e.jsx("div",{className:"hero-icon-wrap",children:e.jsx(Y,{size:28,color:"#D4AF37"})}),e.jsxs("div",{className:"hero-titles",children:[e.jsx("h1",{children:x.breathing_title||"Pranayama Cave"}),e.jsx("p",{children:x.breathing_subtitle||"Sacred Breath · Vedic Light-Codes"})]})]}),e.jsx(T,{})]})]}),e.jsxs("div",{className:"access-badges",children:[e.jsx("span",{className:"badge badge-free",children:"✓ Free Access"}),e.jsx("span",{className:"badge badge-prana",children:"✦ Prana Flow Included"})]}),e.jsx("div",{className:"intro-banner glass-card",children:e.jsx("p",{children:x.breathing_description||e.jsxs(e.Fragment,{children:["Enter the ",e.jsx("strong",{children:"Cave of Pranayama"})," — where breath becomes Bhakti-Algorithm. Each inhale draws cosmic Prana. Each exhale releases karmic density. ",e.jsx("strong",{children:"Anahata opens. Healing flows."})]})})}),e.jsx("div",{className:"cave-divider",children:e.jsx("span",{children:"🕉"})}),e.jsxs("div",{className:"kriya-portal",children:[e.jsxs("div",{className:"kriya-portal-title",children:[e.jsx(y,{size:18,color:"#D4AF37"}),"Siddha Kriya Portal"]}),e.jsx("div",{className:"kriya-portal-sub",children:"Sync breath with the orb · Awaken the Kundalini · Release the Karma"}),e.jsx(q,{inhaleSeconds:4,exhaleSeconds:4})]}),e.jsx("div",{style:{margin:"0 20px 8px",padding:"0"},children:e.jsx("span",{className:"section-label",children:"⬡ Choose Your Kriya"})}),e.jsx("div",{className:"cave-grid",children:v.map(a=>e.jsxs("button",{onClick:()=>{n||b(a)},disabled:n,className:`cave-technique-card ${r.id===a.id?"active":""} ${n?"disabled":""}`,children:[r.id===a.id&&e.jsx("div",{className:"active-glow-dot"}),e.jsx("span",{className:"technique-emoji",children:C(a.id,a.name)}),e.jsx("div",{className:"technique-name",children:a.name}),e.jsx("div",{className:"technique-desc",children:a.description}),e.jsxs("div",{className:"technique-ratio",children:[a.inhale,"-",a.hold,"-",a.exhale,a.hold_out>0?`-${a.hold_out}`:""]})]},a.id))}),e.jsxs("div",{className:"timer-section glass-card",children:[e.jsx("div",{className:"timer-section-title",children:"Prana Flow Timer"}),e.jsxs("div",{className:"timer-circle-wrap",children:[e.jsx("div",{className:`timer-orb ${I} ${L}`,children:e.jsxs("div",{className:"orb-inner-text",children:[e.jsx("span",{className:"orb-phase-label",children:E[l]}),n&&e.jsx("span",{className:"orb-countdown",children:P})]})}),n&&e.jsxs("div",{className:"timer-stats",children:[e.jsxs("div",{className:"timer-stat",children:[e.jsx($,{size:13,color:"#D4AF37"}),e.jsxs("span",{children:[t("breathing.cycle","Cycle")," ",m,"/",r.cycles]})]}),e.jsxs("div",{className:"timer-stat",children:[e.jsx(M,{size:13,color:"rgba(255,255,255,0.4)"}),e.jsxs("span",{children:[Math.floor(j/60),":",(j%60).toString().padStart(2,"0")]})]})]})]})]}),e.jsx("div",{className:"controls-row",children:n?e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:f,className:"btn-stop",children:[e.jsx(G,{size:16}),t("breathing.stop","Stop")]}),e.jsxs("button",{onClick:F,className:"btn-reset",children:[e.jsx(K,{size:15}),t("breathing.reset","Reset")]})]}):e.jsxs("button",{onClick:D,className:"btn-begin",children:[e.jsx(V,{size:16}),"Begin the Kriya"]})}),r.youtube_url&&e.jsx("div",{className:"media-section",children:e.jsx("div",{style:{aspectRatio:"16/9"},children:e.jsx("iframe",{src:r.youtube_url.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/"),style:{width:"100%",height:"100%",border:"none"},allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullScreen:!0,title:r.name})})}),r.audio_url&&!r.youtube_url&&e.jsxs("div",{className:"audio-card gold-border-card",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:12},children:[e.jsx(J,{size:18,color:"#D4AF37"}),e.jsx("span",{style:{fontWeight:700,color:"rgba(255,255,255,0.8)",fontSize:14,fontFamily:'"Cinzel", serif'},children:t("breathing.guidedAudio","Guided Audio")})]}),e.jsx("audio",{src:r.audio_url,controls:!0,style:{width:"100%"}})]}),e.jsx("div",{className:"cave-divider",children:e.jsx("span",{children:"◈"})}),e.jsxs("div",{className:"cave-guide glass-card",children:[e.jsx("div",{className:"cave-guide-title",children:"🕉 The Cave Teachings"}),e.jsx("div",{className:"cave-guide-sub",children:"Ancient Pranayama · Decoded for the Western Mind"}),W.map((a,i)=>e.jsxs("div",{className:"pranayama-guide-item",children:[e.jsx("div",{className:"guide-number",children:i+1}),e.jsxs("div",{className:"guide-text",children:[e.jsx("span",{className:"guide-sanskrit",children:a.sanskrit}),e.jsx("h4",{children:a.title}),e.jsx("p",{children:a.desc})]})]},i))]}),e.jsxs("div",{className:"benefits-section glass-card",children:[e.jsxs("div",{className:"benefits-title",children:[e.jsx(y,{size:16,color:"#D4AF37"}),t("breathing.benefits","Pranic Benefits")]}),[t("breathing.benefit1","Activates Parasympathetic — end fight-or-flight instantly"),t("breathing.benefit2","Improves Prana-Circulation through all 72,000 Nadis"),t("breathing.benefit3","Promotes deep Yoga Nidra sleep — melatonin + serotonin"),t("breathing.benefit4","Lowers cortisol — scientifically proven in 4 breaths"),t("breathing.benefit5","Opens Anahata (heart chakra) — scalar Prema-Pulse transmission")].map((a,i)=>e.jsxs("div",{className:"benefit-item",children:[e.jsx("div",{className:"benefit-dot"}),e.jsx("span",{children:a})]},i))]}),e.jsxs("div",{className:"pattern-list-wrap glass-card",children:[e.jsxs("div",{className:"pattern-list-title",children:[e.jsx(y,{size:15,color:"#D4AF37"}),t("breathing.choosePattern","All Sacred Patterns")]}),e.jsx("div",{className:"pattern-list-sub",children:"Vedic Breath Sequences"}),v.map(a=>e.jsxs("button",{onClick:()=>{n||b(a)},disabled:n,className:`pattern-item ${r.id===a.id?"selected":""} ${n?"is-disabled":""}`,children:[e.jsxs("div",{className:"pattern-item-row",children:[e.jsxs("span",{className:"pattern-item-name",children:[C(a.id,a.name)," ",a.name]}),e.jsxs("span",{className:"pattern-item-ratio",children:[a.inhale,"-",a.hold,"-",a.exhale,a.hold_out>0?`-${a.hold_out}`:""]})]}),e.jsx("div",{className:"pattern-item-desc",children:a.description})]},a.id))]})]})})]})};export{de as default};
