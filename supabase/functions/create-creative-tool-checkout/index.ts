import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { toolSlug } = await req.json();

    if (!toolSlug) {
      throw new Error("Missing required field: toolSlug");
    }

    // Fetch tool from database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tool, error: toolError } = await supabaseAdmin
      .from('creative_tools')
      .select('*')
      .eq('slug', toolSlug)
      .eq('is_active', true)
      .single();

    if (toolError || !tool) {
      throw new Error("Tool not found or inactive");
    }

    const { id: toolId, name: toolName, price_eur: priceEur, promo_discount_percent } = tool;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      // Create new customer
      customerId = (await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })).id;
    }

    // Calculate final price with discount if applicable
    const discountPercent = promo_discount_percent && Number(promo_discount_percent) > 0 
      ? Number(promo_discount_percent) 
      : 0;
    const finalPrice = discountPercent > 0 
      ? Number(priceEur) * (1 - discountPercent / 100)
      : Number(priceEur);
    const priceInCents = Math.round(finalPrice * 100);
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "https://sacredhealing.app";

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: toolName,
              description: discountPercent > 0 
                ? `Creative Soul Tool: ${toolName} (${discountPercent}% off)`
                : `Creative Soul Tool: ${toolName}`,
              metadata: {
                tool_id: toolId,
                tool_slug: toolSlug,
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/creative-soul?success=true&tool=${toolSlug}`,
      cancel_url: `${origin}/creative-soul?canceled=true`,
      metadata: {
        user_id: user.id,
        tool_id: toolId,
        tool_slug: tool.slug,
        tool_name: toolName,
        purchase_type: "creative_tool",
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          tool_id: toolId,
          purchase_type: "creative_tool",
        },
      },
    });

    console.log(`[CREATIVE-TOOL-CHECKOUT] Created session for tool: ${toolId}, user: ${user.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATIVE-TOOL-CHECKOUT] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

