import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Maps checkout metadata types to affiliate purchase types
const getPurchaseType = (metadata: Record<string, string>): string | null => {
  if (metadata.type === 'meditation_membership') return 'meditation';
  if (metadata.type === 'music_membership') return 'music';
  if (metadata.plan_type) {
    // Healing, transformation, certification, etc.
    if (metadata.days) return 'healing';
    if (metadata.program_id || metadata.variation_id) return 'transformation';
    return 'membership';
  }
  if (metadata.session_type_id) return 'session';
  if (metadata.course_id) return 'course';
  if (metadata.order_id || metadata.product_id) return 'healing_audio'; // Shop orders
  if (metadata.package_type) {
    // Custom meditation or affirmation
    if (metadata.service_type) return 'meditation';
    return 'course';
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not configured");
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        logStep("ERROR: Missing stripe-signature header");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        logStep("ERROR: Signature verification failed", { error: err instanceof Error ? err.message : err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // No webhook secret - parse event directly (less secure, for development)
      logStep("WARNING: No STRIPE_WEBHOOK_SECRET configured, skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }

    logStep("Received event", { type: event.type, id: event.id });

    // Handle checkout.session.completed events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Processing checkout session", { 
        sessionId: session.id, 
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        metadata: session.metadata
      });

      // Only process paid sessions
      if (session.payment_status !== "paid") {
        logStep("Session not paid, skipping", { paymentStatus: session.payment_status });
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const userId = session.metadata?.user_id;
      const amountTotal = session.amount_total; // In cents

      if (!userId) {
        logStep("No user_id in metadata, skipping affiliate processing");
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (!amountTotal || amountTotal <= 0) {
        logStep("No valid amount, skipping", { amountTotal });
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Determine purchase type from metadata
      const purchaseType = getPurchaseType(session.metadata || {});
      if (!purchaseType) {
        logStep("Could not determine purchase type from metadata", { metadata: session.metadata });
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Convert cents to dollars for the commission calculation
      const purchaseAmountUsd = amountTotal / 100;
      const purchaseId = `stripe_${session.id}`;

      logStep("Processing affiliate commission", { userId, purchaseType, purchaseAmountUsd, purchaseId });

      // Check if commission already processed
      const { data: existing } = await supabaseAdmin
        .from('affiliate_earnings')
        .select('id')
        .eq('purchase_id', purchaseId)
        .maybeSingle();

      if (existing) {
        logStep("Commission already processed for this purchase", { purchaseId });
        return new Response(JSON.stringify({ received: true, processed: false, reason: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get user's profile to check if they were referred
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('referred_by')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.referred_by) {
        logStep("User has no referrer, skipping commission", { userId });
        return new Response(JSON.stringify({ received: true, processed: false, reason: "no_referrer" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const referrerId = profile.referred_by;
      logStep("Found referrer", { referrerId });

      // Calculate commission (30% - same as existing logic)
      const commissionRate = 0.30;
      const commissionSHC = Math.floor(purchaseAmountUsd * commissionRate);

      logStep("Calculated commission", { commissionRate, commissionSHC, purchaseAmountUsd });

      // Create affiliate earning record
      const { error: earningError } = await supabaseAdmin
        .from('affiliate_earnings')
        .insert({
          affiliate_user_id: referrerId,
          referred_user_id: userId,
          purchase_type: purchaseType,
          purchase_amount: purchaseAmountUsd,
          purchase_id: purchaseId,
          commission_rate: commissionRate,
          commission_shc: commissionSHC,
          status: 'pending',
        });

      if (earningError) {
        logStep("Error creating earning record", earningError);
        throw earningError;
      }

      // Update referrer's total affiliate earnings in profile
      const { data: referrerProfile } = await supabaseAdmin
        .from('profiles')
        .select('total_affiliate_earnings')
        .eq('user_id', referrerId)
        .single();

      if (referrerProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            total_affiliate_earnings: Number(referrerProfile.total_affiliate_earnings || 0) + commissionSHC
          })
          .eq('user_id', referrerId);
      }

      // Credit the SHC to the referrer's balance
      const { data: referrerBalance } = await supabaseAdmin
        .from('user_balances')
        .select('balance, total_earned')
        .eq('user_id', referrerId)
        .single();

      if (referrerBalance) {
        await supabaseAdmin
          .from('user_balances')
          .update({
            balance: Number(referrerBalance.balance) + commissionSHC,
            total_earned: Number(referrerBalance.total_earned) + commissionSHC
          })
          .eq('user_id', referrerId);

        // Record the transaction
        await supabaseAdmin
          .from('shc_transactions')
          .insert({
            user_id: referrerId,
            type: 'earned',
            amount: commissionSHC,
            description: `Affiliate commission from ${purchaseType} (Stripe)`,
            status: 'completed'
          });

        // Mark the earning as paid
        await supabaseAdmin
          .from('affiliate_earnings')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('purchase_id', purchaseId)
          .eq('status', 'pending');

        logStep("Commission processed successfully", { referrerId, commissionSHC, purchaseType });
      } else {
        logStep("Referrer has no balance record, creating one");
        await supabaseAdmin
          .from('user_balances')
          .insert({
            user_id: referrerId,
            balance: commissionSHC,
            total_earned: commissionSHC,
            total_spent: 0
          });

        await supabaseAdmin
          .from('shc_transactions')
          .insert({
            user_id: referrerId,
            type: 'earned',
            amount: commissionSHC,
            description: `Affiliate commission from ${purchaseType} (Stripe)`,
            status: 'completed'
          });

        await supabaseAdmin
          .from('affiliate_earnings')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('purchase_id', purchaseId)
          .eq('status', 'pending');

        logStep("Commission processed successfully (new balance created)", { referrerId, commissionSHC });
      }

      return new Response(JSON.stringify({ 
        received: true, 
        processed: true,
        commissionSHC,
        referrerId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle subscription payments (for recurring commissions if needed)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Only process subscription invoices (not the first payment which is handled by checkout.session.completed)
      if (invoice.billing_reason === "subscription_cycle") {
        logStep("Recurring subscription payment", { 
          invoiceId: invoice.id, 
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid
        });
        // Future: implement recurring commission logic here if needed
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
