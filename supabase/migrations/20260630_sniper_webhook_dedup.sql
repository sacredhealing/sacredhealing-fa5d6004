-- Sniper webhook architecture: dedup safeguard.
--
-- The Hetzner worker's in-memory `buyingMints` lock only works because it's
-- one long-running process. A Supabase Edge Function has no such guarantee —
-- Helius webhook delivery is at-least-once, and concurrent invocations are
-- separate isolates that share no memory. Without a DB-level constraint,
-- two near-simultaneous deliveries for the same mint could both pass an
-- application-level "already have this?" check before either writes a row,
-- and you'd buy the same token twice.
--
-- A partial unique index makes the database itself the lock: only one row
-- per mint can be 'open' or 'pending' at a time. The edge function attempts
-- the INSERT *before* doing any RPC-heavy filtering; if it fails on this
-- constraint, another invocation already claimed the mint and this one exits
-- immediately, before spending a single Helius credit or Gemini call on it.

CREATE UNIQUE INDEX IF NOT EXISTS sniper_trades_mint_active_idx
  ON sniper_trades (mint)
  WHERE status IN ('open', 'pending');
