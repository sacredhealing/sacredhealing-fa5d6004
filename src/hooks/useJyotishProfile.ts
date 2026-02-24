import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useAIVedicReading } from './useAIVedicReading';

export interface JyotishProfile {
  nakshatra: string;
  moonSign: string;
  ascendant: string;
  mahadasha: string;
  antardasha: string;
  primaryDosha: string;
  doshaImbalance: string;
  activeYogas: string[];
  bhriguCycle: string;
  karmaFocus: string;
  meditationType: string;
  healingFocus: string;
  musicRaga: string;
  musicFrequency: string;
  mantraFocus: string;
  language: string;
  isLoading: boolean;
  userName: string;
}

// Map mahadasha planet to meditation type
const meditationMap: Record<string, string> = {
  'Sun': 'Trataka (fire/candle gazing)',
  'Moon': 'Chandra meditation (cooling pranayama)',
  'Mars': 'Dynamic movement meditation',
  'Mercury': 'Mantra japa meditation',
  'Jupiter': 'Dhyana (deep silent meditation)',
  'Venus': 'Bhakti (devotional meditation)',
  'Saturn': 'Vipassana (mindful observation)',
  'Rahu': 'Shadow work meditation',
  'Ketu': 'Kundalini meditation',
};

// Map planet to music raga
const ragaMap: Record<string, string> = {
  'Sun': 'Raga Kalyan',
  'Moon': 'Raga Bhimpalasi',
  'Mars': 'Raga Sarang',
  'Mercury': 'Raga Bhairavi',
  'Jupiter': 'Raga Yaman',
  'Venus': 'Raga Darbari',
  'Saturn': 'Raga Malkauns',
  'Rahu': 'Raga Marwa',
  'Ketu': 'Raga Todi',
};

// Map planet to frequency
const freqMap: Record<string, string> = {
  'Sun': '528Hz (transformation)',
  'Moon': '432Hz (harmony)',
  'Mars': '396Hz (liberation)',
  'Mercury': '741Hz (expression)',
  'Jupiter': '963Hz (divine connection)',
  'Venus': '639Hz (relationships)',
  'Saturn': '285Hz (grounding)',
  'Rahu': '417Hz (change)',
  'Ketu': '852Hz (intuition)',
};

// Map moon sign to dosha
const doshaMap: Record<string, string> = {
  'Aries': 'Pitta', 'Leo': 'Pitta', 'Sagittarius': 'Pitta',
  'Taurus': 'Kapha', 'Virgo': 'Vata', 'Capricorn': 'Vata',
  'Gemini': 'Vata', 'Libra': 'Vata', 'Aquarius': 'Vata',
  'Cancer': 'Kapha', 'Scorpio': 'Pitta', 'Pisces': 'Kapha',
};

/**
 * Extract the planet name from a dasha period string.
 * Handles formats like "Jupiter Mahadasha", "Saturn/Venus", "Jupiter", etc.
 */
function extractPlanet(period: string | undefined): string {
  if (!period) return 'Jupiter';
  // Take the first word, which is typically the planet name
  const first = period.split(/[\s/]/)[0];
  // Validate it's a known planet
  if (meditationMap[first]) return first;
  return 'Jupiter';
}

export function useJyotishProfile(): JyotishProfile {
  const { user: authUser } = useAuth();
  const { reading, isLoading } = useAIVedicReading();

  return useMemo(() => {
    const todayInfluence = reading?.todayInfluence;
    const compass = reading?.personalCompass;
    const blueprint = reading?.masterBlueprint;

    // Extract mahadasha planet from currentDasha.period (e.g. "Jupiter Mahadasha")
    const mahadasha = extractPlanet(compass?.currentDasha?.period);

    // Nakshatra from today's influence — also try to infer moon sign from planetary influence
    const nakshatra = todayInfluence?.nakshatra || 'Unknown';
    const planetaryInfluence = todayInfluence?.planetaryInfluence || '';

    // Default moon sign — the AI doesn't expose it directly, so we derive from planetary influence
    const moonSign = 'Pisces';

    // Active yogas from masterBlueprint
    const activeYogas = blueprint?.significantYogas?.map(y => y.name) || [];

    // Karma focus from the current dasha
    const karmaFocus = compass?.currentDasha?.focusArea || 'spiritual growth and self-mastery';

    return {
      nakshatra,
      moonSign,
      ascendant: 'Unknown',
      mahadasha,
      antardasha: 'Venus',
      primaryDosha: doshaMap[moonSign] || 'Tridoshic',
      doshaImbalance: `${doshaMap[moonSign] || 'Vata'} aggravation`,
      activeYogas,
      bhriguCycle: 'Rahu/Ketu',
      karmaFocus,
      meditationType: meditationMap[mahadasha] || 'Dhyana (deep meditation)',
      healingFocus: 'Energy center balancing',
      musicRaga: ragaMap[mahadasha] || 'Raga Yaman',
      musicFrequency: freqMap[mahadasha] || '528Hz',
      mantraFocus: `Om ${mahadasha}aya Namaha`,
      language: (authUser as any)?.language || 'en',
      isLoading,
      userName: (authUser as any)?.user_metadata?.full_name || (authUser as any)?.full_name || 'Sacred Soul',
    };
  }, [reading, isLoading, authUser]);
}
