-- Monday email fix: weekly-alignment-email (AI-personalized, signed
-- individually by Kritagya Das or Karaveera Nivasini Dasi, behavior-
-- segmented) is the function actually promised in the welcome email as
-- the "Monday Alignment Transmission." It was never scheduled. The
-- simpler weekly-motivational-email WAS scheduled for Monday instead.
-- This swaps the Monday cron to the correct function and retires the
-- old one and the unused weekly-digest to avoid ever double-sending.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-motivational-email') THEN
    PERFORM cron.unschedule('weekly-motivational-email');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-digest-email') THEN
    PERFORM cron.unschedule('weekly-digest-email');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monday-alignment-email') THEN
    PERFORM cron.unschedule('monday-alignment-email');
  END IF;
END $$;

SELECT cron.schedule(
  'monday-alignment-email',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/weekly-alignment-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
