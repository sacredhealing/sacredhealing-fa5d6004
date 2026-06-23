UPDATE public.shreem_brzee_live_trades
SET status = 'closed',
    sell_reason = 'unconfirmed_timeout',
    closed_at = NOW()
WHERE status = 'unconfirmed'
  AND opened_at < NOW() - INTERVAL '10 minutes';