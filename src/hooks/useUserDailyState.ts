/**
 * Adaptive Suggestion Engine - User Daily State
 * Detects inner state from behavior signals (no AI).
 * Drives personalized hero + CTA.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserDailyState = 'calm' | 'busy' | 'heavy' | 'engaged';

function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function useUserDailyState() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: stateData, isLoading } = useQuery({
    queryKey: ['user-daily-state', user?.id],
    queryFn: async (): Promise<{
      state: UserDailyState;
      last7DaysSessions: number;
      avgSessionLengthMinutes: number;
      daysMissed: number;
      todaySessions: number;
    }> => {
      if (!user) {
        return { state: 'calm', last7DaysSessions: 0, avgSessionLengthMinutes: 10, daysMissed: 0, todaySessions: 0 };
      }

      const last7 = getLast7Days();

      // Fetch meditation completions (last 7 days)
      const { data: meditationCompletions } = await supabase
        .from('meditation_completions')
        .select('completed_at, duration_listened')
        .eq('user_id', user.id)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch mantra completions (last 7 days)
      const { data: mantraCompletions } = await supabase
        .from('mantra_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch user_daily_activities (last 7 days)
      const { data: dailyActivities } = await supabase
        .from('user_daily_activities')
        .select('activity_date, morning_completed, midday_completed, evening_completed')
        .eq('user_id', user.id)
        .in('activity_date', last7);

      // Days with any activity
      const daysWithActivity = new Set<string>();
      (meditationCompletions || []).forEach((c) => {
        daysWithActivity.add(c.completed_at.split('T')[0]);
      });
      (mantraCompletions || []).forEach((c) => {
        daysWithActivity.add(c.completed_at.split('T')[0]);
      });
      (dailyActivities || []).forEach((a) => {
        if (a.morning_completed || a.midday_completed || a.evening_completed) {
          daysWithActivity.add(a.activity_date);
        }
      });

      const last7DaysSessions = (meditationCompletions?.length || 0) + (mantraCompletions?.length || 0);
      const daysMissed = 7 - daysWithActivity.size;

      const totalDurationSeconds = (meditationCompletions || []).reduce(
        (sum, c) => sum + (c.duration_listened || 0),
        0
      );
      const meditationCount = meditationCompletions?.length || 0;
      const avgSessionLengthMinutes =
        meditationCount > 0 ? totalDurationSeconds / meditationCount / 60 : 10;

      const todaySessions =
        (meditationCompletions || []).filter((c) => c.completed_at.startsWith(today)).length +
        (mantraCompletions || []).filter((c) => c.completed_at.startsWith(today)).length;

      // State rules (priority order)
      let state: UserDailyState;
      if (daysMissed >= 2) {
        state = 'heavy';
      } else if (meditationCount > 0 && avgSessionLengthMinutes < 2) {
        state = 'busy';
      } else if (last7DaysSessions >= 10) {
        state = 'engaged';
      } else {
        state = 'calm';
      }

      return {
        state,
        last7DaysSessions,
        avgSessionLengthMinutes,
        daysMissed,
        todaySessions,
      };
    },
    enabled: !!user,
  });

  return {
    userState: stateData?.state ?? 'calm',
    last7DaysSessions: stateData?.last7DaysSessions ?? 0,
    avgSessionLengthMinutes: stateData?.avgSessionLengthMinutes ?? 10,
    daysMissed: stateData?.daysMissed ?? 0,
    todaySessions: stateData?.todaySessions ?? 0,
    isLoading,
  };
}
