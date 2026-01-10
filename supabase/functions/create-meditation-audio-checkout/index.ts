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

    const { affiliateId } = await req.json();

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

    const { id: toolId, name: toolName, price_eur: priceEur } = tool;
    const priceInCents = Math.round(Number(priceEur || 19.99) * 100);

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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Creative Soul Meditation",
              description: "Transform any audio into high-quality meditation tracks + 1000 SHC Coins",
              metadata: {
                tool_id: toolId,
                tool_slug: 'creative-soul-meditation',
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/creative-soul-meditation-tool?success=true`,
      cancel_url: `${origin}/creative-soul-meditation-landing?canceled=true`,
      metadata: {
        user_id: user.id,
        tool_id: toolId,
        tool_slug: 'creative-soul-meditation',
        tool_name: toolName,
        purchase_type: "meditation_audio",
        shc_coins: "1000",
        ...(affiliateId && { affiliate_id: affiliateId }),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          tool_id: toolId,
          purchase_type: "meditation_audio",
          shc_coins: "1000",
        },
      },
    });

    console.log(`[CREATE-MEDITATION-AUDIO-CHECKOUT] Created session for user: ${user.id}, tool: ${toolId}`);

    return new Response(
      JSON.stringify({ url: session.url }),
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

