DROP POLICY IF EXISTS "live trades readable by all" ON public.shreem_brzee_live_trades;
CREATE POLICY "live trades readable by authenticated" ON public.shreem_brzee_live_trades FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.shreem_brzee_live_trades FROM anon;