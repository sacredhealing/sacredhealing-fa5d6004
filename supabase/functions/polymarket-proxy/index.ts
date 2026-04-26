import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, poly_address, poly_signature, poly_timestamp, poly_nonce, poly_api_key, poly_passphrase, poly_api_key_version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const POLY_HEADERS = [
  "POLY_ADDRESS",
  "POLY_SIGNATURE",
  "POLY_TIMESTAMP",
  "POLY_NONCE",
  "POLY_API_KEY",
  "POLY_PASSPHRASE",
  "POLY_API_KEY_VERSION",
];

const CLOB_PREFIXES = [
  "book",
  "order",
  "orders",
  "auth/api-key",
  "auth/derive-api-key",
  "trade-history",
  "trades",
  "data/positions",
];

function isClobEndpoint(endpoint: string): boolean {
  return CLOB_PREFIXES.some((p) => endpoint === p || endpoint.startsWith(`${p}/`));
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error("Fetch failed");
}

function pickAuthHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of POLY_HEADERS) {
    const v = req.headers.get(name) || req.headers.get(name.toLowerCase());
    if (v) out[name] = v;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "markets";
    const params = url.searchParams.get("params") || "";

    const isClob = isClobEndpoint(endpoint);
    const baseUrl = isClob ? CLOB_API : GAMMA_API;
    const apiUrl = `${baseUrl}/${endpoint}${params ? `?${params}` : ""}`;

    console.log(`[polymarket-proxy] ${req.method} ${apiUrl}`);

    const isWrite = req.method === "POST" || req.method === "DELETE";
    const init: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...pickAuthHeaders(req),
      },
    };
    if (isWrite) {
      init.body = await req.text();
    }

    let response: Response;
    if (isWrite) {
      response = await fetch(apiUrl, init);
    } else {
      response = await fetchWithRetry(apiUrl, init, 3);
    }

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[polymarket-proxy] error:", errorMessage);

    const url = new URL(req.url);
    if (url.searchParams.get("endpoint") === "book") {
      return new Response(JSON.stringify({ bids: [], asks: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
