-- SHREEM BRZEE — Server-side stop-loss cron (run in Supabase SQL Editor)
-- Requires: pg_cron + pg_net enabled in Supabase Dashboard → Extensions
-- This calls shreem-live-executor/cron-stoploss every 5 min
-- Runs even when Hetzner is down — true server-side fallback

-- Remove old shreem cron if exists
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'shreem-stoploss-cron';

-- Schedule new 5-minute stop-loss check
SELECT cron.schedule(
  'shreem-stoploss-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor/cron-stoploss',
    headers := '{"Authorization":"Bearer SERVICE_ROLE_KEY_HERE"}'::jsonb
  );
  $$
);

-- Verify it's active
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'shreem-stoploss-cron';
