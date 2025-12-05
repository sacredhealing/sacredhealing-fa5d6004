import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Meditation {
  id: string;
  title: string;
  audio_url: string;
  category: string;
  duration_minutes: number;
  description: string | null;
  cover_image_url: string | null;
  shc_reward: number;
  is_premium: boolean;
}

function getSwedenDateSeed(): number {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const swedenOffset = 60 * 60 * 1000; // +1 hour CET
  const swedenTime = new Date(utc.getTime() + swedenOffset);

  // Before 07:00, use previous day's seed
  if (swedenTime.getHours() < 7) {
    swedenTime.setDate(swedenTime.getDate() - 1);
  }

  // Return day count for consistent daily selection
  return Math.floor(swedenTime.getTime() / (1000 * 60 * 60 * 24));
}

export function useDailyMeditation() {
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDailyMeditation = async () => {
      setIsLoading(true);
      try {
        // Fetch all active meditations
        const { data: meditations, error } = await supabase
          .from('meditations')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching meditations:', error);
          return;
        }

        if (meditations && meditations.length > 0) {
          const daySeed = getSwedenDateSeed();
          const index = daySeed % meditations.length;
          setMeditation(meditations[index]);
        }
      } catch (err) {
        console.error('Error in useDailyMeditation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyMeditation();

    // Check every 30 minutes to catch 07:00 change
    const interval = setInterval(fetchDailyMeditation, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { meditation, isLoading };
}
