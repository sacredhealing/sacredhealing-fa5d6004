-- ═══════════════════════════════════════════════════════════════════════
-- SQI 2050 — Heartbeat cron + pulse fields migration
-- Run in BOTH Supabase projects
-- ═══════════════════════════════════════════════════════════════════════

-- The activations jsonb column already has pulse data embedded per item
-- We just need to ensure pg_cron is enabled and schedule the heartbeat

-- Enable pg_cron extension (already enabled on most Supabase projects)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule heartbeat every 4 hours
-- This calls the edge function via HTTP
SELECT cron.schedule(
  'sqi-transmission-heartbeat',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sqi-transmission-heartbeat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify cron job was created
SELECT jobid, schedule, command, jobname
FROM cron.job
WHERE jobname = 'sqi-transmission-heartbeat';
