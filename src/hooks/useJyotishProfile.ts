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

// ─── Vimshottari Dasha Engine (pure math, no AI) ──────────
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

const NAKSHATRA_LORDS: Record<string, string> = {
  'Ashwini':'Ketu','Bharani':'Venus','Krittika':'Sun',
  'Rohini':'Moon','Mrigashira':'Mars','Ardra':'Rahu',
  'Punarvasu':'Jupiter','Pushya':'Saturn','Ashlesha':'Mercury',
  'Magha':'Ketu','Purva Phalguni':'Venus','Uttara Phalguni':'Sun',
  'Hasta':'Moon','Chitra':'Mars','Swati':'Rahu',
  'Vishakha':'Jupiter','Anuradha':'Saturn','Jyeshtha':'Mercury',
  'Mula':'Ketu','Purva Ashadha':'Venus','Uttara Ashadha':'Sun',
  'Shravana':'Moon','Dhanishtha':'Mars','Shatabhisha':'Rahu',
  'Purva Bhadrapada':'Jupiter','Uttara Bhadrapada':'Saturn','Revati':'Mercury',
};

function calcVimshottariDasha(
  birthDateStr: string,
  birthNakshatra: string,
  nakshatraProgressFraction: number = 0.5
): { mahadasha: string; antardasha: string } {
  if (!birthDateStr || !birthNakshatra) return { mahadasha: '', antardasha: '' };

  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const msPerYear = 365.25 * 24 * 3600 * 1000;

  const birthLord = NAKSHATRA_LORDS[birthNakshatra];
  if (!birthLord) return { mahadasha: '', antardasha: '' };

  const startIdx = VIMSHOTTARI_SEQUENCE.findIndex(d => d.planet === birthLord);
  if (startIdx < 0) return { mahadasha: '', antardasha: '' };

  const birthDashaYears = VIMSHOTTARI_SEQUENCE[startIdx].years;
  const elapsedYearsAtBirth = nakshatraProgressFraction * birthDashaYears;

  let cursor = birthDate.getTime() - elapsedYearsAtBirth * msPerYear;
  const todayMs = today.getTime();

  for (let i = 0; i < 27; i++) {
    const dasha = VIMSHOTTARI_SEQUENCE[(startIdx + i) % 9];
    const dashaEndMs = cursor + dasha.years * msPerYear;

    if (dashaEndMs > todayMs) {
      let subCursor = cursor;
      for (let j = 0; j < 9; j++) {
        const sub = VIMSHOTTARI_SEQUENCE[(startIdx + i + j) % 9];
        const subYears = (dasha.years * sub.years) / 120;
        const subEndMs = subCursor + subYears * msPerYear;
        if (subEndMs > todayMs) {
          return { mahadasha: dasha.planet, antardasha: sub.planet };
        }
        subCursor = subEndMs;
      }
      return { mahadasha: dasha.planet, antardasha: '' };
    }
    cursor = dashaEndMs;
  }

  return { mahadasha: '', antardasha: '' };
}
// ─── End Engine ───────────────────────────────────────────

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

  // Clear old AI-based dasha cache so new calculation takes effect
  useEffect(() => {
    if (!authUser?.id || typeof window === 'undefined') return;
    const keysToCheck = Object.keys(localStorage)
      .filter(k => k.includes(authUser.id) && k.includes('compass'));
    keysToCheck.forEach(k => {
      try {
        const val = JSON.parse(localStorage.getItem(k) || '{}');
        if (val?.reading?.personalCompass?.currentDasha) {
          delete val.reading.personalCompass.currentDasha;
          localStorage.setItem(k, JSON.stringify(val));
        }
      } catch {
        // ignore
      }
    });
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
    const userId = authUser?.id || '';

    // Get birth data from localStorage birth cache
    const birthCacheKey = `sh:vedic:${userId}:birth`;
    let birthData: any = null;
    try {
      const birthRaw = typeof window !== 'undefined'
        ? localStorage.getItem(birthCacheKey)
        : null;
      birthData = birthRaw ? JSON.parse(birthRaw) : null;
    } catch {
      birthData = null;
    }
    const birthDateStr = birthData?.birth_date || birthDate || '';

    // Get nakshatra from today's influence or stored reading
    const nakshatraRaw = reading?.todayInfluence?.nakshatra
      || (reading as any)?.personalCompass?.moonNakshatra
      || '';
    const nakshatra = String(nakshatraRaw || '');
    const nakshatraBase = nakshatra.replace(/\s*nakshatra.*/i, '').trim();

    const { mahadasha, antardasha } = calcVimshottariDasha(birthDateStr, nakshatraBase);

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
