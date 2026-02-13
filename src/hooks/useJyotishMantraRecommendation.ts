import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile } from '@/lib/vedicTypes';

export interface JyotishMantraRecommendation {
  planet: string | null;
  dasha: string | null;
  message: string;
  duration: string;
  repetitions: number;
  bestTime: string;
  recommendedMantraId: string | null;
}

/**
 * Hook to get Jyotish-based mantra recommendation
 * Returns null if user has no Jyotish data
 */
export function useJyotishMantraRecommendation(mantras: Array<{ id: string; title: string }>): JyotishMantraRecommendation | null {
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

  // Extract current planet from dasha or hora
  const currentPlanet = reading.personalCompass?.currentDasha?.period?.split(' ')[0]?.toLowerCase() ||
                        reading.horaWatch?.currentHora?.planet?.toLowerCase() ||
                        null;

  if (!currentPlanet) {
    return null;
  }

  // Map planet to mantra recommendation
  const planetMapping: Record<string, { mantraKeywords: string[]; message: string; bestTime: string }> = {
    saturn: {
      mantraKeywords: ['shani', 'shreem', 'om', 'shanti'],
      message: 'You are currently in a Saturn influence according to your Vedic chart. This mantra is recommended to support balance and stability during this period.',
      bestTime: 'morning',
    },
    moon: {
      mantraKeywords: ['om', 'shanti', 'peace', 'calm', 'chandra'],
      message: 'You are currently in a Moon influence according to your Vedic chart. This mantra is recommended to support emotional balance and inner peace during this period.',
      bestTime: 'evening',
    },
    rahu: {
      mantraKeywords: ['om', 'protection', 'grounding', 'shanti'],
      message: 'You are currently in a Rahu influence according to your Vedic chart. This mantra is recommended to support grounding and protection during this period.',
      bestTime: 'morning',
    },
    ketu: {
      mantraKeywords: ['om', 'spiritual', 'liberation', 'shanti'],
      message: 'You are currently in a Ketu influence according to your Vedic chart. This mantra is recommended to support spiritual growth and liberation during this period.',
      bestTime: 'evening',
    },
    sun: {
      mantraKeywords: ['om', 'surya', 'vitality', 'strength'],
      message: 'You are currently in a Sun influence according to your Vedic chart. This mantra is recommended to support vitality and inner strength during this period.',
      bestTime: 'morning',
    },
    mars: {
      mantraKeywords: ['om', 'mangal', 'courage', 'energy'],
      message: 'You are currently in a Mars influence according to your Vedic chart. This mantra is recommended to support courage and balanced energy during this period.',
      bestTime: 'morning',
    },
    mercury: {
      mantraKeywords: ['om', 'buddha', 'wisdom', 'communication'],
      message: 'You are currently in a Mercury influence according to your Vedic chart. This mantra is recommended to support wisdom and clear communication during this period.',
      bestTime: 'morning',
    },
    jupiter: {
      mantraKeywords: ['om', 'guru', 'wisdom', 'blessings'],
      message: 'You are currently in a Jupiter influence according to your Vedic chart. This mantra is recommended to support wisdom and spiritual growth during this period.',
      bestTime: 'morning',
    },
    venus: {
      mantraKeywords: ['om', 'shukra', 'love', 'harmony'],
      message: 'You are currently in a Venus influence according to your Vedic chart. This mantra is recommended to support love and harmony during this period.',
      bestTime: 'evening',
    },
  };

  const planetInfo = planetMapping[currentPlanet];
  if (!planetInfo) {
    return null;
  }

  // Find matching mantra by keywords in title
  const recommendedMantra = mantras.find(m => {
    const titleLower = m.title.toLowerCase();
    return planetInfo.mantraKeywords.some(keyword => titleLower.includes(keyword));
  });

  return {
    planet: currentPlanet,
    dasha: reading.personalCompass?.currentDasha?.period || null,
    message: planetInfo.message,
    duration: '40 days',
    repetitions: 108,
    bestTime: planetInfo.bestTime,
    recommendedMantraId: recommendedMantra?.id || null,
  };
}
