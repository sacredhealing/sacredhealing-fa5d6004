-- Scalable email send queue: instead of one function call trying to process
-- every recipient synchronously (which times out once the list grows past
-- what fits in one request's execution window), each weekly send "enqueues"
-- its full recipient list once, then processes it in bounded chunks across
-- multiple short calls. Works the same at 90 users or 90,000 — only the
-- number of drain calls changes, not the risk of timing out.

CREATE TABLE IF NOT EXISTS public.email_batch_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type  TEXT NOT NULL,              -- 'lakshmi_friday' | 'weekly_alignment'
  run_key     TEXT NOT NULL,              -- e.g. '2026-07-24' — one run per calendar day
  user_id     UUID NOT NULL,
  email       TEXT NOT NULL,
  first_name  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email_type, run_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_batch_queue_claim
  ON public.email_batch_queue (email_type, run_key, status);

ALTER TABLE public.email_batch_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access email_batch_queue" ON public.email_batch_queue;
CREATE POLICY "Service role full access email_batch_queue" ON public.email_batch_queue
  FOR ALL USING (true);

-- Atomically claim up to p_limit pending rows for a run and mark them
-- 'processing', so two overlapping drain calls can never double-send the
-- same user. Uses SKIP LOCKED so concurrent callers never block each other.
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

-- Cleanup: queue rows older than 14 days are just historical noise at this point.
CREATE OR REPLACE FUNCTION public.cleanup_old_email_batch_queue()
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM public.email_batch_queue WHERE created_at < now() - interval '14 days';
$$;
