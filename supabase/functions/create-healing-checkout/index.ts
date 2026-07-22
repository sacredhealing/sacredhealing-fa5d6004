import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Healing packages with Stripe price IDs
const HEALING_PRICES = {
  "7_day": {
    price_id: "price_1ScQ1kAPsnbrivP0WyM3D226",
    name: "7-Day Sacred Healing",
    amount: 97,
    days: 7,
  },
  "14_day": {
    price_id: "price_1ScQ1zAPsnbrivP0okHYqlxq",
    name: "14-Day Sacred Healing",
    amount: 147,
    days: 14,
  },
  "30_day": {
    price_id: "price_1ScQ2EAPsnbrivP0m97lDHTo",
    name: "30-Day Sacred Healing",
    amount: 197,
    days: 30,
  },
  "subscription": {
    price_id: "price_1ScQ2WAPsnbrivP0LvXzZVDG",
    name: "Sacred Healing Monthly Subscription",
    amount: 147,
    days: 30,
  },
  // Healing Boosts — quick-tap micro tiers, no pre-created Stripe Price object.
  // No price_id here on purpose: the checkout session builder below uses Stripe's
  // dynamic price_data for any plan missing a price_id, so these don't touch how
  // the four plans above are charged.
  "boost_1_day": {
    name: "1-Day Healing Boost",
    amount: 11.11,
    days: 1,
  },
  "boost_2_day": {
    name: "2-Day Healing Boost",
    amount: 22.22,
    days: 2,
  },
  "boost_3_day": {
    name: "3-Day Healing Boost",
    amount: 33.33,
    days: 3,
  },
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { planType, affiliateId } = await req.json();
    console.log("[HEALING-CHECKOUT] Plan type:", planType);

    const planConfig = HEALING_PRICES[planType as keyof typeof HEALING_PRICES];
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://localhost:3000";

    if (planType === "subscription") {
      // Monthly subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: planConfig.price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/healing?success=true&type=${planType}`,
        cancel_url: `${origin}/healing?canceled=true`,
        metadata: {
          user_id: user.id,
          plan_type: planType,
          days: planConfig.days.toString(),
          ...(affiliateId ? { affiliateId } : {}),
        },
      });

      console.log("[HEALING-CHECKOUT] Created subscription session:", session.id);

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // One-time payment. Plans with a pre-created Stripe price_id use it exactly as before.
      // Boost plans (no price_id) build the price inline via price_data — same checkout flow,
      // just no Stripe Dashboard price object needed for these smaller tiers.
      const lineItem = "price_id" in planConfig && planConfig.price_id
        ? { price: planConfig.price_id, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: { name: planConfig.name },
              unit_amount: Math.round(planConfig.amount * 100),
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [lineItem],
        mode: "payment",
        success_url: `${origin}/healing?success=true&type=${planType}`,
        cancel_url: `${origin}/healing?canceled=true`,
        metadata: {
          user_id: user.id,
          plan_type: planType,
          days: planConfig.days.toString(),
          ...(affiliateId ? { affiliateId } : {}),
        },
      });

      console.log("[HEALING-CHECKOUT] Created payment session:", session.id);

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[HEALING-CHECKOUT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
