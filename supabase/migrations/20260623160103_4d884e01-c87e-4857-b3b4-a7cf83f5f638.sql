UPDATE public.shreem_brzee_session
SET portfolio = portfolio + (
  SELECT COALESCE(SUM(amount_sol), 0)
  FROM public.shreem_brzee_live_trades
  WHERE status IN ('open','unconfirmed','pending','closing')
    AND mint NOT IN ('J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump','FgrnkD6Meh4yusagXu4duEx51HkEuEVrxUihG9r2ejRR')
),
updated_at = NOW()
WHERE id = 'default';

UPDATE public.shreem_brzee_live_trades
SET status='closed', sell_reason='ghost_refunded', closed_at=NOW(), pnl_sol=0, pnl_pct=0
WHERE status IN ('open','unconfirmed','pending','closing')
  AND mint NOT IN ('J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump','FgrnkD6Meh4yusagXu4duEx51HkEuEVrxUihG9r2ejRR');

UPDATE public.shreem_brzee_signals
SET live_processed = true
WHERE live_processed = false OR live_processed IS NULL;