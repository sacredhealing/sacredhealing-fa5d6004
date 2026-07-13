ALTER TABLE public.divine_transmissions
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'audio' CHECK (content_type IN ('audio', 'video')),
  ADD COLUMN IF NOT EXISTS video_url_en TEXT,
  ADD COLUMN IF NOT EXISTS video_url_sv TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;