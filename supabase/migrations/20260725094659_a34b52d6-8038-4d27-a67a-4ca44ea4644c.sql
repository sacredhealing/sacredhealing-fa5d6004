-- 1. email_batch_queue: restrict to service_role only
DROP POLICY IF EXISTS "Service role full access email_batch_queue" ON public.email_batch_queue;
CREATE POLICY "Service role full access email_batch_queue"
  ON public.email_batch_queue
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
REVOKE ALL ON public.email_batch_queue FROM anon, authenticated;

-- 2. email_run_meta: restrict to service_role only
DROP POLICY IF EXISTS "Service role full access email_run_meta" ON public.email_run_meta;
CREATE POLICY "Service role full access email_run_meta"
  ON public.email_run_meta
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
REVOKE ALL ON public.email_run_meta FROM anon, authenticated;

-- 3. user_teaching_log: restrict to service_role only
DROP POLICY IF EXISTS "Service role full access user_teaching_log" ON public.user_teaching_log;
CREATE POLICY "Service role full access user_teaching_log"
  ON public.user_teaching_log
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
REVOKE ALL ON public.user_teaching_log FROM anon, authenticated;

-- 4. chat_rooms: restrict INSERT so users cannot self-create premium/locked/path rooms
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
CREATE POLICY "Users can create rooms"
  ON public.chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND COALESCE(is_premium, false) = false
    AND COALESCE(is_locked, false) = false
    AND COALESCE(type, 'community') IN ('community', 'general', 'group', 'dm')
  );

CREATE POLICY "Admins can create any room"
  ON public.chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. user_balances: remove user self-update; balances only mutable by service_role/edge functions
DROP POLICY IF EXISTS "Users can update their own balance" ON public.user_balances;
-- SELECT policy remains so users can still view their balance.
-- INSERT policy remains (initial balance creation on signup via trigger runs as definer).
-- Service role bypasses RLS entirely, so edge functions continue to work.