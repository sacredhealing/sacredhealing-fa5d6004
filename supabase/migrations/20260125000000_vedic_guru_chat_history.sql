-- ============================================
-- Vedic Guru Chat History
-- ============================================
-- Persists conversation so the Guru remembers previous talks

CREATE TABLE IF NOT EXISTS public.vedic_guru_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast fetch by user
CREATE INDEX IF NOT EXISTS idx_vedic_guru_chat_user_id 
  ON public.vedic_guru_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_vedic_guru_chat_created_at 
  ON public.vedic_guru_chat_messages(user_id, created_at);

-- RLS
ALTER TABLE public.vedic_guru_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vedic guru messages" 
  ON public.vedic_guru_chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vedic guru messages" 
  ON public.vedic_guru_chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.vedic_guru_chat_messages IS 'Chat history for Vedic Guru consultations - enables guru to remember past conversations';
