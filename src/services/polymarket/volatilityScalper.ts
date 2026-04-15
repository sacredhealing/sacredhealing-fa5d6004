// Volatility Scalping Strategy (HFT)
// Places laddered limit orders to capture micro-dips during high volatility

import type { TradeSignal, PolymarketMarket } from '@/types/polymarket';
import { polymarketService } from '../polymarketService';

interface LadderOrder {
  tokenId: string;
  outcome: string;
  price: number;
  size: number;
  type: 'limit_buy' | 'limit_sell';
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: number;
}

interface ScalpConfig {
  enabled: boolean;
  ladderSpread: number; // Distance between ladder rungs (0.01 = 1%)
  ladderDepth: number; // Number of orders on each side
  orderSizeUSDC: number; // Size per ladder order
  targetProfitPercent: number; // Take profit target (0.005 = 0.5%)
  maxExposure: number; // Max total exposure per market
  volatilityThreshold: number; // Min price movement to trigger scalping
  scanIntervalMs: number;
}

interface MarketVolatility {
  marketId: string;
  tokenId: string;
  outcome: string;
  currentPrice: number;
  priceHistory: number[];
  volatility: number; // Standard deviation of recent prices
  lastUpdate: number;
}

export class VolatilityScalperService {
  private config: ScalpConfig;
  private volatilityMap: Map<string, MarketVolatility> = new Map();
  private activeOrders: Map<string, LadderOrder[]> = new Map();
  private isActive = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private onSignalCallback: ((signal: TradeSignal, context: { volatility: number; ladder: string }) => void) | null = null;

  constructor(config: Partial<ScalpConfig> = {}) {
    this.config = {
      enabled: true,
      ladderSpread: 0.005, // 0.5% between orders
      ladderDepth: 3, // 3 orders on each side
      orderSizeUSDC: 5, // $5 per ladder order
      targetProfitPercent: 0.005, // 0.5% profit target
      maxExposure: 10, // $10 max per market
      volatilityThreshold: 0.05, // 5% price swing to trigger
      scanIntervalMs: 1000, // Check every second
      ...config,
    };
  }

  // Set callback for scalping signals
  onScalpSignal(callback: (signal: TradeSignal, context: { volatility: number; ladder: string }) => void): void {
    this.onSignalCallback = callback;
  }

  // Start the scalping engine
  startScalping(markets: PolymarketMarket[]): void {
    if (this.isActive) return;
    this.isActive = true;
    console.log('[Scalper] Starting volatility scalping engine...');

    // Initialize volatility tracking for liquid markets
    for (const market of markets.filter(m => m.liquidity > 100000 && !m.closed)) {
      for (const outcome of market.outcomes) {
        this.volatilityMap.set(outcome.tokenId, {
          marketId: market.id,
          tokenId: outcome.tokenId,
          outcome: outcome.name,
          currentPrice: outcome.price,
          priceHistory: [outcome.price],
          volatility: 0,
          lastUpdate: Date.now(),
        });
      }
    }

    // Start scanning loop
    this.scanInterval = setInterval(async () => {
      try {
        await this.scanForOpportunities(markets);
      } catch (err) {
        console.error('[Scalper] Scan error:', err);
      }
    }, this.config.scanIntervalMs);
  }

  // Scan markets for scalping opportunities
  private async scanForOpportunities(markets: PolymarketMarket[]): Promise<void> {
    if (!this.config.enabled) return;

    for (const market of markets.filter(m => m.liquidity > 100000 && !m.closed)) {
      for (const outcome of market.outcomes) {
        await this.updateVolatility(market, outcome);
        await this.checkScalpingOpportunity(market, outcome);
      }
    }
  }

  // Update volatility calculation for a token
  private async updateVolatility(
    market: PolymarketMarket,
    outcome: { id: string; name: string; price: number; tokenId: string }
  ): Promise<void> {
    const tracking = this.volatilityMap.get(outcome.tokenId);
    if (!tracking) return;

    // Fetch current order book for best price
    try {
      const { bestBid, bestAsk } = await polymarketService.getBestPrices(outcome.tokenId);
      const midPrice = (bestBid + bestAsk) / 2 || outcome.price;

      // Update price history (keep last 60 prices = 1 minute at 1s intervals)
      tracking.priceHistory.push(midPrice);
      if (tracking.priceHistory.length > 60) {
        tracking.priceHistory.shift();
      }

      // Calculate volatility (standard deviation)
      const prices = tracking.priceHistory;
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
      const volatility = Math.sqrt(variance);

      tracking.currentPrice = midPrice;
      tracking.volatility = volatility;
      tracking.lastUpdate = Date.now();
    } catch (err) {
      // Silently continue - order book might be temporarily unavailable
    }
  }

  // Check if there's a scalping opportunity
  private async checkScalpingOpportunity(
    market: PolymarketMarket,
    outcome: { id: string; name: string; price: number; tokenId: string }
  ): Promise<void> {
    if (!this.onSignalCallback) return;

    const tracking = this.volatilityMap.get(outcome.tokenId);
    if (!tracking) return;

    // Only scalp if volatility is above threshold
    if (tracking.volatility < this.config.volatilityThreshold) return;

    // Check for micro-dip opportunity
    const priceHistory = tracking.priceHistory;
    if (priceHistory.length < 10) return; // Need history

    const recentAvg = priceHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const currentPrice = tracking.currentPrice;
    const deviation = (currentPrice - recentAvg) / recentAvg;

    // If price dipped significantly below average, it's a buy opportunity
    if (deviation < -this.config.ladderSpread) {
      const signal: TradeSignal = {
        marketId: market.id,
        direction: 'buy',
        outcome: outcome.name,
        tokenId: outcome.tokenId,
        confidence: 75 + Math.min(tracking.volatility * 500, 20), // Higher volatility = higher confidence
        reason: `[SCALP] Micro-dip ${(deviation * 100).toFixed(2)}% below avg`,
        suggestedSize: this.config.orderSizeUSDC,
        currentPrice,
        targetPrice: recentAvg * (1 + this.config.targetProfitPercent),
      };

      console.log('[Scalper] Buy opportunity detected:', signal);
      this.onSignalCallback(signal, {
        volatility: tracking.volatility,
        ladder: 'buy-dip',
      });
    }

    // If price spiked significantly above average, it's a sell opportunity (if we have position)
    if (deviation > this.config.ladderSpread) {
      const signal: TradeSignal = {
        marketId: market.id,
        direction: 'sell',
        outcome: outcome.name,
        tokenId: outcome.tokenId,
        confidence: 75 + Math.min(tracking.volatility * 500, 20),
        reason: `[SCALP] Micro-spike ${(deviation * 100).toFixed(2)}% above avg`,
        suggestedSize: this.config.orderSizeUSDC,
        currentPrice,
        targetPrice: recentAvg * (1 - this.config.targetProfitPercent),
      };

      console.log('[Scalper] Sell opportunity detected:', signal);
      this.onSignalCallback(signal, {
        volatility: tracking.volatility,
        ladder: 'sell-spike',
      });
    }
  }

  // Create a ladder of limit orders around current price
  generateLadder(
    tokenId: string,
    outcome: string,
    currentPrice: number,
    side: 'buy' | 'sell'
  ): LadderOrder[] {
    const orders: LadderOrder[] = [];
    const spread = this.config.ladderSpread;

    for (let i = 1; i <= this.config.ladderDepth; i++) {
      const priceOffset = spread * i;
      const price = side === 'buy' 
        ? currentPrice * (1 - priceOffset) 
        : currentPrice * (1 + priceOffset);

      orders.push({
        tokenId,
        outcome,
        price: Math.max(0.01, Math.min(0.99, price)),
        size: this.config.orderSizeUSDC,
        type: side === 'buy' ? 'limit_buy' : 'limit_sell',
        status: 'pending',
        createdAt: Date.now(),
      });
    }

    return orders;
  }

  // Stop scalping
  stopScalping(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isActive = false;
    this.volatilityMap.clear();
    this.activeOrders.clear();
    console.log('[Scalper] Scalping engine stopped');
  }

  // Get volatility stats
  getVolatilityStats(): MarketVolatility[] {
    return Array.from(this.volatilityMap.values())
      .sort((a, b) => b.volatility - a.volatility);
  }

  // Update configuration
  updateConfig(newConfig: Partial<ScalpConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current config
  getConfig(): ScalpConfig {
    return this.config;
  }

  // Check if active
  isRunning(): boolean {
    return this.isActive;
  }
}

export const volatilityScalperService = new VolatilityScalperService();
