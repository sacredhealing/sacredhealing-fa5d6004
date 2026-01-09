import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  is_premium: boolean;
  shc_reward: number;
  participant_count?: number;
  user_progress?: number;
  user_joined?: boolean;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active challenges
      const { data: challengesData, error } = await (supabase as any)
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
        // If table doesn't exist or permission issue, return empty array
        if (error.code === '42P01' || error.code === '42501') {
          setChallenges([]);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (!challengesData || challengesData.length === 0) {
        setChallenges([]);
        setIsLoading(false);
        return;
      }

      if (!user) {
        setChallenges(challengesData.map(challenge => ({
          ...challenge,
          participant_count: 0,
          user_progress: 0,
          user_joined: false,
        })));
        setIsLoading(false);
        return;
      }

      // Fetch user's participation and progress
      let participations: Array<{ challenge_id: string; progress: number; completed: boolean }> = [];
      let participantCounts: Array<{ challenge_id: string }> = [];

      try {
        const { data: participationData, error: participationError } = await (supabase as any)
          .from('challenge_participants')
          .select('challenge_id, progress, completed')
          .eq('user_id', user.id);

        if (!participationError && participationData) {
          participations = participationData;
        }
      } catch (err) {
        console.warn('Error fetching user participations:', err);
      }

      // Fetch participant counts
      try {
        const challengeIds = challengesData.map(c => c.id);
        if (challengeIds.length > 0) {
          const { data: countData, error: countError } = await (supabase as any)
            .from('challenge_participants')
            .select('challenge_id')
            .in('challenge_id', challengeIds);

          if (!countError && countData) {
            participantCounts = countData;
          }
        }
      } catch (err) {
        console.warn('Error fetching participant counts:', err);
      }

      const countsMap = new Map<string, number>();
      participantCounts.forEach(p => {
        countsMap.set(p.challenge_id, (countsMap.get(p.challenge_id) || 0) + 1);
      });

      // Combine data
      const challengesWithProgress = challengesData.map(challenge => {
        const participation = participations.find(p => p.challenge_id === challenge.id);
        return {
          ...challenge,
          participant_count: countsMap.get(challenge.id) || 0,
          user_progress: participation?.progress || 0,
          user_joined: !!participation,
        };
      });

      setChallenges(challengesWithProgress);
    } catch (error: any) {
      console.error('Error fetching challenges:', error);
      // Only show toast for actual errors, not missing tables
      if (error?.code !== '42P01' && error?.code !== '42501') {
        toast({
          title: 'Error',
          description: 'Failed to load challenges',
          variant: 'destructive',
        });
      }
      // Set empty array on any error to prevent rendering issues
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to join challenges',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          progress: 0,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You joined the challenge!',
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to join challenge',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    isLoading,
    joinChallenge,
    refetch: fetchChallenges,
  };
};

