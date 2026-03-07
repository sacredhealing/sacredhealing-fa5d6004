/**
 * SQI 2050: Real-time Planetary Cycle Engine
 * Bridges Vedic Jyotish data (birth + Vimshottari Dasha) with UI themes.
 * When user has a reading, current Mahadasha drives theme, color, and mantra.
 */

import type { VedicReading } from '@/lib/vedicTypes';

export interface PlanetaryCycle {
  planet: string;
  theme: string;
  color: string;
  mantra: string;
  status: 'active' | 'initializing';
}

const SIDDHA_GOLD = '#D4AF37';

/** Vimshottari Dasha themes — Siddha-Gold palette and expansion tones */
const CYCLES: Record<string, Omit<PlanetaryCycle, 'planet' | 'status'>> = {
  Jupiter: {
    theme: 'Expansion & Wisdom',
    color: SIDDHA_GOLD,
    mantra: 'Om Graam Greem Graum Sah Gurave Namah',
  },
  Saturn: {
    theme: 'Structure & Karma',
    color: '#7C7C8A',
    mantra: 'Om Praam Preem Praum Sah Shanaishcharaya Namah',
  },
  Venus: {
    theme: 'Abundance & Harmony',
    color: '#E8B86D',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
  },
  Mars: {
    theme: 'Courage & Action',
    color: '#C4943A',
    mantra: 'Om Kram Kreem Kraum Sah Kujaaya Namah',
  },
  Rahu: {
    theme: 'Ambition & Liberation',
    color: '#9CA3AF',
    mantra: 'Om Raam Reem Raum Sah Rahave Namah',
  },
  Mercury: {
    theme: 'Clarity & Communication',
    color: '#A3A3A3',
    mantra: 'Om Braam Breem Braum Sah Budhaaya Namah',
  },
  Ketu: {
    theme: 'Spirituality & Release',
    color: '#6B7280',
    mantra: 'Om Ketave Namah',
  },
  Sun: {
    theme: 'Sovereignty & Vitality',
    color: '#F5D76E',
    mantra: 'Om Hram Hreem Hraum Sah Suryaaya Namah',
  },
  Moon: {
    theme: 'Intuition & Flow',
    color: '#E8E8E8',
    mantra: 'Om Shram Shreem Shraum Sah Chandraya Namah',
  },
};

/** Extract current Mahadasha planet from Vedic reading (personalCompass.currentDasha.period) */
function getPlanetFromReading(reading: VedicReading | null | undefined): string | null {
  if (!reading?.personalCompass?.currentDasha?.period) return null;
  const period = reading.personalCompass.currentDasha.period;
  const planet = period.split(' ')[0]?.trim();
  return planet || null;
}

/** Normalize to a key we have in CYCLES (capitalize first letter, handle Rahu/Ketu) */
function normalizePlanetKey(planet: string | null): keyof typeof CYCLES | null {
  if (!planet) return null;
  const key = planet.charAt(0).toUpperCase() + planet.slice(1).trim();
  return key in CYCLES ? (key as keyof typeof CYCLES) : null;
}

/**
 * Get the active planetary cycle for the user.
 * Uses Vimshottari Dasha from the user's Jyotish/Vedic reading (derived from birth data).
 */
export function getActiveCycle(
  userJyotishData: VedicReading | null | undefined
): PlanetaryCycle {
  const planetKey = normalizePlanetKey(getPlanetFromReading(userJyotishData));

  if (!planetKey) {
    return {
      planet: 'Jupiter',
      theme: 'Initializing Alignment...',
      color: SIDDHA_GOLD,
      mantra: 'Om Graam Greem Graum Sah Gurave Namah',
      status: 'initializing',
    };
  }

  const base = CYCLES[planetKey];
  return {
    planet: planetKey,
    theme: base.theme,
    color: base.color,
    mantra: base.mantra,
    status: 'active',
  };
}
