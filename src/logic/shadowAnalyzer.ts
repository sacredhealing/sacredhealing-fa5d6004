/**
 * Shadow Analyzer — 8th Gate deep Karmic Vow logic.
 * Cross-references Saturn in 8th/12th House with Faint/Broken Heart Line
 * to assign one of 6 Shadow Vows and the transmutation mantra.
 */

export type ShadowVow =
  | 'Poverty'
  | 'Silence'
  | 'Solitude'
  | 'Sacrifice'
  | 'Invisibility'
  | 'Obedience';

export type HeartLineState = 'strong' | 'faint' | 'broken';

export interface ShadowVowInsight {
  shadowVow: ShadowVow;
  explanation: string;
  shadowAnalysis: string;
  transmutationMantra: string;
  mantraName: string;
}

const SHADOW_VOW_EXPLANATIONS: Record<ShadowVow, string> = {
  Poverty: 'You vowed to reject abundance to purify the soul. That vow now blocks your ability to receive.',
  Silence: 'You vowed to withhold speech for spiritual discipline. Unexpressed truth now blocks clarity.',
  Solitude: 'You vowed to withdraw from the world. That isolation now blocks healthy connection.',
  Sacrifice: 'You vowed to give everything away. The imbalance now blocks your right to receive.',
  Invisibility: 'You vowed to disappear and serve unseen. That self-erasure now blocks your light.',
  Obedience: 'You vowed to obey rather than lead. That submission now blocks your authority.',
};

const TRANSMUTATION_MANTRAS: Record<ShadowVow, { mantra: string; name: string }> = {
  Poverty: { mantra: 'Om Shrim Maha Lakshmiyei Swaha', name: 'Lakshmi Abundance Mantra' },
  Silence: { mantra: 'Om Saraswatyai Namah', name: 'Saraswati Voice Mantra' },
  Solitude: { mantra: 'Om Aim Hreem Kleem Chamundayei Vicche', name: 'Chamunda Connection Mantra' },
  Sacrifice: { mantra: 'Om Dum Durgayei Namah', name: 'Durga Balance Mantra' },
  Invisibility: { mantra: 'Om Hrim Suryaya Namah', name: 'Surya Radiance Mantra' },
  Obedience: { mantra: 'Om Hram Hreem Hraum Sah Suryaya Namah', name: 'Surya Sovereignty Mantra' },
};

/** Derive Heart Line state from palm scan (Faint/Broken = shadow-active) */
export function deriveHeartLineState(
  heartLineLeak: boolean,
  seed?: string
): HeartLineState {
  if (heartLineLeak) return 'broken';
  if (seed) {
    const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if ((n % 5) === 2 || (n % 5) === 3) return 'faint';
  }
  return 'strong';
}

/** Check if Saturn is in 8th or 12th house */
export function isSaturnInShadowHouses(saturnHouse: number | undefined): boolean {
  if (saturnHouse === undefined || saturnHouse === null) return false;
  return saturnHouse === 8 || saturnHouse === 12;
}

function getShadowAnalysis(
  saturnInShadowHouses: boolean,
  heartLineState: HeartLineState
): string {
  if (saturnInShadowHouses && heartLineState !== 'strong') {
    return 'Saturn in the 8th or 12th house meets a faint or broken Heart Line. The shadow speaks: a karmic vow from a past life still binds your present.';
  }
  if (heartLineState === 'broken') {
    return 'A broken Heart Line reveals a deep karmic seal. The subconscious holds a vow that once served protection but now blocks your light.';
  }
  if (heartLineState === 'faint') {
    return 'A faint Heart Line suggests a vow made in sacrifice. The shadow holds what you once promised to release.';
  }
  return 'The shadow rests lightly. Saturn and the Heart Line suggest minor karmic residue — a gentle vow to transmute.';
}

/** Map Saturn house + Heart Line to Shadow Vow (6 vows) */
export function getShadowVow(
  saturnInShadowHouses: boolean,
  heartLineState: HeartLineState,
  seed?: string
): ShadowVowInsight {
  const vows: ShadowVow[] = [
    'Poverty',
    'Silence',
    'Solitude',
    'Sacrifice',
    'Invisibility',
    'Obedience',
  ];

  // If Saturn not in 8th/12th or Heart Line strong, default to first vow (still show insight)
  let idx = 0;
  if (saturnInShadowHouses && (heartLineState === 'faint' || heartLineState === 'broken')) {
    const n = seed ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    const heartMod = heartLineState === 'broken' ? 2 : 1;
    const saturnMod = 3; // 8th/12th adds weight
    idx = (n + heartMod * 7 + saturnMod * 11) % vows.length;
  } else if (heartLineState === 'faint' || heartLineState === 'broken') {
    const n = seed ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    idx = (n + (heartLineState === 'broken' ? 5 : 2)) % vows.length;
  }

  const shadowVow = vows[idx];
  const { mantra, name } = TRANSMUTATION_MANTRAS[shadowVow];
  return {
    shadowVow,
    explanation: SHADOW_VOW_EXPLANATIONS[shadowVow],
    shadowAnalysis: getShadowAnalysis(saturnInShadowHouses, heartLineState),
    transmutationMantra: mantra,
    mantraName: name,
  };
}
