-- Add category and planet_type to mantras for Sacred Library
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS planet_type text;
