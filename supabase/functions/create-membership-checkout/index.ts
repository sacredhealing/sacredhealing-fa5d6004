import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MEMBERSHIP-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    logStep("Function started");

    const body = await req.json();
    const { priceId, tierSlug, affiliate_id: affiliateId, metadata: extraMetadata, successPath } = body;
    logStep("Request body", { priceId, tierSlug, affiliateId });

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const affiliateRef = (affiliateId ?? extraMetadata?.affiliate_id ?? "direct") as string;
    if (affiliateRef && affiliateRef !== "direct") {
      try {
        await supabaseClient.from("affiliate_attribution").upsert(
          { user_id: user.id, ref_code: affiliateRef, last_seen_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        await supabaseClient.from("affiliate_events").insert({
          ref_code: affiliateRef,
          user_id: user.id,
          tool_slug: "sqi_membership",
          event_type: "checkout",
        });
      } catch (e) {
        logStep("Affiliate attribution (best-effort) failed", String(e));
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Determine if this is a subscription or one-time payment
    const price = await stripe.prices.retrieve(priceId);
    const isSubscription = price.type === 'recurring';
    logStep("Price type determined", { isSubscription, priceType: price.type });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}${successPath ?? '/membership'}?success=true&tier=${tierSlug ?? ''}`,
      cancel_url: `${req.headers.get("origin")}${successPath ?? '/membership'}?canceled=true`,
      metadata: {
        user_id: user.id,
        tier_slug: tierSlug ?? "",
        affiliate_id: (affiliateId ?? extraMetadata?.affiliate_id ?? "direct") as string,
        tier_name: (extraMetadata?.tier_name ?? tierSlug ?? "") as string,
        protection_shield: (extraMetadata?.protection_shield ?? "inactive") as string,
      },
    };

    // For subscriptions, allow promotion codes
    if (isSubscription) {
      sessionConfig.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

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
