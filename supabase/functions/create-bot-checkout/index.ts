import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOT-CHECKOUT] ${step}${detailsStr}`);
};

// Bot feature price IDs - Update these with your actual Stripe price IDs
const BOT_PRICES = {
  deposit: null, // Custom amount - handled in bot dashboard
  premium_monthly: 'price_xxxxx', // Replace with actual price ID
  premium_annual: 'price_xxxxx', // Replace with actual price ID
  feature_unlock: 'price_xxxxx', // Replace with actual price ID
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { type, amount, feature } = await req.json();
    logStep("Request received", { type, amount, feature });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    if (!user.email) {
      throw new Error("User email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://localhost:3000";

    // Handle different payment types
    if (type === 'deposit' && amount) {
      // Custom amount deposit
      const amountInCents = Math.round(amount * 100);
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Bot Deposit",
                description: "Deposit funds to your trading bot account",
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/income-streams/ai-income?success=true&type=deposit`,
        cancel_url: `${origin}/income-streams/ai-income?canceled=true`,
        metadata: {
          user_id: user.id,
          purchase_type: 'bot_deposit',
          amount: amount.toString(),
        },
      });

      logStep("Deposit checkout session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle premium subscription
    if (type === 'premium') {
      const priceId = feature === 'annual' 
        ? BOT_PRICES.premium_annual 
        : BOT_PRICES.premium_monthly;

      if (!priceId || priceId === 'price_xxxxx') {
        throw new Error("Premium pricing not configured. Please contact support.");
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/income-streams/ai-income?success=true&type=premium`,
        cancel_url: `${origin}/income-streams/ai-income?canceled=true`,
        metadata: {
          user_id: user.id,
          purchase_type: 'bot_premium',
          feature: feature || 'monthly',
        },
        allow_promotion_codes: true,
      });

      logStep("Premium checkout session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle feature unlock
    if (type === 'feature' && feature) {
      const priceId = BOT_PRICES.feature_unlock;

      if (!priceId || priceId === 'price_xxxxx') {
        throw new Error("Feature pricing not configured. Please contact support.");
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/income-streams/ai-income?success=true&type=feature&feature=${feature}`,
        cancel_url: `${origin}/income-streams/ai-income?canceled=true`,
        metadata: {
          user_id: user.id,
          purchase_type: 'bot_feature',
          feature: feature,
        },
      });

      logStep("Feature checkout session created", { sessionId: session.id, feature });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid payment type or missing parameters");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

