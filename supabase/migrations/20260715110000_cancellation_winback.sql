-- Win-back sequence for cancelled members. The immediate cancellation
-- confirmation email already exists (stripe-webhook, sendCancellationEmail)
-- — this builds what's actually missing: a delayed follow-up sequence
-- after they've had time to actually feel the loss of access, not just
-- get a receipt-style confirmation.
--
-- Two stages, timed from ACCESS END (currentPeriodEnd), not cancellation
-- date — someone who cancels still has access until the period ends, so
-- emailing them "we miss you" while they still have the app open makes no
-- sense.
--   Stage 1 — 7 days after access ends: warm check-in, one real teaching
--     (reuses the existing email_teachings pool), simple resubscribe link
--   Stage 2 — 30 days after access ends: what's new since they left,
--     resubscribe link

CREATE TABLE IF NOT EXISTS public.cancellation_winback_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  email             TEXT NOT NULL,
  tier_slug         TEXT NOT NULL,
  access_until      TIMESTAMPTZ NOT NULL,
  cancelled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resubscribed_at   TIMESTAMPTZ,
  stage1_sent_at    TIMESTAMPTZ,
  stage2_sent_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_winback_pending
  ON public.cancellation_winback_log (access_until)
  WHERE resubscribed_at IS NULL;

ALTER TABLE public.cancellation_winback_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access cancellation_winback_log" ON public.cancellation_winback_log;
CREATE POLICY "Admin full access cancellation_winback_log" ON public.cancellation_winback_log
  FOR ALL USING (public.is_admin_v3());

DROP POLICY IF EXISTS "Service role full access cancellation_winback_log" ON public.cancellation_winback_log;
CREATE POLICY "Service role full access cancellation_winback_log" ON public.cancellation_winback_log
  FOR ALL USING (true);

SELECT cron.schedule(
  'cancellation-winback',
  '0 10 * * *', -- once daily, 10 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/cancellation-winback',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
