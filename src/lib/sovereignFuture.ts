/**
 * The Sovereign Future — Path to Power (Predictive Frequency).
 * "When the Life Line meets the Fate Line at age [X], a portal opens.
 *  To prepare, vibrate the [Bhrigu Mantra] 108 times daily."
 */

/** Bhrigu / planetary mantras for 108x daily practice */
const BHRIGU_MANTRAS: Record<string, { mantra: string; name: string }> = {
  Sun: { mantra: 'Om Hram Hreem Hraum Sah Suryaya Namah', name: 'Surya Mantra' },
  Moon: { mantra: 'Om Shram Shreem Shraum Sah Chandraya Namah', name: 'Chandra Mantra' },
  Jupiter: { mantra: 'Om Gram Greem Graum Sah Gurave Namah', name: 'Guru Mantra' },
  Ketu: { mantra: 'Om Stram Streem Straum Sah Ketave Namah', name: 'Ketu Mantra' },
  Venus: { mantra: 'Om Shum Shukraya Namah', name: 'Shukra Mantra' },
  Saturn: { mantra: 'Om Sham Shanaischaraya Namah', name: 'Shani Mantra' },
  Mars: { mantra: 'Om Kram Kreem Kraum Sah Kujaya Namah', name: 'Mangala Mantra' },
  Mercury: { mantra: 'Om Bram Breem Braum Sah Budhaya Namah', name: 'Budha Mantra' },
  Rahu: { mantra: 'Om Raam Rahve Namah', name: 'Rahu Mantra' },
};

/** Age when Life Line meets Fate Line — derived from userHouse + seed */
function getPortalAge(userHouse: number, seed?: string): number {
  const ages = [35, 42, 38, 45, 40, 48, 33, 51, 36, 44, 39, 47];
  const base = ages[userHouse % 12] ?? 42;
  if (seed) {
    const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return base + (n % 5) - 2;
  }
  return base;
}

export interface PathToPower {
  portalAge: number;
  bhriguMantra: string;
  mantraName: string;
  prophecy: string;
}

/** Get Path to Power — Life/Fate Line meeting + Bhrigu Mantra 108x */
export function getPathToPower(
  remedyPlanet: string,
  userHouse: number,
  seed?: string
): PathToPower {
  const bhrigu = BHRIGU_MANTRAS[remedyPlanet] ?? BHRIGU_MANTRAS['Ketu'];
  const portalAge = getPortalAge(userHouse, seed);
  const prophecy = `When the Life Line meets the Fate Line at age ${portalAge}, a portal opens. To prepare, vibrate the ${bhrigu.name} 108 times daily.`;
  return {
    portalAge,
    bhriguMantra: bhrigu.mantra,
    mantraName: bhrigu.name,
    prophecy,
  };
}

/** Legacy: Karmic Milestone (kept for backward compatibility) */
export function getKarmicMilestone(
  mantraPlanet: string,
  userHouse: number,
  palmArchetype?: 'Spiritual Mastery' | 'Karmic Debt' | null
): string {
  const path = getPathToPower(mantraPlanet, userHouse);
  return path.prophecy;
}
