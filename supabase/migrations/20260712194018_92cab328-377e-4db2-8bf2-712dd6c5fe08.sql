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
  '0 9 * * 1',
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