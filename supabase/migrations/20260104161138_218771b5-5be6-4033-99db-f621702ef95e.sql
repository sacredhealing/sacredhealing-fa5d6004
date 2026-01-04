
-- Add text columns for inline mantras and breathing patterns (allows content without FK references)
ALTER TABLE spiritual_path_days ADD COLUMN IF NOT EXISTS mantra_text TEXT;
ALTER TABLE spiritual_path_days ADD COLUMN IF NOT EXISTS breathing_description TEXT;
