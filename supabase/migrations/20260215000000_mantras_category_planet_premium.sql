-- CRITICAL: Add category and planet_type so Admin /admin/mantras does not crash.
-- category (text), planet_type (text, nullable). Also is_premium for membership gating.
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS planet_type text;
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
