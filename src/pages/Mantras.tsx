import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Play, Pause, RotateCcw, Volume2, ChevronDown, Sparkles, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';
import { getMantras, getCurrentVedicPeriod, getMantrasByPeriod, type MantraItem, type VedicPeriodItem, MANTRA_REPETITIONS } from '@/features/mantras/getMantras';
import { useJyotishMantraRecommendation } from '@/hooks/useJyotishMantraRecommendation';

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

function groupMantrasByCategory(mantras: MantraItem[]) {
  return mantras.reduce<Record<string, MantraItem[]>>((acc, mantra) => {
    const cat = mantra.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mantra);
    return acc;
  }, {});
}

const Mantras = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = useMembership();
  const { refreshBalance } = useSHCBalance();

  const [mantras, setMantras] = useState<MantraItem[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<VedicPeriodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [listExpanded, setListExpanded] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMantraIdRef = useRef<string | null>(null);

  const reps = MANTRA_REPETITIONS;
  const selectedMantra = selectedMantraId ? mantras.find((m) => m.id === selectedMantraId) : null;

  // Get Jyotish recommendation
  const jyotishRecommendation = useJyotishMantraRecommendation(mantras);

  const recommendedPlanet = jyotishRecommendation?.planet;
  const recommendedMantras = recommendedPlanet
    ? mantras.filter(
        (m) => m.category === 'planet' && m.planet_type === recommendedPlanet
      )
    : [];
  const groupedMantras = groupMantrasByCategory(mantras);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const period = await getCurrentVedicPeriod();
      if (cancelled) return;
      setCurrentPeriod(period ?? null);
      if (period) {
        const periodMantras = await getMantrasByPeriod(period.id);
        if (!cancelled) {
          setMantras(periodMantras);
          if (periodMantras.length > 0 && !selectedMantraId) {
            const recommendedId = jyotishRecommendation?.recommendedMantraId;
            setSelectedMantraId(recommendedId && periodMantras.find(m => m.id === recommendedId) ? recommendedId : periodMantras[0].id);
          }
        }
      } else {
        const allMantras = await getMantras();
        if (!cancelled) {
          setMantras(allMantras);
          if (allMantras.length > 0 && !selectedMantraId) {
            const recommendedId = jyotishRecommendation?.recommendedMantraId;
            setSelectedMantraId(recommendedId && allMantras.find(m => m.id === recommendedId) ? recommendedId : allMantras[0].id);
          }
        }
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Update selected mantra when recommendation changes (only if no mantra is currently selected)
  useEffect(() => {
    if (jyotishRecommendation?.recommendedMantraId && mantras.length > 0 && !selectedMantraId) {
      const recommendedMantra = mantras.find(m => m.id === jyotishRecommendation.recommendedMantraId);
      if (recommendedMantra) {
        setSelectedMantraId(recommendedMantra.id);
      }
    }
  }, [jyotishRecommendation?.recommendedMantraId, mantras, selectedMantraId]);

  // Auto-select recommended mantra once (SAFE)
  useEffect(() => {
    if (!selectedMantraId && recommendedMantras.length > 0) {
      setSelectedMantraId(recommendedMantras[0].id);
    }
  }, [recommendedMantras, selectedMantraId]);

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
      toast.success(`+${mantra.shc_reward} SHC ${t('mantras.earned', 'earned')}`);
      refreshBalance();
    } catch (e) {
      console.error(e);
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

    audio.play().catch(() => toast.error(t('mantras.playFailed', 'Failed to play audio')));
  };

  const handleStart = () => {
    if (!selectedMantra?.audio_url) {
      toast.error(t('mantras.noAudio', 'No audio available.'));
      return;
    }
    if (selectedMantra.is_premium && !isPremium) {
      toast.error(t('mantras.premiumRequired', 'Premium membership required.'));
      return;
    }
    if (count >= reps) setCount(0);
    if (audioRef.current && currentMantraIdRef.current === selectedMantra.id && count < reps) {
      setIsPlaying(true);
      audioRef.current.play().catch(() => toast.error(t('mantras.playFailed')));
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
          {t('mantras.title', 'Mantras')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('mantras.subtitle', 'Choose one mantra and repeat it 108 times.')}
        </p>
      </section>

      <div className="px-4 flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Choose a mantra — list (clickable) */}
        <section className="flex-shrink-0 md:w-72">
          {currentPeriod && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{currentPeriod.title}</h3>
                {currentPeriod.description && (
                  <p className="text-sm text-muted-foreground mb-2">{currentPeriod.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {currentPeriod.start_date} – {currentPeriod.end_date}
                </p>
              </CardContent>
            </Card>
          )}
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left"
            onClick={() => setListExpanded(!listExpanded)}
          >
            <h2 className="font-semibold text-foreground">{t('mantras.choose', 'Choose a mantra')}</h2>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${listExpanded ? 'rotate-180' : ''}`} />
          </button>
          {listExpanded && (
            <div className="mt-2 space-y-2">
              {mantras.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('mantras.comingSoon', 'More mantras coming soon.')}</p>
              ) : (
                <>
                  {recommendedMantras.length > 0 && (
                    <>
                      <h4 className="text-xs uppercase text-muted-foreground mb-2">
                        Recommended for You
                      </h4>
                      {recommendedMantras.map((m) => {
                        const isRecommended = true;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleMantraSelect(m)}
                            className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 transition ${
                              selectedMantraId === m.id
                                ? 'border-primary bg-primary/10'
                                : isRecommended
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-card/50 hover:bg-muted/30'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">{m.title}</p>
                                {m.category && (
                                  <span className="text-[10px] text-muted-foreground uppercase">{m.category}</span>
                                )}
                                <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Recommended</span>
                              </div>
                              {m.recommended_duration ? (
                                <p className="text-xs text-muted-foreground">{m.recommended_duration}</p>
                              ) : m.duration_seconds > 0 ? (
                                <p className="text-xs text-muted-foreground">{formatDuration(m.duration_seconds)}</p>
                              ) : null}
                              {m.explanation && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.explanation}</p>
                              )}
                              {m.is_premium && !isPremium && (
                                <Lock className="w-3 h-3 text-muted-foreground mt-1" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                  {Object.entries(groupedMantras).map(([cat, items]) => (
                    <div key={cat} className="mt-4">
                      <h4 className="text-xs uppercase text-muted-foreground mb-2">
                        {cat.replace('_', ' ')}
                      </h4>
                      {items.map((m) => {
                        const isRecommended = recommendedMantras.some((rm) => rm.id === m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleMantraSelect(m)}
                            className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 transition mt-2 ${
                              selectedMantraId === m.id
                                ? 'border-primary bg-primary/10'
                                : isRecommended
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-card/50 hover:bg-muted/30'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {isRecommended ? (
                                <Sparkles className="h-5 w-5 text-primary" />
                              ) : (
                                <Music className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">{m.title}</p>
                                {m.category && (
                                  <span className="text-[10px] text-muted-foreground uppercase">{m.category}</span>
                                )}
                                {isRecommended && (
                                  <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Recommended</span>
                                )}
                              </div>
                              {m.recommended_duration ? (
                                <p className="text-xs text-muted-foreground">{m.recommended_duration}</p>
                              ) : m.duration_seconds > 0 ? (
                                <p className="text-xs text-muted-foreground">{formatDuration(m.duration_seconds)}</p>
                              ) : null}
                              {m.explanation && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.explanation}</p>
                              )}
                              {m.is_premium && !isPremium && (
                                <Lock className="w-3 h-3 text-muted-foreground mt-1" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        {/* Now practicing — card */}
        <section className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground mb-3">{t('mantras.now', 'Now practicing')}</h2>
          {!selectedMantra ? (
            <Card className="rounded-2xl border-border p-6">
              <p className="text-muted-foreground text-center">{t('mantras.choose', 'Choose a mantra')}</p>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border overflow-hidden">
              <CardContent className="p-6">
                <p className="text-lg sm:text-xl font-semibold text-foreground text-center mb-1">
                  {selectedMantra.title}
                </p>
                {selectedMantra.category && (
                  <p className="text-xs text-muted-foreground text-center uppercase">{selectedMantra.category}</p>
                )}
                {selectedMantra.recommended_duration && (
                  <p className="text-xs text-muted-foreground text-center">{selectedMantra.recommended_duration}</p>
                )}
                {selectedMantra.explanation && (
                  <p className="text-sm text-muted-foreground text-center mt-2 mb-4">{selectedMantra.explanation}</p>
                )}
                {selectedMantra.is_premium && !isPremium && (
                  <div className="flex items-center justify-center gap-2 text-amber-500 text-sm mb-4">
                    <Lock className="w-4 h-4" />
                    {t('mantras.premiumRequired', 'Premium membership required')}
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {t('mantras.guidanceVoice', 'Voice only')}
                </p>

                {/* Vedic Guide Card - Only show if Jyotish data exists */}
                {jyotishRecommendation && (
                  <Card className="rounded-xl border-border bg-primary/5 border-primary/20 mb-6">
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
                            <span>Duration: {jyotishRecommendation.duration}</span>
                            <span>Repetitions: {jyotishRecommendation.repetitions}</span>
                            <span>Best time: {jyotishRecommendation.bestTime}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {jyotishRecommendation && (
                  <Card className="mb-4">
                    <CardContent>
                      <p className="text-sm">
                        {jyotishRecommendation.message}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                        <span>{jyotishRecommendation.duration}</span>
                        <span>{jyotishRecommendation.repetitions}x</span>
                        <span>{jyotishRecommendation.bestTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="rounded-xl border-border bg-muted/20 mb-6">
                  <CardContent className="p-4">
                    <p className="font-medium text-foreground mb-2">{t('mantras.instructions.title', 'How to practice')}</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>{t('mantras.instructions.step1', 'Sit comfortably.')}</li>
                      <li>{t('mantras.instructions.step2', 'Press Start.')}</li>
                      <li>{t('mantras.instructions.step3', 'Repeat with the recording — 108 times.')}</li>
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
                        <Button size="lg" className="rounded-full gap-2" onClick={handleStart}>
                          <Play className="h-5 w-5" />
                          {t('mantras.start', 'Start')}
                        </Button>
                      ) : (
                        <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={handlePause}>
                          <Pause className="h-5 w-5" />
                          {t('mantras.pause', 'Pause')}
                        </Button>
                      )}
                      <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                        {t('mantras.reset', 'Reset')}
                      </Button>
                      {count > 0 && (
                        <Button variant="ghost" size="lg" className="rounded-full gap-2" onClick={handleRestartFrom1}>
                          {t('mantras.restartFrom1', 'Restart from 1')}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xl font-semibold text-foreground mb-2">
                      {t('mantras.completeTitle', 'Complete')}
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {t('mantras.completeBody', 'Take a breath. Notice how you feel.')}
                    </p>
                    <Button size="lg" className="rounded-full gap-2" onClick={() => { setCount(0); setCompleted(false); handleStart(); }}>
                      <Play className="h-5 w-5" />
                      {t('mantras.playAgain', 'Play again')}
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
