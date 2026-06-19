DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'apothecary_chat_messages'
  ) THEN
    INSERT INTO public.user_sync_chat_messages (id, user_id, chat_context, role, content, created_at)
    SELECT id, user_id, 'ayurveda', role, content, created_at
    FROM public.apothecary_chat_messages
    WHERE chat_context = 'ayurveda'
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vedic_guru_chat_messages'
  ) THEN
    INSERT INTO public.user_sync_chat_messages (user_id, chat_context, role, content, created_at)
    SELECT user_id, 'ayurveda', role, content, created_at
    FROM public.vedic_guru_chat_messages
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_sync_chat_ayurveda_full
  ON public.user_sync_chat_messages (user_id, chat_context, created_at ASC);

ALTER TABLE public.user_sync_chat_messages FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.user_sync_chat_messages
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;