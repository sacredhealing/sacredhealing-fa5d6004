-- Add category and planet_type fields to mantras table
ALTER TABLE public.mantras
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
CHECK (category IN ('planet', 'deity', 'intention', 'karma', 'wealth', 'health', 'peace', 'protection', 'general'));

ALTER TABLE public.mantras
ADD COLUMN IF NOT EXISTS planet_type TEXT
CHECK (planet_type IS NULL OR planet_type IN ('sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_mantras_category ON public.mantras(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mantras_planet_type ON public.mantras(planet_type) WHERE planet_type IS NOT NULL;

-- Update existing records to have 'general' category if not set
UPDATE public.mantras
SET category = 'general'
WHERE category IS NULL OR category = '';
