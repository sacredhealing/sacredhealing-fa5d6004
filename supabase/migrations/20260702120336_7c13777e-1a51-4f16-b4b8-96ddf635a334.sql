ALTER TABLE sniper_trades
  ADD COLUMN IF NOT EXISTS tokens_held  NUMERIC,
  ADD COLUMN IF NOT EXISTS ath_price    NUMERIC,
  ADD COLUMN IF NOT EXISTS tp1_hit      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tp2_hit      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trail_armed  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS sniper_trades_mint_active_idx
  ON sniper_trades (mint)
  WHERE status IN ('open', 'pending');