import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// In-memory cache per isolate (best-effort)
const cache = new Map<string, { price: number; ts: number }>();
const TTL = 8_000;

async function fetchDex(addresses: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  // dexscreener accepts up to 30 comma-separated
  for (let i = 0; i < addresses.length; i += 30) {
    const chunk = addresses.slice(i, i + 30);
    try {
      const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const pairs: any[] = j?.pairs || [];
      // group by baseToken.address, pick most liquid
      const byMint: Record<string, any[]> = {};
      for (const p of pairs) {
        const addr = p?.baseToken?.address;
        if (!addr) continue;
        const price = parseFloat(p?.priceUsd);
        if (!price || price <= 0) continue;
        (byMint[addr] ||= []).push(p);
      }
      for (const [addr, arr] of Object.entries(byMint)) {
        arr.sort((a, b) => parseFloat(b?.liquidity?.usd || 0) - parseFloat(a?.liquidity?.usd || 0));
        out[addr] = parseFloat(arr[0].priceUsd);
      }
    } catch (e) {
      console.error("[token-price-batch] dex chunk error:", e);
    }
  }
  return out;
}

async function fetchJupFallback(addresses: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  try {
    const r = await fetch(`https://lite-api.jup.ag/price/v3?ids=${addresses.join(",")}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const j = await r.json();
      for (const [k, v] of Object.entries<any>(j || {})) {
        const p = parseFloat(v?.usdPrice ?? v?.price);
        if (p > 0) out[k] = p;
      }
    }
  } catch {}
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    let mints: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      mints = Array.isArray(body?.mints) ? body.mints : [];
    } else {
      const url = new URL(req.url);
      mints = (url.searchParams.get("mints") || "").split(",").filter(Boolean);
    }
    mints = [...new Set(mints.filter(Boolean))];

    const now = Date.now();
    const prices: Record<string, number> = {};
    const need: string[] = [];
    for (const m of mints) {
      const c = cache.get(m);
      if (c && now - c.ts < TTL) prices[m] = c.price;
      else need.push(m);
    }

    if (need.length) {
      // Jupiter FIRST — real-time on-chain prices, accurate for new nano-caps
      // DexScreener FALLBACK — lags on new/illiquid tokens
      const jup = await fetchJupFallback(need);
      const missingJup = need.filter((m) => !jup[m]);
      const dex = missingJup.length ? await fetchDex(missingJup) : {};
      for (const m of need) {
        const p = jup[m] ?? dex[m];
        if (p && p > 0) {
          prices[m] = p;
          cache.set(m, { price: p, ts: now });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, prices, ts: now }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e), prices: {} }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
