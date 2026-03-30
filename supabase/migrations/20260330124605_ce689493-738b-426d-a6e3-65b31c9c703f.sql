
-- Create sqi_user_memory table for the Living Portrait memory system
CREATE TABLE public.sqi_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  memory_profile TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sqi_user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memory" ON public.sqi_user_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access sqi_user_memory" ON public.sqi_user_memory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create nadi_baselines table for storing scan results
CREATE TABLE public.nadi_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  active_nadis INTEGER NOT NULL DEFAULT 0,
  active_sub_nadis INTEGER NOT NULL DEFAULT 0,
  blockage_pct INTEGER NOT NULL DEFAULT 0,
  dominant_dosha TEXT NOT NULL DEFAULT 'Vata',
  primary_blockage TEXT NOT NULL DEFAULT 'Heart/Anahata Nadi',
  planetary_align TEXT DEFAULT '',
  herb_of_today TEXT DEFAULT '',
  bio_reading TEXT DEFAULT '',
  remedies JSONB DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nadi_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nadi baseline" ON public.nadi_baselines
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role full access nadi_baselines" ON public.nadi_baselines
  FOR ALL TO service_role USING (true) WITH CHECK (true);
