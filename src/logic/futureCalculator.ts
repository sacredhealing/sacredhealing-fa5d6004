/**
 * Future Milestone Engine — Sovereign Future prophecy logic.
 * Maps Sun Mount prominence + Fate Line trajectory to Power Year (9-year Vedic cycle)
 * and generates the Sovereign Timeline (next 3 karmic windows).
 */

export type SunMountProminence = 'dominant' | 'balanced' | 'subtle';
export type FateLineTrajectory = 'ascending' | 'steady' | 'wavering';

export interface KarmicWindow {
  year: number;
  theme: string;
  focus: string;
}

export interface SovereignTimeline {
  powerYear: number;
  powerYearMeaning: string;
  timeline: [KarmicWindow, KarmicWindow, KarmicWindow];
}

/** Derive Sun Mount prominence from palm/seed (Apollo mount = Sun) */
export function deriveSunMountProminence(seed?: string): SunMountProminence {
  if (!seed) return 'balanced';
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const mod = Math.abs(n * 1103515245 + 12345) % 100;
  if (mod < 30) return 'dominant';
  if (mod < 65) return 'balanced';
  return 'subtle';
}

/** Derive Fate Line trajectory from seed */
export function deriveFateLineTrajectory(seed?: string): FateLineTrajectory {
  if (!seed) return 'steady';
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const mod = Math.abs((n + 7) * 31) % 100;
  if (mod < 40) return 'ascending';
  if (mod < 70) return 'steady';
  return 'wavering';
}

/** Power Years in 9-year Vedic cycle: 33, 42, 51, 60... (9*n + 6 pattern, n=3,4,5,6) */
const POWER_YEAR_CYCLE = [33, 42, 51, 60, 69, 78];

/** Find next Power Year from current age (or use birth year hint) */
export function getNextPowerYear(
  sunMount: SunMountProminence,
  fateLine: FateLineTrajectory,
  currentAgeOrBirthYear?: number,
  seed?: string
): number {
  const now = new Date().getFullYear();
  const age = currentAgeOrBirthYear != null
    ? (currentAgeOrBirthYear > 120 ? now - currentAgeOrBirthYear : currentAgeOrBirthYear)
    : 35;

  let baseIdx = 0;
  for (let i = 0; i < POWER_YEAR_CYCLE.length; i++) {
    if (POWER_YEAR_CYCLE[i] > age) {
      baseIdx = i;
      break;
    }
    baseIdx = i;
  }

  // Adjust by Sun Mount: dominant → earlier, subtle → later
  const sunMod = sunMount === 'dominant' ? -1 : sunMount === 'subtle' ? 1 : 0;
  // Fate Line: ascending → earlier, wavering → later
  const fateMod = fateLine === 'ascending' ? -1 : fateLine === 'wavering' ? 1 : 0;
  let idx = Math.max(0, Math.min(POWER_YEAR_CYCLE.length - 1, baseIdx + sunMod + fateMod));

  if (seed) {
    const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    idx = (idx + (n % 3) - 1) % POWER_YEAR_CYCLE.length;
    idx = Math.max(0, Math.min(POWER_YEAR_CYCLE.length - 1, idx));
  }

  return POWER_YEAR_CYCLE[idx];
}

const POWER_YEAR_MEANINGS: Record<number, string> = {
  33: 'The Christ Year — first full Saturn return. Sovereignty awakens.',
  42: 'The Master Year — second cycle peak. Authority and wisdom unite.',
  51: 'The Sage Year — third cycle. Leadership through detachment.',
  60: 'The Elder Year — fourth cycle. Transmission of lineage.',
  69: 'The Oracle Year — fifth cycle. Wisdom without attachment.',
  78: 'The Transcendent Year — sixth cycle. Dissolution into light.',
};

const KARMIC_THEMES: Record<string, string[]> = {
  ascend: ['Authority', 'Creative Power', 'Lineage Transmission'],
  steady: ['Integration', 'Grounding', 'Manifestation'],
  waver: ['Release', 'Surrender', 'Rebirth'],
};

const KARMIC_FOCUS: Record<string, string[]> = {
  ascend: ['Step into leadership', 'Express your gift', 'Teach what you know'],
  steady: ['Consolidate gains', 'Build foundations', 'Honor commitments'],
  waver: ['Let go of old forms', 'Trust the void', 'Allow transformation'],
};

/** Generate Sovereign Timeline — next 3 years of karmic windows */
export function getSovereignTimeline(
  powerYear: number,
  fateLine: FateLineTrajectory,
  seed?: string
): SovereignTimeline {
  const thisYear = new Date().getFullYear();
  const key = fateLine === 'ascending' ? 'ascend' : fateLine === 'wavering' ? 'waver' : 'steady';
  const themes = KARMIC_THEMES[key];
  const focuses = KARMIC_FOCUS[key];

  const n = seed ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const timeline: [KarmicWindow, KarmicWindow, KarmicWindow] = [
    { year: thisYear, theme: themes[(n + 0) % themes.length], focus: focuses[(n + 0) % focuses.length] },
    { year: thisYear + 1, theme: themes[(n + 1) % themes.length], focus: focuses[(n + 1) % focuses.length] },
    { year: thisYear + 2, theme: themes[(n + 2) % themes.length], focus: focuses[(n + 2) % focuses.length] },
  ];

  return {
    powerYear,
    powerYearMeaning: POWER_YEAR_MEANINGS[powerYear] ?? `Age ${powerYear} — a portal of sovereignty opens.`,
    timeline,
  };
}
