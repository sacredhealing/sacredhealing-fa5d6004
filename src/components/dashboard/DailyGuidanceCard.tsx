import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SriYantra } from './SriYantra';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';

interface DailyGuidanceCardProps {
  /** When provided, Start button uses onClick (for inline session flow) */
  onStartClick?: (guidance: DailyGuidance) => void;
}

function getGreetingKey(timeOfDay: 'morning' | 'midday' | 'evening'): string {
  switch (timeOfDay) {
    case 'morning': return 'dashboard.greetingMorning';
    case 'midday': return 'dashboard.greetingMidday';
    case 'evening': return 'dashboard.greetingEvening';
    default: return 'dashboard.greetingMorning';
  }
}

export const DailyGuidanceCard: React.FC<DailyGuidanceCardProps> = ({ onStartClick }) => {
  const { t } = useTranslation();
  const { guidance, isLoading, lastCompleted, timeOfDay } = useDailyGuidance();

  const hasCompletedToday = lastCompleted !== null;

  const greeting = hasCompletedToday
    ? t('dashboard.completedToday', "You've completed today's practice 🌙")
    : t(getGreetingKey(timeOfDay));

  const buttonLabel = hasCompletedToday
    ? t('dashboard.optionalReset', 'Optional: 2-minute reset')
    : guidance.button_label ?? t('dashboard.startJourney', 'Start Journey');

  const optionalResetGuidance: DailyGuidance = {
    message: t('dashboard.optionalResetDesc', 'A quick breath to recenter.'),
    session_type: 'breathing_reset',
    session_id: '/breathing?quick=true',
    button_label: buttonLabel,
  };

  const activeGuidance = hasCompletedToday ? optionalResetGuidance : guidance;

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
              {!hasCompletedToday && (
                <p className="text-sm sm:text-base text-[#94a3b8] line-clamp-2 sm:line-clamp-none">
                  {guidance.message}
                </p>
              )}
            </div>

            {onStartClick && (
              <Button
                onClick={() => onStartClick(activeGuidance)}
                className="w-full gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#000000] shadow-[0_0_30px_rgba(0,242,254,0.4)] hover:shadow-[0_0_40px_rgba(0,242,254,0.5)] border-none transition-all text-sm sm:text-base px-4 sm:px-8 py-3 flex-shrink-0"
                style={{ fontWeight: 800 }}
              >
                {buttonLabel}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
