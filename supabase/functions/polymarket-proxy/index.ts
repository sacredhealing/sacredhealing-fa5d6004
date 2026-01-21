import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      // If not ok, throw to trigger retry
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError || new Error("Fetch failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "markets";
    const params = url.searchParams.get("params") || "";

    let apiUrl: string;
    if (endpoint === "book" || endpoint === "order") {
      apiUrl = `${CLOB_API}/${endpoint}${params ? `?${params}` : ""}`;
    } else {
      apiUrl = `${GAMMA_API}/${endpoint}${params ? `?${params}` : ""}`;
    }

    console.log(`Proxying request to: ${apiUrl}`);

    try {
      const response = await fetchWithRetry(apiUrl, 3);
      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      // For order book failures, return empty data instead of error
      // This allows the UI to continue functioning
      if (endpoint === "book") {
        console.warn(`Order book fetch failed, returning empty: ${fetchError}`);
        return new Response(JSON.stringify({ bids: [], asks: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw fetchError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Proxy error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
