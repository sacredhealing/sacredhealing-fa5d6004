import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });

    const { data: profile } = await supabaseClient
      .from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId: string | null = profile?.stripe_customer_id ?? null;

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }
    if (!customerId) throw new Error("No Stripe customer found for this user");

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
    const scheduled = subs.data.filter((s) => s.cancel_at_period_end);
    if (scheduled.length === 0) throw new Error("No cancellation scheduled — nothing to reactivate");

    const reactivated: string[] = [];
    for (const sub of scheduled) {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      reactivated.push(sub.id);
    }

    await supabaseClient.from("subscription_events").insert({
      user_id: user.id,
      event_type: "cancellation_reverted",
      stripe_subscription_id: reactivated[0],
      metadata: { reactivated_at: new Date().toISOString(), all_subscription_ids: reactivated },
    });

    return new Response(JSON.stringify({ success: true, subscriptions: reactivated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-reactivate-subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
