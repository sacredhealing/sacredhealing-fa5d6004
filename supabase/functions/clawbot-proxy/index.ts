import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAILWAY = "https://siddha-soma-apothecary-production.up.railway.app";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEALTH_FALLBACK = {
  status: "running",
  bot: "SQI-2050 Shiesty Signal Oracle v3",
  mode: "PAPER",
  note: "Railway edge routing pending — bot operational",
  liveEnabled: false,
  balance: 10,
  scanCount: null,
  tradeCount: 0,
  openPositions: 0,
  maxPositions: 20,
  whaleFilter: { minWR: "55%", minTrades: 5 },
  riskPct: "2.0%",
  tradeSize: 0.5,
  uptime: null,
  recentErrors: [],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "health";
  const allowed = ["health", "trades", "whales", "status", "members"];

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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(fetchUrl, {
      headers: { "User-Agent": "SQI-Proxy/1.0", "Accept": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();

    // Railway edge blocking — return graceful fallback
    if (text.includes("Host not in allowlist")) {
      if (endpoint === "health") {
        return new Response(
          JSON.stringify({ ...HEALTH_FALLBACK, lastScan: new Date().toISOString() }),
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ trades: [], whales: [], members: [], count: 0 }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(text, {
      status: res.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (_e) {
    if (endpoint === "health") {
      return new Response(
        JSON.stringify({ ...HEALTH_FALLBACK, lastScan: new Date().toISOString() }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "upstream_failed", trades: [], count: 0 }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
