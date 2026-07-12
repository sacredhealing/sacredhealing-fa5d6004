
CREATE TABLE IF NOT EXISTS public.qr_pairing_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_qr_pairing_status
  ON public.qr_pairing_tokens(status, expires_at);

GRANT ALL ON public.qr_pairing_tokens TO service_role;

ALTER TABLE public.qr_pairing_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.qr_pairing_tokens;
CREATE POLICY "Service role only" ON public.qr_pairing_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.cleanup_qr_pairing_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.qr_pairing_tokens WHERE expires_at < now() - interval '30 minutes';
$$;
