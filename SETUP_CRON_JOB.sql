-- ============================================================
-- SETUP SUPABASE CRON JOB — checks stop-loss + 48h cap every 5 min
-- Run in Supabase SQL Editor ONCE
-- ============================================================

-- Enable pg_cron extension (if not already enabled)
-- Do this in Supabase Dashboard → Database → Extensions → enable pg_cron

-- Schedule the cron job
SELECT cron.schedule(
  'shreem-brzee-cron',           -- job name
  '*/5 * * * *',                  -- every 5 minutes
  $$
  SELECT net.http_get(
    url := 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook/cron'
  ) AS result;
  $$
);

-- Verify it was created
SELECT jobid, schedule, command, nodename, active
FROM cron.job
WHERE jobname = 'shreem-brzee-cron';

-- To check cron job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'shreem-brzee-cron') ORDER BY start_time DESC LIMIT 20;

-- To remove the cron job if needed:
-- SELECT cron.unschedule('shreem-brzee-cron');
