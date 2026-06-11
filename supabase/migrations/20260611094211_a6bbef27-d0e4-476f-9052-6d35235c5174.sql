CREATE TABLE IF NOT EXISTS public.bot_status (
  bot_id      text NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode        text,
  balance     numeric(12,4),
  pnl         numeric(12,4),
  trades_won  int DEFAULT 0,
  trades_lost int DEFAULT 0,
  win_rate    numeric(5,1) DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (bot_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_status TO authenticated;
GRANT ALL ON public.bot_status TO service_role;

ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bot_status" ON public.bot_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bot_status" ON public.bot_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bot_status" ON public.bot_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);