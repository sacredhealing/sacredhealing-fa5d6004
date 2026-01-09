import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TradeData {
  trade_ticket: string;
  user_id: string;
  connection_id: string;
  strategy_id?: string;
  signal_id?: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  lot_size: number;
  leverage?: number;
  profit_loss?: number;
  profit_loss_usd?: number;
  commission?: number;
  swap?: number;
  status: 'open' | 'closed' | 'pending' | 'cancelled' | 'rejected';
  opened_at: string;
  closed_at?: string;
  broker_name?: string;
  account_number?: string;
  platform?: 'MT4' | 'MT5' | 'cTrader' | 'other';
  notes?: string;
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
    // Authenticate user if Authorization header is provided
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (!userError && userData.user) {
        userId = userData.user.id;
      }
    }

    const body = await req.json();
    const trades: TradeData | TradeData[] = body.trade || body.trades || body;

    // Handle single trade or array of trades
    const tradesArray = Array.isArray(trades) ? trades : [trades];
    const results = [];

    for (const trade of tradesArray) {
      try {
        // Validate required fields
        if (!trade.trade_ticket || !trade.symbol || !trade.trade_type || !trade.entry_price) {
          throw new Error("Missing required fields: trade_ticket, symbol, trade_type, entry_price");
        }

        // If user_id not provided, try to get from connection_id
        let finalUserId = trade.user_id || userId;
        if (!finalUserId && trade.connection_id) {
          const { data: connection } = await supabaseAdmin
            .from("user_bot_connections")
            .select("user_id")
            .eq("id", trade.connection_id)
            .single();
          
          if (connection) {
            finalUserId = connection.user_id;
          }
        }

        if (!finalUserId) {
          throw new Error("User ID not found");
        }

        // Check if trade already exists
        const { data: existingTrade } = await supabaseAdmin
          .from("mql_trades")
          .select("id, status")
          .eq("trade_ticket", trade.trade_ticket)
          .single();

        if (existingTrade) {
          // Update existing trade
          const { data: updatedTrade, error: updateError } = await supabaseAdmin
            .from("mql_trades")
            .update({
              exit_price: trade.exit_price,
              stop_loss: trade.stop_loss,
              take_profit: trade.take_profit,
              profit_loss: trade.profit_loss,
              profit_loss_usd: trade.profit_loss_usd,
              commission: trade.commission,
              swap: trade.swap,
              status: trade.status,
              closed_at: trade.closed_at,
              notes: trade.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingTrade.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          results.push({
            trade_ticket: trade.trade_ticket,
            action: 'updated',
            trade_id: updatedTrade.id,
          });
        } else {
          // Insert new trade
          const { data: insertedTrade, error: insertError } = await supabaseAdmin
            .from("mql_trades")
            .insert({
              user_id: finalUserId,
              strategy_id: trade.strategy_id,
              signal_id: trade.signal_id,
              trade_ticket: trade.trade_ticket,
              symbol: trade.symbol,
              trade_type: trade.trade_type,
              entry_price: trade.entry_price,
              exit_price: trade.exit_price,
              stop_loss: trade.stop_loss,
              take_profit: trade.take_profit,
              lot_size: trade.lot_size,
              leverage: trade.leverage || 1,
              profit_loss: trade.profit_loss || 0,
              profit_loss_usd: trade.profit_loss_usd || 0,
              commission: trade.commission || 0,
              swap: trade.swap || 0,
              status: trade.status || 'open',
              opened_at: trade.opened_at || new Date().toISOString(),
              closed_at: trade.closed_at,
              broker_name: trade.broker_name,
              account_number: trade.account_number,
              platform: trade.platform,
              notes: trade.notes,
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          results.push({
            trade_ticket: trade.trade_ticket,
            action: 'created',
            trade_id: insertedTrade.id,
          });
        }
      } catch (error) {
        results.push({
          trade_ticket: trade.trade_ticket,
          action: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SYNC-MQL-TRADES] Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

