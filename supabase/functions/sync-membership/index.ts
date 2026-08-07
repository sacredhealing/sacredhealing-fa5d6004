// Reconciles a signed-in user's membership tier directly from Stripe.
// Self-healing: works even if a webhook event was missed or mis-routed.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEMBERSHIP_PRICE_TO_SLUG: Record<string, string> = {
  "price_1T8o3YAPsnbrivP056UJqOP7": "prana-flow",
  "price_1T8o3jAPsnbrivP0uZKR33EY": "siddha-quantum",
  "price_1T8o3kAPsnbrivP0m8bOzl3M": "akasha-infinity",
  "price_1TsTQbAPsnbrivP0X0Obb5YN": "akasha-infinity",
};

const TIER_RANK: Record<string, number> = {
  "free": 0,
  "prana-flow": 1,
  "siddha-quantum": 2,
  "akasha-infinity": 3,
};

const log = (step: string, details?: unknown) =>
  console.log(`[SYNC-MEMBERSHIP] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr) throw new Error(`Authentication error: ${userErr.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Collect every Stripe customer that shares this email (Apple Pay / guest
    // checkouts often create a fresh customer object).
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    log("Customers found", { count: customers.data.length, userId: user.id });

    let bestSlug: string | null = null;
    let bestExpires: string | null = null;
    let bestSubId: string | null = null;
    let bestCustomerId: string | null = null;

    const consider = (slug: string, expires: string | null, subId: string | null, customerId: string | null) => {
      if (!bestSlug || TIER_RANK[slug] > TIER_RANK[bestSlug]) {
        bestSlug = slug;
        bestExpires = expires;
        bestSubId = subId;
        bestCustomerId = customerId;
      }
    };

    for (const customer of customers.data) {
      // Active / trialing subscriptions → recurring tiers
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 20 });
      for (const sub of subs.data) {
        if (!["active", "trialing", "past_due"].includes(sub.status)) continue;
        const priceId = sub.items.data[0]?.price?.id ?? "";
        const slug = MEMBERSHIP_PRICE_TO_SLUG[priceId];
        if (!slug) continue;
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        consider(slug, periodEnd ? new Date(periodEnd * 1000).toISOString() : null, sub.id, customer.id);
      }

      // One-time lifetime purchases (Akasha-Infinity) → paid checkout sessions
      const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 50 });
      for (const s of sessions.data) {
        if (s.mode !== "payment" || s.payment_status !== "paid") continue;
        try {
          const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 });
          for (const li of items.data) {
            const pid = (li.price as { id?: string } | null)?.id;
            const slug = pid ? MEMBERSHIP_PRICE_TO_SLUG[pid] : null;
            if (slug) consider(slug, null, null, customer.id); // lifetime: never expires
          }
        } catch (_e) { /* ignore individual session failures */ }
      }
    }

    if (!bestSlug) {
      log("No paid membership found in Stripe", { userId: user.id });
      return new Response(JSON.stringify({ tier: null, synced: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: tierRow } = await admin
      .from("membership_tiers").select("id").eq("slug", bestSlug).maybeSingle();
    if (!tierRow?.id) throw new Error(`Unknown membership tier slug: ${bestSlug}`);

    const { error: upsertErr } = await admin.from("user_memberships").upsert({
      user_id: user.id,
      tier_id: tierRow.id,
      status: "active",
      stripe_subscription_id: bestSubId,
      stripe_customer_id: bestCustomerId,
      expires_at: bestExpires,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (upsertErr) throw new Error(`user_memberships upsert failed: ${upsertErr.message}`);

    await admin.from("profiles").update({ membership_tier: bestSlug }).eq("user_id", user.id);

    log("Membership synced", { userId: user.id, tier: bestSlug, expires: bestExpires });
    return new Response(JSON.stringify({ tier: bestSlug, expires_at: bestExpires, synced: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
