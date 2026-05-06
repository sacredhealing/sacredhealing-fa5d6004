-- SQI 2050 :: USER CHAT MEMORY (Akasha-Neural Archive)
-- Requires public.is_admin_v3() (see earlier migrations).

CREATE TABLE IF NOT EXISTS public.user_chat_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_type       TEXT NOT NULL CHECK (chat_type IN ('ayurveda', 'jyotish', 'apothecary', 'eotis')),
  session_title   TEXT,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_summary TEXT,
  message_count   INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_chat
  ON public.user_chat_sessions(user_id, chat_type, last_message_at DESC);

ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_chat_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_chat_sessions;

CREATE POLICY "Users can view their own sessions"
  ON public.user_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.user_chat_sessions FOR SELECT
  USING (public.is_admin_v3());

CREATE OR REPLACE FUNCTION public.update_user_chat_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_message_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_chat_sessions_updated_at ON public.user_chat_sessions;
CREATE TRIGGER user_chat_sessions_updated_at
  BEFORE UPDATE ON public.user_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_chat_sessions_timestamp();
