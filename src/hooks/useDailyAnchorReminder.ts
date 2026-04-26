import { useEffect } from 'react';

/**
 * useDailyAnchorReminder
 * ----------------------
 * Schedules a daily local notification (via Capacitor when running in the
 * native app) reminding the seeker that their Temple Home field is anchored.
 * Falls back to a no-op on plain web — the web Notifications API does not
 * support reliable daily scheduling.
 */

const SCHEDULED_KEY = 'sh:temple_home_reminder_scheduled';
const NOTIFICATION_ID = 9171; // arbitrary stable id

interface Options {
  active: boolean;
  siteName: string;
}

export function useDailyAnchorReminder({ active, siteName }: Options): void {
  useEffect(() => {
    if (!active) return;
    void scheduleIfPossible(siteName);
  }, [active, siteName]);
}

async function scheduleIfPossible(siteName: string): Promise<void> {
  // Only attempt this in a Capacitor (native) context.
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return;

  try {
    const mod = await import('@capacitor/local-notifications');
    const { LocalNotifications } = mod;

    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    // Idempotent: if we already scheduled for today's site, do not stack.
    const fingerprint = `${siteName}:${new Date().toDateString()}`;
    if (localStorage.getItem(SCHEDULED_KEY) === fingerprint) return;

    // Cancel any prior reminder so we replace it cleanly.
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    } catch {
      /* ignore */
    }

    // Schedule for 9:00 AM tomorrow, repeating daily.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: 'Your Temple Home field is active',
          body: `${siteName} continues to broadcast in your space. Open the temple to deepen the field.`,
          schedule: { at: tomorrow, repeats: true, every: 'day' },
          smallIcon: 'ic_stat_icon_config_sample',
        },
      ],
    });

    localStorage.setItem(SCHEDULED_KEY, fingerprint);
  } catch {
    /* plugin not available or platform restricted — silent fail is fine */
  }
}
