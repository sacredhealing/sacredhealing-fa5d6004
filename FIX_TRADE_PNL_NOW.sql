-- ============================================================================
-- SHREEM BRZEE — Fix PNL for all existing closed trades
-- Run this in Supabase SQL Editor (ssygukfdbtehvtndandn)
-- ============================================================================

-- STEP 1: Show current state of all closed trades
SELECT 
  id,
  symbol,
  label,
  status,
  amount_sol,
  entry_price,
  exit_price,
  pnl_pct,
  pnl_sol,
  sell_reason,
  created_at
FROM shreem_brzee_paper_trades
WHERE status = 'closed'
ORDER BY created_at DESC;

-- STEP 2: Fix trades that have both entry_price AND exit_price but pnl is wrong/zero
-- This recalculates pnl_pct and pnl_sol from the actual prices stored in the DB
UPDATE shreem_brzee_paper_trades
SET
  pnl_pct = CASE 
    WHEN entry_price > 0 AND exit_price > 0 
    THEN ((exit_price - entry_price) / entry_price) * 100
    ELSE 0
  END,
  pnl_sol = CASE 
    WHEN entry_price > 0 AND exit_price > 0 
    THEN amount_sol * (((exit_price - entry_price) / entry_price))
    ELSE 0
  END
WHERE 
  status = 'closed'
  AND exit_price IS NOT NULL 
  AND exit_price > 0;

-- STEP 3: After update, verify the results
SELECT 
  symbol,
  label,
  sell_reason,
  amount_sol,
  ROUND(entry_price::numeric, 8) as entry,
  ROUND(exit_price::numeric, 8) as exit,
  ROUND(pnl_pct::numeric, 2) as pnl_pct,
  ROUND(pnl_sol::numeric, 6) as pnl_sol,
  CASE WHEN pnl_sol >= 0 THEN 'WIN' ELSE 'LOSS' END as result,
  created_at
FROM shreem_brzee_paper_trades
WHERE status = 'closed'
ORDER BY created_at DESC;

-- STEP 4: Recalculate session totals from actual trade data
-- Run this after step 2 to fix the session wins/losses/pnl
UPDATE shreem_brzee_session
SET
  total_pnl = (
    SELECT COALESCE(SUM(pnl_sol), 0) 
    FROM shreem_brzee_paper_trades 
    WHERE status = 'closed'
  ),
  wins = (
    SELECT COUNT(*) 
    FROM shreem_brzee_paper_trades 
    WHERE status = 'closed' AND pnl_sol >= 0
  ),
  losses = (
    SELECT COUNT(*) 
    FROM shreem_brzee_paper_trades 
    WHERE status = 'closed' AND pnl_sol < 0
  ),
  updated_at = NOW()
WHERE id = 'default';

-- STEP 5: Final check — show session state
SELECT 
  id,
  portfolio,
  start_balance,
  total_pnl,
  wins,
  losses,
  CASE WHEN (wins + losses) > 0 
    THEN ROUND((wins::numeric / (wins + losses)) * 100, 1) 
    ELSE 0 
  END as win_rate_pct
FROM shreem_brzee_session
WHERE id = 'default';
