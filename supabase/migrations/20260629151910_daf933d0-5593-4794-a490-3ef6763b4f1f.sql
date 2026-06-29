ALTER TABLE public.shreem_brzee_live_trades 
  ADD COLUMN IF NOT EXISTS tx_sig text,
  ADD COLUMN IF NOT EXISTS sell_tx_sig text;

CREATE INDEX IF NOT EXISTS idx_live_trades_tx_sig ON public.shreem_brzee_live_trades(tx_sig) WHERE tx_sig IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_trades_sell_tx_sig ON public.shreem_brzee_live_trades(sell_tx_sig) WHERE sell_tx_sig IS NOT NULL;