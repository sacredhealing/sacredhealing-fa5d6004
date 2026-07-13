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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { transmissionId } = await req.json();

    const { data: transmission, error: tErr } = await supabaseAdmin
      .from("divine_transmissions")
      .select("*")
      .eq("id", transmissionId)
      .single();

    if (tErr || !transmission) throw new Error("Transmission not found");
    if (!transmission.price_usd) throw new Error("This transmission is not individually purchasable");

    // Already owns it?
    const { data: existing } = await supabaseAdmin
      .from("divine_transmission_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("transmission_id", transmissionId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyOwned: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") || "https://siddhaquantumnexus.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: transmission.title,
              description: transmission.description || "Divine Transmission",
            },
            unit_amount: Math.round(Number(transmission.price_usd) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/explore-akasha?transmission_success=true&id=${transmissionId}`,
      cancel_url: `${origin}/explore-akasha`,
      metadata: {
        user_id: user.id,
        transmission_id: transmissionId,
        purchase_type: "divine_transmission",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PURCHASE-DIVINE-TRANSMISSION] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
