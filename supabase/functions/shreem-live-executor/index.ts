// supabase/functions/shreem-live-executor/index.ts
// SQI-2050 SHREEM BRZEE — Live Solana Swap Executor
// ALL imports must be at top for Deno

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

// ── Constants ─────────────────────────────────────────────────────────────────
const HELIUS_KEY = Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUPITER    = "https://quote-api.jup.ag/v6";
const SOL_MINT   = "So11111111111111111111111111111111111111112";
const LAMPORTS   = 1_000_000_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const jsonResp = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// ── Supabase ──────────────────────────────────────────────────────────────────
const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── Base58 pubkey encoder ─────────────────────────────────────────────────────
function pubkeyToBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

// ── Keypair loading — handles Phantom base58 export ───────────────────────────
interface SolanaKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

function loadKeypair(): SolanaKeypair | null {
  const raw = Deno.env.get("SHREEM_BOT_KEYPAIR");
  if (!raw) {
    console.error("[KEYPAIR] SHREEM_BOT_KEYPAIR secret not set");
    return null;
  }

  try {
    const trimmed = raw.trim();
    let secretKey: Uint8Array;

    if (trimmed.startsWith("[")) {
      // JSON array: [1,2,3,...,64]
      secretKey = new Uint8Array(JSON.parse(trimmed));
    } else if (trimmed.includes(",")) {
      // Comma separated: 1,2,3,...,64
      secretKey = new Uint8Array(trimmed.split(",").map(Number));
    } else {
      // Base58 — Phantom default export format
      secretKey = bs58.decode(trimmed);
    }

    if (secretKey.length !== 64) {
      console.error(`[KEYPAIR] Expected 64 bytes, got ${secretKey.length}`);
      return null;
    }

    const kp = nacl.sign.keyPair.fromSecretKey(secretKey);
    console.log("[KEYPAIR] Loaded OK, pubkey:", pubkeyToBase58(kp.publicKey).slice(0, 12) + "...");
    return { publicKey: kp.publicKey, secretKey: kp.secretKey };
  } catch (e: any) {
    console.error("[KEYPAIR] Failed:", e.message);
    return null;
  }
}

// ── RPC helper ────────────────────────────────────────────────────────────────
async function rpc(method: string, params: unknown[]) {
  const r = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const d = await r.json();
  if (d.error) throw new Error(`RPC ${method}: ${d.error.message}`);
  return d.result;
}

// ── Jupiter quote + swap ──────────────────────────────────────────────────────
async function jupiterQuote(inputMint: string, outputMint: string, amountLamports: number) {
  const url = `${JUPITER}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=300`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Jupiter quote HTTP ${r.status}`);
  return await r.json();
}

async function jupiterSwapTx(quote: unknown, wallet: string): Promise<string> {
  const r = await fetch(`${JUPITER}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet,
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports: 50000,
      dynamicComputeUnitLimit: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Jupiter swap HTTP ${r.status}`);
  const { swapTransaction } = await r.json();
  return swapTransaction;
}

// ── Sign and send transaction ─────────────────────────────────────────────────
async function signAndSendTx(txBase64: string, kp: SolanaKeypair): Promise<string> {
  const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));

  // Versioned tx: [version][numSigs][sig slots...][message...]
  let offset = 1; // skip version byte
  const numSigs = txBytes[offset];
  offset += 1;
  const sigStart = offset;
  offset += numSigs * 64;
  const message = txBytes.slice(offset);

  // Sign with nacl
  const sig = nacl.sign.detached(message, kp.secretKey);
  txBytes.set(sig, sigStart);

  const encoded = btoa(String.fromCharCode(...txBytes));
  return await rpc("sendTransaction", [
    encoded,
    { encoding: "base64", preflightCommitment: "confirmed", skipPreflight: false }
  ]);
}

// ── Wait for confirmation ─────────────────────────────────────────────────────
async function waitConfirm(txSig: string, timeoutMs = 30000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await rpc("getSignatureStatuses", [[txSig], { searchTransactionHistory: true }]);
      const s = res?.value?.[0];
      if (!s) continue;
      if (s.err) return false;
      if (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized") return true;
    } catch {}
  }
  return false;
}

// ── Main serve ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url  = new URL(req.url);
  const path = url.pathname;

  // ── GET /health ───────────────────────────────────────────────────────────
  if (req.method === "GET" && path.endsWith("/health")) {
    const rawKey = Deno.env.get("SHREEM_BOT_KEYPAIR");
    if (!rawKey) {
      return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not set in Edge Function secrets" });
    }

    const kp = loadKeypair();
    if (!kp) {
      return jsonResp({
        ok: false,
        error: "Key found but failed to parse",
        key_length: rawKey.trim().length,
        key_preview: rawKey.trim().slice(0, 8) + "...",
        hint: "Phantom exports base58 (~88 chars). Paste only the key, nothing else.",
      });
    }

    const wallet = pubkeyToBase58(kp.publicKey);
    let balance = 0;
    try {
      const res = await rpc("getBalance", [wallet]);
      balance = res.value / LAMPORTS;
    } catch {}

    return jsonResp({
      ok: true,
      wallet,
      balance_sol: balance,
      ready: balance >= 0.05,
      message: balance >= 0.05 ? "✅ Bot wallet ready for live trading" : "⚠️ Fund wallet with SOL first",
    });
  }

  // ── POST — execute live swap ──────────────────────────────────────────────
  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  try {
    const kp = loadKeypair();
    if (!kp) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not configured" }, 400);

    const wallet = pubkeyToBase58(kp.publicKey);

    // Check session is in live mode
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id", "default").single();
    if (!sess) return jsonResp({ ok: false, error: "No session" }, 400);
    if (sess.stopped_at) return jsonResp({ ok: false, skipped: true, reason: "Session stopped" });
    if (sess.mode !== "live") return jsonResp({ ok: false, skipped: true, reason: "Not in live mode" });

    // Get unprocessed BUY signals
    const { data: signals } = await sb
      .from("shreem_brzee_signals")
      .select("*")
      .eq("action", "BUY")
      .eq("live_processed", false)
      .order("created_at", { ascending: true })
      .limit(5);

    if (!signals?.length) return jsonResp({ ok: true, skipped: true, reason: "No pending signals" });

    const results: any[] = [];

    for (const sig of signals) {
      try {
        // Mark processed immediately to prevent double-execution
        await sb.from("shreem_brzee_signals").update({ live_processed: true }).eq("id", sig.id);

        // Check SOL balance
        const balRes = await rpc("getBalance", [wallet]);
        const balSol = balRes.value / LAMPORTS;

        // Check 50% exposure cap
        const { data: openTrades } = await sb.from("shreem_brzee_live_trades")
          .select("amount_sol").eq("status", "open");
        const openExp = (openTrades || []).reduce((s: number, t: any) => s + (t.amount_sol || 0), 0);
        const maxExp  = balSol * 0.5;
        if (openExp >= maxExp) {
          results.push({ sig: sig.sig, skipped: true, reason: "50% cap" });
          continue;
        }

        // Kelly sizing 5-10%
        const wins = Number(sess.wins || 0), losses = Number(sess.losses || 0);
        const wr   = (wins + losses) >= 5 ? wins / (wins + losses) : 0.5;
        const pct  = Math.min(0.10, Math.max(0.05, wr * 0.12));
        const size = Math.min(balSol * pct, maxExp - openExp);

        if (size < 0.01) {
          results.push({ sig: sig.sig, skipped: true, reason: `Too small: ${size.toFixed(4)} SOL` });
          continue;
        }

        const lamports = Math.floor(size * LAMPORTS);

        // Jupiter quote
        const quote = await jupiterQuote(SOL_MINT, sig.mint, lamports);
        const slippage = Number(quote.inAmount) > 0
          ? (Number(quote.inAmount) - Number(quote.otherAmountThreshold)) / Number(quote.inAmount)
          : 0;

        if (slippage > 0.05) {
          results.push({ sig: sig.sig, skipped: true, reason: `Slippage ${(slippage*100).toFixed(1)}%` });
          continue;
        }

        // Build + sign + send
        const swapTx  = await jupiterSwapTx(quote, wallet);
        const txSig   = await signAndSendTx(swapTx, kp);
        const confirmed = await waitConfirm(txSig);

        const entryPrice = Number(quote.inAmount) > 0 && Number(quote.outAmount) > 0
          ? (Number(quote.inAmount) / LAMPORTS) / (Number(quote.outAmount) / 1e6)
          : null;

        await sb.from("shreem_brzee_live_trades").insert({
          session_id: "default", sig: sig.sig + "_live", tx_sig: txSig,
          mint: sig.mint, symbol: sig.symbol, label: sig.label, wallet: sig.wallet,
          action: "BUY", amount_sol: size, entry_price: entryPrice,
          tokens_received: Number(quote.outAmount),
          status: confirmed ? "open" : "unconfirmed",
          opened_at: new Date().toISOString(), slippage_pct: slippage * 100,
        });

        results.push({ ok: true, confirmed, tx: txSig, symbol: sig.symbol, sol: size });
      } catch (e: any) {
        await sb.from("shreem_brzee_signals").update({ live_processed: false }).eq("id", sig.id);
        results.push({ sig: sig.sig, error: e.message });
      }
    }

    return jsonResp({ ok: true, results, wallet });
  } catch (e: any) {
    return jsonResp({ ok: false, error: e.message }, 500);
  }
});
