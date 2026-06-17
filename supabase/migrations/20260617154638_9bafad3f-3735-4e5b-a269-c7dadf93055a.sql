
-- Re-enable RLS with permissive policies (public on-chain data)
ALTER TABLE public.shreem_brzee_signals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shreem_brzee_session      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shreem_brzee_paper_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shreem_signals_all" ON public.shreem_brzee_signals;
CREATE POLICY "shreem_signals_all" ON public.shreem_brzee_signals
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "shreem_session_all" ON public.shreem_brzee_session;
CREATE POLICY "shreem_session_all" ON public.shreem_brzee_session
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "shreem_paper_trades_all" ON public.shreem_brzee_paper_trades;
CREATE POLICY "shreem_paper_trades_all" ON public.shreem_brzee_paper_trades
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
