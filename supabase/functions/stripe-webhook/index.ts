import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// ── Price ID → Product mapping (revenue_records tracking) ──────────────────
// FIX: Added all 3 tier subscription prices + kept legacy prices
const PRICE_TO_PRODUCT: Record<string, { type: string; name: string }> = {
  // Legacy
  'price_1Os1suAPsnbrivP0PxsynQAO': { type: 'stargate', name: 'Stargate Transformation Online' },
  'price_1SZqNuAPsnbrivP0ZygF4M88': { type: 'stargate', name: 'Stargate Membership' },
  'price_1SaGNbAPsnbrivP0DBsBGh9V': { type: 'meditation', name: 'Meditation Membership Monthly' },
  'price_1SaGG4APsnbrivP0nnavK58y': { type: 'music', name: 'Music Membership Monthly' },
  // SQI Membership Tiers (env-driven — resolved at runtime below)
  // These are resolved via MEMBERSHIP_PRICE_TO_SLUG map below
};

// ── Membership tier price ID → slug ────────────────────────────────────────
// FIX: Canonical single source of truth — used by BOTH revenue tracking AND tier sync
const MEMBERSHIP_PRICE_TO_SLUG: Record<string, string> = {
  "price_1T8o3YAPsnbrivP056UJqOP7": "prana-flow",
  "price_1T8o3jAPsnbrivP0uZKR33EY": "siddha-quantum",
  "price_1T8o3kAPsnbrivP0m8bOzl3M": "akasha-infinity",
};
const MEMBERSHIP_SLUG_TO_NAME: Record<string, string> = {
  "prana-flow": "Prana-Flow Membership (€19/mo)",
  "siddha-quantum": "Siddha-Quantum Membership (€45/mo)",
  "akasha-infinity": "Akasha-Infinity Lifetime Access (€1,111)",
};

// Maps checkout metadata types to purchase category
const getPurchaseType = (metadata: Record<string, string>): string | null => {
  if (metadata.purchase_type === 'meditation_audio') return 'meditation_audio';
  if (metadata.product_type === 'sri_yantra_shield') return 'sri_yantra_shield';
  if (metadata.purchase_type === 'creative_tool' || metadata.tool_id) return 'creative_tool';
  if (metadata.purchase_type === 'bot_deposit' || metadata.purchase_type === 'bot_premium' || metadata.purchase_type === 'bot_feature') return 'bot';
  if (metadata.type === 'meditation_membership') return 'meditation';
  if (metadata.type === 'music_membership') return 'music';
  if (metadata.type === 'stargate_membership') return 'stargate';
  if (metadata.tierName) return 'membership';
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
  if (metadata.product === 'akashic_deep_reading') return 'akashic';
  return null;
};

const getProductName = (metadata: Record<string, string> | null): string => {
  if (!metadata) return 'Stripe Purchase';
  if (metadata.tierName) {
    return MEMBERSHIP_SLUG_TO_NAME[metadata.tierName.toLowerCase().replace('_', '-')] || `${metadata.tierName} Membership`;
  }
  if (metadata.purchase_type === 'meditation_audio') return 'Creative Soul Meditation';
  if (metadata.product_type === 'sri_yantra_shield') return metadata.product_name || 'Sri Yantra Universal Protection Shield';
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
  if (metadata.product === 'akashic_deep_reading') return 'Akashic Deep Reading';
  return 'Stripe Purchase';
};

// deno-lint-ignore no-explicit-any
const logWebhookEvent = async (supabaseAdmin: any, eventId: string, eventType: string, payload: unknown, status: string, errorMessage?: string) => {
  try {
    await supabaseAdmin.from('stripe_webhook_logs').insert({
      event_id: eventId,
      event_type: eventType,
      payload,
      status,
      error_message: errorMessage || null,
      processed_at: status === 'processed' ? new Date().toISOString() : null,
    });
  } catch (err) {
    logStep("Failed to log webhook event", { error: err instanceof Error ? err.message : err });
  }
};

// ── Email sender ─────────────────────────────────────────────────────────────
async function sendEmail(params: {
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) { logStep("No RESEND_API_KEY, skipping email"); return; }
  const resend = new Resend(resendKey);
  try {
    await resend.emails.send({
      from: "Sacred Healing <hello@sacredhealing.app>",
      to: [params.toEmail],
      subject: params.subject,
      html: params.html,
    });
    logStep(`Email sent to ${params.toEmail}: ${params.subject}`);
  } catch (e) {
    logStep("Email send failed", { error: e instanceof Error ? e.message : String(e) });
  }
}

// ── Purchase confirmation email ──────────────────────────────────────────────
async function sendPurchaseEmail(params: {
  toEmail: string;
  toName: string;
  productName: string;
  amount: number;
  currency: string;
  isRecurring?: boolean;
  receiptUrl?: string | null;
}): Promise<void> {
  const { toEmail, toName, productName, amount, currency, isRecurring, receiptUrl } = params;
  const firstName = toName?.split(" ")[0] || "Seeker";
  const amountFmt = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  const subject = isRecurring
    ? `✦ Payment received — ${productName} | Sacred Healing`
    : `✦ Welcome — ${productName} activated | Sacred Healing`;

  const html = buildSQIEmail({
    headline: isRecurring ? "Payment Received" : "Access Activated",
    subline: isRecurring ? "YOUR SUBSCRIPTION RENEWED" : "YOUR QUANTUM FIELD IS OPEN",
    greeting: `Namaste <strong style="color:#D4AF37;">${firstName}</strong>,`,
    body: isRecurring
      ? `Your subscription has been renewed. The Siddha field remains open and your journey continues uninterrupted.`
      : `Your purchase is confirmed. The Bhakti-Algorithm transmission has been activated and is ready for you now.`,
    orderRows: [
      { label: "PRODUCT", value: productName, large: false },
      { label: "AMOUNT PAID", value: amountFmt, large: true, color: "#D4AF37" },
      { label: "STATUS", value: "✓ PAID", badge: true, badgeColor: "#22c55e" },
    ],
    receiptUrl: receiptUrl ?? null,
    ctaText: "◈ Enter Sacred Space",
    ctaUrl: "https://siddhaquantumnexus.com",
  });

  await sendEmail({ toEmail, toName, subject, html });
}

// ── Cancellation email ───────────────────────────────────────────────────────
async function sendCancellationEmail(params: {
  toEmail: string;
  toName: string;
  productName: string;
  accessUntil: string;
}): Promise<void> {
  const { toEmail, toName, productName, accessUntil } = params;
  const firstName = toName?.split(" ")[0] || "Seeker";

  const html = buildSQIEmail({
    headline: "Subscription Cancelled",
    subline: "YOUR JOURNEY CONTINUES UNTIL " + accessUntil.toUpperCase(),
    iconColor: "rgba(255,160,50,0.6)",
    greeting: `Namaste <strong style="color:#D4AF37;">${firstName}</strong>,`,
    body: `Your ${productName} subscription has been cancelled. You retain full access until <strong style="color:#D4AF37;">${accessUntil}</strong>, after which your account will return to the free Atma-Seed tier. You may reactivate at any time.`,
    orderRows: [
      { label: "SUBSCRIPTION", value: productName, large: false },
      { label: "ACCESS UNTIL", value: accessUntil, large: false, color: "#D4AF37" },
      { label: "STATUS", value: "CANCELLED", badge: true, badgeColor: "#f59e0b" },
    ],
    receiptUrl: null,
    ctaText: "◈ Reactivate Anytime",
    ctaUrl: "https://siddhaquantumnexus.com/membership",
  });

  await sendEmail({ toEmail, toName, subject: `Your ${productName} subscription has been cancelled`, html });
}

// ── Payment failed email ─────────────────────────────────────────────────────
async function sendPaymentFailedEmail(params: {
  toEmail: string;
  toName: string;
  productName: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const { toEmail, toName, productName, amount, currency } = params;
  const firstName = toName?.split(" ")[0] || "Seeker";
  const amountFmt = `${amount.toFixed(2)} ${currency.toUpperCase()}`;

  const html = buildSQIEmail({
    headline: "Payment Failed",
    subline: "ACTION REQUIRED TO KEEP YOUR ACCESS",
    iconColor: "rgba(239,68,68,0.6)",
    greeting: `Namaste <strong style="color:#D4AF37;">${firstName}</strong>,`,
    body: `Your payment of <strong style="color:#D4AF37;">${amountFmt}</strong> for <strong>${productName}</strong> could not be processed. Please update your payment method to continue your Siddha Quantum journey. Your access has been paused.`,
    orderRows: [
      { label: "SUBSCRIPTION", value: productName, large: false },
      { label: "AMOUNT", value: amountFmt, large: false },
      { label: "STATUS", value: "⚠ PAYMENT FAILED", badge: true, badgeColor: "#ef4444" },
    ],
    receiptUrl: null,
    ctaText: "◈ Update Payment Method",
    ctaUrl: "https://siddhaquantumnexus.com/membership",
  });

  await sendEmail({ toEmail, toName, subject: `⚠ Payment failed — ${productName} | Sacred Healing`, html });
}

// ── Affiliate commission notification email ──────────────────────────────────
async function sendAffiliateCommissionEmail(params: {
  toEmail: string;
  toName: string;
  commissionAmount: number;
  grossAmount: number;
  currency: string;
  pendingBalance: number;
}): Promise<void> {
  const { toEmail, toName, commissionAmount, grossAmount, currency, pendingBalance } = params;
  const firstName = toName?.split(" ")[0] || "Sovereign";
  const cur = currency.toUpperCase();

  const html = buildSQIEmail({
    headline: "Quantum Dividend Received",
    subline: "SOVEREIGN TRANSMISSION NETWORK · 30% COMMISSION",
    iconColor: "rgba(212,175,55,0.6)",
    greeting: `Namaste <strong style="color:#D4AF37;">${firstName}</strong>,`,
    body: `A new seeker has been initiated through your transmission link. Your Bhakti-Algorithm Quantum Dividend has been added to your Sovereign Balance.`,
    orderRows: [
      { label: "COMMISSION EARNED", value: `+${commissionAmount.toFixed(2)} ${cur}`, large: true, color: "#D4AF37" },
      { label: "SALE AMOUNT", value: `${grossAmount.toFixed(2)} ${cur}`, large: false },
      { label: "PENDING BALANCE", value: `${pendingBalance.toFixed(2)} ${cur}`, large: false, color: "#22D3EE" },
    ],
    receiptUrl: null,
    ctaText: "◈ View Abundance Dashboard",
    ctaUrl: "https://siddhaquantumnexus.com/affiliate-dashboard",
  });

  await sendEmail({ toEmail, toName, subject: `⚡ New Quantum Dividend: +${commissionAmount.toFixed(2)} ${cur} | Sacred Healing`, html });
}

// ── Shared SQI email template builder ────────────────────────────────────────
function buildSQIEmail(opts: {
  headline: string;
  subline: string;
  iconColor?: string;
  greeting: string;
  body: string;
  orderRows: Array<{ label: string; value: string; large?: boolean; color?: string; badge?: boolean; badgeColor?: string }>;
  receiptUrl: string | null;
  ctaText: string;
  ctaUrl: string;
}): string {
  const rows = opts.orderRows.map(r => {
    if (r.badge) {
      return `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.3);">${r.label}</span><br>
        <span style="display:inline-block;margin-top:6px;background:${r.badgeColor}22;border:1px solid ${r.badgeColor}66;border-radius:100px;padding:4px 14px;font-size:11px;font-weight:800;color:${r.badgeColor};letter-spacing:0.1em;">${r.value}</span>
      </td></tr>`;
    }
    return `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.3);">${r.label}</span><br>
      <span style="font-size:${r.large ? '22px' : '15px'};font-weight:${r.large ? '900' : '700'};color:${r.color || '#fff'};margin-top:4px;display:block;">${r.value}</span>
    </td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
<tr><td align="center" style="padding:40px 16px 60px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="text-align:center;padding:48px 0 32px;">
    <div style="color:rgba(212,175,55,0.5);font-size:9px;letter-spacing:0.7em;text-transform:uppercase;margin-bottom:12px;">SIDDHA QUANTUM NEXUS · SQI 2050</div>
    <div style="font-size:40px;margin-bottom:10px;color:${opts.iconColor || '#D4AF37'};">⟁</div>
    <div style="color:#D4AF37;font-size:26px;font-weight:900;letter-spacing:-0.03em;text-shadow:0 0 20px rgba(212,175,55,0.4);">${opts.headline}</div>
    <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:8px;letter-spacing:0.2em;">${opts.subline}</div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:20px;padding:28px 32px;">
      <p style="font-size:16px;color:rgba(255,255,255,0.85);margin:0 0 12px;line-height:1.7;">${opts.greeting}</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.55);margin:0;line-height:1.8;">${opts.body}</p>
    </div>
  </td></tr>
  <tr><td style="padding:0 0 24px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:28px 32px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:16px;">DETAILS</div>
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      ${opts.receiptUrl ? `<div style="margin-top:18px;text-align:center;"><a href="${opts.receiptUrl}" style="display:inline-block;padding:10px 24px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:100px;color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">View Receipt →</a></div>` : ''}
    </div>
  </td></tr>
  <tr><td style="padding:0 0 32px;text-align:center;">
    <a href="${opts.ctaUrl}" style="display:inline-block;padding:16px 40px;background:#D4AF37;color:#050505;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;box-shadow:0 0 24px rgba(212,175,55,0.4);">${opts.ctaText}</a>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 0 0;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">
      Sacred Healing · Siddha Quantum Intelligence<br>
      <a href="https://siddhaquantumnexus.com" style="color:rgba(212,175,55,0.4);text-decoration:none;">siddhaquantumnexus.com</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// ── Core affiliate commission processor (UNIFIED — uses affiliate_commissions) ──
// FIX: Removed dual-system conflict. Single source of truth.
// deno-lint-ignore no-explicit-any
async function processAffiliateCommission(supabaseAdmin: any, params: {
  stripeSessionId: string;
  affiliateCode: string | null;
  grossAmount: number;
  currency: string;
  paymentIntentId: string | null;
  referredUserId: string | null;
}): Promise<void> {
  const { stripeSessionId, affiliateCode, grossAmount, currency, paymentIntentId, referredUserId } = params;

  if (!affiliateCode || affiliateCode === 'direct') {
    logStep("No affiliate code, skipping commission", { stripeSessionId });
    return;
  }

  // Idempotency check
  const { data: existing } = await supabaseAdmin
    .from('affiliate_commissions')
    .select('id')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (existing) {
    logStep("Commission already recorded", { stripeSessionId });
    return;
  }

  // Find affiliate profile by code
  const { data: affiliateProfile, error: profileError } = await supabaseAdmin
    .from('affiliate_profiles')
    .select('user_id, total_earnings, pending_balance')
    .eq('affiliate_code', affiliateCode)
    .maybeSingle();

  if (profileError || !affiliateProfile) {
    logStep("Affiliate code not found", { affiliateCode, error: profileError?.message });
    return;
  }

  const COMMISSION_RATE = 0.30;
  const commissionAmount = parseFloat((grossAmount * COMMISSION_RATE).toFixed(2));

  // Insert commission record
  const { error: insertError } = await supabaseAdmin
    .from('affiliate_commissions')
    .insert({
      affiliate_user_id: affiliateProfile.user_id,
      referred_user_id: referredUserId,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: paymentIntentId,
      gross_amount: grossAmount,
      commission_amount: commissionAmount,
      commission_rate: COMMISSION_RATE,
      currency: currency.toUpperCase(),
      status: 'approved', // Auto-approve: Stripe confirmed payment
    });

  if (insertError) {
    logStep("Failed to insert commission", { error: insertError.message });
    return;
  }

  // Update affiliate balance
  const newTotal = parseFloat(((affiliateProfile.total_earnings || 0) + commissionAmount).toFixed(2));
  const newPending = parseFloat(((affiliateProfile.pending_balance || 0) + commissionAmount).toFixed(2));

  await supabaseAdmin
    .from('affiliate_profiles')
    .update({ total_earnings: newTotal, pending_balance: newPending, updated_at: new Date().toISOString() })
    .eq('user_id', affiliateProfile.user_id);

  logStep("Commission recorded", { affiliateCode, commissionAmount, currency, newPending });

  // Send notification email to affiliate
  try {
    const { data: affUser } = await supabaseAdmin.auth.admin.getUserById(affiliateProfile.user_id);
    if (affUser?.user?.email) {
      await sendAffiliateCommissionEmail({
        toEmail: affUser.user.email,
        toName: affUser.user.user_metadata?.full_name || affUser.user.email,
        commissionAmount,
        grossAmount,
        currency,
        pendingBalance: newPending,
      });
    }
  } catch (emailErr) {
    logStep("Affiliate notification email failed (non-blocking)", { error: String(emailErr) });
  }
}

// ── Revenue record with retry ────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function recordRevenue(supabaseAdmin: any, params: {
  productType: string;
  productName: string;
  amountUsd: number;
  paymentMethod: string;
  customerId: string | null;
  customerEmail: string | null;
  stripePaymentId: string;
  source: string;
  notes: string;
}): Promise<boolean> {
  // Idempotency
  const { data: existing } = await supabaseAdmin
    .from('revenue_records')
    .select('id')
    .eq('stripe_payment_id', params.stripePaymentId)
    .maybeSingle();
  if (existing) return true;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabaseAdmin.from('revenue_records').insert({ ...params, amount_usd: params.amountUsd });
    if (!error) return true;
    if (error.code === '23505') return true; // duplicate constraint — already exists
    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  return false;
}

// ── User resolver by email ───────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function resolveUserByEmail(supabaseAdmin: any, email: string): Promise<string | null> {
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  return userData?.users?.find((u: { email?: string; id: string }) => u.email === email)?.id || null;
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey) return new Response(JSON.stringify({ error: "Stripe not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

  try {
    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) return new Response(JSON.stringify({ error: "Missing signature" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        logStep("Signature verification failed", { error: err instanceof Error ? err.message : err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
    } else {
      logStep("WARNING: No STRIPE_WEBHOOK_SECRET, skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }

    logStep("Event received", { type: event.type, id: event.id });
    await logWebhookEvent(supabaseAdmin, event.id, event.type, { id: event.id, type: event.type }, 'received');

    // ═══════════════════════════════════════════════════════════════
    // 1. checkout.session.completed — one-time & initial subscription
    // ═══════════════════════════════════════════════════════════════
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") {
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'skipped', 'Not paid');
        return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const amountTotal = session.amount_total;
      if (!amountTotal || amountTotal <= 0) {
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'skipped', 'Zero amount');
        return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const purchaseAmount = amountTotal / 100;
      const currency = session.currency?.toUpperCase() || 'EUR';
      const purchaseType = getPurchaseType(session.metadata || {}) || 'other';
      const productName = getProductName(session.metadata);
      const customerEmail = session.customer_email || (session.customer_details as { email?: string })?.email;

      // Resolve user ID
      let userId: string | null = session.metadata?.user_id || null;
      if (!userId && customerEmail) {
        userId = await resolveUserByEmail(supabaseAdmin, customerEmail);
      }

      // Record revenue
      const revenueOk = await recordRevenue(supabaseAdmin, {
        productType: purchaseType,
        productName,
        amountUsd: purchaseAmount,
        paymentMethod: 'stripe',
        customerId: userId,
        customerEmail: customerEmail || null,
        stripePaymentId: session.id,
        source: 'webhook',
        notes: `Initial payment (${currency})`,
      });

      if (!revenueOk) {
        await logWebhookEvent(supabaseAdmin, event.id, event.type, session, 'error', 'Revenue insert failed');
        return new Response(JSON.stringify({ received: true, retry: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
      }

      // ── FIX: UNIFIED affiliate commission via affiliate_commissions table ──
      // Resolve affiliate code from metadata (created by create-tier-checkout + all checkout functions)
      const affiliateCode = session.metadata?.affiliateId || session.metadata?.affiliate_code || session.client_reference_id?.split('_affiliate_')[1] || null;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as { id?: string })?.id || null;

      // Referred user ID for commission record
      let referredUserId: string | null = userId;
      if (!referredUserId && customerEmail) {
        referredUserId = await resolveUserByEmail(supabaseAdmin, customerEmail);
      }

      await processAffiliateCommission(supabaseAdmin, {
        stripeSessionId: session.id,
        affiliateCode,
        grossAmount: purchaseAmount,
        currency,
        paymentIntentId,
        referredUserId,
      });

      // ── Product-specific access grants ────────────────────────────────────
      if (userId) {
        // Akashic Deep Reading
        if (session.metadata?.product === 'akashic_deep_reading') {
          await supabaseAdmin.from('akashic_readings').upsert({ user_id: userId, user_house: 12, updated_at: new Date().toISOString() }, { onConflict: 'user_id', ignoreDuplicates: false });
          logStep("Akashic reading access granted", { userId });
        }

        // Sri Yantra Shield
        if (purchaseType === 'sri_yantra_shield') {
          await supabaseAdmin.from('sri_yantra_access').upsert({ user_id: userId, has_access: true, stripe_session_id: session.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          logStep("Sri Yantra Shield access granted", { userId });
        }

        // Stargate one-time purchase
        if (purchaseType === 'stargate') {
          const { data: existing } = await supabaseAdmin.from('stargate_community_members').select('id').eq('user_id', userId).maybeSingle();
          if (!existing) {
            await supabaseAdmin.from('stargate_community_members').insert({ user_id: userId, added_by: userId, added_at: new Date().toISOString() });
            logStep("Stargate member added", { userId });
          }
        }

        // Creative Soul / Meditation Audio
        const toolSlug = session.metadata?.tool_slug;
        const plan = session.metadata?.plan;
        if ((toolSlug === 'creative-soul' || purchaseType === 'meditation_audio') && plan) {
          if (plan === 'lifetime' || plan === 'single') {
            await supabaseAdmin.from('creative_soul_entitlements').upsert({ user_id: userId, has_access: true, plan, stripe_customer_id: session.customer?.toString() ?? null, subscription_status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          } else if (plan === 'monthly' && session.customer) {
            await supabaseAdmin.from('creative_soul_entitlements').upsert({ user_id: userId, has_access: true, plan: 'monthly', stripe_customer_id: session.customer.toString(), subscription_status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          }
          // Credit coins
          const { error: awardErr } = await supabaseAdmin.from('coin_awards').insert({ user_id: userId, source: 'creative_soul_purchase', stripe_object_id: session.id, coins: 1000 });
          if (!awardErr) {
            const { data: wallet } = await supabaseAdmin.from('user_wallet').select('coins').eq('user_id', userId).maybeSingle();
            await supabaseAdmin.from('user_wallet').upsert({ user_id: userId, coins: (wallet?.coins ?? 0) + 1000, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          }
        }

        // Creative tool access
        if (purchaseType === 'creative_tool' && (session.metadata?.tool_id || session.metadata?.tool_slug)) {
          const toolSlugLocal = session.metadata?.tool_slug;
          const toolId = session.metadata?.tool_id;
          let tool;
          if (toolSlugLocal) {
            const { data } = await supabaseAdmin.from('creative_tools').select('id').eq('slug', toolSlugLocal).eq('is_active', true).maybeSingle();
            tool = data;
          } else if (toolId) {
            const { data } = await supabaseAdmin.from('creative_tools').select('id').eq('id', toolId).eq('is_active', true).maybeSingle();
            tool = data;
          }
          if (tool) {
            await supabaseAdmin.from('creative_tool_access').upsert({ user_id: userId, tool_id: tool.id, stripe_payment_id: session.id, stripe_session_id: session.id, access_granted_at: new Date().toISOString() }, { onConflict: 'user_id,tool_id' });
          }
        }
      }

      // Send purchase email
      if (customerEmail) {
        let buyerName = session.metadata?.full_name || session.customer_details?.name || customerEmail.split("@")[0];
        if (userId && !session.metadata?.full_name) {
          const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
          if (p?.full_name) buyerName = p.full_name;
        }
        await sendPurchaseEmail({ toEmail: customerEmail, toName: buyerName, productName, amount: purchaseAmount, currency, isRecurring: false, receiptUrl: session.url || null });
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, { sessionId: session.id, amount: purchaseAmount }, 'processed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. invoice.payment_succeeded — subscription renewals
    // ═══════════════════════════════════════════════════════════════
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const amountPaid = invoice.amount_paid / 100;
      const currency = invoice.currency?.toUpperCase() || 'EUR';
      const customerEmail = invoice.customer_email;

      if (amountPaid <= 0) {
        await logWebhookEvent(supabaseAdmin, event.id, event.type, invoice, 'skipped', 'Zero amount');
        return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const lineItem = invoice.lines?.data?.[0];
      const priceId = (lineItem?.price as { id?: string })?.id;

      // FIX: Resolve product info from BOTH legacy map AND membership tier map
      let productInfo: { type: string; name: string };
      if (priceId && MEMBERSHIP_PRICE_TO_SLUG[priceId]) {
        const slug = MEMBERSHIP_PRICE_TO_SLUG[priceId];
        productInfo = { type: 'membership', name: MEMBERSHIP_SLUG_TO_NAME[slug] || slug };
      } else if (priceId && PRICE_TO_PRODUCT[priceId]) {
        productInfo = PRICE_TO_PRODUCT[priceId];
      } else {
        productInfo = { type: 'subscription', name: lineItem?.description || 'Subscription Payment' };
      }

      // Resolve user
      let userId: string | null = null;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (customerId) {
        const { data: membershipData } = await supabaseAdmin.from('user_memberships').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
        userId = membershipData?.user_id || null;
      }
      if (!userId && customerEmail) {
        userId = await resolveUserByEmail(supabaseAdmin, customerEmail);
      }

      await recordRevenue(supabaseAdmin, {
        productType: productInfo.type,
        productName: productInfo.name,
        amountUsd: amountPaid,
        paymentMethod: 'stripe',
        customerId: userId,
        customerEmail: customerEmail || null,
        stripePaymentId: invoice.id,
        source: 'webhook',
        notes: invoice.billing_reason === 'subscription_cycle' ? `Recurring (${currency})` : `Initial subscription (${currency})`,
      });

      // Send email
      if (customerEmail) {
        await sendPurchaseEmail({
          toEmail: customerEmail,
          toName: customerEmail.split("@")[0],
          productName: productInfo.name,
          amount: amountPaid,
          currency,
          isRecurring: invoice.billing_reason === 'subscription_cycle',
          receiptUrl: invoice.hosted_invoice_url ?? null,
        });
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, { invoiceId: invoice.id, amount: amountPaid }, 'processed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. invoice.payment_failed — FIX: now sends email + revokes access
    // ═══════════════════════════════════════════════════════════════
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer?.toString() || "";
      const customerEmail = invoice.customer_email;
      const amountFailed = (invoice.amount_due || 0) / 100;
      const currency = invoice.currency?.toUpperCase() || 'EUR';

      logStep("Invoice payment failed", { invoiceId: invoice.id, customerId });

      // Get product name for email
      const lineItem = invoice.lines?.data?.[0];
      const priceId = (lineItem?.price as { id?: string })?.id;
      let productName = lineItem?.description || 'Subscription';
      if (priceId && MEMBERSHIP_PRICE_TO_SLUG[priceId]) {
        productName = MEMBERSHIP_SLUG_TO_NAME[MEMBERSHIP_PRICE_TO_SLUG[priceId]] || productName;
      }

      // Revoke Creative Soul access
      const { data: ent } = await supabaseAdmin.from("creative_soul_entitlements").select("user_id, plan").eq("stripe_customer_id", customerId).maybeSingle();
      if (ent?.user_id && ent.plan !== "lifetime" && ent.plan !== "single") {
        await supabaseAdmin.from("creative_soul_entitlements").update({ has_access: false, subscription_status: invoice.status || "payment_failed", updated_at: new Date().toISOString() }).eq("user_id", ent.user_id);
        logStep("Creative Soul access revoked", { userId: ent.user_id });
      }

      // FIX: Send payment failed email
      if (customerEmail) {
        let customerName = customerEmail.split("@")[0];
        if (ent?.user_id) {
          const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", ent.user_id).maybeSingle();
          if (p?.full_name) customerName = p.full_name;
        }
        await sendPaymentFailedEmail({ toEmail: customerEmail, toName: customerName, productName, amount: amountFailed, currency });
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, { invoiceId: invoice.id, customerId }, 'processed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. customer.subscription.* — membership tier sync + emails
    // ═══════════════════════════════════════════════════════════════
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id || "";
      const customerId = sub.customer.toString();
      const status = sub.status;
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
      const tierSlug = MEMBERSHIP_PRICE_TO_SLUG[priceId];

      logStep(`Subscription ${event.type.split('.').pop()}`, { subscriptionId: sub.id, status, customerId, tierSlug, priceId });

      // Resolve user_id
      let userId: string | null = null;
      const { data: existingMembership } = await supabaseAdmin.from("user_memberships").select("user_id").eq("stripe_subscription_id", sub.id).maybeSingle();
      userId = existingMembership?.user_id ?? null;

      if (!userId) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          // deno-lint-ignore no-explicit-any
          const email = (customer && !(customer as any).deleted) ? (customer as Stripe.Customer).email : null;
          if (email) userId = await resolveUserByEmail(supabaseAdmin, email);
        } catch (e) {
          logStep("Failed to resolve user from customer", { customerId, err: String(e) });
        }
      }

      // ── Membership tier sync ──────────────────────────────────────────────
      if (tierSlug && userId) {
        const { data: tierRow } = await supabaseAdmin.from("membership_tiers").select("id").eq("slug", tierSlug).maybeSingle();
        const isActive = event.type !== "customer.subscription.deleted" && (status === "active" || status === "trialing");

        if (tierRow?.id) {
          if (isActive) {
            await supabaseAdmin.from("user_memberships").upsert({
              user_id: userId,
              tier_id: tierRow.id,
              status: "active",
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              expires_at: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            logStep("Membership synced active", { userId, tierSlug });
          } else {
            await supabaseAdmin.from("user_memberships").update({
              status: "cancelled",
              expires_at: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            }).eq("user_id", userId).eq("stripe_subscription_id", sub.id);
            logStep("Membership cancelled", { userId, tierSlug, status });
          }
        }

        // FIX: Send cancellation email when subscription deleted
        if (event.type === "customer.subscription.deleted" && currentPeriodEnd) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            // deno-lint-ignore no-explicit-any
            const email = (customer && !(customer as any).deleted) ? (customer as Stripe.Customer).email : null;
            if (email) {
              const accessDate = new Date(currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
              const productName = MEMBERSHIP_SLUG_TO_NAME[tierSlug] || tierSlug;
              let buyerName = email.split("@")[0];
              if (userId) {
                const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
                if (p?.full_name) buyerName = p.full_name;
              }
              await sendCancellationEmail({ toEmail: email, toName: buyerName, productName, accessUntil: accessDate });
            }
          } catch (emailErr) {
            logStep("Cancellation email failed (non-blocking)", { error: String(emailErr) });
          }
        }
      }

      // ── Stargate subscription sync ────────────────────────────────────────
      if (priceId === 'price_1SZqNuAPsnbrivP0ZygF4M88' && userId) {
        const hasActiveAccess = status === "active" || status === "trialing";
        if (hasActiveAccess) {
          const { data: existingMember } = await supabaseAdmin.from('stargate_community_members').select('id').eq('user_id', userId).maybeSingle();
          if (!existingMember) {
            await supabaseAdmin.from('stargate_community_members').insert({ user_id: userId, added_by: userId, added_at: new Date().toISOString() });
          }
        }
      }

      // ── Creative Soul subscription sync ───────────────────────────────────
      const { data: ent } = await supabaseAdmin.from("creative_soul_entitlements").select("user_id, plan").eq("stripe_customer_id", customerId).maybeSingle();
      if (ent?.user_id && ent.plan !== "lifetime" && ent.plan !== "single") {
        const hasAccess = status === "active" || status === "trialing";
        await supabaseAdmin.from("creative_soul_entitlements").upsert({
          user_id: ent.user_id,
          has_access: hasAccess,
          plan: "monthly",
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          subscription_status: status,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        logStep("Creative Soul access updated", { userId: ent.user_id, hasAccess });
      }

      await logWebhookEvent(supabaseAdmin, event.id, event.type, { subscriptionId: sub.id, status, userId, tierSlug }, 'processed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. payment_intent.succeeded — direct payments (not checkout)
    // ═══════════════════════════════════════════════════════════════
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const amountReceived = pi.amount_received / 100;
      const currency = pi.currency?.toUpperCase() || 'EUR';
      if (amountReceived > 0) {
        const purchaseType = getPurchaseType(pi.metadata || {}) || 'other';
        const productName = getProductName(pi.metadata);
        await recordRevenue(supabaseAdmin, {
          productType: purchaseType,
          productName,
          amountUsd: amountReceived,
          paymentMethod: 'stripe',
          customerId: pi.metadata?.user_id || null,
          customerEmail: pi.metadata?.customer_email || null,
          stripePaymentId: pi.id,
          source: 'webhook',
          notes: `Direct payment (${currency})`,
        });
      }
      await logWebhookEvent(supabaseAdmin, event.id, event.type, { id: pi.id, amount: amountReceived }, 'processed');
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. payout.paid — Stripe Connect payout to affiliate completed
    // ═══════════════════════════════════════════════════════════════
    if (event.type === "payout.paid") {
      const payout = event.data.object as Stripe.Payout;
      const affiliateUserId = payout.metadata?.affiliate_user_id;
      if (affiliateUserId) {
        const payoutAmount = payout.amount / 100;
        const { data: affProf } = await supabaseAdmin.from('affiliate_profiles').select('pending_balance, paid_out').eq('user_id', affiliateUserId).single();
        if (affProf) {
          await supabaseAdmin.from('affiliate_profiles').update({
            pending_balance: Math.max(0, (affProf.pending_balance || 0) - payoutAmount),
            paid_out: (affProf.paid_out || 0) + payoutAmount,
            updated_at: new Date().toISOString(),
          }).eq('user_id', affiliateUserId);
        }
        // Mark payout request as completed
        await supabaseAdmin.from('affiliate_payout_requests').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('affiliate_user_id', affiliateUserId).eq('status', 'processing');
        logStep("Affiliate payout completed", { affiliateUserId, payoutAmount });
      }
      await logWebhookEvent(supabaseAdmin, event.id, event.type, { id: payout.id, amount: payout.amount }, 'processed');
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
