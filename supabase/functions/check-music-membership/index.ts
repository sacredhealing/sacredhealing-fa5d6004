import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-MUSIC-MEMBERSHIP] ${step}${detailsStr}`);
};

// Stripe product IDs for music membership
const MEMBERSHIP_PRODUCT_IDS = [
  'prod_TXKve0XNFzqiRO', // Monthly
  'prod_TXKwrGg7VCFI8k'  // Yearly
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use anon key for user authentication (service role bypasses RLS but causes JWT issues)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        global: { 
          headers: { Authorization: authHeader } 
        },
        auth: { persistSession: false } 
      }
    );

    // Authenticate user using the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      logStep("Authentication failed", { error: userError?.message });
      throw new Error(`Authentication error: ${userError?.message || 'User not authenticated'}`);
    }
    if (!user.email) {
      throw new Error("User email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        hasMembership: false,
        planType: null,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Check if any subscription is for music membership
    let hasMembership = false;
    let planType: string | null = null;
    let subscriptionEnd: string | null = null;

    for (const sub of subscriptions.data) {
      const productId = sub.items.data[0]?.price?.product as string;
      if (MEMBERSHIP_PRODUCT_IDS.includes(productId)) {
        hasMembership = true;
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        
        // Determine plan type based on product
        if (productId === 'prod_TXKve0XNFzqiRO') {
          planType = 'monthly';
        } else if (productId === 'prod_TXKwrGg7VCFI8k') {
          planType = 'yearly';
        }
        
        logStep("Active music membership found", { subscriptionId: sub.id, planType, subscriptionEnd });
        break;
      }
    }

    if (!hasMembership) {
      logStep("No active music membership");
    }

    return new Response(JSON.stringify({
      hasMembership,
      planType,
      subscriptionEnd
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
