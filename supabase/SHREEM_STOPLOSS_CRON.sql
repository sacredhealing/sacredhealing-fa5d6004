-- SHREEM BRZEE — Server-side stop-loss cron
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- Requires: pg_cron + pg_net enabled under Database → Extensions
--
-- Auth: uses CRON_SECRET — a short random string you store in two places:
--   1. Supabase secrets (Dashboard → Edge Functions → Secrets): key=CRON_SECRET, value=<your_secret>
--   2. This SQL below — paste the same value in the header
--
-- Generate a secret: any random string, e.g. "shreem-cron-2026-xyz"
-- Set it in Supabase secrets FIRST, then run this SQL.

-- Remove old job if exists
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'shreem-stoploss-cron';

-- Schedule 5-minute server-side stop-loss + 48h timeout check
-- Replace PASTE_YOUR_CRON_SECRET_HERE with the value you set in Supabase secrets
SELECT cron.schedule(
  'shreem-stoploss-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-live-executor/cron-stoploss',
    headers := '{"Authorization":"Bearer PASTE_YOUR_CRON_SECRET_HERE"}'::jsonb
  );
  $$
);

-- Verify
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'shreem-stoploss-cron';
