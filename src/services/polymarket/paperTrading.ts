// Paper Trading Service
// Simulates trades without executing on-chain, with full database tracking

import { supabase } from '@/integrations/supabase/client';
import type { TradeSignal, TradeResult, Position } from '@/types/polymarket';

export interface PaperTrade {
  id: string;
  user_id: string;
  market_id: string;
  market_question: string | null;
  outcome: string;
  token_id: string;
  direction: 'buy' | 'sell';
  shares: number;
  entry_price: number;
  exit_price: number | null;
  amount_usdc: number;
  pnl: number;
  tx_hash: string | null;
  strategy: string | null;
  is_paper: boolean;
  status: 'open' | 'closed' | 'cancelled' | 'failed';
  created_at: string;
  closed_at: string | null;
}

export interface PaperPosition {
  id: string;
  user_id: string;
  market_id: string;
  market_question: string | null;
  outcome: string;
  token_id: string;
  total_shares: number;
  avg_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  is_paper: boolean;
}

export interface BotSettings {
  is_paper_mode: boolean;
  max_trade_size: number;
  daily_loss_limit: number;
  strategies_enabled: {
    whale_mirror: boolean;
    latency_arb: boolean;
    volatility_scalp: boolean;
    ai_signal: boolean;
  };
  admin_profit_split: number;
}

export class PaperTradingService {
  private userId: string | null = null;
  private isPaperMode = true;
  private simulatedBalance = 1000; // Start with $1000 paper balance

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setMode(isPaper: boolean): void {
    this.isPaperMode = isPaper;
  }

  getMode(): boolean {
    return this.isPaperMode;
  }

  // Execute a simulated trade
  async executePaperTrade(signal: TradeSignal, strategy?: string): Promise<TradeResult> {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Calculate shares received
      const shares = signal.suggestedSize / signal.currentPrice;
      
      // Generate fake tx hash for paper trades
      const fakeTxHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      // Insert trade record
      const { data: trade, error: tradeError } = await supabase
        .from('polymarket_trades')
        .insert({
          user_id: this.userId,
          market_id: signal.marketId,
          market_question: signal.reason,
          outcome: signal.outcome,
          token_id: signal.tokenId,
          direction: signal.direction,
          shares,
          entry_price: signal.currentPrice,
          amount_usdc: signal.suggestedSize,
          tx_hash: fakeTxHash,
          strategy: strategy || 'manual',
          is_paper: true,
          status: 'open',
        })
        .select()
        .single();

      if (tradeError) {
        console.error('[PaperTrading] Trade insert error:', tradeError);
        return { success: false, error: tradeError.message };
      }

      // Update or create position
      await this.updatePosition(signal, shares);

      // Update daily P&L
      await this.updateDailyPnL(0, 1, false);

      console.log('[PaperTrading] Paper trade executed:', trade);

      return {
        success: true,
        txHash: fakeTxHash,
        sharesReceived: BigInt(Math.floor(shares * 1e6)),
        amountSpent: signal.suggestedSize,
      };
    } catch (err) {
      console.error('[PaperTrading] Execution error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Paper trade failed',
      };
    }
  }

  // Update or create a position
  private async updatePosition(signal: TradeSignal, newShares: number): Promise<void> {
    if (!this.userId) return;

    const { data: existing } = await supabase
      .from('polymarket_positions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('token_id', signal.tokenId)
      .eq('is_paper', true)
      .single();

    if (existing) {
      // Update existing position
      const totalShares = signal.direction === 'buy' 
        ? existing.total_shares + newShares 
        : existing.total_shares - newShares;
      
      const avgPrice = signal.direction === 'buy'
        ? ((existing.avg_entry_price * existing.total_shares) + (signal.currentPrice * newShares)) / totalShares
        : existing.avg_entry_price;

      if (totalShares <= 0) {
        // Close position
        await supabase
          .from('polymarket_positions')
          .delete()
          .eq('id', existing.id);
      } else {
        await supabase
          .from('polymarket_positions')
          .update({
            total_shares: totalShares,
            avg_entry_price: avgPrice,
            current_price: signal.currentPrice,
            unrealized_pnl: (signal.currentPrice - avgPrice) * totalShares,
          })
          .eq('id', existing.id);
      }
    } else if (signal.direction === 'buy') {
      // Create new position
      await supabase
        .from('polymarket_positions')
        .insert({
          user_id: this.userId,
          market_id: signal.marketId,
          market_question: signal.reason,
          outcome: signal.outcome,
          token_id: signal.tokenId,
          total_shares: newShares,
          avg_entry_price: signal.currentPrice,
          current_price: signal.currentPrice,
          unrealized_pnl: 0,
          is_paper: true,
        });
    }
  }

  // Update daily P&L record
  private async updateDailyPnL(pnl: number, trades: number, isWin: boolean): Promise<void> {
    if (!this.userId) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('polymarket_pnl_daily')
      .select('*')
      .eq('user_id', this.userId)
      .eq('date', today)
      .eq('is_paper', true)
      .single();

    if (existing) {
      await supabase
        .from('polymarket_pnl_daily')
        .update({
          realized_pnl: existing.realized_pnl + pnl,
          total_trades: existing.total_trades + trades,
          winning_trades: isWin ? existing.winning_trades + 1 : existing.winning_trades,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('polymarket_pnl_daily')
        .insert({
          user_id: this.userId,
          date: today,
          realized_pnl: pnl,
          total_trades: trades,
          winning_trades: isWin ? 1 : 0,
          is_paper: true,
        });
    }
  }

  // Get all open positions
  async getPositions(isPaper = true): Promise<PaperPosition[]> {
    if (!this.userId) return [];

    const { data, error } = await supabase
      .from('polymarket_positions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PaperTrading] Get positions error:', error);
      return [];
    }

    return data || [];
  }

  // Get trade history
  async getTrades(isPaper = true, limit = 50): Promise<PaperTrade[]> {
    if (!this.userId) return [];

    const { data, error } = await supabase
      .from('polymarket_trades')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PaperTrading] Get trades error:', error);
      return [];
    }

    // Cast to proper types
    return (data || []).map(t => ({
      ...t,
      direction: t.direction as 'buy' | 'sell',
      status: t.status as 'open' | 'closed' | 'cancelled' | 'failed',
    })) as PaperTrade[];
  }

  // Get P&L summary
  async getPnLSummary(isPaper = true): Promise<{
    totalPnL: number;
    todayPnL: number;
    totalTrades: number;
    winRate: number;
  }> {
    if (!this.userId) {
      return { totalPnL: 0, todayPnL: 0, totalTrades: 0, winRate: 0 };
    }

    const { data, error } = await supabase
      .from('polymarket_pnl_daily')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper);

    if (error || !data) {
      return { totalPnL: 0, todayPnL: 0, totalTrades: 0, winRate: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayData = data.find(d => d.date === today);
    
    const totalPnL = data.reduce((sum, d) => sum + (d.realized_pnl || 0), 0);
    const totalTrades = data.reduce((sum, d) => sum + (d.total_trades || 0), 0);
    const winningTrades = data.reduce((sum, d) => sum + (d.winning_trades || 0), 0);

    return {
      totalPnL,
      todayPnL: todayData?.realized_pnl || 0,
      totalTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    };
  }

  // Close a position
  async closePosition(positionId: string, currentPrice: number): Promise<TradeResult> {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: position, error: fetchError } = await supabase
      .from('polymarket_positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (fetchError || !position) {
      return { success: false, error: 'Position not found' };
    }

    // Calculate P&L
    const pnl = (currentPrice - position.avg_entry_price) * position.total_shares;
    const isWin = pnl > 0;

    // Create closing trade
    const fakeTxHash = `paper-close-${Date.now()}`;
    
    await supabase
      .from('polymarket_trades')
      .insert({
        user_id: this.userId,
        market_id: position.market_id,
        market_question: position.market_question,
        outcome: position.outcome,
        token_id: position.token_id,
        direction: 'sell',
        shares: position.total_shares,
        entry_price: position.avg_entry_price,
        exit_price: currentPrice,
        amount_usdc: currentPrice * position.total_shares,
        pnl,
        tx_hash: fakeTxHash,
        strategy: 'manual',
        is_paper: position.is_paper,
        status: 'closed',
        closed_at: new Date().toISOString(),
      });

    // Delete position
    await supabase
      .from('polymarket_positions')
      .delete()
      .eq('id', positionId);

    // Update P&L
    await this.updateDailyPnL(pnl, 1, isWin);

    return {
      success: true,
      txHash: fakeTxHash,
      amountSpent: currentPrice * position.total_shares,
    };
  }

  // Load/save bot settings
  async loadSettings(): Promise<BotSettings | null> {
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('polymarket_bot_settings')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) {
      // Create default settings
      const defaultSettings: BotSettings = {
        is_paper_mode: true,
        max_trade_size: 50,
        daily_loss_limit: 500,
        strategies_enabled: {
          whale_mirror: true,
          latency_arb: true,
          volatility_scalp: true,
          ai_signal: true,
        },
        admin_profit_split: 0.1111,
      };

      await supabase
        .from('polymarket_bot_settings')
        .insert({
          user_id: this.userId,
          ...defaultSettings,
        });

      return defaultSettings;
    }

    return {
      is_paper_mode: data.is_paper_mode,
      max_trade_size: data.max_trade_size,
      daily_loss_limit: data.daily_loss_limit,
      strategies_enabled: data.strategies_enabled as BotSettings['strategies_enabled'],
      admin_profit_split: data.admin_profit_split,
    };
  }

  async saveSettings(settings: Partial<BotSettings>): Promise<boolean> {
    if (!this.userId) return false;

    const { error } = await supabase
      .from('polymarket_bot_settings')
      .upsert({
        user_id: this.userId,
        ...settings,
      });

    return !error;
  }
}

export const paperTradingService = new PaperTradingService();
