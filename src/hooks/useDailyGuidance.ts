import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getAdaptiveGuidance } from '@/lib/sacredGuidanceMessages';

export type TimeOfDay = 'morning' | 'midday' | 'evening';
export type SessionType = 'morning_ritual' | 'breathing_reset' | 'evening_reflection' | 'journal' | 'meditation' | 'path_day';

export interface DailyGuidance {
  message: string;
  session_type: SessionType;
  session_id: string; // Route path, e.g. /ritual, /breathing, /meditations
  button_label?: string;
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  return 'evening';
}

function getLastCompletedActivity(
  activity: { morning_completed?: boolean; midday_completed?: boolean; evening_completed?: boolean } | null
): 'morning' | 'midday' | 'evening' | null {
  if (!activity) return null;
  if (activity.evening_completed) return 'evening';
  if (activity.midday_completed) return 'midday';
  if (activity.morning_completed) return 'morning';
  return null;
}

/**
 * getDailyGuidance - Returns personalized guidance based on context.
 * Context: time of day, user intention, path progress, last activity, streak.
 */
export function getDailyGuidance(params: {
  timeOfDay: TimeOfDay;
  lastCompleted: 'morning' | 'midday' | 'evening' | null;
  streakDays: number;
  primaryGoal?: string;
  activePathSlug?: string;
  hasActivePath: boolean;
}): DailyGuidance {
  const { timeOfDay, lastCompleted, streakDays, primaryGoal, activePathSlug, hasActivePath } = params;

  // Morning (5–12), no activity yet – active path takes priority
  if (timeOfDay === 'morning' && !lastCompleted) {
    if (hasActivePath && activePathSlug) {
      return {
        message: "Good morning. Continue your path—today's practice awaits.",
        session_type: 'path_day',
        session_id: `/paths/${activePathSlug}`,
        button_label: 'Continue Path',
      };
    }
    return {
      message: "Good morning. Begin gently and arrive into your day.",
      session_type: 'morning_ritual',
      session_id: '/ritual',
      button_label: 'Morning Ritual',
    };
  }

  // Morning, after completing morning
  if (timeOfDay === 'morning' && lastCompleted === 'morning') {
    return {
      message: "Your mind is clearer. Stabilize your breath for the day ahead.",
      session_type: 'breathing_reset',
      session_id: '/breathing?quick=true',
      button_label: '2-Min Breathing Reset',
    };
  }

  // Midday (12–17), no activity yet
  if (timeOfDay === 'midday' && !lastCompleted) {
    return {
      message: "Find a moment of pause. A short breath practice can recenter you.",
      session_type: 'breathing_reset',
      session_id: '/breathing',
      button_label: 'Breathing Practice',
    };
  }

  // Midday, morning done
  if (timeOfDay === 'midday' && lastCompleted === 'morning') {
    return {
      message: "Your mind is clearer. Stabilize your breath for the day ahead.",
      session_type: 'breathing_reset',
      session_id: '/breathing?quick=true',
      button_label: '2-Min Breathing Reset',
    };
  }

  // Midday, morning + midday done
  if (timeOfDay === 'midday' && lastCompleted === 'midday') {
    return {
      message: "Well done. A gentle meditation can deepen your afternoon focus.",
      session_type: 'meditation',
      session_id: '/meditations',
      button_label: 'Meditate',
    };
  }

  // Evening (17–5)
  if (timeOfDay === 'evening') {
    if (lastCompleted === 'evening') {
      return {
        message: streakDays > 0
          ? `Day complete. ${streakDays} day${streakDays === 1 ? '' : 's'} streak. Rest well.`
          : "Day complete. Rest well and recharge.",
        session_type: 'journal',
        session_id: '/journal',
        button_label: 'Journal',
      };
    }
    return {
      message: "Let the day soften and release what you carried.",
      session_type: 'evening_reflection',
      session_id: '/ritual',
      button_label: 'Evening Reflection',
    };
  }

  // Default
  return {
    message: "Take a moment for your practice.",
    session_type: 'meditation',
    session_id: '/meditations',
    button_label: 'Start Journey',
  };
}

export function useDailyGuidance() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const today = new Date().toISOString().split('T')[0];

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['user-daily-activities', user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle();
      return data as { morning_completed?: boolean; midday_completed?: boolean; evening_completed?: boolean } | null;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['user-spiritual-goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_spiritual_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority');
      return (data || []) as { goal_type: string }[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pathProgress, isLoading: pathLoading } = useQuery({
    queryKey: ['user-active-path', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: progress } = await supabase
        .from('user_path_progress')
        .select('path_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (!progress?.path_id) return null;
      const { data: path } = await supabase
        .from('spiritual_paths')
        .select('slug')
        .eq('id', progress.path_id)
        .single();
      return path ? { path_id: progress.path_id, slug: path.slug } : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = activityLoading || goalsLoading || pathLoading;

  const { userState } = useUserDailyState();
  const timeOfDay = getTimeOfDay();
  const lastCompleted = getLastCompletedActivity(activity);
  const hasCompletedAllThree = !!(
    activity?.morning_completed &&
    activity?.midday_completed &&
    activity?.evening_completed
  );
  const streakDays = profile?.streak_days ?? 0;
  const primaryGoal = goals?.[0]?.goal_type;
  const activePathSlug = pathProgress?.slug;
  const hasActivePath = !!pathProgress;

  const defaultGuidance = getDailyGuidance({
    timeOfDay,
    lastCompleted,
    streakDays,
    primaryGoal,
    activePathSlug,
    hasActivePath,
  });

  // Adaptive CTA: busy/heavy/engaged override default guidance
  const adaptiveCta = !lastCompleted && userState !== 'calm' ? getAdaptiveGuidance(userState) : null;
  const guidance = adaptiveCta
    ? {
        message: adaptiveCta.message,
        session_type: adaptiveCta.session_type as DailyGuidance['session_type'],
        session_id: adaptiveCta.session_id,
        button_label: adaptiveCta.button_label,
      }
    : defaultGuidance;

  /**
   * Which daily-activity slot to mark complete + SHC when the user finishes the current guidance session.
   * Must use today's completion flags — the old logic used `!lastCompleted` only, which is false as soon
   * as *any* phase is done (e.g. midday breath after morning) and hid the Soma gift + skipped DB updates.
   */
  const completeSlot: 'morning' | 'midday' | 'evening' | null = (() => {
    const m = !!activity?.morning_completed;
    const d = !!activity?.midday_completed;
    const e = !!activity?.evening_completed;
    const st = guidance.session_type;

    if (st === 'morning_ritual') return m ? null : 'morning';
    if (st === 'evening_reflection') return e ? null : 'evening';
    if (st === 'path_day') {
      if (timeOfDay === 'morning' && !m) return 'morning';
      return null;
    }
    if (st === 'journal') return null;

    if (st === 'breathing_reset' || st === 'meditation') {
      if (timeOfDay === 'morning' && !m) return 'morning';
      if (timeOfDay === 'midday' && !d) return 'midday';
      if (timeOfDay === 'evening' && !e) return 'evening';
      return null;
    }

    return null;
  })();

  return {
    guidance,
    userState,
    isLoading,
    timeOfDay,
    lastCompleted,
    hasCompletedAllThree,
    streakDays,
    completeSlot,
  };
}
