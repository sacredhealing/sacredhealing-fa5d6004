ALTER TABLE public.polymarket_trades
  ADD COLUMN IF NOT EXISTS market_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS exit_price      numeric,
  ADD COLUMN IF NOT EXISTS pnl_usdc        numeric,
  ADD COLUMN IF NOT EXISTS pnl_pct         numeric,
  ADD COLUMN IF NOT EXISTS winning_outcome text;