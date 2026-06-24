SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'shreem-brzee-cron';

SELECT cron.schedule(
  'shreem-brzee-cron',
  '* * * * *',
  $$SELECT net.http_get(
    url := 'https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook/cron'
  ) AS result;$$
);

SELECT jobid, jobname, schedule, command, nodename, nodeport, database, username, active, jobname IS NOT NULL AS ok
FROM cron.job 
WHERE jobname = 'shreem-brzee-cron';