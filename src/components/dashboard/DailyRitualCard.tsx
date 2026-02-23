import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Check, Cloud, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      <Card className="glass-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-[16px] bg-white/5" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const phases: PhaseState[] = [phaseStates.morning, phaseStates.midday, phaseStates.evening];

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
          {t('dailyRitual.title', 'Daily Spiritual Practice')}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {phases.map((phase, i) => {
            const config = PHASE_CONFIG[phase.id];
            const isCompleted = phase.status === 'completed';
            return (
              <React.Fragment key={phase.id}>
                {i > 0 && <span className="opacity-50">•</span>}
                <span className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      isCompleted ? 'bg-[#8B7D3C]' : 'border border-muted-foreground/60'
                    }`}
                    aria-hidden
                  />
                  {t(`dailyRitual.${phase.id}Short`, phase.id.charAt(0).toUpperCase() + phase.id.slice(1))}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {phases.map((phase) => {
          const config = PHASE_CONFIG[phase.id];
          const Icon = config.icon;
          const isActive = activePhaseId === phase.id && phase.status === 'active';

          const isClaimed = claimedPhases.has(phase.id);
          const statusLabel =
            phase.status === 'completed'
              ? null
              : phase.status === 'closed'
                ? t('dailyRitual.passedGently', 'Passed gently')
                : phase.status === 'upcoming'
                  ? t('dailyRitual.arrivingLater', 'Arriving later')
                  : null;

          const StatusIcon =
            phase.status === 'completed' ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8B7D3C]/20 ring-2 ring-[#8B7D3C]/50">
                <Check className="w-4 h-4 text-[#8B7D3C]" />
              </div>
            ) : phase.status === 'closed' ? (
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/50 shrink-0" aria-hidden />
            ) : phase.status === 'upcoming' ? (
              <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-background/50 ${config.iconColor}`}>
                <Clock className="w-4 h-4" />
              </div>
            ) : (
              <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-background/50 ${config.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            );

          return (
            <motion.div
              key={phase.id}
              layout
              className={`flex items-center gap-3 p-3 rounded-[16px] border transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {StatusIcon}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{t(config.labelKey)}</p>
                <p className="text-[10px] text-muted-foreground">{config.time}</p>
              </div>

              {phase.status === 'completed' ? (
                isClaimed ? (
                  <motion.span
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                    className="text-xs flex items-center gap-1 shrink-0 text-[#D4AF37] font-medium"
                  >
                    <Check className="w-3 h-3" />
                    +{phase.reward} SHC
                  </motion.span>
                ) : (
                  <motion.div initial={{ scale: 1 }} className="shrink-0">
                    <Button
                      size="sm"
                      className="text-xs h-7 rounded-full px-3 font-semibold bg-gradient-to-r from-[#D4AF37] to-[#C4943A] text-black border-0 animate-pulse hover:brightness-110"
                      onClick={() => claimPhase(phase.id)}
                    >
                      ✦ {t('dailyRitual.claim', 'Claim')} {phase.reward} SHC
                    </Button>
                  </motion.div>
                )
              ) : statusLabel ? (
                <span className="text-xs flex items-center gap-1 shrink-0 text-muted-foreground">
                  {statusLabel}
                </span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
