
-- Lock down shreem_brzee_paper_trades writes (remove permissive authenticated ALL)
DROP POLICY IF EXISTS shreem_trades_auth_write ON public.shreem_brzee_paper_trades;
DROP POLICY IF EXISTS shreem_trades_public_read ON public.shreem_brzee_paper_trades;

CREATE POLICY shreem_trades_admin_write
  ON public.shreem_brzee_paper_trades
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY shreem_trades_auth_read
  ON public.shreem_brzee_paper_trades
  FOR SELECT
  TO authenticated
  USING (true);

-- Lock down shreem_brzee_session writes
DROP POLICY IF EXISTS shreem_session_auth_write ON public.shreem_brzee_session;
DROP POLICY IF EXISTS shreem_session_public_read ON public.shreem_brzee_session;

CREATE POLICY shreem_session_admin_write
  ON public.shreem_brzee_session
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY shreem_session_auth_read
  ON public.shreem_brzee_session
  FOR SELECT
  TO authenticated
  USING (true);

-- Revoke anon access so anonymous realtime subscribers cannot receive rows
REVOKE ALL ON public.shreem_brzee_paper_trades FROM anon;
REVOKE ALL ON public.shreem_brzee_session FROM anon;
GRANT SELECT ON public.shreem_brzee_paper_trades TO authenticated;
GRANT SELECT ON public.shreem_brzee_session TO authenticated;
GRANT ALL ON public.shreem_brzee_paper_trades TO service_role;
GRANT ALL ON public.shreem_brzee_session TO service_role;
