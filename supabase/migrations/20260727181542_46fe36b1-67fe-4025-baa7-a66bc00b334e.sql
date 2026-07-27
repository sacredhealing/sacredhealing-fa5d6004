CREATE TABLE IF NOT EXISTS public.siddha_masters_entries (
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.siddha_masters_entries TO authenticated;
GRANT SELECT ON public.siddha_masters_entries TO anon;
GRANT ALL ON public.siddha_masters_entries TO service_role;

CREATE INDEX IF NOT EXISTS idx_siddha_masters_category ON public.siddha_masters_entries(category);
CREATE INDEX IF NOT EXISTS idx_siddha_masters_created_at ON public.siddha_masters_entries(created_at DESC);

ALTER TABLE public.siddha_masters_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "siddha_masters_select_all" ON public.siddha_masters_entries;
CREATE POLICY "siddha_masters_select_all"
  ON public.siddha_masters_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "siddha_masters_admin_write" ON public.siddha_masters_entries;
CREATE POLICY "siddha_masters_admin_write"
  ON public.siddha_masters_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_siddha_masters_updated_at ON public.siddha_masters_entries;
CREATE TRIGGER update_siddha_masters_updated_at
  BEFORE UPDATE ON public.siddha_masters_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();