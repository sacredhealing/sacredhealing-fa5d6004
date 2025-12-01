import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { trackId, paymentMethod } = await req.json();
    
    console.log(`Purchase request - Track: ${trackId}, Method: ${paymentMethod}, User: ${user.id}`);

    // Get track info
    const { data: track, error: trackError } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (trackError || !track) throw new Error('Track not found');

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('music_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existingPurchase) {
      throw new Error('You already own this track');
    }

    if (paymentMethod === 'shc') {
      // Check user balance
      const { data: balance, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      if (!balance || Number(balance.balance) < track.price_shc) {
        throw new Error('Insufficient SHC balance');
      }

      // Deduct balance
      const newBalance = Number(balance.balance) - track.price_shc;
      await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          total_spent: Number(balance.balance) + track.price_shc
        })
        .eq('user_id', user.id);

      // Record SHC transaction
      await supabase
        .from('shc_transactions')
        .insert({
          user_id: user.id,
          type: 'spent',
          amount: -track.price_shc,
          description: `Purchased: ${track.title}`,
          status: 'completed'
        });

      // Record purchase
      await supabase
        .from('music_purchases')
        .insert({
          user_id: user.id,
          track_id: trackId,
          payment_method: 'shc',
          shc_paid: track.price_shc
        });

      // Award SHC reward
      if (track.shc_reward > 0) {
        await supabase
          .from('user_balances')
          .update({ 
            balance: newBalance + track.shc_reward,
            total_earned: Number(balance.balance) + track.shc_reward
          })
          .eq('user_id', user.id);

        await supabase
          .from('shc_transactions')
          .insert({
            user_id: user.id,
            type: 'earned',
            amount: track.shc_reward,
            description: `Reward for purchasing: ${track.title}`,
            status: 'completed'
          });
      }

      // Update purchase count
      await supabase
        .from('music_tracks')
        .update({ purchase_count: track.purchase_count + 1 })
        .eq('id', trackId);

      console.log(`SHC purchase completed for ${track.title}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Purchase completed with SHC',
          fullAudioUrl: track.full_audio_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentMethod === 'stripe') {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

      // Check for existing customer
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const origin = req.headers.get('origin') || 'https://lovable.dev';

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email!,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: track.title,
                description: `${track.artist} - ${track.genre}`,
              },
              unit_amount: Math.round(Number(track.price_usd) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/music?purchased=${trackId}`,
        cancel_url: `${origin}/music`,
        metadata: {
          user_id: user.id,
          track_id: trackId,
        },
      });

      console.log(`Stripe checkout session created: ${session.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          checkoutUrl: session.url 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid payment method');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Purchase error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
