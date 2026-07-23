import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONTENT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { contentId } = await req.json();
    if (!contentId) throw new Error("contentId is required");

    const { data: content, error: contentError } = await supabaseClient
      .from("content_vault")
      .select("*")
      .eq("id", contentId)
      .eq("is_published", true)
      .single();

    if (contentError || !content) throw new Error("Content not found");
    logStep("Content found", { title: content.title, price_cents: content.price_cents });

    if (!content.price_cents || content.price_cents <= 0) {
      throw new Error("This item is not available for individual purchase");
    }

    // Already owns it — don't let them pay twice.
    const { data: existing } = await supabaseClient
      .from("content_vault_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .maybeSingle();
    if (existing) throw new Error("You already own this");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: content.currency || "eur",
            product_data: {
              name: content.title,
              description: content.description || undefined,
              images: content.thumbnail_url ? [content.thumbnail_url] : [],
            },
            unit_amount: content.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/community?content_unlocked=${contentId}`,
      cancel_url: `${req.headers.get("origin")}/community?content_cancelled=${contentId}`,
      metadata: {
        user_id: user.id,
        content_id: contentId,
        type: "content_drop",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Deliberately NOT inserting into content_vault_purchases here.
    // The stripe-webhook confirms payment_status === 'paid' and writes the
    // purchase row — same fix already applied to music/healing-audio
    // purchases after the earlier bug where checkout-create wrote the row
    // optimistically and unpaid/abandoned sessions could grant access.

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
