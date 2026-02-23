import { useState, useEffect, useRef } from 'react';

const AUTO_DISMISS_MS = 10000;

export interface HoraNotificationState {
  message: string | null;
  prevHora: string | null;
  dismiss: () => void;
}

/**
 * Detects when the current planetary Hora changes and optionally shows
 * a notification (in-app banner + browser notification if permitted).
 */
export function useHoraNotification(
  currentHora: string | undefined,
  enabled: boolean
): HoraNotificationState {
  const prevHoraRef = useRef<string | undefined>(currentHora);
  const [notification, setNotification] = useState<string | null>(null);
  const [prevHora, setPrevHora] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || currentHora === undefined) return;

    const prev = prevHoraRef.current;
    if (prev !== undefined && prev !== '' && prev !== currentHora) {
      const message = `${prev} Hora has ended. ${currentHora} Hora is now active.`;
      setPrevHora(prev);
      setNotification(message);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Sacred Healing — Hora Change', {
            body: `🔱 ${message}\nGo to Mantra page and chant the mantra.`,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }

      const t = setTimeout(() => setNotification(null), AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }

    prevHoraRef.current = currentHora;
  }, [currentHora, enabled]);

  return {
    message: notification,
    prevHora,
    dismiss: () => setNotification(null),
  };
}
