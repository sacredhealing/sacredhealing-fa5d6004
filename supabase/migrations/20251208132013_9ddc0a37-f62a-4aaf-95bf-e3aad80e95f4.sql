-- Add BPM column to music_tracks table
ALTER TABLE public.music_tracks ADD COLUMN IF NOT EXISTS bpm integer DEFAULT NULL;