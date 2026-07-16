
-- ============================================================
-- bot_sessions: guard financial/risk field mutations
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_bot_sessions_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.current_balance IS DISTINCT FROM OLD.current_balance
     OR NEW.starting_balance IS DISTINCT FROM OLD.starting_balance
     OR NEW.seed_usd IS DISTINCT FROM OLD.seed_usd
     OR NEW.seed_balance IS DISTINCT FROM OLD.seed_balance
     OR NEW.wins IS DISTINCT FROM OLD.wins
     OR NEW.losses IS DISTINCT FROM OLD.losses
     OR NEW.trades_count IS DISTINCT FROM OLD.trades_count
     OR NEW.final_pnl_usd IS DISTINCT FROM OLD.final_pnl_usd
     OR NEW.final_portfolio_usd IS DISTINCT FROM OLD.final_portfolio_usd
     OR NEW.kelly_fraction IS DISTINCT FROM OLD.kelly_fraction
     OR NEW.min_edge_pct IS DISTINCT FROM OLD.min_edge_pct
     OR NEW.max_position_pct IS DISTINCT FROM OLD.max_position_pct
  THEN
    RAISE EXCEPTION 'Not allowed to modify financial/risk fields on bot_sessions';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_bot_sessions_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Force safe initial values regardless of client input
  NEW.wins := 0;
  NEW.losses := 0;
  NEW.trades_count := 0;
  NEW.final_pnl_usd := 0;
  NEW.final_portfolio_usd := NULL;
  NEW.current_balance := COALESCE(NEW.starting_balance, 10);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_bot_sessions_update ON public.bot_sessions;
CREATE TRIGGER guard_bot_sessions_update
  BEFORE UPDATE ON public.bot_sessions
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_sessions_update();

DROP TRIGGER IF EXISTS guard_bot_sessions_insert ON public.bot_sessions;
CREATE TRIGGER guard_bot_sessions_insert
  BEFORE INSERT ON public.bot_sessions
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_sessions_insert();

-- ============================================================
-- bot_status: force safe defaults on INSERT (UPDATE guard exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_bot_status_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.pnl := 0;
  NEW.trades_won := 0;
  NEW.trades_lost := 0;
  NEW.win_rate := 0;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_bot_status_insert ON public.bot_status;
CREATE TRIGGER guard_bot_status_insert
  BEFORE INSERT ON public.bot_status
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_status_insert();

-- ============================================================
-- bot_trades: force safe defaults on INSERT (UPDATE guard exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_bot_trades_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.pnl_usd := 0;
  NEW.pnl_pct := 0;
  NEW.pnl_usdc := NULL;
  NEW.exit_price := NULL;
  NEW.status := 'open';
  NEW.closed_at := NULL;
  NEW.settled_at := NULL;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_bot_trades_insert ON public.bot_trades;
CREATE TRIGGER guard_bot_trades_insert
  BEFORE INSERT ON public.bot_trades
  FOR EACH ROW EXECUTE FUNCTION public.guard_bot_trades_insert();

-- ============================================================
-- polymarket_trades: force safe defaults on INSERT (UPDATE guard exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_polymarket_trades_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.pnl := 0;
  NEW.pnl_usdc := NULL;
  NEW.pnl_pct := NULL;
  NEW.exit_price := NULL;
  NEW.status := 'open';
  NEW.closed_at := NULL;
  NEW.resolved_at := NULL;
  NEW.winning_outcome := NULL;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_polymarket_trades_insert ON public.polymarket_trades;
CREATE TRIGGER guard_polymarket_trades_insert
  BEFORE INSERT ON public.polymarket_trades
  FOR EACH ROW EXECUTE FUNCTION public.guard_polymarket_trades_insert();

-- ============================================================
-- reviews: lock reward_claimed and reward_amount
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_reviews_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.reward_claimed IS DISTINCT FROM OLD.reward_claimed
     OR NEW.reward_amount IS DISTINCT FROM OLD.reward_amount
     OR NEW.is_verified_purchase IS DISTINCT FROM OLD.is_verified_purchase
  THEN
    RAISE EXCEPTION 'Not allowed to modify reward fields on reviews';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_reviews_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.reward_claimed := false;
  NEW.reward_amount := 1000;
  NEW.is_verified_purchase := false;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_reviews_update ON public.reviews;
CREATE TRIGGER guard_reviews_update
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.guard_reviews_update();

DROP TRIGGER IF EXISTS guard_reviews_insert ON public.reviews;
CREATE TRIGGER guard_reviews_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.guard_reviews_insert();
