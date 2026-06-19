// supabase/functions/shreem-live-executor/index.ts
// SQI-2050 SHREEM BRZEE — Live Solana Swap Executor
// Triggered by: POST from frontend when mode = 'live'
// Also called every 3s by the frontend poll useEffect
// Uses Jupiter v6 API for best route, Helius for broadcast
//
// REQUIRED SUPABASE SECRETS (set in Supabase dashboard → Edge Functions → Secrets):
//   SHREEM_BOT_KEYPAIR  = base58 private key of the bot trading wallet
//   SUPABASE_URL        = auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY = auto-set by Supabase
//   HELIUS_API_KEY      = 775d3d1f-6801-41de-a063-8aee4382d0f4

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const HELIUS_KEY   = Deno.env.get("HELIUS_API_KEY") ?? "775d3d1f-6801-41de-a063-8aee4382d0f4";
const HELIUS_RPC   = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const JUPITER_API  = "https://quote-api.jup.ag/v6";
const SOL_MINT     = "So11111111111111111111111111111111111111112";
const LAMPORTS     = 1_000_000_000;

// ── Helpers ──────────────────────────────────────────────────────────────────
function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

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


// ── Keypair handling using tweetnacl (standard Solana approach) ──────────────
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import { decode as b58decode } from "https://esm.sh/bs58@5.0.0";

interface SolanaKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array; // full 64 bytes
}

function loadSolanaKeypair(): SolanaKeypair | null {
  const raw = Deno.env.get("SHREEM_BOT_KEYPAIR");
  if (!raw) {
    console.error("[KEYPAIR] SHREEM_BOT_KEYPAIR not set");
    return null;
  }

  try {
    const trimmed = raw.trim();
    let secretKey: Uint8Array;

    if (trimmed.startsWith("[")) {
      // JSON array format: [1,2,3,...64 numbers]
      secretKey = new Uint8Array(JSON.parse(trimmed));
    } else if (trimmed.includes(",")) {
      // Comma-separated: 1,2,3,...
      secretKey = new Uint8Array(trimmed.split(",").map(Number));
    } else {
      // Base58 (Phantom export) — standard Solana private key format
      secretKey = b58decode(trimmed);
    }

    if (secretKey.length !== 64) {
      console.error(`[KEYPAIR] Expected 64 bytes, got ${secretKey.length}`);
      return null;
    }

    // nacl keypair from seed (first 32 bytes)
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    console.log("[KEYPAIR] Loaded OK, pubkey:", Buffer.from(keypair.publicKey).toString("hex").slice(0,16) + "...");
    return { publicKey: keypair.publicKey, secretKey: keypair.secretKey };
  } catch (e: any) {
    console.error("[KEYPAIR] Parse error:", e.message);
    return null;
  }
}

// Wrapper to maintain compatibility with rest of code
async function loadKeypair() {
  return loadSolanaKeypair();
}

async function getPublicKeyBytes(kp: any): Promise<Uint8Array> {
  return kp.publicKey;
}

async function getPublicKeyBytes(kp: CryptoKeyPair): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey("raw", kp.publicKey);
  return new Uint8Array(raw);
}

function pubkeyToBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + Array.from(bytes).map(b => b.toString(16).padStart(2,"0")).join(""));
  let result = "";
  while (num > 0n) { result = ALPHABET[Number(num % 58n)] + result; num /= 58n; }
  const leading = bytes.findIndex(b => b !== 0);
  return "1".repeat(leading) + result;
}

// ── Jupiter swap ──────────────────────────────────────────────────────────────
async function jupiterQuote(inputMint: string, outputMint: string, amountLamports: number) {
  const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=300&onlyDirectRoutes=false`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Jupiter quote failed: HTTP ${r.status}`);
  return await r.json();
}

async function jupiterSwapTx(quoteResponse: unknown, walletAddress: string): Promise<string> {
  const r = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: walletAddress,
      wrapAndUnwrapSol: true,
      computeUnitPriceMicroLamports: 50000, // priority fee
      dynamicComputeUnitLimit: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Jupiter swap failed: HTTP ${r.status}`);
  const { swapTransaction } = await r.json();
  return swapTransaction; // base64 encoded versioned transaction
}

async function signAndSendTx(txBase64: string, keypair: any): Promise<string> {
  const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));

  // Parse versioned transaction structure
  // Format: [version_prefix][num_sigs compact-u16][...sig_slots 64 bytes each][message...]
  let offset = 1; // skip version byte (0x80)
  const numSigs = txBytes[offset];
  offset += 1;
  const sigStart = offset;
  offset += numSigs * 64;
  const messageBytes = txBytes.slice(offset);

  // Sign with nacl
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

  // Insert signature
  txBytes.set(signature, sigStart);

  const encoded = btoa(String.fromCharCode(...txBytes));
  const result = await rpc("sendTransaction", [
    encoded,
    { encoding: "base64", preflightCommitment: "confirmed", skipPreflight: false }
  ]);
  return result;
}

// ── Wait for confirmation ─────────────────────────────────────────────────────
async function waitForConfirmation(txSig: string, timeoutMs = 30000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const result = await rpc("getSignatureStatuses", [[txSig], { searchTransactionHistory: true }]);
      const status = result?.value?.[0];
      if (!status) continue;
      if (status.err) return false;
      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") return true;
    } catch {}
  }
  return false;
}

// ── Main serve ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET /health — check bot wallet balance
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname.endsWith("/health")) {
    const rawKey = Deno.env.get("SHREEM_BOT_KEYPAIR");
    if (!rawKey) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR secret not set — add it in Supabase Edge Function secrets" });

    const keypair = loadSolanaKeypair();
    if (!keypair) return jsonResp({
      ok: false,
      error: "Key found but failed to parse",
      hint: "Phantom exports base58 (88 chars). Check the key was copied correctly.",
      key_length: rawKey.trim().length,
      key_preview: rawKey.trim().slice(0,8) + "...",
    });

    const pubkey = pubkeyToBase58(keypair.publicKey);
    let balanceSol = 0;
    try {
      const result = await rpc("getBalance", [pubkey]);
      balanceSol = result.value / LAMPORTS;
    } catch {}
    return jsonResp({
      ok: true,
      wallet: pubkey,
      balance_sol: balanceSol,
      ready: balanceSol >= 0.05,
      message: balanceSol >= 0.05 ? "Bot wallet ready for live trading" : "Fund wallet with at least 0.05 SOL"
    });
  }

  // POST — execute live swap for a given signal
  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  try {
    // Load keypair
    const keypair = loadSolanaKeypair();
    if (!keypair) return jsonResp({ ok: false, error: "SHREEM_BOT_KEYPAIR not configured — add it in Supabase secrets" }, 400);

    const walletPubkey = pubkeyToBase58(keypair.publicKey);

    // Get session — must be in live mode
    const { data: sess } = await sb.from("shreem_brzee_session").select("*").eq("id","default").single();
    if (!sess) return jsonResp({ ok: false, error: "No active session" }, 400);
    if (sess.stopped_at) return jsonResp({ ok: false, error: "Session stopped" });
    if (sess.mode !== "live") return jsonResp({ ok: false, skipped: true, reason: "Session is in paper mode" });

    // Get unprocessed BUY signals
    const { data: signals } = await sb
      .from("shreem_brzee_signals")
      .select("*")
      .eq("action", "BUY")
      .eq("live_processed", false)
      .order("created_at", { ascending: true })
      .limit(5);

    if (!signals?.length) return jsonResp({ ok: true, skipped: true, reason: "No pending signals" });

    const results = [];

    for (const sig of signals) {
      try {
        // Mark as processed immediately to prevent double-execution
        await sb.from("shreem_brzee_signals").update({ live_processed: true }).eq("id", sig.id);

        // Check SOL balance
        const balResult = await rpc("getBalance", [walletPubkey]);
        const balanceSol = balResult.value / LAMPORTS;

        // Check 50% exposure cap
        const { data: openTrades } = await sb.from("shreem_brzee_live_trades")
          .select("amount_sol").eq("status","open");
        const openExposure = (openTrades || []).reduce((s: number, t: any) => s + (t.amount_sol || 0), 0);
        const maxExposure = balanceSol * 0.5;

        if (openExposure >= maxExposure) {
          results.push({ sig: sig.sig, skipped: true, reason: "50% exposure cap" });
          continue;
        }

        // Kelly sizing: 5% base, scales with win rate
        const wins = Number(sess.wins || 0);
        const losses = Number(sess.losses || 0);
        const total = wins + losses;
        const winRate = total >= 5 ? wins / total : 0.5;
        const pct = Math.min(0.10, Math.max(0.05, winRate * 0.12));
        const tradeAmountSol = Math.min(balanceSol * pct, maxExposure - openExposure);

        if (tradeAmountSol < 0.01) {
          results.push({ sig: sig.sig, skipped: true, reason: `Trade too small: ${tradeAmountSol.toFixed(4)} SOL` });
          continue;
        }

        const amountLamports = Math.floor(tradeAmountSol * LAMPORTS);

        // Jupiter quote: SOL → token
        let quote;
        try {
          quote = await jupiterQuote(SOL_MINT, sig.mint, amountLamports);
        } catch (e) {
          results.push({ sig: sig.sig, error: `Quote failed: ${e.message}` });
          continue;
        }

        // Check slippage is acceptable (< 5%)
        const inAmount = Number(quote.inAmount);
        const outAmount = Number(quote.outAmount);
        const outMin = Number(quote.otherAmountThreshold);
        const slippage = inAmount > 0 ? (inAmount - outMin) / inAmount : 0;
        if (slippage > 0.05) {
          results.push({ sig: sig.sig, skipped: true, reason: `Slippage too high: ${(slippage*100).toFixed(1)}%` });
          continue;
        }

        // Build swap transaction
        const swapTxBase64 = await jupiterSwapTx(quote, walletPubkey);

        // Sign and send
        const txSig = await signAndSendTx(swapTxBase64, keypair);
        console.log(`[LIVE] Sent tx: ${txSig} | ${sig.symbol} | ${tradeAmountSol.toFixed(4)} SOL`);

        // Wait for confirmation
        const confirmed = await waitForConfirmation(txSig);

        // Calculate entry price (SOL per token)
        const entryPrice = inAmount > 0 && outAmount > 0 ? (inAmount / LAMPORTS) / (outAmount / 1e6) : null;

        // Record the live trade
        await sb.from("shreem_brzee_live_trades").insert({
          session_id: "default",
          sig: sig.sig + "_live",
          tx_sig: txSig,
          mint: sig.mint,
          symbol: sig.symbol,
          label: sig.label,
          wallet: sig.wallet,
          action: "BUY",
          amount_sol: tradeAmountSol,
          entry_price: entryPrice,
          tokens_received: outAmount,
          status: confirmed ? "open" : "unconfirmed",
          opened_at: new Date().toISOString(),
          slippage_pct: slippage * 100,
        });

        results.push({
          sig: sig.sig,
          ok: true,
          confirmed,
          tx: txSig,
          symbol: sig.symbol,
          amount_sol: tradeAmountSol,
          entry_price: entryPrice,
        });

      } catch (e: any) {
        console.error(`[LIVE ERROR] ${sig.sig}: ${e.message}`);
        // Unmark as processed so it can be retried
        await sb.from("shreem_brzee_signals").update({ live_processed: false }).eq("id", sig.id);
        results.push({ sig: sig.sig, error: e.message });
      }
    }

    return jsonResp({ ok: true, results, wallet: walletPubkey });

  } catch (e: any) {
    console.error("[EXECUTOR]", e.message);
    return jsonResp({ ok: false, error: e.message }, 500);
  }
});
