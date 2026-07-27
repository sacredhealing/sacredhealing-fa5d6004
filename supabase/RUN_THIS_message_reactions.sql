-- ============================================================================
-- MESSAGE REACTIONS (heart, prayer hands, smiley, etc.)
-- ============================================================================
-- No strict foreign key to chat_messages/private_messages since a reaction
-- can point at either table — kept generic instead of building two parallel
-- reaction systems.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON public.message_reactions;
CREATE POLICY "reactions_select_all"
  ON public.message_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON public.message_reactions;
CREATE POLICY "reactions_insert_own"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete_own" ON public.message_reactions;
CREATE POLICY "reactions_delete_own"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
