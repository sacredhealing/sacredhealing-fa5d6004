import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe Price IDs - Update these with your actual Stripe Price IDs from dashboard
const PRICE_IDS = {
  one_time: Deno.env.get("STRIPE_PRICE_ONE_TIME") || "price_one_time_149",       // €149 one-time
  subscription: Deno.env.get("STRIPE_PRICE_SUBSCRIPTION") || "price_sub_monthly", // €9.99/month
  per_track: Deno.env.get("STRIPE_PRICE_PER_TRACK") || "price_per_track_999",     // €9.99 per track
};

// Coin credits per purchase option
const COIN_CREDITS = {
  one_time: 1000,
  subscription: 200,
  per_track: 100,
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

    const { affiliateId, option = "one_time" } = await req.json();
    
    // Validate option
    if (!["one_time", "subscription", "per_track"].includes(option)) {
      throw new Error("Invalid option. Must be 'one_time', 'subscription', or 'per_track'");
    }

    // Get tool from database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tool, error: toolError } = await supabaseAdmin
      .from('creative_tools')
      .select('*')
      .eq('slug', 'creative-soul-meditation')
      .eq('is_active', true)
      .single();

    if (toolError || !tool) {
      throw new Error("Creative Soul Meditation tool not found or inactive");
    }

    const { id: toolId, name: toolName } = tool;
    const shcCoinsToCredit = COIN_CREDITS[option as keyof typeof COIN_CREDITS];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      customerId = (await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })).id;
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "https://sacredhealing.app";

    // Determine pricing and mode based on option
    const priceId = PRICE_IDS[option as keyof typeof PRICE_IDS];
    const mode = option === "subscription" ? "subscription" : "payment";
    const isPriceId = priceId && priceId.startsWith("price_"); // Check if it's a valid Stripe Price ID format
    
    // Create line items based on option
    let lineItems;
    
    if (isPriceId) {
      // Use existing Stripe Price ID from environment or defaults
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      // Use dynamic pricing
      const prices = {
        one_time: { amount: 14900, description: "One-time purchase - Lifetime access + 1000 SHC Coins" }, // €149
        subscription: { amount: 999, description: "Monthly subscription - €9.99/month + 200 SHC Coins/month" }, // €9.99
        per_track: { amount: 999, description: "Per-track generation - €9.99 per track + 100 SHC Coins" }, // €9.99
      };
      
      const priceInfo = prices[option as keyof typeof prices];
      lineItems = [{
        price_data: {
          currency: "eur",
          product_data: {
            name: "Creative Soul Meditation",
            description: priceInfo.description,
            metadata: {
              tool_id: toolId,
              tool_slug: 'creative-soul-meditation',
            },
          },
          unit_amount: priceInfo.amount,
          ...(option === "subscription" && {
            recurring: {
              interval: "month",
            },
          }),
        },
        quantity: 1,
      }];
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: mode,
      payment_method_types: ["card"],
      success_url: `${origin}/creative-soul-meditation-tool?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/creative-soul-meditation-landing?canceled=true`,
      metadata: {
        user_id: user.id,
        tool_id: toolId,
        tool_slug: 'creative-soul-meditation',
        tool_name: toolName,
        purchase_type: "meditation_audio",
        option: option,
        shc_coins: String(shcCoinsToCredit),
        ...(affiliateId && { affiliate_id: affiliateId }),
      },
      payment_intent_data: mode === "payment" ? {
        metadata: {
          user_id: user.id,
          tool_id: toolId,
          purchase_type: "meditation_audio",
          option: option,
          shc_coins: String(shcCoinsToCredit),
        },
      } : undefined,
    });

    console.log(`[CREATE-MEDITATION-AUDIO-CHECKOUT] Created session for user: ${user.id}, tool: ${toolId}, option: ${option}, coins: ${shcCoinsToCredit}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        id: session.id,
        option: option,
        coins: shcCoinsToCredit,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATE-MEDITATION-AUDIO-CHECKOUT] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

