-- ═══════════════════════════════════════════════════════════════
-- AGASTYA MEMORY RESTORATION
-- Migrates all existing ayurveda chat messages from apothecary_chat_messages
-- into user_sync_chat_messages (the correct table).
-- Safe: IF NOT EXISTS / ON CONFLICT DO NOTHING — runs clean even if re-run.
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create apothecary_chat_messages if it exists in Supabase (Lovable may have made it)
-- We just try to copy from it — if it doesn't exist the DO block catches it silently.

DO $$
BEGIN
  -- Copy ayurveda messages from apothecary_chat_messages → user_sync_chat_messages
  -- Only if apothecary_chat_messages table actually exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'apothecary_chat_messages'
  ) THEN
    INSERT INTO public.user_sync_chat_messages (id, user_id, chat_context, role, content, created_at)
    SELECT id, user_id, 'ayurveda', role, content, created_at
    FROM public.apothecary_chat_messages
    WHERE chat_context = 'ayurveda'
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migrated ayurveda messages from apothecary_chat_messages';
  ELSE
    RAISE NOTICE 'apothecary_chat_messages does not exist — nothing to migrate';
  END IF;

  -- Also copy from vedic_guru_chat_messages if it has ayurveda content
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'vedic_guru_chat_messages'
  ) THEN
    -- vedic_guru_chat_messages has no chat_context — all rows are ayurveda-style
    INSERT INTO public.user_sync_chat_messages (user_id, chat_context, role, content, created_at)
    SELECT user_id, 'ayurveda', role, content, created_at
    FROM public.vedic_guru_chat_messages
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Migrated messages from vedic_guru_chat_messages';
  END IF;

END $$;

-- Step 2: Ensure user_sync_chat_messages has correct indexes for fast full-history reads
CREATE INDEX IF NOT EXISTS idx_user_sync_chat_ayurveda_full
  ON public.user_sync_chat_messages (user_id, chat_context, created_at ASC);

-- Step 3: Ensure the service role used by the edge function can read/write
-- (RLS policies already exist from migration 20260508180000 but grant service role bypass)
ALTER TABLE public.user_sync_chat_messages FORCE ROW LEVEL SECURITY;

-- Allow edge function service role to bypass RLS for full history reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.user_sync_chat_messages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

