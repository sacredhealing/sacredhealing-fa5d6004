-- Bhagavad Gita verses: support who is transmitting each verse's teaching,
-- and which of the 4 supported app languages (en/sv/no/es) it's written in.
-- One (chapter, verse, language) can now have its own transmitted teaching.

ALTER TABLE public.bhagavad_gita_verses
  ADD COLUMN IF NOT EXISTS transmitted_by text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'sv', 'no', 'es'));

-- Replace the old (chapter, verse_number) uniqueness with
-- (chapter, verse_number, language) so each language is its own entry.
ALTER TABLE public.bhagavad_gita_verses DROP CONSTRAINT IF EXISTS bhagavad_gita_verses_chapter_verse_number_key;
ALTER TABLE public.bhagavad_gita_verses ADD CONSTRAINT bhagavad_gita_verses_chapter_verse_lang_key
  UNIQUE (chapter, verse_number, language);
