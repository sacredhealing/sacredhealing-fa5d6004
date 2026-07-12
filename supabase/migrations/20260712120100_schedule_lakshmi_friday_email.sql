-- lakshmi-friday exists as a fully built edge function but was never scheduled
-- anywhere (no cron.schedule call in any prior migration). This closes that gap.
-- Runs every Friday at 9 AM UTC.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lakshmi-friday-email') THEN
    PERFORM cron.unschedule('lakshmi-friday-email');
  END IF;
END $$;

SELECT cron.schedule(
  'lakshmi-friday-email',
  '0 9 * * 5', -- Every Friday at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/lakshmi-friday',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
