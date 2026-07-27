-- ============================================================================
-- SIDDHA LAB (formerly "Bhakti Algorithm Lab" channel slot)
-- Category-grouped deep teachings (e.g. "Levitation", "Creation of the
-- World") — new entries under an existing category name automatically
-- group together, exactly like Bhagavad Gita's chapter structure but for
-- open-ended topics instead of fixed chapters/verses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.siddha_lab_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,          -- e.g. 'levitation' — new posts under the same category group together
  title text NOT NULL,
  content text NOT NULL,           -- always authored in English; other languages are translated on-demand
  tier_required text NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  transmitter text,                -- who's sharing it, e.g. "Shiva Siddhananda"
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_siddha_lab_category ON public.siddha_lab_entries(category);
CREATE INDEX IF NOT EXISTS idx_siddha_lab_created_at ON public.siddha_lab_entries(created_at DESC);

ALTER TABLE public.siddha_lab_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can SELECT (locked/teaser display for tiers they don't have is
-- handled client-side, same pattern as Content Vault cards) — only admins
-- can write, same pattern as content_vault_admin_write.
DROP POLICY IF EXISTS "siddha_lab_select_all" ON public.siddha_lab_entries;
CREATE POLICY "siddha_lab_select_all"
  ON public.siddha_lab_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "siddha_lab_admin_write" ON public.siddha_lab_entries;
CREATE POLICY "siddha_lab_admin_write"
  ON public.siddha_lab_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.siddha_lab_entries TO authenticated;
