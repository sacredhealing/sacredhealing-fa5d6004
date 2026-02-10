import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Music, Play, Pause, Square, RotateCcw, Volume2, Bell, BellOff, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { toast } from 'sonner';

export type MantraFeeling = 'calm' | 'strength' | 'love' | 'protection';

const FEELING_PRESETS: Record<MantraFeeling, { text: string; key: string }> = {
  calm: { text: 'I am calm. I am safe.', key: 'mantras.feelingCalm' },
  strength: { text: 'I am strong. I am enough.', key: 'mantras.feelingStrength' },
  love: { text: 'I am loved. I am love.', key: 'mantras.feelingLove' },
  protection: { text: 'I am protected. Light surrounds me.', key: 'mantras.feelingProtection' },
};

const REPEAT_OPTIONS = [9, 27, 54, 108] as const;
type PlayMode = 'voice' | 'chime' | 'silent';

interface MantraFromDb {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  play_count: number;
}

const Mantras = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshBalance } = useSHCBalance();

  const [mantras, setMantras] = useState<MantraFromDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeeling, setSelectedFeeling] = useState<MantraFeeling | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [repeatCount, setRepeatCount] = useState<typeof REPEAT_OPTIONS[number]>(27);
  const [playMode, setPlayMode] = useState<PlayMode>('voice');
  const [currentRep, setCurrentRep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savedDaily, setSavedDaily] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mantraText = selectedFeeling
    ? (t(FEELING_PRESETS[selectedFeeling].key, FEELING_PRESETS[selectedFeeling].text))
    : (t(FEELING_PRESETS.calm.key, FEELING_PRESETS.calm.text));

  useEffect(() => {
    fetchMantras();
  }, []);

  const fetchMantras = async () => {
    const { data } = await supabase
      .from('mantras')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMantras(data);
    setLoading(false);
  };

  const getPlayableUrl = (url: string): string => {
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    return url;
  };

  const handleBeginNow = () => {
    setSelectedFeeling(selectedFeeling || 'calm');
    setSessionStarted(true);
    setCurrentRep(0);
    setCompleted(false);
    setSavedDaily(false);
  };

  const repeatCountRef = useRef(repeatCount);
  repeatCountRef.current = repeatCount;

  useEffect(() => {
    return () => {
      if (silentIntervalRef.current) clearInterval(silentIntervalRef.current);
    };
  }, []);

  const handleStartSession = () => {
    if (playMode === 'silent') {
      if (silentIntervalRef.current) clearInterval(silentIntervalRef.current);
      setIsPlaying(true);
      const target = repeatCountRef.current;
      silentIntervalRef.current = setInterval(() => {
        setCurrentRep((c) => {
          const next = c + 1;
          if (next >= target) {
            if (silentIntervalRef.current) {
              clearInterval(silentIntervalRef.current);
              silentIntervalRef.current = null;
            }
            setIsPlaying(false);
            setCompleted(true);
            return target;
          }
          return next;
        });
      }, 3000);
      return;
    }
    const defaultMantra = mantras[0];
    if (!defaultMantra?.audio_url) {
      toast.error(t('mantras.noAudio', 'No audio available. Try silent mode.'));
      return;
    }
    if (playingId === defaultMantra.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setIsPlaying(false);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(getPlayableUrl(defaultMantra.audio_url));
    audioRef.current = audio;
    audio.addEventListener('timeupdate', () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress((prev) => ({ ...prev, [defaultMantra.id]: pct }));
    });
    audio.addEventListener('ended', () => {
      setCurrentRep((c) => {
        const next = c + 1;
        if (next >= repeatCount) {
          setIsPlaying(false);
          setPlayingId(null);
          setCompleted(true);
          if (user) awardMantraReward(defaultMantra);
          return repeatCount;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return next;
      });
    });
    audio.play().then(() => {
      setPlayingId(defaultMantra.id);
      setIsPlaying(true);
    }).catch(() => toast.error(t('mantras.playFailed', 'Failed to play audio')));
  };

  const awardMantraReward = async (mantra: MantraFromDb) => {
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

  const handleStop = () => {
    if (silentIntervalRef.current) {
      clearInterval(silentIntervalRef.current);
      silentIntervalRef.current = null;
    }
    audioRef.current?.pause();
    setPlayingId(null);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentRep(0);
    setCompleted(false);
    handleStartSession();
  };

  const handleSaveDaily = () => {
    try {
      localStorage.setItem('mantra:daily', mantraText);
      setSavedDaily(true);
      toast.success(t('mantras.savedDaily', 'Saved as your daily mantra'));
    } catch {
      toast.error(t('common.error', 'Error'));
    }
  };

  const progressPercent = repeatCount > 0 ? (currentRep / repeatCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero */}
      <section className="px-4 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {t('mantras.title', 'Mantra')}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          {t('mantras.subtitle', 'A small phrase to hold you when the mind is loud.')}
        </p>
        {!sessionStarted && (
          <Button
            size="lg"
            className="mt-6 rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={handleBeginNow}
          >
            {t('mantras.beginNow', 'Begin now')}
          </Button>
        )}
      </section>

      {sessionStarted && !completed && (
        <>
          {/* Feeling picker */}
          <section className="px-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">
              {t('mantras.chooseFeeling', 'How do you need to feel?')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FEELING_PRESETS) as MantraFeeling[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedFeeling(key)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedFeeling === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:bg-muted/30'
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">
                    {t(`mantras.need${key.charAt(0).toUpperCase() + key.slice(1)}`, key === 'calm' ? 'I need calm' : key === 'strength' ? 'I need strength' : key === 'love' ? 'I need love' : 'I need protection')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Ritual steps */}
          <section className="px-4 mb-6">
            <Card className="rounded-xl border-border bg-muted/20">
              <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                <p>1) {t('mantras.step1', 'Breathe once')}</p>
                <p>2) {t('mantras.step2', 'Repeat with the rhythm')}</p>
                <p>3) {t('mantras.step3', 'Let the last line land')}</p>
              </CardContent>
            </Card>
          </section>

          {/* Devotional player */}
          <section className="px-4 mb-6">
            <Card className="rounded-2xl border-border overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xl sm:text-2xl text-center text-foreground font-medium leading-relaxed min-h-[3rem]">
                  {mantraText}
                </p>

                <div className="mt-6 flex justify-center gap-2 flex-wrap">
                  {REPEAT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRepeatCount(n)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        repeatCount === n
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  {(['voice', 'chime', 'silent'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPlayMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm capitalize flex items-center gap-1.5 ${
                        playMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {mode === 'voice' && <Volume2 className="h-4 w-4" />}
                      {mode === 'chime' && <Bell className="h-4 w-4" />}
                      {mode === 'silent' && <BellOff className="h-4 w-4" />}
                      {t(`mantras.mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`, mode)}
                    </button>
                  ))}
                </div>

                {/* Progress ring (circular) */}
                <div className="mt-6 flex justify-center">
                  <div className="relative w-24 h-24">
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
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                      {currentRep}/{repeatCount}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  {!isPlaying ? (
                    <Button
                      size="lg"
                      className="rounded-full gap-2"
                      onClick={handleStartSession}
                    >
                      <Play className="h-5 w-5" />
                      {t('mantras.start', 'Start')}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={handleStop}>
                        <Square className="h-4 w-4" />
                        {t('mantras.stop', 'Stop')}
                      </Button>
                      <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={handleRestart}>
                        <RotateCcw className="h-4 w-4" />
                        {t('mantras.restart', 'Restart')}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {sessionStarted && completed && (
        <section className="px-4 py-6">
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <p className="text-foreground font-medium">
                {t('mantras.integrationMessage', 'Let this feeling rest in your body for a moment.')}
              </p>
              <Button
                variant="outline"
                size="lg"
                className="mt-4 rounded-full"
                onClick={handleSaveDaily}
                disabled={savedDaily}
              >
                {savedDaily ? t('mantras.savedDaily', 'Saved as my daily mantra') : t('mantras.saveDaily', 'Save as my daily mantra')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 block mx-auto"
                onClick={() => { setSessionStarted(false); setCompleted(false); }}
              >
                {t('mantras.back', 'Back')}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Browse all — accordion */}
      <section className="px-4 mt-8">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="browse" className="border border-border rounded-xl px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="font-semibold text-foreground">{t('mantras.browseAll', 'Browse all')}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {mantras.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('mantras.comingSoon', 'More mantras coming soon.')}
                </p>
              ) : (
                <div className="space-y-3">
                  {mantras.map((m) => (
                    <Link key={m.id} to="/mantras" className="block">
                      <Card className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Music className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{m.title}</p>
                          {m.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
};

export default Mantras;
