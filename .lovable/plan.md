Apply the weekly-alignment queue extension and redeploy the function.

## What we will do

1. **Verify the migration** `supabase/migrations/20260718210000_email_queue_extend_for_weekly.sql`.
   - It adds a `payload` JSONB column to `public.email_batch_queue` and creates a new `public.email_run_meta` table for shared run metadata (week content, Gemini-generated copy, sender identity).

2. **Add the missing GRANT** for the new table.
   - `public.email_run_meta` is created by the migration but has no Data API grant. The `weekly-alignment-email` edge function uses a service-role Supabase client, so we need:
     ```sql
     GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_run_meta TO service_role;
     ```
   - Without this, PostgREST calls from the function will hit a permission error.

3. **Apply the migration** via the Supabase migration tool.

4. **Redeploy the `weekly-alignment-email` edge function** so the new queue/enqueue/drain code goes live.

## Outcome

`weekly-alignment-email` will use the same scalable `email_batch_queue` + `claim_email_batch` pattern as `lakshmi-friday`, avoiding timeouts as the user list grows.
