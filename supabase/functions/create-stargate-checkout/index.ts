import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STARGATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { email: user.email });

    // Tier-aware pricing: free (Atma-Seed) members pay the full standalone
    // rate; existing paying members (Prana-Flow, Siddha-Quantum, Akasha-
    // Infinity) get a discounted add-on rate since they're already
    // customers. NOT explicitly specified for Akasha-Infinity — applying
    // the same discount logic as Prana-Flow/Siddha-Quantum ("already
    // paying members"), flag if that's wrong.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: prof } = await supabaseAdmin.from("profiles").select("membership_tier").eq("user_id", user.id).maybeSingle();
    const tierSlug = (prof?.membership_tier || "free").toLowerCase();
    const isExistingPayingMember = ["prana-flow", "siddha-quantum", "akasha-infinity"].includes(tierSlug);

    // Both Stripe prices are confirmed real and EUR-denominated:
    //   STRIPE_PRICE_STARGATE_BASE     = price_1TsrsRAPsnbrivP01XgmFoev (€25/mo)
    //   STRIPE_PRICE_STARGATE_DISCOUNT = price_1TsrleAPsnbrivP0bjQZ2son (€6/mo)
    // Both live on the same product (prod_TWuCuWU5Vdr9Fx). The old USD price
    // (price_1SZqNuAPsnbrivP0ZygF4M88) is deliberately no longer used for
    // NEW checkouts — anyone already subscribed on it keeps working
    // normally, Stripe prices are immutable and existing subscriptions
    // aren't affected by this change.
    const priceId = isExistingPayingMember
      ? (Deno.env.get("STRIPE_PRICE_STARGATE_DISCOUNT") || "price_1TsrleAPsnbrivP0bjQZ2son")
      : (Deno.env.get("STRIPE_PRICE_STARGATE_BASE") || "price_1TsrsRAPsnbrivP01XgmFoev");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Create checkout session for Stargate Membership subscription
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
      success_url: `${req.headers.get("origin")}/stargate?success=true`,
      cancel_url: `${req.headers.get("origin")}/stargate?canceled=true`,
      metadata: {
        user_id: user.id,
        type: "stargate_membership", // Matches webhook getPurchaseType logic
        membership_type: "stargate", // Keep for backward compatibility
        tier_at_purchase: tierSlug,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
