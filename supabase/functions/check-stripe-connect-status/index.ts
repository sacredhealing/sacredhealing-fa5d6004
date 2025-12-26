import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHECK-STRIPE-CONNECT] Checking account status");

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: payoutAccount } = await supabaseAdmin
      .from("affiliate_payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!payoutAccount?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ hasAccount: false, status: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(payoutAccount.stripe_connect_account_id);

    console.log("[CHECK-STRIPE-CONNECT] Account details:", {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

    // Update status in database
    let newStatus = "pending";
    if (account.payouts_enabled && account.details_submitted) {
      newStatus = "active";
    } else if (account.requirements?.disabled_reason) {
      newStatus = "restricted";
    }

    if (payoutAccount.account_status !== newStatus) {
      await supabaseAdmin
        .from("affiliate_payout_accounts")
        .update({ account_status: newStatus, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        hasAccount: true,
        status: newStatus,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        country: payoutAccount.country,
        currency: payoutAccount.currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[CHECK-STRIPE-CONNECT] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
