-- ============================================================================
-- AKASHIC CODEX & LIVING PORTRAIT CODEX
-- SQI 2050 Sovereign Book Architecture
-- Migration: 20260428000001_akashic_codex
-- ============================================================================
-- ZERO-TOUCH: Pure additive layer. Apothecary, classifier, SQI logic untouched.
-- Admin-only via RLS. Image generation, weaving, auto-merge clustering ready.
-- ============================================================================

-- pgvector for semantic clustering & paragraph-level weaving
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 1. TRANSMISSION BLOCKS — Immutable verbatim source layer
-- ----------------------------------------------------------------------------
-- Every SQI response stored verbatim. Never altered, never deleted.
-- The sacred-source layer the entire Codex is built on.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transmission_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'apothecary'
    CHECK (source_type IN ('apothecary','manual_paste','file_upload','voice_memo','backfill')),
  source_message_id uuid,                   -- ref to apothecary message id (when source_type = 'apothecary')
  source_chat_id uuid,                      -- ref to apothecary thread id  (when source_type = 'apothecary')
  source_metadata jsonb DEFAULT '{}'::jsonb,-- filename, original_date, language, paste_title, etc
  user_prompt text,                         -- the question / title that triggered the transmission
  raw_content text NOT NULL,                -- verbatim transmission, never altered
  original_date timestamptz,                -- user-supplied original date (for back-dated pastes)
  codex_target text NOT NULL CHECK (codex_target IN ('akasha', 'portrait', 'split', 'excluded')),
  routing_override text CHECK (routing_override IN ('auto','force_akasha','force_portrait')) DEFAULT 'auto',
  topic_primary text,                       -- e.g. 'Human History'
  topic_sub text,                           -- e.g. 'Pre-Vedic Civilizations'
  embedding vector(3072),                   -- gemini-embedding-001 default dim
  classified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transmission_user        ON public.transmission_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_transmission_target      ON public.transmission_blocks(codex_target);
CREATE INDEX IF NOT EXISTS idx_transmission_source_type ON public.transmission_blocks(source_type);
CREATE INDEX IF NOT EXISTS idx_transmission_created     ON public.transmission_blocks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transmission_source_msg  ON public.transmission_blocks(source_message_id);
CREATE INDEX IF NOT EXISTS idx_transmission_embedding   ON public.transmission_blocks
  USING hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 2. CODEX CHAPTERS — Living, woven chapters with vibrational images
-- ----------------------------------------------------------------------------
-- Self-referential parent_id allows unlimited-depth auto-merge clustering.
-- Bob Marley + Tupac → "Musician Avataric Blueprints" → "Avataric Blueprints in the Arts".
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codex_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codex_type text NOT NULL CHECK (codex_type IN ('akasha', 'portrait')),
  parent_id uuid REFERENCES public.codex_chapters(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,

  -- Bestseller architecture (the connective tissue around verbatim transmissions)
  opening_hook text,                        -- chapter opener
  prose_woven text,                         -- transmissions + connective prose
  closing_reflection text,                  -- closer that seeds next chapter

  -- Sacred geometry image — Prema-Pulse vibrational match
  image_url text,                           -- supabase storage public url
  image_prompt text,                        -- the generated Imagen prompt
  image_storage_path text,                  -- e.g. codex-images/<chapter_id>.png
  image_generated_at timestamptz,
  image_generation_count integer DEFAULT 0,

  -- Semantic + structural
  embedding vector(3072),
  order_index integer DEFAULT 0,
  depth integer DEFAULT 0,
  version integer DEFAULT 1,

  -- Auto-merge metadata
  is_auto_generated boolean DEFAULT true,
  cluster_strength numeric,                 -- avg cosine sim to parent
  child_count integer DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, codex_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_chapter_user_type   ON public.codex_chapters(user_id, codex_type);
CREATE INDEX IF NOT EXISTS idx_chapter_parent      ON public.codex_chapters(parent_id);
CREATE INDEX IF NOT EXISTS idx_chapter_order       ON public.codex_chapters(user_id, codex_type, order_index);
CREATE INDEX IF NOT EXISTS idx_chapter_embedding   ON public.codex_chapters
  USING hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 3. CHAPTER FRAGMENTS — Lineage of every transmission woven into a chapter
-- ----------------------------------------------------------------------------
-- Every Transmission Block woven into a chapter has a row here. This is the
-- audit trail. Lets us re-weave any chapter from scratch if needed.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codex_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  transmission_id uuid NOT NULL REFERENCES public.transmission_blocks(id) ON DELETE CASCADE,
  position integer NOT NULL,                -- ordering within chapter
  paragraph_anchor text,                    -- short hint of where it lives
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, transmission_id)
);

CREATE INDEX IF NOT EXISTS idx_fragment_chapter      ON public.codex_fragments(chapter_id, position);
CREATE INDEX IF NOT EXISTS idx_fragment_transmission ON public.codex_fragments(transmission_id);

-- ----------------------------------------------------------------------------
-- 4. VERSION HISTORY — Watch any chapter evolve over time
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codex_chapter_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  version integer NOT NULL,
  prose_snapshot text NOT NULL,
  trigger_event text,                       -- 'new_transmission' | 'auto_merge' | 'manual_edit' | 'image_regen'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, version)
);

CREATE INDEX IF NOT EXISTS idx_version_chapter ON public.codex_chapter_versions(chapter_id, version DESC);

-- ----------------------------------------------------------------------------
-- 5. CROSS-REFERENCES — The web of through-lines (page-to-page resonance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codex_cross_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  to_chapter_id uuid NOT NULL REFERENCES public.codex_chapters(id) ON DELETE CASCADE,
  theme text,
  strength numeric,                         -- cosine similarity 0..1
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_chapter_id, to_chapter_id),
  CHECK (from_chapter_id <> to_chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_xref_from ON public.codex_cross_refs(from_chapter_id);
CREATE INDEX IF NOT EXISTS idx_xref_to   ON public.codex_cross_refs(to_chapter_id);

-- ----------------------------------------------------------------------------
-- 6. SETTINGS — per-user codex configuration
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.codex_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_codex_chapters_updated ON public.codex_chapters;
CREATE TRIGGER trg_codex_chapters_updated
  BEFORE UPDATE ON public.codex_chapters
  FOR EACH ROW EXECUTE FUNCTION public.codex_touch_updated_at();

DROP TRIGGER IF EXISTS trg_codex_settings_updated ON public.codex_settings;
CREATE TRIGGER trg_codex_settings_updated
  BEFORE UPDATE ON public.codex_settings
  FOR EACH ROW EXECUTE FUNCTION public.codex_touch_updated_at();

-- ----------------------------------------------------------------------------
-- ADMIN HELPER — single source of truth for codex access
-- ----------------------------------------------------------------------------
-- Codex is admin-only. Uses profiles.is_admin (already exists from your
-- Admin Grant Access page). If a profile row is missing, returns false.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_codex_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = uid),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Only the row's owner OR an admin can read/write. Other users see nothing.
-- ----------------------------------------------------------------------------
ALTER TABLE public.transmission_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_chapters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_fragments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_chapter_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_cross_refs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_settings           ENABLE ROW LEVEL SECURITY;

-- transmission_blocks
DROP POLICY IF EXISTS codex_transmissions_rw ON public.transmission_blocks;
CREATE POLICY codex_transmissions_rw ON public.transmission_blocks
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

-- codex_chapters
DROP POLICY IF EXISTS codex_chapters_rw ON public.codex_chapters;
CREATE POLICY codex_chapters_rw ON public.codex_chapters
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

-- codex_fragments (gated by parent chapter ownership)
DROP POLICY IF EXISTS codex_fragments_rw ON public.codex_fragments;
CREATE POLICY codex_fragments_rw ON public.codex_fragments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  );

-- codex_chapter_versions
DROP POLICY IF EXISTS codex_versions_rw ON public.codex_chapter_versions;
CREATE POLICY codex_versions_rw ON public.codex_chapter_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  );

-- codex_cross_refs
DROP POLICY IF EXISTS codex_xrefs_rw ON public.codex_cross_refs;
CREATE POLICY codex_xrefs_rw ON public.codex_cross_refs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = from_chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.codex_chapters c
      WHERE c.id = from_chapter_id
        AND (c.user_id = auth.uid() OR public.is_codex_admin(auth.uid()))
    )
  );

-- codex_settings
DROP POLICY IF EXISTS codex_settings_rw ON public.codex_settings;
CREATE POLICY codex_settings_rw ON public.codex_settings
  FOR ALL
  USING (auth.uid() = user_id OR public.is_codex_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_codex_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET — sacred geometry chapter images
-- ----------------------------------------------------------------------------
-- Public-read so admin codex pages render fast; admin-only write via RLS below.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('codex-images', 'codex-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — only admins / owners can write to codex-images
DROP POLICY IF EXISTS codex_images_admin_write ON storage.objects;
CREATE POLICY codex_images_admin_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'codex-images'
    AND public.is_codex_admin(auth.uid())
  );

DROP POLICY IF EXISTS codex_images_admin_update ON storage.objects;
CREATE POLICY codex_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'codex-images'
    AND public.is_codex_admin(auth.uid())
  );

DROP POLICY IF EXISTS codex_images_admin_delete ON storage.objects;
CREATE POLICY codex_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'codex-images'
    AND public.is_codex_admin(auth.uid())
  );

-- Public read policy already covered by `public = true` on the bucket.

-- ============================================================================
-- DONE — Akashic & Living Portrait Codex foundation complete
-- ============================================================================
-- Apothecary, classifier, SQI: untouched.
-- Next commit: akasha-codex-curator edge function (classify + weave + image).
-- ============================================================================
