-- Add language column to meditations for Meditation language filter (sv/en)
-- Connects to /meditations page language toggle
ALTER TABLE public.meditations
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Backfill existing rows: default to 'en' if null
UPDATE public.meditations SET language = 'en' WHERE language IS NULL;
