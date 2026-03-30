-- Restore SQI full conversation archive table for per-user memory continuity
CREATE TABLE IF NOT EXISTS public.sqi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sqi_sessions_user_updated_at
  ON public.sqi_sessions (user_id, updated_at DESC);

ALTER TABLE public.sqi_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own SQI sessions" ON public.sqi_sessions;
CREATE POLICY "Users can view their own SQI sessions"
  ON public.sqi_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own SQI sessions" ON public.sqi_sessions;
CREATE POLICY "Users can insert their own SQI sessions"
  ON public.sqi_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own SQI sessions" ON public.sqi_sessions;
CREATE POLICY "Users can update their own SQI sessions"
  ON public.sqi_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own SQI sessions" ON public.sqi_sessions;
CREATE POLICY "Users can delete their own SQI sessions"
  ON public.sqi_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_sqi_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_sqi_sessions_updated_at
    BEFORE UPDATE ON public.sqi_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;