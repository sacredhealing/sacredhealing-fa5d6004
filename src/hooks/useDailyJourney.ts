import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { toast } from 'sonner';

export interface DailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  morning_completed: boolean;
  morning_completed_at: string | null;
  morning_meditation_id: string | null;
  midday_completed: boolean;
  midday_completed_at: string | null;
  evening_completed: boolean;
  evening_completed_at: string | null;
  evening_meditation_id: string | null;
  mood_morning: number | null;
  mood_evening: number | null;
  shc_earned: number;
}

export interface JourneyData {
  morning: {
    completed: boolean;
    meditation: any | null;
    shcReward: number;
  };
  midday: {
    completed: boolean;
    exercise: string;
    shcReward: number;
  };
  evening: {
    completed: boolean;
    meditation: any | null;
    journalPrompt: string;
    shcReward: number;
  };
  totalProgress: number;
  activePath: any | null;
}

export const useDailyJourney = () => {
  const { user } = useAuth();
  const { earnSHC } = useSHC();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const todayActivityQuery = useQuery({
    queryKey: ['daily-activity', user?.id, today],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as DailyActivity | null;
    },
    enabled: !!user,
  });

  const goalsQuery = useQuery({
    queryKey: ['user-goals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_spiritual_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createOrUpdateActivity = async (updates: Partial<DailyActivity>) => {
    if (!user) throw new Error('Must be logged in');

    const existingActivity = todayActivityQuery.data;

    if (existingActivity) {
      const { error } = await supabase
        .from('user_daily_activities')
        .update(updates)
        .eq('id', existingActivity.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_daily_activities')
        .insert({
          user_id: user.id,
          activity_date: today,
          ...updates,
        });
      if (error) throw error;
    }
  };

  const completeMorning = useMutation({
    mutationFn: async (meditationId?: string) => {
      await createOrUpdateActivity({
        morning_completed: true,
        morning_completed_at: new Date().toISOString(),
        morning_meditation_id: meditationId || null,
        shc_earned: (todayActivityQuery.data?.shc_earned || 0) + 15,
      });
      await earnSHC(15, 'Morning practice completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
      queryClient.invalidateQueries({ queryKey: ['daily-guidance-activity'] });
      toast.success('Morning practice complete! +15 SHC 🌅');
    },
  });

  const completeMidday = useMutation({
    mutationFn: async () => {
      await createOrUpdateActivity({
        midday_completed: true,
        midday_completed_at: new Date().toISOString(),
        shc_earned: (todayActivityQuery.data?.shc_earned || 0) + 10,
      });
      await earnSHC(10, 'Midday mindfulness completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
      queryClient.invalidateQueries({ queryKey: ['daily-guidance-activity'] });
      toast.success('Midday mindfulness complete! +10 SHC ☀️');
    },
  });

  const completeEvening = useMutation({
    mutationFn: async ({ meditationId, mood }: { meditationId?: string; mood?: number }) => {
      await createOrUpdateActivity({
        evening_completed: true,
        evening_completed_at: new Date().toISOString(),
        evening_meditation_id: meditationId || null,
        mood_evening: mood || null,
        shc_earned: (todayActivityQuery.data?.shc_earned || 0) + 20,
      });
      await earnSHC(20, 'Evening reset completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
      queryClient.invalidateQueries({ queryKey: ['daily-guidance-activity'] });
      toast.success('Evening reset complete! +20 SHC 🌙');
    },
  });

  const setMoodMorning = useMutation({
    mutationFn: async (mood: number) => {
      await createOrUpdateActivity({ mood_morning: mood });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
    },
  });

  const getJourneyData = (): JourneyData => {
    const activity = todayActivityQuery.data;
    const morningDone = activity?.morning_completed || false;
    const middayDone = activity?.midday_completed || false;
    const eveningDone = activity?.evening_completed || false;

    const completedCount = [morningDone, middayDone, eveningDone].filter(Boolean).length;
    const totalProgress = Math.round((completedCount / 3) * 100);

    return {
      morning: {
        completed: morningDone,
        meditation: null, // Would be fetched from meditations table
        shcReward: 15,
      },
      midday: {
        completed: middayDone,
        exercise: 'Deep breathing & mindful pause',
        shcReward: 10,
      },
      evening: {
        completed: eveningDone,
        meditation: null,
        journalPrompt: 'What are you grateful for today?',
        shcReward: 20,
      },
      totalProgress,
      activePath: null,
    };
  };

  return {
    todayActivity: todayActivityQuery.data,
    userGoals: goalsQuery.data || [],
    isLoading: todayActivityQuery.isLoading,
    completeMorning,
    completeMidday,
    completeEvening,
    setMoodMorning,
    getJourneyData,
  };
};
