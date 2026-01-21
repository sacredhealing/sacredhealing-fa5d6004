// Polymarket API Service
// Fetches market data from Polymarket's public CLOB API

import type { PolymarketMarket, PolymarketOutcome } from '@/types/polymarket';

const POLYMARKET_API = 'https://clob.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

interface CLOBMarket {
  condition_id: string;
  question_id: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price: number;
  }>;
  minimum_order_size: string;
  minimum_tick_size: string;
  active: boolean;
  closed: boolean;
  end_date_iso: string;
}

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  endDate: string;
  liquidity: string;
  volume: string;
  category: string;
  active: boolean;
  closed: boolean;
  outcomes: string;
  outcomePrices: string;
  clobTokenIds: string;
}

export class PolymarketService {
  private markets: Map<string, PolymarketMarket> = new Map();
  private lastFetch: Date | null = null;

  // Fetch all active markets from Gamma API (easier to parse)
  async fetchMarkets(limit = 100): Promise<PolymarketMarket[]> {
    try {
      const response = await fetch(
        `${GAMMA_API}/markets?limit=${limit}&active=true&closed=false`
      );
      
      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }

      const data: GammaMarket[] = await response.json();
      
      const markets: PolymarketMarket[] = data.map((m) => {
        const outcomeNames = JSON.parse(m.outcomes || '["Yes","No"]');
        const outcomePrices = JSON.parse(m.outcomePrices || '[0.5,0.5]');
        const tokenIds = JSON.parse(m.clobTokenIds || '["",""]');

        const outcomes: PolymarketOutcome[] = outcomeNames.map((name: string, i: number) => ({
          id: `${m.id}-${i}`,
          name,
          price: parseFloat(outcomePrices[i]) || 0.5,
          tokenId: tokenIds[i] || '',
        }));

        return {
          id: m.id,
          question: m.question,
          slug: m.slug,
          endDate: m.endDate,
          liquidity: parseFloat(m.liquidity) || 0,
          volume: parseFloat(m.volume) || 0,
          outcomes,
          category: m.category || 'other',
          active: m.active,
          closed: m.closed,
        };
      });

      // Cache markets
      markets.forEach((m) => this.markets.set(m.id, m));
      this.lastFetch = new Date();

      return markets;
    } catch (error) {
      console.error('Failed to fetch Polymarket markets:', error);
      throw error;
    }
  }

  // Get order book for a specific token
  async getOrderBook(tokenId: string): Promise<{ bids: Array<{ price: number; size: number }>; asks: Array<{ price: number; size: number }> }> {
    try {
      const response = await fetch(`${POLYMARKET_API}/book?token_id=${tokenId}`);
      
      if (!response.ok) {
        throw new Error(`CLOB API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        bids: data.bids || [],
        asks: data.asks || [],
      };
    } catch (error) {
      console.error('Failed to fetch order book:', error);
      return { bids: [], asks: [] };
    }
  }

  // Get best prices for a token
  async getBestPrices(tokenId: string): Promise<{ bestBid: number; bestAsk: number; spread: number }> {
    const book = await this.getOrderBook(tokenId);
    
    const bestBid = book.bids[0]?.price || 0;
    const bestAsk = book.asks[0]?.price || 1;
    const spread = bestAsk - bestBid;

    return { bestBid, bestAsk, spread };
  }

  // Find arbitrage opportunities (mispriced markets)
  async findOpportunities(minLiquidity = 10000): Promise<PolymarketMarket[]> {
    const markets = await this.fetchMarkets(200);
    
    // Filter for high liquidity markets with potential mispricing
    return markets.filter((m) => {
      if (m.liquidity < minLiquidity) return false;
      if (m.closed) return false;
      
      // Look for markets where probabilities don't sum to ~1
      const probSum = m.outcomes.reduce((sum, o) => sum + o.price, 0);
      const hasArb = Math.abs(probSum - 1) > 0.02; // 2% deviation
      
      return hasArb;
    });
  }

  // Get market by ID
  getMarket(id: string): PolymarketMarket | undefined {
    return this.markets.get(id);
  }

  // Get cached markets
  getCachedMarkets(): PolymarketMarket[] {
    return Array.from(this.markets.values());
  }
}

export const polymarketService = new PolymarketService();
