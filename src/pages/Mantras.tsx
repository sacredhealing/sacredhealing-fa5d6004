/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SIDDHA-QUANTUM INTELLIGENCE — MANTRAS PAGE  SQI-2050 REDESIGN ║
 * ║  Bhakti-Algorithm v7.3 | Vedic Light-Codes | Anahata: OPEN      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ✅ ALL functional logic preserved (Bhrigu, Hora, 108 audio, Jyotish, SHC awards)
 * ✅ Planet theming, gold-aura, mantra selection — untouched
 * ✅ Glassmorphism · Siddha-Gold #D4AF37 · Akasha-Black #050505 · 40px radius
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getTierRank } from '@/lib/tierAccess';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';
import { Play, Pause, RotateCcw, ChevronDown, Sparkles } from 'lucide-react';
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

/* ─────────────────────────────────────────────────────
   INLINE SQI-2050 STYLES
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
    --muted:   rgba(255,255,255,0.42);
    --cyan:    #22D3EE;
    --r40:     40px;
  }

  .sqi-mantras {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--black);
    min-height: 100vh;
    color: rgba(255,255,255,0.9);
    overflow-x: hidden;
  }

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
    padding: 52px 22px 28px;
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

  .m-bhrigu {
    margin: 0 22px 16px;
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

  .m-hora { margin: 0 22px 20px; padding: 18px 24px; }
  .m-hora-timer {
    font-size: 22px; font-weight: 900; letter-spacing: -.04em;
    color: var(--gold); font-variant-numeric: tabular-nums;
  }

  .m-two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 22px;
  }
  @media (min-width: 640px) {
    .m-two-col { grid-template-columns: 164px 1fr; }
  }

  .m-mantra-item {
    width: 100%;
    text-align: left;
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all .22s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: inherit;
  }
  .m-mantra-item:hover { border-color: rgba(212,175,55,.18); }
  .m-mantra-item.m-selected {
    border-color: rgba(212,175,55,.35);
    background: linear-gradient(135deg, rgba(212,175,55,.07), rgba(212,175,55,.02));
    box-shadow: 0 0 20px rgba(212,175,55,.08);
  }
  .m-mantra-item.m-gold-aura {
    border-color: rgba(212,175,55,.55);
    background: linear-gradient(135deg, rgba(212,175,55,.16), rgba(255,230,120,.08) 50%, rgba(212,175,55,.06));
    animation: goldPulse 2.6s ease-in-out infinite;
  }
  @keyframes goldPulse {
    0%, 100% {
      border-color: rgba(212,175,55,.45);
      box-shadow: inset 0 0 24px rgba(212,175,55,.08), 0 0 22px rgba(212,175,55,.2), 0 0 48px rgba(212,175,55,.08);
    }
    50% {
      border-color: rgba(212,175,55,.85);
      box-shadow: inset 0 0 36px rgba(212,175,55,.14), 0 0 40px rgba(212,175,55,.42), 0 0 72px rgba(212,175,55,.15);
    }
  }
  .m-planet-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }

  .m-practice {
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: var(--r40);
    overflow: hidden;
  }
  .m-mantra-banner {
    position: relative;
    padding: 28px 16px 22px;
    background: linear-gradient(135deg, rgba(212,175,55,.06), rgba(180,120,20,.03));
    border-bottom: 1px solid var(--border);
    overflow: hidden;
  }
  .m-mantra-banner::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,.07), transparent 70%);
  }
  .m-mantra-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(17px, 4vw, 24px);
    font-weight: 600;
    letter-spacing: .04em;
    text-align: center;
    margin-bottom: 12px;
  }
  .m-tag {
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; padding: 5px 12px;
    border-radius: 100px;
  }

  .m-counter-ring { transform: rotate(-90deg); }
  .m-counter-track { fill: none; stroke: rgba(255,255,255,.06); stroke-width: 3; }
  .m-counter-fill {
    fill: none; stroke-width: 3; stroke-linecap: round;
    stroke: url(#goldGradMantra);
    filter: drop-shadow(0 0 6px rgba(212,175,55,.45));
    transition: stroke-dashoffset .35s ease;
  }

  .m-btn-start {
    flex: 1; padding: 14px 0; border-radius: 100px;
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
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--glass); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); font-size: 15px;
    transition: all .2s; font-family: inherit;
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
`;

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

function getPlanetTheme(p?: string | null) {
  const n = p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
  const themes: Record<string, { gradient: string; border: string; iconBg: string; iconColor: string; badge: string }> = {
    Sun:     { gradient: 'from-amber-900/60 via-orange-800/40 to-black/60', border: 'border-amber-500/50', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    Moon:    { gradient: 'from-slate-700/60 via-blue-900/40 to-black/60', border: 'border-blue-300/50', iconBg: 'bg-blue-300/20', iconColor: 'text-blue-200', badge: 'bg-blue-300/20 text-blue-200 border-blue-300/40' },
    Mars:    { gradient: 'from-red-900/60 via-red-800/40 to-black/60', border: 'border-red-500/50', iconBg: 'bg-red-500/20', iconColor: 'text-red-300', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
    Mercury: { gradient: 'from-emerald-900/60 via-green-800/40 to-black/60', border: 'border-emerald-500/50', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    Jupiter: { gradient: 'from-yellow-900/60 via-amber-800/40 to-black/60', border: 'border-yellow-400/50', iconBg: 'bg-yellow-400/20', iconColor: 'text-yellow-200', badge: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40' },
    Venus:   { gradient: 'from-pink-900/60 via-rose-800/40 to-black/60', border: 'border-pink-400/50', iconBg: 'bg-pink-400/20', iconColor: 'text-pink-300', badge: 'bg-pink-400/20 text-pink-300 border-pink-400/40' },
    Saturn:  { gradient: 'from-indigo-900/60 via-violet-900/40 to-black/60', border: 'border-indigo-400/50', iconBg: 'bg-indigo-400/20', iconColor: 'text-indigo-300', badge: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40' },
    Rahu:    { gradient: 'from-gray-900/60 via-slate-800/40 to-black/60', border: 'border-gray-400/50', iconBg: 'bg-gray-400/20', iconColor: 'text-gray-300', badge: 'bg-gray-400/20 text-gray-300 border-gray-400/40' },
    Ketu:    { gradient: 'from-orange-900/60 via-amber-900/40 to-black/60', border: 'border-orange-400/50', iconBg: 'bg-orange-400/20', iconColor: 'text-orange-300', badge: 'bg-orange-400/20 text-orange-300 border-orange-400/40' },
    default: { gradient: 'from-cyan-900/60 via-cyan-800/40 to-black/60', border: 'border-cyan-500/40', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  };
  return themes[n] || themes.default;
}

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

/** Above typical single-chant loop length → one file holds ~108 chants; advance counter with playback position. */
const SINGLE_FILE_108_MIN_DURATION_SEC = 25;

function isSingleFile108Track(durationSec: number): boolean {
  return Number.isFinite(durationSec) && durationSec >= SINGLE_FILE_108_MIN_DURATION_SEC;
}

const Mantras = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const { refreshBalance } = useSHCBalance();

  const [mantras, setMantras] = useState<MantraItem[]>([]);
  const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listExpanded, setListExpanded] = useState(true);
  const [userTimezone] = useState<string>('Europe/Stockholm');
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentMantraIdRef = useRef<string | null>(null);
  const mantraPlaybackCleanupRef = useRef<(() => void) | null>(null);

  const clearMantraPlaybackListeners = () => {
    mantraPlaybackCleanupRef.current?.();
    mantraPlaybackCleanupRef.current = null;
  };

  const formatDurationMinutes = (minutes: number): string => {
    if (!Number.isFinite(minutes) || minutes <= 0) return '';
    const rounded = Math.round(minutes);
    return rounded === 1 ? t('mantras.durationMin') : t('mantras.durationMins', { count: rounded });
  };

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

  // Auto-generate Vedic reading when user is logged in
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
    const userRank = getTierRank(tier);
    getMantras({ userRank, isAdmin }).then((data) => {
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
    }).catch((err) => {
      if (!cancelled) {
        toast.error(t('mantras.errorFetch'));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [tier, isAdmin, jyotishRecommendation?.recommendedMantraId, dashaPlanet]);

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

  /* ── Pre-fetch remedy audio ── */
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

  const awardMantraReward = async (mantra: MantraItem) => {
    if (!user) return;
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('mantra_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('mantra_id', mantra.id)
        .gte('completed_at', twentyFourHoursAgo)
        .limit(1);
      if (recent?.length) return;
      await supabase.from('mantra_completions').insert({ user_id: user.id, mantra_id: mantra.id, shc_earned: mantra.shc_reward });
      const { data: bal } = await supabase.from('user_balances').select('balance, total_earned').eq('user_id', user.id).maybeSingle();
      if (bal) {
        await supabase.from('user_balances').update({ balance: bal.balance + mantra.shc_reward, total_earned: bal.total_earned + mantra.shc_reward }).eq('user_id', user.id);
      }
      await supabase.from('shc_transactions').insert({ user_id: user.id, type: 'earned', amount: mantra.shc_reward, description: `Mantra: ${mantra.title}`, status: 'completed' });
      toast.success(t('mantras.shcEarnedToast', { amount: mantra.shc_reward }));
      refreshBalance();
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
    } catch (e) {
      console.error(e);
    }
  };

  const playNextRep = (mantra: MantraItem) => {
    if (!mantra.audio_url) return;
    clearMantraPlaybackListeners();
    const url = getPlayableUrl(mantra.audio_url);
    currentMantraIdRef.current = mantra.id;

    const el = audioEngine.play(url, undefined, {
      onPlayError: () => toast.error(t('mantras.errorAudioPlay')),
    });

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
          if (n !== lastSyncedCount) {
            lastSyncedCount = n;
            setCount(n);
          }
        };
        const onFullEnd = () => {
          clearMantraPlaybackListeners();
          lastSyncedCount = reps;
          setCount(reps);
          setIsPlaying(false);
          setCompleted(true);
          currentMantraIdRef.current = null;
          audioEngine.stop();
          if (user) void awardMantraReward(mantra);
        };
        el.addEventListener('timeupdate', onTime);
        el.addEventListener('ended', onFullEnd, { once: true });
        bundle.modeDetach = () => {
          el.removeEventListener('timeupdate', onTime);
          el.removeEventListener('ended', onFullEnd);
        };
        onTime();
      } else {
        const onShortEnded = () => {
          setCount((c) => {
            const next = c + 1;
            if (next >= reps) {
              setIsPlaying(false);
              setCompleted(true);
              currentMantraIdRef.current = null;
              clearMantraPlaybackListeners();
              audioEngine.stop();
              if (user) void awardMantraReward(mantra);
              return reps;
            }
            const cur = audioEngine.getCurrent();
            if (cur) {
              cur.currentTime = 0;
              void cur.play().catch(() => {});
            }
            return next;
          });
        };
        el.addEventListener('ended', onShortEnded);
        bundle.modeDetach = () => {
          el.removeEventListener('ended', onShortEnded);
        };
      }
    };

    mantraPlaybackCleanupRef.current = () => {
      bundle.modeDetach?.();
      bundle.modeDetach = undefined;
      el.removeEventListener('loadedmetadata', attachPlaybackMode);
      el.removeEventListener('durationchange', attachPlaybackMode);
    };

    el.addEventListener('loadedmetadata', attachPlaybackMode);
    el.addEventListener('durationchange', attachPlaybackMode);
    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      queueMicrotask(attachPlaybackMode);
    }
  };

  const handleStart = () => {
    if (!currentMantra?.audio_url) {
      toast.error(t('mantras.noAudio'));
      return;
    }
    if (count >= reps) setCount(0);
    if (
      audioEngine.getCurrent() &&
      currentMantraIdRef.current === currentMantra.id &&
      count < reps
    ) {
      if (audioEngine.isPlaying()) return;
      setIsPlaying(true);
      audioEngine.resume();
      return;
    }
    setIsPlaying(true);
    setCompleted(false);
    playNextRep(currentMantra);
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleReset = () => {
    clearMantraPlaybackListeners();
    audioEngine.stop();
    currentMantraIdRef.current = null;
    setCount(0);
    setIsPlaying(false);
    setCompleted(false);
  };

  const handleRestartFrom1 = () => {
    handleReset();
    if (currentMantra?.audio_url) {
      setIsPlaying(true);
      playNextRep(currentMantra);
    }
  };

  const handleMantraSelect = (m: MantraItem) => {
    setSelectedMantraId(m.id);
    clearMantraPlaybackListeners();
    if (audioEngine.isPlaying() || audioEngine.getCurrent()) {
      audioEngine.stop();
    }
    setIsPlaying(false);
    currentMantraIdRef.current = null;
    setCount(0);
    setCompleted(false);
  };

  const CIRC = 97;
  const progressOffset = CIRC - (CIRC * (count / reps) * 0.97);

  const planetSymbol = mantraPlanet ? PLANET_SYMBOLS[mantraPlanet] ?? '' : '';

  if (loading) {
    return (
      <div className="sqi-mantras" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <style>{SQI_CSS}</style>
        <div style={{ textAlign: 'center' }}>
          <div className="nadi" style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
          <div className="m-micro">{t('mantras.loading')}</div>
        </div>
      </div>
    );
  }

  const horaRange = horaWatch.calculation
    ? `${horaWatch.calculation.currentHora.startTimeStr} – ${horaWatch.calculation.currentHora.endTimeStr}`
    : '--:-- – --:--';

  return (
    <div className="sqi-mantras">
      <style>{SQI_CSS}</style>

      {/* ── HERO ── */}
      <div className="m-hero">
        <div className="m-orb" style={{ width: 200, height: 200, top: -70, right: -60, '--dur': '11s', '--dl': '0s' } as React.CSSProperties} />
        <div className="m-orb" style={{ width: 90, height: 90, top: 80, left: -30, '--dur': '8s', '--dl': '-3s' } as React.CSSProperties} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,.05)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 14 }}
          >
            ←
          </button>
          <Sparkles size={18} className="nadi" />
        </div>

        <div className="m-micro" style={{ marginBottom: 8 }}>
          {t('mantras.heroMicro')}
        </div>
        <h1 className="m-hero-title m-shimmer">
          {t('mantras.title')}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.42)', lineHeight: 1.6, marginBottom: 0 }}>
          {t('mantras.subtitle')}
        </p>
      </div>

      {/* ── BHRIGU CARD ── */}
      <div className="m-bhrigu">
        <BhriguCard
          handAnalysisComplete={handAnalysisComplete}
          palmArchetype={palmArchetype}
          activeDasha={dashaPlanet}
          prescribedText={reading?.personalCompass?.currentDasha?.period ? getPrescribedMantraText(reading.personalCompass.currentDasha.period) : null}
          onPlayRemedy={(planet) => {
            const remedyMantra = mantras.find((m) => m.planet_type && normalizePlanetName(m.planet_type) === planet);
            if (remedyMantra) {
              handleMantraSelect(remedyMantra);
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
                  handleMantraSelect(heartHealingMantra);
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
        <div className="m-glass" style={{ margin: '0 22px 16px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.9)', marginBottom: 2 }}>
                {t('mantras.celestialMatchTitle')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
                {t('mantras.celestialMatchBody', { hora: currentHoraPlanet, dasha: dashaPlanet })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HORA WATCH ── */}
      {horaWatch.calculation && (
        <div className="m-glass m-hora">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(34,211,238,.08)', border: '1px solid rgba(34,211,238,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                🌙
              </div>
              <div>
                <div className="m-micro" style={{ marginBottom: 2 }}>{t('mantras.sacredHourMicro')}</div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em' }}>
                  {t('mantras.currentHoraTitle')}
                </div>
              </div>
            </div>
            {currentHoraPlanet && (
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 100, background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.22)', color: '#D4AF37' }}>
                {PLANET_SYMBOLS[currentHoraPlanet] ?? getPlanetEmoji(currentHoraPlanet)} {currentHoraPlanet}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.42)' }}>{t('mantras.currentHoraLabel')}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{horaRange}</span>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.08),transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.42)' }}>{t('mantras.remaining')}</span>
              <span className="m-hora-timer">{horaWatch.remainingTimeStr}</span>
            </div>
            {horaWatch.calculation.dayRuler && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.42)' }}>{t('mantras.dayRuler')}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
                  {PLANET_SYMBOLS[horaWatch.calculation.dayRuler] ?? getPlanetEmoji(horaWatch.calculation.dayRuler)} {horaWatch.calculation.dayRuler}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TWO-COL: LIST + PRACTICE ── */}
      <div className="m-two-col">
        {/* ─── MANTRA LIST ─── */}
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer', padding: '4px 2px' }}
            onClick={() => setListExpanded((e) => !e)}
          >
            <div>
              <div className="m-micro" style={{ marginBottom: 2 }}>
                {t('mantras.choose')}
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{ color: 'rgba(255,255,255,.4)', transform: listExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .3s', ...(listExpanded ? { color: '#D4AF37' } : {}) }}
            />
          </div>

          {listExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mantras.length === 0 && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', textAlign: 'center', padding: '16px 0' }}>
                  {t('mantras.comingSoon')}
                </p>
              )}
              {mantras.map((m) => {
                const mp = m.planet_type ? normalizePlanetName(m.planet_type) : null;
                const isSel = selectedMantraId === m.id;
                const isAura = shouldGlowGold(m);
                const pSym = mp ? PLANET_SYMBOLS[mp] ?? '' : '';
                const pct = getSuccessPercent(mp);
                const iconAlpha = mp === 'Jupiter' ? 0.15 : 0.1;
                const iconBorderAlpha = mp === 'Jupiter' ? 0.3 : 0.18;

                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`m-mantra-item${isSel ? ' m-selected' : ''}${isAura ? ' m-gold-aura' : ''}`}
                    onClick={() => {
                      handleMantraSelect(m);
                      if ('vibrate' in navigator) navigator.vibrate(10);
                    }}
                  >
                    {isSel && !isAura && (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)', pointerEvents: 'none', borderRadius: 20 }} />
                    )}
                    {isAura && (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent)', pointerEvents: 'none', borderRadius: 20, animation: 'goldPulse 3s ease-in-out infinite' }} />
                    )}

                    <div
                      className="m-planet-icon"
                      style={{ background: `rgba(212,175,55,${iconAlpha})`, border: `1px solid rgba(212,175,55,${iconBorderAlpha})` }}
                    >
                      <span style={{ fontSize: 16 }}>{pSym || '✦'}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4, color: isSel ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.78)' }}>
                        {m.title}
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {mp && (
                          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', color: 'rgba(212,175,55,.8)' }}>
                            {pSym} {mp}
                          </span>
                        )}
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.15)', color: 'rgba(212,175,55,.55)' }}>
                          {pct}% ✦
                        </span>
                        {m.duration_minutes > 0 && (
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{formatDurationMinutes(m.duration_minutes)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── PRACTICE PANEL ─── */}
        <div className="m-practice">
          <div className="m-mantra-banner">
            <div className="m-mantra-name m-shimmer">
              {currentMantra?.title ?? t('mantras.selectPrompt')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {mantraPlanet && (
                <span className="m-tag" style={{ background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.22)', color: '#D4AF37' }}>
                  {planetSymbol} {t('mantras.planetMantraTag', { planet: mantraPlanet })}
                </span>
              )}
              <span className="m-tag" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(255,255,255,.4)' }}>
                ✦ {t('mantras.sacredReverb')}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', textAlign: 'center' }}>
              {t('mantras.guidanceVoice')}
            </div>
          </div>

          <div style={{ margin: '16px 16px 0', background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.04)', borderRadius: 20, padding: '16px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.45)', marginBottom: 10 }}>
              {t('mantras.instructions.title')}
            </div>
            {[
              t('mantras.instructions.step1'),
              t('mantras.instructions.step2'),
              t('mantras.instructions.step3'),
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, marginBottom: i < 2 ? 7 : 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(212,175,55,.55)', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>

          {!completed ? (
            <div style={{ padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="m-counter-ring" width="160" height="160" viewBox="0 0 36 36">
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
                    cx="18"
                    cy="18"
                    r="15.5"
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={progressOffset}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.04em', color: '#D4AF37', lineHeight: 1 }}>
                    {count}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.4)', marginTop: 4 }}>
                    {t('mantras.slash108')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
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
                {count > 0 && (
                  <button
                    type="button"
                    className="m-btn-reset"
                    style={{ width: 'auto', padding: '0 14px', fontSize: 11 }}
                    onClick={() => {
                      handleRestartFrom1();
                      if ('vibrate' in navigator) navigator.vibrate(10);
                    }}
                  >
                    {t('mantras.restartFrom1')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ margin: 16, background: 'linear-gradient(135deg,rgba(212,175,55,.1),rgba(212,175,55,.04))', border: '1px solid rgba(212,175,55,.3)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🕉</div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-.02em', color: '#D4AF37', marginBottom: 4 }}>
                {t('mantras.completed108Title')}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>
                {t('mantras.completed108Sub')}
              </div>
              <button
                type="button"
                className="m-btn-start"
                style={{ margin: '0 auto', width: 'auto', padding: '10px 28px', display: 'inline-flex' }}
                onClick={() => {
                  setCount(0);
                  setCompleted(false);
                  handleStart();
                  if ('vibrate' in navigator) navigator.vibrate([15, 50, 15]);
                }}
              >
                {t('mantras.practiceAgain')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Jyotish Recommendations ── */}
      {jyotishRecommendation && (
        <div className="m-glass" style={{ margin: '20px 22px 0', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 15 }}>🔭</span>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em' }}>
              {t('mantras.jyotishTitle')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jyotishRecommendation.dayPlanet && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                  {t('mantras.recommendationDay', { planet: jyotishRecommendation.dayPlanet })}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
                  {jyotishRecommendation.dayMantraId ? mantras.find((m) => m.id === jyotishRecommendation.dayMantraId)?.title ?? '–' : '–'}
                </span>
              </div>
            )}
            {jyotishRecommendation.periodPlanet && (
              <>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                    {t('mantras.recommendationPeriod', { planet: jyotishRecommendation.periodPlanet })}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
                    {jyotishRecommendation.periodMantraId ? mantras.find((m) => m.id === jyotishRecommendation.periodMantraId)?.title ?? '–' : '–'}
                  </span>
                </div>
              </>
            )}
            {jyotishRecommendation.horaPlanet && (
              <>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                    {t('mantras.recommendationHora', { planet: jyotishRecommendation.horaPlanet })}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>
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
  );
};

export default Mantras;
