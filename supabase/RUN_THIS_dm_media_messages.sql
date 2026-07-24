-- ============================================================================
-- DM MULTIMEDIA MESSAGES (photo, video, voice in private chats)
-- Run once in the Supabase SQL Editor when you have credits again.
-- Mirrors the columns chat_messages already has (group chat) — no new
-- storage bucket needed, DMs reuse the same public 'chat-storage' bucket.
-- ============================================================================

ALTER TABLE public.private_messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'file', 'video')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_private_messages_type ON public.private_messages(message_type);
