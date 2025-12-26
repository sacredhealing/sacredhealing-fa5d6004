import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHC Token address on Solana
const SHC_TOKEN_ADDRESS = "DiwhKbK8Bx2pDSHq35kWA5wAWhQ2DNjiyKCJ59Pq78xm";

// Cache for price to avoid hitting rate limits
let priceCache: { price: number; priceEur: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60000; // 60 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[FETCH-SHC-PRICE] Fetching SHC price from DEXScreener");

    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION_MS) {
      console.log("[FETCH-SHC-PRICE] Returning cached price");
      return new Response(
        JSON.stringify({
          priceUsd: priceCache.price,
          priceEur: priceCache.priceEur,
          cached: true,
          timestamp: priceCache.timestamp,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch from DEXScreener
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${SHC_TOKEN_ADDRESS}`
    );

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[FETCH-SHC-PRICE] DEXScreener response received");

    // Get the price from the first pair (usually the most liquid)
    let priceUsd = 0;
    if (data.pairs && data.pairs.length > 0) {
      // Find the most liquid pair
      const sortedPairs = data.pairs.sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      );
      priceUsd = parseFloat(sortedPairs[0].priceUsd) || 0;
    }

    // Convert USD to EUR (approximate rate, could use an API for real-time)
    const usdToEurRate = 0.92;
    const priceEur = priceUsd * usdToEurRate;

    console.log(`[FETCH-SHC-PRICE] Price: $${priceUsd} / €${priceEur}`);

    // Update cache
    priceCache = {
      price: priceUsd,
      priceEur: priceEur,
      timestamp: Date.now(),
    };

    return new Response(
      JSON.stringify({
        priceUsd,
        priceEur,
        cached: false,
        timestamp: Date.now(),
        tokenAddress: SHC_TOKEN_ADDRESS,
        pairs: data.pairs?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[FETCH-SHC-PRICE] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        // Return a fallback price if API fails
        priceUsd: 0.00001,
        priceEur: 0.0000092,
        fallback: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 with fallback to not break UI
      }
    );
  }
});
