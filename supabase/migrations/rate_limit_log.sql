-- Rate Limit Log Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fjdzhrdpioxdeyyfogep/sql

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_fn_time 
  ON rate_limit_log(user_id, function_name, created_at);

-- Auto-cleanup: delete entries older than 2 hours to keep table small
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limit_log WHERE created_at < now() - interval '2 hours';
$$;

-- RLS
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON rate_limit_log
  USING (auth.role() = 'service_role');
