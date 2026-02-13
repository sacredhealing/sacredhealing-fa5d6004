import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Play, Pause, RotateCcw, ChevronRight, ChevronDown, Sparkles, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';
import { getMantras, type MantraItem, MANTRA_REPETITIONS } from '@/features/mantras/getMantras';
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

/* =========================================================
   REUSABLE CATEGORY BLOCK (UI-SAFE)
========================================================= */

function CategorySection({
  title,
  mantras,
  selectedMantraId,
  onSelect,
  highlight = false,
}: {
  title: string;
  mantras: MantraItem[];
  selectedMantraId: string | null;
  onSelect: (id: string) => void;
  highlight?: boolean;
}) {
  if (!mantras.length) return null;

  return (
    <div className="mb-8">
      <h4 className="text-[10px] uppercase tracking-[0.2em] mb-3 text-zinc-500 font-bold px-1">
        {title}
      </h4>
      <div className="space-y-1">
        {mantras.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`w-full group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200
              ${selectedMantraId === m.id
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                : highlight
                ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
                : 'border-transparent hover:bg-white/5'}
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${selectedMantraId === m.id ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                {highlight ? <Sparkles className="h-4 w-4" /> : <Music className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <div className={`font-medium text-sm truncate ${selectedMantraId === m.id ? 'text-primary' : 'text-zinc-300'}`}>
                  {m.title}
                </div>
                <div className="text-[10px] text-zinc-500">{formatDuration(m.duration_seconds)}</div>
              </div>
            </div>
            {selectedMantraId === m.id && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

const Mantras = () => {
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMantraIdRef = useRef<string | null>(null);

  const reps = MANTRA_REPETITIONS;

  // Jyotish recommendation
  const jyotish = useJyotishMantraRecommendation(mantras);

  /* =========================================================
     LOAD MANTRAS
  ========================================================= */
  useEffect(() => {
    let cancelled = false;
    getMantras().then((data) => {
      if (!cancelled) {
        setMantras(data);
      }
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  /* =========================================================
     STABLE AUTO-SELECTION (never override user choice)
  ========================================================= */
  useEffect(() => {
    if (!jyotish?.recommendedMantraId) return;
    if (selectedMantraId) return;

    const exists = mantras.find((m) => m.id === jyotish.recommendedMantraId);
    if (exists) {
      setSelectedMantraId(exists.id);
    }
  }, [jyotish?.recommendedMantraId, mantras, selectedMantraId]);

  // Fallback: select first mantra if none selected
  useEffect(() => {
    if (mantras.length > 0 && !selectedMantraId && !jyotish?.recommendedMantraId) {
      setSelectedMantraId(mantras[0].id);
    }
  }, [mantras, selectedMantraId, jyotish?.recommendedMantraId]);

  /* =========================================================
     CATEGORY GROUPING (pure view logic)
  ========================================================= */
  const grouped = useMemo(() => {
    const map: Record<string, MantraItem[]> = {
      planet: [],
      deity: [],
      intention: [],
      karma: [],
      wealth: [],
      health: [],
      peace: [],
      protection: [],
      spiritual: [],
      general: [],
    };

    mantras.forEach((m) => {
      const cat = (m.category || 'general') as string;
      if (map[cat]) map[cat].push(m);
    });

    return map;
  }, [mantras]);

  const selectedMantra = useMemo(
    () => mantras.find((m) => m.id === selectedMantraId) || null,
    [mantras, selectedMantraId]
  );

  /* =========================================================
     RECOMMENDED SECTION (planet mantras matching current dasha)
  ========================================================= */
  const recommendedMantras = useMemo(() => {
    if (!jyotish?.planet) return [];
    return mantras.filter(
      (m) => m.category === 'planet' && m.planet_type === jyotish.planet
    );
  }, [jyotish, mantras]);

  /* =========================================================
     PLAYBACK LOGIC
  ========================================================= */
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

  const handleMantraSelect = (id: string) => {
    setSelectedMantraId(id);
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
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 md:gap-10">
        {/* ===============================================
            LEFT: MANTRA LIST (NAV)
        =============================================== */}
        <aside className="space-y-2 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto pr-2 lg:pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-heading font-serif font-bold text-foreground mb-2 tracking-tight">
              {t('mantras.title', 'Mantras')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('mantras.subtitle', 'Choose one mantra and repeat it 108 times.')}
            </p>
          </div>

          {/* Choose a mantra — expandable flat list (always shows all mantras) */}
          <div className="mb-6">
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
                  mantras.map((m) => {
                    const isRecommended = jyotish?.recommendedMantraId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMantraSelect(m.id)}
                        className={`w-full text-left rounded-xl border p-4 flex items-center gap-3 transition ${
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
                            {isRecommended && (
                              <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Recommended</span>
                            )}
                          </div>
                          {m.duration_seconds > 0 && (
                            <p className="text-xs text-muted-foreground">{formatDuration(m.duration_seconds)}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Category sections (when we have categorized mantras) */}
          {(jyotish && recommendedMantras.length > 0) || Object.values(grouped).some((arr) => arr.length > 0) ? (
            <div className="space-y-6">
              {jyotish && recommendedMantras.length > 0 && (
                <CategorySection
                  title={t('mantras.recommended', 'Recommended for You')}
                  mantras={recommendedMantras}
                  selectedMantraId={selectedMantraId}
                  onSelect={handleMantraSelect}
                  highlight
                />
              )}
              <CategorySection title="Planets" mantras={grouped.planet} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Deity" mantras={grouped.deity} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Intention" mantras={grouped.intention} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Karma & Healing" mantras={grouped.karma} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Wealth & Abundance" mantras={grouped.wealth} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Health & Vitality" mantras={grouped.health} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Peace & Calm" mantras={grouped.peace} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Protection & Power" mantras={grouped.protection} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="Spiritual Growth" mantras={grouped.spiritual} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
              <CategorySection title="General" mantras={grouped.general} selectedMantraId={selectedMantraId} onSelect={handleMantraSelect} />
            </div>
          ) : null}
        </aside>

        {/* ===============================================
            RIGHT: PRACTICE AREA
        =============================================== */}
        <main className="flex-1 min-w-0">
        <h2 className="font-semibold text-foreground mb-3">{t('mantras.now', 'Now practicing')}</h2>
        {/* VEDIC GUIDE CARD — when jyotish exists and user has selected a mantra */}
        {jyotish && selectedMantra && (
          <Card className="mb-8 bg-primary/5 border-primary/20 backdrop-blur-sm border">
            <CardContent className="p-5">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-primary/20 rounded-full shrink-0">
                  <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                    Vedic Guidance: {jyotish.planet} Period
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {jyotish.message}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Hash className="h-3 w-3 text-primary" />
                      <span>108 repetitions</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Music className="h-3 w-3 text-primary" />
                      <span>{jyotish.bestTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PRACTICE UI */}
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
              <p className="text-sm text-muted-foreground text-center mb-6">
                {t('mantras.guidanceVoice', 'Voice only')}
              </p>

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
        </main>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default Mantras;
