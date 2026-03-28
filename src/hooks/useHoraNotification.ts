import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();
  const prevHoraRef = useRef<string | undefined>(currentHora);
  const [notification, setNotification] = useState<string | null>(null);
  const [prevHora, setPrevHora] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || currentHora === undefined) return;

    const prev = prevHoraRef.current;
    if (prev !== undefined && prev !== '' && prev !== currentHora) {
      const message = t('vedicAstrology.horaNotifyBanner', {
        defaultValue: '{{prev}} Hora has ended. {{current}} Hora is now active.',
        prev,
        current: currentHora,
      });
      setPrevHora(prev);
      setNotification(message);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const hint = t('vedicAstrology.horaNotifyHint', 'Go to Mantra page and chant the mantra.');
          new Notification(t('vedicAstrology.horaNotifyBrowserTitle', 'Sacred Healing — Hora Change'), {
            body: t('vedicAstrology.horaNotifyBrowserBody', {
              defaultValue: '🔱 {{message}}\n{{hint}}',
              message,
              hint,
            }),
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }

      const dismissTimer = setTimeout(() => setNotification(null), AUTO_DISMISS_MS);
      return () => clearTimeout(dismissTimer);
    }

    prevHoraRef.current = currentHora;
  }, [currentHora, enabled, t]);

  return {
    message: notification,
    prevHora,
    dismiss: () => setNotification(null),
  };
}
