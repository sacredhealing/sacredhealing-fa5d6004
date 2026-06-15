ALTER TABLE public.jyotish_profiles
  ADD COLUMN IF NOT EXISTS ascendant text,
  ADD COLUMN IF NOT EXISTS sun_sign text,
  ADD COLUMN IF NOT EXISTS mars_sign text;