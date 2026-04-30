-- pgvector for semantic clustering & paragraph-level weaving
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. TRANSMISSION BLOCKS
CREATE TABLE IF NOT EXISTS public.transmission_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'apothecary'
    CHECK (source_type IN ('apothecary','manual_paste','file_upload','voice_memo','backfill')),
  source_message_id uuid,
  source_chat_id uuid,
  source_metadata jsonb DEFAULT '{}'::jsonb,
  user_prompt text,
  raw_content text NOT NULL,
  original_date timestamptz,
  codex_target text NOT NULL CHECK (codex_target IN ('akasha', 'portrait', 'split', 'excluded')),
  routing_override text CHECK (routing_override IN ('auto','force_akasha','force_portrait')) DEFAULT 'auto',
  topic_primary text,
  topic_sub text,
  embedding vector(3072),
  classified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transmission_user        ON public.transmission_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_transmission_target      ON public.transmission_blocks(codex_target);
CREATE INDEX IF NOT EXISTS idx_transmission_source_type ON public.transmission_blocks(source_type);
CREATE INDEX IF NOT EXISTS idx_transmission_created     ON public.transmission_blocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmission_source_msg  ON public.transmission_blocks(source_message_id);
-- Note: HNSW supports up to 2000 dims for cosine_ops. 3072 dims cannot be indexed; skip vector index for now.

-- 2. CODEX CHAPTERS
CREATE TABLE IF NOT EXISTS public.codex_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codex_type text NOT NULL CHECK (codex_type IN ('akasha', 'portrait')),
  parent_id uuid REFERENCES public.codex_chapters(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  opening_hook text,
  prose_woven text,
  closing_reflection text,
  image_url text,
  image_prompt text,
  image_storage_path text,
  image_generated_at timestamptz,
  image_generation_count integer DEFAULT 0,
  embedding vector(3072),
  order_index integer DEFAULT 0,
  depth integer DEFAULT 0,
  version integer DEFAULT 1,
  is_auto_generated boolean DEFAULT true,
  cluster_strength numeric,
  child_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, codex_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_chapter_user_type   ON public.codex_chapters(user_id, codex_type);
CREATE INDEX IF NOT EXISTS idx_chapter_parent      ON public.codex_chapters(parent_id);
CREATE INDEX IF NOT EXISTS idx_chapter_order       ON public.codex_chapters(user_id, codex_type, order_index);

-- 3. CHAPTER FRAGMENTS
CREATE TABLE IF NOT EXISTS public.codex_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  transmission_id uuid NOT NULL REFERENCES public.transmission_blocks(id) ON DELETE CASCADE,
  position integer NOT NULL,
  paragraph_anchor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, transmission_id)
);
CREATE INDEX IF NOT EXISTS idx_fragment_chapter      ON public.codex_fragments(chapter_id, position);
CREATE INDEX IF NOT EXISTS idx_fragment_transmission ON public.codex_fragments(transmission_id);

-- 4. VERSION HISTORY
CREATE TABLE IF NOT EXISTS public.codex_chapter_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  version integer NOT NULL,
  prose_snapshot text NOT NULL,
  trigger_event text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, version)
);
CREATE INDEX IF NOT EXISTS idx_version_chapter ON public.codex_chapter_versions(chapter_id, version DESC);

-- 5. CROSS-REFERENCES
CREATE TABLE IF NOT EXISTS public.codex_cross_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  to_chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  theme text,
  strength numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_chapter_id, to_chapter_id),
  CHECK (from_chapter_id <> to_chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_xref_from ON public.codex_cross_refs(from_chapter_id);
CREATE INDEX IF NOT EXISTS idx_xref_to   ON public.codex_cross_refs(to_chapter_id);

-- 6. SETTINGS
CREATE TABLE IF NOT EXISTS public.codex_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  narrator_voice text DEFAULT 'sqi-2050',
  bestseller_intensity text DEFAULT 'restrained' CHECK (bestseller_intensity IN ('minimal','restrained','full')),
  auto_image_generation boolean DEFAULT true,
  auto_merge_threshold numeric DEFAULT 0.80,
  auto_merge_enabled boolean DEFAULT true,
  last_backfill_at timestamptz,
  last_curator_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.codex_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_codex_chapters_updated ON public.codex_chapters;
CREATE TRIGGER trg_codex_chapters_updated
  BEFORE UPDATE ON public.codex_chapters
  FOR EACH ROW EXECUTE FUNCTION public.codex_touch_updated_at();

DROP TRIGGER IF EXISTS trg_codex_settings_updated ON public.codex_settings;
CREATE TRIGGER trg_codex_settings_updated
  BEFORE UPDATE ON public.codex_settings
  FOR EACH ROW EXECUTE FUNCTION public.codex_touch_updated_at();

-- RLS
ALTER TABLE public.transmission_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_chapters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_fragments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_chapter_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_cross_refs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_settings           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS codex_transmissions_rw ON public.transmission_blocks;
CREATE POLICY codex_transmissions_rw ON public.transmission_blocks
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

DROP POLICY IF EXISTS codex_chapters_rw ON public.codex_chapters;
CREATE POLICY codex_chapters_rw ON public.codex_chapters
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

DROP POLICY IF EXISTS codex_fragments_rw ON public.codex_fragments;
CREATE POLICY codex_fragments_rw ON public.codex_fragments
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  );

DROP POLICY IF EXISTS codex_versions_rw ON public.codex_chapter_versions;
CREATE POLICY codex_versions_rw ON public.codex_chapter_versions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  );

DROP POLICY IF EXISTS codex_xrefs_rw ON public.codex_cross_refs;
CREATE POLICY codex_xrefs_rw ON public.codex_cross_refs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = from_chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.codex_chapters c
      WHERE c.id = from_chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid())))
  );

DROP POLICY IF EXISTS codex_settings_rw ON public.codex_settings;
CREATE POLICY codex_settings_rw ON public.codex_settings
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('codex-images', 'codex-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS codex_images_admin_write ON storage.objects;
CREATE POLICY codex_images_admin_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'codex-images' AND public.is_codex_admin(auth.uid()));

DROP POLICY IF EXISTS codex_images_admin_update ON storage.objects;
CREATE POLICY codex_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'codex-images' AND public.is_codex_admin(auth.uid()));

DROP POLICY IF EXISTS codex_images_admin_delete ON storage.objects;
CREATE POLICY codex_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'codex-images' AND public.is_codex_admin(auth.uid()));