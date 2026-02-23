import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

async function fetchAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("order_index");
  if (error) throw error;
  return data ?? [];
}

async function fetchMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("is_active", true)
    .order("order_index");
  if (error) throw error;
  return data ?? [];
}

async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select(`*, achievement:achievements(*)`)
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as UserAchievement[];
}

async function fetchUserMilestones(userId: string): Promise<UserMilestone[]> {
  const { data, error } = await supabase
    .from("user_milestones")
    .select(`*, milestone:milestones(*)`)
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as UserMilestone[];
}

async function fetchUserStats(userId: string): Promise<{
  streakDays: number;
  totalSessions: number;
  meditationCount: number;
  referrals: number;
}> {
  const [profileRes, meditationRes, musicRes, mantraRes] = await Promise.all([
    supabase.from("profiles").select("streak_days, total_referrals").eq("user_id", userId).single(),
    supabase.from("meditation_completions").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("music_completions").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("mantra_completions").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const profile = profileRes.data as { streak_days?: number; total_referrals?: number } | null;
  const streakDays = profile?.streak_days ?? 0;
  const referrals = profile?.total_referrals ?? 0;
  const meditationCount = meditationRes.count ?? 0;
  const musicCount = musicRes.count ?? 0;
  const mantraCount = mantraRes.count ?? 0;
  const totalSessions = meditationCount + musicCount + mantraCount;

  return { streakDays, totalSessions, meditationCount, referrals };
}

export const useAchievements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
  });
  const milestonesQuery = useQuery({
    queryKey: ["milestones"],
    queryFn: fetchMilestones,
  });
  const userAchievementsQuery = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: () => fetchUserAchievements(user!.id),
    enabled: !!user?.id,
  });
  const userMilestonesQuery = useQuery({
    queryKey: ["user-milestones", user?.id],
    queryFn: () => fetchUserMilestones(user!.id),
    enabled: !!user?.id,
  });
  const userStatsQuery = useQuery({
    queryKey: ["user-achievement-stats", user?.id],
    queryFn: () => fetchUserStats(user!.id),
    enabled: !!user?.id,
  });

  const achievements = achievementsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const userAchievements = userAchievementsQuery.data ?? [];
  const userMilestones = userMilestonesQuery.data ?? [];
  const userStats = userStatsQuery.data ?? {
    streakDays: 0,
    totalSessions: 0,
    meditationCount: 0,
    referrals: 0,
  };

  const loading =
    achievementsQuery.isLoading ||
    milestonesQuery.isLoading ||
    (!!user && (userAchievementsQuery.isLoading || userMilestonesQuery.isLoading || userStatsQuery.isLoading));

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-achievements");
      if (error) throw error;

      if (data?.newAchievements?.length > 0) {
        setNewlyUnlocked(data.newAchievements[0]);
        queryClient.invalidateQueries({ queryKey: ["user-achievements", user.id] });
        queryClient.invalidateQueries({ queryKey: ["user-milestones", user.id] });
        queryClient.invalidateQueries({ queryKey: ["user-achievement-stats", user.id] });
      }
      if (data?.newMilestones?.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-milestones", user.id] });
        queryClient.invalidateQueries({ queryKey: ["user-achievement-stats", user.id] });
      }
      return data;
    } catch (err) {
      console.error("Error checking achievements:", err);
    }
  }, [user, queryClient]);

  const dismissNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), []);

  const getAchievementProgress = useCallback(
    (achievement: Achievement) => {
      const unlocked = userAchievements.find((ua) => ua.achievement_id === achievement.id);
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
    },
    [userAchievements, userStats]
  );

  const getMilestoneProgress = useCallback(
    (milestone: Milestone) => {
      const reached = userMilestones.find((um) => um.milestone_id === milestone.id);
      return { reached: !!reached, reachedAt: reached?.reached_at };
    },
    [userMilestones]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-achievements", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["user-milestones", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["user-achievement-stats", user?.id] });
  }, [queryClient, user?.id]);

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
    refetch,
  };
};
