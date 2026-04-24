-- BTC trading bot tables
CREATE TABLE IF NOT EXISTS public.btc_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy text NOT NULL,
  side text NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  btc_amount numeric NOT NULL,
  usd_size numeric NOT NULL,
  pnl numeric,
  pnl_pct numeric,
  exit_reason text,
  paper_mode boolean NOT NULL DEFAULT true,
  gemini_order_id text,
  duration_ms bigint,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_btc_trades_user ON public.btc_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_btc_trades_opened_at ON public.btc_trades(opened_at DESC);

ALTER TABLE public.btc_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own btc trades"
  ON public.btc_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all btc trades"
  ON public.btc_trades FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages btc trades"
  ON public.btc_trades FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.btc_bot_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  strategy text NOT NULL,
  paper_mode boolean NOT NULL DEFAULT true,
  usd_balance numeric NOT NULL DEFAULT 0,
  btc_balance numeric NOT NULL DEFAULT 0,
  total_trades integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  win_rate numeric NOT NULL DEFAULT 0,
  current_price numeric,
  daily_pnl numeric NOT NULL DEFAULT 0,
  is_halted boolean NOT NULL DEFAULT false,
  has_position boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_btc_bot_state_user ON public.btc_bot_state(user_id);

ALTER TABLE public.btc_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot state"
  ON public.btc_bot_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bot state"
  ON public.btc_bot_state FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage bot state"
  ON public.btc_bot_state FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER btc_bot_state_updated_at
  BEFORE UPDATE ON public.btc_bot_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();