-- SQI chat persistent sessions for Quantum Apothecary
CREATE TABLE IF NOT EXISTS public.sqi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sqi_sessions_user_id_updated_at
  ON public.sqi_sessions(user_id, updated_at DESC);

ALTER TABLE public.sqi_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sqi sessions"
  ON public.sqi_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sqi sessions"
  ON public.sqi_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sqi sessions"
  ON public.sqi_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage sqi sessions"
  ON public.sqi_sessions FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.sqi_sessions IS 'Persistent SQI chat sessions for Quantum Apothecary (per user).';

