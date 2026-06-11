// Returns live Binance spot account balance (USDT + BTC) and BTC spot price.
// Read-only — signs GET /api/v3/account with BINANCE_API_KEY/SECRET.
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

async function hmacSha256Hex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const key = Deno.env.get("BINANCE_API_KEY");
  const secret = Deno.env.get("BINANCE_API_SECRET");
  if (!key || !secret) {
    return json({ ok: false, error: "Missing BINANCE_API_KEY / BINANCE_API_SECRET" });
  }

  try {
    // 1. Spot price (public, no auth)
    const priceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const priceData = await priceRes.json();
    const btcPrice = parseFloat(priceData?.price ?? "0");

    // 2. Signed account call
    const ts = Date.now();
    const qs = `timestamp=${ts}&recvWindow=5000`;
    const sig = await hmacSha256Hex(secret, qs);
    const acctRes = await fetch(
      `https://api.binance.com/api/v3/account?${qs}&signature=${sig}`,
      { headers: { "X-MBX-APIKEY": key } },
    );
    const acctText = await acctRes.text();
    if (!acctRes.ok) {
      return json({ ok: false, error: `Binance ${acctRes.status}: ${acctText.slice(0, 200)}`, btcPrice });
    }
    const acct = JSON.parse(acctText);
    const balances: Array<{ asset: string; free: string; locked: string }> = acct.balances ?? [];
    const get = (a: string) => {
      const b = balances.find((x) => x.asset === a);
      return b ? parseFloat(b.free) + parseFloat(b.locked) : 0;
    };
    const usdt = get("USDT");
    const btc = get("BTC");
    const totalUsd = usdt + btc * btcPrice;

    return json({
      ok: true,
      usdt: Math.round(usdt * 100) / 100,
      btc: Math.round(btc * 1e8) / 1e8,
      btcPrice: Math.round(btcPrice * 100) / 100,
      totalUsd: Math.round(totalUsd * 100) / 100,
      canTrade: !!acct.canTrade,
      accountType: acct.accountType ?? null,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});
