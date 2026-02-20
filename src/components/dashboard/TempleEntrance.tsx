import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SacredGeometryFocal } from './SacredGeometryFocal';
import { BreathingAnchor } from './BreathingAnchor';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { getCompletionGuidance, getAllCompleteGuidance, getIntegrationButtonLabel, getAdaptiveHero } from '@/lib/sacredGuidanceMessages';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';
import type { ReturnState } from '@/hooks/useReturnVisit';

export type StartClickOptions = { isContinuation?: boolean };

interface TempleEntranceProps {
  onStartClick?: (guidance: DailyGuidance, options?: StartClickOptions) => void;
  isDayClosed?: boolean;
  onSkipContinuation?: () => void;
  returnState?: ReturnState;
  streakIncreased?: boolean;
  successWindowText: string;
}

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

/**
 * The Entrance — Sacred Geometry focal point, minimal text, optional CTA.
 * Replaces the "Your day is complete" hero with a digital sanctum.
 */
export const TempleEntrance: React.FC<TempleEntranceProps> = ({
  onStartClick,
  isDayClosed = false,
  onSkipContinuation,
  returnState = null,
  streakIncreased = false,
  successWindowText,
}) => {
  const { t } = useTranslation();
  const { guidance, isLoading, lastCompleted, hasCompletedAllThree, timeOfDay, streakDays, userState } = useDailyGuidance();
  const [breathingDone, setBreathingDone] = useState(false);

  const hasCompletedToday = lastCompleted !== null;
  const showContinuation = hasCompletedToday && !isDayClosed;
  const showAllComplete = hasCompletedAllThree && !isDayClosed;

  const tFn = t as unknown as (key: string, fallback?: string) => string;
  const completionGuidance = showContinuation && lastCompleted && !showAllComplete
    ? getCompletionGuidance({ lastCompleted, streakDays, t: tFn })
    : null;
  const allCompleteGuidance = showAllComplete ? getAllCompleteGuidance(tFn) : null;

  const isSameDayReturn = returnState === 'same_day';
  const isNextDayReturn = returnState === 'next_day';

  const greeting = isSameDayReturn
    ? t('dashboard.returnSameDayHero', 'Your earlier practice is still echoing.')
    : isNextDayReturn
      ? t('dashboard.returnNextDayHero', 'Welcome back.')
      : isDayClosed
        ? t('dashboard.dayCompleteRest', 'Your day is complete. Rest well.')
        : showAllComplete && allCompleteGuidance
          ? allCompleteGuidance.greeting
          : showContinuation && completionGuidance
            ? completionGuidance.greeting
            : null;

  const displayText = greeting ?? successWindowText;

  const buttonLabel = showAllComplete && allCompleteGuidance
    ? allCompleteGuidance.button
    : showContinuation && lastCompleted
      ? getIntegrationButtonLabel(lastCompleted, tFn)
      : guidance.button_label ?? t('dashboard.startJourney', 'Start Journey');
  const displayedButtonLabel =
    !hasCompletedToday && userState && userState !== 'calm'
      ? t(`guidance.adaptiveCta.${userState}.button`, guidance.button_label ?? '')
      : buttonLabel;

  const continuationGuidance = showContinuation && lastCompleted && !showAllComplete
    ? getContinuationSuggestion(lastCompleted, tFn)
    : null;
  const activeGuidance = showContinuation && continuationGuidance ? continuationGuidance : guidance;
  const isCloseButton = showAllComplete && allCompleteGuidance;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-6 sm:py-8"
      >
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center py-4 sm:py-6"
    >
      <SacredGeometryFocal className="mb-4" />

      <p
        className="text-base sm:text-lg font-serif text-amber-100/95 text-center max-w-md leading-relaxed mb-2"
        style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
      >
        {displayText}
      </p>

      {isNextDayReturn && streakIncreased && (
        <p className="text-xs text-amber-400/90 text-center mb-3">
          {t('dashboard.returnNextDayStreakSubtext', 'Consistency is transforming your inner rhythm.')}
        </p>
      )}

      {isSameDayReturn && !breathingDone && (
        <div className="flex justify-center py-3 mb-2">
          <BreathingAnchor durationSeconds={3} onComplete={() => setBreathingDone(true)} compact />
        </div>
      )}

      {(onStartClick || (isCloseButton && onSkipContinuation)) && !isDayClosed && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <Button
            onClick={() =>
              isCloseButton && onSkipContinuation
                ? onSkipContinuation()
                : onStartClick?.(activeGuidance, showContinuation ? { isContinuation: true } : undefined)
            }
            className="gap-2 bg-[#D4AF37] hover:bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-400/50 px-6 py-2.5 text-sm"
          >
            {displayedButtonLabel}
            {!isCloseButton && <ArrowRight className="w-4 h-4" />}
          </Button>
          {showContinuation && onSkipContinuation && (
            <button
              type="button"
              onClick={onSkipContinuation}
              className="text-xs text-muted-foreground hover:text-foreground/80"
            >
              {t('common.notNow')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
