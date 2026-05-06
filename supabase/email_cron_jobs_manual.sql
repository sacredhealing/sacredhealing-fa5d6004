-- ============================================================
-- SQI CRON — apply manually in Supabase SQL after deploying functions
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY
-- Requires extensions: pg_cron, pg_net
-- ============================================================

-- SELECT cron.unschedule('sqi-weekly-digest');
-- SELECT cron.unschedule('sqi-lakshmi-friday');

SELECT cron.schedule(
  'sqi-weekly-digest',
  '0 12 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-digest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::text
  );
  $$
);

SELECT cron.schedule(
  'sqi-lakshmi-friday',
  '0 9 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/lakshmi-friday',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::text
  );
  $$
);
