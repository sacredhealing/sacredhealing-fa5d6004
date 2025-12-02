import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REWARDS = [
  { rank: 1, amount: 5000, description: 'Monthly Leaderboard - 1st Place 🥇' },
  { rank: 2, amount: 3000, description: 'Monthly Leaderboard - 2nd Place 🥈' },
  { rank: 3, amount: 1500, description: 'Monthly Leaderboard - 3rd Place 🥉' },
];

const logStep = (step: string, details?: any) => {
  console.log(`[MONTHLY-REWARDS] ${step}:`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get start of last month (we distribute at the start of a new month for the previous month)
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    logStep('Calculating rewards for period', { 
      start: startOfLastMonth.toISOString(), 
      end: endOfLastMonth.toISOString() 
    });

    // Get all earned transactions from last month
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('shc_transactions')
      .select('user_id, amount')
      .eq('type', 'earned')
      .eq('status', 'completed')
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      logStep('No transactions found for last month');
      return new Response(JSON.stringify({ message: 'No transactions for last month' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Aggregate by user
    const userTotals = new Map<string, number>();
    transactions.forEach(tx => {
      const current = userTotals.get(tx.user_id) || 0;
      userTotals.set(tx.user_id, current + Number(tx.amount));
    });

    // Sort and get top 3
    const topUsers = Array.from(userTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    logStep('Top 3 users identified', topUsers);

    const results = [];

    // Distribute rewards to top 3
    for (let i = 0; i < topUsers.length && i < REWARDS.length; i++) {
      const [userId, earned] = topUsers[i];
      const reward = REWARDS[i];

      logStep(`Distributing reward to rank ${reward.rank}`, { userId, amount: reward.amount });

      // Update user balance
      const { error: balanceError } = await supabaseAdmin.rpc('increment_balance', {
        p_user_id: userId,
        p_amount: reward.amount
      });

      // If RPC doesn't exist, do manual update
      if (balanceError) {
        const { data: currentBalance } = await supabaseAdmin
          .from('user_balances')
          .select('balance, total_earned')
          .eq('user_id', userId)
          .single();

        if (currentBalance) {
          await supabaseAdmin
            .from('user_balances')
            .update({
              balance: Number(currentBalance.balance) + reward.amount,
              total_earned: Number(currentBalance.total_earned) + reward.amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
      }

      // Record transaction
      await supabaseAdmin
        .from('shc_transactions')
        .insert({
          user_id: userId,
          type: 'earned',
          amount: reward.amount,
          description: reward.description,
          status: 'completed'
        });

      results.push({
        rank: reward.rank,
        userId,
        monthlyEarned: earned,
        rewardAmount: reward.amount
      });
    }

    logStep('Rewards distributed successfully', results);

    return new Response(JSON.stringify({ 
      success: true, 
      period: { start: startOfLastMonth, end: endOfLastMonth },
      rewards: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logStep('Error distributing rewards', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
