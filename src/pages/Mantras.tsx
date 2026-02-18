import React, { useState, useEffect, useRef } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/hooks/useTranslation';
import { Music, Play, Pause, RotateCcw, Volume2, ChevronDown, Sparkles, Clock, Sunrise } from 'lucide-react';
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
import { normalizePlanetName, mantraMatchesPlanet, type Planet } from '@/lib/jyotishMantraLogic';
import { getPlanetEmoji } from '@/lib/vedicTypes';

function getPlayableUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return url;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const Mantras = () => {
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

  // Get Jyotish recommendation
  const jyotishRecommendation = useJyotishMantraRecommendation(mantras);
  const { reading } = useAIVedicReading();
  
  // Hora Watch - Calculate current planetary hour
  const horaWatch = useHoraWatch({
    timezone: userTimezone,
  });

  // Extract current Hora planet and Dasha planet for comparison
  const currentHoraPlanet = horaWatch.calculation?.currentHora?.planet 
    ? normalizePlanetName(horaWatch.calculation.currentHora.planet) 
    : null;
  
  const dashaPlanet = reading?.personalCompass?.currentDasha?.period
    ? normalizePlanetName(reading.personalCompass.currentDasha.period.split(' ')[0])
    : null;

  // Check if current Hora matches Dasha planet (Golden Aura condition)
  const isCelestialMatch = currentHoraPlanet && dashaPlanet && currentHoraPlanet === dashaPlanet;

  useEffect(() => {
    let cancelled = false;
    getMantras().then((data) => {
      if (!cancelled) {
        // SRI YUKTESWAR LOGIC: Pin Dasha planet mantras to top
        const sortedMantras = [...data];
        if (dashaPlanet) {
          sortedMantras.sort((a, b) => {
            const aMatchesDasha = mantraMatchesPlanet(a, dashaPlanet);
            const bMatchesDasha = mantraMatchesPlanet(b, dashaPlanet);
            if (aMatchesDasha && !bMatchesDasha) return -1;
            if (!aMatchesDasha && bMatchesDasha) return 1;
            return 0;
          });
        }
        setMantras(sortedMantras);
        
        // Preselect recommended mantra if available, otherwise first mantra
        if (sortedMantras.length > 0 && !selectedMantraId) {
          const recommendedId = jyotishRecommendation?.recommendedMantraId;
          const dashaMantraId = dashaPlanet 
            ? sortedMantras.find(m => mantraMatchesPlanet(m, dashaPlanet))?.id 
            : null;
          // Prioritize: Dasha mantra > Recommended > First
          const preselectedId = dashaMantraId || (recommendedId && sortedMantras.find(m => m.id === recommendedId)?.id) || sortedMantras[0].id;
          setSelectedMantraId(preselectedId);
        }
      }
      setLoading(false);
    }).catch((error) => {
      if (!cancelled) {
        console.error('Error fetching mantras:', error);
        // Heart-centered error message (Dan Abramov Retainable UI)
        toast.error(t('error_mantras_fetch', 'Kunde inte ladda mantras just nu. Var vänlig försök igen om en stund.'));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [jyotishRecommendation?.recommendedMantraId, dashaPlanet]);

  // Update selected mantra when recommendation changes (only if no mantra is currently selected)
  useEffect(() => {
    if (jyotishRecommendation?.recommendedMantraId && mantras.length > 0 && !selectedMantraId) {
      const recommendedMantra = mantras.find(m => m.id === jyotishRecommendation.recommendedMantraId);
      if (recommendedMantra) {
        setSelectedMantraId(recommendedMantra.id);
      }
    }
  }, [jyotishRecommendation?.recommendedMantraId, mantras, selectedMantraId]);

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
      await supabase.from('mantra_completions').insert({
        user_id: user.id,
        mantra_id: mantra.id,
        shc_earned: mantra.shc_reward,
      });
      const { data: bal } = await supabase.from('user_balances').select('balance, total_earned').eq('user_id', user.id).maybeSingle();
      if (bal) {
        await supabase.from('user_balances').update({
          balance: bal.balance + mantra.shc_reward,
          total_earned: bal.total_earned + mantra.shc_reward,
        }).eq('user_id', user.id);
      }
      await supabase.from('shc_transactions').insert({
        user_id: user.id,
        type: 'earned',
        amount: mantra.shc_reward,
        description: `Mantra: ${mantra.title}`,
        status: 'completed',
      });
      toast.success(`+${mantra.shc_reward} SHC ${tI18n('mantras.earned', 'earned')}`);
      refreshBalance();
      // Liquid Glass haptics on success
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]); // Success pattern
      }
    } catch (e) {
      console.error(e);
      // Heart-centered error message (Dan Abramov Retainable UI)
      toast.error(t('error_mantra_reward', 'Kunde inte registrera belöningen. Din praxis är fortfarande värdefull.'));
    }
  };

  const playNextRep = (mantra: MantraItem) => {
    if (!mantra.audio_url) return;
    const url = getPlayableUrl(mantra.audio_url);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
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

    audio.play().catch(() => {
      // Heart-centered error message (Dan Abramov Retainable UI)
      toast.error(t('error_audio_play', 'Ljudet kunde inte spelas. Kontrollera din internetanslutning och försök igen.'));
    });
  };

  const handleStart = () => {
    if (!selectedMantra?.audio_url) {
      // Heart-centered error message (Dan Abramov Retainable UI)
      toast.error(t('error_no_audio', 'Det finns inget ljud tillgängligt för denna mantra. Välj en annan mantra.'));
      return;
    }
    if (count >= reps) setCount(0);
    if (audioRef.current && currentMantraIdRef.current === selectedMantra.id && count < reps) {
      setIsPlaying(true);
      audioRef.current.play().catch(() => {
        toast.error(t('error_audio_play', 'Ljudet kunde inte spelas. Kontrollera din internetanslutning och försök igen.'));
      });
      return;
    }
    setIsPlaying(true);
    setCompleted(false);
    playNextRep(selectedMantra);
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleReset = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    currentMantraIdRef.current = null;
    setCount(0);
    setIsPlaying(false);
    setCompleted(false);
  };

  const handleRestartFrom1 = () => {
    handleReset();
    if (selectedMantra?.audio_url) {
      setIsPlaying(true);
      playNextRep(selectedMantra);
    }
  };

  const handleMantraSelect = (m: MantraItem) => {
    setSelectedMantraId(m.id);
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    setCount(0);
    setCompleted(false);
  };

  const progressPercent = reps > 0 ? (count / reps) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <section className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          {tI18n('mantras.title', 'Mantras')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tI18n('mantras.subtitle', 'Choose one mantra and repeat it 108 times.')}
        </p>
      </section>

      {/* Planetary Hora Watch - Din Heliga Timme (Sri Yukteswar Precision) */}
      {horaWatch.calculation && (
        <section className="px-4 mb-6">
          <Card className="rounded-2xl border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20 overflow-hidden backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {t('mantras_sacred_hour', 'Din Heliga Timme')}
                  </h2>
                </div>
                {currentHoraPlanet && (
                  <Badge 
                    variant="outline" 
                    className={`border-primary/30 text-primary font-bold text-sm px-3 py-1 ${
                      isCelestialMatch ? 'animate-pulse border-amber-500/50 bg-amber-500/10' : ''
                    }`}
                  >
                    {getPlanetEmoji(currentHoraPlanet)} {currentHoraPlanet}
                    {isCelestialMatch && ' ✨'}
                  </Badge>
                )}
              </div>
              
              {horaWatch.calculation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('mantras_current_hora', 'Nuvarande Hora')}:</span>
                    <span className="text-foreground font-medium">
                      {horaWatch.calculation.currentHora.startTimeStr} - {horaWatch.calculation.currentHora.endTimeStr}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('mantras_remaining', 'Återstående')}:</span>
                    <span className="text-foreground font-medium font-mono">
                      {horaWatch.remainingTimeStr}
                    </span>
                  </div>
                  {horaWatch.calculation.dayRuler && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('mantras_day_ruler', 'Dagens Herskare')}:</span>
                      <span className="text-foreground font-medium">
                        {getPlanetEmoji(horaWatch.calculation.dayRuler)} {horaWatch.calculation.dayRuler}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Celestial Recommendation - Golden Aura when Hora matches Dasha */}
      {isCelestialMatch && dashaPlanet && (
        <section className="px-4 mb-6">
          <Card className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 shadow-lg shadow-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground mb-1">
                    {t('mantras_celestial_match', 'Himlakonstellation Match!')} ✨
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('mantras_celestial_message', `Your current Hora (${currentHoraPlanet || ''}) matches your Dasha period (${dashaPlanet || ''}). This is a powerful time for mantra practice.`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="px-4 flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Choose a mantra — list (clickable) */}
        <section className="flex-shrink-0 md:w-72">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left"
            onClick={() => setListExpanded(!listExpanded)}
          >
            <h2 className="font-semibold text-foreground">{tI18n('mantras.choose', 'Choose a mantra')}</h2>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${listExpanded ? 'rotate-180' : ''}`} />
          </button>
          {listExpanded && (
            <div className="mt-2 space-y-2">
              {mantras.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{tI18n('mantras.comingSoon', 'More mantras coming soon.')}</p>
              ) : (
                mantras.map((m) => {
                  const isRecommended = jyotishRecommendation?.recommendedMantraId === m.id;
                  
                  // Check if this mantra matches the celestial match planet (Golden Aura)
                  const mantraPlanet = m.planet_type ? normalizePlanetName(m.planet_type) : null;
                  const hasGoldenAura = isCelestialMatch && mantraPlanet === dashaPlanet && mantraPlanet === currentHoraPlanet;
                  
                  // Check if this is a Dasha planet mantra (Pin to top)
                  const isDashaMantra = dashaPlanet && mantraMatchesPlanet(m, dashaPlanet);
                  
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        handleMantraSelect(m);
                        // Liquid Glass haptics (Dan Abramov Retainable UI)
                        if ('vibrate' in navigator) {
                          navigator.vibrate(10); // Subtle haptic feedback
                        }
                      }}
                      className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 transition relative overflow-hidden backdrop-blur-sm ${
                        selectedMantraId === m.id
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : hasGoldenAura
                          ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 shadow-lg shadow-amber-500/20'
                          : isDashaMantra
                          ? 'border-primary/70 bg-primary/8 shadow-md shadow-primary/10'
                          : isRecommended
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border bg-card/50 hover:bg-muted/30'
                      }`}
                      style={{
                        // Liquid Glass effect
                        background: selectedMantraId === m.id 
                          ? 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1) 0%, rgba(var(--primary-rgb), 0.05) 100%)'
                          : undefined,
                      }}
                    >
                      {hasGoldenAura && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-pulse pointer-events-none" />
                      )}
                      {isDashaMantra && !hasGoldenAura && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="text-[9px] border-primary/50 text-primary bg-primary/5">
                            {t('mantras_dasha_pinned', 'Ditt Period')}
                          </Badge>
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10 ${
                        hasGoldenAura 
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                          : 'bg-primary/10'
                      }`}>
                        {hasGoldenAura ? (
                          <Sparkles className="h-5 w-5 text-white animate-pulse" />
                        ) : isRecommended ? (
                          <Sparkles className="h-5 w-5 text-primary" />
                        ) : (
                          <Music className={`h-5 w-5 ${hasGoldenAura ? 'text-white' : 'text-primary'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${hasGoldenAura ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'}`}>
                            {m.title}
                          </p>
                          {hasGoldenAura && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide animate-pulse">
                              ✨ GULDEN AURA
                            </span>
                          )}
                          {!hasGoldenAura && isRecommended && (
                            <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Recommended</span>
                          )}
                        </div>
                        {m.duration_seconds > 0 && (
                          <p className="text-xs text-muted-foreground">{formatDuration(m.duration_seconds)}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Now practicing — card */}
        <section className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground mb-3">{tI18n('mantras.now', 'Now practicing')}</h2>
          {!selectedMantra ? (
            <Card className="rounded-2xl border-border p-6">
              <p className="text-muted-foreground text-center">{tI18n('mantras.choose', 'Choose a mantra')}</p>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border overflow-hidden">
              <CardContent className="p-6">
                <p className="text-lg sm:text-xl font-semibold text-foreground text-center mb-1">
                  {selectedMantra.title}
                </p>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {tI18n('mantras.guidanceVoice', 'Voice only')}
                </p>

                {/* Vedic Guide Card - Enhanced with Day/Period/Hour recommendations */}
                {jyotishRecommendation && (
                  <div className="space-y-4 mb-6">
                    {/* Primary Recommendation */}
                    <Card className="rounded-xl border-border bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground mb-2">
                              {jyotishRecommendation.message}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>{t('mantras_duration', 'Duration')}: {jyotishRecommendation.duration}</span>
                              <span>{t('mantras_repetitions', 'Repetitions')}: {jyotishRecommendation.repetitions}</span>
                              <span>{t('mantras_best_time', 'Best time')}: {jyotishRecommendation.bestTime}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Day/Period/Hour Breakdown */}
                    {(jyotishRecommendation.dayMantraId || jyotishRecommendation.periodMantraId || jyotishRecommendation.horaMantraId) && (
                      <Card className="rounded-xl border-border bg-muted/10">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-foreground mb-3">
                            {t('mantras_cosmic_timing', 'Cosmic Timing Recommendations')}
                          </h3>
                          <div className="space-y-2">
                            {jyotishRecommendation.dayPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {t('mantras_day_mantra', 'Dagens Mantra')} ({jyotishRecommendation.dayPlanet}):
                                </span>
                                <span className="text-foreground font-medium">
                                  {jyotishRecommendation.dayMantraId 
                                    ? mantras.find(m => m.id === jyotishRecommendation.dayMantraId)?.title || t('mantras_not_found', 'Not found')
                                    : t('mantras_not_available', 'Not available')}
                                </span>
                              </div>
                            )}
                            {jyotishRecommendation.periodPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {t('mantras_period_mantra', 'Ditt Period-Mantra')} ({jyotishRecommendation.periodPlanet}):
                                </span>
                                <span className="text-foreground font-medium">
                                  {jyotishRecommendation.periodMantraId 
                                    ? mantras.find(m => m.id === jyotishRecommendation.periodMantraId)?.title || t('mantras_not_found', 'Not found')
                                    : t('mantras_not_available', 'Not available')}
                                </span>
                              </div>
                            )}
                            {jyotishRecommendation.horaPlanet && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {t('mantras_hora_mantra', 'Hour Mantra')} ({jyotishRecommendation.horaPlanet}):
                                </span>
                                <span className="text-foreground font-medium">
                                  {jyotishRecommendation.horaMantraId 
                                    ? mantras.find(m => m.id === jyotishRecommendation.horaMantraId)?.title || t('mantras_not_found', 'Not found')
                                    : t('mantras_not_available', 'Not available')}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

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
                    <div className="flex justify-center mb-6">
                      <div className="relative w-28 h-28">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="3"
                            d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                          />
                          <path
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            strokeDasharray={`${progressPercent * 0.97} 97`}
                            strokeLinecap="round"
                            d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
                          {count}/{reps}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      {!isPlaying ? (
                        <Button 
                          size="lg" 
                          className="rounded-full gap-2 backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/30" 
                          onClick={() => {
                            handleStart();
                            // Liquid Glass haptics (Dan Abramov Retainable UI)
                            if ('vibrate' in navigator) {
                              navigator.vibrate(15);
                            }
                          }}
                        >
                          <Play className="h-5 w-5" />
                          {tI18n('mantras.start', 'Start')}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="rounded-full gap-2 backdrop-blur-sm border-primary/50" 
                          onClick={() => {
                            handlePause();
                            if ('vibrate' in navigator) {
                              navigator.vibrate(10);
                            }
                          }}
                        >
                          <Pause className="h-5 w-5" />
                          {tI18n('mantras.pause', 'Pause')}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-full gap-2 backdrop-blur-sm" 
                        onClick={() => {
                          handleReset();
                          if ('vibrate' in navigator) {
                            navigator.vibrate([10, 20, 10]);
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {tI18n('mantras.reset', 'Reset')}
                      </Button>
                      {count > 0 && (
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="rounded-full gap-2 backdrop-blur-sm" 
                          onClick={() => {
                            handleRestartFrom1();
                            if ('vibrate' in navigator) {
                              navigator.vibrate(10);
                            }
                          }}
                        >
                          {tI18n('mantras.restartFrom1', 'Restart from 1')}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xl font-semibold text-foreground mb-2">
                      {tI18n('mantras.completeTitle', 'Complete')}
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {tI18n('mantras.completeBody', 'Take a breath. Notice how you feel.')}
                    </p>
                    <Button 
                      size="lg" 
                      className="rounded-full gap-2 backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/30" 
                      onClick={() => { 
                        setCount(0); 
                        setCompleted(false); 
                        handleStart();
                        if ('vibrate' in navigator) {
                          navigator.vibrate([15, 50, 15]); // Celebration pattern
                        }
                      }}
                    >
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
