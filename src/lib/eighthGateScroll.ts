/**
 * Scroll of the 8th Gate — Girdle of Venus / Ring of Solomon analysis.
 * Reveals the Psychic Shadow: the power the user is currently suppressing.
 */

export type PalmLineType = 'Girdle of Venus' | 'Ring of Solomon';

/** Psychic Shadow insights — the suppressed power, mapped by archetype + house */
export interface EighthGateInsight {
  lineType: PalmLineType;
  psychicShadow: string;
  powerSuppressed: string;
}

/** Girdle of Venus = emotional/psychic sensitivity; Ring of Solomon = wisdom/intuition */
const PSYCHIC_SHADOWS: Record<string, string[]> = {
  Sun: [
    'The power to say no and set boundaries. That unexpressed "no" became inner rigidity.',
    'Your natural authority. You dimmed your light to avoid outshining others.',
  ],
  Moon: [
    'Your need for emotional safety. You hid vulnerability to seem strong.',
    'The gift of deep feeling. You suppressed tears to avoid being seen as weak.',
  ],
  Jupiter: [
    'The teacher within. You feared being wrong, so you withheld wisdom.',
    'Your capacity to inspire. You suppressed leadership to avoid responsibility.',
  ],
  Ketu: [
    'The desire for recognition. You hid your light to stay "spiritual."',
    'Your capacity to merge with the infinite. You fear losing yourself if you surrender.',
  ],
  Venus: [
    'Your voice and desire for beauty. You believed your gift was not enough.',
    'Creative expression. You silenced yourself waiting for permission.',
  ],
  Saturn: [
    'The right to rest. You over-gave and now resent the weight.',
    'Joy without guilt. You suppressed pleasure to stay "disciplined."',
  ],
  Mars: [
    'Healthy anger. You turned it inward instead of setting boundaries.',
    'The warrior spirit. You suppressed courage to keep the peace.',
  ],
  Mercury: [
    'Clear communication. You softened truth to avoid conflict.',
    'Intellectual authority. You deferred to others to seem humble.',
  ],
  Rahu: [
    'Material ambition. You hid desire to seem detached.',
    'The right to want more. You suppressed longing to avoid disappointment.',
  ],
};

/** Derive Girdle vs Ring from seed (simulated palm reading) */
export function getLineType(seed?: string): PalmLineType {
  if (!seed) return 'Girdle of Venus';
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return n % 2 === 0 ? 'Girdle of Venus' : 'Ring of Solomon';
}

/** Get 8th Gate insight — Psychic Shadow based on Soul Planet (Atmakaraka proxy) */
export function getEighthGateInsight(
  soulPlanet: string,
  seed?: string
): EighthGateInsight {
  const lineType = getLineType(seed);
  const planet = normalizePlanet(soulPlanet);
  const shadows = PSYCHIC_SHADOWS[planet] ?? PSYCHIC_SHADOWS['Ketu'];
  const idx = seed ? (seed.length % shadows.length) : 0;
  const psychicShadow = shadows[idx];
  const powerSuppressed = psychicShadow.split('.')[0] ?? psychicShadow;
  return {
    lineType,
    psychicShadow,
    powerSuppressed,
  };
}

function normalizePlanet(p: string): string {
  const lower = p.toLowerCase();
  if (lower.includes('sun') || lower.includes('surya')) return 'Sun';
  if (lower.includes('moon') || lower.includes('chandra')) return 'Moon';
  if (lower.includes('mars') || lower.includes('mangal')) return 'Mars';
  if (lower.includes('mercury') || lower.includes('budh')) return 'Mercury';
  if (lower.includes('jupiter') || lower.includes('guru')) return 'Jupiter';
  if (lower.includes('venus') || lower.includes('shukra')) return 'Venus';
  if (lower.includes('saturn') || lower.includes('shani')) return 'Saturn';
  if (lower.includes('rahu')) return 'Rahu';
  if (lower.includes('ketu')) return 'Ketu';
  return 'Ketu';
}
