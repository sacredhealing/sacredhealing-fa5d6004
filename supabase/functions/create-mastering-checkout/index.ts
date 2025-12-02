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

    const { packageType, contactEmail, notes, fileUrls } = await req.json();

    if (!packageType || !contactEmail) {
      throw new Error("Package type and contact email are required");
    }

    // Price IDs from Stripe
    const priceIds: Record<string, { priceId: string; amount: number; trackCount: number }> = {
      single: { 
        priceId: "price_1SZpUuAPsnbrivP0QD1JInei", 
        amount: 147, 
        trackCount: 1 
      },
      bundle: { 
        priceId: "price_1SZpVDAPsnbrivP07P0Y7vFp", 
        amount: 397, 
        trackCount: 3 
      }
    };

    const packageInfo = priceIds[packageType];
    if (!packageInfo) throw new Error("Invalid package type");

    // Create order in pending state
    const { data: order, error: orderError } = await supabaseClient
      .from('mastering_orders')
      .insert({
        user_id: user.id,
        package_type: packageType,
        track_count: packageInfo.trackCount,
        amount_paid: packageInfo.amount,
        contact_email: contactEmail,
        notes: notes || null,
        file_urls: fileUrls || [],
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://ssygukfdbtehvtndandn.lovableproject.com";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: packageInfo.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/music?mastering_success=${order.id}`,
      cancel_url: `${origin}/music?mastering_cancelled=true`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        package_type: packageType
      }
    });

    console.log("Checkout session created:", session.id, "for order:", order.id);

    return new Response(
      JSON.stringify({ url: session.url, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in create-mastering-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
