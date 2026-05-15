import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json(); // action: "cancel" | "reactivate"

    // Get stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, membership_tier")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
      }
    }
    if (!customerId) throw new Error("No Stripe customer found");

    // Get active subscription
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subs.data.length === 0) throw new Error("No active subscription found");

    const sub = subs.data[0];

    if (action === "cancel") {
      // Cancel at period end (not immediate)
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      return new Response(JSON.stringify({ success: true, action: "cancel", message: "Subscription will cancel at period end" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "reactivate") {
      // Undo the cancel
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      return new Response(JSON.stringify({ success: true, action: "reactivate", message: "Subscription reactivated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Invalid action");
    }

  } catch (err) {
    console.error("Cancel error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
