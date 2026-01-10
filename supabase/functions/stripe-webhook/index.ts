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
  'price_1Os1suAPsnbrivP0PxsynQAO': { type: 'stargate', name: 'Stargate Transformation Online' },
  'price_1SZqNuAPsnbrivP0ZygF4M88': { type: 'stargate', name: 'Stargate Membership' },
  'price_1SaGNbAPsnbrivP0DBsBGh9V': { type: 'meditation', name: 'Meditation Membership Monthly' },
  'price_1SaGG4APsnbrivP0nnavK58y': { type: 'music', name: 'Music Membership Monthly' },
};

// Maps checkout metadata types to affiliate purchase types
const getPurchaseType = (metadata: Record<string, string>): string | null => {
  if (metadata.purchase_type === 'meditation_audio') return 'meditation_audio';
  if (metadata.purchase_type === 'creative_tool' || metadata.tool_id) return 'creative_tool';
  if (metadata.purchase_type === 'bot_deposit' || metadata.purchase_type === 'bot_premium' || metadata.purchase_type === 'bot_feature') return 'bot';
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
  
  if (metadata.purchase_type === 'meditation_audio') return 'Creative Soul Meditation';
  if (metadata.purchase_type === 'creative_tool' || metadata.tool_name) return metadata.tool_name || 'Creative Soul Tool';
  if (metadata.purchase_type === 'bot_deposit') return `Bot Deposit - $${metadata.amount || '0'}`;
  if (metadata.purchase_type === 'bot_premium') return `Bot Premium - ${metadata.feature || 'monthly'}`;
  if (metadata.purchase_type === 'bot_feature') return `Bot Feature - ${metadata.feature || 'unlock'}`;
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

// Log webhook event to database - use any to bypass strict typing for new table
// deno-lint-ignore no-explicit-any
const logWebhookEvent = async (
  supabaseAdmin: any,
  eventId: string,
  eventType: string,
  payload: unknown,
  status: string,
  errorMessage?: string
) => {
  try {
    await supabaseAdmin.from('stripe_webhook_logs').insert({
      event_id: eventId,
      event_type: eventType,
      payload: payload,
      status,
      error_message: errorMessage || null,
      processed_at: status === 'processed' ? new Date().toISOString() : null,
    });
  } catch (err) {
    logStep("Failed to log webhook event to DB", { error: err instanceof Error ? err.message : err });
  }
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
    
    // Log event received
    await logWebhookEvent(supabaseAdmin, event.id, event.type, { id: event.id, type: event.type }, 'received');

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
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'skipped', 'Session not paid');
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const amountTotal = session.amount_total;
      if (!amountTotal || amountTotal <= 0) {
        logStep("No valid amount, skipping", { amountTotal });
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'skipped', 'No valid amount');
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

      // Record revenue with retry logic and proper error handling
      const { data: existingRevenue } = await supabaseAdmin
        .from('revenue_records')
        .select('id')
        .eq('stripe_payment_id', stripePaymentId)
        .maybeSingle();

      if (existingRevenue) {
        logStep("Revenue already recorded for this payment", { stripePaymentId, existingId: existingRevenue.id });
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'skipped', 'Revenue already exists');
      } else {
        // Get user_id from metadata or customer email lookup
        let userId: string | null = session.metadata?.user_id || null;
        
        // If no user_id in metadata, try to find by email
        if (!userId && customerEmail) {
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          const matchingUser = userData?.users?.find(u => u.email === customerEmail);
          if (matchingUser) {
            userId = matchingUser.id;
            logStep("Found user by email", { email: customerEmail, userId });
          }
        }

        // Retry logic for revenue insert
        let revenueInserted = false;
        let lastError: Error | null = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { data: insertData, error: revenueError } = await supabaseAdmin
              .from('revenue_records')
              .insert({
                product_type: purchaseType,
                product_name: productName,
                amount_usd: purchaseAmount,
                payment_method: 'stripe',
                customer_id: userId,
                customer_email: customerEmail,
                stripe_payment_id: stripePaymentId,
                source: 'webhook',
                notes: `Initial payment (${currency})`
              })
              .select('id')
              .single();

            if (revenueError) {
              // Check if it's a duplicate constraint error
              if (revenueError.code === '23505' || revenueError.message?.includes('unique') || revenueError.message?.includes('duplicate')) {
                logStep("Revenue already exists (duplicate constraint)", { stripePaymentId, attempt });
                revenueInserted = true; // Consider it successful since it already exists
                break;
              }
              
              lastError = new Error(revenueError.message);
              logStep(`Revenue insert attempt ${attempt} failed`, { 
                error: revenueError.message, 
                code: revenueError.code,
                attempt 
              });
              
              if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              }
            } else {
              revenueInserted = true;
              logStep("Revenue recorded successfully", { 
                id: insertData?.id,
                amount: purchaseAmount, 
                currency, 
                type: purchaseType, 
                product: productName,
                attempt
              });
              break;
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logStep(`Revenue insert exception on attempt ${attempt}`, { 
              error: lastError.message,
              attempt 
            });
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        if (!revenueInserted) {
          // CRITICAL: Log error but don't fail webhook - Stripe will retry
          const errorMsg = lastError?.message || 'Unknown error after retries';
          logStep("CRITICAL: Failed to record revenue after all retries", { 
            stripePaymentId,
            amount: purchaseAmount,
            error: errorMsg
          });
          await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'error', `Revenue insert failed after ${maxRetries} attempts: ${errorMsg}`);
          
          // Return error so Stripe knows to retry
          return new Response(JSON.stringify({ 
            received: true, 
            processed: false,
            error: 'Failed to record revenue',
            retry: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        } else {
          await logWebhookEvent(supabaseAdmin, event.id, event.type, { 
            sessionId: session.id, 
            amount: purchaseAmount,
            revenueRecorded: true
          }, 'processed');
        }
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

        // Handle Creative Soul Meditation purchase (new structure with plan types)
        const toolSlug = session.metadata?.tool_slug;
        const plan = session.metadata?.plan; // 'lifetime' | 'monthly' | 'single'
        const ref = session.metadata?.ref || null;

        // Check if this is a Creative Soul purchase
        if ((toolSlug === 'creative-soul' || purchaseType === 'meditation_audio') && userId && plan) {
          logStep("Processing Creative Soul Meditation purchase", { userId, toolSlug, plan, ref });

          // Store affiliate purchase event if ref exists
          if (ref) {
            await supabaseAdmin.from("affiliate_events").insert({
              ref_code: ref,
              user_id: userId,
              tool_slug: toolSlug || 'creative-soul',
              event_type: "purchase",
              stripe_object_id: session.id,
            });
          }

          // Helper: Credit coins once per purchase object id (idempotent)
          async function creditCoinsOnce(userId: string, stripeObjectId: string) {
            const coins = 1000; // 1000 coins per purchased tool

            // Try to insert coin award (will fail if duplicate)
            const { error: awardErr } = await supabaseAdmin.from("coin_awards").insert({
              user_id: userId,
              source: "creative_soul_purchase",
              stripe_object_id: stripeObjectId,
              coins,
            });

            // If duplicate, ignore (already credited)
            if (awardErr && !String(awardErr.message).includes("duplicate") && !String(awardErr.message).includes("unique")) {
              logStep("Error recording coin award", { error: awardErr.message, userId, stripeObjectId });
              return;
            }

            // If not duplicate, credit to wallet
            if (!awardErr) {
              const { data: wallet } = await supabaseAdmin
                .from("user_wallet")
                .select("coins")
                .eq("user_id", userId)
                .maybeSingle();

              const current = wallet?.coins ?? 0;
              const next = current + coins;

              await supabaseAdmin.from("user_wallet").upsert(
                { user_id: userId, coins: next, updated_at: new Date().toISOString() },
                { onConflict: "user_id" }
              );

              logStep("Credited coins to wallet", { userId, coins, previous: current, new: next });
            } else {
              logStep("Coins already credited for this purchase", { userId, stripeObjectId });
            }
          }

          // For lifetime/single: grant access immediately and credit coins
          if (plan === "lifetime" || plan === "single") {
            await supabaseAdmin.from("creative_soul_entitlements").upsert(
              {
                user_id: userId,
                has_access: true,
                plan,
                stripe_customer_id: session.customer?.toString() ?? null,
                subscription_status: "active",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

            // Credit 1000 coins once per successful purchased tool
            await creditCoinsOnce(userId, session.id);

            logStep("Creative Soul entitlement granted (lifetime/single)", { userId, plan });
          } else if (plan === "monthly") {
            // For monthly subscription: we'll handle access via subscription.created/updated events
            // But store the customer ID for subscription lifecycle tracking
            if (session.customer) {
              await supabaseAdmin.from("creative_soul_entitlements").upsert(
                {
                  user_id: userId,
                  has_access: true, // Will be updated by subscription events
                  plan: "monthly",
                  stripe_customer_id: session.customer.toString(),
                  subscription_status: "active",
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
              );

              // Credit coins for initial subscription setup
              await creditCoinsOnce(userId, session.id);

              logStep("Creative Soul subscription setup (monthly)", { userId, customerId: session.customer.toString() });
            }
          }
        }

        // Handle legacy meditation_audio purchase format (backward compatibility)
        if (purchaseType === 'meditation_audio' && userId && !plan) {
          const option = session.metadata?.option || 'one_time';
          // Credit coins based on option: one_time=1000, subscription=200, per_track=100
          const coinCredits: Record<string, number> = {
            one_time: 1000,
            subscription: 200,
            per_track: 100,
          };
          const shcCoinsToCredit = coinCredits[option] || coinCredits.one_time;
          const legacyToolSlug = session.metadata?.tool_slug || 'creative-soul-meditation';
          
          logStep("Processing legacy meditation audio purchase", { userId, legacyToolSlug, option, shcCoinsToCredit });

          // Credit SHC coins (legacy user_balances table)
          const { data: balance } = await supabaseAdmin
            .from('user_balances')
            .select('balance, total_earned')
            .eq('user_id', userId)
            .single();

          if (balance) {
            await supabaseAdmin
              .from('user_balances')
              .update({
                balance: Number(balance.balance) + shcCoinsToCredit,
                total_earned: Number(balance.total_earned) + shcCoinsToCredit,
              })
              .eq('user_id', userId);
          } else {
            await supabaseAdmin
              .from('user_balances')
              .insert({
                user_id: userId,
                balance: shcCoinsToCredit,
                total_earned: shcCoinsToCredit,
                total_spent: 0,
              });
          }

          // Record SHC transaction
          await supabaseAdmin
            .from('shc_transactions')
            .insert({
              user_id: userId,
              type: 'earned',
              amount: shcCoinsToCredit,
              description: 'Creative Soul Meditation purchase bonus',
              status: 'completed',
            });

          logStep("Credited SHC coins (legacy)", { userId, amount: shcCoinsToCredit });

          // Grant entitlement for Creative Soul Meditation (legacy format)
          const { error: entitlementError } = await supabaseAdmin
            .from('creative_soul_entitlements')
            .upsert({
              user_id: userId,
              has_access: true,
              plan: option === 'one_time' ? 'lifetime' : (option === 'subscription' ? 'monthly' : 'single'),
              stripe_payment_id: stripePaymentId,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });

          if (entitlementError) {
            logStep("Error granting meditation audio entitlement (legacy)", { error: entitlementError.message, userId });
          } else {
            logStep("Meditation audio entitlement granted successfully (legacy)", { userId, legacyToolSlug, plan: option });
          }
        }

        // Grant creative tool access if this is a creative tool purchase (non-meditation-audio)
        if (purchaseType === 'creative_tool' && (session.metadata?.tool_id || session.metadata?.tool_slug)) {
          const toolSlug = session.metadata?.tool_slug;
          const toolId = session.metadata?.tool_id;
          
          logStep("Granting creative tool access", { userId, toolSlug, toolId });

          // Find the tool by slug (preferred) or ID
          let tool;
          if (toolSlug) {
            const { data } = await supabaseAdmin
              .from('creative_tools')
              .select('id')
              .eq('slug', toolSlug)
              .eq('is_active', true)
              .maybeSingle();
            tool = data;
          } else if (toolId) {
            const { data } = await supabaseAdmin
              .from('creative_tools')
              .select('id')
              .eq('id', toolId)
              .eq('is_active', true)
              .maybeSingle();
            tool = data;
          }

          if (tool && userId) {
            // Grant access (use upsert to handle duplicates gracefully)
            const { error: accessError } = await supabaseAdmin
              .from('creative_tool_access')
              .upsert({
                user_id: userId,
                tool_id: tool.id,
                stripe_payment_id: stripePaymentId,
                stripe_session_id: session.id,
                access_granted_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,tool_id',
              });

            if (accessError) {
              logStep("Error granting tool access", { error: accessError.message, userId, toolId: tool.id });
            } else {
              logStep("Creative tool access granted successfully", { userId, toolId: tool.id, toolSlug });
            }
          } else {
            logStep("Tool not found or user missing", { toolSlug, toolId, hasTool: !!tool, hasUserId: !!userId });
          }
        }
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, { sessionId: session.id, amount: purchaseAmount }, 'processed');

      return new Response(JSON.stringify({ received: true, processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle recurring subscription payments
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Process both initial and recurring payments
      const amountPaid = invoice.amount_paid / 100;
      const currency = invoice.currency?.toUpperCase() || 'EUR';
      const stripePaymentId = invoice.id;
      const customerEmail = invoice.customer_email;

      // Get price info from line items
      const lineItem = invoice.lines?.data?.[0];
      const priceId = (lineItem?.price as { id?: string })?.id;
      const productInfo = priceId && PRICE_TO_PRODUCT[priceId] 
        ? PRICE_TO_PRODUCT[priceId] 
        : { type: 'subscription', name: lineItem?.description || 'Subscription Payment' };

      logStep("Processing invoice payment", { 
        invoiceId: invoice.id, 
        billingReason: invoice.billing_reason,
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

      if (existingRevenue) {
        logStep("Invoice revenue already recorded", { stripePaymentId, existingId: existingRevenue.id });
        await logWebhookEvent(supabaseAdmin, event.id, event.type, invoice, 'skipped', 'Already recorded');
      } else if (amountPaid > 0) {
        const isRecurring = invoice.billing_reason === "subscription_cycle";
        
        // Get user_id from customer if available
        let userId: string | null = null;
        if (invoice.customer && typeof invoice.customer === 'string') {
          // Try to find user by Stripe customer ID
          const { data: membershipData } = await supabaseAdmin
            .from('user_memberships')
            .select('user_id')
            .eq('stripe_customer_id', invoice.customer)
            .maybeSingle();
          if (membershipData) {
            userId = membershipData.user_id;
          }
        }
        
        // Retry logic for revenue insert
        let revenueInserted = false;
        let lastError: Error | null = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { data: insertData, error: revenueError } = await supabaseAdmin
              .from('revenue_records')
              .insert({
                product_type: productInfo.type,
                product_name: productInfo.name,
                amount_usd: amountPaid,
                payment_method: 'stripe',
                customer_id: userId,
                customer_email: customerEmail,
                stripe_payment_id: stripePaymentId,
                source: 'webhook',
                notes: isRecurring ? `Recurring payment (${currency})` : `Initial subscription (${currency})`
              })
              .select('id')
              .single();

            if (revenueError) {
              // Check if it's a duplicate constraint error
              if (revenueError.code === '23505' || revenueError.message?.includes('unique') || revenueError.message?.includes('duplicate')) {
                logStep("Invoice revenue already exists (duplicate constraint)", { stripePaymentId, attempt });
                revenueInserted = true;
                break;
              }
              
              lastError = new Error(revenueError.message);
              logStep(`Invoice revenue insert attempt ${attempt} failed`, { 
                error: revenueError.message, 
                code: revenueError.code,
                attempt 
              });
              
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              }
            } else {
              revenueInserted = true;
              logStep("Invoice revenue recorded successfully", { 
                id: insertData?.id,
                amount: amountPaid, 
                currency, 
                type: productInfo.type,
                product: productInfo.name,
                isRecurring,
                attempt
              });
              await logWebhookEvent(supabaseAdmin, event.id, event.type, { 
                invoiceId: invoice.id, 
                amount: amountPaid,
                revenueRecorded: true
              }, 'processed');
              break;
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logStep(`Invoice revenue insert exception on attempt ${attempt}`, { 
              error: lastError.message,
              attempt 
            });
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        if (!revenueInserted) {
          const errorMsg = lastError?.message || 'Unknown error after retries';
          logStep("CRITICAL: Failed to record invoice revenue after all retries", { 
            stripePaymentId,
            amount: amountPaid,
            error: errorMsg
          });
          await logWebhookEvent(supabaseAdmin, event.id, event.type, invoice, 'error', `Revenue insert failed after ${maxRetries} attempts: ${errorMsg}`);
          
          return new Response(JSON.stringify({ 
            received: true, 
            processed: false,
            error: 'Failed to record revenue',
            retry: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }
    }

    // Handle payment_intent.succeeded for direct payments
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const amountReceived = paymentIntent.amount_received / 100;
      const currency = paymentIntent.currency?.toUpperCase() || 'EUR';
      const stripePaymentId = paymentIntent.id;
      
      logStep("Processing payment intent", {
        paymentIntentId: paymentIntent.id,
        amount: amountReceived,
        currency,
        metadata: paymentIntent.metadata
      });

      // Check for duplicate
      const { data: existingRevenue } = await supabaseAdmin
        .from('revenue_records')
        .select('id')
        .eq('stripe_payment_id', stripePaymentId)
        .maybeSingle();

      if (existingRevenue) {
        logStep("Payment intent revenue already recorded", { stripePaymentId, existingId: existingRevenue.id });
        await logWebhookEvent(supabaseAdmin, event.id, event.type, paymentIntent, 'skipped', 'Already recorded');
      } else if (amountReceived > 0) {
        const purchaseType = getPurchaseType(paymentIntent.metadata || {}) || 'other';
        const productName = getProductName(paymentIntent.metadata);
        
        // Get user_id from metadata if available
        const userId = paymentIntent.metadata?.user_id || null;
        const customerEmail = paymentIntent.metadata?.customer_email || null;
        
        // Retry logic for revenue insert
        let revenueInserted = false;
        let lastError: Error | null = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { data: insertData, error: revenueError } = await supabaseAdmin
              .from('revenue_records')
              .insert({
                product_type: purchaseType,
                product_name: productName,
                amount_usd: amountReceived,
                payment_method: 'stripe',
                customer_id: userId,
                customer_email: customerEmail,
                stripe_payment_id: stripePaymentId,
                source: 'webhook',
                notes: `Direct payment (${currency})`
              })
              .select('id')
              .single();

            if (revenueError) {
              // Check if it's a duplicate constraint error
              if (revenueError.code === '23505' || revenueError.message?.includes('unique') || revenueError.message?.includes('duplicate')) {
                logStep("Payment intent revenue already exists (duplicate constraint)", { stripePaymentId, attempt });
                revenueInserted = true;
                break;
              }
              
              lastError = new Error(revenueError.message);
              logStep(`Payment intent revenue insert attempt ${attempt} failed`, { 
                error: revenueError.message, 
                code: revenueError.code,
                attempt 
              });
              
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              }
            } else {
              revenueInserted = true;
              logStep("Payment intent revenue recorded successfully", { 
                id: insertData?.id,
                amount: amountReceived, 
                currency, 
                type: purchaseType,
                attempt
              });
              await logWebhookEvent(supabaseAdmin, event.id, event.type, { 
                paymentIntentId: paymentIntent.id, 
                amount: amountReceived,
                revenueRecorded: true
              }, 'processed');
              break;
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logStep(`Payment intent revenue insert exception on attempt ${attempt}`, { 
              error: lastError.message,
              attempt 
            });
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        if (!revenueInserted) {
          const errorMsg = lastError?.message || 'Unknown error after retries';
          logStep("CRITICAL: Failed to record payment intent revenue after all retries", { 
            stripePaymentId,
            amount: amountReceived,
            error: errorMsg
          });
          await logWebhookEvent(supabaseAdmin, event.id, event.type, paymentIntent, 'error', `Revenue insert failed after ${maxRetries} attempts: ${errorMsg}`);
          
          return new Response(JSON.stringify({ 
            received: true, 
            processed: false,
            error: 'Failed to record revenue',
            retry: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }
    }

    // Handle subscription lifecycle: grant/revoke Creative Soul access based on payment status
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      
      const customerId = subscription.customer.toString();
      const status = subscription.status; // active, canceled, past_due, unpaid, incomplete...
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const subscriptionId = subscription.id;

      logStep(`Subscription ${event.type.replace('customer.subscription.', '')}`, {
        subscriptionId,
        status,
        customerId,
        currentPeriodEnd
      });

      // Find user by stripe_customer_id in creative_soul_entitlements
      const { data: ent } = await supabaseAdmin
        .from("creative_soul_entitlements")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      // If no entitlement row exists yet for that customer, just log and continue
      if (!ent?.user_id) {
        logStep("No Creative Soul entitlement found for subscription customer", { customerId });
      await logWebhookEvent(supabaseAdmin, event.id, event.type, {
          subscriptionId,
          status,
          note: "No user for customer yet"
        }, 'processed');
      } else {
        const userId = ent.user_id as string;

        // Access allowed only for active/trialing; remove otherwise
        const hasAccess = status === "active" || status === "trialing";

        await supabaseAdmin.from("creative_soul_entitlements").upsert(
          {
            user_id: userId,
            has_access: hasAccess,
            plan: "monthly",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: status,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Coins: credit once per purchased tool (first time subscription becomes active)
        // We credit on "subscription.created" or first time becomes active.
        if (event.type === "customer.subscription.created" && (status === "active" || status === "trialing")) {
          // Credit coins using idempotent coin_awards table
          const coins = 1000;
          const { error: awardErr } = await supabaseAdmin.from("coin_awards").insert({
            user_id: userId,
            source: "creative_soul_purchase",
            stripe_object_id: subscriptionId,
            coins,
          });

          if (!awardErr || String(awardErr.message).includes("duplicate") || String(awardErr.message).includes("unique")) {
            if (!awardErr) {
              const { data: wallet } = await supabaseAdmin
                .from("user_wallet")
                .select("coins")
                .eq("user_id", userId)
                .maybeSingle();

              const current = wallet?.coins ?? 0;
              const next = current + coins;

              await supabaseAdmin.from("user_wallet").upsert(
                { user_id: userId, coins: next, updated_at: new Date().toISOString() },
                { onConflict: "user_id" }
              );

              logStep("Credited coins for new subscription", { userId, coins, subscriptionId });
            }
          }
        }

        logStep("Creative Soul subscription access updated", { userId, hasAccess, status });

        await logWebhookEvent(supabaseAdmin, event.id, event.type, {
          subscriptionId,
          status,
          userId,
          hasAccess
        }, 'processed');
      }
    }

    // Handle payment failed -> revoke Creative Soul access
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer?.toString() || "";
      const status = invoice.status || "payment_failed";

      logStep("Invoice payment failed", { invoiceId: invoice.id, customerId, status });

      const { data: ent } = await supabaseAdmin
        .from("creative_soul_entitlements")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (ent?.user_id) {
        await supabaseAdmin.from("creative_soul_entitlements").update({
          has_access: false,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        }).eq("user_id", ent.user_id);

        logStep("Creative Soul access revoked due to payment failure", { userId: ent.user_id, status });
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, {
        invoiceId: invoice.id,
        customerId,
        status
      }, 'processed');
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
