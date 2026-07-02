CREATE UNIQUE INDEX IF NOT EXISTS sniper_trades_mint_active_idx
  ON sniper_trades (mint)
  WHERE status IN ('open', 'pending');