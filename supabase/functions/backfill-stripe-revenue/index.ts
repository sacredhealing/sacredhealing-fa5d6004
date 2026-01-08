import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BACKFILL-STRIPE] ${step}${detailsStr}`);
};

// Price ID to product info mapping
const PRICE_TO_PRODUCT: Record<string, { type: string; name: string }> = {
  'price_1Os1suAPsnbrivP0PxsynQAO': { type: 'stargate', name: 'Stargate Transformation Online' },
  'price_1SZqNuAPsnbrivP0ZygF4M88': { type: 'stargate', name: 'Stargate Membership' },
  'price_1SaGNbAPsnbrivP0DBsBGh9V': { type: 'meditation', name: 'Meditation Membership Monthly' },
  'price_1SaGG4APsnbrivP0nnavK58y': { type: 'music', name: 'Music Membership Monthly' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not configured");
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Verify admin user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // Check if user is admin
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    logStep("Starting Stripe revenue backfill");
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch all successful checkout sessions
    logStep("Fetching checkout sessions...");
    let hasMoreSessions = true;
    let sessionCursor: string | undefined;
    
    while (hasMoreSessions) {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        starting_after: sessionCursor,
      });

      for (const session of sessions.data) {
        if (session.payment_status !== 'paid' || !session.amount_total || session.amount_total <= 0) {
          continue;
        }

        const stripePaymentId = session.id;
        
        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('revenue_records')
          .select('id')
          .eq('stripe_payment_id', stripePaymentId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const amount = session.amount_total / 100;
        const currency = session.currency?.toUpperCase() || 'EUR';
        const customerEmail = session.customer_email || (session.customer_details as { email?: string })?.email;
        
        // Determine product type from metadata or line items
        let productType = 'other';
        let productName = 'Stripe Checkout';
        
        if (session.metadata) {
          if (session.metadata.type === 'meditation_membership') {
            productType = 'meditation';
            productName = 'Meditation Membership';
          } else if (session.metadata.type === 'music_membership') {
            productType = 'music';
            productName = 'Music Membership';
          } else if (session.metadata.type === 'stargate_membership') {
            productType = 'stargate';
            productName = 'Stargate Membership';
          } else if (session.metadata.plan_type) {
            productType = 'membership';
            productName = `Membership - ${session.metadata.plan_type}`;
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('revenue_records')
          .insert({
            product_type: productType,
            product_name: productName,
            amount_usd: amount,
            payment_method: 'stripe',
            customer_email: customerEmail,
            stripe_payment_id: stripePaymentId,
            source: 'backfill',
            notes: `Backfilled from checkout session (${currency})`,
            created_at: new Date(session.created * 1000).toISOString()
          });

        if (insertError) {
          logStep("Error inserting checkout session", { error: insertError.message, sessionId: session.id });
          errors++;
        } else {
          inserted++;
        }
      }

      hasMoreSessions = sessions.has_more;
      if (sessions.data.length > 0) {
        sessionCursor = sessions.data[sessions.data.length - 1].id;
      }
    }

    // Fetch all successful invoices
    logStep("Fetching invoices...");
    let hasMoreInvoices = true;
    let invoiceCursor: string | undefined;
    
    while (hasMoreInvoices) {
      const invoices = await stripe.invoices.list({
        limit: 100,
        status: 'paid',
        starting_after: invoiceCursor,
      });

      for (const invoice of invoices.data) {
        if (!invoice.amount_paid || invoice.amount_paid <= 0) {
          continue;
        }

        const stripePaymentId = invoice.id;
        
        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('revenue_records')
          .select('id')
          .eq('stripe_payment_id', stripePaymentId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const amount = invoice.amount_paid / 100;
        const currency = invoice.currency?.toUpperCase() || 'EUR';
        const customerEmail = invoice.customer_email;
        
        // Get product info from line items
        const lineItem = invoice.lines?.data?.[0];
        const priceId = (lineItem?.price as { id?: string })?.id;
        const productInfo = priceId && PRICE_TO_PRODUCT[priceId] 
          ? PRICE_TO_PRODUCT[priceId] 
          : { type: 'subscription', name: lineItem?.description || 'Subscription Payment' };

        const isRecurring = invoice.billing_reason === 'subscription_cycle';

        const { error: insertError } = await supabaseAdmin
          .from('revenue_records')
          .insert({
            product_type: productInfo.type,
            product_name: productInfo.name,
            amount_usd: amount,
            payment_method: 'stripe',
            customer_email: customerEmail,
            stripe_payment_id: stripePaymentId,
            source: 'backfill',
            notes: `Backfilled from invoice - ${isRecurring ? 'recurring' : 'initial'} (${currency})`,
            created_at: new Date((invoice.created || invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000).toISOString()
          });

        if (insertError) {
          logStep("Error inserting invoice", { error: insertError.message, invoiceId: invoice.id });
          errors++;
        } else {
          inserted++;
        }
      }

      hasMoreInvoices = invoices.has_more;
      if (invoices.data.length > 0) {
        invoiceCursor = invoices.data[invoices.data.length - 1].id;
      }
    }

    // Fetch payment intents that may not be linked to checkout sessions
    logStep("Fetching payment intents...");
    let hasMorePayments = true;
    let paymentCursor: string | undefined;
    
    while (hasMorePayments) {
      const payments = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: paymentCursor,
      });

      for (const payment of payments.data) {
        if (payment.status !== 'succeeded' || !payment.amount_received || payment.amount_received <= 0) {
          continue;
        }

        const stripePaymentId = payment.id;
        
        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('revenue_records')
          .select('id')
          .eq('stripe_payment_id', stripePaymentId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const amount = payment.amount_received / 100;
        const currency = payment.currency?.toUpperCase() || 'EUR';
        
        const { error: insertError } = await supabaseAdmin
          .from('revenue_records')
          .insert({
            product_type: 'other',
            product_name: 'Direct Payment',
            amount_usd: amount,
            payment_method: 'stripe',
            stripe_payment_id: stripePaymentId,
            source: 'backfill',
            notes: `Backfilled from payment intent (${currency})`,
            created_at: new Date(payment.created * 1000).toISOString()
          });

        if (insertError) {
          logStep("Error inserting payment intent", { error: insertError.message, paymentId: payment.id });
          errors++;
        } else {
          inserted++;
        }
      }

      hasMorePayments = payments.has_more;
      if (payments.data.length > 0) {
        paymentCursor = payments.data[payments.data.length - 1].id;
      }
    }

    const summary = { inserted, skipped, errors };
    logStep("Backfill complete", summary);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Backfill complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`,
      ...summary
    }), {
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
