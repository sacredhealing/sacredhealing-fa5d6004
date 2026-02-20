/**
 * The 18 Siddhars — Siddha Lineage mapping for the Scroll of Lineage.
 * Assigns a Siddha Guide + Secret Vow based on Atmakaraka (Soul Planet) and Mount of Jupiter.
 */

export type AtmakarakaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export type MountJupiterState = 'strong' | 'developing' | 'blocked';

export interface SiddhaGuide {
  lineage: string;
  guideName: string;
  secretVow: string;
}

/** The 18 Siddhars — canonical Tamil Siddha tradition */
export const SIDDHARS_18 = [
  'Agastya', 'Bogar', 'Tirumular', 'Konganar', 'Sattaimuni', 'Sundaranandar',
  'Ramadevar', 'Pambatti', 'Karuvurar', 'Idaikkadar', 'Machamuni', 'Dhanvanthri',
  'Patanjali', 'Nandidevar', 'Korakkar', 'Romarishi', 'Thiruvalluvar', 'Cattaimuni',
] as const;

/** Planet → Siddha lineage (primary patron) */
const PLANET_TO_LINEAGE: Record<AtmakarakaPlanet, { lineage: string; guide: string }> = {
  Sun: { lineage: 'Surya Siddha', guide: 'Agastya' },
  Moon: { lineage: 'Chandra Siddha', guide: 'Tirumular' },
  Mars: { lineage: 'Mangala Siddha', guide: 'Korakkar' },
  Mercury: { lineage: 'Budha Siddha', guide: 'Sattaimuni' },
  Jupiter: { lineage: 'Guru Siddha', guide: 'Dhanvanthri' },
  Venus: { lineage: 'Shukra Siddha', guide: 'Bogar' },
  Saturn: { lineage: 'Shani Siddha', guide: 'Agastya' },
  Rahu: { lineage: 'Rahu Siddha', guide: 'Pambatti' },
  Ketu: { lineage: 'Ketu Siddha', guide: 'Tirumular' },
};

/** Secret Vows by lineage — the vow the soul took before incarnation */
const SECRET_VOWS: Record<string, string[]> = {
  'Surya Siddha': [
    'I will reclaim authority without domination — to lead from the heart, not the crown.',
    'I vowed to wield sovereignty as service, never as tyranny.',
  ],
  'Chandra Siddha': [
    'I will love without losing myself — to hold space for feeling without drowning in it.',
    'I vowed to tend the sacred flame of emotion while protecting my own boundary.',
  ],
  'Guru Siddha': [
    'I will share the wisdom I once hoarded — to teach without attachment to being right.',
    'I vowed to give knowledge freely, as the river gives water.',
  ],
  'Ketu Siddha': [
    'I will bring the cave into the marketplace — to serve without losing connection to the void.',
    'I vowed to dissolve ego in action, to merge with the infinite while walking in form.',
  ],
  'Shukra Siddha': [
    'I will create for the sake of creation — to offer beauty without waiting for permission.',
    'I vowed to sing even when no one listens.',
  ],
  'Mangala Siddha': [
    'I will act from courage, not from rage — to channel fire into purpose.',
    'I vowed to fight for dharma, never for ego.',
  ],
  'Budha Siddha': [
    'I will speak truth with clarity — to communicate without manipulation.',
    'I vowed to use words as bridges, not weapons.',
  ],
  'Shani Siddha': [
    'I will carry discipline without cruelty — to structure life with compassion.',
    'I vowed to accept karma without bitterness.',
  ],
  'Rahu Siddha': [
    'I will pursue liberation through material mastery — to transcend by engaging fully.',
    'I vowed to use desire as fuel for detachment.',
  ],
};

/** Get Siddha Guide + Secret Vow from Atmakaraka and Mount of Jupiter */
export function getSiddhaGuide(
  atmakaraka: AtmakarakaPlanet,
  mountJupiter: MountJupiterState
): SiddhaGuide {
  const base = PLANET_TO_LINEAGE[atmakaraka];
  const vows = SECRET_VOWS[base.lineage] ?? SECRET_VOWS['Surya Siddha'];
  const vowIndex = mountJupiter === 'strong' ? 0 : mountJupiter === 'developing' ? 1 : 0;
  const secretVow = vows[vowIndex % vows.length];
  return {
    lineage: `Patrons of the ${base.lineage} Lineage`,
    guideName: base.guide,
    secretVow,
  };
}

/** Derive Atmakaraka from Ketu house (1, 4, 9, 12) or Dasha period name */
export function deriveAtmakaraka(
  ketuHouse?: number,
  dashaPeriod?: string
): AtmakarakaPlanet {
  if (dashaPeriod) {
    const p = dashaPeriod.split(' ')[0]?.toLowerCase() ?? '';
    if (p.includes('sun')) return 'Sun';
    if (p.includes('moon') || p.includes('chandra')) return 'Moon';
    if (p.includes('mars') || p.includes('mangal')) return 'Mars';
    if (p.includes('mercury') || p.includes('budh')) return 'Mercury';
    if (p.includes('jupiter') || p.includes('guru')) return 'Jupiter';
    if (p.includes('venus') || p.includes('shukra')) return 'Venus';
    if (p.includes('saturn') || p.includes('shani')) return 'Saturn';
    if (p.includes('rahu')) return 'Rahu';
    if (p.includes('ketu')) return 'Ketu';
  }
  if (ketuHouse !== undefined) {
    if (ketuHouse === 1) return 'Sun';
    if (ketuHouse === 4) return 'Moon';
    if (ketuHouse === 9) return 'Jupiter';
    if (ketuHouse === 12) return 'Ketu';
  }
  return 'Ketu';
}

/** Derive Mount of Jupiter state from palm archetype or seed */
export function deriveMountJupiter(
  palmArchetype?: 'Spiritual Mastery' | 'Karmic Debt' | null,
  seed?: string
): MountJupiterState {
  if (palmArchetype === 'Spiritual Mastery') return 'strong';
  if (palmArchetype === 'Karmic Debt') return 'blocked';
  if (seed) {
    const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if (n % 3 === 0) return 'strong';
    if (n % 3 === 1) return 'developing';
    return 'blocked';
  }
  return 'developing';
}
