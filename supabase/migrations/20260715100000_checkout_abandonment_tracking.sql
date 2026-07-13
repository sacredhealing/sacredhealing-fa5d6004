-- Checkout abandonment recovery — Stripe's own checkout.session.expired
-- event only fires 24h after a session is created, which is too late for
-- effective recovery (best practice is 1-3 hours while intent is warm).
-- So: log intent the moment a checkout session is CREATED, mark it
-- recovered the moment stripe-webhook sees checkout.session.completed for
-- that session, and a scheduled function catches anything still
-- unrecovered after 90 minutes and sends one recovery email.

CREATE TABLE IF NOT EXISTS public.checkout_abandonment_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT NOT NULL UNIQUE,
  session_url       TEXT,
  user_id           UUID,
  email             TEXT NOT NULL,
  tier_slug         TEXT NOT NULL,
  display_name      TEXT,
  price_label       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  recovered_at      TIMESTAMPTZ,
  recovery_email_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_abandonment_pending
  ON public.checkout_abandonment_log (created_at)
  WHERE recovered_at IS NULL AND recovery_email_sent_at IS NULL;

ALTER TABLE public.checkout_abandonment_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access checkout_abandonment_log" ON public.checkout_abandonment_log;
CREATE POLICY "Admin full access checkout_abandonment_log" ON public.checkout_abandonment_log
  FOR ALL USING (public.is_admin_v3());

DROP POLICY IF EXISTS "Service role full access checkout_abandonment_log" ON public.checkout_abandonment_log;
CREATE POLICY "Service role full access checkout_abandonment_log" ON public.checkout_abandonment_log
  FOR ALL USING (true);

SELECT cron.schedule(
  'checkout-abandonment-recovery',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/checkout-abandonment-recovery',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
