CREATE TABLE IF NOT EXISTS public.polymarket_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text, whale_address text, strategy text, side text,
  size_usdc numeric, entry_price numeric, exit_price numeric,
  pnl numeric, status text DEFAULT 'open',
  opened_at timestamptz DEFAULT now(), resolved_at timestamptz,
  tx_hash text, user_id uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polymarket_trades TO authenticated;
GRANT ALL ON public.polymarket_trades TO service_role;
ALTER TABLE public.polymarket_trades ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clawbot_platform_config (
  id int PRIMARY KEY DEFAULT 1, platform_wallet text
);
GRANT SELECT ON public.clawbot_platform_config TO authenticated;
GRANT ALL ON public.clawbot_platform_config TO service_role;
ALTER TABLE public.clawbot_platform_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clawbot_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, trade_id uuid, fee_amount numeric, created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.clawbot_fee_ledger TO authenticated;
GRANT ALL ON public.clawbot_fee_ledger TO service_role;
ALTER TABLE public.clawbot_fee_ledger ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clawbot_affiliate_rates (
  tier text PRIMARY KEY, l1_pct numeric, l2_pct numeric
);
GRANT SELECT ON public.clawbot_affiliate_rates TO authenticated;
GRANT ALL ON public.clawbot_affiliate_rates TO service_role;
ALTER TABLE public.clawbot_affiliate_rates ENABLE ROW LEVEL SECURITY;
