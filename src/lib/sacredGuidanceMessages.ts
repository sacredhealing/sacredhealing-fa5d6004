/**
 * Sacred Guidance Messaging System
 * Integration-phase language — reinforces identity change, not completion.
 * Adaptive hero + CTA by phase + user state (calm, busy, heavy, engaged).
 */

export type TimeOfDay = 'morning' | 'midday' | 'evening';
export type UserDailyState = 'calm' | 'busy' | 'heavy' | 'engaged';

/** Hero messages by phase + state — personal, not programmed */
export const HERO_MAP: Record<TimeOfDay, Record<UserDailyState, string>> = {
  morning: {
    calm: "You're already centered. Let's deepen it.",
    busy: "A gentle start is enough today.",
    heavy: "Begin again softly.",
    engaged: "Your discipline is opening new space.",
  },
  midday: {
    calm: "Stay steady through the day.",
    busy: "Just one breath can reset everything.",
    heavy: "You don't need to fix the day — only pause.",
    engaged: "Return inward before the world pulls again.",
  },
  evening: {
    calm: "Let the day dissolve.",
    busy: "Release what you carried.",
    heavy: "You made it through. That is enough.",
    engaged: "Integration happens in rest.",
  },
};

/** CTA by state — adaptive session suggestions */
export const CTA_MAP: Record<
  UserDailyState,
  { session_type: string; session_id: string; button_label: string; message: string }
> = {
  busy: {
    session_type: 'breathing_reset',
    session_id: '/breathing?quick=true',
    button_label: '2-minute reset',
    message: 'A quick reset.',
  },
  heavy: {
    session_type: 'meditation',
    session_id: '/meditations?category=healing',
    button_label: '5-minute comfort',
    message: 'Gentle support when you need it.',
  },
  calm: {
    session_type: 'morning_ritual',
    session_id: '/ritual',
    button_label: 'Daily journey',
    message: 'Your practice awaits.',
  },
  engaged: {
    session_type: 'meditation',
    session_id: '/meditations',
    button_label: 'Deeper session',
    message: 'Go deeper.',
  },
};

/** Adaptive hero for idle state (no completion today) */
export function getAdaptiveHero(
  phase: TimeOfDay,
  state: UserDailyState,
  t: (key: string, fallback?: string) => string
): string {
  const fallback = HERO_MAP[phase][state];
  return t(`guidance.adaptiveHero.${phase}.${state}`, fallback);
}

/** Adaptive CTA — returns guidance for busy/heavy/engaged; calm uses default getDailyGuidance */
export function getAdaptiveGuidance(state: UserDailyState) {
  return CTA_MAP[state];
}

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
