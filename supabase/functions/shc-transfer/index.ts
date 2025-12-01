import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHC_MINT = Deno.env.get('SHC_TOKEN_MINT')!;
const TREASURY_PRIVATE_KEY = Deno.env.get('SOLANA_TREASURY_PRIVATE_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, amount, walletAddress } = await req.json();

    console.log(`SHC Transfer - Action: ${action}, Amount: ${amount}, User: ${user.id}`);

    if (action === 'withdraw') {
      // Check user balance
      const { data: balance, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      if (!balance || balance.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Get user's connected wallet
      let targetWallet = walletAddress;
      if (!targetWallet) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('wallet_address')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (!wallet) {
          throw new Error('No wallet connected');
        }
        targetWallet = wallet.wallet_address;
      }

      // Create pending transaction
      const { data: tx, error: txError } = await supabase
        .from('shc_transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          description: `Withdrawal to ${targetWallet.slice(0, 8)}...`,
          wallet_address: targetWallet,
          status: 'pending'
        })
        .select()
        .single();

      if (txError) throw txError;

      // TODO: Implement actual Solana transfer using @solana/web3.js
      // For now, we'll simulate the transfer and mark as completed
      console.log(`Simulating transfer of ${amount} SHC to ${targetWallet}`);
      console.log(`Treasury Key available: ${!!TREASURY_PRIVATE_KEY}`);
      console.log(`SHC Mint: ${SHC_MINT}`);

      // Update balance
      const newBalance = Number(balance.balance) - amount;
      await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          total_spent: Number(balance.balance) + amount 
        })
        .eq('user_id', user.id);

      // Mark transaction as completed (in production, this would happen after on-chain confirmation)
      await supabase
        .from('shc_transactions')
        .update({ 
          status: 'completed',
          tx_signature: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}` 
        })
        .eq('id', tx.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Withdrawal processed',
          newBalance 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'earn') {
      // Add SHC to user's in-app balance
      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBalance) {
        await supabase
          .from('user_balances')
          .update({ 
            balance: Number(existingBalance.balance) + amount,
            total_earned: Number(existingBalance.total_earned) + amount 
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_balances')
          .insert({ 
            user_id: user.id, 
            balance: amount,
            total_earned: amount 
          });
      }

      // Record transaction
      await supabase
        .from('shc_transactions')
        .insert({
          user_id: user.id,
          type: 'earned',
          amount: amount,
          description: 'SHC Reward',
          status: 'completed'
        });

      return new Response(
        JSON.stringify({ success: true, message: 'SHC earned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SHC Transfer Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
