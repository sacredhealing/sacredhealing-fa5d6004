
ALTER TABLE public.shreem_brzee_paper_trades
  ADD COLUMN IF NOT EXISTS entry_price numeric,
  ADD COLUMN IF NOT EXISTS exit_price numeric,
  ADD COLUMN IF NOT EXISTS amount_sol numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pnl_pct numeric,
  ADD COLUMN IF NOT EXISTS wallet text;

CREATE INDEX IF NOT EXISTS idx_shreem_paper_status ON public.shreem_brzee_paper_trades(status, opened_at DESC);
