import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRANSFORMATION-CHECKOUT] ${step}${detailsStr}`);
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
    const { priceEur, programId, variationId, practitionerId, paymentType, programName, priceId } = await req.json();
    logStep("Starting checkout", { priceEur, programId, variationId, paymentType, priceId });

    // Get user if authenticated
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    let userId: string | undefined;
    let customerId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email;
      userId = data.user?.id;
      logStep("User authenticated", { email: userEmail, userId });
    }

    if (!userEmail) {
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://ssygukfdbtehvtndandn.lovableproject.com";

    // If a specific priceId is provided, use it directly
    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/dashboard?payment=success`,
        cancel_url: `${origin}/transformation?payment=cancelled`,
        metadata: {
          user_id: userId || '',
          program_id: programId || '',
          variation_id: variationId || '',
          practitioner_id: practitionerId || '',
          payment_type: paymentType || 'full',
          type: 'transformation'
        },
      });

      logStep("Session created with priceId", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Otherwise use dynamic pricing
    if (!priceEur) {
      throw new Error("Price is required");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: programName || "Transformation Program",
              description: paymentType === 'installment' 
                ? "Monthly payment for Transformation Program" 
                : "Full payment for Transformation Program",
            },
            unit_amount: Math.round(priceEur * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/transformation?payment=cancelled`,
      metadata: {
        user_id: userId || '',
        program_id: programId || '',
        variation_id: variationId || '',
        practitioner_id: practitionerId || '',
        payment_type: paymentType || 'full',
        type: 'transformation'
      },
    });

    logStep("Session created with dynamic pricing", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
