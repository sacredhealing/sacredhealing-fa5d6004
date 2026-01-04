import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Conversion Funnel: Free → Trial → Paid
    const { data: freeUsers } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("conversion_stage", "free");

    const { data: trialUsers } = await supabaseClient
      .from("free_trials")
      .select("id");

    const { data: paidUsers } = await supabaseClient
      .from("user_memberships")
      .select("id")
      .eq("status", "active");

    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const conversionFunnel = {
      totalUsers: totalUsers || 0,
      freeUsers: freeUsers?.length || 0,
      trialUsers: trialUsers?.length || 0,
      paidUsers: paidUsers?.length || 0,
      freeToTrialRate: totalUsers ? ((trialUsers?.length || 0) / totalUsers * 100).toFixed(1) : 0,
      trialToPaidRate: trialUsers?.length ? ((paidUsers?.length || 0) / (trialUsers?.length) * 100).toFixed(1) : 0,
      overallConversion: totalUsers ? ((paidUsers?.length || 0) / totalUsers * 100).toFixed(1) : 0,
    };

    // 2. Retention: D1, D7, D30
    const { data: d1Cohort } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d1);

    const { data: d1Retained } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d1)
      .eq("d1_retained", true);

    const { data: d7Cohort } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d7);

    const { data: d7Retained } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d7)
      .eq("d7_retained", true);

    const { data: d30Cohort } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d30);

    const { data: d30Retained } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .eq("signup_date", d30)
      .eq("d30_retained", true);

    const retention = {
      d1: {
        cohortSize: d1Cohort?.length || 0,
        retained: d1Retained?.length || 0,
        rate: d1Cohort?.length ? ((d1Retained?.length || 0) / d1Cohort.length * 100).toFixed(1) : 0,
      },
      d7: {
        cohortSize: d7Cohort?.length || 0,
        retained: d7Retained?.length || 0,
        rate: d7Cohort?.length ? ((d7Retained?.length || 0) / d7Cohort.length * 100).toFixed(1) : 0,
      },
      d30: {
        cohortSize: d30Cohort?.length || 0,
        retained: d30Retained?.length || 0,
        rate: d30Cohort?.length ? ((d30Retained?.length || 0) / d30Cohort.length * 100).toFixed(1) : 0,
      },
    };

    // 3. Active Users per Path & Meditation
    const { data: meditationActivity } = await supabaseClient
      .from("meditation_completions")
      .select("meditation_id, meditations(title)")
      .gte("completed_at", d30);

    const meditationCounts: Record<string, { title: string; count: number }> = {};
    meditationActivity?.forEach((item: any) => {
      const id = item.meditation_id;
      const title = item.meditations?.title || 'Unknown';
      if (!meditationCounts[id]) {
        meditationCounts[id] = { title, count: 0 };
      }
      meditationCounts[id].count++;
    });

    const topMeditations = Object.entries(meditationCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const { data: pathActivity } = await supabaseClient
      .from("content_analytics")
      .select("content_name, content_id")
      .eq("content_type", "path")
      .gte("activity_date", d30);

    const pathCounts: Record<string, number> = {};
    pathActivity?.forEach((item: any) => {
      const name = item.content_name || item.content_id;
      pathCounts[name] = (pathCounts[name] || 0) + 1;
    });

    const topPaths = Object.entries(pathCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. ARPU by Tier
    const { data: membershipRevenue } = await supabaseClient
      .from("user_memberships")
      .select("tier_id, amount_paid, membership_tiers(name, slug)")
      .eq("status", "active");

    const tierRevenue: Record<string, { name: string; totalRevenue: number; userCount: number }> = {};
    membershipRevenue?.forEach((item: any) => {
      const slug = item.membership_tiers?.slug || 'unknown';
      const name = item.membership_tiers?.name || 'Unknown';
      if (!tierRevenue[slug]) {
        tierRevenue[slug] = { name, totalRevenue: 0, userCount: 0 };
      }
      tierRevenue[slug].totalRevenue += item.amount_paid || 0;
      tierRevenue[slug].userCount++;
    });

    const arpuByTier = Object.entries(tierRevenue).map(([slug, data]) => ({
      slug,
      name: data.name,
      arpu: data.userCount ? (data.totalRevenue / data.userCount).toFixed(2) : 0,
      totalRevenue: data.totalRevenue.toFixed(2),
      userCount: data.userCount,
    }));

    // Calculate overall ARPU
    const totalRevenue = Object.values(tierRevenue).reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalPaidUsers = Object.values(tierRevenue).reduce((sum, t) => sum + t.userCount, 0);
    const overallArpu = totalPaidUsers ? (totalRevenue / totalPaidUsers).toFixed(2) : 0;

    // 5. Churn & Upgrade Rates (30-day window)
    const { data: churnedUsers } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .not("churned_at", "is", null)
      .gte("churned_at", d30);

    const { data: upgradedUsers } = await supabaseClient
      .from("user_cohorts")
      .select("id")
      .not("upgraded_at", "is", null)
      .gte("upgraded_at", d30);

    const { data: activeSubscriptions } = await supabaseClient
      .from("user_memberships")
      .select("id")
      .in("status", ["active", "cancelled"]);

    const churnUpgrade = {
      churned30d: churnedUsers?.length || 0,
      upgraded30d: upgradedUsers?.length || 0,
      churnRate: activeSubscriptions?.length 
        ? ((churnedUsers?.length || 0) / activeSubscriptions.length * 100).toFixed(1) 
        : 0,
      upgradeRate: activeSubscriptions?.length 
        ? ((upgradedUsers?.length || 0) / activeSubscriptions.length * 100).toFixed(1) 
        : 0,
    };

    // 6. Daily Active Users (last 30 days)
    const { data: dauData } = await supabaseClient
      .from("daily_active_users")
      .select("activity_date, user_id")
      .gte("activity_date", d30);

    const dauByDate: Record<string, Set<string>> = {};
    dauData?.forEach((item: any) => {
      const date = item.activity_date;
      if (!dauByDate[date]) {
        dauByDate[date] = new Set();
      }
      dauByDate[date].add(item.user_id);
    });

    const dauTimeline = Object.entries(dauByDate)
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 7. Summary stats
    const { count: totalMeditations } = await supabaseClient
      .from("meditation_completions")
      .select("id", { count: "exact", head: true });

    const { count: totalMantras } = await supabaseClient
      .from("mantra_completions")
      .select("id", { count: "exact", head: true });

    const summary = {
      totalUsers: totalUsers || 0,
      paidUsers: paidUsers?.length || 0,
      totalMeditations: totalMeditations || 0,
      totalMantras: totalMantras || 0,
      totalRevenue: totalRevenue.toFixed(2),
      overallArpu,
    };

    return new Response(
      JSON.stringify({
        success: true,
        generatedAt: now.toISOString(),
        summary,
        conversionFunnel,
        retention,
        topMeditations,
        topPaths,
        arpuByTier,
        churnUpgrade,
        dauTimeline,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching analytics:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
