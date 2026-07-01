DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def
  FROM pg_constraint WHERE conname = 'polymarket_trades_status_check';
  RAISE NOTICE 'Current constraint: %', def;
  IF def NOT LIKE '%abandoned%' THEN
    ALTER TABLE polymarket_trades DROP CONSTRAINT polymarket_trades_status_check;
    ALTER TABLE polymarket_trades ADD CONSTRAINT polymarket_trades_status_check
      CHECK (status = ANY (ARRAY['open','won','lost','failed','abandoned']));
    RAISE NOTICE 'Constraint updated to allow abandoned';
  ELSE
    RAISE NOTICE 'abandoned already allowed, no change needed';
  END IF;
END $$;

UPDATE polymarket_trades
SET status = 'abandoned', resolved_at = now(), resolution_source = 'manual_stale_cleanup'
WHERE status = 'open' AND is_paper = true AND created_at < now() - interval '7 days';