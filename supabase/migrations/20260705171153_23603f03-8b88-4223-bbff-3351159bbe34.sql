DROP POLICY IF EXISTS "bot_trades_update_own" ON public.bot_trades;

CREATE POLICY "bot_update_all"
  ON public.bot_trades FOR UPDATE
  USING (true)
  WITH CHECK (true);