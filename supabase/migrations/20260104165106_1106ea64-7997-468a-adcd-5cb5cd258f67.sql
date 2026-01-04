-- Add mood, spiritual path, and content metadata to music_tracks
ALTER TABLE public.music_tracks
ADD COLUMN IF NOT EXISTS mood text,
ADD COLUMN IF NOT EXISTS spiritual_path text,
ADD COLUMN IF NOT EXISTS intended_use text,
ADD COLUMN IF NOT EXISTS affirmation text,
ADD COLUMN IF NOT EXISTS creator_notes text;

-- Add comments for documentation
COMMENT ON COLUMN public.music_tracks.mood IS 'Track mood: calm, energizing, healing, meditative, grounding';
COMMENT ON COLUMN public.music_tracks.spiritual_path IS 'Spiritual path: inner_peace, focus, sleep, healing, awakening';
COMMENT ON COLUMN public.music_tracks.intended_use IS 'Intended use: morning_practice, evening_wind_down, deep_work, meditation, yoga';
COMMENT ON COLUMN public.music_tracks.affirmation IS 'Associated affirmation or mantra for the track';
COMMENT ON COLUMN public.music_tracks.creator_notes IS 'Artist notes about the track creation and purpose';