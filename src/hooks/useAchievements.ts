import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

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

export const useAchievements = () => {
  const { user } = useAuth();
  const { profile: sharedProfile } = useProfile();
  const queryClient = useQueryClient();
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 5 * 60 * 1000,
  });
  const milestonesQuery = useQuery({
    queryKey: ["milestones"],
    queryFn: fetchMilestones,
    staleTime: 5 * 60 * 1000,
  });
  const userAchievementsQuery = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: () => fetchUserAchievements(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const userMilestonesQuery = useQuery({
    queryKey: ["user-milestones", user?.id],
    queryFn: () => fetchUserMilestones(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const meditationCountQuery = useQuery({
    queryKey: ["meditation-completions-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("meditation_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const musicCountQuery = useQuery({
    queryKey: ["music-completions-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("music_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const mantraCountQuery = useQuery({
    queryKey: ["mantra-completions-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("mantra_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const achievements = achievementsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const userAchievements = userAchievementsQuery.data ?? [];
  const userMilestones = userMilestonesQuery.data ?? [];

  const meditationCount = meditationCountQuery.data ?? 0;
  const musicCount = musicCountQuery.data ?? 0;
  const mantraCount = mantraCountQuery.data ?? 0;
  const totalSessions = meditationCount + musicCount + mantraCount;
  const userStats = {
    streakDays: sharedProfile?.streak_days ?? 0,
    totalSessions,
    meditationCount,
    referrals: sharedProfile?.total_referrals ?? 0,
  };

  const loading =
    achievementsQuery.isLoading ||
    milestonesQuery.isLoading ||
    (!!user &&
      (userAchievementsQuery.isLoading ||
        userMilestonesQuery.isLoading ||
        meditationCountQuery.isLoading ||
        musicCountQuery.isLoading ||
        mantraCountQuery.isLoading));

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-achievements");
      if (error) throw error;

      if (data?.newAchievements?.length > 0) {
        setNewlyUnlocked(data.newAchievements[0]);
        queryClient.invalidateQueries({ queryKey: ["user-achievements", user.id] });
        queryClient.invalidateQueries({ queryKey: ["user-milestones", user.id] });
        queryClient.invalidateQueries({ queryKey: ["meditation-completions-count", user.id] });
        queryClient.invalidateQueries({ queryKey: ["music-completions-count", user.id] });
        queryClient.invalidateQueries({ queryKey: ["mantra-completions-count", user.id] });
      }
      if (data?.newMilestones?.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-milestones", user.id] });
        queryClient.invalidateQueries({ queryKey: ["meditation-completions-count", user.id] });
        queryClient.invalidateQueries({ queryKey: ["music-completions-count", user.id] });
        queryClient.invalidateQueries({ queryKey: ["mantra-completions-count", user.id] });
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
    queryClient.invalidateQueries({ queryKey: ["meditation-completions-count", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["music-completions-count", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["mantra-completions-count", user?.id] });
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
