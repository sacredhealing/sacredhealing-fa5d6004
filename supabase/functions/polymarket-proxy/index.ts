import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const response = await fetch(apiUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Proxy error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
