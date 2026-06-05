import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAILWAY = "https://siddha-soma-apothecary-production.up.railway.app";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "health";
  const allowed = ["health", "trades", "whales", "status"];
  if (!allowed.includes(endpoint)) {
    return new Response(JSON.stringify({ error: "not allowed" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  try {
    const limit = url.searchParams.get("limit") ?? "20";
    const fetchUrl = endpoint === "trades"
      ? `${RAILWAY}/${endpoint}?limit=${limit}`
      : `${RAILWAY}/${endpoint}`;

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "SQI-Proxy/1.0",
        "Host": "siddha-soma-apothecary-production.up.railway.app",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "upstream_failed", detail: String(e) }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
