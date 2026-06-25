
CREATE TABLE IF NOT EXISTS public.bot_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_secrets TO authenticated;
GRANT ALL ON public.bot_secrets TO service_role;

ALTER TABLE public.bot_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_bot_secrets" ON public.bot_secrets;
CREATE POLICY "admin_all_bot_secrets" ON public.bot_secrets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
