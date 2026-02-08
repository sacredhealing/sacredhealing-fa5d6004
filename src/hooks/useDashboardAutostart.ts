import { useEffect } from 'react';

export type SessionLike = {
  id: string;
  type: 'breath' | 'meditation' | 'path' | 'healing';
  title?: string;
};

type Options = {
  /** The "today card" primary session (breath or meditation) */
  todaySession: SessionLike | null;

  /** Has the user already completed the first practice today? */
  hasCompletedToday: boolean;

  /** Function that opens the player or session modal (no autoplay - just opens) */
  openSession: (session: SessionLike) => void;

  /** Optional: allow turning off globally (e.g. when returning from session page) */
  enabled?: boolean;
};

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function dismissDashboardAutostartForToday() {
  const key = `sh_autostart_dismissed_${getTodayKey()}`;
  localStorage.setItem(key, '1');
}

export function hasDismissedDashboardAutostartToday() {
  const key = `sh_autostart_dismissed_${getTodayKey()}`;
  return localStorage.getItem(key) === '1';
}

/** Used by AppLayout - don't autostart when user just came back from a session page */
export const STORAGE_KEY_RETURN_FROM_SESSION = 'dashboardReturnFromSession';

export function useDashboardAutostart({
  todaySession,
  hasCompletedToday,
  openSession,
  enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled) return;
    if (!todaySession) return;
    if (hasCompletedToday) return;

    // Don't annoy: only once per day unless user clears
    if (hasDismissedDashboardAutostartToday()) return;

    // Don't auto-open when returning from a session page
    if (typeof sessionStorage !== 'undefined') {
      const fromSession = sessionStorage.getItem(STORAGE_KEY_RETURN_FROM_SESSION);
      if (fromSession) {
        sessionStorage.removeItem(STORAGE_KEY_RETURN_FROM_SESSION);
        return;
      }
    }

    // Small delay so UI renders smoothly before opening player (no autoplay)
    const t = window.setTimeout(() => {
      openSession(todaySession);
    }, 450);

    return () => window.clearTimeout(t);
  }, [enabled, todaySession, hasCompletedToday, openSession]);
}
