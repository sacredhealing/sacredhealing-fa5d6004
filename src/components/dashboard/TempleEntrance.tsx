import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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

interface TempleEntranceProps {
  onStartClick?: (guidance: DailyGuidance, options?: StartClickOptions) => void;
  isDayClosed?: boolean;
  onSkipContinuation?: () => void;
  returnState?: ReturnState;
  streakIncreased?: boolean;
  successWindowText: string;
  restCtaInBanner?: boolean;
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

export const TempleEntrance: React.FC<TempleEntranceProps> = ({
  onStartClick,
  isDayClosed = false,
  onSkipContinuation,
  returnState = null,
  streakIncreased = false,
  successWindowText,
  restCtaInBanner = false,
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
        <Skeleton className="w-64 h-64 rounded-full mb-4" />
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
      className="flex flex-col items-center -mx-4"
    >
      {/* Teal glow behind yantra */}
      <div className="relative w-full flex justify-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0, 242, 254, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* Sri Yantra — full bleed, edge to edge */}
        <motion.div
          className="w-full"
          animate={{ scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SriYantra
            variant="gold"
            className="w-full h-auto"
            style={{
              filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.5)) drop-shadow(0 0 48px rgba(212,175,55,0.2))',
            }}
          />
        </motion.div>
      </div>

      {/* Text + buttons — directly under yantra, no gap */}
      {!restCtaInBanner && (
        <div className="px-6 pt-4 pb-6 w-full flex flex-col items-center text-center">
          <p
            className="text-base sm:text-lg text-amber-100/95 text-center max-w-md leading-relaxed mb-2"
            style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif', letterSpacing: '0.06em' }}
          >
            {displayText}
          </p>

          {isNextDayReturn && streakIncreased && (
            <p className="text-xs text-amber-400/80 text-center mb-3 tracking-wide">
              {t('dashboard.returnNextDayStreakSubtext', 'Consistency is transforming your inner rhythm.')}
            </p>
          )}

          {isSameDayReturn && !breathingDone && (
            <div className="flex justify-center py-3 mb-2">
              <BreathingAnchor durationSeconds={3} onComplete={() => setBreathingDone(true)} compact />
            </div>
          )}

          {(onStartClick || (isCloseButton && onSkipContinuation)) && !isDayClosed && (
            <div className="flex flex-col items-center gap-2 mt-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() =>
                  isCloseButton && onSkipContinuation
                    ? onSkipContinuation()
                    : onStartClick?.(activeGuidance, showContinuation ? { isContinuation: true } : undefined)
                }
                className="w-full bg-[#D4AF37] hover:bg-amber-500 text-black font-bold px-6 py-3 rounded-full text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-400/50 transition-colors"
                style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif', letterSpacing: '0.05em' }}
              >
                {displayedButtonLabel}
                {!isCloseButton && <ArrowRight className="w-4 h-4" />}
              </button>

              {showContinuation && onSkipContinuation && (
                <button
                  type="button"
                  onClick={onSkipContinuation}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {t('common.notNow')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
