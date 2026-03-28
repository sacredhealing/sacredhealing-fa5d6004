import React, { useLayoutEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Star, Sparkles, CheckCircle, AlertCircle, Quote, Crown, Compass, 
  Briefcase, Heart, Leaf, Coins, Clock, Gem, Target, Brain, Wand2, User, 
  RefreshCw, Volume2, VolumeX, Timer, MessageCircle, ChevronDown, Shield, Navigation, Flame
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile, HoraInfo } from '@/lib/vedicTypes';
import { getPlanetEmoji, getEnergyGradient, getSuccessColor } from '@/lib/vedicTypes';
import { TimezoneSelector, useUserTimezone } from './TimezoneSelector';
import { HoraDateTimePicker } from './HoraDateTimePicker';
import { HoraNotificationBanner } from './HoraNotificationBanner';
import { TempleSection } from './TempleSection';
import { useHoraNotification } from '@/hooks/useHoraNotification';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useTranslation } from '@/hooks/useTranslation';
import { vedicLocaleTag } from '@/lib/vedicLocale';

const CosmicConsultation = lazy(() => import('./CosmicConsultation').then((m) => ({ default: m.CosmicConsultation })));
const AccurateHoraWatch = lazy(() => import('./AccurateHoraWatch').then((m) => ({ default: m.AccurateHoraWatch })));

interface AIVedicDashboardProps {
  user: UserProfile;
  userId?: string | null;
  onEditDetails?: () => void;
  onUpgrade?: () => void;
}

// Compass Pillar Card
const CompassCard = ({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => {
  // Convert long text to bullet points
  const bullets = content.split(/[.!]/).filter(s => s.trim().length > 5).slice(0, 3);
  return (
    <motion.div 
      className="p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-indigo-500/50 transition-all duration-500"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-indigo-400" />
        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{title}</h4>
      </div>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>{b.trim()}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// Tappable Blueprint Card with expand
const BlueprintCard = ({ title, preview, content, icon }: { title: string; preview: string; content: string; icon: string }) => {
  const [expanded, setExpanded] = useState(false);
  // Extract a short preview from content
  const shortPreview = preview || content.split('.')[0] + '.';
  // Convert to bullets
  const bullets = content.split(/[.!]/).filter(s => s.trim().length > 5).slice(0, 5);

  return (
    <motion.button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h4 className="text-xs font-black text-amber-200 uppercase tracking-widest">{title}</h4>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-amber-400/60" />
        </motion.div>
      </div>
      {!expanded && (
        <p className="text-sm text-amber-100/60 italic pl-10 truncate">{shortPreview}</p>
      )}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pl-10 pt-3"
          >
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
                  <span className="text-amber-400">◈</span>
                  <span>{b.trim()}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Bhrigu Nandi Nadi — ages/planets fixed; descriptions from vedicAstrology.bhriguDesc*
const BHRIGU_ACTIVATION_META = [
  { age: 16, planet: 'Jupiter', emoji: '♃', descKey: 'vedicAstrology.bhriguDesc16' as const },
  { age: 22, planet: 'Sun', emoji: '☀️', descKey: 'vedicAstrology.bhriguDesc22' as const },
  { age: 24, planet: 'Moon', emoji: '🌙', descKey: 'vedicAstrology.bhriguDesc24' as const },
  { age: 28, planet: 'Venus', emoji: '♀️', descKey: 'vedicAstrology.bhriguDesc28' as const },
  { age: 32, planet: 'Mars', emoji: '♂️', descKey: 'vedicAstrology.bhriguDesc32' as const },
  { age: 36, planet: 'Mercury', emoji: '☿️', descKey: 'vedicAstrology.bhriguDesc36' as const },
  { age: 42, planet: 'Rahu/Ketu', emoji: '🐉', descKey: 'vedicAstrology.bhriguDesc42' as const },
  { age: 48, planet: 'Saturn', emoji: '\u2644', descKey: 'vedicAstrology.bhriguDesc48' as const },
];

// Nadi Directional Mapping (labels via vedicAstrology.dashDir* / dashTheme* / dashBlurb*)
const NADI_DIRECTIONS = [
  { id: 'east' as const, houses: '1, 5, 9', icon: '🌅', color: 'amber' },
  { id: 'south' as const, houses: '2, 6, 10', icon: '🔥', color: 'rose' },
  { id: 'west' as const, houses: '3, 7, 11', icon: '🌊', color: 'indigo' },
  { id: 'north' as const, houses: '4, 8, 12', icon: '❄️', color: 'emerald' },
];

type NadiId = (typeof NADI_DIRECTIONS)[number]['id'];

const NADI_DIR_KEY: Record<NadiId, string> = {
  east: 'vedicAstrology.dashDirEast',
  south: 'vedicAstrology.dashDirSouth',
  west: 'vedicAstrology.dashDirWest',
  north: 'vedicAstrology.dashDirNorth',
};

const NADI_THEME_KEY: Record<NadiId, string> = {
  east: 'vedicAstrology.dashThemeDharma',
  south: 'vedicAstrology.dashThemeArtha',
  west: 'vedicAstrology.dashThemeKama',
  north: 'vedicAstrology.dashThemeMoksha',
};

const NADI_BLURB_KEY: Record<NadiId, string> = {
  east: 'vedicAstrology.dashBlurbEast',
  south: 'vedicAstrology.dashBlurbSouth',
  west: 'vedicAstrology.dashBlurbWest',
  north: 'vedicAstrology.dashBlurbNorth',
};

export const AIVedicDashboard: React.FC<AIVedicDashboardProps> = ({ user, userId, onEditDetails, onUpgrade }) => {
  const { t, language } = useTranslation();
  const locale = vedicLocaleTag(language);

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[420px] space-y-6 px-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-[3px] border-amber-500/15 rounded-full" />
        <motion.div
          className="absolute inset-0 border-[3px] border-amber-500/80 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-4 border-[3px] border-amber-400/15 rounded-full" />
        <motion.div
          className="absolute inset-4 border-[3px] border-amber-400/70 border-b-transparent rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 bg-amber-200 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.9)]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-lg font-serif text-amber-100/90 animate-pulse">{t('vedicAstrology.dashLoadingTitle')}</h3>
        <p className="text-muted-foreground text-[11px] leading-relaxed uppercase tracking-[0.2em]">
          {t('vedicAstrology.dashLoadingSub')}
        </p>
      </div>
    </div>
  );

  const { reading, isLoading, error, generateReading } = useAIVedicReading();
  const { timezone, setTimezone, loading: timezoneLoading } = useUserTimezone();
  const [lastSync, setLastSync] = useState<string>("");
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [checkedRemedies, setCheckedRemedies] = useState<Record<number, boolean>>({});
  const [expandedYogaIdx, setExpandedYogaIdx] = useState<number | null>(null);
  const [horaNotifyEnabled, setHoraNotifyEnabled] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { calculation } = useHoraWatch({ timezone, timeOffset });
  const currentHoraPlanet = calculation?.currentHora?.planet;
  const { message: horaNotificationMessage, dismiss: dismissHoraNotification } = useHoraNotification(currentHoraPlanet, horaNotifyEnabled);

  const bhriguActivations = useMemo(
    () =>
      BHRIGU_ACTIVATION_META.map((a) => ({
        age: a.age,
        planet: a.planet,
        emoji: a.emoji,
        desc: t(a.descKey),
      })),
    [t]
  );

  // Calculate user's age and active Bhrigu cycle
  const bhriguData = useMemo(() => {
    if (!user.birthDate) return null;
    const birthYear = new Date(user.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const active = [...bhriguActivations].reverse().find(a => age >= a.age);
    const next = bhriguActivations.find(a => a.age > age);
    return { age, active, next };
  }, [user.birthDate, bhriguActivations]);

  // useLayoutEffect: apply cached reading synchronously before paint; avoids long blank screen
  useLayoutEffect(() => {
    if (user.birthDate && user.birthTime && user.birthPlace && !timezoneLoading) {
      void generateReading(user, timeOffset, timezone, userId);
      try {
        const targetTime = new Date(Date.now() + timeOffset * 60000);
        setLastSync(targetTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: timezone }));
      } catch {
        setLastSync(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [user.plan, user.birthDate, user.birthTime, user.birthPlace, timeOffset, timezone, timezoneLoading, userId, generateReading, locale]);

  const handleTimeOffsetChange = (value: number[]) => setTimeOffset(value[0]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!user.birthDate || !user.birthTime || !user.birthPlace) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('vedicAstrology.dashBirthRequiredTitle')}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {t('vedicAstrology.dashBirthRequiredBody')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (timezoneLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('vedicAstrology.dashSyncFailedTitle')}</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => generateReading(user, timeOffset, undefined, userId)} className="mt-4">{t('vedicAstrology.dashRetryReading')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !reading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 relative">
      {horaNotificationMessage && (
        <HoraNotificationBanner message={horaNotificationMessage} onDismiss={dismissHoraNotification} />
      )}
      <div id="overview" />

      {/* ══════════ HORA WATCH ══════════ */}
      <div id="hora" />
      <TempleSection title={t('vedicAstrology.dashSectionHora')} icon="⏱️" defaultOpen={false}>
        <p className="text-[11px] text-amber-500/80 font-black uppercase tracking-[0.3em] mb-4">{t('vedicAstrology.dashHoraSubtitle')}</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <TimezoneSelector currentTimezone={timezone} onTimezoneChange={setTimezone} compact />
          </div>

          <HoraDateTimePicker timeOffset={timeOffset} onTimeOffsetChange={(v) => setTimeOffset(v)} />

          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-900/10 border border-amber-500/20">
            <Label htmlFor="hora-notify" className="text-sm font-serif text-amber-200/80 cursor-pointer">
              {t('vedicAstrology.dashHoraNotify')}
            </Label>
            <Switch
              id="hora-notify"
              checked={horaNotifyEnabled}
              onCheckedChange={setHoraNotifyEnabled}
              className="data-[state=checked]:bg-amber-500/30"
            />
          </div>

          {user.plan !== 'free' && (
            <div className="bg-background/80 border border-border p-5 rounded-3xl shadow-2xl space-y-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t('vedicAstrology.dashTimeScrubber')}</span>
              <Slider value={[timeOffset]} min={-720} max={720} step={30} onValueChange={handleTimeOffsetChange} className="w-full" />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{t('vedicAstrology.dashH12Minus', '-12h')}</span>
                <span>{timeOffset === 0 ? t('vedicAstrology.dashNow') : `${timeOffset > 0 ? '+' : ''}${timeOffset}m`}</span>
                <span>{t('vedicAstrology.dashH12Plus', '+12h')}</span>
              </div>
            </div>
          )}
        </div>

        <Suspense fallback={<div className="p-4 text-amber-400/50 font-serif text-sm">{t('vedicAstrology.dashLoadingHora')}</div>}>
          <AccurateHoraWatch timezone={timezone} timeOffset={timeOffset} userBirthChart={{}} />
        </Suspense>
      </TempleSection>

      {/* ══════════ GURU ORACLE with SPEECH BUBBLE ══════════ */}
      <div id="consult-guru" />
      <TempleSection title={t('vedicAstrology.dashConsultGuru')} icon="💬" defaultOpen={false}>
        {user.plan === 'premium' && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] uppercase tracking-widest mb-4">
            {t('vedicAstrology.dashOracleActive')}
          </Badge>
        )}

        {/* Akashic Verdict Speech Bubble Banner */}
        {reading.todayInfluence && (
          <motion.div
            className="relative p-6 rounded-3xl border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg, rgba(88, 28, 135, 0.15), rgba(30, 27, 75, 0.2)),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
              `,
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Palm leaf texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(200,170,100,0.3)_10px,rgba(200,170,100,0.3)_11px)]" />
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-10 w-6 h-6 bg-purple-900/15 border-b border-r border-purple-500/30 transform rotate-45" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] block mb-2">{t('vedicAstrology.dashAkashicVerdict')}</span>
                <p className="text-base sm:text-lg font-serif italic text-purple-100/90 leading-relaxed">
                  "{reading.todayInfluence.wisdomQuote}"
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSpeak(
                    t('vedicAstrology.dashSpeakVerdict', {
                      defaultValue: "{{quote}} Today's Nakshatra is {{nakshatra}}. {{description}}",
                      quote: reading.todayInfluence.wisdomQuote,
                      nakshatra: reading.todayInfluence.nakshatra,
                      description: reading.todayInfluence.description,
                    })
                  )
                }
                className={`flex-shrink-0 rounded-2xl ${isSpeaking ? 'bg-purple-500 text-white border-purple-500' : 'border-purple-500/40 text-purple-300'}`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="ml-1.5 text-[10px] font-bold uppercase hidden sm:inline">{isSpeaking ? t('vedicAstrology.dashStop') : t('vedicAstrology.dashListen')}</span>
              </Button>
            </div>
          </motion.div>
        )}

        <Suspense fallback={<div className="p-4 text-amber-400/50 font-serif text-sm">{t('vedicAstrology.dashLoadingGuru')}</div>}>
          <CosmicConsultation user={user} onUpgrade={onUpgrade} />
        </Suspense>
      </TempleSection>

      {/* ══════════ COSMIC PULSE (Nakshatra) ══════════ */}
      <div id="nakshatra" />
      <TempleSection title={t('vedicAstrology.dashCosmicPulse')} icon="🌙" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-purple-500/30">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest block mb-1">{t('vedicAstrology.dashNakshatraFocus')}</span>
            <h3 className="text-3xl font-black text-foreground mb-4">{reading.todayInfluence.nakshatra}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 border-l-2 border-muted pl-4 italic">
              {reading.todayInfluence.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {t('vedicAstrology.dashOptimalFlow')}
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToDo.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {t('vedicAstrology.dashKarmicFriction')}
                </h4>
                <ul className="space-y-2">
                  {reading.todayInfluence.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Soul Seed Quote */}
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 text-4xl opacity-5">ॐ</div>
            <Quote className="w-8 h-8 text-amber-500/40 mx-auto mb-4" />
            <h4 className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-4">{t('vedicAstrology.dashSoulSeed')}</h4>
            <p className="text-lg font-serif text-amber-100/80 leading-relaxed italic">
              "{reading.todayInfluence.wisdomQuote}"
            </p>
          </div>
        </div>
      </TempleSection>

      {/* ══════════ 4 ETERNAL PILLARS (Compass Tier) ══════════ */}
      {user.plan !== 'free' && reading.personalCompass && (
        <TempleSection title={t('vedicAstrology.dashPillarsTitle')} icon="🏛️" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <CompassCard icon={Briefcase} title={t('vedicAstrology.dashPillarCareer')} content={reading.personalCompass.career} />
            <CompassCard icon={Heart} title={t('vedicAstrology.dashPillarHarmony')} content={reading.personalCompass.relationship} />
            <CompassCard icon={Leaf} title={t('vedicAstrology.dashPillarHealth')} content={reading.personalCompass.health} />
            <CompassCard icon={Coins} title={t('vedicAstrology.dashPillarFinancial')} content={reading.personalCompass.financial} />
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-indigo-900/5 border border-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{t('vedicAstrology.dashTimingLabel')}</p>
                  <p className="text-lg font-bold text-foreground">{reading.personalCompass.currentDasha.period.split(' ')[0]}</p>
                </div>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-xl font-bold text-foreground">{t('vedicAstrology.dashMajorPeriod', { period: reading.personalCompass.currentDasha.period })}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{reading.personalCompass.currentDasha.meaning}</p>
                <Badge className="mt-2 px-4 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                  <Target className="w-3 h-3 mr-1" />
                  {t('vedicAstrology.dashFocus', { area: reading.personalCompass.currentDasha.focusArea })}
                </Badge>
              </div>
            </div>
          </div>
        </TempleSection>
      )}

      {/* ══════════ SOUL BLUEPRINT - TAPPABLE CARD GRID ══════════ */}
      <div id="blueprint" />
      {user.plan === 'premium' && reading.masterBlueprint && (
        <TempleSection title={t('vedicAstrology.dashSoulBlueprint')} icon="👑" defaultOpen={false}>
          {/* Tappable Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BlueprintCard
              title={t('vedicAstrology.dashBpSoulPurpose')}
              preview={reading.masterBlueprint.soulPurpose.split('.')[0]}
              content={reading.masterBlueprint.soulPurpose}
              icon="🔥"
            />
            <BlueprintCard
              title={t('vedicAstrology.dashBpNavamsha')}
              preview={reading.masterBlueprint.navamshaAnalysis.split('.')[0]}
              content={reading.masterBlueprint.navamshaAnalysis}
              icon="💎"
            />
            <BlueprintCard
              title={t('vedicAstrology.dashBpKarmicNodes')}
              preview={reading.masterBlueprint.karmicNodes.split('.')[0]}
              content={reading.masterBlueprint.karmicNodes}
              icon="🌀"
            />
            <BlueprintCard
              title={t('vedicAstrology.dashBpKarmaPatterns')}
              preview={reading.masterBlueprint.karmaPatterns.split('.')[0]}
              content={reading.masterBlueprint.karmaPatterns}
              icon="⚡"
            />
            <BlueprintCard
              title={t('vedicAstrology.dashBp12House')}
              preview={reading.masterBlueprint.soulMap12Houses.split('.')[0]}
              content={reading.masterBlueprint.soulMap12Houses}
              icon="✵"
            />
            <BlueprintCard
              title={t('vedicAstrology.dashBpSadeSati')}
              preview={reading.masterBlueprint.sadeSatiStatus}
              content={reading.masterBlueprint.sadeSatiStatus}
              icon="♄"
            />
          </div>

          {/* Active Planetary Yogas */}
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-4 text-center flex items-center justify-center gap-2">
              <Gem className="w-4 h-4" />
              {t('vedicAstrology.dashActiveYogas')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reading.masterBlueprint.significantYogas.map((yoga, i) => (
                <div key={i} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                  <h5 className="text-sm font-bold text-amber-100 mb-1">{yoga.name}</h5>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{yoga.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════ REMEDIAL PROTOCOLS - ACTION BANNER ══════════ */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900/15 to-teal-900/10 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-3 mb-6">
              <Wand2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-[clamp(24px,4vw,36px)] font-black text-emerald-300 font-serif">{t('vedicAstrology.dashRemedialProtocols')}</h3>
            </div>
            <p className="text-xs text-emerald-300/60 uppercase tracking-widest font-bold mb-6">
              {t('vedicAstrology.dashTapComplete')}
            </p>
            <div className="space-y-4">
              {reading.masterBlueprint.divineRemedies.map((remedy, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                    checkedRemedies[i]
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-card/30 border-border/40 hover:border-emerald-500/20'
                  }`}
                >
                  <Checkbox
                    checked={!!checkedRemedies[i]}
                    onCheckedChange={(checked) => setCheckedRemedies(prev => ({ ...prev, [i]: !!checked }))}
                    className="w-6 h-6 rounded-lg border-2 border-emerald-500/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <span className={`text-sm leading-relaxed ${checkedRemedies[i] ? 'text-emerald-300 line-through opacity-70' : 'text-foreground/80'}`}>
                    {remedy}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Timing Peaks */}
          <div className="p-5 rounded-2xl bg-muted/20 border border-border">
<h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2">{t('vedicAstrology.dashPrimaryTimingPeaks')}</h4>
          <p className="text-sm text-foreground font-medium">{reading.masterBlueprint.timingPeaks}</p>
          </div>
        </TempleSection>
      )}

      {/* ══════════ BHRIGU NANDI NADI - PLANET ACTIVATION TRACKER ══════════ */}
      {bhriguData && (
        <TempleSection title={t('vedicAstrology.dashBhriguActivation')} icon="🔱" defaultOpen={false}>
          <p className="text-[11px] text-orange-500/80 font-black uppercase tracking-[0.3em] mb-4">
            {t('vedicAstrology.dashNandiSubtitle', { age: bhriguData.age })}
          </p>

          {/* Active Cycle Banner */}
          {bhriguData.active && (
            <motion.div
              className="relative p-6 sm:p-8 rounded-3xl border-2 border-orange-500/40 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(194, 65, 12, 0.15), rgba(120, 53, 15, 0.1))',
              }}
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
            >
              <div className="absolute top-4 right-4 text-6xl opacity-10">{bhriguData.active.emoji}</div>
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.4em] block mb-2">
                {t('vedicAstrology.dashActivePlanetaryCycle')}
              </span>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">{bhriguData.active.emoji}</span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-orange-100">
                    {bhriguData.active.planet} {t('vedicAstrology.dashCycleSuffix')}
                  </h3>
                  <p className="text-xs text-orange-300/60 font-bold">
                    {t('vedicAstrology.dashActivatedAt', { age: bhriguData.active.age, currentAge: bhriguData.age })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-orange-100/80 leading-relaxed italic border-l-2 border-orange-500/40 pl-4">
                {bhriguData.active.desc}
              </p>
              {bhriguData.next && (
                <div className="mt-4 pt-4 border-t border-orange-500/20">
                  <p className="text-[10px] text-orange-400/60 uppercase tracking-widest">
                    {t('vedicAstrology.dashNextActivation', {
                      planet: bhriguData.next.planet,
                      age: bhriguData.next.age,
                      years: bhriguData.next.age - bhriguData.age,
                    })}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* All Activation Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bhriguActivations.map((a) => {
              const isActive = bhriguData.active?.age === a.age;
              const isPast = bhriguData.age >= a.age;
              return (
                <div
                  key={a.age}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isActive
                      ? 'border-orange-500/60 bg-orange-500/10 shadow-[0_0_20px_rgba(251,146,60,0.15)]'
                      : isPast
                      ? 'border-orange-500/20 bg-orange-500/5 opacity-70'
                      : 'border-border/30 bg-card/30 opacity-40'
                  }`}
                >
                  <span className="text-2xl block mb-1">{a.emoji}</span>
                  <p className="text-xs font-black text-foreground">{a.planet}</p>
                  <p className="text-[10px] text-muted-foreground">{t('vedicAstrology.dashAgeYears', { age: a.age })}</p>
                  {isActive && <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-2 animate-pulse" />}
                </div>
              );
            })}
          </div>
        </TempleSection>
      )}

      {/* ══════════ NADI DIRECTIONAL MAPPING ══════════ */}
      {user.plan !== 'free' && reading && (
        <TempleSection title={t('vedicAstrology.dashPlanetaryAlliances')} icon="🧭" defaultOpen={false}>
          <p className="text-[11px] text-cyan-500/80 font-black uppercase tracking-[0.3em] mb-4">
            {t('vedicAstrology.dashNadiMappingSubtitle')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NADI_DIRECTIONS.map((nd) => (
              <div
                key={nd.id}
                className={`p-5 sm:p-6 rounded-3xl border border-${nd.color}-500/30 bg-${nd.color}-500/5 hover:bg-${nd.color}-500/10 transition-all`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{nd.icon}</span>
                  <div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-wider">{t(NADI_DIR_KEY[nd.id])}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {t('vedicAstrology.dashHousesTheme', {
                        houses: nd.houses,
                        theme: t(NADI_THEME_KEY[nd.id]),
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-foreground/70 italic leading-relaxed border-l-2 border-current pl-3 opacity-80">
                  {t(NADI_BLURB_KEY[nd.id])}
                </p>
              </div>
            ))}
          </div>
        </TempleSection>
      )}

      {/* ══════════ ARTIFICIAL YOGA ACTIVATOR ══════════ */}
      {user.plan === 'premium' && reading?.masterBlueprint && (
        <TempleSection title={t('vedicAstrology.dashYogaActivator')} icon="🕉️" defaultOpen={false}>
          <p className="text-[11px] text-teal-500/80 font-black uppercase tracking-[0.3em] mb-4">
            {t('vedicAstrology.dashYogaActivatorSubtitle')}
          </p>

          <div className="space-y-4">
            {(reading.masterBlueprint.significantYogas || []).map((yoga, i) => (
              <div key={i} className="rounded-3xl border border-teal-500/20 bg-teal-500/5 overflow-hidden">
                <button
                  onClick={() => setExpandedYogaIdx(expandedYogaIdx === i ? null : i)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-black text-teal-100 uppercase tracking-wider">{yoga.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{yoga.impact}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest hidden sm:inline">
                      {expandedYogaIdx === i ? t('vedicAstrology.dashClose') : t('vedicAstrology.dashActivate')}
                    </span>
                    <motion.div animate={{ rotate: expandedYogaIdx === i ? 180 : 0 }}>
                      <ChevronDown className="w-5 h-5 text-teal-400" />
                    </motion.div>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedYogaIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-teal-500/20 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">
                              {t('vedicAstrology.dashYogaBeeja', 'Beeja Mantra')}
                            </p>
                            <p className="text-lg font-serif text-teal-100 italic">
                              {i % 3 === 0 ? '"Om Hreem Shreem"' : i % 3 === 1 ? '"Om Gam Ganapataye"' : '"Om Namah Shivaya"'}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">
                              {t('vedicAstrology.dashYogaFrequency', 'Frequency')}
                            </p>
                            <p className="text-lg font-mono text-teal-100">
                              {i % 3 === 0 ? '528 Hz' : i % 3 === 1 ? '432 Hz' : '741 Hz'}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">
                              {t('vedicAstrology.dashYogaPhysical', 'Physical Action')}
                            </p>
                            <p className="text-xs text-teal-100">
                              {i % 3 === 0
                                ? t('vedicAstrology.dashYogaAction0', 'Wear white on Fridays')
                                : i % 3 === 1
                                  ? t('vedicAstrology.dashYogaAction1', 'Donate yellow cloth')
                                  : t('vedicAstrology.dashYogaAction2', 'Fast on Mondays')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const mantra = i % 3 === 0 ? 'Om Hreem Shreem' : i % 3 === 1 ? 'Om Gam Ganapataye' : 'Om Namah Shivaya';
                            handleSpeak(
                              t('vedicAstrology.dashYogaSpeakScript', {
                                defaultValue: 'Bhrigu Remedy for {{yoga}}. Chant the mantra: {{mantra}}. {{impact}}',
                                yoga: yoga.name,
                                mantra,
                                impact: yoga.impact,
                              })
                            );
                          }}
                          className="w-full border-teal-500/40 text-teal-300 hover:bg-teal-500/10"
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {t('vedicAstrology.dashYogaSpeakRemedy', 'Speak Remedy Aloud')}
                          </span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </TempleSection>
      )}
    </div>
  );
};
