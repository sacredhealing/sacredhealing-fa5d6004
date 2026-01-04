import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ACHIEVEMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Get user's profile for streak data
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("streak_days, total_referrals")
      .eq("user_id", userId)
      .single();

    // Get user's session counts
    const { count: meditationCount } = await supabaseClient
      .from("meditation_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: musicCount } = await supabaseClient
      .from("music_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: mantraCount } = await supabaseClient
      .from("mantra_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const totalSessions = (meditationCount || 0) + (musicCount || 0) + (mantraCount || 0);
    const streakDays = profile?.streak_days || 0;
    const referrals = profile?.total_referrals || 0;

    logStep("User stats", { totalSessions, streakDays, referrals, meditationCount });

    // Get all achievements
    const { data: achievements } = await supabaseClient
      .from("achievements")
      .select("*")
      .eq("is_active", true);

    // Get user's already unlocked achievements
    const { data: userAchievements } = await supabaseClient
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    const newlyUnlocked: any[] = [];

    // Check each achievement
    for (const achievement of achievements || []) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.requirement_type) {
        case "meditation_count":
          shouldUnlock = (meditationCount || 0) >= achievement.requirement_value;
          break;
        case "total_sessions":
          shouldUnlock = totalSessions >= achievement.requirement_value;
          break;
        case "streak_days":
          shouldUnlock = streakDays >= achievement.requirement_value;
          break;
        case "referrals":
          shouldUnlock = referrals >= achievement.requirement_value;
          break;
        case "special":
          // Special achievements are awarded manually or through specific triggers
          break;
      }

      if (shouldUnlock) {
        logStep("Unlocking achievement", { achievementId: achievement.id, name: achievement.name });
        
        // Insert user achievement
        const { error: insertError } = await supabaseClient
          .from("user_achievements")
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });

        if (!insertError) {
          newlyUnlocked.push(achievement);

          // Award SHC if applicable
          if (achievement.shc_reward > 0) {
            // Update user balance
            const { data: balance } = await supabaseClient
              .from("user_balances")
              .select("balance")
              .eq("user_id", userId)
              .single();

            if (balance) {
              await supabaseClient
                .from("user_balances")
                .update({
                  balance: balance.balance + achievement.shc_reward,
                  total_earned: balance.balance + achievement.shc_reward
                })
                .eq("user_id", userId);

              // Create transaction record
              await supabaseClient
                .from("shc_transactions")
                .insert({
                  user_id: userId,
                  type: "earned",
                  amount: achievement.shc_reward,
                  description: `Achievement unlocked: ${achievement.name}`,
                  status: "completed"
                });
            }
          }
        }
      }
    }

    // Check milestones
    const { data: milestones } = await supabaseClient
      .from("milestones")
      .select("*")
      .eq("is_active", true);

    const { data: userMilestones } = await supabaseClient
      .from("user_milestones")
      .select("milestone_id")
      .eq("user_id", userId);

    const reachedMilestoneIds = new Set(userMilestones?.map(um => um.milestone_id) || []);
    const newlyReachedMilestones: any[] = [];

    for (const milestone of milestones || []) {
      if (reachedMilestoneIds.has(milestone.id)) continue;

      let shouldReach = false;

      switch (milestone.requirement_type) {
        case "total_sessions":
          shouldReach = totalSessions >= milestone.requirement_value;
          break;
        case "days_active":
          // This would need more complex tracking
          break;
      }

      if (shouldReach) {
        logStep("Reaching milestone", { milestoneId: milestone.id, name: milestone.name });

        const { error: insertError } = await supabaseClient
          .from("user_milestones")
          .insert({
            user_id: userId,
            milestone_id: milestone.id
          });

        if (!insertError) {
          newlyReachedMilestones.push(milestone);

          // Award SHC if applicable
          if (milestone.shc_reward > 0) {
            const { data: balance } = await supabaseClient
              .from("user_balances")
              .select("balance")
              .eq("user_id", userId)
              .single();

            if (balance) {
              await supabaseClient
                .from("user_balances")
                .update({
                  balance: balance.balance + milestone.shc_reward,
                  total_earned: balance.balance + milestone.shc_reward
                })
                .eq("user_id", userId);

              await supabaseClient
                .from("shc_transactions")
                .insert({
                  user_id: userId,
                  type: "earned",
                  amount: milestone.shc_reward,
                  description: `Milestone reached: ${milestone.name}`,
                  status: "completed"
                });
            }
          }
        }
      }
    }

    logStep("Check complete", {
      newAchievements: newlyUnlocked.length,
      newMilestones: newlyReachedMilestones.length
    });

    return new Response(JSON.stringify({
      newAchievements: newlyUnlocked,
      newMilestones: newlyReachedMilestones,
      stats: {
        totalSessions,
        streakDays,
        referrals
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
