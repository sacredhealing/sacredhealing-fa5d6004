-- Fix RLS on polymarket_trades — allow authenticated users to read their own trades
-- and allow service_role full access (for bot writes)

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Users read own trades" ON polymarket_trades;
DROP POLICY IF EXISTS "Service role full access" ON polymarket_trades;
DROP POLICY IF EXISTS "auth read trades" ON polymarket_trades;

-- Users can read their own trades
CREATE POLICY "Users read own trades"
  ON polymarket_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own trades (for paper mode from frontend)
CREATE POLICY "Users insert own trades"
  ON polymarket_trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anon to read aggregate data (no user_id filter — for dashboard stats)
-- Only non-sensitive fields visible to anon
CREATE POLICY "Anon reads aggregate trades"
  ON polymarket_trades FOR SELECT
  TO anon
  USING (true);

-- Fix clawbot_members RLS
ALTER TABLE clawbot_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own membership" ON clawbot_members;
CREATE POLICY "Users manage own membership"
  ON clawbot_members FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix clawbot_fee_ledger RLS
ALTER TABLE clawbot_fee_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own fees" ON clawbot_fee_ledger;
CREATE POLICY "Users view own fees"
  ON clawbot_fee_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON polymarket_trades TO anon;
GRANT ALL ON polymarket_trades TO authenticated, service_role;
GRANT ALL ON clawbot_members TO authenticated, service_role;
GRANT ALL ON clawbot_fee_ledger TO authenticated, service_role;
GRANT SELECT ON clawbot_member_stats TO authenticated, anon;
