CREATE TABLE IF NOT EXISTS public.apothecary_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_context TEXT NOT NULL DEFAULT 'apothecary',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apothecary_chat_user_context
  ON public.apothecary_chat_messages(user_id, chat_context, created_at);

ALTER TABLE public.apothecary_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own apothecary messages"
  ON public.apothecary_chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own apothecary messages"
  ON public.apothecary_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own apothecary messages"
  ON public.apothecary_chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own apothecary messages"
  ON public.apothecary_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);