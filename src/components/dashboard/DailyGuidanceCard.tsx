import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SriYantra } from './SriYantra';
import { BreathingAnchor } from './BreathingAnchor';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { getCompletionGuidance, getAllCompleteGuidance, getIntegrationButtonLabel, getAdaptiveHero } from '@/lib/sacredGuidanceMessages';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';
import type { ReturnState } from '@/hooks/useReturnVisit';

export type StartClickOptions = { isContinuation?: boolean };

interface DailyGuidanceCardProps {
  /** When provided, Start button uses onClick (for inline session flow) */
  onStartClick?: (guidance: DailyGuidance, options?: StartClickOptions) => void;
  /** When day is closed (after continuation or skip), show rest state */
  isDayClosed?: boolean;
  /** Call when user skips continuation - marks day closed */
  onSkipContinuation?: () => void;
  /** Return-visit state for continuation anchor messaging */
  returnState?: ReturnState;
  /** Shown when returnState is next_day and streak increased */
  streakIncreased?: boolean;
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

function getContinuationAnchorKey(lastCompleted: 'morning' | 'midday' | 'evening'): string {
  switch (lastCompleted) {
    case 'morning': return 'dashboard.continuationAnchorMorning';
    case 'midday': return 'dashboard.continuationAnchorMidday';
    case 'evening': return 'dashboard.continuationAnchorEvening';
    default: return 'dashboard.continuationAnchorMidday';
  }
}

export const DailyGuidanceCard: React.FC<DailyGuidanceCardProps> = ({
  onStartClick,
  isDayClosed = false,
  onSkipContinuation,
  returnState = null,
  streakIncreased = false,
}) => {
  const { t } = useTranslation();
  const { guidance, isLoading, lastCompleted, hasCompletedAllThree, timeOfDay, streakDays, userState } = useDailyGuidance();
  const [breathingDone, setBreathingDone] = useState(false);

  const hasCompletedToday = lastCompleted !== null;
  const showContinuation = hasCompletedToday && !isDayClosed;
  const showAllComplete = hasCompletedAllThree && !isDayClosed;

  const completionGuidance = showContinuation && lastCompleted && !showAllComplete
    ? getCompletionGuidance({ lastCompleted, streakDays, t })
    : null;
  const allCompleteGuidance = showAllComplete ? getAllCompleteGuidance(t) : null;

  // Return-visit overrides
  const isSameDayReturn = returnState === 'same_day';
  const isNextDayReturn = returnState === 'next_day';

  const greeting = isSameDayReturn
    ? t('dashboard.returnSameDayHero', "Your earlier practice is still echoing.")
    : isNextDayReturn
      ? t('dashboard.returnNextDayHero', "Welcome back.")
      : isDayClosed
        ? t('dashboard.dayCompleteRest', "Your day is complete. Rest well.")
        : showAllComplete && allCompleteGuidance
          ? allCompleteGuidance.greeting
          : showContinuation && completionGuidance
            ? completionGuidance.greeting
            : getAdaptiveHero(timeOfDay, userState ?? 'calm', t);

  const subtitle = isSameDayReturn
    ? t('dashboard.returnSameDaySubtitle', "Take one conscious breath before continuing.")
    : isNextDayReturn
      ? t('dashboard.returnNextDaySubtitle', "Your path remembers where you left it.")
      : showAllComplete && allCompleteGuidance
        ? allCompleteGuidance.subtext
        : showContinuation
          ? completionGuidance?.subtext ?? t('dashboard.integrateSubtitle', 'A gentle next step to carry the feeling forward.')
          : !hasCompletedToday
            ? guidance.message
            : null;

  const subtextIsGolden = isNextDayReturn && streakIncreased
    ? true
    : (completionGuidance?.subtextIsGolden ?? false);

  const streakSubtext = isNextDayReturn && streakIncreased
    ? t('dashboard.returnNextDayStreakSubtext', "Consistency is transforming your inner rhythm.")
    : null;

  const buttonLabel = showAllComplete && allCompleteGuidance
    ? allCompleteGuidance.button
    : showContinuation && lastCompleted
      ? getIntegrationButtonLabel(lastCompleted, t)
      : guidance.button_label ?? t('dashboard.startJourney', 'Start Journey');
  // Translate adaptive CTA when in state-driven mode
  const displayedButtonLabel =
    !hasCompletedToday && userState && userState !== 'calm'
      ? t(`guidance.adaptiveCta.${userState}.button`, guidance.button_label ?? '')
      : buttonLabel;

  const continuationGuidance = showContinuation && lastCompleted && !showAllComplete
    ? getContinuationSuggestion(lastCompleted, t)
    : null;

  const activeGuidance = showContinuation && continuationGuidance ? continuationGuidance : guidance;

  const continuationAnchor = showContinuation && lastCompleted && !showAllComplete
    ? t(getContinuationAnchorKey(lastCompleted))
    : null;

  const isCloseButton = showAllComplete && allCompleteGuidance;

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
              {streakSubtext && (
                <p className="text-sm sm:text-base text-amber-400/90 mt-1">
                  {streakSubtext}
                </p>
              )}
            </div>

            {isSameDayReturn && !breathingDone && (
              <div className="flex justify-center py-4">
                <BreathingAnchor durationSeconds={3} onComplete={() => setBreathingDone(true)} compact />
              </div>
            )}

            {(onStartClick || (isCloseButton && onSkipContinuation)) && !isDayClosed && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() =>
                    isCloseButton && onSkipContinuation
                      ? onSkipContinuation()
                      : onStartClick?.(activeGuidance, showContinuation ? { isContinuation: true } : undefined)
                  }
                  className="w-full gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#000000] shadow-[0_0_30px_rgba(0,242,254,0.4)] hover:shadow-[0_0_40px_rgba(0,242,254,0.5)] border-none transition-all text-sm sm:text-base px-4 sm:px-8 py-3 flex-shrink-0"
                  style={{ fontWeight: 800 }}
                >
                  {displayedButtonLabel}
                  {!isCloseButton && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
                </Button>
                {continuationAnchor && (
                  <p className="text-xs text-muted-foreground/90 text-center border-t border-white/5 pt-2 mt-1">
                    {continuationAnchor}
                  </p>
                )}
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
