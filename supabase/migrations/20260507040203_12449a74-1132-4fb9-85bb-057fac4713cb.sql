CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, function_name, date)
);

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  query_hash TEXT NOT NULL,
  response_text TEXT NOT NULL,
  function_name TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_lookup ON public.ai_usage_limits(user_id, function_name, date);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON public.ai_response_cache(expires_at);

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
ON public.ai_usage_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all usage"
ON public.ai_usage_limits FOR SELECT
USING (public.is_admin_v3());

CREATE POLICY "Anyone can read cache"
ON public.ai_response_cache FOR SELECT
USING (true);
