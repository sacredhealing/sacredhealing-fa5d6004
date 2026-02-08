import { useCallback, useEffect, useState } from 'react';

const STORAGE_LAST_VISIT = 'sh_last_visit_date';
const STORAGE_LAST_STREAK = 'sh_last_streak';
const STORAGE_DAY_CLOSED_SEEN = 'sh_day_closed_seen';
const STORAGE_SAME_DAY_RETURN_SHOWN = 'sh_same_day_return_shown';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type ReturnState = 'same_day' | 'next_day' | null;

/**
 * Detects return-visit states for the Daily Continuation Anchor:
 * - same_day: User completed today, closed day, left app, and returned (same calendar day)
 * - next_day: User opened app on a new calendar day
 *
 * Distinguishes "first time seeing day-closed" (right after Not now) from
 * "return" (new app open after closing day) via localStorage.
 */
export function useReturnVisit(params: {
  hasCompletedToday: boolean;
  isDayClosed: boolean;
  streakDays: number;
  isLoading: boolean;
}) {
  const { hasCompletedToday, isDayClosed, streakDays, isLoading } = params;
  const [returnState, setReturnState] = useState<ReturnState>(null);
  const [streakIncreased, setStreakIncreased] = useState(false);

  const today = getTodayKey();

  useEffect(() => {
    if (isLoading) return;

    const lastVisit = localStorage.getItem(STORAGE_LAST_VISIT);
    const lastStreak = parseInt(localStorage.getItem(STORAGE_LAST_STREAK) || '0', 10);
    const dayClosedSeen = localStorage.getItem(`${STORAGE_DAY_CLOSED_SEEN}_${today}`) === '1';
    const alreadyShownSameDayReturn = localStorage.getItem(`${STORAGE_SAME_DAY_RETURN_SHOWN}_${today}`) === '1';

    // Next day return: last visit was before today
    if (lastVisit && lastVisit < today) {
      setReturnState('next_day');
      setStreakIncreased(streakDays > lastStreak);
      localStorage.setItem(STORAGE_LAST_VISIT, today);
      localStorage.setItem(STORAGE_LAST_STREAK, String(streakDays));
      return;
    }

    // Same day return: completed + day closed + we've seen day-closed before (in a prior session)
    if (hasCompletedToday && isDayClosed && dayClosedSeen && !alreadyShownSameDayReturn) {
      setReturnState('same_day');
      localStorage.setItem(`${STORAGE_SAME_DAY_RETURN_SHOWN}_${today}`, '1');
      return;
    }

    // First time seeing day-closed today: mark it (when useDayClosed sets it, we'll have isDayClosed)
    if (hasCompletedToday && isDayClosed) {
      localStorage.setItem(`${STORAGE_DAY_CLOSED_SEEN}_${today}`, '1');
    }

    // Record visit for next-day detection
    if (!lastVisit || lastVisit !== today) {
      localStorage.setItem(STORAGE_LAST_VISIT, today);
      localStorage.setItem(STORAGE_LAST_STREAK, String(streakDays));
    }

    setReturnState(null);
  }, [hasCompletedToday, isDayClosed, streakDays, isLoading, today]);

  const recordVisit = useCallback(() => {
    localStorage.setItem(STORAGE_LAST_VISIT, today);
    localStorage.setItem(STORAGE_LAST_STREAK, String(streakDays));
  }, [today, streakDays]);

  return { returnState, streakIncreased, recordVisit };
}
