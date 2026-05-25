-- ============================================================
-- SQI BTC SOVEREIGN BOT — Database Schema
-- Migration: 20260625000000_btc_bot_tables.sql
-- Creates: btc_trades, btc_bot_state
-- ============================================================

-- 1. BTC TRADES — every paper/live trade recorded here
CREATE TABLE IF NOT EXISTS public.btc_trades (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  strategy         text NOT NULL DEFAULT 'scalp',
  side             text NOT NULL CHECK (side IN ('buy', 'sell')),
  entry_price      numeric(18,2),
  exit_price       numeric(18,2),
  btc_amount       numeric(18,8) NOT NULL,
  usd_size         numeric(18,4) NOT NULL,
  pnl              numeric(18,6),
  pnl_pct          numeric(10,4),
  exit_reason      text,
  paper_mode       boolean NOT NULL DEFAULT true,
  gemini_order_id  text,
  duration_ms      bigint,
  opened_at        timestamptz NOT NULL DEFAULT now(),
  closed_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS btc_trades_user_id_idx    ON public.btc_trades (user_id);
CREATE INDEX IF NOT EXISTS btc_trades_created_at_idx ON public.btc_trades (created_at DESC);
CREATE INDEX IF NOT EXISTS btc_trades_paper_mode_idx ON public.btc_trades (paper_mode);

-- RLS
ALTER TABLE public.btc_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own trades" ON public.btc_trades;
CREATE POLICY "Users see own trades"
  ON public.btc_trades FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access trades" ON public.btc_trades;
CREATE POLICY "Service role full access trades"
  ON public.btc_trades FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. BTC BOT STATE — one row per user, upserted on each scan
CREATE TABLE IF NOT EXISTS public.btc_bot_state (
  user_id          uuid PRIMARY KEY,
  strategy         text NOT NULL DEFAULT 'scalp',
  paper_mode       boolean NOT NULL DEFAULT true,
  usd_balance      numeric(18,4) NOT NULL DEFAULT 10,
  btc_balance      numeric(18,8) NOT NULL DEFAULT 0,
  total_trades     integer NOT NULL DEFAULT 0,
  wins             integer NOT NULL DEFAULT 0,
  losses           integer NOT NULL DEFAULT 0,
  win_rate         numeric(6,4) NOT NULL DEFAULT 0,
  current_price    numeric(18,2),
  daily_pnl        numeric(18,6) NOT NULL DEFAULT 0,
  is_halted        boolean NOT NULL DEFAULT false,
  has_position     boolean NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.btc_bot_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own state" ON public.btc_bot_state;
CREATE POLICY "Users see own state"
  ON public.btc_bot_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access state" ON public.btc_bot_state;
CREATE POLICY "Service role full access state"
  ON public.btc_bot_state FOR ALL
  USING (true)
  WITH CHECK (true);


-- 3. Seed initial bot state row for admin
INSERT INTO public.btc_bot_state (user_id, strategy, paper_mode, usd_balance)
VALUES ('bd0b21c9-577a-450b-bb1e-21c9d0423f17', 'scalp', true, 10)
ON CONFLICT (user_id) DO NOTHING;

