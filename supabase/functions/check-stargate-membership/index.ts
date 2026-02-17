import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-STARGATE-MEMBERSHIP] ${step}${detailsStr}`);
};

// Stargate Membership Price ID
const STARGATE_PRICE_ID = 'price_1SZqNuAPsnbrivP0ZygF4M88';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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

    // Check if user is admin - admins get full access
    const { data: isAdminData } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (isAdminData === true) {
      logStep("Admin user detected - granting full access");
      return new Response(JSON.stringify({
        hasStargateMembership: true,
        isAdmin: true,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user is manually added to stargate_community_members
    const { data: manualMember } = await supabaseClient
      .from('stargate_community_members')
      .select('id, added_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (manualMember) {
      logStep("User is manually added to Stargate community");
      return new Response(JSON.stringify({
        hasStargateMembership: true,
        isManualAdd: true,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        hasStargateMembership: false,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Check if any subscription is for Stargate Membership (check by price ID)
    let hasStargateMembership = false;
    let subscriptionEnd: string | null = null;

    for (const sub of subscriptions.data) {
      const priceId = sub.items.data[0]?.price?.id;
      if (priceId === STARGATE_PRICE_ID) {
        hasStargateMembership = true;
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        logStep("Active Stargate membership found", { subscriptionId: sub.id, subscriptionEnd });
        break;
      }
    }

    if (!hasStargateMembership) {
      logStep("No active Stargate membership");
    }

    return new Response(JSON.stringify({
      hasStargateMembership,
      subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
