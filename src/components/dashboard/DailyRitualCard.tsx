import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import {
  getPhaseStates,
  getActivePhaseId,
  type PhaseState,
  type PhaseId,
} from '@/lib/dailyPhaseUtils';

const GATE_EMOJI: Record<PhaseId, string> = {
  morning: '☀️',
  midday: '🌤',
  evening: '🌙',
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

  const phaseLabels: Record<PhaseId, string> = {
    morning: 'Solar Inception',
    midday: 'Zenith Alignment',
    evening: 'Lunar Integration',
  };

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
              <div className="h-14 w-14 rounded-full bg-white/10" />
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
    .replace(/, /g, ' · ');

  return (
    <div>
      <div className="sq-sadhana-header">
        <div className="sq-sadhana-title">{dateStr}</div>
        <div className="sq-sadhana-complete">{completedCount} / 3 COMPLETE</div>
      </div>
      <div className="sq-sadhana-gates">
        {phases.map((phase) => {
          const isActive = activePhaseId === phase.id && phase.status === 'active';
          const isClaimed = claimedPhases.has(phase.id);
          const isDone = phase.status === 'completed';
          const gateClass = isDone ? 'sq-gate sq-gate-done' : isActive ? 'sq-gate sq-gate-active' : 'sq-gate';

          const ringSvg =
            isDone ? (
              <svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" /><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,0.32)" strokeWidth="2" fill="none" strokeDasharray="157" strokeDashoffset="0" /></svg>
            ) : isActive ? (
              <svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" stroke="rgba(212,175,55,0.1)" strokeWidth="2.5" fill="none" /><circle cx="29" cy="29" r="25" stroke="rgba(212,175,55,0.85)" strokeWidth="2.5" fill="none" strokeDasharray="157" strokeDashoffset="78" style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.6))' }} /></svg>
            ) : (
              <svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" /><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" strokeDasharray="157" strokeDashoffset="157" /></svg>
            );

          return (
            <div key={phase.id} className={gateClass}>
              <div className="sq-gate-circle">
                {ringSvg}
                <div className="sq-gate-inner">{GATE_EMOJI[phase.id]}</div>
              </div>
              <div className="sq-gate-name">
                {phaseLabels[phase.id]}
              </div>
              {isDone ? (
                isClaimed ? (
                  <div className="sq-gate-state">Complete</div>
                ) : (
                  <button type="button" className="sq-shc-btn" onClick={() => claimPhase(phase.id)}>
                    + {phase.reward} SOMA-HARMONIC CREDITS
                  </button>
                )
              ) : phase.status === 'closed' ? (
                <div className="sq-gate-state">{t('dailyRitual.passedGently', 'Passed gently')}</div>
              ) : phase.status === 'upcoming' ? (
                <div className="sq-gate-state">{t('dailyRitual.arrivingLater', 'Arriving later')}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
