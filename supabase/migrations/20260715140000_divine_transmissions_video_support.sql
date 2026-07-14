-- Divine Transmissions become a mixed audio/video content feed, not split
-- into separate sections — matches the "one feed, some posts are audio,
-- some are video" pattern of Patreon-style content drops, and avoids
-- duplicating purchase logic across two systems.

ALTER TABLE public.divine_transmissions
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'audio' CHECK (content_type IN ('audio', 'video')),
  ADD COLUMN IF NOT EXISTS video_url_en TEXT,
  ADD COLUMN IF NOT EXISTS video_url_sv TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
