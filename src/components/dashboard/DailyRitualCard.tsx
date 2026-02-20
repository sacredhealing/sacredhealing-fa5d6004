import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Check, Cloud, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    iconColor: 'text-sky-400',
  },
  evening: {
    icon: Moon,
    labelKey: 'dailyRitual.evening',
    time: '17:00 – 5:00',
    iconColor: 'text-indigo-400',
  },
};

export const DailyRitualCard: React.FC<{ isDayClosed?: boolean; hasCompletedAllThree?: boolean }> = ({
  isDayClosed = false,
  hasCompletedAllThree = false,
}) => {
  const { t } = useTranslation();
  const { getJourneyData, isLoading } = useDailyJourney();

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
        <h3 className="font-heading font-semibold text-foreground">
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
                      isCompleted ? 'bg-green-500' : 'border border-muted-foreground/60'
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

          const statusLabel =
            phase.status === 'completed'
              ? `+${phase.reward} SHC`
              : phase.status === 'closed'
                ? t('dailyRitual.passedGently', 'Passed gently')
                : phase.status === 'upcoming'
                  ? t('dailyRitual.arrivingLater', 'Arriving later')
                  : null;

          const StatusIcon =
            phase.status === 'completed' ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 ring-2 ring-green-500/50">
                <Check className="w-4 h-4 text-green-500" />
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
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {StatusIcon}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{t(config.labelKey)}</p>
                <p className="text-[10px] text-muted-foreground">{config.time}</p>
              </div>

              {statusLabel && (
                <span
                  className={`text-xs flex items-center gap-1 shrink-0 ${
                    phase.status === 'completed'
                      ? 'text-green-500 font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {phase.status === 'completed' && <Check className="w-3 h-3" />}
                  {statusLabel}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
