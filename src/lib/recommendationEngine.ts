/**
 * Fallback recommendation system for post-session suggestions.
 * Guides users to the next best practice based on what they just completed.
 */

export type CompletedSessionType =
  | 'breath'
  | 'morning'
  | 'midday'
  | 'evening'
  | 'path'
  | 'sleep'
  | 'healing';

export interface CompletedSession {
  id?: string;
  type: CompletedSessionType;
  category?: string;
  pathSlug?: string;
  currentDay?: number;
}

export interface RecommendedSession {
  slug: string;
  route: string;
  label: string;
}

const DEFAULT_SESSIONS: RecommendedSession[] = [
  { slug: '3_minute_breath_reset', route: '/breathing?quick=true', label: '3-Minute Breath Reset' },
  { slug: 'inner_peace_day_1', route: '/meditations', label: 'Inner Peace' },
  { slug: 'body_scan_sleep', route: '/meditations?category=sleep', label: 'Body Scan for Sleep' },
];

const SLUG_TO_SESSION: Record<string, RecommendedSession> = {
  midday_reset: { slug: 'midday_reset', route: '/breathing?quick=true', label: '2-Min Midday Reset' },
  calm_breath: { slug: 'calm_breath', route: '/breathing', label: 'Calm Breathing' },
  inner_peace_day: { slug: 'inner_peace_day', route: '/meditations', label: 'Inner Peace' },
  evening_reflection: { slug: 'evening_reflection', route: '/ritual', label: 'Evening Reflection' },
  release_the_day: { slug: 'release_the_day', route: '/meditations?category=healing', label: 'Release the Day' },
  sleep_body_scan: { slug: 'sleep_body_scan', route: '/meditations?category=sleep', label: 'Body Scan for Sleep' },
  yoga_nidra_sleep: { slug: 'yoga_nidra_sleep', route: '/meditations?category=sleep', label: 'Yoga Nidra for Sleep' },
  gratitude_reflection: { slug: 'gratitude_reflection', route: '/journal', label: 'Gratitude Journal' },
  calm_mind: { slug: 'calm_mind', route: '/breathing', label: 'Calm Mind' },
  anxiety_relief: { slug: 'anxiety_relief', route: '/breathing?type=anxiety', label: 'Anxiety Relief' },
  '3_minute_breath_reset': { slug: '3_minute_breath_reset', route: '/breathing?quick=true', label: '3-Minute Breath Reset' },
  inner_peace_day_1: { slug: 'inner_peace_day_1', route: '/meditations', label: 'Inner Peace' },
  body_scan_sleep: { slug: 'body_scan_sleep', route: '/meditations?category=sleep', label: 'Body Scan for Sleep' },
};

function slugsToSessions(slugs: string[]): RecommendedSession[] {
  return slugs
    .map((s) => SLUG_TO_SESSION[s] ?? { slug: s, route: '/meditations', label: s.replace(/_/g, ' ') })
    .slice(0, 3);
}

/**
 * Returns 3 recommended sessions based on what the user just completed.
 * Used for post-session "You may also like" suggestions.
 */
export function getFallbackRecommendations(
  completedSession: CompletedSession | null
): RecommendedSession[] {
  if (!completedSession) {
    return DEFAULT_SESSIONS;
  }

  const { type, pathSlug } = completedSession;

  switch (type) {
    case 'morning':
      return slugsToSessions(['midday_reset', 'calm_breath', 'inner_peace_day']);
    case 'midday':
      return slugsToSessions(['evening_reflection', 'release_the_day', 'sleep_body_scan']);
    case 'evening':
      return slugsToSessions(['sleep_body_scan', 'yoga_nidra_sleep', 'gratitude_reflection']);
    case 'breath':
      return slugsToSessions(['calm_mind', 'anxiety_relief', 'inner_peace_day']);
    case 'path':
      if (pathSlug) {
        return [
          { slug: 'continue_path', route: `/paths/${pathSlug}`, label: 'Continue Your Path' },
          ...slugsToSessions(['calm_breath', 'inner_peace_day']).slice(0, 2),
        ];
      }
      return DEFAULT_SESSIONS;
    case 'sleep':
      return slugsToSessions(['gratitude_reflection', 'yoga_nidra_sleep', 'calm_breath']);
    case 'healing':
      return slugsToSessions(['calm_mind', 'inner_peace_day', 'evening_reflection']);
    default:
      return DEFAULT_SESSIONS;
  }
}

/**
 * Maps SessionType from useDailyGuidance to CompletedSessionType for the recommendation engine.
 */
export function mapSessionTypeToCompleted(
  sessionType: string,
  sessionId?: string,
  pathSlug?: string,
  currentDay?: number
): CompletedSession {
  const typeMap: Record<string, CompletedSessionType> = {
    morning_ritual: 'morning',
    breathing_reset: 'breath',
    evening_reflection: 'evening',
    journal: 'evening',
    meditation: 'healing',
    path_day: 'path',
  };
  const type = typeMap[sessionType] ?? 'breath';
  return {
    type,
    pathSlug,
    currentDay,
  };
}
