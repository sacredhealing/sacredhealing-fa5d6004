// supabase/functions/shreem-live-executor/index.ts
// SQI-2050 SHREEM BRZEE — Live Solana Swap Executor
// ALL imports must be at top for Deno

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { Connection, Keypair, VersionedTransaction } from "npm:@solana/web3.js@1.95.3";

// ── Constants ─────────────────────────────────────────────────────────────────
const HELIUS_KEY = Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUPITER    = "https://lite-api.jup.ag/swap/v1";
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

// ── Sign and send transaction (Jupiter v6 VersionedTransaction) ───────────────
const connection = new Connection(HELIUS_RPC, "confirmed");

async function signAndSendTx(txBase64: string, kp: SolanaKeypair): Promise<string> {
  // Decode Jupiter's swapTransaction (base64 VersionedTransaction)
  const swapTransactionBuf = Buffer.from(txBase64, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Rebuild a web3.js Keypair from the raw 64-byte secret
  const keypair = Keypair.fromSecretKey(kp.secretKey);

  // Sign with keypair
  transaction.sign([keypair]);

  // Send raw — DO NOT re-serialize manually beyond .serialize()
  const rawTransaction = transaction.serialize();
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 3,
    preflightCommitment: "confirmed",
  });
  return txid;
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
    const body   = await req.json().catch(() => ({}));

    // ── CLOSE / SELL handler ────────────────────────────────────────────────
    // body: { action: 'close', trade_id?: string, mint?: string, reason?: string }
    if (body?.action === "close" || body?.action === "sell") {
      const reason = body?.reason || "manual";
      let q = sb.from("shreem_brzee_live_trades").select("*").eq("status", "open");
      if (body?.trade_id) q = q.eq("id", body.trade_id);
      else if (body?.mint) q = q.eq("mint", body.mint);
      const { data: trades, error: qErr } = await q;
      if (qErr) return jsonResp({ ok: false, error: qErr.message }, 500);
      if (!trades?.length) return jsonResp({ ok: true, skipped: true, reason: "no matching open trade" });

      const results: any[] = [];
      for (const pos of trades) {
        try {
          // Look up actual token balance on chain
          const taRes = await rpc("getTokenAccountsByOwner", [wallet, { mint: pos.mint }, { encoding: "jsonParsed" }]);
          const acct = taRes?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
          const rawAmount = acct ? Number(acct.amount) : Number(pos.tokens_received || 0);
          const decimals  = acct ? Number(acct.decimals) : 6;
          if (!rawAmount || rawAmount < 1) {
            await sb.from("shreem_brzee_live_trades").update({
              status: "closed", sell_reason: reason + "_no_balance",
              closed_at: new Date().toISOString(),
            }).eq("id", pos.id);
            results.push({ id: pos.id, ok: false, reason: "no token balance" });
            continue;
          }

          // Quote token → SOL (Jupiter handles slippage via slippageBps in jupiterQuote)
          const sellQuote = await jupiterQuote(pos.mint, SOL_MINT, rawAmount);
          const swapTx = await jupiterSwapTx(sellQuote, wallet);
          const txSig  = await signAndSendTx(swapTx, kp);
          const confirmed = await waitConfirm(txSig);

          const solOut = Number(sellQuote.outAmount) / LAMPORTS;
          const sizeIn = Number(pos.amount_sol) || 0;
          const pnlSol = solOut - sizeIn;
          const pnlPct = sizeIn > 0 ? (pnlSol / sizeIn) * 100 : 0;
          const exitPrice = solOut > 0 && rawAmount > 0
            ? solOut / (rawAmount / Math.pow(10, decimals)) : null;

          await sb.from("shreem_brzee_live_trades").update({
            status:       confirmed ? "closed" : "unconfirmed",
            sell_reason:  reason,
            exit_price:   exitPrice,
            pnl_sol:      pnlSol,
            pnl_pct:      pnlPct,
            closed_at:    new Date().toISOString(),
            tx_sig_close: txSig,
          }).eq("id", pos.id);

          const { data: sess0 } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();
          if (sess0) {
            await sb.from("shreem_brzee_session").update({
              portfolio: Number(sess0.portfolio || 0) + solOut,
              wins:   Number(sess0.wins||0)   + (pnlSol > 0 ? 1 : 0),
              losses: Number(sess0.losses||0) + (pnlSol <= 0 ? 1 : 0),
              updated_at: new Date().toISOString(),
            }).eq("id","default");
          }

          console.log(`[close] ${pos.symbol || pos.mint?.slice(0,8)} | ${pnlPct.toFixed(1)}% | sol_out=${solOut.toFixed(4)} | tx=${txSig.slice(0,12)}`);
          results.push({ id: pos.id, ok: true, tx: txSig, sol_out: solOut, pnl_sol: pnlSol, pnl_pct: pnlPct, confirmed });
        } catch (e: any) {
          console.error(`[close] ${pos.id} failed:`, e.message);
          results.push({ id: pos.id, ok: false, error: e.message });
        }
      }
      return jsonResp({ ok: true, closed: results.length, results });
    }

    // Get signal — either passed directly from webhook or from DB
    const directSig  = body?.direct_signal;
    const sessHint   = body?.session;

    // Load session for sizing
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();
    if (!sess) return jsonResp({ ok: false, error: "No session" });
    if (sess.stopped_at) return jsonResp({ ok: false, skipped: true, reason: "Session stopped" });
    if (sess.mode !== "live") return jsonResp({ ok: false, skipped: true, reason: "Not in live mode" });

    // Use passed signal or skip
    if (!directSig?.mint) return jsonResp({ ok: true, skipped: true, reason: "No signal provided" });

    const sig = directSig;

    // Duplicate check — don't open two positions in same mint
    const { data: existingMint } = await sb.from("shreem_brzee_live_trades")
      .select("id").eq("status","open").eq("mint", sig.mint).limit(1);
    if (existingMint?.length) return jsonResp({ ok: true, skipped: true, reason: "Already have live position in this token" });

    // Duplicate sig check
    const { data: existingSig } = await sb.from("shreem_brzee_live_trades")
      .select("id").eq("sig", sig.sig + "_live").limit(1);
    if (existingSig?.length) return jsonResp({ ok: true, skipped: true, reason: "Signal already executed" });

    // Check real SOL balance in bot wallet
    const balRes = await rpc("getBalance", [wallet]);
    const balSol = balRes.value / LAMPORTS;

    if (balSol < 0.01) return jsonResp({ ok: false, error: `Bot wallet balance too low: ${balSol} SOL` });

    // 50% exposure cap
    const { data: openTrades } = await sb.from("shreem_brzee_live_trades")
      .select("amount_sol").eq("status","open");
    const openExp = (openTrades || []).reduce((s: number, t: any) => s + (Number(t.amount_sol)||0), 0);
    const maxExp  = balSol * 0.5;
    if (openExp >= maxExp) return jsonResp({ ok: true, skipped: true, reason: "50% exposure cap reached" });

    // Kelly sizing 5-10% of REAL wallet balance
    const wins = Number(sess.wins || 0), losses = Number(sess.losses || 0);
    const wr   = (wins + losses) >= 5 ? wins / (wins + losses) : 0.5;
    const pct  = Math.min(0.10, Math.max(0.05, wr * 0.12));
    const size = Math.min(balSol * pct, maxExp - openExp);

    if (size < 0.005) return jsonResp({ ok: false, error: `Trade size too small: ${size.toFixed(4)} SOL` });

    const lamports = Math.floor(size * LAMPORTS);
    console.log(`[live] Executing: ${sig.symbol} | ${size.toFixed(4)} SOL | wallet balance: ${balSol.toFixed(4)} SOL`);

    // Jupiter quote
    const quote = await jupiterQuote(SOL_MINT, sig.mint, lamports);
    const slippage = Number(quote.inAmount) > 0
      ? (Number(quote.inAmount) - Number(quote.otherAmountThreshold)) / Number(quote.inAmount) : 0;

    if (slippage > 0.05) return jsonResp({ ok: false, error: `Slippage too high: ${(slippage*100).toFixed(1)}%` });

    // Sign + send
    const swapTx    = await jupiterSwapTx(quote, wallet);
    const txSig     = await signAndSendTx(swapTx, kp);
    const confirmed = await waitConfirm(txSig);

    const entryPrice = Number(quote.inAmount) > 0 && Number(quote.outAmount) > 0
      ? (Number(quote.inAmount) / LAMPORTS) / (Number(quote.outAmount) / 1e6) : null;

    await sb.from("shreem_brzee_live_trades").insert({
      session_id: "default",
      sig:        sig.sig + "_live",
      tx_sig:     txSig,
      mint:       sig.mint,
      symbol:     sig.symbol,
      label:      sig.label,
      wallet:     sig.wallet,
      action:     "BUY",
      amount_sol: size,
      entry_price: entryPrice,
      tokens_received: Number(quote.outAmount),
      status:     confirmed ? "open" : "unconfirmed",
      opened_at:  new Date().toISOString(),
      slippage_pct: slippage * 100,
    });

    // Update session portfolio
    await sb.from("shreem_brzee_session").upsert({
      id: "default", ...sess,
      portfolio:  Number(sess.portfolio || 0) - size,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    console.log(`[live] ✅ ${sig.symbol} | tx: ${txSig.slice(0,16)}... | confirmed: ${confirmed}`);
    return jsonResp({ ok: true, confirmed, tx: txSig, symbol: sig.symbol, amount_sol: size, wallet });

  } catch (e: any) {
    console.error("[live-executor]", e.message);
    return jsonResp({ ok: false, error: e.message }, 500);
  }
});
