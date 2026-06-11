## Diagnosis

The page at `/income-streams/delta-arb-bot` shows nothing because:

1. It reads from table `delta_arb_trades` in external project `fjdzhrdpioxdeyyfogep`. That table currently returns `[]` — no worker is writing rows.
2. There is no "real balance" anywhere on the page — only a simulated `$10 + sum(pnl)`.
3. The header says "Polymarket · Binance WebSocket", which contradicts the requirement that the UI reflects **only Binance capital**.

You confirmed:
- Keep using the external project / `delta_arb_trades` table for the trade feed.
- Show **real Binance account balance at the top**, the bot's P&L log below.

## Plan

### 1. New edge function: `binance-balance` (in this Lovable Cloud project)
- Lovable-managed Deno edge function.
- Reads `BINANCE_API_KEY` + `BINANCE_API_SECRET` from secrets (read-only key is enough — `Enable Reading` permission).
- Signs a `GET /api/v3/account` request, returns:
  ```json
  { "usdt": 12.34, "btc": 0.00021, "btcPrice": 67890.1, "totalUsd": 26.59, "ts": "..." }
  ```
- CORS open, `verify_jwt = false` (page is admin-gated client-side; no PII in response).
- Graceful error: returns `{ error: "..." }` with 200 so UI can show a banner instead of breaking.

Required secrets I'll request after you approve:
- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`

(Use a key restricted to **Enable Reading** only, no withdraw, no trade. IP allowlist optional.)

### 2. Rewrite `src/pages/income-streams/DeltaArbBot.tsx`
- **Top card → "BINANCE CAPITAL" (live):**
  - Real USDT balance, BTC balance × spot price, total USD value.
  - LIVE / dimmed dot based on whether `binance-balance` succeeded.
  - Auto-refresh every 15s.
- **Below → "BOT TRADE LOG" (paper P&L):**
  - Still reads `delta_arb_trades` from `fjdzhrdpioxdeyyfogep` (unchanged URL + anon key already in file).
  - Stats row (Trades / Win Rate / Wins / Losses / Total P&L) computed from that feed, clearly labeled "Paper P&L — not part of Binance balance".
- Drop the "Polymarket · …" subtitle. New subtitle: "Binance spot · auto-refresh 15s".
- Keep the existing visual language (Midnight Black / Gold / Cyan, glassmorphism, no entrance animations) per project memory.
- Show a clear empty-state in the trade log: "Worker has not written any trades to `delta_arb_trades` yet — start the Railway worker pointed at `fjdzhrdpioxdeyyfogep`."

### 3. Connection health strip
Small row under the header with two pills:
- `Binance API` — green if `binance-balance` returns ok, red with the error message otherwise.
- `Trade feed DB` — green when fetch succeeds, shows row count; amber "0 rows" if reachable but empty (current state).

This makes it obvious at a glance which side is broken.

### Out of scope (call out, don't fix in this turn)
- Deploying / restarting the actual delta-arb worker on Railway that should be inserting into `delta_arb_trades`. The UI will be ready; once the worker writes a row, the feed will populate immediately. If you want me to also fix the worker, that's a separate task — tell me which Railway service and project ref it should target.

## Files touched
- `supabase/functions/binance-balance/index.ts` (new)
- `src/pages/income-streams/DeltaArbBot.tsx` (rewrite)

No DB migrations. No changes to other routes.
