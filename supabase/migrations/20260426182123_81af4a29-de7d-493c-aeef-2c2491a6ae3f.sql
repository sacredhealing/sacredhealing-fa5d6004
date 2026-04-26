-- Add columns required by PredictionMarketBot to existing bot_sessions table
ALTER TABLE public.bot_sessions
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'paper',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paused',
  ADD COLUMN IF NOT EXISTS starting_balance NUMERIC NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS current_balance NUMERIC NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS kelly_fraction NUMERIC NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS min_edge_pct NUMERIC NOT NULL DEFAULT 0.03,
  ADD COLUMN IF NOT EXISTS max_position_pct NUMERIC NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add columns required by PredictionMarketBot to existing bot_trades table
ALTER TABLE public.bot_trades
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS market_question TEXT,
  ADD COLUMN IF NOT EXISTS market_id TEXT,
  ADD COLUMN IF NOT EXISTS side TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS edge_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bot_trades_session_id ON public.bot_trades(session_id);

-- New table for live signal queue consumed by external worker
CREATE TABLE IF NOT EXISTS public.bot_trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  trade_id UUID,
  bot_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_trade_signals_user_id ON public.bot_trade_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_trade_signals_session_id ON public.bot_trade_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_trade_signals_status ON public.bot_trade_signals(status);

ALTER TABLE public.bot_trade_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trade signals"
  ON public.bot_trade_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade signals"
  ON public.bot_trade_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade signals"
  ON public.bot_trade_signals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_bot_trade_signals_updated_at
  BEFORE UPDATE ON public.bot_trade_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();