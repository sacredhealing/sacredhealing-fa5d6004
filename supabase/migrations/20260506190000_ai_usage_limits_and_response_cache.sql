-- AI rate limiting + response cache for edge functions
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, function_name, date)
);

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
