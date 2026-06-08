
-- Fix RLS: allow any authenticated user to READ all sniper_trades (bot dashboard)
DROP POLICY IF EXISTS "Users own sniper_trades" ON sniper_trades;
DROP POLICY IF EXISTS "Users own their sniper_trades" ON sniper_trades;

-- Read: any authenticated user can see all trades (shared bot dashboard)
CREATE POLICY "Authenticated read sniper_trades"
  ON sniper_trades FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Insert/Update: only service role (the bot)
CREATE POLICY "Service role writes sniper_trades"
  ON sniper_trades FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role updates sniper_trades"
  ON sniper_trades FOR UPDATE
  USING (auth.role() = 'service_role');

-- Same fix for sniper_members
DROP POLICY IF EXISTS "Users own sniper_members" ON sniper_members;
DROP POLICY IF EXISTS "Users own their sniper_members row" ON sniper_members;

CREATE POLICY "Users manage own sniper_member"
  ON sniper_members FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Also allow reading affiliate rates
ALTER TABLE sniper_affiliate_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read sniper rates" ON sniper_affiliate_rates;
CREATE POLICY "Read sniper rates" ON sniper_affiliate_rates FOR SELECT USING (true);
