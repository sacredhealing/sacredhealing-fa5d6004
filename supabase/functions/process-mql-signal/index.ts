import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MQLSignal {
  strategy_id: string;
  signal_type: 'buy' | 'sell' | 'close' | 'modify';
  symbol: string;
  timeframe?: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  lot_size?: number;
  leverage?: number;
  signal_strength?: number;
  reason?: string;
  indicators_data?: Record<string, any>;
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signal: MQLSignal = await req.json();

    // Validate required fields
    if (!signal.strategy_id || !signal.signal_type || !signal.symbol) {
      throw new Error("Missing required fields: strategy_id, signal_type, symbol");
    }

    // Verify strategy exists and is active
    const { data: strategy, error: strategyError } = await supabaseAdmin
      .from("mql_strategies")
      .select("id, is_active")
      .eq("id", signal.strategy_id)
      .single();

    if (strategyError || !strategy || !strategy.is_active) {
      throw new Error("Strategy not found or inactive");
    }

    // Insert signal
    const { data: insertedSignal, error: insertError } = await supabaseAdmin
      .from("mql_signals")
      .insert({
        strategy_id: signal.strategy_id,
        signal_type: signal.signal_type,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        lot_size: signal.lot_size,
        leverage: signal.leverage || 1,
        signal_strength: signal.signal_strength || 0,
        reason: signal.reason,
        indicators_data: signal.indicators_data || {},
        status: 'pending',
        expires_at: signal.expires_at,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Get all active subscriptions for this strategy
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("user_strategy_subscriptions")
      .select(`
        *,
        user_bot_connections!inner(*)
      `)
      .eq("strategy_id", signal.strategy_id)
      .eq("status", "active");

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
    }

    // Process copy trading for each subscription
    const copyResults = [];
    if (subscriptions && subscriptions.length > 0) {
      for (const subscription of subscriptions) {
        try {
          const connection = subscription.user_bot_connections;
          if (!connection || !connection.is_active) continue;

          // Calculate lot size based on subscription settings
          const baseLotSize = signal.lot_size || 0.01;
          const adjustedLotSize = baseLotSize * (subscription.lot_multiplier || 1.0);
          const finalLotSize = subscription.max_lot_size 
            ? Math.min(adjustedLotSize, subscription.max_lot_size)
            : adjustedLotSize;

          // Apply copy percentage
          if (subscription.copy_percentage < 100) {
            // Randomly decide if this signal should be copied based on percentage
            if (Math.random() * 100 > subscription.copy_percentage) {
              continue;
            }
          }

          // Create trade for this user
          const { data: trade, error: tradeError } = await supabaseAdmin
            .from("mql_trades")
            .insert({
              user_id: subscription.user_id,
              strategy_id: signal.strategy_id,
              signal_id: insertedSignal.id,
              symbol: signal.symbol,
              trade_type: signal.signal_type === 'buy' ? 'buy' : 'sell',
              entry_price: signal.entry_price || 0,
              stop_loss: signal.stop_loss,
              take_profit: signal.take_profit,
              lot_size: finalLotSize,
              leverage: signal.leverage || 1,
              status: 'pending',
              broker_name: connection.broker_name,
              account_number: connection.account_number,
              platform: connection.platform,
            })
            .select()
            .single();

          if (!tradeError && trade) {
            copyResults.push({
              user_id: subscription.user_id,
              trade_id: trade.id,
              status: 'success',
            });
          } else {
            copyResults.push({
              user_id: subscription.user_id,
              status: 'error',
              error: tradeError?.message,
            });
          }
        } catch (error) {
          copyResults.push({
            user_id: subscription.user_id,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Update signal status to executed if trades were created
    if (copyResults.some(r => r.status === 'success')) {
      await supabaseAdmin
        .from("mql_signals")
        .update({ status: 'executed', executed_at: new Date().toISOString() })
        .eq("id", insertedSignal.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        signal_id: insertedSignal.id,
        subscriptions_processed: subscriptions?.length || 0,
        copy_results: copyResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[PROCESS-MQL-SIGNAL] Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

