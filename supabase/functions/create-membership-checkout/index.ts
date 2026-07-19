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

    // Resolve the permanent referrer BEFORE deciding what to attribute this
    // purchase to. A user's first-ever referral link sets this once; every
    // future purchase (including tier upgrades where no ?ref= is present)
    // credits that same referrer, not just the purchase that happens to
    // carry a fresh URL parameter.
    const requestRef = (affiliateId ?? extraMetadata?.affiliate_id ?? null) as string | null;
    let resolvedAffiliateRef = "direct";
    try {
      const { data: existingAttribution } = await supabaseClient
        .from("affiliate_attribution").select("ref_code").eq("user_id", user.id).maybeSingle();

      if (existingAttribution?.ref_code) {
        // Permanent attribution already exists — always wins, regardless of
        // what (if anything) this specific checkout call carries.
        resolvedAffiliateRef = existingAttribution.ref_code;
      } else if (requestRef && requestRef !== "direct") {
        // First-ever referral for this user — set it, permanently.
        resolvedAffiliateRef = requestRef;
        await supabaseClient.from("affiliate_attribution").insert(
          { user_id: user.id, ref_code: requestRef, last_seen_at: new Date().toISOString() }
        );
      }

      if (resolvedAffiliateRef !== "direct") {
        await supabaseClient.from("affiliate_events").insert({
          ref_code: resolvedAffiliateRef,
          user_id: user.id,
          tool_slug: "sqi_membership",
          event_type: "checkout",
        });
      }
    } catch (e) {
      logStep("Affiliate attribution (best-effort) failed", String(e));
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
        affiliate_id: resolvedAffiliateRef,
        tier_name: (extraMetadata?.tier_name ?? tierSlug ?? "") as string,
        protection_shield: (extraMetadata?.protection_shield ?? "inactive") as string,
      },
    };

    // For subscriptions, allow promotion codes
    if (isSubscription) {
      sessionConfig.allow_promotion_codes = true;
    }

    // Growth: 7-day free trial on Prana-Flow monthly only — the entry-level paid
    // tier. Siddha-Quantum and any other subscription tier routed through this
    // same function stay trial-free (higher-commitment tiers).
    if (isSubscription && tierSlug === "prana-flow") {
      sessionConfig.subscription_data = { trial_period_days: 7 };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Log for abandonment recovery — best-effort, never blocks checkout.
    try {
      const tierDisplay: Record<string, { name: string; price: string }> = {
        "prana-flow": { name: "Prana-Flow", price: "19€/mo (7 days free)" },
        "siddha-quantum-monthly": { name: "Siddha-Quantum", price: "45€/mo" },
        "akasha-infinity": { name: "Akasha-Infinity", price: "2997€ once" },
      };
      const display = tierDisplay[tierSlug] ?? { name: tierSlug, price: "" };
      await supabaseClient.from("checkout_abandonment_log").insert({
        stripe_session_id: session.id,
        session_url: session.url,
        user_id: user.id,
        email: user.email,
        tier_slug: tierSlug,
        display_name: display.name,
        price_label: display.price,
      });
    } catch (e) {
      logStep("Abandonment log insert failed (non-fatal)", { error: String(e) });
    }

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
