import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  shc_reward: number;
  badge_color: string;
  order_index: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  shared: boolean;
  achievement: Achievement;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  icon_name: string;
  shc_reward: number;
  order_index: number;
}

interface UserMilestone {
  id: string;
  milestone_id: string;
  reached_at: string;
  milestone: Milestone;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userMilestones, setUserMilestones] = useState<UserMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const [userStats, setUserStats] = useState<{
    streakDays: number;
    totalSessions: number;
    meditationCount: number;
    referrals: number;
  }>({ streakDays: 0, totalSessions: 0, meditationCount: 0, referrals: 0 });

  const fetchAchievements = useCallback(async () => {
    try {
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (achievementsData) {
        setAchievements(achievementsData);
      }

      const { data: milestonesData } = await supabase
        .from("milestones")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (milestonesData) {
        setMilestones(milestonesData);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  }, []);

  const fetchUserProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data: userAchievementsData } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id);

      if (userAchievementsData) {
        setUserAchievements(userAchievementsData as unknown as UserAchievement[]);
      }

      const { data: userMilestonesData } = await supabase
        .from("user_milestones")
        .select(`
          *,
          milestone:milestones(*)
        `)
        .eq("user_id", user.id);

      if (userMilestonesData) {
        setUserMilestones(userMilestonesData as unknown as UserMilestone[]);
      }

      // Fetch user stats for achievement progress display
      const [profileRes, meditationRes, musicRes, mantraRes] = await Promise.all([
        supabase.from("profiles").select("streak_days, total_referrals").eq("user_id", user.id).single(),
        supabase.from("meditation_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("music_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("mantra_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const streakDays = (profileRes.data as { streak_days?: number; total_referrals?: number } | null)?.streak_days ?? 0;
      const referrals = (profileRes.data as { streak_days?: number; total_referrals?: number } | null)?.total_referrals ?? 0;
      const meditationCount = meditationRes.count ?? 0;
      const musicCount = musicRes.count ?? 0;
      const mantraCount = mantraRes.count ?? 0;
      const totalSessions = meditationCount + musicCount + mantraCount;

      setUserStats({ streakDays, totalSessions, meditationCount, referrals });
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  }, [user]);

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-achievements");
      
      if (error) throw error;

      if (data.newAchievements && data.newAchievements.length > 0) {
        // Show popup for first new achievement
        setNewlyUnlocked(data.newAchievements[0]);
        // Refresh user achievements
        fetchUserProgress();
      }

      if (data.newMilestones && data.newMilestones.length > 0) {
        fetchUserProgress();
      }

      return data;
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }, [user, fetchUserProgress]);

  const dismissNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked(null);
  }, []);

  const getAchievementProgress = useCallback((achievement: Achievement) => {
    const unlocked = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    );
    return {
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlocked_at,
      progressText: (() => {
        if (unlocked) return null;
        const { requirement_type, requirement_value } = achievement;
        let current = 0;
        let unit = "";
        switch (requirement_type) {
          case "streak_days":
            current = userStats.streakDays;
            unit = "days";
            break;
          case "total_sessions":
            current = userStats.totalSessions;
            unit = "sessions";
            break;
          case "meditation_count":
            current = userStats.meditationCount;
            unit = "meditations";
            break;
          case "referrals":
            current = userStats.referrals;
            unit = "referrals";
            break;
          default:
            return null;
        }
        return `${Math.min(current, requirement_value)} / ${requirement_value} ${unit}`;
      })(),
    };
  }, [userAchievements, userStats]);

  const getMilestoneProgress = useCallback((milestone: Milestone) => {
    const reached = userMilestones.find(
      um => um.milestone_id === milestone.id
    );
    return {
      reached: !!reached,
      reachedAt: reached?.reached_at,
    };
  }, [userMilestones]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAchievements();
      if (user) {
        await fetchUserProgress();
      }
      setLoading(false);
    };
    load();
  }, [fetchAchievements, fetchUserProgress, user]);

  return {
    achievements,
    userAchievements,
    milestones,
    userMilestones,
    loading,
    newlyUnlocked,
    checkAchievements,
    dismissNewlyUnlocked,
    getAchievementProgress,
    getMilestoneProgress,
    refetch: fetchUserProgress,
  };
};
