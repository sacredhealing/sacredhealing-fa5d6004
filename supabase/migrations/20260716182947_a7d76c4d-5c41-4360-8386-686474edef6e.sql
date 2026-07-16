
-- 1) clawbot_members: hide API credentials from client SELECT via a safe view + column revoke
REVOKE SELECT (poly_api_key, poly_api_secret, poly_api_passphrase) ON public.clawbot_members FROM authenticated, anon;
-- Also prevent users from writing these columns; only service_role sets them
REVOKE INSERT (poly_api_key, poly_api_secret, poly_api_passphrase),
       UPDATE (poly_api_key, poly_api_secret, poly_api_passphrase)
  ON public.clawbot_members FROM authenticated, anon;

-- 2) call_recordings: scope stargate recordings to actual participants (host or partner) + admin
DROP POLICY IF EXISTS "Stargate members can view stargate recordings" ON public.call_recordings;
CREATE POLICY "Stargate participants can view own stargate recordings"
ON public.call_recordings
FOR SELECT
TO authenticated
USING (
  call_type = 'stargate'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR host_user_id = auth.uid()
    OR partner_user_id = auth.uid()
  )
);

-- 3) shreem realtime: remove global bot-state tables from the realtime publication.
-- User-scoped tables (mlm_earnings, profit_distributions) remain published; RLS filters payloads per user.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shreem_brzee_session') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shreem_brzee_session';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shreem_brzee_signals') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shreem_brzee_signals';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shreem_brzee_paper_trades') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shreem_brzee_paper_trades';
  END IF;
END $$;

-- 4) sniper_members: replace WITH CHECK subquery locks with atomic BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.sniper_members_guard_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass guard for service_role
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Lock privileged columns to their previous values for user-driven updates
  IF NEW.tier            IS DISTINCT FROM OLD.tier            THEN NEW.tier            := OLD.tier;            END IF;
  IF NEW.balance         IS DISTINCT FROM OLD.balance         THEN NEW.balance         := OLD.balance;         END IF;
  IF NEW.total_earned    IS DISTINCT FROM OLD.total_earned    THEN NEW.total_earned    := OLD.total_earned;    END IF;
  IF NEW.platform_fee_pct IS DISTINCT FROM OLD.platform_fee_pct THEN NEW.platform_fee_pct := OLD.platform_fee_pct; END IF;
  IF NEW.wallet_address  IS DISTINCT FROM OLD.wallet_address  THEN NEW.wallet_address  := OLD.wallet_address;  END IF;
  IF NEW.user_id         IS DISTINCT FROM OLD.user_id         THEN NEW.user_id         := OLD.user_id;         END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sniper_members_guard ON public.sniper_members;
CREATE TRIGGER trg_sniper_members_guard
BEFORE UPDATE ON public.sniper_members
FOR EACH ROW
EXECUTE FUNCTION public.sniper_members_guard_privileged_columns();

-- Simplify the UPDATE policy now that the trigger enforces atomic column locks
DROP POLICY IF EXISTS "Users update own sniper non-sensitive" ON public.sniper_members;
CREATE POLICY "Users update own sniper_members"
ON public.sniper_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
