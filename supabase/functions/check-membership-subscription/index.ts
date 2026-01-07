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

// Map Stripe product IDs to tier slugs
const PRODUCT_TO_TIER: Record<string, string> = {
  'prod_TjLbPzCXMYBGOj': 'premium-monthly',
  'prod_TjLb4I9DVWijtL': 'premium-annual',
  'prod_TjLb4aw139HcPU': 'lifetime',
};

// Map admin-granted tier names to tier slugs
const ADMIN_TIER_MAP: Record<string, string> = {
  'premium_monthly': 'premium-monthly',
  'premium_annual': 'premium-annual',
  'lifetime': 'lifetime',
};

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

    // FIRST: Check for admin-granted membership access (bypasses Stripe entirely)
    const { data: adminAccess } = await supabaseClient
      .from('admin_granted_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('access_type', 'membership')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)
      .single();

    if (adminAccess) {
      const adminTier = ADMIN_TIER_MAP[adminAccess.tier || ''] || adminAccess.tier || 'premium-monthly';
      logStep("Admin-granted access found", { tier: adminTier, expiresAt: adminAccess.expires_at });
      
      return new Response(JSON.stringify({
        subscribed: true,
        tier: adminTier,
        subscription_end: adminAccess.expires_at,
        admin_granted: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get the product ID to determine tier
      const productId = subscription.items.data[0].price.product as string;
      tierSlug = PRODUCT_TO_TIER[productId] || 'premium-monthly';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        productId,
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
      // Get tier ID from membership_tiers
      const { data: tierData } = await supabaseClient
        .from('membership_tiers')
        .select('id')
        .eq('slug', tierSlug)
        .single();

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
