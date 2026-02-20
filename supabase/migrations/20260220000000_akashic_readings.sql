-- My Records: permanent Akashic reading access per user (never pay twice for same scan)
CREATE TABLE IF NOT EXISTS public.akashic_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_house SMALLINT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_akashic_readings_user_id ON public.akashic_readings(user_id);

ALTER TABLE public.akashic_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own akashic readings"
  ON public.akashic_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own akashic readings"
  ON public.akashic_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own akashic readings"
  ON public.akashic_readings FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.akashic_readings IS 'Stores Akashic Deep Reading purchase/access per user for My Records and permanent access';
