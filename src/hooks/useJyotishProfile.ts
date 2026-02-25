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
const MEDITATION_MAP: Record<string, string> = {
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
const RAGA_MAP: Record<string, string> = {
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

// Map planet to healing frequency
const FREQ_MAP: Record<string, string> = {
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
const DOSHA_MAP: Record<string, string> = {
  'Aries': 'Pitta', 'Leo': 'Pitta', 'Sagittarius': 'Pitta',
  'Taurus': 'Kapha', 'Virgo': 'Vata', 'Capricorn': 'Vata',
  'Gemini': 'Vata', 'Libra': 'Vata', 'Aquarius': 'Vata',
  'Cancer': 'Kapha', 'Scorpio': 'Pitta', 'Pisces': 'Kapha',
};

export function useJyotishProfile(): JyotishProfile {
  const { user: authUser } = useAuth();
  const { reading, isLoading } = useAIVedicReading();

  return useMemo(() => {
    // Extract mahadasha planet from personalCompass.currentDasha.period (e.g. "Jupiter Mahadasha" → "Jupiter")
    const dashaperiod = reading?.personalCompass?.currentDasha?.period || '';
    const mahadasha = dashaperiod.split(' ')[0] || 'Jupiter';

    // Extract nakshatra from todayInfluence
    const nakshatra = reading?.todayInfluence?.nakshatra || 'Unknown';

    // Moon sign and other fields are not directly in the VedicReading type,
    // but can be derived from nakshatra or defaulted
    const moonSign = 'Pisces'; // default — no moonSign field in VedicReading

    // Active yogas from masterBlueprint
    const activeYogas = (reading?.masterBlueprint?.significantYogas || []).map(y => y.name);

    // Karma focus from masterBlueprint
    const karmaFocus = reading?.masterBlueprint?.karmaPatterns
      ? reading.masterBlueprint.karmaPatterns.split('.')[0]
      : 'spiritual growth and self-mastery';

    // Healing focus from masterBlueprint
    const healingFocus = reading?.masterBlueprint?.soulPurpose
      ? reading.masterBlueprint.soulPurpose.split('.')[0]
      : 'Energy center balancing';

    // Bhrigu cycle from masterBlueprint timingPeaks or sadeSatiStatus
    const bhriguCycle = reading?.masterBlueprint?.sadeSatiStatus || 'Rahu/Ketu';

    const primaryDosha = DOSHA_MAP[moonSign] || 'Tridoshic';

    const userName = authUser?.user_metadata?.full_name || 'Sacred Soul';
    const language = (authUser?.user_metadata?.language as string) || 'en';

    return {
      nakshatra,
      moonSign,
      ascendant: 'Unknown',
      mahadasha,
      antardasha: reading?.personalCompass?.currentDasha?.focusArea?.split(' ')[0] || 'Venus',
      primaryDosha,
      doshaImbalance: `${primaryDosha} aggravation`,
      activeYogas,
      bhriguCycle,
      karmaFocus,
      meditationType: MEDITATION_MAP[mahadasha] || 'Dhyana (deep meditation)',
      healingFocus,
      musicRaga: RAGA_MAP[mahadasha] || 'Raga Yaman',
      musicFrequency: FREQ_MAP[mahadasha] || '528Hz',
      mantraFocus: `Om ${mahadasha}aya Namaha`,
      language,
      isLoading,
      userName,
    };
  }, [reading, isLoading, authUser]);
}
