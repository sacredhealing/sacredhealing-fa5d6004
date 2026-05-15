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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, membership_tier, full_name, created_at")
      .eq("id", user.id)
      .single();

    const tier = profile?.membership_tier ?? "free";
    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
      }
    }

    if (!customerId) {
      return new Response(JSON.stringify({
        tier: "free", status: "active", memberSince: profile?.created_at ?? null,
        periodEnd: null, daysRemaining: null, cancelAtPeriodEnd: false, invoices: [], isLifetime: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId, status: "active", limit: 1,
    });

    const invoiceList = await stripe.invoices.list({ customer: customerId, limit: 5 });
    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id, number: inv.number, amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(), date: inv.created,
      status: inv.status, pdf: inv.invoice_pdf, hostedUrl: inv.hosted_invoice_url,
    }));

    const isLifetime = tier === "akasha-infinity";

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({
        tier, status: isLifetime ? "lifetime" : "inactive",
        memberSince: profile?.created_at ?? null, periodEnd: null,
        daysRemaining: null, cancelAtPeriodEnd: false, invoices, isLifetime,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sub = subscriptions.data[0];
    const periodEnd = sub.current_period_end;
    const now = Math.floor(Date.now() / 1000);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / 86400));

    return new Response(JSON.stringify({
      tier, status: sub.status, memberSince: profile?.created_at ?? null,
      periodEnd, daysRemaining, cancelAtPeriodEnd: sub.cancel_at_period_end,
      invoices, isLifetime: false, subscriptionId: sub.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Details error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
