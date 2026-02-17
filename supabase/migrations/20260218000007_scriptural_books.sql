-- ============================================================
-- Siddha-Scribe: Automated Scriptural Book Engine
-- ============================================================
-- Tables for storing book drafts, chapters, verses, and transcriptions

-- 1) Scriptural Books Table
CREATE TABLE IF NOT EXISTS public.scriptural_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'published')),
  audio_url text,
  transcription_url text,
  total_chapters integer DEFAULT 0,
  total_verses integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Book Chapters Table
CREATE TABLE IF NOT EXISTS public.book_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.scriptural_books(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text,
  theme text,
  summary text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of segments (TEACHING/VERSE)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

-- 3) Sanskrit Verses Table (for caching translations)
CREATE TABLE IF NOT EXISTS public.sanskrit_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_text_devanagari text NOT NULL,
  verse_text_iast text,
  verse_text_roman text,
  translation text,
  padapatha text, -- Word-for-word breakdown
  source text, -- e.g., "Bhagavad Gita 2.47"
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(verse_text_iast) -- Prevent duplicates
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scriptural_books_author ON public.scriptural_books(author_id);
CREATE INDEX IF NOT EXISTS idx_scriptural_books_status ON public.scriptural_books(status);
CREATE INDEX IF NOT EXISTS idx_book_chapters_book ON public.book_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_sanskrit_verses_iast ON public.sanskrit_verses(verse_text_iast);

-- Enable RLS
ALTER TABLE public.scriptural_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanskrit_verses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own books"
  ON public.scriptural_books FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create own books"
  ON public.scriptural_books FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own books"
  ON public.scriptural_books FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can view all books"
  ON public.scriptural_books FOR SELECT
  USING (public.check_is_master_admin() OR public.fn_admin_master_check());

CREATE POLICY "Admins can manage all books"
  ON public.scriptural_books FOR ALL
  USING (public.check_is_master_admin() OR public.fn_admin_master_check())
  WITH CHECK (public.check_is_master_admin() OR public.fn_admin_master_check());

CREATE POLICY "Users can view chapters of own books"
  ON public.book_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scriptural_books b
      WHERE b.id = book_chapters.book_id AND b.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage chapters of own books"
  ON public.book_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scriptural_books b
      WHERE b.id = book_chapters.book_id AND b.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scriptural_books b
      WHERE b.id = book_chapters.book_id AND b.author_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view Sanskrit verses"
  ON public.sanskrit_verses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage Sanskrit verses"
  ON public.sanskrit_verses FOR ALL
  USING (public.check_is_master_admin() OR public.fn_admin_master_check())
  WITH CHECK (public.check_is_master_admin() OR public.fn_admin_master_check());
