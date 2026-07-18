CREATE TABLE IF NOT EXISTS public.email_batch_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type  TEXT NOT NULL,
  run_key     TEXT NOT NULL,
  user_id     UUID NOT NULL,
  email       TEXT NOT NULL,
  first_name  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email_type, run_key, user_id)
);

GRANT ALL ON public.email_batch_queue TO service_role;

CREATE INDEX IF NOT EXISTS idx_email_batch_queue_claim
  ON public.email_batch_queue (email_type, run_key, status);

ALTER TABLE public.email_batch_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access email_batch_queue" ON public.email_batch_queue;
CREATE POLICY "Service role full access email_batch_queue" ON public.email_batch_queue
  FOR ALL USING (true);

CREATE OR REPLACE FUNCTION public.claim_email_batch(
  p_email_type TEXT,
  p_run_key TEXT,
  p_limit INT DEFAULT 150
)
RETURNS SETOF public.email_batch_queue
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_batch_queue q
  SET status = 'processing', updated_at = now()
  WHERE q.id IN (
    SELECT id FROM public.email_batch_queue
    WHERE email_type = p_email_type
      AND run_key = p_run_key
      AND status = 'pending'
    ORDER BY created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_email_batch_queue()
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM public.email_batch_queue WHERE created_at < now() - interval '14 days';
$$;