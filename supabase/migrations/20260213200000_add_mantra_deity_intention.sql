-- Add optional contextual fields for mantra categories (ADD COLUMNS ONLY)
ALTER TABLE mantras
ADD COLUMN IF NOT EXISTS deity_name TEXT,
ADD COLUMN IF NOT EXISTS intention_type TEXT;
