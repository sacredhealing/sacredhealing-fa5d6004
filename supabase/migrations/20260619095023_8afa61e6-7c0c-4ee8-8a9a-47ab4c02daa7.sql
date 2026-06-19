
-- Add live_processed column to signals
ALTER TABLE public.shreem_brzee_signals
  ADD COLUMN IF NOT EXISTS live_processed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_shreem_signals_live_pending
  ON public.shreem_brzee_signals (created_at)
  WHERE live_processed = false AND action = 'BUY';

-- Live trades table (mirrors paper_trades shape, plus tx_sig + slippage)
CREATE TABLE IF NOT EXISTS public.shreem_brzee_live_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT 'default',
  sig text UNIQUE,
  tx_sig text,
  mint text,
  symbol text,
  label text,
  wallet text,
  action text,
  entry_price numeric,
  exit_price numeric,
  amount_sol numeric,
  gross_sol numeric,
  net_sol numeric,
  pnl_sol numeric,
  pnl_pct numeric,
  tokens_received numeric,
  slippage_pct numeric,
  status text DEFAULT 'open',
  close_reason text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.shreem_brzee_live_trades TO authenticated, anon;
GRANT ALL ON public.shreem_brzee_live_trades TO service_role;
ALTER TABLE public.shreem_brzee_live_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live trades readable by all"
  ON public.shreem_brzee_live_trades FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_live_trades_status ON public.shreem_brzee_live_trades(status);
CREATE INDEX IF NOT EXISTS idx_live_trades_mint ON public.shreem_brzee_live_trades(mint);
