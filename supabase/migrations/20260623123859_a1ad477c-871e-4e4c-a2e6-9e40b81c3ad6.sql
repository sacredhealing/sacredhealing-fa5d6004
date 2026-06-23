CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_trades_active_mint
ON public.shreem_brzee_live_trades (mint)
WHERE status IN ('open','pending','unconfirmed','closing');