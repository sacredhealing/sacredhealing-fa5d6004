import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile, VedicReading } from '@/lib/vedicTypes';
import { getPlanetOfDay, getPlanetOfHour, normalizePlanetName, mantraMatchesPlanet, type Planet } from '@/lib/jyotishMantraLogic';

export interface JyotishMantraRecommendation {
  planet: string | null;
  dasha: string | null;
  message: string;
  duration: string;
  repetitions: number;
  bestTime: string;
  recommendedMantraId: string | null;
  // Enhanced fields for Day/Period/Hour recommendations
  dayMantraId?: string | null;
  periodMantraId?: string | null;
  horaMantraId?: string | null;
  dayPlanet?: Planet | null;
  periodPlanet?: Planet | null;
  horaPlanet?: Planet | null;
}

// ─── Birth-details cache (localStorage, 15-min TTL) ──────────────────────────
const BD_CACHE_KEY_PREFIX = 'sh:bd:';
const BD_CACHE_TTL_MS = 15 * 60 * 1000;

interface BirthDetails {
  birth_name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
}

function loadBirthDetailsCache(userId: string): BirthDetails | null {
  try {
    const raw = localStorage.getItem(BD_CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > BD_CACHE_TTL_MS) {
      localStorage.removeItem(BD_CACHE_KEY_PREFIX + userId);
      return null;
    }
    return data as BirthDetails;
  } catch {
    return null;
  }
}

function saveBirthDetailsCache(userId: string, data: BirthDetails) {
  try {
    localStorage.setItem(BD_CACHE_KEY_PREFIX + userId, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

/**
 * Hook to get Jyotish-based mantra recommendation
 * Enhanced with Vara (Day), Dasha (Period), and Hora (Hour) logic
 * Returns null if user has no Jyotish data
 *
 * @param mantras  List of mantras to match against
 * @param externalReading  Optional pre-loaded VedicReading – avoids a second API/cache call
 */
export function useJyotishMantraRecommendation(
  mantras: Array<{ id: string; title: string; planet_type?: string | null }>,
  externalReading?: VedicReading | null
): JyotishMantraRecommendation | null {
  const { user } = useAuth();
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(() => {
    // Eagerly populate from cache so the hook isn't null on first render
    if (user) {
      return loadBirthDetailsCache(user.id);
    }
    return null;
  });

  // Only spin up an internal reading if the caller hasn't provided one
  const { reading: internalReading, generateReading } = useAIVedicReading();
  const reading = externalReading !== undefined ? externalReading : internalReading;

  // ── Birth details: check cache first, then DB ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setHasBirthDetails(false);
      setBirthDetails(null);
      return;
    }

    // If we already have cached data from the useState initializer, trust it
    const cached = loadBirthDetailsCache(user.id);
    if (cached) {
      setBirthDetails(cached);
      setHasBirthDetails(true);
      return;
    }

    // No cache → fetch from DB
    const fetchBirthDetails = async () => {
      try {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('birth_name, birth_date, birth_time, birth_place')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
          const bd: BirthDetails = {
            birth_name: data.birth_name,
            birth_date: data.birth_date,
            birth_time: data.birth_time,
            birth_place: data.birth_place,
          };
          saveBirthDetailsCache(user.id, bd);
          setBirthDetails(bd);
          setHasBirthDetails(true);
        } else {
          setHasBirthDetails(false);
          setBirthDetails(null);
        }
      } catch (error) {
        console.error('Error fetching birth details:', error);
        setHasBirthDetails(false);
        setBirthDetails(null);
      }
    };

    fetchBirthDetails();
  }, [user]);

  // Sync hasBirthDetails when birthDetails is restored from cache on mount
  useEffect(() => {
    if (birthDetails) setHasBirthDetails(true);
  }, [birthDetails]);

  // ── Generate reading only when using internal reading path ────────────────
  useEffect(() => {
    // If caller provided externalReading, we don't need to generate internally
    if (externalReading !== undefined) return;
    if (hasBirthDetails && birthDetails && !reading) {
      const userProfile: UserProfile = {
        name: birthDetails.birth_name,
        birthDate: birthDetails.birth_date,
        birthTime: birthDetails.birth_time,
        birthPlace: birthDetails.birth_place,
        plan: 'compass',
      };
      generateReading(userProfile);
    }
  }, [hasBirthDetails, birthDetails, reading, generateReading, externalReading]);

  // ── Build recommendation ───────────────────────────────────────────────────
  if (!hasBirthDetails || !reading) {
    return null;
  }

  // 1. VARA LOGIC: Current day planet
  const dayPlanet = getPlanetOfDay();

  // 2. DASHA LOGIC: Extract planet from current dasha period
  const dashaPeriod = reading.personalCompass?.currentDasha?.period || null;
  const periodPlanet = dashaPeriod
    ? normalizePlanetName(dashaPeriod.split(' ')[0])
    : null;

  // 3. HORA LOGIC: Current planetary hour (simplified – uses default sunrise)
  const horaPlanet = getPlanetOfHour();

  // Primary recommendation: Use period planet if available, otherwise day planet
  const primaryPlanet = periodPlanet || dayPlanet;

  if (!primaryPlanet) {
    return null;
  }

  const planetMessages: Record<Planet, { message: string; bestTime: string }> = {
    Sun: {
      message: 'You are currently in a Sun influence. This mantra supports vitality and inner strength.',
      bestTime: 'morning',
    },
    Moon: {
      message: 'You are currently in a Moon influence. This mantra supports emotional balance and inner peace.',
      bestTime: 'evening',
    },
    Mars: {
      message: 'You are currently in a Mars influence. This mantra supports courage and balanced energy.',
      bestTime: 'morning',
    },
    Mercury: {
      message: 'You are currently in a Mercury influence. This mantra supports wisdom and clear communication.',
      bestTime: 'morning',
    },
    Jupiter: {
      message: 'You are currently in a Jupiter influence. This mantra supports wisdom and spiritual growth.',
      bestTime: 'morning',
    },
    Venus: {
      message: 'You are currently in a Venus influence. This mantra supports love and harmony.',
      bestTime: 'evening',
    },
    Saturn: {
      message: 'You are currently in a Saturn influence. This mantra supports balance and stability.',
      bestTime: 'morning',
    },
    Rahu: {
      message: 'You are currently in a Rahu influence. This mantra supports grounding and protection.',
      bestTime: 'morning',
    },
    Ketu: {
      message: 'You are currently in a Ketu influence. This mantra supports spiritual growth and liberation.',
      bestTime: 'evening',
    },
  };

  const dayMantra = mantras.find(m => mantraMatchesPlanet(m, dayPlanet));
  const periodMantra = periodPlanet ? mantras.find(m => mantraMatchesPlanet(m, periodPlanet)) : null;
  const horaMantra = horaPlanet ? mantras.find(m => mantraMatchesPlanet(m, horaPlanet)) : null;

  const recommendedMantra = periodMantra || dayMantra || horaMantra;
  const recommendedPlanet = periodPlanet || dayPlanet || horaPlanet;

  if (!recommendedPlanet || !planetMessages[recommendedPlanet]) {
    return null;
  }

  const planetInfo = planetMessages[recommendedPlanet];

  return {
    planet: recommendedPlanet.toLowerCase(),
    dasha: dashaPeriod,
    message: planetInfo.message,
    duration: '40 days',
    repetitions: 108,
    bestTime: planetInfo.bestTime,
    recommendedMantraId: recommendedMantra?.id || null,
    dayMantraId: dayMantra?.id || null,
    periodMantraId: periodMantra?.id || null,
    horaMantraId: horaMantra?.id || null,
    dayPlanet,
    periodPlanet,
    horaPlanet,
  };
}
