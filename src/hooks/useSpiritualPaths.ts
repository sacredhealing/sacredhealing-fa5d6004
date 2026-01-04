import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { toast } from 'sonner';

export interface SpiritualPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  duration_days: number;
  difficulty: string;
  goal_types: string[];
  shc_reward_total: number;
  is_active: boolean;
  order_index: number;
}

export interface PathDay {
  id: string;
  path_id: string;
  day_number: number;
  title: string;
  description: string | null;
  morning_meditation_id: string | null;
  evening_meditation_id: string | null;
  mantra_id: string | null;
  breathing_pattern_id: string | null;
  journal_prompt: string | null;
  affirmation: string | null;
  mantra_text: string | null;
  breathing_description: string | null;
  shc_reward: number;
}

export interface UserPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
  total_shc_earned: number;
  is_active: boolean;
}

export const useSpiritualPaths = () => {
  const { user } = useAuth();
  const { earnSHC } = useSHC();
  const queryClient = useQueryClient();

  const pathsQuery = useQuery({
    queryKey: ['spiritual-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spiritual_paths')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return data as SpiritualPath[];
    },
  });

  const userProgressQuery = useQuery({
    queryKey: ['user-path-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_path_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserPathProgress[];
    },
    enabled: !!user,
  });

  const getPathBySlug = async (slug: string): Promise<SpiritualPath | null> => {
    const { data, error } = await supabase
      .from('spiritual_paths')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) throw error;
    return data as SpiritualPath | null;
  };

  const getPathDays = async (pathId: string): Promise<PathDay[]> => {
    const { data, error } = await supabase
      .from('spiritual_path_days')
      .select('*')
      .eq('path_id', pathId)
      .order('day_number');
    
    if (error) throw error;
    return data as PathDay[];
  };

  const startPath = useMutation({
    mutationFn: async (pathId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_path_progress')
        .insert({
          user_id: user.id,
          path_id: pathId,
          current_day: 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-path-progress'] });
      toast.success('Your spiritual path has begun! 🌟');
    },
    onError: (error) => {
      console.error('Error starting path:', error);
      toast.error('Failed to start path');
    },
  });

  const completeDay = useMutation({
    mutationFn: async ({ progressId, dayReward }: { progressId: string; dayReward: number }) => {
      if (!user) throw new Error('Must be logged in');

      // Get current progress
      const { data: progress, error: fetchError } = await supabase
        .from('user_path_progress')
        .select('*, spiritual_paths(*)')
        .eq('id', progressId)
        .single();

      if (fetchError) throw fetchError;

      const path = progress.spiritual_paths;
      const isLastDay = progress.current_day >= (path as any).duration_days;

      // Update progress
      const { error: updateError } = await supabase
        .from('user_path_progress')
        .update({
          current_day: isLastDay ? progress.current_day : progress.current_day + 1,
          completed_at: isLastDay ? new Date().toISOString() : null,
          last_activity_at: new Date().toISOString(),
          total_shc_earned: progress.total_shc_earned + dayReward,
          is_active: !isLastDay,
        })
        .eq('id', progressId);

      if (updateError) throw updateError;

      // Award SHC
      await earnSHC(dayReward, `Completed day ${progress.current_day} of ${path.title}`);

      // Award bonus for path completion
      if (isLastDay) {
        await earnSHC(100, `Completed ${path.title} - Bonus reward!`);
      }

      return { isLastDay, dayReward };
    },
    onSuccess: ({ isLastDay, dayReward }) => {
      queryClient.invalidateQueries({ queryKey: ['user-path-progress'] });
      if (isLastDay) {
        toast.success(`🎉 Path completed! +${dayReward + 100} SHC earned!`);
      } else {
        toast.success(`Day completed! +${dayReward} SHC earned`);
      }
    },
    onError: (error) => {
      console.error('Error completing day:', error);
      toast.error('Failed to complete day');
    },
  });

  const getActiveProgress = () => {
    return userProgressQuery.data?.find(p => p.is_active);
  };

  const getProgressForPath = (pathId: string) => {
    return userProgressQuery.data?.find(p => p.path_id === pathId);
  };

  return {
    paths: pathsQuery.data || [],
    isLoading: pathsQuery.isLoading,
    userProgress: userProgressQuery.data || [],
    getPathBySlug,
    getPathDays,
    startPath,
    completeDay,
    getActiveProgress,
    getProgressForPath,
  };
};
