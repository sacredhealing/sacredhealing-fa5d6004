/* SQI 2050: STRIPE & AFFILIATE SYNC — Tier checkout with affiliate metadata */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_CONFIG: Record<
  string,
  { priceIdEnv: string; price: number; commission: number; mode: "subscription" | "payment" }
> = {
  ATMA_SEED: { priceIdEnv: "", price: 0, commission: 0, mode: "subscription" },
  PRANA_FLOW: { priceIdEnv: "STRIPE_PRICE_PRANA_19", price: 19, commission: 5, mode: "subscription" },
  SIDDHA_QUANTUM: { priceIdEnv: "STRIPE_PRICE_SIDDHA_45", price: 45, commission: 15, mode: "subscription" },
  AKASHA_INFINITY: { priceIdEnv: "STRIPE_PRICE_AKASHA_1111", price: 1111, commission: 250, mode: "payment" },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-TIER-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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
    const { tierName, affiliateId } = (await req.json()) as { tierName?: string; affiliateId?: string };
    logStep("Request", { tierName, affiliateId });

    if (!tierName || !TIER_CONFIG[tierName]) {
      throw new Error("Invalid or missing tierName");
    }

    const tier = TIER_CONFIG[tierName];
    if (tierName === "ATMA_SEED" || tier.price === 0) {
      throw new Error("ATMA_SEED is free; no checkout required.");
    }

    const priceId = tier.priceIdEnv ? Deno.env.get(tier.priceIdEnv) : null;
    if (!priceId) {
      throw new Error(`Stripe price not configured for tier: ${tierName}. Set ${tier.priceIdEnv}.`);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const origin = req.headers.get("origin") ?? "https://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: tier.mode,
      metadata: {
        tierName,
        affiliateId: affiliateId ?? "direct",
        protectionShieldActive:
          tierName === "SIDDHA_QUANTUM" || tierName === "AKASHA_INFINITY" ? "true" : "false",
        user_id: user.id,
      },
      success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/membership`,
      ...(tier.mode === "subscription" && { allow_promotion_codes: true }),
    });

    logStep("Session created", { sessionId: session.id });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
