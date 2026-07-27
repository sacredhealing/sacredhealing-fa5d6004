-- ============================================================================
-- KRIYA YOGA (new "holy channel" for Kriya Yoga teachings)
-- Identical structure to siddha_lab_entries and siddha_masters_entries.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kriya_yoga_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tier_required text NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  transmitter text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kriya_yoga_category ON public.kriya_yoga_entries(category);
CREATE INDEX IF NOT EXISTS idx_kriya_yoga_created_at ON public.kriya_yoga_entries(created_at DESC);

ALTER TABLE public.kriya_yoga_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kriya_yoga_select_all" ON public.kriya_yoga_entries;
CREATE POLICY "kriya_yoga_select_all"
  ON public.kriya_yoga_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kriya_yoga_admin_write" ON public.kriya_yoga_entries;
CREATE POLICY "kriya_yoga_admin_write"
  ON public.kriya_yoga_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kriya_yoga_entries TO authenticated;
