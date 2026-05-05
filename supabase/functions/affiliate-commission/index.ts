// supabase/functions/affiliate-commission/index.ts
// Stripe webhook events to listen for: checkout.session.completed

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const COMMISSION_RATE = 0.30; // 30% Quantum Dividend

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    // ── Verify Stripe signature ─────────────────────────────────────────────
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_AFFILIATE_WEBHOOK_SECRET') ?? Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${errMessage(err)}`, { status: 400 });
    }

    // ── Handle checkout completed ───────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get affiliateId from metadata OR client_reference_id
      const affiliateCode =
        session.metadata?.affiliateId ||
        session.metadata?.affiliate_code ||
        session.client_reference_id?.split('_affiliate_')[1] ||
        null;

      if (!affiliateCode) {
        console.log('No affiliate code found in session, skipping commission.');
        return new Response(JSON.stringify({ received: true, commission: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get amount paid (Stripe amounts are in cents)
      const amountTotal = session.amount_total || 0;
      const currency = session.currency || 'eur';
      const grossAmount = amountTotal / 100;
      const commissionAmount = parseFloat((grossAmount * COMMISSION_RATE).toFixed(2));

      // ── Find affiliate profile by code ────────────────────────────────────
      const { data: affiliateProfile, error: profileError } = await supabase
        .from('affiliate_profiles')
        .select('user_id, total_earnings, pending_balance')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle();

      if (profileError || !affiliateProfile) {
        console.error('Affiliate code not found:', affiliateCode, profileError);
        return new Response(JSON.stringify({ received: true, error: 'Affiliate not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Still 200 so Stripe doesn't retry
        });
      }

      // ── Find referred user (if Stripe customer email matches) ─────────────
      let referredUserId: string | null = null;
      if (session.customer_email) {
        const { data: referredUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', session.customer_email)
          .maybeSingle();
        referredUserId = referredUser?.id || null;
      }

      // ── Check for duplicate (idempotency) ────────────────────────────────
      const { data: existing } = await supabase
        .from('affiliate_commissions')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existing) {
        console.log('Commission already recorded for session:', session.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── Insert commission record ───────────────────────────────────────────
      const { error: insertError } = await supabase
        .from('affiliate_commissions')
        .insert({
          affiliate_user_id: affiliateProfile.user_id,
          referred_user_id: referredUserId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null,
          gross_amount: grossAmount,
          commission_amount: commissionAmount,
          commission_rate: COMMISSION_RATE,
          currency: currency.toUpperCase(),
          status: 'approved', // Auto-approve since Stripe confirmed payment
        });

      if (insertError) {
        console.error('Failed to insert commission:', insertError);
        return new Response(JSON.stringify({ received: true, error: insertError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // ── Update affiliate balance ───────────────────────────────────────────
      const newTotal = parseFloat(((affiliateProfile.total_earnings || 0) + commissionAmount).toFixed(2));
      const newPending = parseFloat(((affiliateProfile.pending_balance || 0) + commissionAmount).toFixed(2));

      const { error: updateError } = await supabase
        .from('affiliate_profiles')
        .update({
          total_earnings: newTotal,
          pending_balance: newPending,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', affiliateProfile.user_id);

      if (updateError) {
        console.error('Failed to update affiliate balance:', updateError);
      }

      // ── Send notification email to affiliate ──────────────────────────────
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: affiliateProfile.user_id, // The edge function should look up email
            type: 'affiliate_commission',
            data: {
              commission_amount: commissionAmount,
              currency: currency.toUpperCase(),
              gross_amount: grossAmount,
              pending_balance: newPending,
            },
          },
        });
      } catch (emailErr) {
        // Non-blocking — commission is still recorded
        console.warn('Email notification failed:', emailErr);
      }

      console.log(`Commission recorded: €${commissionAmount} for affiliate ${affiliateCode}`);

      return new Response(
        JSON.stringify({
          received: true,
          commission: true,
          amount: commissionAmount,
          currency: currency.toUpperCase(),
          affiliate_code: affiliateCode,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Handle payout_request processed (if using Stripe payouts) ──────────
    if (event.type === 'payout.paid') {
      const payout = event.data.object as Stripe.Payout;
      const affiliateUserId = payout.metadata?.affiliate_user_id;

      if (affiliateUserId) {
        // Update payout request status
        await supabase
          .from('affiliate_payout_requests')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('affiliate_user_id', affiliateUserId)
          .eq('status', 'processing');

        // Deduct from pending balance (amount in cents)
        const payoutAmount = payout.amount / 100;
        const { data: affProf } = await supabase
          .from('affiliate_profiles')
          .select('pending_balance, paid_out')
          .eq('user_id', affiliateUserId)
          .single();

        if (affProf) {
          await supabase
            .from('affiliate_profiles')
            .update({
              pending_balance: Math.max(0, (affProf.pending_balance || 0) - payoutAmount),
              paid_out: (affProf.paid_out || 0) + payoutAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', affiliateUserId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Affiliate commission function error:', err);
    return new Response(JSON.stringify({ error: errMessage(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
