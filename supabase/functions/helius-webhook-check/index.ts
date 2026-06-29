// Quick diagnostic: list current Helius webhooks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("HELIUS_API_KEY");
  if (!key) return new Response(JSON.stringify({ ok: false, error: "no key" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";

  if (action === "repoint") {
    // re-point to Hetzner worker (as user originally specified)
    const target = url.searchParams.get("url") ?? "http://178.105.183.74:3001/webhook";
    const wallets = (url.searchParams.get("wallets") ?? "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu,ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT").split(",");
    // find existing
    const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${key}`);
    const hooks = await listR.json();
    const payload = { webhookURL: target, transactionTypes: ["Any"], accountAddresses: wallets, webhookType: "enhanced", txnStatus: "success" };
    let result;
    if (Array.isArray(hooks) && hooks.length > 0) {
      const id = hooks[0].webhookID;
      const r = await fetch(`https://api.helius.xyz/v0/webhooks/${id}?api-key=${key}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      result = { action: "updated", id, status: r.status, body: await r.json() };
    } else {
      const r = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      result = { action: "created", status: r.status, body: await r.json() };
    }
    return new Response(JSON.stringify(result, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const listR = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${key}`);
  const hooks = await listR.json();
  const detailed = [];
  if (Array.isArray(hooks)) {
    for (const h of hooks) {
      const dr = await fetch(`https://api.helius.xyz/v0/webhooks/${h.webhookID}?api-key=${key}`);
      detailed.push(await dr.json());
    }
  }
  return new Response(JSON.stringify(detailed, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
