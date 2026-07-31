
-- 1. Restrict chat-storage reads
DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;

CREATE POLICY "Users can view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-storage'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.private_messages pm
      WHERE (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
        AND (pm.file_url LIKE '%' || storage.objects.name OR pm.thumbnail_url LIKE '%' || storage.objects.name)
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_members cm ON cm.room_id = m.room_id AND cm.user_id = auth.uid()
      WHERE m.content LIKE '%' || storage.objects.name || '%'
    )
  )
);

-- 2. Prevent self-granting paid tiers at profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (membership_tier IS NULL OR membership_tier IN ('free', 'atma-seed', 'atma_seed'))
);
