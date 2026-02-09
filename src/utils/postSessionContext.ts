import { getActivePhaseId } from '@/lib/dailyPhaseUtils';

export type DayPhase = 'morning' | 'midday' | 'evening';

export function getDayPhase(): DayPhase {
  const hour = new Date().getHours();
  return (getActivePhaseId(hour) ?? 'morning') as DayPhase;
}

export type SessionDepth = 'light' | 'medium' | 'deep';

export function getSessionDepth(durationSec: number): SessionDepth {
  if (durationSec >= 900) return 'deep';   // 15+ min
  if (durationSec >= 300) return 'medium';  // 5+ min
  return 'light';
}
