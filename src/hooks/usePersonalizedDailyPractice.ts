import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GoalType } from './useOnboarding';

interface DailyPractice {
  id: string;
  title: string;
  description: string | null;
  type: 'meditation' | 'path' | 'healing' | 'mantra';
  duration?: number;
  shc_reward?: number;
  category?: string;
  url?: string;
}

/**
 * Get personalized daily practice based on user goals
 * Simple logic first - can be enhanced later
 */
function getDailyPracticeRecommendation(
  userGoals: GoalType[],
  availableContent: {
    meditations: any[];
    paths: any[];
    healing: any[];
  }
): DailyPractice | null {
  const { meditations, paths, healing } = availableContent;

  // Priority-based recommendation logic
  if (userGoals.includes('sleep')) {
    // Find sleep-related meditation
    const sleepMeditation = meditations.find(m => 
      m.title?.toLowerCase().includes('sleep') ||
      m.title?.toLowerCase().includes('rest') ||
      m.category?.toLowerCase().includes('sleep')
    );
    if (sleepMeditation) {
      return {
        id: sleepMeditation.id,
        title: sleepMeditation.title || 'Sleep Sanctuary – Deep Rest',
        description: sleepMeditation.description,
        type: 'meditation',
        duration: sleepMeditation.duration_minutes,
        shc_reward: sleepMeditation.shc_reward,
        category: sleepMeditation.category,
      };
    }
  }

  if (userGoals.includes('peace')) {
    // Find peace/calm meditation
    const peaceMeditation = meditations.find(m => 
      m.title?.toLowerCase().includes('peace') ||
      m.title?.toLowerCase().includes('calm') ||
      m.title?.toLowerCase().includes('tranquil') ||
      m.category?.toLowerCase().includes('peace')
    );
    if (peaceMeditation) {
      return {
        id: peaceMeditation.id,
        title: peaceMeditation.title || 'Inner Peace Meditation',
        description: peaceMeditation.description,
        type: 'meditation',
        duration: peaceMeditation.duration_minutes,
        shc_reward: peaceMeditation.shc_reward,
        category: peaceMeditation.category,
      };
    }

    // Or recommend a peace-focused path
    const peacePath = paths.find(p => 
      p.title?.toLowerCase().includes('peace') ||
      p.goal_types?.includes('peace')
    );
    if (peacePath) {
      return {
        id: peacePath.id,
        title: `${peacePath.title} – Day 1`,
        description: peacePath.description,
        type: 'path',
        duration: 10,
        shc_reward: 50,
      };
    }
  }

  if (userGoals.includes('healing')) {
    // Find healing audio
    const healingAudio = healing.find(h => 
      h.title?.toLowerCase().includes('healing') ||
      h.category?.toLowerCase().includes('healing')
    );
    if (healingAudio) {
      return {
        id: healingAudio.id,
        title: healingAudio.title || 'Deep Healing Session',
        description: healingAudio.description,
        type: 'healing',
        duration: healingAudio.duration_seconds ? Math.floor(healingAudio.duration_seconds / 60) : undefined,
        shc_reward: healingAudio.shc_reward,
        category: healingAudio.category,
      };
    }
  }

  if (userGoals.includes('focus')) {
    // Find focus/clarity meditation
    const focusMeditation = meditations.find(m => 
      m.title?.toLowerCase().includes('focus') ||
      m.title?.toLowerCase().includes('clarity') ||
      m.title?.toLowerCase().includes('concentration') ||
      m.category?.toLowerCase().includes('focus')
    );
    if (focusMeditation) {
      return {
        id: focusMeditation.id,
        title: focusMeditation.title || 'Focus & Clarity',
        description: focusMeditation.description,
        type: 'meditation',
        duration: focusMeditation.duration_minutes,
        shc_reward: focusMeditation.shc_reward,
        category: focusMeditation.category,
      };
    }
  }

  if (userGoals.includes('awakening')) {
    // Find awakening/spiritual meditation
    const awakeningMeditation = meditations.find(m => 
      m.title?.toLowerCase().includes('awakening') ||
      m.title?.toLowerCase().includes('spiritual') ||
      m.title?.toLowerCase().includes('consciousness') ||
      m.category?.toLowerCase().includes('awakening')
    );
    if (awakeningMeditation) {
      return {
        id: awakeningMeditation.id,
        title: awakeningMeditation.title || 'Spiritual Awakening',
        description: awakeningMeditation.description,
        type: 'meditation',
        duration: awakeningMeditation.duration_minutes,
        shc_reward: awakeningMeditation.shc_reward,
        category: awakeningMeditation.category,
      };
    }
  }

  // Fallback: Morning Grounding Meditation or most popular
  const fallback = meditations.find(m => 
    m.title?.toLowerCase().includes('morning') ||
    m.title?.toLowerCase().includes('grounding')
  ) || meditations[0];

  if (fallback) {
    return {
      id: fallback.id,
      title: fallback.title || 'Morning Grounding Meditation',
      description: fallback.description,
      type: 'meditation',
      duration: fallback.duration_minutes,
      shc_reward: fallback.shc_reward,
      category: fallback.category,
    };
  }

  return null;
}

export function usePersonalizedDailyPractice() {
  const { user } = useAuth();
  const [practice, setPractice] = useState<DailyPractice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userGoals, setUserGoals] = useState<GoalType[]>([]);

  useEffect(() => {
    const fetchPersonalizedPractice = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch user goals
        const { data: goalsData } = await supabase
          .from('user_spiritual_goals')
          .select('goal_type')
          .eq('user_id', user.id)
          .order('priority', { ascending: true });

        const goals = (goalsData?.map(g => g.goal_type) || []) as GoalType[];
        setUserGoals(goals);

        // Fetch available content
        const [meditationsResult, pathsResult, healingResult] = await Promise.all([
          supabase
            .from('meditations')
            .select('id, title, description, duration_minutes, shc_reward, category')
            .eq('is_active', true)
            .limit(50),
          supabase
            .from('spiritual_paths')
            .select('id, title, description, goal_types')
            .eq('is_active', true)
            .limit(20),
          supabase
            .from('healing_audio')
            .select('id, title, description, duration_seconds, shc_reward, category')
            .eq('is_active', true)
            .limit(20),
        ]);

        const availableContent = {
          meditations: meditationsResult.data || [],
          paths: pathsResult.data || [],
          healing: healingResult.data || [],
        };

        // Get personalized recommendation
        const recommendation = getDailyPracticeRecommendation(goals, availableContent);
        setPractice(recommendation);
      } catch (error) {
        console.error('Error fetching personalized practice:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalizedPractice();
  }, [user]);

  return { practice, isLoading, userGoals };
}

