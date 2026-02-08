import { useEffect, useRef, useCallback } from 'react';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';

const STORAGE_KEY_LAST_LAUNCH = 'dashboardLastAutoLaunchDate';
export const STORAGE_KEY_RETURN_FROM_SESSION = 'dashboardReturnFromSession';
const IDLE_MS = 3000;

/**
 * Gentle auto-launch: after 3 seconds of no interaction on Dashboard,
 * opens the recommended daily practice session screen (no audio autoplay).
 *
 * Conditions:
 * - Only once per day (localStorage)
 * - Cancel if user taps/scrolls/clicks
 * - Don't trigger if user already completed today's session (evening done)
 * - Don't trigger if user came back from a session page
 */
export function useDashboardAutoLaunch(params: {
  onLaunch: (guidance: DailyGuidance) => void;
  guidance: DailyGuidance;
  isLoading: boolean;
  lastCompleted: 'morning' | 'midday' | 'evening' | null;
  flowState: string;
}) {
  const { onLaunch, guidance, isLoading, lastCompleted, flowState } = params;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLaunchedRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hasLaunchedRef.current) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (hasLaunchedRef.current) return;

      // Check: only once per day
      const today = new Date().toISOString().split('T')[0];
      const lastLaunch = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_LAUNCH) : null;
      if (lastLaunch === today) return;

      // Check: don't trigger if coming back from session page
      const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY_RETURN_FROM_SESSION) : null;
      if (fromSession) {
        sessionStorage.removeItem(STORAGE_KEY_RETURN_FROM_SESSION);
        return;
      }

      // Check: don't trigger if user already completed today's session (evening = day done)
      if (lastCompleted === 'evening') return;

      hasLaunchedRef.current = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_LAUNCH, today);
      }
      onLaunch(guidance);
    }, IDLE_MS);
  }, [onLaunch, guidance, lastCompleted]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't start if loading, not idle, or already in/after session
    if (isLoading || flowState !== 'idle') {
      cancelTimer();
      return;
    }

    resetTimer();

    const handleActivity = () => {
      cancelTimer();
      resetTimer();
    };

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);

    return () => {
      cancelTimer();
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isLoading, flowState, resetTimer, cancelTimer]);
}

