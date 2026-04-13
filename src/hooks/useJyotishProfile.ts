import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useAIVedicReading } from './useAIVedicReading';
import { calculateMoonNakshatra } from '@/lib/vedicCalculations';
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
  Sun: 'Trataka (fire/candle gazing)',
  Moon: 'Chandra meditation (cooling pranayama)',
  Mars: 'Dynamic movement meditation',
  Mercury: 'Mantra japa meditation',
  Jupiter: 'Dhyana (deep silent meditation)',
  Venus: 'Bhakti (devotional meditation)',
  Saturn: 'Vipassana (mindful observation)',
  Rahu: 'Shadow work meditation',
  Ketu: 'Kundalini meditation',
};

// Map planet to music raga
const RAGA_MAP: Record<string, string> = {
  Sun: 'Raga Kalyan',
  Moon: 'Raga Bhimpalasi',
  Mars: 'Raga Sarang',
  Mercury: 'Raga Bhairavi',
  Jupiter: 'Raga Yaman',
  Venus: 'Raga Darbari',
  Saturn: 'Raga Malkauns',
  Rahu: 'Raga Marwa',
  Ketu: 'Raga Todi',
};

// Map planet to healing frequency
const FREQ_MAP: Record<string, string> = {
  Sun: '528Hz (transformation)',
  Moon: '432Hz (harmony)',
  Mars: '396Hz (liberation)',
  Mercury: '741Hz (expression)',
  Jupiter: '963Hz (divine connection)',
  Venus: '639Hz (relationships)',
  Saturn: '285Hz (grounding)',
  Rahu: '417Hz (change)',
  Ketu: '852Hz (intuition)',
};

// Map moon sign to dosha
const DOSHA_MAP: Record<string, string> = {
  Aries: 'Pitta', Leo: 'Pitta', Sagittarius: 'Pitta',
  Taurus: 'Kapha', Virgo: 'Vata', Capricorn: 'Vata',
  Gemini: 'Vata', Libra: 'Vata', Aquarius: 'Vata',
  Cancer: 'Kapha', Scorpio: 'Pitta', Pisces: 'Kapha',
};

// Per-planet karma focus for meditation guidance (used when masterBlueprint not available)
const KARMA_FOCUS_MAP: Record<string, string> = {
  Sun: 'vitality, leadership and self-confidence',
  Moon: 'emotional balance and intuition',
  Mars: 'courage, boundaries and healthy action',
  Mercury: 'clarity, communication and learning',
  Jupiter: 'spiritual growth and self-mastery',
  Venus: 'love, harmony and self-worth',
  Saturn: 'discipline, patience and release of karma',
  Rahu: 'detachment from illusion and worldly ambition',
  Ketu: 'spiritual liberation and past-life clarity',
};

type CachedBirthData = {
  birth_name?: string | null;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  birth_nakshatra?: string | null;
  nakshatra?: string | null;
};

const VIMSHOTTARI = [
  { p: 'Ketu', y: 7 },
  { p: 'Venus', y: 20 },
  { p: 'Sun', y: 6 },
  { p: 'Moon', y: 10 },
  { p: 'Mars', y: 7 },
  { p: 'Rahu', y: 18 },
  { p: 'Jupiter', y: 16 },
  { p: 'Saturn', y: 19 },
  { p: 'Mercury', y: 17 },
] as const;

const NAKSHATRA_LORD: Record<string, string> = {
  Ashwini: 'Ketu',
  Bharani: 'Venus',
  Krittika: 'Sun',
  Rohini: 'Moon',
  Mrigashira: 'Mars',
  Ardra: 'Rahu',
  Punarvasu: 'Jupiter',
  Pushya: 'Saturn',
  Ashlesha: 'Mercury',
  Magha: 'Ketu',
  'Purva Phalguni': 'Venus',
  'Uttara Phalguni': 'Sun',
  Hasta: 'Moon',
  Chitra: 'Mars',
  Swati: 'Rahu',
  Vishakha: 'Jupiter',
  Anuradha: 'Saturn',
  Jyeshtha: 'Mercury',
  Mula: 'Ketu',
  'Purva Ashadha': 'Venus',
  'Uttara Ashadha': 'Sun',
  Shravana: 'Moon',
  Dhanishtha: 'Mars',
  Shatabhisha: 'Rahu',
  'Purva Bhadrapada': 'Jupiter',
  'Uttara Bhadrapada': 'Saturn',
  Revati: 'Mercury',
};

function getBirthCacheKey(userId?: string | null) {
  return userId ? `sh:vedic:${userId}:birth` : null;
}

function parseBirthCache(raw: string | null): CachedBirthData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedBirthData;
  } catch {
    return null;
  }
}

function normalizeNakshatraName(value: string): string {
  const cleaned = value.replace(/\s*nakshatra.*/i, '').trim();
  if (!cleaned) return '';

  const exactMatch = Object.keys(NAKSHATRA_LORD).find(
    (name) => name.toLowerCase() === cleaned.toLowerCase()
  );

  if (exactMatch) return exactMatch;

  const containsMatch = Object.keys(NAKSHATRA_LORD).find(
    (name) => cleaned.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(cleaned.toLowerCase())
  );

  return containsMatch || cleaned;
}

function stripCachedCurrentDasha(userId?: string | null) {
  if (!userId || typeof window === 'undefined') return;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`sh:vedic:reading:${userId}:`)) continue;

    try {
      const cached = JSON.parse(localStorage.getItem(key) || '{}');
      if (cached?.reading?.personalCompass?.currentDasha) {
        delete cached.reading.personalCompass.currentDasha;
        localStorage.setItem(key, JSON.stringify(cached));
      }
    } catch {
      // Ignore malformed cache entries.
    }
  }
}

export function getRealDasha(
  birthDateStr: string,
  moonNakshatra: string,
  progressInNakshatra = 0.5
): { mahadasha: string; antardasha: string } {
  const normalizedNakshatra = normalizeNakshatraName(moonNakshatra);
  const lord = NAKSHATRA_LORD[normalizedNakshatra];

  if (!lord || !birthDateStr) {
    return { mahadasha: '', antardasha: '' };
  }

  const MS_PER_YEAR = 365.25 * 86400 * 1000;
  const startIdx = VIMSHOTTARI.findIndex((d) => d.p === lord);
  if (startIdx < 0) {
    return { mahadasha: '', antardasha: '' };
  }

  const safeProgress = Number.isFinite(progressInNakshatra)
    ? Math.min(1, Math.max(0, progressInNakshatra))
    : 0.5;

  const elapsedAtBirth = safeProgress * VIMSHOTTARI[startIdx].y;
  let cursor = new Date(birthDateStr).getTime() - elapsedAtBirth * MS_PER_YEAR;
  if (Number.isNaN(cursor)) {
    return { mahadasha: '', antardasha: '' };
  }

  const now = Date.now();

  for (let i = 0; i < 27; i += 1) {
    const maha = VIMSHOTTARI[(startIdx + i) % 9];
    const mahaEnd = cursor + maha.y * MS_PER_YEAR;

    if (mahaEnd > now) {
      let sub = cursor;

      for (let j = 0; j < 9; j += 1) {
        const antar = VIMSHOTTARI[(startIdx + i + j) % 9];
        const subYears = (maha.y * antar.y) / 120;
        const subEnd = sub + subYears * MS_PER_YEAR;

        if (subEnd > now) {
          return { mahadasha: maha.p, antardasha: antar.p };
        }

        sub = subEnd;
      }

      return { mahadasha: maha.p, antardasha: '' };
    }
    cursor = mahaEnd;
  }
  return { mahadasha: '', antardasha: '' };
}

export function useJyotishProfile(): JyotishProfile {
  const { user: authUser } = useAuth();
  const { reading, isLoading: readingLoading, generateReading } = useAIVedicReading();
  const [isFreshForUser, setIsFreshForUser] = useState(true);
  const [birthDetailsLoading, setBirthDetailsLoading] = useState(false);
  const [birthData, setBirthData] = useState<CachedBirthData | null>(null);

  // Reset data when user changes to prevent stale cross-user data.
  useEffect(() => {
    setIsFreshForUser(false);
    setBirthData(null);
  }, [authUser?.id]);

  // Strip AI currentDasha from cached readings and persist birth nakshatra if the reading exposes one.
  // Guard with isFreshForUser to avoid writing a previous user's nakshatra to the current user's profile.
  useEffect(() => {
    if (!authUser?.id) return;

    stripCachedCurrentDasha(authUser.id);

    if (!isFreshForUser || typeof window === 'undefined') return;

    const rawReading = reading as any;
    const derivedBirthNakshatra = normalizeNakshatraName(
      String(
        rawReading?.personalCompass?.moonNakshatra ||
          rawReading?.natalChart?.moonNakshatra ||
          rawReading?.birthNakshatra ||
          ''
      )
    );

    if (!derivedBirthNakshatra) return;

    // Persist to profiles table if not already stored
    if (birthData && !birthData.birth_nakshatra) {
      (supabase as any)
        .from('profiles')
        .update({ birth_nakshatra: derivedBirthNakshatra })
        .eq('user_id', authUser.id)
        .then(() => {});
    }

    const birthCacheKey = getBirthCacheKey(authUser.id);
    if (!birthCacheKey) return;

    const cachedBirth = parseBirthCache(localStorage.getItem(birthCacheKey));
    const nextBirthData: CachedBirthData = {
      ...(cachedBirth || {}),
      birth_nakshatra: derivedBirthNakshatra,
    };

    localStorage.setItem(birthCacheKey, JSON.stringify(nextBirthData));
    setBirthData((prev) => ({ ...(prev || {}), birth_nakshatra: derivedBirthNakshatra }));
  }, [authUser?.id, isFreshForUser, reading, birthData]);

  // Pull birth details from the current user's profile and keep a local birth cache for deterministic dasha math.
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
          .select('birth_name, birth_date, birth_time, birth_place, birth_nakshatra')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (cancelled) return;

        const nextBirthData: CachedBirthData | null = data
          ? {
              birth_name: data.birth_name ?? null,
              birth_date: data.birth_date ?? null,
              birth_time: data.birth_time ?? null,
              birth_place: data.birth_place ?? null,
              birth_nakshatra: data.birth_nakshatra ?? null,
            }
          : null;

        setBirthData(nextBirthData);

        const birthCacheKey = getBirthCacheKey(authUser.id);
        if (birthCacheKey && typeof window !== 'undefined') {
          if (nextBirthData?.birth_date) {
            const existingBirth = parseBirthCache(localStorage.getItem(birthCacheKey));
            localStorage.setItem(
              birthCacheKey,
              JSON.stringify({
                ...(existingBirth || {}),
                ...nextBirthData,
              })
            );
          } else {
            localStorage.removeItem(birthCacheKey);
          }
        }

        if (
          nextBirthData?.birth_name &&
          nextBirthData?.birth_date &&
          nextBirthData?.birth_time &&
          nextBirthData?.birth_place
        ) {
          const profile: UserProfile = {
            name: nextBirthData.birth_name,
            birthDate: nextBirthData.birth_date,
            birthTime: nextBirthData.birth_time,
            birthPlace: nextBirthData.birth_place,
            plan: 'compass',
          };

          await generateReading(profile, 0, 'Europe/Stockholm', authUser.id);
        }
      } catch {
        // Keep neutral fallbacks; errors are handled by caller pages.
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
    const userId = authUser?.id;
    const birthCacheKey = getBirthCacheKey(userId);
    const cachedBirth = birthData || (
      birthCacheKey && typeof window !== 'undefined'
        ? parseBirthCache(localStorage.getItem(birthCacheKey))
        : null
    );

    // ── AUTHORITATIVE: compute from birth data, IGNORE AI text ──
    const birthDateStr = cachedBirth?.birth_date ?? '';
    // Only use the AI reading if it belongs to the current user (isFreshForUser guards against stale cross-user data).
    const rawReading = isFreshForUser ? (reading as any) : null;
    let moonNakshatra = normalizeNakshatraName(
      String(
        cachedBirth?.birth_nakshatra ||
          cachedBirth?.nakshatra ||
          rawReading?.personalCompass?.moonNakshatra ||
          rawReading?.natalChart?.moonNakshatra ||
          rawReading?.birthNakshatra ||
          ''
      )
    );

    // Fallback: approximate nakshatra from birth date if AI didn't provide it
    if (!moonNakshatra && birthDateStr) {
      const birthDate = new Date(birthDateStr);
      if (!Number.isNaN(birthDate.getTime())) {
        moonNakshatra = calculateMoonNakshatra(birthDate);
      }
    }

    const rawMoonDegree =
      rawReading?.natalChart?.moonDegree ??
      rawReading?.natalChart?.moonLongitude ??
      rawReading?.moonDegree ??
      rawReading?.moonLongitude;

    const moonDeg = typeof rawMoonDegree === 'number' ? rawMoonDegree : Number(rawMoonDegree);
    const nakshatraProgress = Number.isFinite(moonDeg)
      ? ((((moonDeg % 13.333) + 13.333) % 13.333) / 13.333)
      : 0.5;

    const { mahadasha, antardasha } = moonNakshatra && birthDateStr
      ? getRealDasha(birthDateStr, moonNakshatra, nakshatraProgress)
      : { mahadasha: '', antardasha: '' };

    const nakshatra = String(moonNakshatra || '');

    // Moon sign and other fields are not directly in the VedicReading type,
    // but can be derived from nakshatra or defaulted.
    const moonSign = 'Pisces';

    const activeYogas = (reading?.masterBlueprint?.significantYogas || []).map((y) => y.name);

    const karmaFocus = reading?.masterBlueprint?.karmaPatterns
      ? reading.masterBlueprint.karmaPatterns.split('.')[0].trim()
      : (KARMA_FOCUS_MAP[mahadasha] || KARMA_FOCUS_MAP.Jupiter);

    const healingFocus = reading?.masterBlueprint?.soulPurpose
      ? reading.masterBlueprint.soulPurpose.split('.')[0]
      : 'Energy center balancing';

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
      mantraFocus: mahadasha ? `Om ${mahadasha}aya Namaha` : 'Om Gurave Namaha',
      language,
      isLoading,
      userName,
    };
  }, [authUser, birthData, isFreshForUser, isLoading, reading]);
}
