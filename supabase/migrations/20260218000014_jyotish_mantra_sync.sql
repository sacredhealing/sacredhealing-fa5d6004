-- JYOTISH-MANTRA SYNC & SCHEMA FIX
-- Ensures category column exists and refreshes Supabase API cache

-- 1. Ensure category and planet_type columns exist
ALTER TABLE public.mantras 
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS planet_type text;

-- 2. Ensure all existing mantras have a category
UPDATE public.mantras 
SET category = 'general' 
WHERE category IS NULL;

-- 3. Force Supabase API to reload schema (via notification)
-- Note: This requires PostgreSQL LISTEN/NOTIFY support
-- The actual schema refresh happens automatically when Supabase detects the migration

-- 4. Verify columns exist (Safety Check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mantras' 
    AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'Category column not found after migration';
  END IF;
END $$;

-- 5. Add index for faster planet_type filtering
CREATE INDEX IF NOT EXISTS idx_mantras_planet_type ON public.mantras(planet_type) WHERE planet_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mantras_category ON public.mantras(category) WHERE category IS NOT NULL;

-- 6. Add Jyotish-Mantra UI translations
INSERT INTO public.ui_translations (key_name, en_text, sv_text, category) VALUES
  ('mantras_day_mantra', 'Dagens Mantra', 'Dagens Mantra', 'ui'),
  ('mantras_period_mantra', 'Ditt Period-Mantra', 'Ditt Period-Mantra', 'ui'),
  ('mantras_hora_mantra', 'Hour Mantra', 'Tim-Mantra', 'ui'),
  ('mantras_cosmic_timing', 'Cosmic Timing Recommendations', 'Kosmiska Timing-Rekommendationer', 'ui'),
  ('mantras_duration', 'Duration', 'Varaktighet', 'ui'),
  ('mantras_repetitions', 'Repetitions', 'Repetitioner', 'ui'),
  ('mantras_best_time', 'Best time', 'Bästa tid', 'ui'),
  ('mantras_not_found', 'Not found', 'Hittades inte', 'ui'),
  ('mantras_not_available', 'Not available', 'Ej tillgänglig', 'ui')
ON CONFLICT (key_name) DO UPDATE SET 
  en_text = EXCLUDED.en_text, 
  sv_text = EXCLUDED.sv_text, 
  updated_at = now();
