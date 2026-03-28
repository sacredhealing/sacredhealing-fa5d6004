import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Sunset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { getPlanetEmoji, getEnergyGradient, getSuccessColor, type HoraEnergyType } from '@/lib/vedicTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { vedicLocaleTag } from '@/lib/vedicLocale';

interface AccurateHoraWatchProps {
  timezone: string;
  timeOffset?: number;
  userBirthChart?: {
    moonSign?: string;
    ascendant?: string;
    sunSign?: string;
  };
}

function calculateSuccessRating(planet: string, birthChart?: AccurateHoraWatchProps['userBirthChart']): number {
  const baseRatings: Record<string, number> = {
    Jupiter: 85, Venus: 80, Mercury: 70, Moon: 65, Sun: 75, Mars: 55, Saturn: 45,
  };
  let rating = baseRatings[planet] || 60;
  if (birthChart) {
    if (birthChart.moonSign?.toLowerCase().includes('sagittarius') || birthChart.moonSign?.toLowerCase().includes('pisces')) {
      if (planet === 'Jupiter') rating += 10;
    }
    if (birthChart.moonSign?.toLowerCase().includes('taurus') || birthChart.moonSign?.toLowerCase().includes('libra')) {
      if (planet === 'Venus') rating += 10;
    }
  }
  return Math.min(100, Math.max(0, rating));
}

function getEnergyType(planet: string): HoraEnergyType {
  const auspicious = ['Jupiter', 'Venus', 'Mercury'];
  const inauspicious = ['Saturn', 'Mars'];
  if (auspicious.includes(planet)) return 'Auspicious';
  if (inauspicious.includes(planet)) return 'Inauspicious';
  return 'Neutral';
}

function labelEnergyType(type: HoraEnergyType, t: (k: string, d?: string) => string): string {
  if (type === 'Auspicious') return t('vedicAstrology.horaEnergyAuspicious', 'Auspicious');
  if (type === 'Inauspicious') return t('vedicAstrology.horaEnergyInauspicious', 'Inauspicious');
  return t('vedicAstrology.horaEnergyNeutral', 'Neutral');
}

// Progress Ring for remaining time
const ProgressRing = ({
  remainingMs,
  totalMs,
  remainingTime,
  remainingLabel,
}: {
  remainingMs: number;
  totalMs: number;
  remainingTime: string;
  remainingLabel: string;
}) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remainingMs / totalMs));
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = remainingMs < 5 * 60 * 1000;

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="hsl(var(--muted) / 0.15)" strokeWidth="10" fill="transparent" />
        <motion.circle
          cx="60" cy="60" r={radius}
          stroke={isUrgent ? 'hsl(0 72% 51%)' : 'hsl(var(--primary))'}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-xl font-black ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-foreground'}`}>
          {remainingTime}
        </span>
        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{remainingLabel}</span>
      </div>
    </div>
  );
};

// Horizontal Scroll Mini Card for upcoming horas
const UpcomingMiniCard = ({ planet, startTime, successRating }: { planet: string; startTime: string; successRating: number }) => (
  <div className="flex-shrink-0 w-28 p-4 rounded-2xl bg-card/60 border border-border/40 hover:border-amber-500/30 transition-all text-center space-y-2">
    <span className="text-3xl block">{getPlanetEmoji(planet)}</span>
    <p className="text-xs font-bold text-foreground truncate">{planet}</p>
    <p className="text-[10px] text-muted-foreground font-mono">{startTime}</p>
    <span className={`text-xs font-black ${getSuccessColor(successRating)}`}>{successRating}%</span>
  </div>
);

export const AccurateHoraWatch: React.FC<AccurateHoraWatchProps> = ({
  timezone,
  timeOffset = 0,
  userBirthChart,
}) => {
  const { t, language } = useTranslation();
  const locale = vedicLocaleTag(language);
  const { calculation, remainingTimeStr, remainingMs, isLoading } = useHoraWatch({ timezone, timeOffset });

  const horaData = useMemo(() => {
    if (!calculation) return null;
    const { currentHora, upcomingHoras, sunrise, sunset, dayRuler } = calculation;
    const successRating = calculateSuccessRating(currentHora.planet, userBirthChart);
    const energyType = getEnergyType(currentHora.planet);
    const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return {
      currentHora: { ...currentHora, successRating, energyType },
      upcomingHoras: upcomingHoras.map(hora => ({
        ...hora,
        successRating: calculateSuccessRating(hora.planet, userBirthChart),
        energyType: getEnergyType(hora.planet),
      })),
      sunrise: sunrise.toLocaleTimeString(locale, timeOpts),
      sunset: sunset.toLocaleTimeString(locale, timeOpts),
      dayRuler,
      totalDurationMs: (currentHora.durationMinutes || 60) * 60 * 1000,
    };
  }, [calculation, userBirthChart, locale]);

  if (isLoading || !horaData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <motion.div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <p className="text-sm text-muted-foreground">{t('vedicAstrology.horaCalcLoading', 'Calculating Hora...')}</p>
        </div>
      </div>
    );
  }

  const { currentHora, upcomingHoras, sunrise, sunset, dayRuler, totalDurationMs } = horaData;
  const energyLabel = labelEnergyType(currentHora.energyType, t);
  const energyColor = currentHora.energyType === 'Auspicious' ? 'emerald' : currentHora.energyType === 'Neutral' ? 'amber' : 'rose';
  
  return (
    <div className="space-y-6">
      {/* 1. DAY RULER GLOWING BANNER */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-900/20 via-purple-900/20 to-amber-900/20 p-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10 blur-[60px]" />
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <span className="text-4xl">{getPlanetEmoji(dayRuler)}</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400/70 uppercase tracking-[0.4em]">
              {t('vedicAstrology.horaDayRuler', 'Day Ruler')}
            </p>
            <h2 className="text-4xl font-black text-amber-100 font-serif">{dayRuler}</h2>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300/70">
              <Sunrise className="w-4 h-4" />
              <span className="font-bold">{sunrise}</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-300/70">
              <Sunset className="w-4 h-4" />
              <span className="font-bold">{sunset}</span>
            </div>
          </div>
        </div>
        {/* Mobile sunrise/sunset */}
        <div className="flex sm:hidden items-center gap-4 text-xs mt-3 pl-1">
          <div className="flex items-center gap-1.5 text-amber-300/70">
            <Sunrise className="w-3.5 h-3.5" />
            <span className="font-bold">{sunrise}</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-300/70">
            <Sunset className="w-3.5 h-3.5" />
            <span className="font-bold">{sunset}</span>
          </div>
        </div>
      </motion.div>

      {/* CURRENT HORA with PROGRESS RING */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-br ${getEnergyGradient(currentHora.energyType)} rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000`} />
        <div className="relative p-6 sm:p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Progress Ring */}
            <ProgressRing
              remainingMs={remainingMs}
              totalMs={totalDurationMs}
              remainingTime={remainingTimeStr}
              remainingLabel={t('vedicAstrology.horaRemaining', 'remaining')}
            />

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getPlanetEmoji(currentHora.planet)}</span>
                  <h3 className="text-3xl font-black text-foreground">{currentHora.planet}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold border-${energyColor}-500/30 text-${energyColor}-400`}
                >
                  {energyLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                {currentHora.startTimeStr} — {currentHora.endTimeStr} •{' '}
                {t('vedicAstrology.horaApproxMin', { defaultValue: '~{{n}} min', n: currentHora.durationMinutes })}{' '}
                {currentHora.isDay ? '☀️' : '🌙'}
              </p>

              <p className="text-sm text-muted-foreground italic leading-relaxed">"{currentHora.ruler}"</p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {currentHora.bestFor.slice(0, 3).map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-[10px] text-primary font-black uppercase tracking-widest">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. UPCOMING FLOW - Horizontal Scrolling Mini Cards */}
      <div>
        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 pl-1">
          {t('vedicAstrology.horaUpcomingFlow', 'Upcoming Flow')}
        </h4>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            {upcomingHoras.map((hora, i) => (
              <UpcomingMiniCard key={i} planet={hora.planet} startTime={hora.startTimeStr} successRating={hora.successRating} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
