
-- Restrict financial writes to service_role only. Users can still SELECT.
-- bot_sessions
DROP POLICY IF EXISTS "Users can insert their own bot sessions" ON public.bot_sessions;
DROP POLICY IF EXISTS "Users can update their own bot sessions" ON public.bot_sessions;
DROP POLICY IF EXISTS "Users can delete their own bot sessions" ON public.bot_sessions;

-- bot_status
DROP POLICY IF EXISTS "Users insert own bot_status" ON public.bot_status;
DROP POLICY IF EXISTS "Users update own bot_status" ON public.bot_status;

-- bot_trade_signals
DROP POLICY IF EXISTS "Users can insert their own trade signals" ON public.bot_trade_signals;
DROP POLICY IF EXISTS "Users can update their own trade signals" ON public.bot_trade_signals;

-- bot_trades
DROP POLICY IF EXISTS "Users can insert their own bot trades" ON public.bot_trades;
DROP POLICY IF EXISTS "Users can update their own bot trades" ON public.bot_trades;
DROP POLICY IF EXISTS "Users can delete their own bot trades" ON public.bot_trades;
DROP POLICY IF EXISTS "bot_trades_insert_own" ON public.bot_trades;

-- polymarket_bot_settings — protect admin_profit_split and financial fields
DROP POLICY IF EXISTS "Users can insert own settings" ON public.polymarket_bot_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.polymarket_bot_settings;

-- polymarket_pnl_daily
DROP POLICY IF EXISTS "Users can insert own pnl" ON public.polymarket_pnl_daily;
DROP POLICY IF EXISTS "Users can update own pnl" ON public.polymarket_pnl_daily;

-- polymarket_positions
DROP POLICY IF EXISTS "Users can insert own positions" ON public.polymarket_positions;
DROP POLICY IF EXISTS "Users can update own positions" ON public.polymarket_positions;
DROP POLICY IF EXISTS "Users can delete own positions" ON public.polymarket_positions;

-- polymarket_trades
DROP POLICY IF EXISTS "Users can insert own trades" ON public.polymarket_trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.polymarket_trades;
