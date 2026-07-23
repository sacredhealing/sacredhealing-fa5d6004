-- Content Vault drop cards in chat: link a chat_messages row to a content_vault item.
-- Additive only, IF NOT EXISTS guards — safe to run regardless of current chat_messages state.

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.content_vault(id) ON DELETE SET NULL;

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
