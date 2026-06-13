
-- 1. Restrict sniper_trades SELECT to owner only
DROP POLICY IF EXISTS "Authenticated read sniper_trades" ON public.sniper_trades;
CREATE POLICY "Users read own sniper_trades"
  ON public.sniper_trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Remove sensitive tables from realtime publication (none of the client code subscribes to them)
ALTER PUBLICATION supabase_realtime DROP TABLE public.nadi_baselines;
ALTER PUBLICATION supabase_realtime DROP TABLE public.security_events;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_balances;

-- 3. Hide Polymarket API credentials from client roles (only service_role can read them)
REVOKE SELECT (poly_api_key, poly_api_secret, poly_api_passphrase) ON public.clawbot_members FROM authenticated, anon;
GRANT SELECT (poly_api_key, poly_api_secret, poly_api_passphrase) ON public.clawbot_members TO service_role;
