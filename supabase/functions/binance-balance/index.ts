// Returns live Binance spot account balance. Proxies through the Hetzner delta-arb
// bot's /balance endpoint instead of calling Binance directly — Supabase's edge
// runtime IP is geo-blocked by Binance (451), Hetzner's is not (confirmed).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const res = await fetch("http://178.105.183.74:8081/balance", {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return json(data);
  } catch (e) {
    return json({ ok: false, error: `Hetzner unreachable: ${String(e instanceof Error ? e.message : e)}` });
  }
});
