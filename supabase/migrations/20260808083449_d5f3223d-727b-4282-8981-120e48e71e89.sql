ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_support_resolved boolean NOT NULL DEFAULT false;