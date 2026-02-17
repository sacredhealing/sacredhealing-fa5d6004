-- Add multimedia support to chat_messages
-- This migration adds support for voice notes, files, images, and videos

-- Add new columns to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'file', 'video')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER, -- For voice notes/videos in seconds
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT, -- For videos/images
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'error'));

-- Create storage bucket for chat files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-storage',
  'chat-storage',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'audio/ogg', 'audio/webm', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "Users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-storage');

CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON public.chat_messages(status);
