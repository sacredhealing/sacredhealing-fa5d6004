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
  paper_balance: number;
  total_fees_paid: number;
}

// Trading simulation constants
const TAKER_FEE_RATE = 0.0005; // 0.05% taker fee
const SLIPPAGE_BASE = 0.001; // 0.1% base slippage
const SLIPPAGE_SIZE_FACTOR = 0.0001; // Additional slippage per $100 traded
const ORDER_FAILURE_RATE = 0.03; // 3% chance of order rejection
const PROXY_URL = 'https://asia-southeast1-stockgpt-438008.cloudfunctions.net/polymarketProxy';

export class PaperTradingService {
  private userId: string | null = null;
  private isPaperMode = true;

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setMode(isPaper: boolean): void {
    this.isPaperMode = isPaper;
  }

  getMode(): boolean {
    return this.isPaperMode;
  }

  // Get current paper balance
  async getPaperBalance(): Promise<number> {
    if (!this.userId) return 1000;
    
    const settings = await this.loadSettings();
    return settings?.paper_balance ?? 1000;
  }

  // Calculate realistic execution price with slippage
  private async calculateExecutionPrice(
    tokenId: string, 
    size: number, 
    direction: 'buy' | 'sell',
    midPrice: number
  ): Promise<{ executionPrice: number; slippage: number }> {
    try {
      // Fetch order book for realistic pricing
      const response = await fetch(
        `${PROXY_URL}?endpoint=book&params=token_id=${tokenId}`
      );
      
      if (!response.ok) {
        // Fall back to slippage estimation
        const slippage = SLIPPAGE_BASE + (size / 100) * SLIPPAGE_SIZE_FACTOR;
        const executionPrice = direction === 'buy' 
          ? midPrice * (1 + slippage) 
          : midPrice * (1 - slippage);
        return { executionPrice, slippage };
      }
      
      const book = await response.json();
      
      // For buys, we hit asks; for sells, we hit bids
      const orders = direction === 'buy' ? book.asks : book.bids;
      
      if (!orders || orders.length === 0) {
        const slippage = SLIPPAGE_BASE;
        const executionPrice = direction === 'buy' 
          ? midPrice * (1 + slippage) 
          : midPrice * (1 - slippage);
        return { executionPrice, slippage };
      }
      
      // Calculate volume-weighted average price (VWAP) for our order size
      let remainingSize = size;
      let totalCost = 0;
      
      for (const order of orders) {
        const orderPrice = parseFloat(order.price);
        const orderSize = parseFloat(order.size) * orderPrice; // Convert shares to USD value
        
        if (remainingSize <= 0) break;
        
        const fillSize = Math.min(remainingSize, orderSize);
        totalCost += fillSize * orderPrice;
        remainingSize -= fillSize;
      }
      
      // If we couldn't fill the entire order, add extra slippage
      if (remainingSize > 0) {
        const lastPrice = parseFloat(orders[orders.length - 1]?.price || midPrice.toString());
        const extraSlippage = 0.02; // 2% extra for illiquid markets
        totalCost += remainingSize * lastPrice * (direction === 'buy' ? (1 + extraSlippage) : (1 - extraSlippage));
      }
      
      const executionPrice = totalCost / size;
      const slippage = Math.abs(executionPrice - midPrice) / midPrice;
      
      return { executionPrice, slippage };
    } catch (error) {
      console.error('[PaperTrading] Price calculation error:', error);
      const slippage = SLIPPAGE_BASE;
      const executionPrice = direction === 'buy' 
        ? midPrice * (1 + slippage) 
        : midPrice * (1 - slippage);
      return { executionPrice, slippage };
    }
  }

  // Simulate order failure scenarios
  private simulateOrderOutcome(): { success: boolean; failureReason?: string } {
    const random = Math.random();
    
    if (random < ORDER_FAILURE_RATE) {
      const failureReasons = [
        'Order rejected: Insufficient liquidity',
        'Order rejected: Price moved too fast',
        'Order rejected: Market temporarily unavailable',
        'Order rejected: Rate limit exceeded',
      ];
      return {
        success: false,
        failureReason: failureReasons[Math.floor(Math.random() * failureReasons.length)],
      };
    }
    
    return { success: true };
  }

  // Execute a realistic simulated trade
  async executePaperTrade(signal: TradeSignal, strategy?: string): Promise<TradeResult> {
    if (!this.userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Load current settings including balance
      const settings = await this.loadSettings();
      if (!settings) {
        return { success: false, error: 'Failed to load trading settings' };
      }

      const currentBalance = settings.paper_balance ?? 1000;

      // Check if we have enough balance for buy orders
      if (signal.direction === 'buy' && signal.suggestedSize > currentBalance) {
        console.log('[PaperTrading] Insufficient balance:', currentBalance, 'needed:', signal.suggestedSize);
        return { 
          success: false, 
          error: `Insufficient paper balance: €${currentBalance.toFixed(2)} available, €${signal.suggestedSize.toFixed(2)} needed` 
        };
      }

      // Simulate order outcome (random failures)
      const orderOutcome = this.simulateOrderOutcome();
      if (!orderOutcome.success) {
        console.log('[PaperTrading] Simulated order failure:', orderOutcome.failureReason);
        
        // Record failed trade
        await supabase
          .from('polymarket_trades')
          .insert({
            user_id: this.userId,
            market_id: signal.marketId,
            market_question: signal.reason,
            outcome: signal.outcome,
            token_id: signal.tokenId,
            direction: signal.direction,
            shares: 0,
            entry_price: signal.currentPrice,
            amount_usdc: signal.suggestedSize,
            tx_hash: `paper-failed-${Date.now()}`,
            strategy: strategy || 'manual',
            is_paper: true,
            status: 'failed',
          });

        return { success: false, error: orderOutcome.failureReason };
      }

      // Calculate realistic execution price with slippage
      const { executionPrice, slippage } = await this.calculateExecutionPrice(
        signal.tokenId,
        signal.suggestedSize,
        signal.direction,
        signal.currentPrice
      );

      // Calculate trading fee
      const feeAmount = signal.suggestedSize * TAKER_FEE_RATE;
      const totalCost = signal.direction === 'buy' 
        ? signal.suggestedSize + feeAmount 
        : feeAmount; // For sells, fee is deducted from proceeds

      // Double-check balance after fees for buys
      if (signal.direction === 'buy' && totalCost > currentBalance) {
        return { 
          success: false, 
          error: `Insufficient balance after fees: €${currentBalance.toFixed(2)} available, €${totalCost.toFixed(2)} needed (includes €${feeAmount.toFixed(4)} fee)` 
        };
      }

      // Calculate shares received (using realistic execution price, not mid-price)
      const shares = signal.suggestedSize / executionPrice;
      
      // Generate fake tx hash for paper trades
      const fakeTxHash = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      // Insert trade record with realistic pricing
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
          entry_price: executionPrice, // Use realistic execution price
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

      // Update balance
      const newBalance = signal.direction === 'buy'
        ? currentBalance - totalCost
        : currentBalance + (shares * executionPrice) - feeAmount;

      await supabase
        .from('polymarket_bot_settings')
        .update({
          paper_balance: newBalance,
          total_fees_paid: (settings.total_fees_paid ?? 0) + feeAmount,
        })
        .eq('user_id', this.userId);

      // Update or create position (using realistic execution price)
      const adjustedSignal = { ...signal, currentPrice: executionPrice };
      await this.updatePosition(adjustedSignal, shares);

      console.log('[PaperTrading] Realistic paper trade executed:', {
        midPrice: signal.currentPrice,
        executionPrice,
        slippage: `${(slippage * 100).toFixed(3)}%`,
        fee: feeAmount,
        shares,
        newBalance,
      });

      return {
        success: true,
        txHash: fakeTxHash,
        sharesReceived: BigInt(Math.floor(shares * 1e6)),
        amountSpent: totalCost,
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

  // Refresh position prices from market
  async refreshPositionPrices(isPaper = true): Promise<void> {
    if (!this.userId) return;

    const positions = await this.getPositions(isPaper);
    
    // Limit to 5 positions per cycle to avoid rate limiting
    for (const position of positions.slice(0, 5)) {
      try {
        // Fetch current market price via proxy
        const response = await fetch(
          `https://asia-southeast1-stockgpt-438008.cloudfunctions.net/polymarketProxy?endpoint=book&params=token_id=${position.token_id}`
        );
        
        if (!response.ok) continue;
        
        const book = await response.json();
        
        // Get mid-price from order book
        const bestBid = parseFloat(book.bids?.[0]?.price || '0') || position.avg_entry_price;
        const bestAsk = parseFloat(book.asks?.[0]?.price || '0') || position.avg_entry_price;
        const currentPrice = (bestBid + bestAsk) / 2 || position.avg_entry_price;
        
        // Calculate new unrealized PnL
        const unrealizedPnL = (currentPrice - position.avg_entry_price) * position.total_shares;
        
        // Update position in database
        await supabase
          .from('polymarket_positions')
          .update({
            current_price: currentPrice,
            unrealized_pnl: unrealizedPnL,
          })
          .eq('id', position.id);
          
        // Small delay between requests
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        console.error('[PaperTrading] Price refresh error:', error);
      }
    }
  }

  // Get P&L summary including unrealized P&L from open positions
  async getPnLSummary(isPaper = true): Promise<{
    totalPnL: number;
    todayPnL: number;
    totalTrades: number;
    winRate: number;
    unrealizedPnL: number;
  }> {
    if (!this.userId) {
      return { totalPnL: 0, todayPnL: 0, totalTrades: 0, winRate: 0, unrealizedPnL: 0 };
    }

    // Get realized P&L from daily summary
    const { data: dailyData, error: dailyError } = await supabase
      .from('polymarket_pnl_daily')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper);

    // Get unrealized P&L from open positions
    const { data: positions, error: posError } = await supabase
      .from('polymarket_positions')
      .select('unrealized_pnl')
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper);

    // Get total trade count from trades table
    const { count: tradeCount } = await supabase
      .from('polymarket_trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('is_paper', isPaper);

    const unrealizedPnL = positions?.reduce((sum, p) => sum + (Number(p.unrealized_pnl) || 0), 0) || 0;

    if (dailyError || !dailyData) {
      return { totalPnL: unrealizedPnL, todayPnL: 0, totalTrades: tradeCount || 0, winRate: 0, unrealizedPnL };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayData = dailyData.find(d => d.date === today);
    
    const realizedPnL = dailyData.reduce((sum, d) => sum + (d.realized_pnl || 0), 0);
    const totalTrades = tradeCount || dailyData.reduce((sum, d) => sum + (d.total_trades || 0), 0);
    const winningTrades = dailyData.reduce((sum, d) => sum + (d.winning_trades || 0), 0);

    // Total P&L = realized + unrealized
    const totalPnL = realizedPnL + unrealizedPnL;

    return {
      totalPnL,
      todayPnL: (todayData?.realized_pnl || 0) + unrealizedPnL,
      totalTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      unrealizedPnL,
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

  // Reset paper trading balance
  async resetPaperBalance(amount: number = 1000): Promise<boolean> {
    if (!this.userId) return false;

    const { error } = await supabase
      .from('polymarket_bot_settings')
      .update({
        paper_balance: amount,
        total_fees_paid: 0,
      })
      .eq('user_id', this.userId);

    return !error;
  }

  // Full reset: restore balance to €1000, clear fees, cap max trade size to $5
  async resetToDefaults(): Promise<boolean> {
    if (!this.userId) return false;

    const { error } = await supabase
      .from('polymarket_bot_settings')
      .update({
        paper_balance: 1000,
        total_fees_paid: 0,
        max_trade_size: 5,
      })
      .eq('user_id', this.userId);

    return !error;
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
        max_trade_size: 5,
        daily_loss_limit: 500,
        strategies_enabled: {
          whale_mirror: true,
          latency_arb: true,
          volatility_scalp: true,
          ai_signal: true,
        },
        admin_profit_split: 0.1111,
        paper_balance: 1000,
        total_fees_paid: 0,
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
      paper_balance: data.paper_balance ?? 1000,
      total_fees_paid: data.total_fees_paid ?? 0,
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
