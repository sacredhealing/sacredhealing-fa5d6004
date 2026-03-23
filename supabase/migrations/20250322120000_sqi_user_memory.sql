-- SQI MEMORY SYSTEM — persistent cross-session profile for quantum-apothecary-chat
-- Edge functions use the service role and bypass RLS; authenticated users may read their own row only.

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

-- Do NOT add a blanket USING (true) policy — that would expose all rows to every logged-in user.
-- Service role (edge function) bypasses RLS entirely.

CREATE POLICY "Users can read own sqi memory"
  ON public.sqi_user_memory FOR SELECT
  USING (auth.uid() = user_id);
