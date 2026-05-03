import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-MEMBERSHIP-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe price IDs to tier slugs (most reliable — matches src/config/tierCheckout.ts)
const PRICE_TO_TIER: Record<string, string> = {
  'price_1T8o3YAPsnbrivP056UJqOP7': 'premium-monthly',   // Prana-Flow €19/mo
  'price_1T8o3jAPsnbrivP0uZKR33EY': 'siddha-quantum',    // Siddha-Quantum €45/mo
  'price_1T8o3kAPsnbrivP0m8bOzl3M': 'akasha-infinity',   // Akasha-Infinity €1111
};

// Map Stripe product IDs to tier slugs (fallback)
const PRODUCT_TO_TIER: Record<string, string> = {
  'prod_TjLbPzCXMYBGOj': 'premium-monthly',
  'prod_TjLb4I9DVWijtL': 'premium-annual',
  'prod_TjLb4aw139HcPU': 'lifetime',
  'prod_U727beGFLeQZUc': 'premium-monthly',   // Prana-Flow
  'prod_U7271mhrwFlfTX': 'siddha-quantum',    // Siddha-Quantum
  'prod_U727siddhaInfinity': 'akasha-infinity',
};

// Map admin-granted tier column values → canonical tier slugs (must match getTierRank() in app)
const ADMIN_TIER_MAP: Record<string, string> = {
  premium_monthly: "premium-monthly",
  premium_annual: "premium-annual",
  prana_flow_monthly: "premium-monthly",
  prana_flow_annual: "premium-annual",
  siddha_quantum: "siddha-quantum",
  "siddha-quantum": "siddha-quantum",
  lifetime: "lifetime",
  akasha_infinity: "akasha-infinity",
  akasha_infinity_lifetime: "akasha-infinity",
  "akasha-infinity": "akasha-infinity",
};

function slugFromAdminTier(raw: string | null): string {
  if (!raw) return "premium-monthly";
  const k = raw.trim();
  if (ADMIN_TIER_MAP[k]) return ADMIN_TIER_MAP[k];
  const underscored = k.replace(/-/g, "_");
  if (ADMIN_TIER_MAP[underscored]) return ADMIN_TIER_MAP[underscored];
  return k;
}

/** Rank must stay aligned with src/lib/tierAccess.ts getTierRank */
function tierSlugRank(slug: string): number {
  const s = slug.toLowerCase();
  if (s.includes("akasha") || s.includes("life")) return 3;
  if (s.includes("siddha")) return 2;
  if (
    s.includes("premium") ||
    s.includes("prana") ||
    s.includes("month") ||
    s.includes("annual") ||
    s.includes("year")
  )
    return 1;
  return 0;
}

function membershipTableSlugForTier(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("akasha") || s.includes("life")) return "lifetime";
  if (s.includes("siddha")) return "siddha-quantum-monthly";
  if (s.includes("annual") || s.includes("year")) return "premium-annual";
  if (s.includes("premium") || s.includes("prana") || s.includes("month")) return "premium-monthly";
  return "free";
}

async function syncGrantedMembershipRecord(
  supabaseClient: any,
  userId: string,
  tierSlug: string,
  grantedAt: string | null,
  expiresAt: string | null,
) {
  const membershipSlug = membershipTableSlugForTier(tierSlug);
  if (membershipSlug === "free") return;

  const { data: tierRow, error: tierError } = await supabaseClient
    .from("membership_tiers")
    .select("id")
    .eq("slug", membershipSlug)
    .maybeSingle();

  if (tierError || !tierRow?.id) {
    logStep("Unable to resolve membership tier for admin grant", {
      userId,
      tierSlug,
      membershipSlug,
      error: tierError?.message,
    });
    return;
  }

  const { error: upsertError } = await supabaseClient
    .from("user_memberships")
    .upsert(
      {
        user_id: userId,
        tier_id: tierRow.id,
        status: "active",
        starts_at: grantedAt ?? new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    logStep("Error syncing admin-granted membership", {
      userId,
      membershipSlug,
      error: upsertError.message,
    });
    return;
  }

  logStep("Synced admin-granted membership", { userId, membershipSlug });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin - admins get full lifetime access to everything
    const { data: isAdminData } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (isAdminData === true) {
      logStep("Admin user detected - granting full lifetime access");
      return new Response(JSON.stringify({
        subscribed: true,
        tier: 'lifetime',
        subscription_end: null,
        admin_granted: true,
        is_admin: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // FIRST: Admin-granted membership (bypasses Stripe). If multiple rows, use highest tier rank.
    const { data: adminRows } = await supabaseClient
      .from("admin_granted_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("access_type", "membership")
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()");

    if (adminRows && adminRows.length > 0) {
      let best = adminRows[0];
      let bestSlug = slugFromAdminTier(best.tier);
      let bestRank = tierSlugRank(bestSlug);
      for (let i = 1; i < adminRows.length; i++) {
        const row = adminRows[i];
        const slug = slugFromAdminTier(row.tier);
        const r = tierSlugRank(slug);
        const rowTime = new Date(row.granted_at || 0).getTime();
        const bestTime = new Date(best.granted_at || 0).getTime();
        if (r > bestRank || (r === bestRank && rowTime > bestTime)) {
          best = row;
          bestSlug = slug;
          bestRank = r;
        }
      }
      logStep("Admin-granted access found", { tier: bestSlug, expiresAt: best.expires_at, rows: adminRows.length });

      await syncGrantedMembershipRecord(
        supabaseClient,
        user.id,
        bestSlug,
        best.granted_at ?? null,
        best.expires_at ?? null,
      );

      return new Response(
        JSON.stringify({
          subscribed: true,
          tier: bestSlug,
          subscription_end: best.expires_at,
          admin_granted: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: 'free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let hasActiveSub = false;
    let tierSlug = 'free';
    let subscriptionEnd = null;

    if (subscriptions.data.length > 0) {
      hasActiveSub = true;
      // Pick the highest-rank subscription if multiple exist
      let chosen = subscriptions.data[0];
      let chosenSlug = 'premium-monthly';
      let chosenRank = -1;
      for (const sub of subscriptions.data) {
        const priceId = sub.items.data[0].price.id as string;
        const productId = sub.items.data[0].price.product as string;
        const slug = PRICE_TO_TIER[priceId] || PRODUCT_TO_TIER[productId] || 'premium-monthly';
        const rank = tierSlugRank(slug);
        if (rank > chosenRank) {
          chosenRank = rank;
          chosen = sub;
          chosenSlug = slug;
        }
      }
      tierSlug = chosenSlug;
      subscriptionEnd = new Date(chosen.current_period_end * 1000).toISOString();
      logStep("Active subscription found", {
        subscriptionId: chosen.id,
        priceId: chosen.items.data[0].price.id,
        productId: chosen.items.data[0].price.product,
        tierSlug,
        endDate: subscriptionEnd
      });
    } else {
      // Check for one-time purchases (lifetime)
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      });

      for (const pi of paymentIntents.data) {
        if (pi.status === 'succeeded' && pi.metadata?.tier_slug === 'lifetime') {
          hasActiveSub = true;
          tierSlug = 'lifetime';
          subscriptionEnd = null; // Lifetime has no end
          logStep("Lifetime purchase found", { paymentIntentId: pi.id });
          break;
        }
      }

      // Also check checkout sessions for lifetime purchases
      if (!hasActiveSub) {
        const sessions = await stripe.checkout.sessions.list({
          customer: customerId,
          limit: 100,
        });

        for (const session of sessions.data) {
          if (session.payment_status === 'paid' && session.metadata?.tier_slug === 'lifetime') {
            hasActiveSub = true;
            tierSlug = 'lifetime';
            subscriptionEnd = null;
            logStep("Lifetime checkout session found", { sessionId: session.id });
            break;
          }
        }
      }
    }

    // Update user_memberships table
    if (hasActiveSub) {
      // Get tier ID from membership_tiers (use the membership-table slug variant)
      const membershipTableSlug = membershipTableSlugForTier(tierSlug);
      const { data: tierData } = await supabaseClient
        .from('membership_tiers')
        .select('id')
        .eq('slug', membershipTableSlug)
        .maybeSingle();

      if (tierData) {
        // Upsert membership record
        const { error: upsertError } = await supabaseClient
          .from('user_memberships')
          .upsert({
            user_id: user.id,
            tier_id: tierData.id,
            status: 'active',
            stripe_customer_id: customerId,
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting membership", { error: upsertError.message });
        } else {
          logStep("Membership record updated");
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: tierSlug,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
