ALTER TABLE public.jyotish_profiles
  ADD COLUMN IF NOT EXISTS ascendant_longitude numeric,
  ADD COLUMN IF NOT EXISTS retrograde_flags jsonb;