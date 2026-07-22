CREATE TABLE IF NOT EXISTS public.bhagavad_gita_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter integer NOT NULL CHECK (chapter >= 1 AND chapter <= 18),
  verse_number integer NOT NULL CHECK (verse_number >= 1),
  sanskrit text,
  transliteration text,
  translation text NOT NULL,
  commentary text,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  transmitted_by text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'sv', 'no', 'es')),
  UNIQUE (chapter, verse_number, language)
);

GRANT SELECT ON public.bhagavad_gita_verses TO anon, authenticated;
GRANT ALL ON public.bhagavad_gita_verses TO service_role;

CREATE INDEX IF NOT EXISTS idx_gita_verses_chapter_verse
  ON public.bhagavad_gita_verses (chapter, verse_number);

ALTER TABLE public.bhagavad_gita_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gita_verses_select_by_tier ON public.bhagavad_gita_verses;
CREATE POLICY gita_verses_select_by_tier
ON public.bhagavad_gita_verses
FOR SELECT
USING (
  is_published = true
  AND (
    public.tier_name_to_level(tier_required) = 0
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() IS NOT NULL AND public.current_user_tier_level() >= public.tier_name_to_level(tier_required))
  )
);

DROP POLICY IF EXISTS gita_verses_admin_write ON public.bhagavad_gita_verses;
CREATE POLICY gita_verses_admin_write
ON public.bhagavad_gita_verses
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_gita_verse_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_gita_verse ON public.bhagavad_gita_verses;
CREATE TRIGGER trg_touch_gita_verse
BEFORE UPDATE ON public.bhagavad_gita_verses
FOR EACH ROW EXECUTE FUNCTION public.touch_gita_verse_updated_at();