import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile } from '@/lib/vedicTypes';
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

/**
 * Hook to get Jyotish-based mantra recommendation
 * Enhanced with Vara (Day), Dasha (Period), and Hora (Hour) logic
 * Returns null if user has no Jyotish data
 */
export function useJyotishMantraRecommendation(
  mantras: Array<{ id: string; title: string; planet_type?: string | null }>
): JyotishMantraRecommendation | null {
  const { user } = useAuth();
  const [hasBirthDetails, setHasBirthDetails] = useState(false);
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const { reading, generateReading } = useAIVedicReading();

  // Fetch birth details
  useEffect(() => {
    const fetchBirthDetails = async () => {
      if (!user) {
        setHasBirthDetails(false);
        setBirthDetails(null);
        return;
      }

      try {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('birth_name, birth_date, birth_time, birth_place')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
          setHasBirthDetails(true);
          setBirthDetails(data);
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

  // Generate reading if birth details exist
  useEffect(() => {
    if (hasBirthDetails && birthDetails && !reading) {
      const userProfile: UserProfile = {
        name: birthDetails.birth_name,
        birthDate: birthDetails.birth_date,
        birthTime: birthDetails.birth_time,
        birthPlace: birthDetails.birth_place,
        plan: 'compass', // Default to compass tier for reading generation
      };
      generateReading(userProfile);
    }
  }, [hasBirthDetails, birthDetails, reading, generateReading]);

  // Generate recommendation from reading
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
  
  // 3. HORA LOGIC: Current planetary hour (simplified - uses default sunrise)
  const horaPlanet = getPlanetOfHour();

  // Primary recommendation: Use period planet if available, otherwise day planet
  const primaryPlanet = periodPlanet || dayPlanet;

  if (!primaryPlanet) {
    return null;
  }

  // Map planet to recommendation message and best time
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

  // Find mantras for each planetary influence
  const dayMantra = mantras.find(m => mantraMatchesPlanet(m, dayPlanet));
  const periodMantra = periodPlanet ? mantras.find(m => mantraMatchesPlanet(m, periodPlanet)) : null;
  const horaMantra = horaPlanet ? mantras.find(m => mantraMatchesPlanet(m, horaPlanet)) : null;

  // Primary recommendation: Prefer period mantra, then day mantra, then hora mantra
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
    // Enhanced fields
    dayMantraId: dayMantra?.id || null,
    periodMantraId: periodMantra?.id || null,
    horaMantraId: horaMantra?.id || null,
    dayPlanet,
    periodPlanet,
    horaPlanet,
  };
}
