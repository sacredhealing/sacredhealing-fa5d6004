import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/hooks/useTranslation';
import { Music, Play, Pause, RotateCcw, Volume2, ChevronDown, Sparkles, Clock, Sunrise, Moon, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';
import { getMantras, type MantraItem, MANTRA_REPETITIONS } from '@/features/mantras/getMantras';
import { useJyotishMantraRecommendation } from '@/hooks/useJyotishMantraRecommendation';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useBhriguPlanet } from '@/hooks/useBhriguPlanet';
import { normalizePlanetName, mantraMatchesPlanet, getPlanetOfDay, getDailyMantraFromChart, type Planet } from '@/lib/jyotishMantraLogic';
import { getPlanetEmoji } from '@/lib/vedicTypes';
import { getPalmScanResult } from '@/lib/palmScanStore';

// Planet → vibrant color theme
const PLANET_THEMES: Record<string, {
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  glow: string;
  badge: string;
}> = {
  Sun:     { gradient: 'from-amber-900/60 via-orange-800/40 to-black/60',   border: 'border-amber-500/50',   iconBg: 'bg-amber-500/20',   iconColor: 'text-amber-300',   glow: 'shadow-amber-500/30',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  Moon:    { gradient: 'from-slate-700/60 via-blue-900/40 to-black/60',     border: 'border-blue-300/50',    iconBg: 'bg-blue-300/20',    iconColor: 'text-blue-200',    glow: 'shadow-blue-300/30',    badge: 'bg-blue-300/20 text-blue-200 border-blue-300/40' },
  Mars:    { gradient: 'from-red-900/60 via-rose-800/40 to-black/60',       border: 'border-red-500/50',     iconBg: 'bg-red-500/20',     iconColor: 'text-red-300',     glow: 'shadow-red-500/30',     badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  Mercury: { gradient: 'from-emerald-900/60 via-green-800/40 to-black/60',  border: 'border-emerald-500/50', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-300', glow: 'shadow-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  Jupiter: { gradient: 'from-yellow-900/60 via-amber-800/40 to-black/60',   border: 'border-yellow-400/50',  iconBg: 'bg-yellow-400/20',  iconColor: 'text-yellow-200',  glow: 'shadow-yellow-400/30',  badge: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40' },
  Venus:   { gradient: 'from-pink-900/60 via-rose-800/40 to-black/60',      border: 'border-pink-400/50',    iconBg: 'bg-pink-400/20',    iconColor: 'text-pink-300',    glow: 'shadow-pink-400/30',    badge: 'bg-pink-400/20 text-pink-300 border-pink-400/40' },
  Saturn:  { gradient: 'from-indigo-900/60 via-violet-900/40 to-black/60',  border: 'border-indigo-400/50',  iconBg: 'bg-indigo-400/20',  iconColor: 'text-indigo-300',  glow: 'shadow-indigo-400/30',  badge: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40' },
  Rahu:    { gradient: 'from-gray-900/60 via-slate-800/40 to-black/60',     border: 'border-gray-400/50',    iconBg: 'bg-gray-400/20',    iconColor: 'text-gray-300',    glow: 'shadow-gray-400/30',    badge: 'bg-gray-400/20 text-gray-300 border-gray-400/40' },
  Ketu:    { gradient: 'from-orange-900/60 via-amber-900/40 to-black/60',   border: 'border-orange-400/50',  iconBg: 'bg-orange-400/20',  iconColor: 'text-orange-300',  glow: 'shadow-orange-400/30',  badge: 'bg-orange-400/20 text-orange-300 border-orange-400/40' },
  default: { gradient: 'from-cyan-900/60 via-cyan-800/40 to-black/60',      border: 'border-cyan-500/40',    iconBg: 'bg-cyan-500/20',    iconColor: 'text-cyan-300',    glow: 'shadow-cyan-500/20',    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
};

// Planet Sanskrit mantra names for Rishi's Choice
const PLANET_MANTRA_NAMES: Record<string, string> = {
  Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangal', Mercury: 'Budha',
  Jupiter: 'Guru', Venus: 'Shukra', Saturn: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu',
};

// Planetary symbol characters
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

// Hora success ratings per planet (simplified model)
const HORA_SUCCESS_RATINGS: Record<string, number> = {
  Sun: 82, Moon: 78, Mars: 70, Mercury: 85, Jupiter: 92, Venus: 88, Saturn: 65, Rahu: 60, Ketu: 55,
};

function getPlanetTheme(planetType?: string | null) {
  if (!planetType) return PLANET_THEMES.default;
  const normalized = planetType.charAt(0).toUpperCase() + planetType.slice(1).toLowerCase();
  return PLANET_THEMES[normalized] || PLANET_THEMES.default;
}

function getPlayableUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  return url;
}

function formatDurationMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  const rounded = Math.round(minutes);
  return rounded === 1 ? '1 min' : `${rounded} min`;
}

function getSuccessPercent(planet: string | null): number {
  if (!planet) return 75;
  return HORA_SUCCESS_RATINGS[planet] || 75;
}

// Din Heliga Kur — prescribed mantra text by Dasha (user-requested display form)
const DASHA_MANTRA_DISPLAY: Record<string, string> = {
  Jupiter: 'Om Gurave Namaha',
  Rahu: 'Om Ram Rahave Namah',
  Venus: 'Om Shum Shukraya Namah',
  Sun: 'Om Hrim Suryaya Namah',
  Moon: 'Om Shrim Chandramase Namah',
  Mars: 'Om Krim Mangalaya Namah',
  Mercury: 'Om Budhaya Namah',
  Saturn: 'Om Sham Shanaye Namah',
  Ketu: 'Om Kem Ketave Namah',
};
function getPrescribedMantraText(dashaPeriod: string | undefined | null): string | null {
  if (!dashaPeriod) return null;
  const planet = normalizePlanetName(dashaPeriod.split(' ')[0]);
  return planet ? (DASHA_MANTRA_DISPLAY[planet] || getDailyMantraFromChart(dashaPeriod)) : null;
}

/** Match mantra for 432Hz Heart-Healing (Anahata) — palm scan Heart Line Leak recommendation */
function findHeartHealingMantra(mantras: MantraItem[]): MantraItem | undefined {
  return mantras.find((m) => /heart|anahata|432.*heart/i.test(m.title) || (m.description && /heart|anahata/i.test(m.description)));
}

/** Bhrigu Samhita Holy Remedy card — memoized; highlights 432Hz Heart-Healing (Anahata) when palm scan shows Heart Line Leak */
const BhriguRemedyCard = React.memo<{
  activeDasha: Planet | null;
  prescribedText: string | null;
  onPlayRemedy: () => void;
  t: (key: string, fallback?: string) => string;
  heartLineLeak?: boolean;
  onPlayHeartHealing?: () => void;
  heartHealingMantraTitle?: string | null;
}>(({ activeDasha, prescribedText, onPlayRemedy, heartLineLeak, onPlayHeartHealing, heartHealingMantraTitle }) => (
  <section className="px-4 mt-4 mb-4">
    <Card
      className={`relative overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 via-amber-950/40 to-black/60 shadow-[0_0_24px_rgba(212,175,55,0.25)] ${!activeDasha ? 'animate-sovereign-pulse' : ''} ${heartLineLeak ? 'ring-2 ring-rose-400/50' : ''}`}
      style={{
        boxShadow: heartLineLeak
          ? '0 0 0 2px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2), 0 0 40px rgba(244,63,94,0.15)'
          : '0 0 0 2px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2), 0 0 40px rgba(212,175,55,0.1)',
      }}
    >
      <div className="absolute top-3 right-3 text-[#D4AF37]/80" aria-hidden>
        <Leaf className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Bhrigu Samhita</span>
        </div>
        {heartLineLeak && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-400/30">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-1">From your palm scan</p>
            <p className="text-sm text-white/90 mb-2">432Hz Heart-Healing (Anahata) Mantra recommended</p>
            {onPlayHeartHealing && (
              <Button
                onClick={onPlayHeartHealing}
                variant="outline"
                size="sm"
                className="w-full border-rose-400/50 text-rose-200 hover:bg-rose-500/20"
              >
                <Play className="w-3 h-3 mr-2 inline" />
                {heartHealingMantraTitle ? `Play ${heartHealingMantraTitle}` : 'Play Heart-Healing Mantra'}
              </Button>
            )}
          </div>
        )}
        {activeDasha && prescribedText ? (
          <>
            <h2 className="text-lg font-bold text-white mb-2 pr-8">Holy Remedy</h2>
            <p className="text-sm text-white/70 mb-2">{activeDasha} Remedy</p>
            <p className="text-xl font-serif text-[#D4AF37] mb-4 tracking-wide pr-2" style={{ fontFamily: 'Georgia, Cinzel, serif' }}>
              {prescribedText}
            </p>
            <Button
              onClick={onPlayRemedy}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold py-2.5 rounded-xl border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/30"
            >
              <Play className="w-4 h-4 mr-2 inline" />
              Play {activeDasha} Remedy
            </Button>
          </>
        ) : (
          <div className="py-2 pr-8">
            <p className="text-[#D4AF37]/90 text-sm animate-pulse" style={{ animationDuration: '2s' }}>
              Calculating your Soul&apos;s Frequency...
            </p>
            <p className="text-white/50 text-xs mt-1">Bhrigu calculation in progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  </section>
));

BhriguRemedyCard.displayName = 'BhriguRemedyCard';

const Mantras = () => {
  const navigate = useNavigate();
  const { t: tI18n } = useI18nTranslation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshBalance } = useSHCBalance();

  const [mantras, setMantras] = useState<MantraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [listExpanded, setListExpanded] = useState(true);
  const [userTimezone, setUserTimezone] = useState<string>('Europe/Stockholm');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMantraIdRef = useRef<string | null>(null);

  const reps = MANTRA_REPETITIONS;
  const selectedMantra = selectedMantraId ? mantras.find((m) => m.id === selectedMantraId) : null;

  const { reading, generateReading: generateVedicReading } = useAIVedicReading();
  const jyotishRecommendation = useJyotishMantraRecommendation(mantras, reading);
  const horaWatch = useHoraWatch({ timezone: userTimezone });

  const currentHoraPlanet = horaWatch.calculation?.currentHora?.planet
    ? normalizePlanetName(horaWatch.calculation.currentHora.planet)
    : null;

  const dashaPlanet = useBhriguPlanet(reading);

  const palmScan = getPalmScanResult();
  const heartLineLeak = palmScan?.heartLineLeak ?? false;
  const heartHealingMantra = findHeartHealingMantra(mantras);
  const heartHealingMantraTitle = heartHealingMantra?.title ?? null;

  const isCelestialMatch = currentHoraPlanet && dashaPlanet && currentHoraPlanet === dashaPlanet;
  const userBirthPlanet = null;
  const shouldGlowGold = currentHoraPlanet && (
    (userBirthPlanet && currentHoraPlanet === userBirthPlanet) ||
    (dashaPlanet && currentHoraPlanet === dashaPlanet)
  );

  // Build Rishi's Choice message
  const rishiPlanet = currentHoraPlanet || dashaPlanet || getPlanetOfDay();
  const rishiSanskrit = PLANET_MANTRA_NAMES[rishiPlanet] || rishiPlanet;
  const rishiMessage = currentHoraPlanet
    ? `Master, the current ${currentHoraPlanet} Hora favors your creative soul. Recite the ${rishiSanskrit} Mantra now.`
    : dashaPlanet
    ? `Your ${dashaPlanet} Dasha period calls for the ${rishiSanskrit} Mantra. Align with your karmic frequency.`
    : `Today's ${rishiPlanet} energy guides your practice. Chant Om ${rishiSanskrit}aya Namaha.`;

  useEffect(() => {
    let cancelled = false;
    getMantras().then((data) => {
      if (!cancelled) {
        const dayPlanet = getPlanetOfDay();
        const sortedMantras = [...data];
        sortedMantras.sort((a, b) => {
          const aMatchesDasha = dashaPlanet && mantraMatchesPlanet(a, dashaPlanet);
          const bMatchesDasha = dashaPlanet && mantraMatchesPlanet(b, dashaPlanet);
          const aMatchesDay = mantraMatchesPlanet(a, dayPlanet);
          const bMatchesDay = mantraMatchesPlanet(b, dayPlanet);
          if (aMatchesDasha && !bMatchesDasha) return -1;
          if (!aMatchesDasha && bMatchesDasha) return 1;
          if (aMatchesDay && !bMatchesDay) return -1;
          if (!aMatchesDay && bMatchesDay) return 1;
          return 0;
        });
        setMantras(sortedMantras);
        if (sortedMantras.length > 0 && !selectedMantraId) {
          const dashaMantraId = dashaPlanet ? sortedMantras.find(m => mantraMatchesPlanet(m, dashaPlanet))?.id : null;
          const dayMantraId = sortedMantras.find(m => mantraMatchesPlanet(m, dayPlanet))?.id;
          const recommendedId = jyotishRecommendation?.recommendedMantraId;
          const preselectedId = dashaMantraId || dayMantraId ||
            (recommendedId && sortedMantras.find(m => m.id === recommendedId)?.id) ||
            sortedMantras[0].id;
          setSelectedMantraId(preselectedId);
        }
      }
      setLoading(false);
    }).catch((error) => {
      if (!cancelled) {
        toast.error(t('error_mantras_fetch', 'Could not load mantras right now.'));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [jyotishRecommendation?.recommendedMantraId, dashaPlanet]);

  useEffect(() => {
    if (jyotishRecommendation?.recommendedMantraId && mantras.length > 0 && !selectedMantraId) {
      const recommendedMantra = mantras.find(m => m.id === jyotishRecommendation.recommendedMantraId);
      if (recommendedMantra) setSelectedMantraId(recommendedMantra.id);
    }
  }, [jyotishRecommendation?.recommendedMantraId, mantras, selectedMantraId]);

  // Pre-fetch Remedy track so it plays instantly when user taps "Play {dashaPlanet} Remedy"
  useEffect(() => {
    if (!dashaPlanet || mantras.length === 0) return;
    const remedyMantra = mantras.find(m => m.planet_type && normalizePlanetName(m.planet_type) === dashaPlanet);
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
      const { data: recent } = await supabase.from('mantra_completions').select('id').eq('user_id', user.id).eq('mantra_id', mantra.id).gte('completed_at', twentyFourHoursAgo).limit(1);
      if (recent?.length) return;
      await supabase.from('mantra_completions').insert({ user_id: user.id, mantra_id: mantra.id, shc_earned: mantra.shc_reward });
      const { data: bal } = await supabase.from('user_balances').select('balance, total_earned').eq('user_id', user.id).maybeSingle();
      if (bal) {
        await supabase.from('user_balances').update({ balance: bal.balance + mantra.shc_reward, total_earned: bal.total_earned + mantra.shc_reward }).eq('user_id', user.id);
      }
      await supabase.from('shc_transactions').insert({ user_id: user.id, type: 'earned', amount: mantra.shc_reward, description: `Mantra: ${mantra.title}`, status: 'completed' });
      toast.success(`+${mantra.shc_reward} SHC ${tI18n('mantras.earned', 'earned')}`);
      refreshBalance();
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
    } catch (e) {
      console.error(e);
    }
  };

  const playNextRep = (mantra: MantraItem) => {
    if (!mantra.audio_url) return;
    const url = getPlayableUrl(mantra.audio_url);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    const audio = new Audio(url);
    audioRef.current = audio;
    currentMantraIdRef.current = mantra.id;
    audio.addEventListener('ended', () => {
      setCount((c) => {
        const next = c + 1;
        if (next >= reps) {
          setIsPlaying(false);
          setCompleted(true);
          currentMantraIdRef.current = null;
          if (user && selectedMantra) awardMantraReward(selectedMantra);
          return reps;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return next;
      });
    });
    audio.play().catch(() => toast.error(t('error_audio_play', 'Could not play audio.')));
  };

  const handleStart = () => {
    if (!selectedMantra?.audio_url) { toast.error(t('error_no_audio', 'No audio available.')); return; }
    if (count >= reps) setCount(0);
    if (audioRef.current && currentMantraIdRef.current === selectedMantra.id && count < reps) {
      setIsPlaying(true);
      audioRef.current.play().catch(() => {});
      return;
    }
    setIsPlaying(true);
    setCompleted(false);
    playNextRep(selectedMantra);
  };

  const handlePause = () => { audioRef.current?.pause(); setIsPlaying(false); };
  const handleReset = () => { audioRef.current?.pause(); audioRef.current = null; currentMantraIdRef.current = null; setCount(0); setIsPlaying(false); setCompleted(false); };
  const handleRestartFrom1 = () => { handleReset(); if (selectedMantra?.audio_url) { setIsPlaying(true); playNextRep(selectedMantra); } };
  const handleMantraSelect = (m: MantraItem) => { setSelectedMantraId(m.id); if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); } setCount(0); setCompleted(false); };

  const progressPercent = reps > 0 ? (count / reps) * 100 : 0;
  const selectedTheme = getPlanetTheme(selectedMantra?.planet_type);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 overflow-x-hidden overflow-y-auto">

      {/* Sacred Header — Celestial Gradient; Return to Temple always available */}
      <header className="bg-gradient-to-br from-indigo-950 via-violet-950/90 to-amber-950/80 border-b border-amber-500/20 px-4 pt-6 pb-5 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-amber-400/90 hover:text-amber-300 transition-colors"
          >
            Return to Temple
          </button>
        </div>
        <h1 className="text-2xl font-heading font-bold text-white">
          {tI18n('mantras.title', 'Mantras')}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {tI18n('mantras.subtitle', 'Choose one mantra and repeat it 108 times.')}
        </p>
      </header>

      {/* Bhrigu Jyotish Holy Remedy — index 0, always visible at top of scroll view */}
      <section className="shrink-0 overflow-visible" aria-label="Bhrigu Holy Remedy">
      <BhriguRemedyCard
        activeDasha={dashaPlanet}
        prescribedText={reading?.personalCompass?.currentDasha?.period ? getPrescribedMantraText(reading.personalCompass.currentDasha.period) : null}
        onPlayRemedy={() => {
          if (!dashaPlanet) return;
          const prescribedText = reading?.personalCompass?.currentDasha?.period ? getPrescribedMantraText(reading.personalCompass.currentDasha.period) : null;
          const remedyMantra = mantras.find(m => m.planet_type && normalizePlanetName(m.planet_type) === dashaPlanet);
          if (remedyMantra) {
            handleMantraSelect(remedyMantra);
            if (remedyMantra.audio_url) setTimeout(() => handleStart(), 300);
            else toast.error(t('mantras_no_audio', 'Audio not available for this mantra.'));
          } else if (prescribedText) {
            toast.info(`${prescribedText} — ${t('mantras_find_mantra', 'Find this mantra in the list below.')}`);
          }
        }}
        t={t}
        heartLineLeak={heartLineLeak}
        onPlayHeartHealing={
          heartLineLeak && heartHealingMantra
            ? () => {
                handleMantraSelect(heartHealingMantra);
                if (heartHealingMantra.audio_url) setTimeout(() => handleStart(), 300);
                else toast.error(t('mantras_no_audio', 'Audio not available for this mantra.'));
              }
            : undefined
        }
        heartHealingMantraTitle={heartHealingMantraTitle}
      />
      </section>

      {/* Din Heliga Timme — floating glass card with rotating Moon/Planet icon */}
      {horaWatch.calculation && (
        <section className="px-4 mt-6 mb-6">
          <div className={`relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl overflow-hidden shadow-xl ${shouldGlowGold ? 'border-amber-500/40 shadow-amber-500/20' : 'shadow-black/20'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <Moon className={`w-6 h-6 text-amber-300/90 animate-[spin_12s_linear_infinite] ${shouldGlowGold ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{t('mantras_sacred_hour', 'Din Heliga Timme')}</h2>
                </div>
                {currentHoraPlanet && (
                  <Badge variant="outline" className={`border-primary/30 text-primary font-bold text-sm px-3 py-1 ${shouldGlowGold ? 'animate-pulse border-amber-500/50 bg-amber-500/10 text-amber-400' : ''}`}>
                    {getPlanetEmoji(currentHoraPlanet)} {currentHoraPlanet}{shouldGlowGold && ' ✨'}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{t('mantras_current_hora', 'Nuvarande Hora')}:</span>
                  <span className="text-white font-medium">{horaWatch.calculation.currentHora.startTimeStr} - {horaWatch.calculation.currentHora.endTimeStr}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{t('mantras_remaining', 'Återstående')}:</span>
                  <span className="text-white font-medium font-mono">{horaWatch.remainingTimeStr}</span>
                </div>
                {horaWatch.calculation.dayRuler && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{t('mantras_day_ruler', 'Dagens Herskare')}:</span>
                    <span className="text-white font-medium">{getPlanetEmoji(horaWatch.calculation.dayRuler)} {horaWatch.calculation.dayRuler}</span>
                  </div>
                )}
                {shouldGlowGold && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <p className="text-xs text-amber-400 font-medium">✨ {t('mantras_golden_hour', 'Din Heliga Timme matchar din planet!')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Celestial Match Banner */}
      {isCelestialMatch && dashaPlanet && (
        <section className="px-4 mb-6">
          <Card className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 shadow-lg shadow-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground mb-1">{t('mantras_celestial_match', 'Himlakonstellation Match!')} ✨</h3>
                  <p className="text-sm text-muted-foreground">{t('mantras_celestial_message', `Your Hora (${currentHoraPlanet}) matches your Dasha (${dashaPlanet}). Powerful time for practice.`)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="px-4 flex flex-col gap-6 md:flex-row md:gap-8">

        {/* Mantra List — vibrant planet cards with symbols + success % */}
        <section className="flex-shrink-0 md:w-80">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left mb-3"
            onClick={() => setListExpanded(!listExpanded)}
          >
            <h2 className="font-semibold text-foreground">{tI18n('mantras.choose', 'Choose a mantra')}</h2>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${listExpanded ? 'rotate-180' : ''}`} />
          </button>

          {listExpanded && (
            <div className="space-y-3">
              {mantras.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{tI18n('mantras.comingSoon', 'More mantras coming soon.')}</p>
              ) : (
                mantras.map((m) => {
                  const isRecommended = jyotishRecommendation?.recommendedMantraId === m.id;
                  const mantraPlanet = m.planet_type ? normalizePlanetName(m.planet_type) : null;
                  const hasGoldenAura = shouldGlowGold && mantraPlanet === currentHoraPlanet && (
                    (dashaPlanet && mantraPlanet === dashaPlanet) ||
                    (userBirthPlanet && mantraPlanet === userBirthPlanet)
                  );
                  const isDashaMantra = dashaPlanet && mantraMatchesPlanet(m, dashaPlanet);
                  const isDayMantra = mantraMatchesPlanet(m, getPlanetOfDay());
                  const isSelected = selectedMantraId === m.id;
                  const theme = getPlanetTheme(m.planet_type);
                  const planetSymbol = mantraPlanet ? PLANET_SYMBOLS[mantraPlanet] : null;
                  const successPct = getSuccessPercent(mantraPlanet);

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        handleMantraSelect(m);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                      }}
                      className={`w-full text-left rounded-2xl border p-4 flex items-center gap-3 transition-all duration-200 relative overflow-hidden shadow-md hover:scale-[1.01] ${
                        hasGoldenAura
                          ? 'border-amber-500/60 bg-gradient-to-r from-amber-900/60 via-yellow-800/40 to-black/60 shadow-amber-500/30'
                          : isSelected
                          ? `${theme.border} bg-gradient-to-br ${theme.gradient} shadow-lg ${theme.glow}`
                          : `border-white/10 bg-gradient-to-br ${theme.gradient} opacity-70 hover:opacity-100`
                      }`}
                    >
                      {/* Glow overlay when selected */}
                      {isSelected && !hasGoldenAura && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                      )}
                      {hasGoldenAura && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-pulse pointer-events-none" />
                      )}

                      {/* Planet icon with symbol */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 ${
                        hasGoldenAura ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : theme.iconBg
                      }`}>
                        {planetSymbol ? (
                          <span className={`text-lg font-bold ${hasGoldenAura ? 'text-white' : theme.iconColor}`}>
                            {planetSymbol}
                          </span>
                        ) : hasGoldenAura ? (
                          <Sparkles className="h-5 w-5 text-white animate-pulse" />
                        ) : isRecommended ? (
                          <Sparkles className={`h-5 w-5 ${theme.iconColor}`} />
                        ) : (
                          <Music className={`h-5 w-5 ${theme.iconColor}`} />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white truncate">{m.title}</p>
                          {hasGoldenAura && <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide animate-pulse">✨ GOLDEN</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {m.planet_type && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${theme.badge}`}>
                              {planetSymbol || getPlanetEmoji(m.planet_type)} {m.planet_type}
                            </span>
                          )}
                          {/* Success % from Hora */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            successPct >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : successPct >= 60 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {successPct}% ✦
                          </span>
                          {isDashaMantra && !hasGoldenAura && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-primary/20 text-primary border-primary/40 font-medium">
                              {t('mantras_dasha_pinned', 'Ditt Period')}
                            </span>
                          )}
                          {isDayMantra && !hasGoldenAura && !isDashaMantra && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/30 font-medium">
                              {t('mantras_day_mantra', 'Dagens')}
                            </span>
                          )}
                          {m.duration_minutes > 0 && (
                            <span className="text-[10px] text-white/50">{formatDurationMinutes(m.duration_minutes)}</span>
                          )}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasGoldenAura ? 'bg-amber-400' : theme.iconColor.replace('text-', 'bg-')} relative z-10`} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Now Practicing */}
        <section className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground mb-3">{tI18n('mantras.now', 'Now practicing')}</h2>

          {!selectedMantra ? (
            <Card className="rounded-2xl border-border p-6">
              <p className="text-muted-foreground text-center">{tI18n('mantras.choose', 'Choose a mantra')}</p>
            </Card>
          ) : (
            <Card className={`rounded-2xl border overflow-hidden shadow-xl ${selectedTheme.border} ${selectedTheme.glow}`}>
              {/* Vibrant header band */}
              <div className={`bg-gradient-to-r ${selectedTheme.gradient} px-6 pt-6 pb-4`}>
                <p className="text-xl font-bold text-white text-center">{selectedMantra.title}</p>
                {selectedMantra.planet_type && (
                  <div className="flex justify-center mt-2 gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${selectedTheme.badge}`}>
                      {PLANET_SYMBOLS[normalizePlanetName(selectedMantra.planet_type) || ''] || getPlanetEmoji(selectedMantra.planet_type)} {selectedMantra.planet_type} Mantra
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full border bg-white/10 text-white/70 border-white/20 font-medium">
                      🎵 Sacred Reverb
                    </span>
                  </div>
                )}
                <p className="text-sm text-white/60 text-center mt-1">{tI18n('mantras.guidanceVoice', 'Voice only')}</p>
              </div>

              <CardContent className="p-6">
                {/* Jyotish Recommendation */}
                {jyotishRecommendation && (
                  <div className="space-y-3 mb-6">
                    <Card className="rounded-xl border-border bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground mb-2">{jyotishRecommendation.message}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>{t('mantras_duration', 'Duration')}: {jyotishRecommendation.duration}</span>
                              <span>{t('mantras_repetitions', 'Repetitions')}: {jyotishRecommendation.repetitions}</span>
                              <span>{t('mantras_best_time', 'Best time')}: {jyotishRecommendation.bestTime}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {(jyotishRecommendation.dayMantraId || jyotishRecommendation.periodMantraId || jyotishRecommendation.horaMantraId) && (
                      <Card className="rounded-xl border-border bg-muted/10">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-foreground mb-3">{t('mantras_cosmic_timing', 'Cosmic Timing')}</h3>
                          <div className="space-y-2">
                            {jyotishRecommendation.dayPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t('mantras_day_mantra', 'Dagens Mantra')} ({jyotishRecommendation.dayPlanet}):</span>
                                <span className="text-foreground font-medium">{jyotishRecommendation.dayMantraId ? mantras.find(m => m.id === jyotishRecommendation.dayMantraId)?.title || '—' : '—'}</span>
                              </div>
                            )}
                            {jyotishRecommendation.periodPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t('mantras_period_mantra', 'Period Mantra')} ({jyotishRecommendation.periodPlanet}):</span>
                                <span className="text-foreground font-medium">{jyotishRecommendation.periodMantraId ? mantras.find(m => m.id === jyotishRecommendation.periodMantraId)?.title || '—' : '—'}</span>
                              </div>
                            )}
                            {jyotishRecommendation.horaPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t('mantras_hora_mantra', 'Hour Mantra')} ({jyotishRecommendation.horaPlanet}):</span>
                                <span className="text-foreground font-medium">{jyotishRecommendation.horaMantraId ? mantras.find(m => m.id === jyotishRecommendation.horaMantraId)?.title || '—' : '—'}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <Card className="rounded-xl border-border bg-muted/20 mb-6">
                  <CardContent className="p-4">
                    <p className="font-medium text-foreground mb-2">{tI18n('mantras.instructions.title', 'How to practice')}</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>{tI18n('mantras.instructions.step1', 'Sit comfortably.')}</li>
                      <li>{tI18n('mantras.instructions.step2', 'Press Start.')}</li>
                      <li>{tI18n('mantras.instructions.step3', 'Repeat with the recording — 108 times.')}</li>
                    </ol>
                  </CardContent>
                </Card>

                {!completed ? (
                  <>
                    {/* 108 Counter — large circle, Golden Light Thread progress ring, elegant serif */}
                    <div className="flex justify-center mb-8">
                      <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31" />
                          <path
                            fill="none"
                            stroke="url(#mantraGoldThread)"
                            strokeWidth="2.5"
                            strokeDasharray={`${progressPercent * 0.97} 97`}
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                            d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                          />
                          <defs>
                            <linearGradient id="mantraGoldThread" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#F5D77A" stopOpacity="1" />
                              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.9" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-serif text-amber-200/95 tracking-wide" style={{ fontFamily: 'Cinzel, DM Serif Display, serif' }}>{count}/{reps}</span>
                      </div>
                    </div>

                    {/* Controls — Start: Glowing Sovereign Gold with pulse */}
                    <div className="flex flex-wrap justify-center gap-3">
                      {!isPlaying ? (
                        <Button size="lg" className="rounded-full gap-2 bg-[#D4AF37] hover:bg-amber-500 text-black font-bold border border-amber-400/50 animate-sovereign-pulse" onClick={() => { handleStart(); if ('vibrate' in navigator) navigator.vibrate(15); }}>
                          <Play className="h-5 w-5" />
                          {tI18n('mantras.start', 'Start')}
                        </Button>
                      ) : (
                        <Button variant="outline" size="lg" className="rounded-full gap-2 border-amber-500/50 text-amber-200" onClick={() => { handlePause(); if ('vibrate' in navigator) navigator.vibrate(10); }}>
                          <Pause className="h-5 w-5" />
                          {tI18n('mantras.pause', 'Pause')}
                        </Button>
                      )}
                      <Button variant="outline" size="lg" className="rounded-full gap-2 border-white/20 text-white/80" onClick={() => { handleReset(); if ('vibrate' in navigator) navigator.vibrate([10, 20, 10]); }}>
                        <RotateCcw className="h-4 w-4" />
                        {tI18n('mantras.reset', 'Reset')}
                      </Button>
                      {count > 0 && (
                        <Button variant="ghost" size="lg" className="rounded-full gap-2 text-white/70" onClick={() => { handleRestartFrom1(); if ('vibrate' in navigator) navigator.vibrate(10); }}>
                          {tI18n('mantras.restartFrom1', 'Restart from 1')}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xl font-semibold text-foreground mb-2">{tI18n('mantras.completeTitle', 'Complete')}</p>
                    <p className="text-muted-foreground mb-6">{tI18n('mantras.completeBody', 'Take a breath. Notice how you feel.')}</p>
                    <Button size="lg" className="rounded-full gap-2 bg-[#D4AF37] hover:bg-amber-500 text-black font-bold border border-amber-400/50 animate-sovereign-pulse" onClick={() => { setCount(0); setCompleted(false); handleStart(); if ('vibrate' in navigator) navigator.vibrate([15, 50, 15]); }}>
                      <Play className="h-5 w-5" />
                      {tI18n('mantras.playAgain', 'Play again')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default Mantras;
