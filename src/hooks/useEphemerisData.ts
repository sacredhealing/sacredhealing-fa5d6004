import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface EphemerisData {
  moon_nakshatra: string;
  moon_longitude: number;
  nakshatra_progress: number;
  dasha_data: any;
  ephemeris_confirmed: boolean;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
}

/**
 * Fetches confirmed Swiss Ephemeris data from jyotish_profiles.
 * If birth data exists but no ephemeris yet, calls the edge function to calculate.
 */
export function useEphemerisData() {
  const { user } = useAuth();
  const [ephemeris, setEphemeris] = useState<EphemerisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);

      try {
        // Check jyotish_profiles for confirmed data
        const { data } = await (supabase as any)
          .from('jyotish_profiles')
          .select('moon_nakshatra, moon_longitude, nakshatra_progress, dasha_data, ephemeris_confirmed, birth_date, birth_time, birth_place')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (data?.ephemeris_confirmed && data?.moon_nakshatra) {
          setEphemeris(data);
          setLoading(false);
          return;
        }

        // Check profiles for birth data to trigger calculation
        const birthSource = data?.birth_date ? data : null;
        let birthData = birthSource;

        if (!birthData) {
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('birth_date, birth_time, birth_place')
            .eq('user_id', user.id)
            .maybeSingle();

          if (cancelled) return;
          if (profile?.birth_date) birthData = profile;
        }

        if (!birthData?.birth_date) {
          setLoading(false);
          return;
        }

        // Call edge function to calculate
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/jyotish-ephemeris`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            userId: user.id,
            birthDate: birthData.birth_date,
            birthTime: birthData.birth_time,
            birthPlace: birthData.birth_place,
            timezone: '+00:00',
          }),
        });

        if (cancelled) return;

        const result = await res.json();
        if (result.moonNakshatra) {
          setEphemeris({
            moon_nakshatra: result.moonNakshatra,
            moon_longitude: result.moonLongitude ?? 0,
            nakshatra_progress: result.nakshatraProgress ?? 0.5,
            dasha_data: result.dashaData,
            ephemeris_confirmed: result.source === 'ephemeris_fresh' || result.source === 'cache',
            birth_date: birthData.birth_date,
            birth_time: birthData.birth_time,
            birth_place: birthData.birth_place,
          });
        }
      } catch (e) {
        console.error('Ephemeris fetch failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { ephemeris, loading };
}
