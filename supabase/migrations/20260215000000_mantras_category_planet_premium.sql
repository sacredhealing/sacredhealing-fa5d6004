-- Ensure mantras has category, planet_type, is_premium for admin form
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS planet_type text;
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
