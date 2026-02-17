-- Schedule weekly motivational email function
-- This runs every Monday at 9 AM UTC

-- Note: pg_cron extension must be enabled in Supabase dashboard
-- Run this in Supabase SQL Editor after enabling pg_cron extension

-- Schedule the weekly motivational email function
SELECT cron.schedule(
  'weekly-motivational-email',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/weekly-motivational-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Alternative: If pg_cron is not available, use Supabase Edge Function cron triggers
-- This can be configured in Supabase Dashboard -> Edge Functions -> weekly-motivational-email -> Cron
