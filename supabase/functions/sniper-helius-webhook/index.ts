// supabase/functions/sniper-helius-webhook/index.ts
//
// SQI SOVEREIGN SNIPER — Helius webhook edge function.
// Mirrors the proven shreem-helius-webhook pattern: webhook fires, buy
// executes inline, no extra inter-function hop. Two deliberate departures
// from that pattern, both for the same reason — sniping a brand-new pool
// is a speed race in a way that reacting to an already-executed whale swap
// isn't:
//
//   1. webhookType 'raw' instead of 'enhanced' — Helius's own docs note raw
//      delivers the native transaction format with less processing
//      overhead and lower latency. We do our own log parsing anyway, so we
//      don't need their enrichment.
//   2. Execution happens in THIS function, not a second call to a separate
//      executor. Your own shreem-helius-webhook comments flag that calling
//      a second edge function adds 1-3s of HTTP overhead — tolerable for
//      copying a whale's already-confirmed trade, not tolerable when the
//      thing you're racing is everyone else's bot.
//
// State note: this function is stateless between invocations (Supabase
// edge isolates aren't guaranteed to share memory, and Helius webhook
// delivery is at-least-once, so duplicates happen). There is no in-memory
// dedup here on purpose — see CLAIM below. The Hetzner worker is the
// stateful half of this system: it polls sniper_trades for open positions
// and handles every exit. This function only ever inserts SNIPE_ENTRY rows;
// it never updates or sells.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { Keypair, VersionedTransaction, Connection } from "npm:@solana/web3.js@1.95.3";

// ── ENV ──────────────────────────────────────────────────────────
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HELIUS_API_KEY      = Deno.env.get("HELIUS_API_KEY") ?? "";
const GEMINI_API_KEY      = Deno.env.get("GEMINI_API_KEY") ?? "";
const WALLET_PRIVATE_KEY  = Deno.env.get("WALLET_PRIVATE_KEY") ?? ""; // same dedicated wallet as the Hetzner worker
const WEBHOOK_AUTH_HEADER = Deno.env.get("SNIPER_WEBHOOK_AUTH") ?? ""; // must match authHeader used at registration
const PAPER_MODE          = (Deno.env.get("PAPER_MODE") ?? "true") === "true";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── TRADING CONFIG (kept identical to the Hetzner worker's env names) ──
const BUY_SOL            = parseFloat(Deno.env.get("BUY_AMOUNT_SOL")      ?? "0.05");
const MAX_POSITIONS       = parseInt(Deno.env.get("MAX_OPEN_POSITIONS")    ?? "5");
const MAX_DAILY_TRADES    = parseInt(Deno.env.get("MAX_DAILY_TRADES")      ?? "20");
const MAX_DAILY_LOSS      = parseFloat(Deno.env.get("MAX_DAILY_LOSS_SOL")  ?? "0.5");
const MIN_AI_SCORE        = parseInt(Deno.env.get("MIN_AI_SCORE")          ?? "60");
const AI_TIMEOUT_MS       = parseInt(Deno.env.get("AI_TIMEOUT_MS")         ?? "350");
const SLIPPAGE_BPS        = parseInt(Deno.env.get("SLIPPAGE_BPS")          ?? "8000");
const MAX_IMPACT_FRACTION = parseFloat(Deno.env.get("MAX_PRICE_IMPACT_PCT") ?? "15") / 100;
const JITO_TIP            = parseFloat(Deno.env.get("JITO_TIP_SOL")        ?? "0.001");

// ── CONSTANTS (verified June 2026 — see prior audit) ────────────────
const SOL_MINT       = "So11111111111111111111111111111111111111112";
const PUMP_PROGRAM    = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMP_DECIMALS  = 6;
const JUP_URL          = "https://api.jup.ag/swap/v1";
const JITO_URL         = "https://mainnet.block-engine.jito.wtf/api/v1";
const GEMINI_URL      = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const RPC_HTTP = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_HTTP, "processed");
let keypair: Keypair | null = null;
if (WALLET_PRIVATE_KEY && !PAPER_MODE) {
  try { keypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY)); }
  catch { console.error("❌ Invalid WALLET_PRIVATE_KEY"); }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// ══════════════════════════════════════════════════════════════════
// CHEAP, RPC-FREE PRE-FILTER — runs before a single credit is spent.
// pump.fun creates dozens of tokens an hour; reject obvious junk here.
// ══════════════════════════════════════════════════════════════════
const HONEY = ["airdrop", "claim", "official", "presale", "safe", "guaranteed", "100x"];
function cheapReject(name: string, symbol: string): string | null {
  const text = `${name}${symbol}`.toLowerCase();
  if (HONEY.some((k) => text.includes(k))) return "honeypot-keyword";
  if (!symbol || symbol === "???" || symbol.length > 12) return "bad-symbol";
  return null;
}

// ══════════════════════════════════════════════════════════════════
// PARSE — extract pump.fun create events from a Helius RAW webhook
// delivery. Defensive on purpose: raw payload shape is being verified
// against real traffic, not assumed with full certainty. Logs the raw
// shape on first unrecognized payloads so it's obvious how to adjust.
// ══════════════════════════════════════════════════════════════════
function extractLogsAndSig(txn: any): { logs: string[]; sig: string; accountKeys: string[] } | null {
  const meta = txn?.meta;
  const message = txn?.transaction?.message ?? txn?.message;
  const logs = meta?.logMessages ?? txn?.logs ?? [];
  const sig = txn?.transaction?.signatures?.[0] ?? txn?.signature ?? "";
  const rawKeys = message?.accountKeys ?? [];
  const accountKeys = rawKeys.map((k: any) =>
    typeof k === "string" ? k : (k?.pubkey ?? "")
  );
  if (!logs.length || !sig) return null;
  return { logs, sig, accountKeys };
}

function parseLaunch(logs: string[], sig: string) {
  const isCreate = logs.some((l) =>
    l.includes("Instruction: Create") || l.includes("InitializeMint") || l.includes("CreatePool")
  );
  if (!isCreate) return null;

  let name = "UNKNOWN", symbol = "???", uri = "", mint = "", creator = "";
  for (const line of logs) {
    if (!line.includes("Program log:")) continue;
    const raw = line.replace(/^.*Program log:\s*/, "").trim();
    if (raw.startsWith("{")) {
      try {
        const d = JSON.parse(raw);
        name = d.name ?? d.tokenName ?? name;
        symbol = d.symbol ?? d.tokenSymbol ?? symbol;
        uri = d.uri ?? d.metadataUri ?? uri;
        mint = d.mint ?? mint;
        creator = d.user ?? d.creator ?? creator;
      } catch { /* not JSON, skip */ }
    }
  }
  if (!mint) return null;
  return { mint, creator, name, symbol, uri, signature: sig, bondingCurve: "" };
}

// ══════════════════════════════════════════════════════════════════
// CLAIM — the actual lock. Insert FIRST, before any RPC call. If the
// partial unique index in the migration rejects it, another concurrent
// delivery (Helius is at-least-once) already has this mint — bail clean,
// zero credits spent.
// ══════════════════════════════════════════════════════════════════
async function claimMint(token: Record<string, any>): Promise<boolean> {
  const { error } = await sb.from("sniper_trades").insert({
    mint: token.mint, symbol: token.symbol, launchpad: "pump_fun",
    action: "SNIPE_PENDING", status: "pending", is_paper: PAPER_MODE,
  });
  if (error) {
    if (String(error.message ?? "").includes("duplicate") || error.code === "23505") return false; // lost the race, fine
    console.error("[claim] unexpected insert error:", error.message);
    return false;
  }
  return true;
}

async function dropClaim(mint: string) {
  await sb.from("sniper_trades").delete().eq("mint", mint).eq("status", "pending");
}

// ══════════════════════════════════════════════════════════════════
// DAILY GATES — DB-driven since there's no in-process state to hold them.
// ══════════════════════════════════════════════════════════════════
async function dailyGatesOk(): Promise<{ ok: boolean; reason?: string }> {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { count: openCount } = await sb.from("sniper_trades").select("*", { count: "exact", head: true }).eq("status", "open");
  if ((openCount ?? 0) >= MAX_POSITIONS) return { ok: false, reason: `max positions (${MAX_POSITIONS})` };

  const { data: todayRows } = await sb.from("sniper_trades").select("pnl_sol, created_at").gte("created_at", since.toISOString());
  const trades = todayRows?.length ?? 0;
  if (trades >= MAX_DAILY_TRADES) return { ok: false, reason: `max daily trades (${MAX_DAILY_TRADES})` };

  const pnl = (todayRows ?? []).reduce((s, t) => s + (parseFloat(String(t.pnl_sol)) || 0), 0);
  if (pnl <= -MAX_DAILY_LOSS) return { ok: false, reason: `daily loss limit hit (${pnl.toFixed(4)} SOL)` };

  return { ok: true };
}

// ══════════════════════════════════════════════════════════════════
// RPC HELPERS (same verified pump.fun bonding-curve layout as the
// Hetzner worker — discriminator@0, virtualTokenReserves@8,
// virtualSolReserves@16, realTokenReserves@24, realSolReserves@32,
// tokenTotalSupply@40, complete@48)
// ══════════════════════════════════════════════════════════════════
async function rpc(method: string, params: unknown) {
  try {
    const r = await fetch(RPC_HTTP, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(4000),
    });
    const d = await r.json();
    return d.result ?? null;
  } catch { return null; }
}

async function getBondingCurve(mint: string) {
  try {
    const { PublicKey } = await import("npm:@solana/web3.js@1.95.3");
    const mintPk = new PublicKey(mint);
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("bonding-curve"), mintPk.toBuffer()],
      new PublicKey(PUMP_PROGRAM)
    );
    const bcAddress = bondingCurve.toBase58();
    const r = await rpc("getAccountInfo", [bcAddress, { encoding: "base64" }]);
    if (!r?.value?.data?.[0]) return null;
    const buf = Uint8Array.from(atob(r.value.data[0]), (c) => c.charCodeAt(0));
    if (buf.length < 49) return null;
    const view = new DataView(buf.buffer);
    const realTokenReserves = view.getBigUint64(24, true);
    const realSolReserves   = view.getBigUint64(32, true);
    const tokenTotalSupply  = view.getBigUint64(40, true);
    const tts = Number(tokenTotalSupply);
    return {
      bcAddress,
      solInCurve: Number(realSolReserves) / 1e9,
      bondingPct: tts > 0 ? (tts - Number(realTokenReserves)) / tts : 0,
      graduated: buf[48] === 1,
    };
  } catch (e) { console.error("[bonding-curve]", (e as Error).message); return null; }
}

async function getHolders(mint: string) {
  const r = await rpc("getTokenLargestAccounts", [mint]);
  return r?.value ?? [];
}
async function getRecentSigs(address: string, limit = 5) {
  const r = await rpc("getSignaturesForAddress", [address, { limit }]);
  return r ?? [];
}
async function getBuyVelocity(bondingCurve: string) {
  const sigs = await getRecentSigs(bondingCurve, 20);
  return sigs.filter((s: any) => s.blockTime && Date.now() / 1000 - s.blockTime < 10).length;
}

// ══════════════════════════════════════════════════════════════════
// AI VETO — same fail-open, timeout-bound design as the Hetzner worker.
// Never the sole approver, never allowed to slow down a token that
// already passed the mechanical filter beyond AI_TIMEOUT_MS.
// ══════════════════════════════════════════════════════════════════
async function aiVeto(token: Record<string, any>): Promise<{ vetoed: boolean; score: number | null }> {
  if (!GEMINI_API_KEY) return { vetoed: false, score: null };
  const prompt = `Solana memecoin risk analysis. Score 0-100 (60+=enter, <60=skip).

Token: ${token.symbol}
Liquidity: ${token.solInCurve?.toFixed?.(2)} SOL
Bonding: ${(token.bondingPct * 100)?.toFixed?.(1)}%
Buyers: ${token.uniqueBuyers}
Dev hold: ${(token.devHoldPct * 100)?.toFixed?.(1)}%
Buy velocity (10s): ${token.buyVelocity}

JSON only: {"score":<0-100>}`;
  try {
    const r = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 40 } }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    if (r.ok) {
      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 50));
      return { vetoed: score < MIN_AI_SCORE, score };
    }
  } catch { /* timeout or error → fail open */ }
  return { vetoed: false, score: null };
}

// ══════════════════════════════════════════════════════════════════
// MECHANICAL FILTER — the real gate. Same 12-signal logic as the worker.
// ══════════════════════════════════════════════════════════════════
async function filter(token: Record<string, any>): Promise<{ pass: boolean; reason: string }> {
  const [bc, holders, sigs] = await Promise.all([
    getBondingCurve(token.mint),
    getHolders(token.mint),
    token.creator ? getRecentSigs(token.creator, 20) : Promise.resolve([]),
  ]);
  const velo = bc ? await getBuyVelocity(bc.bcAddress) : 0;

  if (bc) {
    token.solInCurve = bc.solInCurve;
    token.bondingPct = bc.bondingPct;
    if (bc.graduated) return { pass: false, reason: "graduated" };
  }
  if ((token.solInCurve ?? 0) < 3) return { pass: false, reason: `liq ${token.solInCurve?.toFixed?.(2)}SOL` };
  if ((token.bondingPct ?? 0) > 0.5) return { pass: false, reason: `bond ${(token.bondingPct * 100).toFixed(0)}%` };

  token.uniqueBuyers = holders.length;
  token.devHoldPct = holders[0] ? Math.min(parseFloat(holders[0].uiAmount || 0) / 1e9, 1) : 0;
  const top3 = holders.slice(0, 3).reduce((s: number, h: any) => s + parseFloat(h.uiAmount || 0), 0);
  token.clusterPct = Math.min(top3 / 1e9, 1);
  token.buyVelocity = velo;
  token.devTxCount = sigs.length;

  let rug = 0;
  if (token.devHoldPct > 0.20) rug += 4; else if (token.devHoldPct > 0.10) rug += 2;
  if (sigs.length < 5) rug += 2;
  if (token.clusterPct > 0.50) rug += 3;
  if (token.solInCurve < 5) rug += 1;
  token.rugScore = rug;
  if (rug >= 7) return { pass: false, reason: `rug ${rug}/10` };

  const { vetoed, score } = await aiVeto(token);
  token.aiScore = score;
  if (vetoed) return { pass: false, reason: `AI veto (${score})` };
  return { pass: true, reason: `rug:${rug}/10 ai:${score ?? "n/a"}` };
}

// ══════════════════════════════════════════════════════════════════
// EXECUTION — same verified Jupiter host, price-impact cap, real Jito
// tip, RPC fallback as the Hetzner worker.
// ══════════════════════════════════════════════════════════════════
async function executeSwap(mint: string, lamports: number) {
  if (!keypair) return { success: false, reason: "no keypair (paper mode or unset key)" };
  try {
    const qp = new URLSearchParams({ inputMint: SOL_MINT, outputMint: mint, amount: lamports.toString(), slippageBps: SLIPPAGE_BPS.toString(), onlyDirectRoutes: "false" });
    const qRes = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) });
    if (!qRes.ok) return { success: false, reason: `quote ${qRes.status}` };
    const quote = await qRes.json();
    if (quote.error) return { success: false, reason: quote.error };

    const impact = Math.abs(parseFloat(quote.priceImpactPct ?? "0"));
    if (impact > MAX_IMPACT_FRACTION) return { success: false, reason: `impact ${(impact * 100).toFixed(1)}% > cap` };

    const swapRes = await fetch(`${JUP_URL}/swap`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote, userPublicKey: keypair.publicKey.toBase58(), wrapAndUnwrapSol: true,
        prioritizationFeeLamports: { jitoTipLamports: Math.round(JITO_TIP * 1e9) },
        dynamicComputeUnitLimit: true, dynamicSlippage: { maxBps: SLIPPAGE_BPS },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!swapRes.ok) return { success: false, reason: `swap ${swapRes.status}` };
    const { swapTransaction } = await swapRes.json();
    if (!swapTransaction) return { success: false, reason: "no swapTx" };

    const txBuf = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0));
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);
    const signed = btoa(String.fromCharCode(...tx.serialize()));

    const jitoRes = await fetch(`${JITO_URL}/bundles`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sendBundle", params: [[signed]] }),
      signal: AbortSignal.timeout(4000),
    });
    const jitoData = await jitoRes.json().catch(() => ({}));
    if (jitoData.result) return { success: true, method: "jito", outAmount: quote.outAmount, inAmount: quote.inAmount };

    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return { success: true, method: "rpc", sig, outAmount: quote.outAmount, inAmount: quote.inAmount };
  } catch (e) {
    return { success: false, reason: (e as Error).message };
  }
}

// ══════════════════════════════════════════════════════════════════
// PIPELINE — claim → filter → buy → finalize, for one candidate token.
// ══════════════════════════════════════════════════════════════════
async function processCandidate(token: Record<string, any>) {
  const pre = cheapReject(token.name, token.symbol);
  if (pre) return; // free reject, no DB write, no credits

  const gates = await dailyGatesOk();
  if (!gates.ok) { console.log(`[gate] ${token.symbol}: ${gates.reason}`); return; }

  const claimed = await claimMint(token);
  if (!claimed) return; // lost the race or already seen — exactly the point of the unique index

  try {
    const result = await filter(token);
    if (!result.pass) { await dropClaim(token.mint); console.log(`[filter] ${token.symbol}: ${result.reason}`); return; }

    let outAmount: string, inAmount: string, execMethod = "paper";
    const lamports = Math.round(BUY_SOL * 1e9);

    if (!PAPER_MODE && keypair) {
      const exec = await executeSwap(token.mint, lamports);
      if (!exec.success) { await dropClaim(token.mint); console.log(`[buy-failed] ${token.symbol}: ${exec.reason}`); return; }
      outAmount = exec.outAmount!; inAmount = exec.inAmount!; execMethod = exec.method!;
    } else {
      const qp = new URLSearchParams({ inputMint: SOL_MINT, outputMint: token.mint, amount: lamports.toString(), slippageBps: SLIPPAGE_BPS.toString() });
      const r = await fetch(`${JUP_URL}/quote?${qp}`, { signal: AbortSignal.timeout(3000) }).then((x) => x.json()).catch(() => null);
      if (!r?.outAmount) { await dropClaim(token.mint); console.log(`[paper-quote-fail] ${token.symbol}`); return; }
      outAmount = r.outAmount; inAmount = r.inAmount;
    }

    const tokensHeld = Number(outAmount) / 10 ** PUMP_DECIMALS;
    const solSpent = Number(inAmount) / 1e9;
    const entryPrice = tokensHeld > 0 ? solSpent / tokensHeld : NaN;

    await sb.from("sniper_trades").update({
      action: "SNIPE_ENTRY", status: "open",
      size_sol: solSpent || BUY_SOL, entry_price: Number.isFinite(entryPrice) ? entryPrice : null,
      ai_score: token.aiScore ?? null, rug_score: token.rugScore ?? null,
    }).eq("mint", token.mint).eq("status", "pending");

    console.log(`🎯 ${PAPER_MODE ? "PAPER" : "LIVE"} ENTERED $${token.symbol} | ${(solSpent || BUY_SOL).toFixed(4)} SOL | rug:${token.rugScore} ai:${token.aiScore ?? "n/a"} | ${execMethod}`);
  } catch (e) {
    await dropClaim(token.mint);
    console.error(`[pipeline-error] ${token.symbol}:`, (e as Error).message);
  }
}

// ══════════════════════════════════════════════════════════════════
// HTTP ENTRY POINT
// ══════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method === "GET") return json({ status: "ok", paper_mode: PAPER_MODE, version: "sniper-webhook-v1" });

  if (WEBHOOK_AUTH_HEADER) {
    const got = req.headers.get("authorization") ?? "";
    if (got !== WEBHOOK_AUTH_HEADER) return json({ error: "unauthorized" }, 401);
  }

  let body: any[];
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  if (!Array.isArray(body)) body = [body];

  const candidates: Record<string, any>[] = [];
  for (const txn of body) {
    const parsed = extractLogsAndSig(txn);
    if (!parsed) continue;
    if (!parsed.accountKeys.includes(PUMP_PROGRAM)) continue;
    const launch = parseLaunch(parsed.logs, parsed.sig);
    if (launch) candidates.push(launch);
  }

  if (!candidates.length) return json({ processed: 0 });

  await Promise.allSettled(candidates.map((c) => processCandidate(c)));
  return json({ processed: candidates.length });
});
