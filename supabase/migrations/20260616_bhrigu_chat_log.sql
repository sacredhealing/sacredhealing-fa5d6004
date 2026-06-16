-- bhrigu_chat_log: persistent cross-session chat history per user
CREATE TABLE IF NOT EXISTS public.bhrigu_chat_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'oracle')),
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS bhrigu_chat_log_user_created ON public.bhrigu_chat_log (user_id, created_at);

ALTER TABLE public.bhrigu_chat_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat log" ON public.bhrigu_chat_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat log" ON public.bhrigu_chat_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own chat log" ON public.bhrigu_chat_log
  FOR DELETE USING (auth.uid() = user_id);
