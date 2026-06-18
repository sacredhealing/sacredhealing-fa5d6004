// Syncs the Helius webhook's accountAddresses list with the current
// rows in public.tracked_whales. Called from the client after the
// ADD button in the KOL scanner inserts a new whale.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HELIUS_KEY =
  Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
const WEBHOOK_URL =
  "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook";

async function heliusFetch(path: string, init?: RequestInit) {
  const url = `https://api.helius.xyz${path}${path.includes("?") ? "&" : "?"}api-key=${HELIUS_KEY}`;
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await r.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  return { status: r.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Pull current tracked whales
    const { data: rows, error } = await supabase
      .from("tracked_whales")
      .select("address");
    if (error) throw error;

    const addresses = Array.from(
      new Set((rows ?? []).map((r: any) => r.address).filter(Boolean)),
    );

    if (addresses.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "no whales in tracked_whales" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Find existing webhook(s) for our edge URL
    const list = await heliusFetch("/v0/webhooks", { method: "GET" });
    const hooks = Array.isArray(list.body) ? (list.body as any[]) : [];
    const ours = hooks.find((h) => h?.webhookURL === WEBHOOK_URL);

    const payload = {
      webhookURL: WEBHOOK_URL,
      transactionTypes: ["SWAP"],
      accountAddresses: addresses,
      webhookType: "enhanced",
      txnStatus: "success",
    };

    let result;
    if (ours?.webhookID) {
      result = await heliusFetch(`/v0/webhooks/${ours.webhookID}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      result = await heliusFetch("/v0/webhooks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    return new Response(
      JSON.stringify({
        ok: result.status >= 200 && result.status < 300,
        action: ours?.webhookID ? "updated" : "created",
        webhookID: ours?.webhookID ?? (result.body as any)?.webhookID,
        wallet_count: addresses.length,
        helius_status: result.status,
        helius_body: result.body,
      }),
      {
        status: result.status >= 200 && result.status < 300 ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
