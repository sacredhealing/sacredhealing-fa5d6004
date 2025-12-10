-- Add practitioner column to session_types
ALTER TABLE public.session_types ADD COLUMN IF NOT EXISTS practitioner text NOT NULL DEFAULT 'both' CHECK (practitioner IN ('adam', 'laila', 'both'));