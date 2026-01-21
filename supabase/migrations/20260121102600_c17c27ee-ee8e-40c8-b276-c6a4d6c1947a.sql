-- Polymarket Trading Tables for Paper & Live Trading

-- Trade history table
CREATE TABLE public.polymarket_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  market_id TEXT NOT NULL,
  market_question TEXT,
  outcome TEXT NOT NULL,
  token_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  shares NUMERIC NOT NULL DEFAULT 0,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  amount_usdc NUMERIC NOT NULL,
  pnl NUMERIC DEFAULT 0,
  tx_hash TEXT,
  strategy TEXT CHECK (strategy IN ('whale_mirror', 'latency_arb', 'volatility_scalp', 'ai_signal', 'manual')),
  is_paper BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Open positions table (aggregated view)
CREATE TABLE public.polymarket_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  market_id TEXT NOT NULL,
  market_question TEXT,
  outcome TEXT NOT NULL,
  token_id TEXT NOT NULL,
  total_shares NUMERIC NOT NULL DEFAULT 0,
  avg_entry_price NUMERIC NOT NULL,
  current_price NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  is_paper BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token_id, is_paper)
);

-- Bot settings per user
CREATE TABLE public.polymarket_bot_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  is_paper_mode BOOLEAN NOT NULL DEFAULT true,
  max_trade_size NUMERIC DEFAULT 50,
  daily_loss_limit NUMERIC DEFAULT 500,
  strategies_enabled JSONB DEFAULT '{"whale_mirror": true, "latency_arb": true, "volatility_scalp": true, "ai_signal": true}'::jsonb,
  admin_profit_split NUMERIC DEFAULT 0.1111,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- P&L summary table (daily aggregates)
CREATE TABLE public.polymarket_pnl_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  is_paper BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, is_paper)
);

-- Enable RLS
ALTER TABLE public.polymarket_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_pnl_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see/modify their own data
CREATE POLICY "Users can view own trades" ON public.polymarket_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.polymarket_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.polymarket_trades FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own positions" ON public.polymarket_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON public.polymarket_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.polymarket_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON public.polymarket_positions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON public.polymarket_bot_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.polymarket_bot_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.polymarket_bot_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pnl" ON public.polymarket_pnl_daily FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pnl" ON public.polymarket_pnl_daily FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pnl" ON public.polymarket_pnl_daily FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_polymarket_positions_updated_at
  BEFORE UPDATE ON public.polymarket_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_polymarket_bot_settings_updated_at
  BEFORE UPDATE ON public.polymarket_bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();