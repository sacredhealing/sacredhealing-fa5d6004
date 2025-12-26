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
    console.log("[CREATE-STRIPE-CONNECT] Starting account creation");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    console.log("[CREATE-STRIPE-CONNECT] User authenticated:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { country = "NO" } = await req.json();

    // Check if user already has a Connect account
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existingAccount } = await supabaseAdmin
      .from("affiliate_payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccount?.stripe_connect_account_id) {
      console.log("[CREATE-STRIPE-CONNECT] Account already exists, creating new onboarding link");
      
      const accountLink = await stripe.accountLinks.create({
        account: existingAccount.stripe_connect_account_id,
        refresh_url: `${req.headers.get("origin")}/wallet?stripe_refresh=true`,
        return_url: `${req.headers.get("origin")}/wallet?stripe_success=true`,
        type: "account_onboarding",
      });

      return new Response(
        JSON.stringify({ url: accountLink.url, accountId: existingAccount.stripe_connect_account_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: country,
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        user_id: user.id,
      },
    });

    console.log("[CREATE-STRIPE-CONNECT] Created Stripe account:", account.id);

    // Store the account in database
    await supabaseAdmin
      .from("affiliate_payout_accounts")
      .upsert({
        user_id: user.id,
        stripe_connect_account_id: account.id,
        account_status: "pending",
        country: country,
        currency: "eur",
        payout_method: "bank",
      });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/wallet?stripe_refresh=true`,
      return_url: `${req.headers.get("origin")}/wallet?stripe_success=true`,
      type: "account_onboarding",
    });

    console.log("[CREATE-STRIPE-CONNECT] Created onboarding link");

    return new Response(
      JSON.stringify({ url: accountLink.url, accountId: account.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[CREATE-STRIPE-CONNECT] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
