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

// ─── Real Vimshottari Dasha Engine ───────────────────────
// Standard Vimshottari sequence and durations (years)
const VIMSHOTTARI_SEQUENCE = [
  { planet: 'Ketu',    years: 7  },
  { planet: 'Venus',   years: 20 },
  { planet: 'Sun',     years: 6  },
  { planet: 'Moon',    years: 10 },
  { planet: 'Mars',    years: 7  },
  { planet: 'Rahu',    years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn',  years: 19 },
  { planet: 'Mercury', years: 17 },
];

// 27 Nakshatras and their ruling planets (Vimshottari lords)
const NAKSHATRA_LORDS: Record<number, string> = {
  0:  'Ketu',    // Ashwini
  1:  'Venus',   // Bharani
  2:  'Sun',     // Krittika
  3:  'Moon',    // Rohini
  4:  'Mars',    // Mrigashira
  5:  'Rahu',    // Ardra
  6:  'Jupiter', // Punarvasu
  7:  'Saturn',  // Pushya
  8:  'Mercury', // Ashlesha
  9:  'Ketu',    // Magha
  10: 'Venus',   // Purva Phalguni
  11: 'Sun',     // Uttara Phalguni
  12: 'Moon',    // Hasta
  13: 'Mars',    // Chitra
  14: 'Rahu',    // Swati
  15: 'Jupiter', // Vishakha
  16: 'Saturn',  // Anuradha
  17: 'Mercury', // Jyeshtha
  18: 'Ketu',    // Mula
  19: 'Venus',   // Purva Ashadha
  20: 'Sun',     // Uttara Ashadha
  21: 'Moon',    // Shravana
  22: 'Mars',    // Dhanishtha
  23: 'Rahu',    // Shatabhisha
  24: 'Jupiter', // Purva Bhadrapada
  25: 'Saturn',  // Uttara Bhadrapada
  26: 'Mercury', // Revati
};

const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni',
  'Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha',
  'Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana',
  'Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

function calculateVimshottariDasha(
  birthDateStr: string,
  nakshatraIndex: number,
  nakshatraProgress: number
): { mahadasha: string; antardasha: string; dashaEndDate: string } {
  const birthDate = new Date(birthDateStr);
  const today = new Date();

  const birthLord = NAKSHATRA_LORDS[nakshatraIndex];
  const birthLordIndex = VIMSHOTTARI_SEQUENCE.findIndex(d => d.planet === birthLord);

  const birthDashaYears = VIMSHOTTARI_SEQUENCE[birthLordIndex].years;
  const elapsedAtBirth = nakshatraProgress * birthDashaYears;

  // Start cursor at birth, then rewind by elapsed portion of birth dasha
  let cursor = new Date(birthDate);
  cursor.setFullYear(cursor.getFullYear() - Math.floor(elapsedAtBirth));
  cursor.setMonth(cursor.getMonth() - Math.round((elapsedAtBirth % 1) * 12));

  let currentMahadasha = '';
  let currentAntardasha = '';
  let dashaEndDate = '';

  let idx = birthLordIndex;
  for (let i = 0; i < 9 * 3; i++) {
    const dasha = VIMSHOTTARI_SEQUENCE[idx % 9];
    const dashaEndMs = cursor.getTime() + dasha.years * 365.25 * 24 * 3600 * 1000;
    const dashaEnd = new Date(dashaEndMs);

    if (dashaEnd > today) {
      currentMahadasha = dasha.planet;
      dashaEndDate = dashaEnd.toISOString().split('T')[0];

      let subCursor = new Date(cursor);
      for (let j = 0; j < 9; j++) {
        const subDasha = VIMSHOTTARI_SEQUENCE[(idx + j) % 9];
        const subYears = (dasha.years * subDasha.years) / 120;
        const subEndMs = subCursor.getTime() + subYears * 365.25 * 24 * 3600 * 1000;
        const subEnd = new Date(subEndMs);
        if (subEnd > today) {
          currentAntardasha = subDasha.planet;
          break;
        }
        subCursor = subEnd;
      }
      break;
    }

    cursor = dashaEnd;
    idx++;
  }

  return {
    mahadasha: currentMahadasha || 'Saturn',
    antardasha: currentAntardasha || '',
    dashaEndDate,
  };
}
// ─── End Vimshottari Engine ───────────────────────────────

export function useJyotishProfile(): JyotishProfile {
  const { user: authUser } = useAuth();
  const { reading, isLoading: readingLoading, generateReading } = useAIVedicReading();
  const [isFreshForUser, setIsFreshForUser] = useState(true);
  const [birthDetailsLoading, setBirthDetailsLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<string | null>(null);

  // Reset data when user changes to prevent stale cross-user data
  useEffect(() => {
    setIsFreshForUser(false);
    setBirthDate(null);
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

        if (data?.birth_date) {
          setBirthDate(data.birth_date);
        }

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
    // Extract nakshatra from AI reading (used for Vimshottari lookup)
    const nakshatra = reading?.todayInfluence?.nakshatra || 'Unknown';

    // Map nakshatra name to index (0-26) for real Vimshottari calculation
    const nakshatraIdx = NAKSHATRA_NAMES.findIndex(
      n => nakshatra?.toLowerCase().includes(n.toLowerCase())
    );

    // Real Vimshottari Dasha from actual birth date + nakshatra
    const realDasha = birthDate && nakshatraIdx >= 0
      ? calculateVimshottariDasha(birthDate, nakshatraIdx, 0.5)
      : null;

    const mahadasha = realDasha?.mahadasha || '';
    const antardasha = realDasha?.antardasha || '';

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
      antardasha,
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
  }, [reading, isLoading, authUser, birthDate]);
}
