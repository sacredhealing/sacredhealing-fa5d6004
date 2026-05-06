-- supabase/migrations/20260504000000_ai_cost_shield.sql
-- SQI Cost Shield v1.0
-- Creates rate limiting and response cache tables

CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, function_name, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date 
  ON ai_usage_limits(user_id, date);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  query_hash TEXT NOT NULL,
  response_text TEXT NOT NULL,
  function_name TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_key 
  ON ai_response_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_cache_expires 
  ON ai_response_cache(expires_at);
