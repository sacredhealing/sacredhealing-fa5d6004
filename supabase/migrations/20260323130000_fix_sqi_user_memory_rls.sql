-- Fix sqi_user_memory after hand-run SQL or partial applies:
-- - Removes unsafe "Service role full access" (USING true) if present
-- - Ensures table + index exist
-- - Single SELECT policy: own row only (edge function uses service role → bypasses RLS)

DROP POLICY IF EXISTS "Service role full access" ON public.sqi_user_memory;

CREATE TABLE IF NOT EXISTS public.sqi_user_memory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_profile  text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sqi_user_memory_user_id
  ON public.sqi_user_memory (user_id);

ALTER TABLE public.sqi_user_memory ENABLE ROW LEVEL SECURITY;

-- Hand-run script used this name; repo migration used "Users can read own sqi memory"
DROP POLICY IF EXISTS "Users can read own memory" ON public.sqi_user_memory;
DROP POLICY IF EXISTS "Users can read own sqi memory" ON public.sqi_user_memory;

CREATE POLICY "Users can read own sqi memory"
  ON public.sqi_user_memory FOR SELECT
  USING (auth.uid() = user_id);
