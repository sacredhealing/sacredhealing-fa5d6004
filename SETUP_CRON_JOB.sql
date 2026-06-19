-- ============================================================
-- SETUP pg_cron FOR SHREEM BRZEE BOT
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Enable pg_cron (may already be enabled in Lovable)
-- If this fails, go to Supabase Dashboard → Database → Extensions → enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Remove any existing job
SELECT cron.unschedule('shreem-brzee-cron') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'shreem-brzee-cron'
);

-- Step 3: Create the 5-minute cron job
SELECT cron.schedule(
  'shreem-brzee-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook/cron',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS result;
  $$
);

-- Step 4: Verify it was created
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'shreem-brzee-cron';

-- You should see: shreem-brzee-cron | */5 * * * * | true | <id>
