// Neural Latency Arbitrage Strategy
// Uses AI to detect news events and trade before market reacts

import { supabase } from '@/integrations/supabase/client';
import type { TradeSignal, PolymarketMarket } from '@/types/polymarket';

interface NewsEvent {
  headline: string;
  source: string;
  timestamp: number;
  confidence: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevantMarkets: string[];
}

interface LatencyConfig {
  enabled: boolean;
  minConfidence: number; // Minimum AI confidence to trade (0-100)
  maxLatencyMs: number; // Max time to execute after news (10-30s)
  newsPollingIntervalMs: number;
  maxTradeSize: number;
}

interface GeminiResponse {
  response?: string;
  error?: string;
}

export class LatencyArbitrageService {
  private config: LatencyConfig;
  private lastNewsCheck: number = 0;
  private processedEvents: Set<string> = new Set();
  private onSignalCallback: ((signal: TradeSignal, event: NewsEvent) => void) | null = null;
  private isActive = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LatencyConfig> = {}) {
    this.config = {
      enabled: true,
      minConfidence: 85, // 85% AI confidence required
      maxLatencyMs: 15000, // 15 second window
      newsPollingIntervalMs: 2000, // Check every 2 seconds
      maxTradeSize: 30, // $30 max per latency trade
      ...config,
    };
  }

  // Set callback for when a latency signal is detected
  onLatencySignal(callback: (signal: TradeSignal, event: NewsEvent) => void): void {
    this.onSignalCallback = callback;
  }

  // Start the news monitoring loop
  startMonitoring(markets: PolymarketMarket[]): void {
    if (this.isActive) return;
    this.isActive = true;
    console.log('[LatencyArb] Starting news monitoring...');

    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkForNewsEvents(markets);
      } catch (err) {
        console.error('[LatencyArb] Error checking news:', err);
      }
    }, this.config.newsPollingIntervalMs);
  }

  // Check for relevant news events
  private async checkForNewsEvents(markets: PolymarketMarket[]): Promise<void> {
    if (!this.config.enabled || markets.length === 0) return;

    // Get top 5 markets by liquidity for monitoring
    const topMarkets = markets
      .filter(m => m.liquidity > 50000 && !m.closed)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    for (const market of topMarkets) {
      try {
        const newsEvent = await this.analyzeMarketNews(market);
        if (newsEvent && newsEvent.confidence >= this.config.minConfidence) {
          await this.processNewsEvent(newsEvent, market);
        }
      } catch (err) {
        console.error('[LatencyArb] Error analyzing market:', market.id, err);
      }
    }
  }

  // Use Gemini to analyze if there's breaking news affecting this market
  private async analyzeMarketNews(market: PolymarketMarket): Promise<NewsEvent | null> {
    const prompt = `You are a high-frequency trading AI monitoring breaking news for prediction markets.

Market Question: "${market.question}"
Current Prices: ${market.outcomes.map(o => `${o.name}: ${(o.price * 100).toFixed(1)}%`).join(', ')}

Analyze if there is any VERY RECENT (last 60 seconds) breaking news that would significantly change the probability of this market's outcome.

IMPORTANT: Only report if you are highly confident (90%+) that recent news affects this specific market.

Respond in JSON format ONLY:
{
  "hasBreakingNews": true/false,
  "headline": "Brief headline of the news",
  "confidence": 0-100,
  "sentiment": "bullish" | "bearish" | "neutral",
  "predictedOutcome": "Yes" | "No",
  "predictedPrice": 0.0-1.0,
  "reasoning": "one sentence explanation"
}

If no relevant breaking news, respond with:
{"hasBreakingNews": false}`;

    try {
      const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini-bridge', {
        body: {
          prompt,
          model: 'gemini-2.0-flash',
          type: 'latency-arbitrage',
        },
      });

      if (error || !data?.response) {
        return null;
      }

      // Parse JSON from response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.hasBreakingNews) return null;

      // Create unique event ID to prevent duplicate processing
      const eventId = `${market.id}-${analysis.headline?.slice(0, 50)}`;
      if (this.processedEvents.has(eventId)) return null;

      return {
        headline: analysis.headline,
        source: 'gemini-3-flash',
        timestamp: Date.now(),
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        relevantMarkets: [market.id],
      };
    } catch (err) {
      console.error('[LatencyArb] AI analysis error:', err);
      return null;
    }
  }

  // Process a detected news event
  private async processNewsEvent(event: NewsEvent, market: PolymarketMarket): Promise<void> {
    if (!this.onSignalCallback) return;

    // Mark as processed
    const eventId = `${market.id}-${event.headline?.slice(0, 50)}`;
    this.processedEvents.add(eventId);

    // Clear old processed events (keep last 1000)
    if (this.processedEvents.size > 1000) {
      const iterator = this.processedEvents.values();
      this.processedEvents.delete(iterator.next().value);
    }

    // Determine trade direction based on sentiment
    const isBullish = event.sentiment === 'bullish';
    const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const noOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'no');

    if (!yesOutcome || !noOutcome) return;

    // If bullish on market, buy Yes; if bearish, buy No
    const outcomeToTrade = isBullish ? yesOutcome : noOutcome;
    const currentPrice = outcomeToTrade.price;

    // Calculate position size based on confidence
    const confidenceMultiplier = event.confidence / 100;
    const tradeSize = Math.min(
      this.config.maxTradeSize * confidenceMultiplier,
      this.config.maxTradeSize
    );

    const signal: TradeSignal = {
      marketId: market.id,
      direction: 'buy',
      outcome: outcomeToTrade.name,
      tokenId: outcomeToTrade.tokenId,
      confidence: event.confidence,
      reason: `[LATENCY] ${event.headline}`,
      suggestedSize: tradeSize,
      currentPrice,
      targetPrice: isBullish ? Math.min(currentPrice * 1.15, 0.95) : Math.min((1 - currentPrice) * 1.15, 0.95),
    };

    console.log('[LatencyArb] Generating latency signal:', signal);
    this.onSignalCallback(signal, event);
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
