-- Table 1: bot_trades
CREATE TABLE public.bot_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_type text NOT NULL DEFAULT 'sqi-sovereign',
  strategy text,
  action text,
  entry_price numeric,
  exit_price numeric,
  size_usd numeric,
  pnl_usd numeric NOT NULL DEFAULT 0,
  pnl_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  seed_balance numeric
);

ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot trades"
  ON public.bot_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot trades"
  ON public.bot_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot trades"
  ON public.bot_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot trades"
  ON public.bot_trades FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_bot_trades_user ON public.bot_trades(user_id);
CREATE INDEX idx_bot_trades_status ON public.bot_trades(status);

-- Table 2: bot_sessions
CREATE TABLE public.bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_type text,
  strategy text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  trades_count int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  final_pnl_usd numeric NOT NULL DEFAULT 0,
  final_portfolio_usd numeric,
  seed_usd numeric NOT NULL DEFAULT 10
);

ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot sessions"
  ON public.bot_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot sessions"
  ON public.bot_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot sessions"
  ON public.bot_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot sessions"
  ON public.bot_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_bot_sessions_user ON public.bot_sessions(user_id);