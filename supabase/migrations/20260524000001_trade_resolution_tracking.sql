-- Migration: trade resolution tracking
-- Adds end_date, resolved_at, pnl_usdc, exit_price to polymarket_trades

ALTER TABLE public.polymarket_trades
  ADD COLUMN IF NOT EXISTS market_end_date   timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at       timestamptz,
  ADD COLUMN IF NOT EXISTS exit_price        numeric,
  ADD COLUMN IF NOT EXISTS pnl_usdc          numeric,
  ADD COLUMN IF NOT EXISTS pnl_pct           numeric,
  ADD COLUMN IF NOT EXISTS winning_outcome   text,
  ADD COLUMN IF NOT EXISTS resolution_source text DEFAULT 'polymarket_api';

-- Index for fast open-position resolution sweeps
CREATE INDEX IF NOT EXISTS idx_poly_trades_open_end
  ON public.polymarket_trades (status, market_end_date)
  WHERE status = 'open';

-- Daily PnL rollup view
CREATE OR REPLACE VIEW public.polymarket_pnl_by_day AS
SELECT
  DATE(resolved_at) AS day,
  is_paper,
  COUNT(*)          AS trades_resolved,
  SUM(CASE WHEN status = 'won'  THEN 1 ELSE 0 END) AS wins,
  SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS losses,
  ROUND(SUM(pnl_usdc)::numeric, 4)                 AS total_pnl,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END)::numeric
    / NULLIF(COUNT(*), 0), 1
  ) AS win_rate_pct
FROM public.polymarket_trades
WHERE resolved_at IS NOT NULL
GROUP BY DATE(resolved_at), is_paper
ORDER BY day DESC;
