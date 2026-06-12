CREATE TABLE IF NOT EXISTS public.bhrigu_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reading_type text NOT NULL DEFAULT 'general',
  question text,
  sections jsonb NOT NULL DEFAULT '{}',
  birth_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bhrigu_readings_user_created
  ON public.bhrigu_readings (user_id, created_at DESC);

ALTER TABLE public.bhrigu_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own bhrigu readings"
  ON public.bhrigu_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bhrigu readings"
  ON public.bhrigu_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bhrigu readings"
  ON public.bhrigu_readings FOR DELETE
  USING (auth.uid() = user_id);