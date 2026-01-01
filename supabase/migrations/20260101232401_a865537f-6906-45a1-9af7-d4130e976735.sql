-- Add youtube_url and audio_url columns to breathing_patterns
ALTER TABLE public.breathing_patterns 
ADD COLUMN youtube_url text,
ADD COLUMN audio_url text;