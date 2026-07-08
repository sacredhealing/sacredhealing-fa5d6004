import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://ssygukfdbtehvtndandn.supabase.co";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
// Set FLASHARB_BRIDGE_SECRET in Lovable's edge function secrets. Same pattern as worker-bridge.
const SHARED_SECRET = Deno.env.get("FLASHARB_BRIDGE_SECRET") ?? "flasharb2026";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ---- WRITE: monitor.js posts each check here ----
  if (req.method === "POST") {
    if (req.headers.get("x-worker-secret") !== SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    let body: any = {};
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const row = body.check;
    if (!row || typeof row !== "object") {
      return new Response(JSON.stringify({ error: "missing check object" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const { data, error } = await sb.from("flash_arb_checks").insert(row).select().single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ check: data }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ---- READ: frontend dashboard ----
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") ?? "health";
  const limit = parseInt(url.searchParams.get("limit") ?? "200");

  try {
    if (endpoint === "health") {
      const { data: rows, error } = await sb
        .from("flash_arb_checks")
        .select("estimated_swap_usd, latency_ms, gross_profit_usd, net_profit_usd, viable, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);

      const all = rows ?? [];
      const viable = all.filter((r) => r.viable);
      const avgLatency = all.length
        ? Math.round(all.reduce((s, r) => s + (r.latency_ms || 0), 0) / all.length)
        : null;
      const bestNet = all.length
        ? Math.max(...all.map((r) => Number(r.net_profit_usd) || -Infinity))
        : null;

      return new Response(JSON.stringify({
        status: "running",
        bot: "Flash Arb Scanner (detection only)",
        totalChecks: all.length,
        viableCount: viable.length,
        avgLatencyMs: avgLatency,
        bestNetProfitUsd: bestNet === -Infinity ? null : bestNet,
        lastCheckAt: all[0]?.created_at ?? null,
        dbError: error?.message ?? null,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (endpoint === "checks") {
      const { data, error } = await sb
        .from("flash_arb_checks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data ?? []), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown endpoint" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      status: "running", bot: "Flash Arb Scanner", totalChecks: 0,
      viableCount: 0, debug: String(e),
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
