import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FlameData {
  streakDays: number;
  lastActivityDate: string | null;
  totalSessions: number;
}

interface FlameState {
  brightness: number; // 0.2 to 1.0
  scale: number; // 0.8 to 1.2
  isLoading: boolean;
  streakDays: number;
}

const MIN_BRIGHTNESS = 0.2;
const MAX_BRIGHTNESS = 1.0;
const DIM_RATE = 0.2; // 20% dimming per missed day
const BASE_SCALE = 0.85;
const MAX_SCALE = 1.15;

export const useSacredFlame = (): FlameState => {
  const { user } = useAuth();
  const [flameData, setFlameData] = useState<FlameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlameData = async () => {
      if (!user) {
        setFlameData(null);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch profile data with last_activity_date
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('streak_days, last_activity_date')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        
        // Type assertion for last_activity_date which may not be in generated types yet
        const profileData = profile as { streak_days: number; last_activity_date: string | null } | null;

        // Count total completed sessions across all types
        const [meditationCount, mantraCount, musicCount] = await Promise.all([
          supabase
            .from('meditation_completions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('mantra_completions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('music_completions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        const totalSessions = 
          (meditationCount.count || 0) + 
          (mantraCount.count || 0) + 
          (musicCount.count || 0);

        setFlameData({
          streakDays: profileData?.streak_days || 0,
          lastActivityDate: profileData?.last_activity_date || null,
          totalSessions,
        });
      } catch (error) {
        console.error('Error fetching flame data:', error);
        setFlameData({ streakDays: 0, lastActivityDate: null, totalSessions: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlameData();
  }, [user]);

  const flameState = useMemo(() => {
    if (!flameData) {
      return { brightness: MIN_BRIGHTNESS, scale: BASE_SCALE, isLoading, streakDays: 0 };
    }

    const { streakDays, lastActivityDate, totalSessions } = flameData;

    // Calculate days since last activity
    let daysSinceActivity = 0;
    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);
      daysSinceActivity = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // No activity recorded yet - start dim
      daysSinceActivity = 7; // Start at minimum brightness
    }

    // Calculate brightness: starts at max, dims by 20% per missed day
    // Active today = full brightness, 1 day missed = 80%, 2 days = 60%, etc.
    let brightness = MAX_BRIGHTNESS - (daysSinceActivity * DIM_RATE);
    brightness = Math.max(MIN_BRIGHTNESS, Math.min(MAX_BRIGHTNESS, brightness));

    // Calculate scale based on total sessions completed (grows with practice)
    // Every 10 sessions adds a small amount of scale, capped at MAX_SCALE
    const sessionBonus = Math.min(totalSessions / 50, 1) * (MAX_SCALE - BASE_SCALE);
    const scale = BASE_SCALE + sessionBonus;

    return { brightness, scale, isLoading, streakDays };
  }, [flameData, isLoading]);

  return flameState;
};
