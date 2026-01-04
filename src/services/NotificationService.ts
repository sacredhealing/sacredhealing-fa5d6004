// NotificationService.ts - Browser & Capacitor Local Notifications

import { Capacitor } from '@capacitor/core';

export type ReminderType = 
  | 'dailyMantra'
  | 'dailyAffirmations'
  | 'dailyMeditation'
  | 'morningPractice'
  | 'eveningPractice'
  | 'healingJourney'
  | 'mindfulnessCheckin';

interface ScheduledNotification {
  id: number;
  type: ReminderType;
  time: string; // HH:MM format
}

const NOTIFICATION_STORAGE_KEY = 'scheduled-notifications';

// Spiritual reminder messages for each type
const reminderMessages: Record<ReminderType, string[]> = {
  dailyMantra: [
    'Take a moment to repeat your mantra',
    'Your sacred mantra awaits',
    'Return to your center with your mantra',
  ],
  dailyAffirmations: [
    'Plant positive seeds within your mind',
    'Speak your truth and affirm your power',
    'Time for your daily affirmations',
  ],
  dailyMeditation: [
    "It's a good moment to return inward",
    'Find stillness within',
    'A few minutes of peace await you',
  ],
  morningPractice: [
    'Begin the day with presence',
    'Awaken to your highest self',
    'Good morning, sacred soul',
  ],
  eveningPractice: [
    'Release the day and rest inward',
    'Let go and find peace',
    'Time to wind down and reflect',
  ],
  healingJourney: [
    'A gentle moment to continue your healing',
    'Your healing path awaits',
    'Nurture yourself with healing energy',
  ],
  mindfulnessCheckin: [
    'Observe your mind with kindness',
    'Breathe and be present',
    'A moment of mindful awareness',
  ],
};

const reminderTitles: Record<ReminderType, string> = {
  dailyMantra: 'Daily Mantra',
  dailyAffirmations: 'Daily Affirmations',
  dailyMeditation: 'Daily Meditation',
  morningPractice: 'Morning Practice',
  eveningPractice: 'Evening Practice',
  healingJourney: 'Healing Journey',
  mindfulnessCheckin: 'Mindfulness Check-in',
};

// Generate a unique numeric ID for each reminder type
const getNotificationId = (type: ReminderType): number => {
  const typeIds: Record<ReminderType, number> = {
    dailyMantra: 1001,
    dailyAffirmations: 1002,
    dailyMeditation: 1003,
    morningPractice: 1004,
    eveningPractice: 1005,
    healingJourney: 1006,
    mindfulnessCheckin: 1007,
  };
  return typeIds[type];
};

// Get a random message for the reminder type
const getRandomMessage = (type: ReminderType): string => {
  const messages = reminderMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get stored scheduled notifications
const getStoredNotifications = (): ScheduledNotification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save scheduled notifications
const saveStoredNotifications = (notifications: ScheduledNotification[]): void => {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    // For Capacitor, we'd use LocalNotifications plugin
    // This is a placeholder - actual implementation requires @capacitor/local-notifications
    try {
      // Dynamic import for Capacitor LocalNotifications
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.log('Capacitor LocalNotifications not available, falling back to browser API');
      return requestBrowserPermission();
    }
  }
  return requestBrowserPermission();
};

const requestBrowserPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Check if notifications are supported and permitted
export const canShowNotifications = (): boolean => {
  if (Capacitor.isNativePlatform()) {
    return true; // Assume native can show notifications
  }
  return 'Notification' in window && Notification.permission === 'granted';
};

// Schedule a notification for a specific reminder type
export const scheduleNotification = async (
  type: ReminderType,
  time: string // HH:MM format
): Promise<boolean> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return false;
  }

  // Cancel any existing notification for this type
  await cancelNotification(type);

  const notificationId = getNotificationId(type);
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate next occurrence
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: `🧘 ${reminderTitles[type]}`,
            body: getRandomMessage(type),
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            sound: undefined,
            smallIcon: 'ic_notification',
            largeIcon: 'ic_notification',
          },
        ],
      });
    } catch (error) {
      console.log('Capacitor LocalNotifications not available, using browser scheduler');
      scheduleBrowserNotification(type, delay);
    }
  } else {
    scheduleBrowserNotification(type, delay);
  }

  // Store the scheduled notification
  const notifications = getStoredNotifications();
  const existing = notifications.findIndex((n) => n.type === type);
  const newNotification: ScheduledNotification = { id: notificationId, type, time };
  
  if (existing >= 0) {
    notifications[existing] = newNotification;
  } else {
    notifications.push(newNotification);
  }
  saveStoredNotifications(notifications);

  console.log(`Scheduled ${type} notification for ${time}`);
  return true;
};

// Browser notification scheduler using setTimeout
const scheduleBrowserNotification = (type: ReminderType, delay: number): void => {
  // Store timeout ID in a global map
  const timeoutKey = `notification-timeout-${type}`;
  
  // Clear any existing timeout
  const existingTimeout = (window as any)[timeoutKey];
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Schedule the notification
  const timeoutId = setTimeout(() => {
    showBrowserNotification(type);
    // Reschedule for next day
    const oneDayMs = 24 * 60 * 60 * 1000;
    scheduleBrowserNotification(type, oneDayMs);
  }, delay);

  (window as any)[timeoutKey] = timeoutId;
};

// Show a browser notification
const showBrowserNotification = (type: ReminderType): void => {
  if (Notification.permission === 'granted') {
    new Notification(`🧘 ${reminderTitles[type]}`, {
      body: getRandomMessage(type),
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type,
    });
  }
};

// Cancel a scheduled notification
export const cancelNotification = async (type: ReminderType): Promise<void> => {
  const notificationId = getNotificationId(type);

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.log('Capacitor LocalNotifications not available');
    }
  }

  // Clear browser timeout
  const timeoutKey = `notification-timeout-${type}`;
  const existingTimeout = (window as any)[timeoutKey];
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    delete (window as any)[timeoutKey];
  }

  // Remove from storage
  const notifications = getStoredNotifications();
  const filtered = notifications.filter((n) => n.type !== type);
  saveStoredNotifications(filtered);

  console.log(`Cancelled ${type} notification`);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  const notifications = getStoredNotifications();
  
  for (const notification of notifications) {
    await cancelNotification(notification.type);
  }
  
  saveStoredNotifications([]);
};

// Reschedule all notifications on app start (browser only)
export const rescheduleAllNotifications = async (): Promise<void> => {
  const notifications = getStoredNotifications();
  
  for (const notification of notifications) {
    await scheduleNotification(notification.type, notification.time);
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = (): ScheduledNotification[] => {
  return getStoredNotifications();
};

// Check if a specific reminder is scheduled
export const isReminderScheduled = (type: ReminderType): boolean => {
  const notifications = getStoredNotifications();
  return notifications.some((n) => n.type === type);
};

// Test notification (for debugging)
export const testNotification = async (type: ReminderType): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Permission not granted');
    return;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: getNotificationId(type) + 1000, // Different ID for test
            title: `🧘 ${reminderTitles[type]} (Test)`,
            body: getRandomMessage(type),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch {
      showBrowserNotification(type);
    }
  } else {
    showBrowserNotification(type);
  }
};
