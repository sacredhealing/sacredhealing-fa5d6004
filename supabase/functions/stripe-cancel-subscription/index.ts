import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid user token");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Resolve Stripe customer: profiles → user_memberships → email lookup (with backfill)
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id, membership_tier")
      .eq("id", user.id)
      .maybeSingle();

    let customerId: string | null = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const { data: membership } = await supabaseClient
        .from("user_memberships")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      customerId = membership?.stripe_customer_id ?? null;
    }

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    if (!customerId) throw new Error("No Stripe customer found for this user");

    // Backfill so future lookups are instant
    if (!profile?.stripe_customer_id) {
      await supabaseClient.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // Cancel ALL open subscriptions at period end (graceful — access retained until cycle ends)
    const openSubs: any[] = [];
    for (const status of ["active", "trialing", "past_due"]) {
      const list = await stripe.subscriptions.list({ customer: customerId, status: status as any, limit: 10 });
      openSubs.push(...list.data);
    }

    if (openSubs.length === 0) {
      throw new Error("No active subscription found");
    }

    let latestPeriodEnd = 0;
    const cancelledIds: string[] = [];
    for (const sub of openSubs) {
      if (sub.cancel_at_period_end) { // already scheduled
        latestPeriodEnd = Math.max(latestPeriodEnd, sub.current_period_end);
        cancelledIds.push(sub.id);
        continue;
      }
      const cancelled = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      latestPeriodEnd = Math.max(latestPeriodEnd, cancelled.current_period_end);
      cancelledIds.push(sub.id);
    }

    await supabaseClient.from("subscription_events").insert({
      user_id: user.id,
      event_type: "cancellation_requested",
      stripe_subscription_id: cancelledIds[0],
      current_period_end: new Date(latestPeriodEnd * 1000).toISOString(),
      metadata: {
        membership_tier: profile?.membership_tier ?? null,
        cancelled_at: new Date().toISOString(),
        all_subscription_ids: cancelledIds,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription will cancel at end of billing period",
        cancel_at: new Date(latestPeriodEnd * 1000).toISOString(),
        subscriptions: cancelledIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("stripe-cancel-subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
