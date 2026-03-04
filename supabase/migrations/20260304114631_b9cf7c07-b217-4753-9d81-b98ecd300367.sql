
CREATE TABLE public.life_book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chapter_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'SQI Transmission',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.life_book_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chapters"
  ON public.life_book_chapters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all chapters"
  ON public.life_book_chapters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_life_book_chapters_user ON public.life_book_chapters(user_id);
