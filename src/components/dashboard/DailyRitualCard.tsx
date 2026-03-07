import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Check, Cloud, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { motion } from 'framer-motion';
import {
  getPhaseStates,
  getActivePhaseId,
  type PhaseState,
  type PhaseId,
} from '@/lib/dailyPhaseUtils';

const PHASE_CONFIG: Record<PhaseId, { icon: React.ElementType; labelKey: string; time: string; iconColor: string }> = {
  morning: {
    icon: Sun,
    labelKey: 'dailyRitual.morning',
    time: '5:00 – 12:00',
    iconColor: 'text-amber-400',
  },
  midday: {
    icon: Cloud,
    labelKey: 'dailyRitual.midday',
    time: '12:00 – 17:00',
    iconColor: 'text-amber-400/70',
  },
  evening: {
    icon: Moon,
    labelKey: 'dailyRitual.evening',
    time: '17:00 – 5:00',
    iconColor: 'text-amber-300/50',
  },
};

export const DailyRitualCard: React.FC<{ isDayClosed?: boolean; hasCompletedAllThree?: boolean }> = ({
  isDayClosed = false,
  hasCompletedAllThree = false,
}) => {
  const { t } = useTranslation();
  const { getJourneyData, isLoading } = useDailyJourney();
  const [claimedPhases, setClaimedPhases] = useState<Set<PhaseId>>(() => new Set());

  const claimPhase = useCallback((phaseId: PhaseId) => {
    setClaimedPhases((prev) => new Set(prev).add(phaseId));
  }, []);

  const journey = getJourneyData();
  const currentHour = new Date().getHours();

  const phaseStates = getPhaseStates({
    hour: currentHour,
    morningCompleted: journey.morning.completed,
    middayCompleted: journey.midday.completed,
    eveningCompleted: journey.evening.completed,
  });

  const activePhaseId = getActivePhaseId(currentHour);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="h-3 w-28 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="h-3 w-14 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const phases: PhaseState[] = [phaseStates.morning, phaseStates.midday, phaseStates.evening];
  const completedCount = phases.filter((p) => p.status === 'completed').length;

  const dateStr = new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/, /g, ' • ')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      {/* Card header: date | X / 3 COMPLETE */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-extrabold uppercase tracking-[0.35em] text-[rgba(212,175,55,0.5)]"
          style={{ fontFamily: 'Montserrat,sans-serif' }}
        >
          {dateStr}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(212,175,55,0.4)]"
          style={{ fontFamily: 'Montserrat,sans-serif' }}
        >
          {completedCount} / 3 COMPLETE
        </span>
      </div>

      {/* Three columns: Morning | Midday | Evening */}
      <div className="grid grid-cols-3 gap-3">
        {phases.map((phase) => {
          const config = PHASE_CONFIG[phase.id];
          const Icon = config.icon;
          const isActive = activePhaseId === phase.id && phase.status === 'active';
          const isClaimed = claimedPhases.has(phase.id);
          const isCompleted = phase.status === 'completed';

          const statusLabel =
            phase.status === 'closed'
              ? t('dailyRitual.passedGently', 'Passed gently')
              : phase.status === 'upcoming'
                ? t('dailyRitual.arrivingLater', 'Arriving later')
                : null;

          const iconCircle =
            phase.status === 'completed' ? (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#8B7D3C]/50 bg-[#8B7D3C]/10">
                <Check className="h-5 w-5 text-[#8B7D3C]" />
              </div>
            ) : phase.status === 'closed' ? (
              <div className="mx-auto h-12 w-12 rounded-full border-2 border-white/10 bg-white/[0.02]" aria-hidden />
            ) : phase.status === 'upcoming' ? (
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.02] ${config.iconColor}`}>
                <Clock className="h-5 w-5" />
              </div>
            ) : isActive ? (
              <div className="relative mx-auto h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="3"
                    strokeDasharray={`${0.75 * 125.6} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>
              </div>
            ) : (
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.02] ${config.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
            );

          return (
            <motion.div
              key={phase.id}
              layout
              className={`flex flex-col items-center gap-2 rounded-xl py-3 ${
                isActive ? 'bg-[#D4AF37]/5' : ''
              }`}
            >
              {iconCircle}
              <span
                className={`text-[9px] font-extrabold uppercase tracking-[0.25em] ${
                  isActive ? 'text-[#D4AF37]' : 'text-[rgba(212,175,55,0.5)]'
                }`}
                style={{ fontFamily: 'Montserrat,sans-serif' }}
              >
                {t(`dailyRitual.${phase.id}Short`, phase.id.charAt(0).toUpperCase() + phase.id.slice(1))}
              </span>
              {phase.status === 'completed' ? (
                isClaimed ? (
                  <span className="text-[10px] italic text-white/50">Complete</span>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#C4943A] border-0"
                    onClick={() => claimPhase(phase.id)}
                  >
                    + {phase.reward} SHC
                  </Button>
                )
              ) : statusLabel ? (
                <span className="text-[10px] italic text-white/40">{statusLabel}</span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
