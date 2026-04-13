// Polymarket AI Analysis Service
// Uses Gemini to analyze markets and generate trade signals

import { supabase } from '@/integrations/supabase/client';
import type { PolymarketMarket, TradeSignal } from '@/types/polymarket';

interface GeminiResponse {
  response?: string; // gemini-bridge returns 'response' not 'result'
  error?: string;
}

export class PolymarketAI {
  // Analyze a market for trading opportunities
  async analyzeMarket(market: PolymarketMarket): Promise<TradeSignal | null> {
    try {
      const prompt = `You are a Polymarket trading analyst. Analyze this prediction market and provide a trading recommendation.

Market: "${market.question}"
Current Prices: ${market.outcomes.map(o => `${o.name}: ${(o.price * 100).toFixed(1)}%`).join(', ')}
Liquidity: $${market.liquidity.toLocaleString()}
Volume: $${market.volume.toLocaleString()}
End Date: ${market.endDate}

Analyze:
1. Is there a mispricing opportunity based on current news/sentiment?
2. What direction should we trade (if any)?
3. What's the confidence level (0-100)?
4. What's a reasonable target price?

Respond in JSON format:
{
  "shouldTrade": true/false,
  "direction": "buy" or "sell",
  "outcome": "Yes" or "No",
  "confidence": 0-100,
  "reason": "brief explanation",
  "targetPrice": 0.0-1.0
}

Only recommend trading if confidence > 70 and there's clear mispricing.`;

      const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini-bridge', {
        body: {
          prompt,
          model: 'gemini-2.0-flash',
          type: 'market-analysis',
        },
      });

      if (error || !data?.response) {
        console.error('Gemini analysis failed:', error);
        return null;
      }

      // Parse JSON from response (gemini-bridge returns 'response' not 'result')
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.shouldTrade || analysis.confidence < 70) {
        return null;
      }

      // Find the outcome to trade
      const outcomeData = market.outcomes.find(o => 
        o.name.toLowerCase() === analysis.outcome.toLowerCase()
      );

      if (!outcomeData) return null;

      return {
        marketId: market.id,
        direction: analysis.direction,
        outcome: analysis.outcome,
        tokenId: outcomeData.tokenId,
        confidence: analysis.confidence,
        reason: analysis.reason,
        suggestedSize: Math.min(5, market.liquidity * 0.001), // Max $5 or 0.1% of liquidity
        currentPrice: outcomeData.price,
        targetPrice: analysis.targetPrice,
      };
    } catch (error) {
      console.error('Market analysis error:', error);
      return null;
    }
  }

  // Batch analyze multiple markets
  async analyzeMarkets(markets: PolymarketMarket[]): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];

    // Analyze top 5 by liquidity to avoid rate limits
    const topMarkets = markets
      .filter(m => m.liquidity > 50000) // Only high liquidity
      .slice(0, 5);

    for (const market of topMarkets) {
      const signal = await this.analyzeMarket(market);
      if (signal) {
        signals.push(signal);
      }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    return signals;
  }

  // Get market sentiment summary
  async getMarketSentiment(question: string): Promise<{ sentiment: 'bullish' | 'bearish' | 'neutral'; confidence: number }> {
    try {
      const prompt = `Analyze the current sentiment for this prediction market question based on recent news and public opinion:

"${question}"

Respond with JSON only:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0-100,
  "summary": "one sentence explanation"
}`;

      const { data, error } = await supabase.functions.invoke<GeminiResponse>('gemini-bridge', {
        body: {
          prompt,
          model: 'gemini-2.0-flash',
          type: 'sentiment-analysis',
        },
      });

      if (error || !data?.response) {
        return { sentiment: 'neutral', confidence: 50 };
      }

      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { sentiment: 'neutral', confidence: 50 };

      const result = JSON.parse(jsonMatch[0]);
      return {
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 50,
      };
    } catch {
      return { sentiment: 'neutral', confidence: 50 };
    }
  }
}

export const polymarketAI = new PolymarketAI();
