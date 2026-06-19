-- ============================================================
-- FULL RECOVERY SQL — Shreem Brzee Bot
-- Run in Supabase SQL Editor (ssygukfdbtehvtndandn)
-- ============================================================

-- STEP 1: See ALL trades that exist (including deleted sessions)
SELECT 
  COUNT(*)                                                    AS total_trades,
  COUNT(*) FILTER (WHERE status = 'closed')                  AS closed_trades,
  COUNT(*) FILTER (WHERE status = 'open')                    AS open_trades,
  COALESCE(SUM(pnl_sol) FILTER (WHERE status = 'closed'), 0) AS total_pnl_sol,
  COUNT(*) FILTER (WHERE status='closed' AND pnl_sol >= 0)   AS wins,
  COUNT(*) FILTER (WHERE status='closed' AND pnl_sol <  0)   AS losses,
  COALESCE(SUM(amount_sol), 0)                               AS total_sol_traded,
  MIN(created_at)                                            AS first_trade,
  MAX(created_at)                                            AS last_trade
FROM shreem_brzee_paper_trades;

-- STEP 2: Show every closed trade with PNL
SELECT 
  symbol,
  label,
  ROUND(amount_sol::numeric, 4)   AS size_sol,
  ROUND(entry_price::numeric, 8)  AS entry,
  ROUND(exit_price::numeric, 8)   AS exit,
  ROUND(pnl_pct::numeric, 2)      AS pnl_pct,
  ROUND(pnl_sol::numeric, 6)      AS pnl_sol,
  sell_reason,
  created_at::date                AS date
FROM shreem_brzee_paper_trades
WHERE status = 'closed'
ORDER BY created_at DESC
LIMIT 100;

-- STEP 3: Reconstruct true balance
-- Start: 1 SOL (original start_balance)
-- True current = 1 SOL + all closed PNL
WITH trade_summary AS (
  SELECT
    1.0 AS start_sol,
    COALESCE(SUM(pnl_sol) FILTER (WHERE status='closed'), 0) AS total_pnl_sol,
    COUNT(*) FILTER (WHERE status='closed' AND pnl_sol >= 0) AS wins,
    COUNT(*) FILTER (WHERE status='closed' AND pnl_sol <  0) AS losses
  FROM shreem_brzee_paper_trades
)
SELECT
  start_sol,
  ROUND(total_pnl_sol::numeric, 4)              AS total_pnl_sol,
  ROUND((start_sol + total_pnl_sol)::numeric, 4) AS true_balance_sol,
  wins,
  losses,
  CASE WHEN (wins+losses) > 0 
    THEN ROUND((wins::numeric/(wins+losses))*100, 1) 
    ELSE 0 END                                   AS win_rate_pct
FROM trade_summary;

-- STEP 4: Fix the session to show correct numbers
-- Use the reconstructed balance as the new start
UPDATE shreem_brzee_session
SET
  start_balance = 1.0,
  portfolio     = (
    SELECT 1.0 + COALESCE(SUM(pnl_sol), 0)
    FROM shreem_brzee_paper_trades
    WHERE status = 'closed'
  ),
  total_pnl = (
    SELECT COALESCE(SUM(pnl_sol), 0)
    FROM shreem_brzee_paper_trades
    WHERE status = 'closed'
  ),
  wins = (
    SELECT COUNT(*) FROM shreem_brzee_paper_trades
    WHERE status = 'closed' AND pnl_sol >= 0
  ),
  losses = (
    SELECT COUNT(*) FROM shreem_brzee_paper_trades
    WHERE status = 'closed' AND pnl_sol < 0
  ),
  updated_at = NOW()
WHERE id = 'default';

-- STEP 5: Verify final session state
SELECT
  id,
  ROUND(start_balance::numeric, 4) AS start_sol,
  ROUND(portfolio::numeric, 4)     AS current_sol,
  ROUND(total_pnl::numeric, 4)     AS total_pnl_sol,
  wins,
  losses,
  CASE WHEN (wins+losses) > 0 
    THEN ROUND((wins::numeric/(wins+losses))*100,1)
    ELSE 0 END                     AS win_rate_pct,
  started_at,
  stopped_at
FROM shreem_brzee_session
WHERE id = 'default';
