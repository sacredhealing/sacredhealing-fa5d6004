## Goal

Switch the Monday `weekly-alignment-email` GitHub workflow from anon-key auth to `CRON_SECRET` bearer auth, so it matches what the deployed function already validates and stops getting rejected by the gateway.

## Current state (verified this turn)

- `supabase/functions/weekly-alignment-email/index.ts` lines 158–167 already contain the check:
  ```ts
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) return 401;
  }
  ```
  So the function is ready — it just needs the caller to send `Authorization: Bearer <CRON_SECRET>`.
- `CRON_SECRET` is confirmed present in the backend secrets (used today by the SHREEM stop-loss cron per `supabase/SHREEM_STOPLOSS_CRON.sql`). We reuse the existing value — no rotation.
- Current `.github/workflows/monday-weekly-email.yml` sends `Authorization: Bearer $LOVABLE_SUPABASE_ANON_KEY` and `apikey: $LOVABLE_SUPABASE_ANON_KEY`.

## What you do (one manual step)

1. Open **View Backend → Edge Functions → Manage secrets**, reveal `CRON_SECRET`, copy the value.
2. In GitHub → repo **Settings → Secrets and variables → Actions**, add a new secret named `CRON_SECRET` with that value. (You can paste it into chat and I'll wire it, or add it directly in GitHub — either works.)

## What I change (one file, build mode)

Edit `.github/workflows/monday-weekly-email.yml`:

- Add `CRON_SECRET: ${{ secrets.CRON_SECRET }}` to the step's `env`.
- Replace the `Authorization` header with `Authorization: Bearer ${CRON_SECRET}`.
- Keep the `apikey: ${SUPABASE_KEY}` header (the gateway still expects an apikey; only the bearer identity changes).
- Leave `LOVABLE_SUPABASE_URL` / `LOVABLE_SUPABASE_ANON_KEY` in place for the `apikey` header and URL.

Result: the request satisfies the gateway (valid `apikey`) AND satisfies the function's `CRON_SECRET` check (valid `Authorization: Bearer`). No function code change, no secret rotation, no impact on the SHREEM stop-loss cron.

## Verification after the change

- Trigger the workflow manually (`workflow_dispatch`).
- I'll tail `weekly-alignment-email` edge logs and confirm the handler actually runs (boot + real log lines, not just `shutdown`) and returns 2xx with either `sent > 0` or a legitimate `skipped` payload.
- If it still 401s, the failure is now definitively at the gateway `verify_jwt` layer (not the function), and we go back to the manual dashboard toggle for `weekly-alignment-email`.

## Not doing

- Not rotating `CRON_SECRET` (would break SHREEM stop-loss trading cron).
- Not editing the edge function (check already exists).
- Not touching `supabase/config.toml` again.