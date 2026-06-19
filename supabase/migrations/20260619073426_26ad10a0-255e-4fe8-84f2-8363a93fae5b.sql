-- ═══════════════════════════════════════════════════════════════
-- AGASTYA MEMORY RESTORATION (with table creation)
-- Creates user_sync_chat_messages if missing, then migrates data.
-- ═══════════════════════════════════════════════════════════════

-- Step 0: Create target table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.user_sync_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chat_context text NOT NULL CHECK (chat_context IN ('apothecary', 'ayurveda')),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sync_chat_messages TO authenticated;
GRANT ALL ON public.user_sync_chat_messages TO service_role;

ALTER TABLE public.user_sync_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies via DO blocks (IF NOT EXISTS not supported for policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages'
    AND policyname = 'Users select own sync chat rows'
  ) THEN
    CREATE POLICY "Users select own sync chat rows"
      ON public.user_sync_chat_messages FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages'
    AND policyname = 'Users insert own sync chat rows'
  ) THEN
    CREATE POLICY "Users insert own sync chat rows"
      ON public.user_sync_chat_messages FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages'
    AND policyname = 'Users delete own sync chat rows'
  ) THEN
    CREATE POLICY "Users delete own sync chat rows"
      ON public.user_sync_chat_messages FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 1: Migrate ayurveda messages from legacy tables
DO $$
BEGIN
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

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'vedic_guru_chat_messages'
  ) THEN
    INSERT INTO public.user_sync_chat_messages (user_id, chat_context, role, content, created_at)
    SELECT user_id, 'ayurveda', role, content, created_at
    FROM public.vedic_guru_chat_messages
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Migrated messages from vedic_guru_chat_messages';
  END IF;
END $$;

-- Step 2: Index for fast full-history reads
CREATE INDEX IF NOT EXISTS idx_user_sync_chat_ayurveda_full
  ON public.user_sync_chat_messages (user_id, chat_context, created_at ASC);

-- Step 3: Service role bypass policy
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