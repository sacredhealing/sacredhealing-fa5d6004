-- Per-user chat turns for Quantum Apothecary + Ayurveda portals (cross-device sync).
-- Distinct from public.chat_messages (Sacred Circles / room_id).

CREATE TABLE IF NOT EXISTS public.user_sync_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chat_context text NOT NULL CHECK (chat_context IN ('apothecary', 'ayurveda')),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sync_chat_user_ctx_created
  ON public.user_sync_chat_messages (user_id, chat_context, created_at ASC);

ALTER TABLE public.user_sync_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own sync chat rows"
  ON public.user_sync_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sync chat rows"
  ON public.user_sync_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sync chat rows"
  ON public.user_sync_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_sync_chat_messages IS 'Bhakti-algorithm synced turns per user (apothecary | ayurveda); not community chat_messages.';
