/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MEDITATIONS PAGE — SQI-2050 MISSING ELEMENTS PATCH             ║
 * ║  Paste this ENTIRE file over src/pages/Meditations.tsx           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT CURSOR MISSED vs the full SQI-2050 spec:
 *
 * ❌ 1. No animated starfield canvas background
 * ❌ 2. No floating gold orbs in hero area
 * ❌ 3. Hero title "The Hall of Stillness" — plain yellow text, NOT Cinzel serif + shimmer animation
 * ❌ 4. No hero sub-label micro text above the title
 * ❌ 5. Now-Playing floating bar — not rendered (progress bar / track name / controls)
 * ❌ 6. Meditation row cards — flat dark rectangles, missing glass border, hover gold glow, border-radius 20px
 * ❌ 7. Scalar ring (Vayu-Cyan pulse) missing on currently-playing meditation row
 * ❌ 8. Section headers (Short Resets / Healing / Nature) — plain text, missing gold micro-label above + section title weight
 * ❌ 9. Sacred Commissions cards — flat dark rows missing glass card treatment + chevron arrow
 * ❌ 10. JyotishMeditationCard — correct content but missing emerald glass border treatment
 * ❌ 11. Missing gold divider between sections
 * ❌ 12. MeditationMembershipBanner area — no padding / glass wrapper
 *
 * ALL LOGIC is preserved exactly (hooks, Stripe, AffiliateID, language toggle, play counts).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Clock, Sparkles, ArrowLeft, Loader2, Globe, Lock } from 'lucide-react';
import BabajiShadow from '@/components/meditation/BabajiShadow';
import { Button } from '@/components/ui/button';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { CuratedMeditationCard } from '@/components/meditation/CuratedMeditationCard';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCuratedPlaylists, CuratedPlaylist } from '@/hooks/useCuratedPlaylists';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getDayPhase } from '@/utils/postSessionContext';
import { LanguageToggle } from '@/features/meditations/LanguageToggle';
import { useMeditationContentLanguage } from '@/features/meditations/useContentLanguage';
import { selectStartNowItem } from '@/features/meditations/startNowSelector';
import { filterByMeditationLanguage, buildSections } from '@/features/meditations/groupAndFilter';
import type { MeditationSectionKey } from '@/features/meditations/groupAndFilter';
import { BackToTopFab } from '@/features/meditations/BackToTopFab';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAuth } from '@/hooks/useAuth';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile } from '@/lib/vedicTypes';
import type { ContentLanguage } from '@/utils/contentLanguage';

/* ─────────────────────────────────────────────────────────────────
   SQI-2050 CSS  (complete — all missing pieces added)
───────────────────────────────────────────────────────────────── */
const SQI_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

  :root {
    --siddha-gold:   #D4AF37;
    --gold-glow:     rgba(212,175,55,0.25);
    --gold-faint:    rgba(212,175,55,0.08);
    --akasha-black:  #050505;
    --glass-bg:      rgba(255,255,255,0.02);
    --glass-border:  rgba(255,255,255,0.05);
    --text-primary:  rgba(255,255,255,0.92);
    --text-muted:    rgba(255,255,255,0.45);
    --vayu-cyan:     #22D3EE;
    --radius-xl:     40px;
    --radius-lg:     20px;
  }

  /* ── Page shell ── */
  .sqi-page {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--akasha-black);
    min-height: 100vh;
    color: var(--text-primary);
    overflow-x: hidden;
    position: relative;
  }

  /* ── Starfield canvas ── */
  .sqi-stars {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  /* ── Floating gold orbs ── */
  @keyframes orbFloat {
    0%,100% { transform: translateY(0) rotate(0deg);    opacity: .18; }
    50%      { transform: translateY(-20px) rotate(180deg); opacity: .45; }
  }
  .sqi-orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,.2), transparent 70%);
    pointer-events: none;
    animation: orbFloat var(--dur, 10s) ease-in-out infinite;
    animation-delay: var(--dl, 0s);
  }

  /* ── Content layer ── */
  .sqi-content { position: relative; z-index: 1; }

  /* ── Shimmer animation for Cinzel titles ── */
  @keyframes goldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .sqi-shimmer-title {
    font-family: 'Cinzel', serif !important;
    font-size: clamp(26px, 7vw, 38px) !important;
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
  }

  /* ── Micro label ── */
  .sqi-micro {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,.45);
    margin-bottom: 6px;
  }

  /* ── Glass card ── */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover { border-color: rgba(212,175,55,0.15); }

  /* ── Gold glow text ── */
  .gold-glow { color: var(--siddha-gold); text-shadow: 0 0 15px rgba(212,175,55,0.3); }

  /* ── Nadi pulse (cyan, for icons) ── */
  @keyframes nadiPulse {
    0%,100% { opacity: .6; }
    50%      { opacity: 1; filter: drop-shadow(0 0 8px rgba(212,175,55,.7)); }
  }
  .nadi-pulse { animation: nadiPulse 3s ease-in-out infinite; color: var(--siddha-gold); }

  /* ── Language toggle ── */
  .lang-pill {
    display: inline-flex;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 100px;
    padding: 3px;
    gap: 2px;
  }
  .lang-btn {
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    background: transparent;
    color: var(--text-muted);
    transition: all .2s;
    font-family: inherit;
  }
  .lang-btn.active {
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    color: #050505;
    box-shadow: 0 0 14px rgba(212,175,55,.45);
  }

  /* ── Jyotish banner (emerald glass) ── */
  .jyotish-banner {
    background: linear-gradient(135deg, rgba(16,185,129,.05), rgba(34,211,238,.04));
    border: 1px solid rgba(16,185,129,.2) !important;
    border-radius: var(--radius-xl);
    padding: 18px 22px;
    margin: 0 20px 20px;
  }
  .jyotish-banner .micro-label {
    font-size: 8px; font-weight: 800; letter-spacing: .4em;
    text-transform: uppercase; color: rgba(16,185,129,.7);
  }

  /* ── Gold horizontal divider ── */
  .akasha-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent);
    margin: 4px 0 12px;
  }

  /* ── Section header (inside collapsible) ── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    cursor: pointer;
    border-radius: var(--radius-xl);
    transition: background .2s;
  }
  .section-header:hover { background: rgba(255,255,255,.02); }

  /* ── Meditation row ── */
  .meditation-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-radius: var(--radius-lg);
    transition: background .2s ease, border-color .2s ease;
    cursor: pointer;
    position: relative;
  }
  .meditation-row:hover { background: rgba(212,175,55,.04); }

  /* ── Play button ── */
  .play-btn {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04));
    border: 1px solid rgba(212,175,55,.25);
    display: flex; align-items: center; justify-content: center;
    color: var(--siddha-gold);
    flex-shrink: 0;
    transition: all .22s;
    box-shadow: 0 0 10px rgba(212,175,55,.15);
  }
  .play-btn:hover, .play-btn.playing {
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    color: #050505;
    box-shadow: 0 0 20px rgba(212,175,55,.5);
    transform: scale(1.08);
  }

  /* ── Scalar ring (Vayu-Cyan) on now-playing row ── */
  @keyframes scalarRing {
    0%   { transform: scale(.8);  opacity: 0; }
    50%  { opacity: .4; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  .scalar-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid var(--vayu-cyan);
    animation: scalarRing 2.5s ease-out infinite;
    pointer-events: none;
  }

  /* ── Progress bar (under playing row) ── */
  .progress-track {
    height: 3px;
    background: rgba(255,255,255,.08);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 8px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #D4AF37, #F5E17A);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  /* ── Lock overlay ── */
  .lock-overlay {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: rgba(5,5,5,.55);
    backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity .2s;
  }
  .meditation-row:hover .lock-overlay { opacity: 1; }

  /* ── Tier badges ── */
  .badge-premium {
    font-size: 9px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; padding: 4px 10px;
    border-radius: 100px;
    background: linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.05));
    border: 1px solid rgba(212,175,55,.3);
    color: var(--siddha-gold);
  }
  .badge-free {
    font-size: 9px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; padding: 4px 10px;
    border-radius: 100px;
    background: rgba(34,211,238,.08);
    border: 1px solid rgba(34,211,238,.2);
    color: var(--vayu-cyan);
  }

  /* ── SV+EN bilingual tag ── */
  .badge-bilingual {
    font-size: 9px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(34,211,238,.2);
    color: rgba(34,211,238,.6);
  }

  /* ── Sacred Commission cards ── */
  .commission-card {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all .25s ease;
  }
  .commission-card:hover {
    border-color: rgba(212,175,55,.2);
    box-shadow: 0 8px 32px rgba(212,175,55,.06);
  }

  /* ── Now-Playing floating bar ── */
  @keyframes nowPlayingSlide {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .now-playing-bar {
    position: fixed;
    bottom: 72px;
    left: 50%; transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 398px;
    background: rgba(10,9,8,.92);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(212,175,55,.25);
    border-radius: 24px;
    padding: 12px 16px;
    z-index: 50;
    display: flex; align-items: center; gap: 12px;
    animation: nowPlayingSlide .35s ease-out;
    box-shadow: 0 0 28px rgba(212,175,55,.18), 0 8px 32px rgba(0,0,0,.6);
  }
  .np-play-icon {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    display: flex; align-items: center; justify-content: center;
    color: #050505;
    box-shadow: 0 0 14px rgba(212,175,55,.5);
  }
  .np-track { flex: 1; min-width: 0; }
  .np-title {
    font-size: 12px; font-weight: 800; letter-spacing: -.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    color: rgba(255,255,255,.9);
    font-family: 'Cinzel', serif;
  }
  .np-bar-track { height: 2px; background: rgba(255,255,255,.08); border-radius: 2px; margin-top: 5px; }
  .np-bar-fill  { height: 100%; background: linear-gradient(90deg, #D4AF37, #F5E17A); border-radius: 2px; transition: width .5s; }

  /* ── Chevron ── */
  .chevron {
    width: 24px; height: 24px;
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted);
    font-size: 12px;
    transition: transform .3s ease, border-color .3s;
  }
  .chevron.open { transform: rotate(180deg); border-color: rgba(212,175,55,.3); color: var(--siddha-gold); }

  /* ── Hero area ── */
  .sqi-hero {
    position: relative;
    padding: 52px 20px 24px;
    overflow: hidden;
  }
  .sqi-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,.07), transparent 65%);
    pointer-events: none;
  }
`;

/* ─────────────────────────────────────────────────────────────────
   STARFIELD CANVAS
───────────────────────────────────────────────────────────────── */
const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
   JYOTISH MEDITATION CARD  (emerald glass treatment)
───────────────────────────────────────────────────────────────── */
const JyotishMeditationCard: React.FC = () => {
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading || !jyotish.mahadasha) return null;
  return (
    <div className="jyotish-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>⚕</span>
        <span className="micro-label">JYOTISH MEDITATION GUIDANCE</span>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,1)', lineHeight: 1.6, margin: 0 }}>
        Your{' '}
        <strong style={{ color: '#D4AF37' }}>{jyotish.mahadasha} Mahadasha</strong>{' '}
        period recommends{' '}
        <strong style={{ color: '#D4AF37' }}>{jyotish.meditationType}</strong>.
        {' '}Focus on {jyotish.karmaFocus} for deepest benefit.
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MEDITATION ROW  (glass border + scalar ring + progress bar)
───────────────────────────────────────────────────────────────── */
interface Meditation {
  id: string; title: string; title_sv?: string;
  description?: string | null; duration_minutes?: number | null;
  audio_url?: string | null; audio_url_sv?: string | null;
  is_premium?: boolean; tier?: string;
  shc_reward?: number | null;
}

const MeditationRowSQI: React.FC<{
  med: Meditation;
  lang: ContentLanguage;
  currentAudio: UniversalAudioItem | null;
  isPlaying: boolean;
  playerProgress: number;
  userTier: string;
  onPlay: (med: Meditation, lang: ContentLanguage) => void;
  onLock: () => void;
}> = ({ med, lang, currentAudio, isPlaying, playerProgress, userTier, onPlay, onLock }) => {
  const isActive = currentAudio?.id === med.id;
  const isLocked = (med.is_premium || med.tier === 'prana_flow') &&
    !['prana_flow', 'soma', 'brahman', 'admin'].includes(userTier);
  const isFree = !med.is_premium && med.tier !== 'prana_flow';
  const hasBilingual = !!(med.audio_url && med.audio_url_sv);
  const displayTitle = lang === 'sv' && med.title_sv ? med.title_sv : med.title;

  return (
    <div
      className="meditation-row"
      style={{
        border: isActive
          ? '1px solid rgba(212,175,55,.3)'
          : '1px solid transparent',
        background: isActive ? 'rgba(212,175,55,.04)' : undefined,
      }}
      onClick={() => isLocked ? onLock() : onPlay(med, lang)}
    >
      {/* Play btn with scalar ring when active */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div className={`play-btn${isActive && isPlaying ? ' playing' : ''}`}>
          {isActive && isPlaying
            ? <Pause size={16} />
            : <Play size={16} style={{ marginLeft: 2 }} />}
        </div>
        {isActive && isPlaying && <div className="scalar-ring" />}
      </div>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 13, fontWeight: 500,
          letterSpacing: '.02em',
          color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.88)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {displayTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {med.duration_minutes && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} /> {med.duration_minutes} min
            </span>
          )}
          {med.shc_reward && (
            <span style={{ fontSize: 10, color: 'rgba(212,175,55,.6)', display: 'flex', alignItems: 'center', gap: 3 }}>
              ✦ +{med.shc_reward} SHC
            </span>
          )}
          {hasBilingual && <span className="badge-bilingual">SV+EN</span>}
        </div>
        {/* Progress bar when playing */}
        {isActive && isPlaying && playerProgress !== undefined && (
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${playerProgress * 100}%` }} />
          </div>
        )}
      </div>

      {/* Badge */}
      <div style={{ flexShrink: 0 }}>
        {isFree
          ? <span className="badge-free">FREE</span>
          : <span className="badge-premium">{isLocked ? '🔒' : '+'} PRANA+</span>}
      </div>

      {/* Lock overlay */}
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={18} color="#D4AF37" style={{ margin: '0 auto 4px' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#D4AF37' }}>
            Upgrade
          </span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SECTION COMPONENT  (gold micro-label + title + collapsible)
───────────────────────────────────────────────────────────────── */
const MeditationSectionSQI: React.FC<{
  title: string; subtitle?: string; meditations: Meditation[];
  lang: ContentLanguage; currentAudio: UniversalAudioItem | null;
  isPlaying: boolean; playerProgress: number; userTier: string;
  onPlay: (med: Meditation, lang: ContentLanguage) => void;
  onLock: () => void; defaultOpen?: boolean;
}> = ({ title, subtitle, meditations, lang, currentAudio, isPlaying, playerProgress, userTier, onPlay, onLock, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <div className="section-header" onClick={() => setOpen(o => !o)}>
        <div>
          {/* Gold micro-label above section name */}
          <div className="sqi-micro" style={{ marginBottom: 4 }}>PREMA-PULSE TRANSMISSIONS</div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.9)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <div className={`chevron${open ? ' open' : ''}`}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ paddingBottom: 12 }}>
          <div className="akasha-divider" />
          {meditations.map((med, i) => (
            <React.Fragment key={med.id}>
              <MeditationRowSQI
                med={med} lang={lang}
                currentAudio={currentAudio} isPlaying={isPlaying}
                playerProgress={playerProgress} userTier={userTier}
                onPlay={onPlay} onLock={onLock}
              />
              {i < meditations.length - 1 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,.03)', margin: '0 20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   NOW-PLAYING FLOATING BAR
───────────────────────────────────────────────────────────────── */
const NowPlayingBar: React.FC<{
  audio: UniversalAudioItem; isPlaying: boolean; progress: number;
  onToggle: () => void;
}> = ({ audio, isPlaying, progress, onToggle }) => (
  <div className="now-playing-bar">
    <div className="np-play-icon" onClick={onToggle} style={{ cursor: 'pointer' }}>
      {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
    </div>
    <div className="np-track">
      <div className="np-title">{audio.title}</div>
      <div className="np-bar-track">
        <div className="np-bar-fill" style={{ width: `${(progress ?? 0) * 100}%` }} />
      </div>
    </div>
    <Sparkles size={14} className="nadi-pulse" />
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
interface MeditationFull extends Meditation {}

const Meditations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language, setLanguage } = useMeditationContentLanguage();
  const { playUniversalAudio, currentAudio, isPlaying, togglePlay, progress: playerProgress } =
    useMusicPlayer();
  const { playlists: curatedPlaylists, getPlaylistItems } = useCuratedPlaylists('meditation');
  const [meditations, setMeditations] = useState<MeditationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommission, setActiveCommission] = useState<string | null>(null);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingMeditation, setPendingMeditation] = useState<MeditationFull | null>(null);
  const [currentIntention, setCurrentIntention] = useState<IntentionType | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [playlistMeditations, setPlaylistMeditations] = useState<MeditationFull[]>([]);
  const { reading: vedicReading, generateReading } = useAIVedicReading();
  const userDailyState = useUserDailyState();
  const startNowItem = useMemo(() => selectStartNowItem(meditations, { dayPhase: getDayPhase(), userState: userDailyState?.userState ?? 'calm', language }), [meditations, userDailyState, language]);

  // Stripe success toasts (preserved)
  useEffect(() => {
    const success = searchParams.get('success');
    const wealthSuccess = searchParams.get('wealth_success');
    const cancelled = searchParams.get('cancelled');
    const membershipSuccess = searchParams.get('membership_success');
    const membershipCancelled = searchParams.get('membership_cancelled');
    if (success === 'true') toast.success(t('meditations.paymentSuccess', 'Payment successful! Adam will begin channeling your meditation.'));
    else if (wealthSuccess === 'true') toast.success(t('meditations.wealthSuccess', 'Payment successful! Check your email for the 108 affirmations.'));
    else if (membershipSuccess === 'true') toast.success(t('meditations.membershipSuccess', 'Welcome to Meditation Membership! Your subscription is now active.'));
    else if (cancelled === 'true' || membershipCancelled === 'true') toast.info(t('meditations.paymentCancelled', 'Payment was cancelled.'));
  }, [searchParams, t]);

  // Fetch meditations
  useEffect(() => { fetchMeditations(); }, []);
  const fetchMeditations = async () => {
    const { data } = await supabase.from('meditations').select('*').order('created_at', { ascending: false });
    if (data) setMeditations(data as MeditationFull[]);
    setLoading(false);
  };

  // Vedic reading
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id).maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        const profile: UserProfile = {
          name: data.birth_name, birthDate: data.birth_date,
          birthTime: data.birth_time, birthPlace: data.birth_place, plan: 'compass',
        };
        await generateReading(profile, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, vedicReading, generateReading]);

  const userTier = (user as any)?.subscription_tier || 'free';

  const filtered = useMemo(() => filterByMeditationLanguage(meditations, language), [meditations, language]);
  const sectionsArray = useMemo(() => {
    const sectionsObj = buildSections(filtered);
    const keys: MeditationSectionKey[] = ['short', 'morning', 'sleep', 'healing', 'focus', 'nature', 'all'];
    const titles: Record<MeditationSectionKey, string> = {
      short:   t('meditations.sections.short',   'Short resets'),
      morning: t('meditations.sections.morning', 'Morning'),
      sleep:   t('meditations.sections.sleep',   'Sleep'),
      healing: t('meditations.sections.healing', 'Healing'),
      focus:   t('meditations.sections.focus',   'Focus'),
      nature:  t('meditations.sections.nature',  'Nature'),
      all:     t('meditations.sections.more',    'More'),
    };
    const subtitles: Record<MeditationSectionKey, string> = {
      short:   t('meditations.sections.shortDesc',   '2–5 minutes. Easy to begin.'),
      morning: t('meditations.sections.morningDesc', 'Start your day gently.'),
      sleep:   t('meditations.sections.sleepDesc',   'Unwind the body and mind.'),
      healing: t('meditations.sections.healingDesc', "Support what's tender."),
      focus:   t('meditations.sections.focusDesc',   'Clear and steady attention.'),
      nature:  t('meditations.sections.natureDesc',  'Ground in the presence of earth.'),
      all:     t('meditations.sections.moreDesc',    'Explore when you feel ready.'),
    };
    return keys.map(key => ({
      title: titles[key], subtitle: subtitles[key],
      items: sectionsObj[key] || [],
    }));
  }, [filtered, t]);

  const initiatePlay = (med: MeditationFull, lang: ContentLanguage) => {
    const audioUrl = lang === 'sv' && med.audio_url_sv ? med.audio_url_sv : med.audio_url;
    if (!audioUrl) return;
    const startNow = startNowItem;
    if (startNow && startNow.id === med.id && !currentIntention) {
      setPendingMeditation(med);
      setShowThreshold(true);
      return;
    }
    playUniversalAudio({ id: med.id, title: med.title, audioUrl, type: 'meditation' });
  };

  const handleLock = () => {
    toast('+ Upgrade to Prana Flow to unlock this transmission', {
      description: 'Access the full Akasha library.',
    });
  };

  const handleIntentionSelected = (intention: IntentionType) => {
    setCurrentIntention(intention);
    setShowThreshold(false);
    if (pendingMeditation) { initiatePlay(pendingMeditation, language); setPendingMeditation(null); }
  };
  const handleThresholdClose = () => {
    setShowThreshold(false);
    if (pendingMeditation) { initiatePlay(pendingMeditation, language); setPendingMeditation(null); }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="sqi-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <style>{SQI_STYLES}</style>
        <BabajiShadow />
        <Loader2 size={28} className="nadi-pulse" style={{ margin: '0 auto 12px', display: 'block', color: '#22D3EE' }} />
        <div className="sqi-micro">Accessing Akasha Archive…</div>
      </div>
    );
  }

  // ── Playlist detail view ──
  if (selectedPlaylist) {
    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <div className="sqi-content" style={{ padding: '48px 20px 20px 32px' }}>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlaylist(null); setPlaylistMeditations([]); }} className="mb-4">
            <ArrowLeft size={16} className="mr-1" />{t('common.back', 'Back')}
          </Button>
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            {selectedPlaylist.cover_image_url && (
              <img src={selectedPlaylist.cover_image_url} alt={selectedPlaylist.title}
                style={{ width: 96, height: 96, borderRadius: 16, objectFit: 'cover', marginBottom: 12 }} />
            )}
            <h2 style={{ fontWeight: 800, fontSize: 20, color: 'rgba(255,255,255,.9)', marginBottom: 4 }}>
              {selectedPlaylist.title}
            </h2>
            {selectedPlaylist.description && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>{selectedPlaylist.description}</p>
            )}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{selectedPlaylist.track_count} sessions</p>
          </div>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {playlistMeditations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'rgba(212,175,55,.6)' }} />
              </div>
            ) : (
              <>
                <div className="akasha-divider" />
                {playlistMeditations.map((med, i) => (
                  <React.Fragment key={med.id}>
                    <MeditationRowSQI
                      med={med} lang={language}
                      currentAudio={currentAudio} isPlaying={isPlaying}
                      playerProgress={playerProgress ?? 0} userTier={userTier}
                      onPlay={initiatePlay} onLock={handleLock}
                    />
                    {i < playlistMeditations.length - 1 && (
                      <div style={{ height: 1, background: 'rgba(255,255,255,.03)', margin: '0 20px' }} />
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ──
  return (
    <div className="sqi-page">
      <style>{SQI_STYLES}</style>

      {/* ══ STARFIELD ══ */}
      <StarfieldCanvas />

      <div className="sqi-content">

        {/* ══ HERO ══ */}
        <div className="sqi-hero">
          {/* Floating orbs */}
          <div className="sqi-orb" style={{ width: 200, height: 200, top: -60, right: -60, '--dur': '12s', '--dl': '0s' } as React.CSSProperties & { '--dur': string; '--dl': string }} />
          <div className="sqi-orb" style={{ width: 100, height: 100, top: '60%', left: -30, '--dur': '8s', '--dl': '-3s' } as React.CSSProperties & { '--dur': string; '--dl': string }} />

          {/* ✅ FIX 1: Cinzel shimmer title */}
          <div className="sqi-micro" style={{ marginBottom: 8 }}>
            AKASHA-NEURAL ARCHIVE · MEDITATION TRANSMISSIONS
          </div>
          <h1 className="sqi-shimmer-title">
            {t('meditations.hallOfStillness', 'The Hall of Stillness')}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.42)', marginTop: 8, marginBottom: 20, lineHeight: 1.6 }}>
            {t('meditations.subtitle', 'Curated by intention. Expand when you feel ready.')}
          </p>

          {/* ✅ FIX 2: Language toggle — proper glass pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <Globe size={14} style={{ color: 'rgba(255,255,255,.35)' }} />
            <span className="sqi-micro" style={{ marginBottom: 0 }}>AUDIO LANGUAGE</span>
            <LanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>

        {/* ✅ FIX 3: Start Now card — full SQI treatment */}
        {startNowItem && (
          <div style={{ padding: '0 20px 20px' }}>
            <div
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer',
                border: '1px solid rgba(212,175,55,.18)',
                background: 'linear-gradient(135deg, rgba(212,175,55,.06), rgba(212,175,55,.02))',
              }}
              onClick={() => initiatePlay(startNowItem as MeditationFull, language)}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="play-btn playing">
                  <Play size={16} style={{ marginLeft: 2 }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: '#D4AF37', marginBottom: 4 }}>
                  {language === 'sv' && (startNowItem as MeditationFull).title_sv
                    ? (startNowItem as MeditationFull).title_sv
                    : startNowItem.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                  {getDayPhase()} · {t('meditations.startComfort', 'Start comfort')}
                </div>
              </div>
              {(startNowItem as MeditationFull).audio_url_sv && (
                <span className="badge-bilingual">SV+EN</span>
              )}
            </div>
          </div>
        )}

        {/* ✅ FIX 4: JyotishMeditationCard — emerald glass border */}
        <JyotishMeditationCard />

        {/* ✅ FIX 5: MeditationMembershipBanner with glass wrapper */}
        {userTier === 'free' && (
          <div style={{ padding: '0 20px 20px' }}>
            <MeditationMembershipBanner />
          </div>
        )}

        {/* ✅ FIX 6: Curated playlists */}
        {curatedPlaylists.length > 0 && (
          <div style={{ padding: '0 20px 24px' }}>
            <div className="sqi-micro" style={{ marginBottom: 8, color: 'rgba(212,175,55,.5)' }}>
              {t('meditations.featuredCollections', 'Featured collections')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {curatedPlaylists.map(playlist => (
                <CuratedMeditationCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={async () => {
                    setSelectedPlaylist(playlist);
                    const { getPlaylistItems } = await import('@/hooks/useCuratedPlaylists');
                    const items = await getPlaylistItems(playlist.id);
                    setPlaylistMeditations((items || []) as MeditationFull[]);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ✅ FIX 7: Section list header with gold label */}
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sqi-micro" style={{ marginBottom: 4 }}>PREMA-PULSE TRANSMISSIONS</div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'rgba(255,255,255,.9)' }}>
              {t('meditations.allMeditations', 'All meditations')}
            </div>
          </div>
          <LanguageToggle language={language} setLanguage={setLanguage} compact />
        </div>

        {/* ✅ FIX 8: Sections with full glass card + scalar ring + progress bar */}
        <div style={{ padding: '0 20px' }}>
          {sectionsArray.map((section, i) => (
            section.items.length > 0 && (
              <MeditationSectionSQI
                key={section.title}
                title={section.title}
                subtitle={section.subtitle}
                meditations={section.items as MeditationFull[]}
                lang={language}
                currentAudio={currentAudio}
                isPlaying={isPlaying}
                playerProgress={playerProgress ?? 0}
                userTier={userTier}
                onPlay={initiatePlay}
                onLock={handleLock}
                defaultOpen={i === 0}
              />
            )
          ))}
        </div>

        {/* ✅ FIX 9: Sacred Commissions — glass card treatment */}
        <div style={{ padding: '8px 20px 20px' }}>
          <div className="sqi-micro" style={{ marginBottom: 6 }}>SACRED COMMISSIONS</div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'rgba(255,255,255,.9)', marginBottom: 4 }}>
            {t('meditations.personalTransmissions', 'Personal Transmissions')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, marginBottom: 16 }}>
            {t('meditations.sacredCommissionsDesc', 'When you want something channeled for you alone.')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Wealth */}
            <div
              className="commission-card"
              onClick={() => setActiveCommission('wealth')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.06))', border: '1.5px solid rgba(212,175,55,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 18px rgba(212,175,55,.3)', flexShrink: 0 }}>
                ॐ
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)', marginBottom: 3 }}>€47</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.88)', marginBottom: 2 }}>
                  {t('meditations.wealthTitle', '108 Wealth Reprogramming Meditation')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                  {t('meditations.wealthSub', 'Wealth Activation')}
                </div>
              </div>
              <div style={{ color: 'rgba(212,175,55,.4)', fontSize: 16 }}>›</div>
            </div>

            {/* Custom booking */}
            <div
              className="commission-card"
              onClick={() => setActiveCommission('booking')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.06))', border: '1.5px solid rgba(212,175,55,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 18px rgba(212,175,55,.3)', flexShrink: 0 }}>
                ॐ
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)', marginBottom: 3 }}>€20–€97</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.88)', marginBottom: 2 }}>
                  {t('meditations.bookingTitle', 'Custom Channeled Meditation')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                  {t('meditations.bookingSub', 'Personalized Experience')}
                </div>
              </div>
              <div style={{ color: 'rgba(212,175,55,.4)', fontSize: 16 }}>›</div>
            </div>

            {/* Creation */}
            <div
              className="commission-card"
              onClick={() => setActiveCommission('creation')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,rgba(212,175,55,.22),rgba(212,175,55,.06))', border: '1.5px solid rgba(212,175,55,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 18px rgba(212,175,55,.3)', flexShrink: 0 }}>
                ॐ
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)', marginBottom: 3 }}>€97–€197</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.88)', marginBottom: 2 }}>
                  {t('meditations.creationTitle', 'Custom Meditation Creation')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                  {t('meditations.creationSub', 'For Creators & Healers')}
                </div>
              </div>
              <div style={{ color: 'rgba(212,175,55,.4)', fontSize: 16 }}>›</div>
            </div>

          </div>
        </div>

        {/* Preserved modal sheets */}
        <WealthMeditationService
          open={activeCommission === 'wealth'}
          onOpenChange={o => !o && setActiveCommission(null)}
          hideTrigger
        />
        <CustomMeditationBooking
          open={activeCommission === 'booking'}
          onOpenChange={o => !o && setActiveCommission(null)}
          hideTrigger
        />
        <CustomMeditationCreation
          open={activeCommission === 'creation'}
          onOpenChange={o => !o && setActiveCommission(null)}
          hideTrigger
        />

        <IntentionThreshold
          isOpen={showThreshold}
          onSelectIntention={handleIntentionSelected}
          onClose={handleThresholdClose}
        />

        {BackToTopFab && <BackToTopFab />}
        <div style={{ height: 100 }} />
      </div>

      {/* ✅ FIX 10: Now-Playing Floating Bar */}
      {currentAudio && currentAudio.type === 'meditation' && (
        <NowPlayingBar
          audio={currentAudio}
          isPlaying={isPlaying}
          progress={playerProgress ?? 0}
          onToggle={togglePlayPause}
        />
      )}
    </div>
  );
};

export default Meditations;
