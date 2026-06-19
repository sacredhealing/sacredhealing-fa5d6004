-- ═══════════════════════════════════════════════════════════════
-- AGASTYA MEMORY RESTORATION v2
-- Safe copy: apothecary_chat_messages → user_sync_chat_messages
-- STRICT: filters by user_id AND chat_context on every operation
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'apothecary_chat_messages'
  ) THEN
    -- Only copy rows that have a valid user_id (no orphaned/mixed rows)
    INSERT INTO public.user_sync_chat_messages 
      (id, user_id, chat_context, role, content, created_at)
    SELECT 
      id, 
      user_id,   -- each row goes to its OWN user_id — no mixing possible
      'ayurveda',
      role, 
      content, 
      created_at
    FROM public.apothecary_chat_messages
    WHERE 
      chat_context = 'ayurveda'
      AND user_id IS NOT NULL  -- strict: skip any rows without a user_id
    ON CONFLICT (id) DO NOTHING;  -- never overwrite existing messages

    RAISE NOTICE 'Migration complete: apothecary_chat_messages → user_sync_chat_messages';
  ELSE
    RAISE NOTICE 'Source table does not exist — nothing to migrate';
  END IF;
END $$;

-- Fast index for full-history reads per user
CREATE INDEX IF NOT EXISTS idx_user_sync_chat_user_context_time
  ON public.user_sync_chat_messages (user_id, chat_context, created_at ASC);

-- Service role bypass for edge function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sync_chat_messages'
    AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY "service_role_full_access"
      ON public.user_sync_chat_messages
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

