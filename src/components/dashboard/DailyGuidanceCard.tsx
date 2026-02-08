import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SriYantra } from './SriYantra';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { getCompletionGuidance } from '@/lib/sacredGuidanceMessages';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';

export type StartClickOptions = { isContinuation?: boolean };

interface DailyGuidanceCardProps {
  /** When provided, Start button uses onClick (for inline session flow) */
  onStartClick?: (guidance: DailyGuidance, options?: StartClickOptions) => void;
  /** When day is closed (after continuation or skip), show rest state */
  isDayClosed?: boolean;
  /** Call when user skips continuation - marks day closed */
  onSkipContinuation?: () => void;
}

function getGreetingKey(timeOfDay: 'morning' | 'midday' | 'evening'): string {
  switch (timeOfDay) {
    case 'morning': return 'dashboard.greetingMorning';
    case 'midday': return 'dashboard.greetingMidday';
    case 'evening': return 'dashboard.greetingEvening';
    default: return 'dashboard.greetingMorning';
  }
}

/**
 * Contextual continuation suggestion after completing today's practice.
 * Does NOT count toward streak. Optional but emotionally inviting.
 */
function getContinuationSuggestion(
  lastCompleted: 'morning' | 'midday' | 'evening',
  t: (key: string, fallback?: string) => string
): DailyGuidance {
  switch (lastCompleted) {
    case 'morning':
      return {
        message: t('dashboard.continuationSetIntentionDesc', '2–3 min audio'),
        session_type: 'meditation',
        session_id: '/meditations?category=morning',
        button_label: t('dashboard.continuationSetIntention', 'Set Intention'),
      };
    case 'midday':
      return {
        message: t('dashboard.continuationHeartBreathDesc', '2–3 min'),
        session_type: 'breathing_reset',
        session_id: '/breathing',
        button_label: t('dashboard.continuationHeartBreath', 'Heart-Opening Breath'),
      };
    case 'evening':
      return {
        message: t('dashboard.continuationSleepPrepDesc', '5–10 min'),
        session_type: 'meditation',
        session_id: '/meditations?category=sleep',
        button_label: t('dashboard.continuationSleepPrep', 'Sleep Preparation'),
      };
    default:
      return {
        message: t('dashboard.continuationHeartBreathDesc', '2–3 min'),
        session_type: 'breathing_reset',
        session_id: '/breathing',
        button_label: t('dashboard.continuationHeartBreath', 'Heart-Opening Breath'),
      };
  }
}

export const DailyGuidanceCard: React.FC<DailyGuidanceCardProps> = ({
  onStartClick,
  isDayClosed = false,
  onSkipContinuation,
}) => {
  const { t } = useTranslation();
  const { guidance, isLoading, lastCompleted, timeOfDay, streakDays } = useDailyGuidance();

  const hasCompletedToday = lastCompleted !== null;
  const showContinuation = hasCompletedToday && !isDayClosed;

  const completionGuidance = showContinuation && lastCompleted
    ? getCompletionGuidance({ lastCompleted, streakDays, t })
    : null;

  const greeting = isDayClosed
    ? t('dashboard.dayCompleteRest', "Your day is complete. Rest well.")
    : showContinuation && completionGuidance
      ? completionGuidance.greeting
      : t(getGreetingKey(timeOfDay));

  const subtitle = showContinuation
    ? completionGuidance?.subtext ?? t('dashboard.integrateSubtitle', 'A gentle next step to carry the feeling forward.')
    : !hasCompletedToday
      ? guidance.message
      : null;

  const subtextIsGolden = completionGuidance?.subtextIsGolden ?? false;

  const buttonLabel = showContinuation
    ? t('dashboard.continueGently', 'Continue gently')
    : guidance.button_label ?? t('dashboard.startJourney', 'Start Journey');

  const continuationGuidance = showContinuation && lastCompleted
    ? getContinuationSuggestion(lastCompleted, t)
    : null;

  const activeGuidance = showContinuation && continuationGuidance ? continuationGuidance : guidance;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card relative overflow-hidden p-0">
          <div className="relative flex items-center p-4 sm:p-8 gap-3 sm:gap-8">
            <div className="hidden sm:flex w-72 h-72 shrink-0">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="flex sm:hidden w-28 h-28 shrink-0">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-5">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center p-4 sm:p-8 gap-4 sm:gap-8">
          <div className="hidden sm:flex w-72 h-72 shrink-0 relative">
            <div
              className="absolute inset-[-50%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(0, 242, 254, 0.2) 40%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            <SriYantra
              className="w-full h-full relative z-10"
              style={{ filter: "drop-shadow(0 0 15px #00F2FE)" }}
            />
          </div>

          <div className="flex sm:hidden w-24 h-24 shrink-0 relative self-center">
            <div
              className="absolute inset-[-25%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, transparent 60%)",
                filter: "blur(18px)",
              }}
            />
            <SriYantra
              className="w-full h-full relative z-10"
              style={{ filter: "drop-shadow(0 0 15px #00F2FE)" }}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-5 w-full">
            <div className="w-full min-w-0">
              <h2 className="text-base sm:text-2xl font-heading font-bold text-white mb-1 sm:mb-2 leading-tight">
                {greeting}
              </h2>
              {subtitle && (
                <p className={`text-sm sm:text-base line-clamp-2 sm:line-clamp-none ${subtextIsGolden ? 'text-amber-400/90' : 'text-[#94a3b8]'}`}>
                  {subtitle}
                </p>
              )}
            </div>

            {onStartClick && !isDayClosed && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => onStartClick(activeGuidance, showContinuation ? { isContinuation: true } : undefined)}
                  className="w-full gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#000000] shadow-[0_0_30px_rgba(0,242,254,0.4)] hover:shadow-[0_0_40px_rgba(0,242,254,0.5)] border-none transition-all text-sm sm:text-base px-4 sm:px-8 py-3 flex-shrink-0"
                  style={{ fontWeight: 800 }}
                >
                  {buttonLabel}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </Button>
                {showContinuation && onSkipContinuation && (
                  <button
                    type="button"
                    onClick={onSkipContinuation}
                    className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors"
                  >
                    {t('common.notNow')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
