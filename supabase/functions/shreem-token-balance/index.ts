// Returns the on-chain SPL token balance for a given owner+mint.
// Single getTokenAccountsByOwner RPC call via Helius. No fallbacks, no parsing
// beyond extracting uiAmount — every ms counts on this path.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HELIUS_API_KEY = Deno.env.get("HELIUS_API_KEY") ?? "";
const RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const { owner, mint } = await req.json();
    if (!owner || !mint) {
      return new Response(JSON.stringify({ error: "owner and mint required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [owner, { mint }, { encoding: "jsonParsed" }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    const j = await r.json();
    const accts = j?.result?.value ?? [];
    let amount = 0;
    let decimals = 0;
    let uiAmount = 0;
    for (const a of accts) {
      const info = a?.account?.data?.parsed?.info?.tokenAmount;
      if (!info) continue;
      amount += Number(info.amount || 0);
      decimals = info.decimals ?? decimals;
      uiAmount += Number(info.uiAmount || 0);
    }

    return new Response(JSON.stringify({ ok: true, amount, decimals, uiAmount }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
