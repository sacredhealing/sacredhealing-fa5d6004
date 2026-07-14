
-- Guard function generator pattern: block non-admin/non-service-role updates to financial columns

-- 1. user_balances
CREATE OR REPLACE FUNCTION public.guard_user_balances_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_spent IS DISTINCT FROM OLD.total_spent
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify balance fields on user_balances';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_user_balances_update ON public.user_balances;
CREATE TRIGGER guard_user_balances_update BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_balances_update();

-- 2. affiliate_profiles
CREATE OR REPLACE FUNCTION public.guard_affiliate_profiles_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.pending_balance IS DISTINCT FROM OLD.pending_balance
     OR NEW.paid_out IS DISTINCT FROM OLD.paid_out
     OR NEW.affiliate_code IS DISTINCT FROM OLD.affiliate_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Not allowed to modify financial fields on affiliate_profiles';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_affiliate_profiles_update ON public.affiliate_profiles;
CREATE TRIGGER guard_affiliate_profiles_update BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_affiliate_profiles_update();

-- 3. bot_status
CREATE OR REPLACE FUNCTION public.guard_bot_status_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.pnl IS DISTINCT FROM OLD.pnl
     OR NEW.win_rate IS DISTINCT FROM OLD.win_rate
     OR NEW.trades_won IS DISTINCT FROM OLD.trades_won
     OR NEW.trades_lost IS DISTINCT FROM OLD.trades_lost
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify performance fields on bot_status';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_bot_status_update ON public.bot_status;
CREATE TRIGGER guard_bot_status_update BEFORE UPDATE ON public.bot_status
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_status_update();

-- 4. bot_trades
CREATE OR REPLACE FUNCTION public.guard_bot_trades_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.pnl_usd IS DISTINCT FROM OLD.pnl_usd
     OR NEW.pnl_pct IS DISTINCT FROM OLD.pnl_pct
     OR NEW.exit_price IS DISTINCT FROM OLD.exit_price
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify financial fields on bot_trades';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_bot_trades_update ON public.bot_trades;
CREATE TRIGGER guard_bot_trades_update BEFORE UPDATE ON public.bot_trades
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_trades_update();

-- 5. polymarket_positions
CREATE OR REPLACE FUNCTION public.guard_polymarket_positions_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.total_shares IS DISTINCT FROM OLD.total_shares
     OR NEW.avg_entry_price IS DISTINCT FROM OLD.avg_entry_price
     OR NEW.current_price IS DISTINCT FROM OLD.current_price
     OR NEW.unrealized_pnl IS DISTINCT FROM OLD.unrealized_pnl
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify financial fields on polymarket_positions';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_polymarket_positions_update ON public.polymarket_positions;
CREATE TRIGGER guard_polymarket_positions_update BEFORE UPDATE ON public.polymarket_positions
  FOR EACH ROW EXECUTE FUNCTION public.guard_polymarket_positions_update();

-- 6. polymarket_trades
CREATE OR REPLACE FUNCTION public.guard_polymarket_trades_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.pnl IS DISTINCT FROM OLD.pnl
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.exit_price IS DISTINCT FROM OLD.exit_price
     OR NEW.entry_price IS DISTINCT FROM OLD.entry_price
     OR NEW.shares IS DISTINCT FROM OLD.shares
     OR NEW.amount_usdc IS DISTINCT FROM OLD.amount_usdc
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify financial fields on polymarket_trades';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_polymarket_trades_update ON public.polymarket_trades;
CREATE TRIGGER guard_polymarket_trades_update BEFORE UPDATE ON public.polymarket_trades
  FOR EACH ROW EXECUTE FUNCTION public.guard_polymarket_trades_update();

-- 7. daily_activities & user_daily_activities
CREATE OR REPLACE FUNCTION public.guard_daily_activities_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.shc_earned IS DISTINCT FROM OLD.shc_earned
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to modify reward fields on daily_activities';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_daily_activities_update ON public.daily_activities;
CREATE TRIGGER guard_daily_activities_update BEFORE UPDATE ON public.daily_activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_daily_activities_update();

DROP TRIGGER IF EXISTS guard_user_daily_activities_update ON public.user_daily_activities;
CREATE TRIGGER guard_user_daily_activities_update BEFORE UPDATE ON public.user_daily_activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_daily_activities_update();

-- Also block INSERT of shc_earned > 0 by regular users (only service role / admin can mint)
CREATE OR REPLACE FUNCTION public.guard_daily_activities_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.shc_earned, 0) <> 0 THEN
    NEW.shc_earned := 0;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_daily_activities_insert ON public.daily_activities;
CREATE TRIGGER guard_daily_activities_insert BEFORE INSERT ON public.daily_activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_daily_activities_insert();
DROP TRIGGER IF EXISTS guard_user_daily_activities_insert ON public.user_daily_activities;
CREATE TRIGGER guard_user_daily_activities_insert BEFORE INSERT ON public.user_daily_activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_daily_activities_insert();

-- Also block INSERT of user_balances with non-default values by end users
CREATE OR REPLACE FUNCTION public.guard_user_balances_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.balance := 0;
  NEW.total_earned := 0;
  NEW.total_spent := 0;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_user_balances_insert ON public.user_balances;
CREATE TRIGGER guard_user_balances_insert BEFORE INSERT ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_balances_insert();
