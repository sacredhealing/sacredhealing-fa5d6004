/**
 * Sacred Guidance Messaging System
 * Dynamic completion messages based on time + streak + completion.
 * Text changes daily so the user never feels repetition — 3 variations per category.
 */

export type TimeOfDay = 'morning' | 'midday' | 'evening';

const MORNING_COMPLETION = [
  "You've aligned your morning. Carry this clarity into the world.",
  "Your morning is centered. Let that peace move with you.",
  "You showed up at dawn. The day receives you differently now.",
];

const MIDDAY_COMPLETION = [
  "You paused in the middle of life. This is how awareness grows.",
  "You stepped out of the rush. That pause ripples outward.",
  "In the busiest hours, you returned to yourself. That matters.",
];

const EVENING_COMPLETION = [
  "You released the day. Rest now — nothing else is needed.",
  "The day is complete. Allow yourself to soften into rest.",
  "You've closed the circle. Nothing else is needed tonight.",
];

const NEW_USER_MESSAGES = [
  "Every path begins gently. You're doing perfectly.",
  "You've begun. That is the whole art.",
  "The first steps are the bravest. You're doing beautifully.",
];

const STREAK_ENCOURAGEMENT = [
  "Your consistency is awakening something deeper.",
  "Your commitment is becoming a quiet wisdom.",
  "Something is shifting in you. Keep going.",
];

/** Simple deterministic index from date string (0-2 for variations) */
function getDailyVariationIndex(): number {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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

  // Time-based completion message
  let greeting: string;
  switch (lastCompleted) {
    case 'morning':
      greeting = t(`guidance.morningCompletion.${idx}`, MORNING_COMPLETION[idx]);
      break;
    case 'midday':
      greeting = t(`guidance.middayCompletion.${idx}`, MIDDAY_COMPLETION[idx]);
      break;
    case 'evening':
      greeting = t(`guidance.eveningCompletion.${idx}`, EVENING_COMPLETION[idx]);
      break;
    default:
      greeting = t(`guidance.eveningCompletion.${idx}`, EVENING_COMPLETION[idx]);
  }

  // Streak encouragement (only if streak >= 5): golden subtext
  const subtext = streakDays >= 5
    ? t(`guidance.streakEncouragement.${idx}`, STREAK_ENCOURAGEMENT[idx])
    : null;

  return { greeting, subtext, subtextIsGolden: !!subtext };
}
