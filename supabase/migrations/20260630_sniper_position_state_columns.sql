-- The webhook architecture splits buy (edge function) from sell/management
-- (Hetzner worker) across two processes. Previously all position state
-- (tokens held, ATH price, which TP tier fired, armed trailing stop) lived
-- only in the Hetzner worker's own memory, because it was the only thing
-- that ever created or touched a position. Now a position can be created
-- by a process that the Hetzner worker doesn't share memory with, and the
-- worker itself can restart independently of the edge function — so this
-- state has to be durable, not reconstructed-from-nothing on every restart.

ALTER TABLE sniper_trades
  ADD COLUMN IF NOT EXISTS tokens_held  NUMERIC,
  ADD COLUMN IF NOT EXISTS ath_price    NUMERIC,
  ADD COLUMN IF NOT EXISTS tp1_hit      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tp2_hit      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trail_armed  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC DEFAULT 0;
