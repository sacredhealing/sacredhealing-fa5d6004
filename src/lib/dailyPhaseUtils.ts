/**
 * Daily Practice - Time-Phase Logic
 * Tracks the phase of the day, not completion.
 * Missed practice ≠ failure — it's simply a different day state.
 */

export type PhaseStatus = 'completed' | 'closed' | 'upcoming' | 'active';

export type PhaseId = 'morning' | 'midday' | 'evening';

export interface PhaseState {
  id: PhaseId;
  status: PhaseStatus;
  completed: boolean;
  reward: number;
  windowStart: number;
  windowEnd: number;
}

/** Time windows (hours, 24h): Morning 5-12, Midday 12-17, Evening 17-5 */
const MORNING = { start: 5, end: 12 };
const MIDDAY = { start: 12, end: 17 };
const EVENING = { start: 17, end: 5 }; // wraps to next day

function isInWindow(hour: number, start: number, end: number): boolean {
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function getPhaseStates(params: {
  hour: number;
  morningCompleted: boolean;
  middayCompleted: boolean;
  eveningCompleted: boolean;
}): { morning: PhaseState; midday: PhaseState; evening: PhaseState } {
  const { hour, morningCompleted, middayCompleted, eveningCompleted } = params;

  const morningInWindow = isInWindow(hour, MORNING.start, MORNING.end);
  const morningPassed = hour >= MORNING.end;
  const morningUpcoming = hour < MORNING.start;

  const middayInWindow = isInWindow(hour, MIDDAY.start, MIDDAY.end);
  const middayPassed = hour >= MIDDAY.end;
  const middayUpcoming = hour < MIDDAY.start;

  // Evening: 17:00-05:00. In window = hour>=17 || hour<5. Upcoming = 5<=hour<17.
  const eveningInWindow = isInWindow(hour, EVENING.start, EVENING.end);
  const eveningActuallyUpcoming = hour >= 5 && hour < 17;

  const morning: PhaseState = {
    id: 'morning',
    completed: morningCompleted,
    reward: 15,
    windowStart: MORNING.start,
    windowEnd: MORNING.end,
    status: morningCompleted
      ? 'completed'
      : morningPassed
        ? 'closed'
        : morningUpcoming
          ? 'upcoming'
          : 'active',
  };

  const midday: PhaseState = {
    id: 'midday',
    completed: middayCompleted,
    reward: 10,
    windowStart: MIDDAY.start,
    windowEnd: MIDDAY.end,
    status: middayCompleted
      ? 'completed'
      : middayPassed
        ? 'closed'
        : middayUpcoming
          ? 'upcoming'
          : 'active',
  };

  const evening: PhaseState = {
    id: 'evening',
    completed: eveningCompleted,
    reward: 20,
    windowStart: EVENING.start,
    windowEnd: EVENING.end,
    status: eveningCompleted
      ? 'completed'
      : eveningActuallyUpcoming
        ? 'upcoming'
        : eveningInWindow
          ? 'active'
          : 'closed',
  };

  return { morning, midday, evening };
}

/** Active phase = the one we're currently in (can still complete) */
export function getActivePhaseId(hour: number): PhaseId | null {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  if (hour >= 17 || hour < 5) return 'evening';
  return null;
}

/** End of day: all phases closed or completed, hide progress, show hero only */
export function isEndOfDay(params: {
  hour: number;
  morningCompleted: boolean;
  middayCompleted: boolean;
  eveningCompleted: boolean;
}): boolean {
  const { morning, midday, evening } = getPhaseStates(params);
  const allClosedOrCompleted =
    (morning.status === 'completed' || morning.status === 'closed') &&
    (midday.status === 'completed' || midday.status === 'closed') &&
    (evening.status === 'completed' || evening.status === 'closed');
  return allClosedOrCompleted;
}
