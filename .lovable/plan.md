
## 1. UI cleanup — `src/pages/income-streams/ShreemBrzeePerformance.tsx`

**Wallet lists**
- Reduce `KOL_LIST` to the 2 active wallets: Cented + Remusofmars.
- Delete `KOL_EXPLORER` entirely and the leaderboard/explorer block that renders it.
- Remove the "Add custom whale" input + `tracked_whales` upsert flow (UI section + handler at line 629). Manual DB inserts only going forward.
- Update copy strings: "watching 20 whale wallets" → "watching 2 whale wallets" (lines 133, 798, 966).
- Drop the whale leaderboard table rendered from `whaleRows` (around line 1163). Keep `whaleMap`/`whaleRows` only if still used by the per-position attribution badge; otherwise delete.

**Price polling → on-chain WebSocket**
- Delete `PRICE_URL`, `updatePrices`, `priceIntervalRef`, `liveLiquidity`, and the `setInterval(updatePrices, 8000)` effect (lines 337-403).
- Replace with a single `useEffect` that, for each open position, opens a Helius WebSocket (`wss://atlas-mainnet.helius-rpc.com/?api-key=...` via a new `shreem-helius-ws-token` edge function or directly from the client using the publishable Helius key surfaced via a tiny `get-helius-ws-url` edge function — Helius key stays server-side; the edge function returns a short-lived signed WS URL).
- For each open position:
  1. On open: call new edge function `shreem-position-pool-info` → returns `{ poolAddress, baseVault, quoteVault, decimals }` for the mint (Raydium/Pump.fun pool lookup via Jupiter `/v6/quote` or DexScreener — one-shot, cached).
  2. Subscribe via `accountSubscribe` to `baseVault` + `quoteVault`. On each notification, recompute `price = quoteReserve / baseReserve` and update `livePrices[mint]`.
  3. On close/unmount: `accountUnsubscribe` + close WS when no positions remain.
- Held-amount accuracy: on position open, fetch the bot wallet's actual token balance via a single `getTokenAccountsByOwner` RPC call (new edge function `shreem-token-balance`), store as `pos.token_amount`. P&L = `token_amount * livePrice - amount_sol_usd`. This matches Phantom because it uses the real on-chain amount, not an inferred share size.

**Keep**: dexscreener iframe + link (cosmetic, not on the hot path).

## 2. Edge function inline-buy cleanup — `supabase/functions/shreem-helius-webhook/index.ts`

Audit the inline-buy path (from webhook arrival → swap dispatch) and remove:
- Any string normalization / regex parsing of webhook payload fields that isn't required to extract `signature`, `wallet`, `mint`, `action`, `amount_sol`.
- `console.log` calls inside the hot path (keep `[INLINE-BUY]` timing line only).
- Pre-swap DB reads that can be deferred (signal insert, audit logging) → move them to a `setTimeout(..., 0)` or fire-and-forget after the swap dispatch promise is created.
- Any `JSON.stringify`/pretty-printing of the payload before the swap call.

Goal: minimize work between webhook bytes-on-wire and `fetch(JUPITER_SWAP_URL)`.

## 3. New edge functions

- `shreem-helius-ws-url` (GET): returns `{ url: "wss://atlas-mainnet.helius-rpc.com/?api-key=..." }` — keeps the Helius key server-side. Frontend calls once per session.
- `shreem-pool-info` (POST `{ mint }`): one-shot lookup of pool address + vault accounts + decimals. Cached in `ai_response_cache` for 24h per mint.
- `shreem-token-balance` (POST `{ owner, mint }`): single `getTokenAccountsByOwner` RPC → exact uiAmount. Called once per position open.

## 4. Out of scope (explicit)

- `token-price-batch` edge function stays deployed (other pages may use it) but `ShreemBrzeePerformance.tsx` no longer calls it.
- No change to swap execution, stop-loss cron, or trailing-stop logic.

## Technical notes

- WS connection budget: 1 WS, N `accountSubscribe` calls (2 per position). Helius free tier supports 100 concurrent subs.
- Price formula for Raydium AMM pools: `price_usd = (quoteVaultUiAmount / baseVaultUiAmount) * solPriceUsd` (when quote is SOL). For Pump.fun bonding curves, formula differs — pool-info function returns `poolType` and frontend branches.
- Fallback: if WS drops or pool-info fails for a mint, that position shows "—" for live P&L rather than falling back to a polling API. User has explicitly accepted this trade-off.
