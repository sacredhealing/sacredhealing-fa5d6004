// Content Vault: create a Stripe Checkout session for a single content item (dynamic price).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) =>
  console.log(`[create-content-checkout] ${step}${details ? ` ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const svc = createClient(supabaseUrl, serviceKey);

    const { data: userData } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = (await req.json().catch(() => ({}))) as { contentId?: string };
    const contentId = body.contentId;
    if (!contentId) throw new Error("contentId is required");

    // Load item
    const { data: item, error: itemErr } = await svc
      .from("content_vault")
      .select("id, title, description, price_cents, currency, is_published, thumbnail_url")
      .eq("id", contentId)
      .maybeSingle();

    if (itemErr) throw itemErr;
    if (!item || !item.is_published) throw new Error("Content not available");
    if (!item.price_cents || item.price_cents <= 0) throw new Error("Item is free — no checkout needed");

    // Already purchased?
    const { data: existing } = await svc
      .from("content_vault_purchases")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .maybeSingle();

    if (existing?.status === "paid") {
      return new Response(JSON.stringify({ alreadyPurchased: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") ?? "https://siddhaquantumnexus.com";

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: item.currency || "eur",
            unit_amount: item.price_cents,
            product_data: {
              name: item.title,
              description: item.description ?? undefined,
              images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
            },
          },
        },
      ],
      metadata: {
        type: "content_drop",
        content_id: item.id,
        content_title: item.title,
        user_id: user.id,
        product_kind: "content_vault",
        currency: item.currency || "eur",
      },
      success_url: `${origin}/library?session_id={CHECKOUT_SESSION_ID}&content_id=${item.id}`,
      cancel_url: `${origin}/library?cancelled=true&content_id=${item.id}`,
    });

    // Intentionally do NOT write a purchase row here. The stripe-webhook
    // records the row with status='paid' only after payment is confirmed
    // (matches the fix already applied to music/healing-audio/transmission
    // purchases). Writing pending rows on session-create risks granting
    // access if reconciliation ever runs against pending rows.

    log("session created", { userId: user.id, contentId: item.id, sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-content-checkout] error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
