-- ═══════════════════════════════════════════════════════════════
-- Delta-Arb Bot v2: Fix bot_trades for Railway polymarket bot
-- Problem: original bot_trades has BTC bot schema + strict user RLS
-- Fix: add delta-arb columns, make user_id nullable, open anon read
-- ═══════════════════════════════════════════════════════════════

-- 1. Make user_id nullable so Railway bot (no auth) can insert
ALTER TABLE public.bot_trades
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add delta-arb columns (bot.py writes these fields)
ALTER TABLE public.bot_trades
  ADD COLUMN IF NOT EXISTS asset      text,
  ADD COLUMN IF NOT EXISTS signal     text,
  ADD COLUMN IF NOT EXISTS delta      text,
  ADD COLUMN IF NOT EXISTS pnl_usdc   numeric(12,4),
  ADD COLUMN IF NOT EXISTS net_pnl_usdc numeric(12,4),
  ADD COLUMN IF NOT EXISTS mode       text NOT NULL DEFAULT 'PAPER',
  ADD COLUMN IF NOT EXISTS order_id   text;

-- 3. Drop strict user-scoped read policy
DROP POLICY IF EXISTS "bot_trades_select_own" ON public.bot_trades;

-- 4. Add open anon read policy (shared bot dashboard — not per-user data)
CREATE POLICY "anon_read_all_bot_trades"
  ON public.bot_trades FOR SELECT
  USING (true);

-- 5. Add anon insert policy so bot's anon JWT can write
DROP POLICY IF EXISTS "bot_trades_insert_own" ON public.bot_trades;
CREATE POLICY "bot_insert_all"
  ON public.bot_trades FOR INSERT
  WITH CHECK (true);

-- 6. Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_bot_trades_mode_created
  ON public.bot_trades (mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_trades_asset
  ON public.bot_trades (asset, created_at DESC);
