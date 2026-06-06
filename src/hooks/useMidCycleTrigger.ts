// useMidCycleTrigger — SQI 2050
// Detects active transmissions at their midpoint (day 4 for 8-day, day 10 for 21-day)
// and returns a list of transmissions needing conscious re-anchoring.
// This mirrors Limbic Arc's intermittent triggers that re-engage the conscious mind.
import { useMemo } from 'react';
import type { Activation } from '@/features/quantum-apothecary/types';

export interface MidCycleTrigger {
  activation: Activation;
  daysActive: number;
  totalDays: number;
  midpoint: number;
  isAtMidpoint: boolean;
  isPastMidpoint: boolean;
  daysRemaining: number;
}

export function useMidCycleTrigger(activeTransmissions: Activation[]): MidCycleTrigger[] {
  return useMemo(() => {
    const now = Date.now();
    return activeTransmissions
      .map(act => {
        if (!act.activatedAt || !act.expiresAt) return null;
        const activatedMs = new Date(act.activatedAt).getTime();
        const expiresMs = new Date(act.expiresAt).getTime();
        if (isNaN(activatedMs) || isNaN(expiresMs)) return null;

        const totalDays = act.type === 'Wellness' ? 21 : 8;
        const midpoint = Math.floor(totalDays / 2); // day 4 for 8-day, day 10 for 21-day
        const daysActive = Math.floor((now - activatedMs) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));

        // At midpoint = within 12 hours of the midpoint day
        const midpointMs = activatedMs + midpoint * 24 * 60 * 60 * 1000;
        const hoursFromMidpoint = Math.abs(now - midpointMs) / (1000 * 60 * 60);
        const isAtMidpoint = hoursFromMidpoint <= 12 && daysActive >= midpoint - 1;
        const isPastMidpoint = daysActive > midpoint;

        return {
          activation: act,
          daysActive,
          totalDays,
          midpoint,
          isAtMidpoint,
          isPastMidpoint,
          daysRemaining,
        } as MidCycleTrigger;
      })
      .filter((t): t is MidCycleTrigger => t !== null && (t.isAtMidpoint || (t.isPastMidpoint && t.daysRemaining <= 2)));
  }, [activeTransmissions]);
}
