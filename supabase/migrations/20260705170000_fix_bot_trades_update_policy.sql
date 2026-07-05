-- ═══════════════════════════════════════════════════════════════
-- Delta-Arb Bot: fix bot_trades UPDATE policy
-- Problem: migration 20260610000000 fixed SELECT and INSERT policies for
-- anon/no-auth bots (Railway/Hetzner delta-arb, user_id nullable), but never
-- fixed UPDATE. The original "bot_trades_update_own" policy still requires
-- auth.uid() = user_id, which can never match for delta-arb's rows since
-- user_id is NULL there. Every closeTrade() PATCH call has been failing
-- since this table was shared with delta-arb.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "bot_trades_update_own" ON public.bot_trades;

CREATE POLICY "bot_update_all"
  ON public.bot_trades FOR UPDATE
  USING (true)
  WITH CHECK (true);
