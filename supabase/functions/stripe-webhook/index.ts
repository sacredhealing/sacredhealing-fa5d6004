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

// Price ID to product info mapping for revenue tracking
const PRICE_TO_PRODUCT: Record<string, { type: string; name: string }> = {
  // Stargate Transformation Online - €25/month
  'price_1Os1suAPsnbrivP0PxsynQAO': { type: 'stargate', name: 'Stargate Transformation Online' },
  // Stargate Membership - $25/month
  'price_1SZqNuAPsnbrivP0ZygF4M88': { type: 'stargate', name: 'Stargate Membership' },
  // Meditation Membership Monthly - €4.99/month
  'price_1SaGNbAPsnbrivP0DBsBGh9V': { type: 'meditation', name: 'Meditation Membership Monthly' },
  // Music Membership Monthly - €4.99/month
  'price_1SaGG4APsnbrivP0nnavK58y': { type: 'music', name: 'Music Membership Monthly' },
};

// Maps checkout metadata types to affiliate purchase types
const getPurchaseType = (metadata: Record<string, string>): string | null => {
  if (metadata.type === 'meditation_membership') return 'meditation';
  if (metadata.type === 'music_membership') return 'music';
  if (metadata.type === 'stargate_membership') return 'stargate';
  if (metadata.plan_type) {
    if (metadata.days) return 'healing';
    if (metadata.program_id || metadata.variation_id) return 'transformation';
    return 'membership';
  }
  if (metadata.session_type_id) return 'session';
  if (metadata.course_id) return 'course';
  if (metadata.order_id || metadata.product_id) return 'shop';
  if (metadata.package_type) {
    if (metadata.service_type) return 'meditation';
    return 'affirmation';
  }
  return null;
};

// Get a human-readable product name from metadata
const getProductName = (metadata: Record<string, string> | null): string => {
  if (!metadata) return 'Stripe Purchase';
  
  if (metadata.type === 'meditation_membership') return 'Meditation Membership';
  if (metadata.type === 'music_membership') return 'Music Membership';
  if (metadata.type === 'stargate_membership') return 'Stargate Membership';
  if (metadata.plan_type) {
    if (metadata.days) return `Healing Package (${metadata.days} days)`;
    return `Membership - ${metadata.plan_type}`;
  }
  if (metadata.session_type_id) return 'Private Session';
  if (metadata.course_id) return 'Course Enrollment';
  if (metadata.product_id) return 'Shop Purchase';
  if (metadata.package_type) {
    if (metadata.service_type) return `Custom Meditation - ${metadata.package_type}`;
    return `Affirmation - ${metadata.package_type}`;
  }
  return 'Stripe Purchase';
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
        currency: session.currency,
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

      const amountTotal = session.amount_total;
      if (!amountTotal || amountTotal <= 0) {
        logStep("No valid amount, skipping", { amountTotal });
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Convert cents to base currency
      const purchaseAmount = amountTotal / 100;
      const currency = session.currency?.toUpperCase() || 'EUR';
      const purchaseType = getPurchaseType(session.metadata || {}) || 'other';
      const productName = getProductName(session.metadata);
      const customerEmail = session.customer_email || (session.customer_details as { email?: string })?.email;
      const stripePaymentId = session.id;

      // Record revenue (check for duplicate first)
      const { data: existingRevenue } = await supabaseAdmin
        .from('revenue_records')
        .select('id')
        .eq('stripe_payment_id', stripePaymentId)
        .maybeSingle();

      if (!existingRevenue) {
        const { error: revenueError } = await supabaseAdmin
          .from('revenue_records')
          .insert({
            product_type: purchaseType,
            product_name: productName,
            amount_usd: purchaseAmount,
            payment_method: 'stripe',
            customer_email: customerEmail,
            stripe_payment_id: stripePaymentId,
            notes: `Initial payment (${currency})`
          });

        if (revenueError) {
          logStep("Error recording revenue", revenueError);
        } else {
          logStep("Revenue recorded", { amount: purchaseAmount, currency, type: purchaseType, product: productName });
        }
      } else {
        logStep("Revenue already recorded for this payment", { stripePaymentId });
      }

      // Process affiliate commission if user was referred
      const userId = session.metadata?.user_id;
      if (userId) {
        const purchaseId = `stripe_${session.id}`;

        // Check if commission already processed
        const { data: existingCommission } = await supabaseAdmin
          .from('affiliate_earnings')
          .select('id')
          .eq('purchase_id', purchaseId)
          .maybeSingle();

        if (!existingCommission) {
          // Get user's profile to check if they were referred
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('referred_by')
            .eq('user_id', userId)
            .single();

          if (profile?.referred_by) {
            const referrerId = profile.referred_by;
            const commissionRate = 0.30;
            const commissionSHC = Math.floor(purchaseAmount * commissionRate);

            logStep("Processing affiliate commission", { referrerId, commissionSHC, purchaseType });

            // Create affiliate earning record
            await supabaseAdmin
              .from('affiliate_earnings')
              .insert({
                affiliate_user_id: referrerId,
                referred_user_id: userId,
                purchase_type: purchaseType,
                purchase_amount: purchaseAmount,
                purchase_id: purchaseId,
                commission_rate: commissionRate,
                commission_shc: commissionSHC,
                status: 'pending',
              });

            // Update referrer's total affiliate earnings
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

            // Credit SHC to referrer's balance
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
            } else {
              await supabaseAdmin
                .from('user_balances')
                .insert({
                  user_id: referrerId,
                  balance: commissionSHC,
                  total_earned: commissionSHC,
                  total_spent: 0
                });
            }

            // Record transaction and mark earning as paid
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

            logStep("Commission processed", { referrerId, commissionSHC });
          }
        }
      }

      return new Response(JSON.stringify({ received: true, processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle recurring subscription payments
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Only process subscription renewals (not initial payments)
      if (invoice.billing_reason === "subscription_cycle") {
        const amountPaid = invoice.amount_paid / 100;
        const currency = invoice.currency?.toUpperCase() || 'EUR';
        const stripePaymentId = invoice.id;
        const customerEmail = invoice.customer_email;

        // Get price info from line items
        const lineItem = invoice.lines?.data?.[0];
        const priceId = (lineItem?.price as { id?: string })?.id;
        const productInfo = priceId && PRICE_TO_PRODUCT[priceId] 
          ? PRICE_TO_PRODUCT[priceId] 
          : { type: 'subscription', name: lineItem?.description || 'Subscription Renewal' };

        logStep("Processing recurring payment", { 
          invoiceId: invoice.id, 
          amount: amountPaid,
          currency,
          priceId,
          productType: productInfo.type,
          productName: productInfo.name
        });

        // Check for duplicate
        const { data: existingRevenue } = await supabaseAdmin
          .from('revenue_records')
          .select('id')
          .eq('stripe_payment_id', stripePaymentId)
          .maybeSingle();

        if (!existingRevenue) {
          const { error: revenueError } = await supabaseAdmin
            .from('revenue_records')
            .insert({
              product_type: productInfo.type,
              product_name: productInfo.name,
              amount_usd: amountPaid,
              payment_method: 'stripe',
              customer_email: customerEmail,
              stripe_payment_id: stripePaymentId,
              notes: `Recurring payment (${currency})`
            });

          if (revenueError) {
            logStep("Error recording recurring revenue", revenueError);
          } else {
            logStep("Recurring revenue recorded", { 
              amount: amountPaid, 
              currency, 
              type: productInfo.type,
              product: productInfo.name 
            });
          }
        } else {
          logStep("Recurring revenue already recorded", { stripePaymentId });
        }
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
