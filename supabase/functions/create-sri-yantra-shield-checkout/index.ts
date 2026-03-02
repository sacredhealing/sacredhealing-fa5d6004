import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SRI_YANTRA_PRICE_EUR = 49;
const PRODUCT_NAME = "Sri Yantra Universal Protection Shield — 1km Bio-Field (24/7)";

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

    const body = await req.json().catch(() => ({}));
    const affiliateId = body?.affiliateId ?? body?.affiliate_id ?? null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      customerId = (await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })).id;
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "https://sacredhealing.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: PRODUCT_NAME,
              description: "v2026.SUPREME — One-Time Anchor, 1000m Radius, 24/7 Autonomy. Stripe & Crypto accepted.",
              images: [],
            },
            unit_amount: SRI_YANTRA_PRICE_EUR * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/sri-yantra-shield?purchase=success`,
      cancel_url: `${origin}/sri-yantra-shield?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        product_type: "sri_yantra_shield",
        product_name: PRODUCT_NAME,
        commission_rate: "0.30",
        ...(affiliateId && { affiliate_id: String(affiliateId) }),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          product_type: "sri_yantra_shield",
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SRI-YANTRA-CHECKOUT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
