-- Life Book chapters per user, categorized by SQI responses
CREATE TABLE IF NOT EXISTS public.life_book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_type TEXT NOT NULL,
  title TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_life_book_user_type
  ON public.life_book_chapters(user_id, chapter_type);

CREATE INDEX IF NOT EXISTS idx_life_book_user_type_sort
  ON public.life_book_chapters(user_id, chapter_type, sort_order ASC);

ALTER TABLE public.life_book_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own life book"
  ON public.life_book_chapters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life book chapters"
  ON public.life_book_chapters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life book chapters"
  ON public.life_book_chapters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage life book"
  ON public.life_book_chapters FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.life_book_chapters IS 'Structured Life Book chapters derived from SQI chat responses.';

