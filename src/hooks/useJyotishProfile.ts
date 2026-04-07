import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useAIVedicReading } from './useAIVedicReading';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/vedicTypes';

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

// Per-planet karma focus for meditation guidance (used when masterBlueprint not available)
const KARMA_FOCUS_MAP: Record<string, string> = {
  'Sun': 'vitality, leadership and self-confidence',
  'Moon': 'emotional balance and intuition',
  'Mars': 'courage, boundaries and healthy action',
  'Mercury': 'clarity, communication and learning',
  'Jupiter': 'spiritual growth and self-mastery',
  'Venus': 'love, harmony and self-worth',
  'Saturn': 'discipline, patience and release of karma',
  'Rahu': 'detachment from illusion and worldly ambition',
  'Ketu': 'spiritual liberation and past-life clarity',
};

export function useJyotishProfile(): JyotishProfile {
  const { user: authUser } = useAuth();
  const { reading, isLoading: readingLoading, generateReading } = useAIVedicReading();
  const [isFreshForUser, setIsFreshForUser] = useState(true);
  const [birthDetailsLoading, setBirthDetailsLoading] = useState(false);

  // Reset data when user changes to prevent stale cross-user data
  useEffect(() => {
    setIsFreshForUser(false);
  }, [authUser?.id]);

  // Pull birth details from DB (scoped to current user) and (re)generate reading on mount.
  useEffect(() => {
    if (!authUser?.id) {
      setIsFreshForUser(true);
      return;
    }
    let cancelled = false;

    const run = async () => {
      setBirthDetailsLoading(true);
      try {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('birth_name, birth_date, birth_time, birth_place', { count: 'exact', head: false })
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (cancelled) return;

        if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
          const profile: UserProfile = {
            name: data.birth_name,
            birthDate: data.birth_date,
            birthTime: data.birth_time,
            birthPlace: data.birth_place,
            plan: 'compass',
          };
          await generateReading(profile, 0, 'Europe/Stockholm', authUser.id, { forceRefresh: true });
        }
      } catch {
        // keep neutral fallbacks; errors handled by caller pages
      } finally {
        if (!cancelled) {
          setBirthDetailsLoading(false);
          setIsFreshForUser(true);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, generateReading]);

  const isLoading = birthDetailsLoading || readingLoading || !isFreshForUser;

  return useMemo(() => {
    // Extract mahadasha planet from personalCompass.currentDasha.period (e.g. "Jupiter Mahadasha" → "Jupiter")
    const dashaperiod = reading?.personalCompass?.currentDasha?.period || '';
    const mahadasha = dashaperiod.split(' ')[0] || '';

    // Extract nakshatra from todayInfluence
    const nakshatra = reading?.todayInfluence?.nakshatra || 'Unknown';

    // Moon sign and other fields are not directly in the VedicReading type,
    // but can be derived from nakshatra or defaulted
    const moonSign = 'Pisces'; // default — no moonSign field in VedicReading

    // Active yogas from masterBlueprint
    const activeYogas = (reading?.masterBlueprint?.significantYogas || []).map(y => y.name);

    // Karma focus: from masterBlueprint or planet-specific default for daily relevance
    const karmaFocus = reading?.masterBlueprint?.karmaPatterns
      ? reading.masterBlueprint.karmaPatterns.split('.')[0].trim()
      : (KARMA_FOCUS_MAP[mahadasha] || KARMA_FOCUS_MAP['Jupiter']);

    // Healing focus from masterBlueprint
    const healingFocus = reading?.masterBlueprint?.soulPurpose
      ? reading.masterBlueprint.soulPurpose.split('.')[0]
      : 'Energy center balancing';

    // Bhrigu cycle from masterBlueprint timingPeaks or sadeSatiStatus
    const bhriguCycle = reading?.masterBlueprint?.sadeSatiStatus || '';

    const primaryDosha = DOSHA_MAP[moonSign] || 'Tridoshic';

    const userName = authUser?.user_metadata?.full_name || 'Sacred Soul';
    const language = (authUser?.user_metadata?.language as string) || 'en';

    return {
      nakshatra,
      moonSign,
      ascendant: 'Unknown',
      mahadasha,
      antardasha: reading?.personalCompass?.currentDasha?.focusArea?.split(' ')[0] || '',
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
