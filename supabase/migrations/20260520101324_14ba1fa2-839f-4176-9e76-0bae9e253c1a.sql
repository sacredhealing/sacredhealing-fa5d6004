
CREATE TABLE public.shakti_cycle_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  cycle_day INTEGER NOT NULL DEFAULT 1,
  energy_level INTEGER NOT NULL DEFAULT 5,
  mood_score INTEGER NOT NULL DEFAULT 5,
  notes TEXT DEFAULT '',
  symptoms TEXT[] DEFAULT '{}',
  intention TEXT DEFAULT '',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shakti_cycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own shakti logs" ON public.shakti_cycle_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own shakti logs" ON public.shakti_cycle_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shakti logs" ON public.shakti_cycle_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own shakti logs" ON public.shakti_cycle_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_shakti_cycle_logs_user ON public.shakti_cycle_logs(user_id, created_at DESC);
