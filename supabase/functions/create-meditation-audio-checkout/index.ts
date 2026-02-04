import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe Price IDs - use env vars; fallback to dynamic pricing if not set
const PRICE_LIFETIME = Deno.env.get("STRIPE_PRICE_LIFETIME_149");
const PRICE_MONTHLY = Deno.env.get("STRIPE_PRICE_SUBSCRIPTION") || Deno.env.get("STRIPE_PRICE_MONTHLY_1499");
const PRICE_SINGLE = Deno.env.get("STRIPE_PRICE_SINGLE_999") || Deno.env.get("STRIPE_PRICE_PER_TRACK");

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

    const { data: tool } = await supabaseAdmin
      .from('creative_tools')
      .select('id, name')
      .eq('slug', 'creative-soul-meditation')
      .eq('is_active', true)
      .maybeSingle();

    const toolId = tool?.id ?? "creative-soul-meditation";
    const toolName = tool?.name ?? "Creative Soul Meditation";
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

    const SITE_URL = Deno.env.get("SITE_URL") || Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || req.headers.get("origin") || "https://sacredhealing.app";

    // Map option to price ID (use same env vars as creative-soul-create-checkout for consistency)
    const priceIdMap: Record<string, string | undefined> = {
      one_time: PRICE_LIFETIME,
      subscription: PRICE_MONTHLY,
      per_track: PRICE_SINGLE,
    };
    const priceId = priceIdMap[option];
    const mode = option === "subscription" ? "subscription" : "payment";
    const usePriceId = priceId && priceId.startsWith("price_") && priceId.length > 20; // Real Stripe IDs are longer
    
    // Create line items - use dynamic pricing when env vars not set (avoids invalid price ID errors)
    let lineItems;
    
    if (usePriceId) {
      lineItems = [{ price: priceId!, quantity: 1 }];
    } else {
      const prices: Record<string, { amount: number; description: string; recurring?: boolean }> = {
        one_time: { amount: 14900, description: "Lifetime access - Creative Soul Meditation + 1000 SHC Coins" },
        subscription: { amount: 999, description: "Monthly subscription - €9.99/month + 200 SHC Coins/month", recurring: true },
        per_track: { amount: 999, description: "One meditation export - €9.99 per track + 100 SHC Coins" },
      };
      const priceInfo = prices[option] || prices.per_track;
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
          ...(priceInfo.recurring && {
            recurring: { interval: "month" as const },
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
      success_url: `${SITE_URL}/creative-soul/meditation?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/creative-soul/meditation?payment=cancel`,
      metadata: {
        user_id: user.id,
        tool_id: String(toolId),
        tool_slug: 'creative-soul',
        tool_name: toolName,
        purchase_type: "meditation_audio",
        plan: option === 'one_time' ? 'lifetime' : (option === 'subscription' ? 'monthly' : 'single'),
        option: option,
        shc_coins: String(shcCoinsToCredit),
        ...(affiliateId && { affiliate_id: affiliateId }),
      },
      payment_intent_data: mode === "payment" ? {
        metadata: {
          user_id: user.id,
          tool_id: String(toolId),
          purchase_type: "meditation_audio",
          plan: option === 'one_time' ? 'lifetime' : (option === 'subscription' ? 'monthly' : 'single'),
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

