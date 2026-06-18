
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_brzee_session TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_brzee_paper_trades TO authenticated;

DROP POLICY IF EXISTS shreem_session_auth_write ON public.shreem_brzee_session;
CREATE POLICY shreem_session_auth_write ON public.shreem_brzee_session
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS shreem_trades_auth_write ON public.shreem_brzee_paper_trades;
CREATE POLICY shreem_trades_auth_write ON public.shreem_brzee_paper_trades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
