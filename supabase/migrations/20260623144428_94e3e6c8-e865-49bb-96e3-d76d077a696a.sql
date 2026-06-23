UPDATE public.shreem_brzee_live_trades
SET status='closed', sell_reason='ghost_no_tokens', closed_at=NOW(), pnl_sol=0, pnl_pct=0
WHERE label='trunoest' AND status IN ('open','pending','unconfirmed');