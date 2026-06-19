-- ============================================================
-- RESTORE SESSION FROM ACTUAL TRADE DATA
-- Run in Supabase SQL Editor to fix the 0 trades display
-- ============================================================

-- Step 1: See what trades actually exist
SELECT 
  status,
  COUNT(*) as count,
  SUM(pnl_sol) as total_pnl_sol,
  SUM(CASE WHEN pnl_sol >= 0 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN pnl_sol < 0 THEN 1 ELSE 0 END) as losses
FROM shreem_brzee_paper_trades
GROUP BY status;

-- Step 2: Restore session to match actual trade data
UPDATE shreem_brzee_session
SET
  total_pnl = (SELECT COALESCE(SUM(pnl_sol), 0) FROM shreem_brzee_paper_trades WHERE status = 'closed'),
  wins      = (SELECT COUNT(*) FROM shreem_brzee_paper_trades WHERE status = 'closed' AND pnl_sol >= 0),
  losses    = (SELECT COUNT(*) FROM shreem_brzee_paper_trades WHERE status = 'closed' AND pnl_sol < 0),
  updated_at = NOW()
WHERE id = 'default';

-- Step 3: Verify session now matches
SELECT id, portfolio, start_balance, total_pnl, wins, losses, started_at, stopped_at
FROM shreem_brzee_session
WHERE id = 'default';
