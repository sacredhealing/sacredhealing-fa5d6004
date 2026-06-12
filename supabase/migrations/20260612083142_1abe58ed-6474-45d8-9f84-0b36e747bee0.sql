
-- 1) ai_response_cache: restrict SELECT to authenticated users
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.ai_response_cache'::regclass AND polcmd IN ('r','*')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_response_cache', r.polname);
  END LOOP;
END$$;

CREATE POLICY "Authenticated users can read cache"
  ON public.ai_response_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages cache"
  ON public.ai_response_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

REVOKE SELECT ON public.ai_response_cache FROM anon;

-- 2) membership_tiers: keep row policy, but revoke column access to stripe IDs
-- PostgREST will reject queries that select the restricted columns from non-privileged roles.
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;
-- Make sure service_role keeps full access
GRANT SELECT ON public.membership_tiers TO service_role;

-- 3) Replace bypassable current_setting('role') checks with auth.role()
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy WHERE polrelid = 'public.user_weekly_email_log'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_weekly_email_log', r.polname);
  END LOOP;
  FOR r IN
    SELECT polname FROM pg_policy WHERE polrelid = 'public.user_activity_log'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_activity_log', r.polname);
  END LOOP;
END$$;

CREATE POLICY "Service role manages weekly email log"
  ON public.user_weekly_email_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users read own weekly email log"
  ON public.user_weekly_email_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages activity log"
  ON public.user_activity_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users read own activity log"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
