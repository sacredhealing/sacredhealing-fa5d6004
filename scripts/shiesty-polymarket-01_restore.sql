-- ============================================================================
-- SHIESTY POLYMARKET BOT — Railway worker + income stream card
-- Restores /income-streams polymarket card, signal queue, guard config, fills
-- ============================================================================

-- Income stream card (app reads public.income_streams — not income_stream_cards)
INSERT INTO public.income_streams (
  title,
  description,
  link,
  category,
  potential_earnings,
  is_featured,
  is_active,
  image_url,
  order_index,
  icon_name,
  badge_text,
  internal_slug,
  cta_button_text,
  title_sv,
  title_es,
  title_no,
  description_sv,
  description_es,
  description_no,
  potential_earnings_sv,
  potential_earnings_es,
  potential_earnings_no,
  badge_text_sv,
  badge_text_es,
  badge_text_no,
  color_from,
  color_to,
  cta_button_text_sv,
  cta_button_text_es,
  cta_button_text_no
)
SELECT
  'Shiesty Signal Oracle',
  'Whale Mirror + Latency Arb + Volatility Scalp · Polygon CTF Exchange',
  '/income-streams/polymarket-bot',
  'AI',
  'POLYGON · CTF · RAILWAY',
  true,
  true,
  NULL,
  -1,
  'Bot',
  'LIVE · SQI 2050',
  'polymarket-bot',
  'Open Terminal',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.income_streams s WHERE s.internal_slug = 'polymarket-bot'
);

UPDATE public.income_streams
SET
  title = 'Shiesty Signal Oracle',
  description = 'Whale Mirror + Latency Arb + Volatility Scalp · Polygon CTF Exchange',
  link = '/income-streams/polymarket-bot',
  category = 'AI',
  potential_earnings = 'POLYGON · CTF · RAILWAY',
  is_featured = true,
  is_active = true,
  order_index = -1,
  icon_name = 'Bot',
  badge_text = 'LIVE · SQI 2050',
  cta_button_text = 'Open Terminal'
WHERE internal_slug = 'polymarket-bot';

CREATE TABLE IF NOT EXISTS public.bot_trade_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  bot_slug text NOT NULL,
  market_id text NOT NULL,
  market_question text,
  side text NOT NULL CHECK (side IN ('YES', 'NO')),
  size_usdc numeric NOT NULL,
  entry_price numeric NOT NULL,
  strategy text NOT NULL,
  source_wallet text,
  mode text NOT NULL DEFAULT 'paper' CHECK (mode IN ('paper', 'live')),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'executing', 'filled', 'failed', 'rejected_by_guard')
  ),
  rejection_reason text,
  tx_hash text,
  executed_at timestamptz,
  exited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_trade_signals_status_mode ON public.bot_trade_signals (status, mode);
CREATE INDEX IF NOT EXISTS idx_bot_trade_signals_user_created ON public.bot_trade_signals (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.bot_guard_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  max_position_usdc numeric NOT NULL DEFAULT 2.0,
  max_daily_loss_usdc numeric NOT NULL DEFAULT 3.0,
  max_concurrent_positions int NOT NULL DEFAULT 3,
  max_consecutive_losses int NOT NULL DEFAULT 3,
  paper_mode_only boolean NOT NULL DEFAULT true,
  whitelisted_whales text[] DEFAULT ARRAY['0x91583ceb1ebec79951a068e1d7d02c1ea590fa7b']::text[],
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bot_polymarket_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  signal_id uuid REFERENCES public.bot_trade_signals (id) ON DELETE SET NULL,
  market_id text NOT NULL,
  market_question text,
  side text NOT NULL,
  size_usdc numeric NOT NULL,
  entry_price numeric NOT NULL,
  fill_price numeric NOT NULL,
  strategy text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('paper', 'live')),
  pnl_usdc numeric NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bot_polymarket_exec_user_closed ON public.bot_polymarket_executions (user_id, closed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_bot_polymarket_exec_user_opened ON public.bot_polymarket_executions (user_id, opened_at DESC);

ALTER TABLE public.bot_trade_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_guard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_polymarket_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_trade_signals_select_own" ON public.bot_trade_signals;
CREATE POLICY "bot_trade_signals_select_own"
  ON public.bot_trade_signals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bot_trade_signals_insert_own" ON public.bot_trade_signals;
CREATE POLICY "bot_trade_signals_insert_own"
  ON public.bot_trade_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bot_trade_signals_update_own" ON public.bot_trade_signals;
CREATE POLICY "bot_trade_signals_update_own"
  ON public.bot_trade_signals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_guard_config" ON public.bot_guard_config;
CREATE POLICY "users_own_guard_config"
  ON public.bot_guard_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bot_polymarket_exec_select_own" ON public.bot_polymarket_executions;
CREATE POLICY "bot_polymarket_exec_select_own"
  ON public.bot_polymarket_executions FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE public.bot_trade_signals REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_trade_signals;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
