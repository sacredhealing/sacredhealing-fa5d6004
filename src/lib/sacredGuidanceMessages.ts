/**
 * Sacred Guidance Messaging System
 * Integration-phase language — reinforces identity change, not completion.
 * "Something in me is changing" not "I did my meditation"
 */

export type TimeOfDay = 'morning' | 'midday' | 'evening';

/** Integration-phase messages (no "finishing" tone) */
const MORNING_INTEGRATION = {
  greeting: "The morning has opened a space within you. Let the day reveal what it touches.",
  subtext: "Notice what feels softer than usual.",
};

const MIDDAY_INTEGRATION = {
  greeting: "The breath is still reorganizing your inner rhythm. Move gently for a while.",
  subtext: "Pay attention to your reactions today.",
};

const EVENING_INTEGRATION = {
  greeting: "Your mind is settling beneath the surface. Sleep will continue the process.",
  subtext: "Tomorrow may begin differently.",
};

const NEW_USER_MESSAGES = [
  "Every path begins gently. You're doing perfectly.",
  "You've begun. That is the whole art.",
  "The first steps are the bravest. You're doing beautifully.",
];

/** Simple deterministic index from date string (0-2 for variations) */
function getDailyVariationIndex(): number {
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 3;
}

export function getCompletionGuidance(params: {
  lastCompleted: TimeOfDay;
  streakDays: number;
  t: (key: string, fallback?: string) => string;
}): { greeting: string; subtext: string | null; subtextIsGolden: boolean } {
  const { lastCompleted, streakDays, t } = params;
  const idx = getDailyVariationIndex();

  // New user (streak < 3): gentle encouragement
  if (streakDays < 3) {
    const greeting = t(`guidance.newUser.${idx}`, NEW_USER_MESSAGES[idx]);
    return { greeting, subtext: null, subtextIsGolden: false };
  }

  // Integration-phase messages (one per slot, always with gold subtext)
  let greeting: string;
  let subtext: string;
  switch (lastCompleted) {
    case 'morning':
      greeting = t('guidance.morningIntegration', MORNING_INTEGRATION.greeting);
      subtext = t('guidance.morningIntegrationSubtext', MORNING_INTEGRATION.subtext);
      break;
    case 'midday':
      greeting = t('guidance.middayIntegration', MIDDAY_INTEGRATION.greeting);
      subtext = t('guidance.middayIntegrationSubtext', MIDDAY_INTEGRATION.subtext);
      break;
    case 'evening':
      greeting = t('guidance.eveningIntegration', EVENING_INTEGRATION.greeting);
      subtext = t('guidance.eveningIntegrationSubtext', EVENING_INTEGRATION.subtext);
      break;
    default:
      greeting = t('guidance.eveningIntegration', EVENING_INTEGRATION.greeting);
      subtext = t('guidance.eveningIntegrationSubtext', EVENING_INTEGRATION.subtext);
  }

  return { greeting, subtext, subtextIsGolden: true };
}

/** When all 3 daily practices completed — no achievement, just integration */
export function getAllCompleteGuidance(t: (key: string, fallback?: string) => string) {
  return {
    greeting: t('guidance.allCompleteHero', 'Nothing to achieve anymore today. Just live inside what has shifted.'),
    button: t('guidance.allCompleteButton', 'Close for now'),
    subtext: t('guidance.allCompleteSubtext', "We'll meet you again tomorrow."),
  };
}

/** Context-based button labels for integration phase */
export function getIntegrationButtonLabel(
  lastCompleted: TimeOfDay,
  t: (key: string, fallback?: string) => string
): string {
  switch (lastCompleted) {
    case 'morning':
      return t('guidance.integrationButtonMorning', 'Step into the day');
    case 'midday':
      return t('guidance.integrationButtonMidday', 'Return to your flow');
    case 'evening':
      return t('guidance.integrationButtonEvening', 'Enter rest');
    default:
      return t('guidance.integrationButtonEvening', 'Enter rest');
  }
}
