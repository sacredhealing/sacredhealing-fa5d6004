/**
 * The Sovereign Future — Conditional Prophecy / Karmic Milestone generator.
 * "If you vibrate at the frequency of [Mantra] for 40 days, the block in your [Palm Mount] will dissolve, unlocking [Life Goal]."
 */

export type PalmMount = 'Mount of Jupiter' | 'Mount of Saturn' | 'Mount of Apollo' | 'Mount of Mercury' | 'Mount of Venus' | 'Mount of Moon' | 'Mount of Mars';

const MANTRA_BY_PLANET: Record<string, string> = {
  Sun: 'Om Hram Hreem Hraum Sah Suryaya Namah',
  Moon: 'Om Shram Shreem Shraum Sah Chandraya Namah',
  Jupiter: 'Om Gram Greem Graum Sah Gurave Namah',
  Ketu: 'Om Stram Streem Straum Sah Ketave Namah',
  Venus: 'Om Shum Shukraya Namah',
  Saturn: 'Om Sham Shanaischaraya Namah',
  Mars: 'Om Kram Kreem Kraum Sah Kujaya Namah',
  Mercury: 'Om Bram Breem Braum Sah Budhaya Namah',
  Rahu: 'Om Raam Rahve Namah',
};

const MOUNT_BY_HOUSE: Record<number, PalmMount> = {
  1: 'Mount of Jupiter',
  4: 'Mount of Moon',
  9: 'Mount of Jupiter',
  12: 'Mount of Moon',
};

const LIFE_GOALS: Record<string, string[]> = {
  Jupiter: ['your capacity to lead and inspire', 'true authority without domination', 'the throne of dharma'],
  Moon: ['deep emotional sovereignty', 'the temple of the heart', 'intuitive mastery'],
  Sun: ['radiant self-expression', 'solar sovereignty', 'the crown of purpose'],
  Ketu: ['liberation from the cycle of want', 'the cave of peace', 'surrender without loss'],
  Venus: ['creative flow without block', 'the garden of beauty', 'love in full expression'],
  Saturn: ['discipline as grace', 'the fortress of karma', 'patience that transforms'],
};

/** Generate the Karmic Milestone prophecy */
export function getKarmicMilestone(
  mantraPlanet: string,
  userHouse: number,
  palmArchetype?: 'Spiritual Mastery' | 'Karmic Debt' | null
): string {
  const mantra = MANTRA_BY_PLANET[mantraPlanet] ?? MANTRA_BY_PLANET['Ketu'];
  const mount = MOUNT_BY_HOUSE[userHouse] ?? 'Mount of Jupiter';
  const goals = LIFE_GOALS[mantraPlanet] ?? LIFE_GOALS['Jupiter'];
  const goalIndex = palmArchetype === 'Karmic Debt' ? 1 : palmArchetype === 'Spiritual Mastery' ? 2 : 0;
  const lifeGoal = goals[goalIndex % goals.length];
  return `If you vibrate at the frequency of the ${mantraPlanet} mantra for 40 days, the block in your ${mount} will dissolve, unlocking ${lifeGoal}.`;
}
