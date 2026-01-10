import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    const SITE_URL = Deno.env.get("SITE_URL") || Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "http://localhost:5173";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    // Auth (use user token)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) return json(401, { error: "Unauthorized" });

    const user = auth.user;
    const body = await req.json();

    // plan: 'lifetime' | 'monthly' | 'single'
    const plan = (body?.plan ?? "monthly") as string;
    const ref = (body?.ref ?? null) as string | null; // affiliate ref code
    const toolSlug = "creative-soul";

    // store affiliate attribution (best-effort)
    if (ref) {
      await supabase.from("affiliate_attribution").upsert(
        { user_id: user.id, ref_code: ref, last_seen_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      await supabase.from("affiliate_events").insert({
        ref_code: ref,
        user_id: user.id,
        tool_slug: toolSlug,
        event_type: "checkout",
      });
    }

    const PRICE_LIFETIME = Deno.env.get("STRIPE_PRICE_LIFETIME_149")!;
    const PRICE_MONTHLY = Deno.env.get("STRIPE_PRICE_MONTHLY_1499")!;
    const PRICE_SINGLE = Deno.env.get("STRIPE_PRICE_SINGLE_999")!;

    let priceId = PRICE_MONTHLY;
    let mode: "payment" | "subscription" = "subscription";

    if (plan === "lifetime") {
      priceId = PRICE_LIFETIME;
      mode = "payment";
    } else if (plan === "monthly") {
      priceId = PRICE_MONTHLY;
      mode = "subscription";
    } else if (plan === "single") {
      priceId = PRICE_SINGLE;
      mode = "payment";
    } else {
      return json(400, { error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/creative-soul-meditation-tool?payment=success`,
      cancel_url: `${SITE_URL}/creative-soul-meditation-landing?payment=cancel`,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        plan,
        ref: ref ?? "",
        tool_slug: toolSlug,
      },
    });

    return json(200, { id: session.id, url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return json(500, { error: "Checkout session failed", details: String(err) });
  }
});

