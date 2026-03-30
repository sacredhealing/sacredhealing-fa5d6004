# Deploy weekly alignment email (Supabase)

## 1. SQL — tables

Run **`DEPLOY_TRACKING.sql`** in Supabase Dashboard → SQL Editor (creates `user_activity_log`, `user_weekly_email_log`).

## 2. Edge function

```bash
supabase functions deploy weekly-alignment-email
```

## 3. Secrets (Dashboard → Edge Functions → weekly-alignment-email)

| Secret | Example |
|--------|---------|
| `RESEND_API_KEY` | re_... |
| `APP_URL` | `https://yourdomain.com` |
| `FROM_EMAIL` | `Sacred Healing <hello@yourdomain.com>` |
| `CRON_SECRET` | long random string |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically when deployed via Supabase CLI.

## 4. pg_cron + pg_net

Enable extensions **pg_cron** and **pg_net** (Database → Extensions). Then run in SQL Editor (replace placeholders):

```sql
select cron.schedule(
  'weekly-alignment-email',
  '0 9 * * 1',  -- Monday 09:00 UTC
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-alignment-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

To remove the job later: `select cron.unschedule('weekly-alignment-email');`

## 5. Verify

Invoke once from SQL or curl with `Authorization: Bearer <CRON_SECRET>`. Check Edge Function logs and `user_weekly_email_log` rows.
