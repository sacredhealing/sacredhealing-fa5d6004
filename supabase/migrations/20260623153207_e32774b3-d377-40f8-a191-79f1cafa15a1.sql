UPDATE public.shreem_brzee_session 
SET portfolio = portfolio + (
  SELECT COALESCE(SUM(amount_sol), 0) 
  FROM public.shreem_brzee_live_trades 
  WHERE status IN ('open','unconfirmed','pending')
    AND mint NOT IN ('5XfHgaiq...','FgrnkD6M...')
)
WHERE id = 'default';

UPDATE public.shreem_brzee_live_trades
SET status='closed', sell_reason='ghost_refunded', 
    closed_at=NOW(), pnl_sol=0, pnl_pct=0
WHERE status IN ('open','unconfirmed','pending')
  AND tokens_received IS NULL;