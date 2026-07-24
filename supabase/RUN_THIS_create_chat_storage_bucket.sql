-- ============================================================================
-- CREATE chat-storage BUCKET (idempotent — safe to run even if parts already exist)
-- Fixes "Bucket not found" when sending photos/videos/voice notes in chat.
-- This affects BOTH group chat and DM media — same bucket, same fix for both.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-storage',
  'chat-storage',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'audio/ogg', 'audio/webm', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload chat files'
  ) THEN
    CREATE POLICY "Users can upload chat files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can view chat files'
  ) THEN
    CREATE POLICY "Users can view chat files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'chat-storage');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete own chat files'
  ) THEN
    CREATE POLICY "Users can delete own chat files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Verify — should return one row showing the bucket now exists
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'chat-storage';
