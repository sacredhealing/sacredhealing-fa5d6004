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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { bundleId } = await req.json();
    if (!bundleId) {
      throw new Error("Bundle ID required");
    }

    // Fetch bundle details
    const { data: bundle, error: bundleError } = await supabaseClient
      .from("music_bundles")
      .select("*")
      .eq("id", bundleId)
      .single();

    if (bundleError || !bundle) {
      throw new Error("Bundle not found");
    }

    // Check if already purchased
    const { data: existing } = await supabaseClient
      .from("bundle_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("bundle_id", bundleId)
      .single();

    if (existing) {
      throw new Error("Bundle already purchased");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: bundle.title,
              description: bundle.description || "Music bundle",
            },
            unit_amount: Math.round(bundle.price_usd * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/music?bundle_success=true&bundle_id=${bundleId}`,
      cancel_url: `${req.headers.get("origin")}/music`,
      metadata: {
        user_id: user.id,
        bundle_id: bundleId,
        type: "bundle_purchase",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
