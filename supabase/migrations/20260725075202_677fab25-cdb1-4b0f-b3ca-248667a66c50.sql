
-- Chat storage RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload chat files') THEN
    CREATE POLICY "Users can upload chat files"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can view chat files') THEN
    CREATE POLICY "Users can view chat files"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'chat-storage');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own chat files') THEN
    CREATE POLICY "Users can delete own chat files"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- DM media columns
ALTER TABLE public.private_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','voice','image','file','video')),
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_private_messages_type ON public.private_messages(message_type);
