-- Add category to mantras
ALTER TABLE mantras
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';

-- Optional: planet type for Jyotish
ALTER TABLE mantras
ADD COLUMN IF NOT EXISTS planet_type TEXT;
