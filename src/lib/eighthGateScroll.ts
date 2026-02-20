/**
 * Scroll of the 8th Gate — Hidden Karma (Shadow Analysis).
 * Rahu/Ketu placement vs Mount of Moon → Karmic Vow blocking 2026 progress.
 */

export type KarmicVow =
  | 'Vow of Poverty'
  | 'Vow of Silence'
  | 'Vow of Service'
  | 'Vow of Celibacy'
  | 'Vow of Non-Violence'
  | 'Vow of Truth'
  | 'Vow of Renunciation'
  | 'Vow of Devotion';

export interface EighthGateInsight {
  shadowAnalysis: string;
  karmicVow: KarmicVow;
  vowExplanation: string;
  block2026: string;
}

/** Rahu/Ketu node vs Mount of Moon (subconscious) — derives which vow is active */
function getRahuKetuVsMoon(
  rahuKetuNode: 'Rahu' | 'Ketu',
  mountMoonState: 'strong' | 'developing' | 'blocked',
  seed?: string
): { vow: KarmicVow; idx: number } {
  const vows: KarmicVow[] = [
    'Vow of Poverty',
    'Vow of Silence',
    'Vow of Service',
    'Vow of Celibacy',
    'Vow of Non-Violence',
    'Vow of Truth',
    'Vow of Renunciation',
    'Vow of Devotion',
  ];
  const n = seed ? seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const base = rahuKetuNode === 'Rahu' ? 0 : 4;
  const moonMod = mountMoonState === 'strong' ? 0 : mountMoonState === 'developing' ? 1 : 2;
  const idx = (base + moonMod + (n % 2)) % vows.length;
  return { vow: vows[idx], idx };
}

const VOW_EXPLANATIONS: Record<KarmicVow, string> = {
  'Vow of Poverty': 'You once vowed to reject material comfort to purify the soul. That vow now blocks your ability to receive abundance.',
  'Vow of Silence': 'You vowed to withhold speech for spiritual discipline. That unexpressed truth now blocks clarity in relationships and career.',
  'Vow of Service': 'You vowed to give without receiving. The imbalance now blocks your ability to accept help and rest.',
  'Vow of Celibacy': 'You vowed to transcend desire. That suppression now blocks healthy intimacy and creative life force.',
  'Vow of Non-Violence': 'You vowed never to assert. That over-softening now blocks boundaries and necessary confrontation.',
  'Vow of Truth': 'You vowed to speak only absolute truth. That rigidity now blocks compassion and diplomacy.',
  'Vow of Renunciation': 'You vowed to abandon the world. That dissociation now blocks grounding and material success.',
  'Vow of Devotion': 'You vowed to merge completely with the divine. That loss of self now blocks healthy ego and self-worth.',
};

const BLOCK_2026: Record<KarmicVow, string> = {
  'Vow of Poverty': 'Your 2026 financial and creative flow is blocked by the belief that abundance is unspiritual.',
  'Vow of Silence': 'Your 2026 voice and leadership are blocked by the fear that speaking will cause harm.',
  'Vow of Service': 'Your 2026 sustainability is blocked by the inability to receive as much as you give.',
  'Vow of Celibacy': 'Your 2026 creative and relational expansion is blocked by suppressed life force.',
  'Vow of Non-Violence': 'Your 2026 authority and protection are blocked by the refusal to say no.',
  'Vow of Truth': 'Your 2026 harmony and partnership are blocked by the need to be right over being kind.',
  'Vow of Renunciation': 'Your 2026 manifestation and success are blocked by the belief that wanting is wrong.',
  'Vow of Devotion': 'Your 2026 self-expression is blocked by the belief that your needs do not matter.',
};

const SHADOW_ANALYSIS: Record<string, string> = {
  Rahu_strong: 'Rahu on the Mount of Moon: The north node amplifies the subconscious. Your shadow is the hunger for recognition disguised as detachment.',
  Rahu_developing: 'Rahu touching the Mount of Moon: Desire and spirituality are entangled. The shadow is the belief that wanting more makes you less spiritual.',
  Rahu_blocked: 'Rahu blocked at the Mount of Moon: Past-life material obsession now manifests as guilt around success. The shadow is self-sabotage.',
  Ketu_strong: 'Ketu on the Mount of Moon: The south node dissolves the subconscious. Your shadow is the fear of disappearing if you merge fully.',
  Ketu_developing: 'Ketu touching the Mount of Moon: Liberation and attachment pull in opposite directions. The shadow is the need to be special.',
  Ketu_blocked: 'Ketu blocked at the Mount of Moon: Past-life escape from responsibility now blocks surrender. The shadow is control masquerading as surrender.',
};

/** Derive Rahu vs Ketu from Dasha or house */
export function deriveRahuKetu(dashaPeriod?: string, ketuHouse?: number): 'Rahu' | 'Ketu' {
  if (dashaPeriod) {
    const p = dashaPeriod.toLowerCase();
    if (p.includes('rahu')) return 'Rahu';
    if (p.includes('ketu')) return 'Ketu';
  }
  if (ketuHouse === 12 || ketuHouse === 6) return 'Ketu';
  if (ketuHouse === 5 || ketuHouse === 11) return 'Rahu';
  return 'Ketu';
}

/** Derive Mount of Moon state */
export function deriveMountMoon(
  palmArchetype?: 'Spiritual Mastery' | 'Karmic Debt' | null,
  seed?: string
): 'strong' | 'developing' | 'blocked' {
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

/** Get 8th Gate insight — Shadow Analysis + Karmic Vow blocking 2026 */
export function getEighthGateInsight(
  rahuKetu: 'Rahu' | 'Ketu',
  mountMoon: 'strong' | 'developing' | 'blocked',
  seed?: string
): EighthGateInsight {
  const { vow } = getRahuKetuVsMoon(rahuKetu, mountMoon, seed);
  const shadowKey = `${rahuKetu}_${mountMoon}`;
  const shadowAnalysis = SHADOW_ANALYSIS[shadowKey] ?? SHADOW_ANALYSIS['Ketu_developing'];
  return {
    shadowAnalysis,
    karmicVow: vow,
    vowExplanation: VOW_EXPLANATIONS[vow],
    block2026: BLOCK_2026[vow],
  };
}
