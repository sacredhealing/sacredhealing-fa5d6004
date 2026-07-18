-- Extends the email_batch_queue system (built for lakshmi-friday) to also
-- support weekly-alignment-email, which needs two extra things per run:
-- (1) per-user metadata beyond just email/name — segment, activity stats,
--     nadi baseline, etc. — needed to rebuild each user's personalized
--     email at drain time; (2) one shared "run meta" blob (the week's
--     Gemini-generated personal opening, new-content digest, sender
--     identity) computed once at enqueue and reused by every drain call,
--     rather than regenerating it — and re-calling Gemini — on every batch.

ALTER TABLE public.email_batch_queue
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.email_run_meta (
  email_type TEXT NOT NULL,
  run_key    TEXT NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (email_type, run_key)
);

ALTER TABLE public.email_run_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access email_run_meta" ON public.email_run_meta;
CREATE POLICY "Service role full access email_run_meta" ON public.email_run_meta
  FOR ALL USING (true);
