import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum withdrawal in EUR
const MIN_WITHDRAWAL_EUR = 1;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[REQUEST-BANK-PAYOUT] Starting payout request");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { amountShc, priceEur } = await req.json();

    if (!amountShc || amountShc <= 0) {
      throw new Error("Invalid amount");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's affiliate earnings balance
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("total_affiliate_earnings")
      .eq("user_id", user.id)
      .single();

    const availableEarnings = profile?.total_affiliate_earnings || 0;

    if (amountShc > availableEarnings) {
      throw new Error(`Insufficient balance. Available: ${availableEarnings} SHC`);
    }

    // Calculate EUR value
    const amountEur = amountShc * priceEur;

    if (amountEur < MIN_WITHDRAWAL_EUR) {
      throw new Error(`Minimum withdrawal is €${MIN_WITHDRAWAL_EUR}`);
    }

    console.log(`[REQUEST-BANK-PAYOUT] Payout: ${amountShc} SHC = €${amountEur.toFixed(2)}`);

    // Get user's Stripe Connect account
    const { data: payoutAccount } = await supabaseAdmin
      .from("affiliate_payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!payoutAccount?.stripe_connect_account_id || payoutAccount.account_status !== "active") {
      throw new Error("Please complete your bank account setup first");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create a transfer to the connected account
    // Note: In production, you'd need to have funds in your Stripe balance
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountEur * 100), // Convert to cents
      currency: "eur",
      destination: payoutAccount.stripe_connect_account_id,
      metadata: {
        user_id: user.id,
        amount_shc: amountShc.toString(),
      },
    });

    console.log("[REQUEST-BANK-PAYOUT] Transfer created:", transfer.id);

    // Record the payout
    const { data: payout } = await supabaseAdmin
      .from("affiliate_payouts")
      .insert({
        user_id: user.id,
        amount_shc: amountShc,
        amount_eur: amountEur,
        payout_method: "bank",
        status: "processing",
        stripe_payout_id: transfer.id,
      })
      .select()
      .single();

    // Deduct from affiliate earnings
    await supabaseAdmin
      .from("profiles")
      .update({
        total_affiliate_earnings: availableEarnings - amountShc,
      })
      .eq("user_id", user.id);

    // Record the transaction
    await supabaseAdmin
      .from("shc_transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        amount: -amountShc,
        description: `Bank withdrawal: €${amountEur.toFixed(2)}`,
        status: "completed",
      });

    // Update payout to completed
    await supabaseAdmin
      .from("affiliate_payouts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    return new Response(
      JSON.stringify({
        success: true,
        payoutId: payout.id,
        transferId: transfer.id,
        amountShc,
        amountEur,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[REQUEST-BANK-PAYOUT] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
