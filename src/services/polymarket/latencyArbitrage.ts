// Neural Latency Arbitrage Strategy
// Detects rapid price movements in real Polymarket market data — NO AI headline generation.
// AI headline generation was disabled: it produced hallucinated news (e.g. "Curry retires",
// "Wembanyama signs deal") that never happened, causing false signals and wasted trades.

import type { TradeSignal, PolymarketMarket } from '@/types/polymarket';

interface PriceSnapshot {
  price: number;
  timestamp: number;
}

interface LatencyConfig {
  enabled: boolean;
  minPriceMovePct: number; // Minimum % price move in the window to trigger a signal (e.g. 3 = 3%)
  windowMs: number;        // How far back to look for price movement (ms)
  newsPollingIntervalMs: number;
  maxTradeSize: number;
}

// NewsEvent kept for callback type compatibility — populated from real price data only.
interface NewsEvent {
  headline: string;
  source: string;
  timestamp: number;
  confidence: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevantMarkets: string[];
}

export class LatencyArbitrageService {
  private config: LatencyConfig;
  private priceHistory: Map<string, PriceSnapshot[]> = new Map();
  private processedEvents: Set<string> = new Set();
  private onSignalCallback: ((signal: TradeSignal, event: NewsEvent) => void) | null = null;
  private isActive = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LatencyConfig> = {}) {
    this.config = {
      enabled: true,
      minPriceMovePct: 3,          // Only fire if price moved ≥3% in the window
      windowMs: 30000,             // 30-second observation window
      newsPollingIntervalMs: 2000, // Sample prices every 2 seconds
      maxTradeSize: 5,             // $5 max per latency trade
      ...config,
    };
  }

  onLatencySignal(callback: (signal: TradeSignal, event: NewsEvent) => void): void {
    this.onSignalCallback = callback;
  }

  startMonitoring(markets: PolymarketMarket[]): void {
    if (this.isActive) return;
    this.isActive = true;
    console.log('[LatencyArb] Starting real price-movement monitoring (AI headlines disabled)...');

    this.pollingInterval = setInterval(() => {
      try {
        this.samplePricesAndDetect(markets);
      } catch (err) {
        console.error('[LatencyArb] Error sampling prices:', err);
      }
    }, this.config.newsPollingIntervalMs);
  }

  // Record current prices and fire a signal when a meaningful move is detected.
  private samplePricesAndDetect(markets: PolymarketMarket[]): void {
    if (!this.config.enabled || markets.length === 0) return;

    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    const topMarkets = markets
      .filter(m => m.liquidity > 5000 && !m.closed)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    for (const market of topMarkets) {
      const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
      const noOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'no');
      if (!yesOutcome || !noOutcome) continue;

      // Record snapshot
      const history = this.priceHistory.get(market.id) ?? [];
      history.push({ price: yesOutcome.price, timestamp: now });

      // Prune old entries
      const fresh = history.filter(s => s.timestamp >= cutoff);
      this.priceHistory.set(market.id, fresh);

      if (fresh.length < 2) continue;

      const oldest = fresh[0];
      const movePct = ((yesOutcome.price - oldest.price) / oldest.price) * 100;
      const absMove = Math.abs(movePct);

      if (absMove < this.config.minPriceMovePct) continue;

      // Deduplicate: one signal per market per 60-second window
      const eventId = `${market.id}-${Math.floor(now / 60000)}`;
      if (this.processedEvents.has(eventId)) continue;
      this.processedEvents.add(eventId);

      if (this.processedEvents.size > 500) {
        this.processedEvents.delete(this.processedEvents.values().next().value);
      }

      const isBullish = movePct > 0;
      const outcomeToTrade = isBullish ? yesOutcome : noOutcome;
      const currentPrice = outcomeToTrade.price;

      // Confidence scales with the size of the move (capped at 90)
      const confidence = Math.min(90, 60 + absMove * 3);
      const tradeSize = Math.min(this.config.maxTradeSize, this.config.maxTradeSize * (confidence / 100));

      const priceLabel = `${oldest.price.toFixed(3)} → ${yesOutcome.price.toFixed(3)}`;
      const event: NewsEvent = {
        headline: `Price moved ${movePct > 0 ? '+' : ''}${movePct.toFixed(1)}% (${priceLabel}) on real market data`,
        source: 'polymarket-price-feed',
        timestamp: now,
        confidence,
        sentiment: isBullish ? 'bullish' : 'bearish',
        relevantMarkets: [market.id],
      };

      const signal: TradeSignal = {
        marketId: market.id,
        direction: 'buy',
        outcome: outcomeToTrade.name,
        tokenId: outcomeToTrade.tokenId,
        confidence,
        reason: `[LATENCY] ${event.headline}`,
        suggestedSize: tradeSize,
        currentPrice,
        // Bullish YES move → buy YES; bearish YES move → buy NO. Target is +10% on the traded outcome.
        targetPrice: Math.min(currentPrice * 1.1, 0.95),
      };

      console.log('[LatencyArb] Real price-movement signal:', signal);
      if (this.onSignalCallback) this.onSignalCallback(signal, event);
    }
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isActive = false;
    console.log('[LatencyArb] Monitoring stopped');
  }

  // Update configuration
  updateConfig(newConfig: Partial<LatencyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current config
  getConfig(): LatencyConfig {
    return this.config;
  }

  // Check if active
  isRunning(): boolean {
    return this.isActive;
  }
}

export const latencyArbitrageService = new LatencyArbitrageService();
