
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='shreem_brzee_signals' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shreem_brzee_signals', pol.policyname);
  END LOOP;
END $$;

REVOKE SELECT ON public.shreem_brzee_signals FROM anon;
GRANT SELECT ON public.shreem_brzee_signals TO authenticated;
GRANT ALL ON public.shreem_brzee_signals TO service_role;

ALTER TABLE public.shreem_brzee_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read signals"
  ON public.shreem_brzee_signals
  FOR SELECT
  TO authenticated
  USING (true);
