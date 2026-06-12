ALTER TABLE public.polymarket_trades
  ADD COLUMN IF NOT EXISTS market_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS exit_price numeric,
  ADD COLUMN IF NOT EXISTS pnl_pct numeric,
  ADD COLUMN IF NOT EXISTS winning_outcome text,
  ADD COLUMN IF NOT EXISTS resolution_source text DEFAULT 'gamma_api';
CREATE INDEX IF NOT EXISTS idx_poly_trades_open_end ON public.polymarket_trades (status, market_end_date) WHERE status = 'open';

ALTER TABLE public.polymarket_bot_settings
  ADD COLUMN IF NOT EXISTS paper_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS risk_pct numeric NOT NULL DEFAULT 0.05;

-- polymarket_whales
CREATE TABLE IF NOT EXISTS public.polymarket_whales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  alias text, win_rate_30d numeric DEFAULT 0, roi_30d numeric DEFAULT 0,
  total_profit numeric DEFAULT 0, trades_tracked integer DEFAULT 0,
  last_checked timestamptz DEFAULT now(), is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.polymarket_whales TO anon, authenticated;
GRANT ALL ON public.polymarket_whales TO service_role;
ALTER TABLE public.polymarket_whales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads whales" ON public.polymarket_whales;
CREATE POLICY "Anyone reads whales" ON public.polymarket_whales FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.polymarket_whales (address, alias, win_rate_30d, roi_30d, total_profit) VALUES
  ('0xbaa2bcb5439e985ce4ccf815b4700027d1b92c73','BAA2BC — Iran Insider',83,97,191503),
  ('0x06dc51826bc524d9a83770e7de9dd7e005b04524','06DC51 — CryptoOracle',78,60,131298),
  ('0xed107a85a4585a381e48c7f7ca4144909e7dd2e5','ED107A — NoMachine99x',89,75,58947),
  ('0xa7a8c1fd4bfff08ea30214efa7efaf75d7c6580c','A7A8C1 — WorldCup',87,65,47554),
  ('0xf49ce459b52f60b70ce0fe9aa6203e6bf90f9786','F49CE4 — HighFreq',52,45,41975),
  ('0xe9076a87c5ed90ef16e6fe6529c943baeca0cff6','E9076A — CoTrader',83,55,30103),
  ('0x204f72f35326db932158cba6adff0b9a1da95e14','204F72 — PerfectWR',100,90,25928),
  ('0xa77105bb4d2d4d200b0133a2036222353831162d','A77105',78,50,6136),
  ('0xfea31bc088000ff909be1dfd8d0e3f2c7ef2d227','FEA31B — Elite',75,45,2151)
ON CONFLICT (address) DO UPDATE SET
  alias=EXCLUDED.alias, win_rate_30d=EXCLUDED.win_rate_30d,
  roi_30d=EXCLUDED.roi_30d, total_profit=EXCLUDED.total_profit, is_active=true;

CREATE TABLE IF NOT EXISTS public.polymarket_seen_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id text UNIQUE NOT NULL,
  whale_address text NOT NULL,
  detected_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.polymarket_seen_trades TO anon, authenticated;
GRANT ALL ON public.polymarket_seen_trades TO service_role;
ALTER TABLE public.polymarket_seen_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads seen" ON public.polymarket_seen_trades;
CREATE POLICY "Anyone reads seen" ON public.polymarket_seen_trades FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.clawbot_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poly_wallet_address text NOT NULL,
  poly_api_key text, poly_api_secret text, poly_api_passphrase text,
  tier text NOT NULL DEFAULT 'free',
  platform_fee_pct numeric NOT NULL DEFAULT 50.0,
  is_active boolean NOT NULL DEFAULT true,
  paper_mode boolean NOT NULL DEFAULT true,
  balance_usdc numeric NOT NULL DEFAULT 0,
  total_won_usdc numeric NOT NULL DEFAULT 0,
  total_fees_paid_usdc numeric NOT NULL DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clawbot_members TO authenticated;
GRANT ALL ON public.clawbot_members TO service_role;
ALTER TABLE public.clawbot_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own membership" ON public.clawbot_members;
CREATE POLICY "Users manage own membership" ON public.clawbot_members FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.clawbot_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  trade_id uuid REFERENCES public.polymarket_trades(id),
  tier text NOT NULL,
  gross_pnl_usdc numeric NOT NULL,
  fee_pct numeric NOT NULL,
  fee_usdc numeric NOT NULL,
  net_pnl_usdc numeric NOT NULL,
  platform_wallet text NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  tx_hash text,
  paid_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.clawbot_fee_ledger TO authenticated;
GRANT ALL ON public.clawbot_fee_ledger TO service_role;
ALTER TABLE public.clawbot_fee_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own fees" ON public.clawbot_fee_ledger;
CREATE POLICY "Users view own fees" ON public.clawbot_fee_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.clawbot_platform_config (
  id int PRIMARY KEY DEFAULT 1,
  platform_wallet text NOT NULL DEFAULT '',
  auto_transfer boolean NOT NULL DEFAULT false,
  min_transfer_usdc numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.clawbot_platform_config (id, platform_wallet, auto_transfer)
VALUES (1, '0xf11E66a5a6035275cb9587b3F23709A03141bdbb', false)
ON CONFLICT (id) DO UPDATE SET platform_wallet='0xf11E66a5a6035275cb9587b3F23709A03141bdbb';
GRANT SELECT ON public.clawbot_platform_config TO authenticated;
GRANT ALL ON public.clawbot_platform_config TO service_role;
ALTER TABLE public.clawbot_platform_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads platform config" ON public.clawbot_platform_config;
CREATE POLICY "Anyone reads platform config" ON public.clawbot_platform_config FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.clawbot_affiliate_rates (
  tier text PRIMARY KEY,
  l1_pct numeric NOT NULL,
  l2_pct numeric NOT NULL,
  platform_pct numeric NOT NULL
);
INSERT INTO public.clawbot_affiliate_rates (tier, l1_pct, l2_pct, platform_pct) VALUES
  ('free',10,3,50),('prana_flow',8,2,25),('siddha_quantum',5,1,10),('akasha_infinity',3,1,5)
ON CONFLICT (tier) DO UPDATE SET l1_pct=EXCLUDED.l1_pct, l2_pct=EXCLUDED.l2_pct, platform_pct=EXCLUDED.platform_pct;
GRANT SELECT ON public.clawbot_affiliate_rates TO authenticated, anon;
GRANT ALL ON public.clawbot_affiliate_rates TO service_role;
ALTER TABLE public.clawbot_affiliate_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads rates" ON public.clawbot_affiliate_rates;
CREATE POLICY "Anyone reads rates" ON public.clawbot_affiliate_rates FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS clawbot_trade_id uuid REFERENCES public.clawbot_fee_ledger(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1;
GRANT ALL ON public.affiliate_commissions TO service_role;

CREATE OR REPLACE FUNCTION public.clawbot_fee_for_tier(tier_name text)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE tier_name
    WHEN 'free' THEN 50.0
    WHEN 'prana_flow' THEN 25.0
    WHEN 'siddha_quantum' THEN 10.0
    WHEN 'akasha_infinity' THEN 5.0
    ELSE 50.0
  END;
$$;

CREATE OR REPLACE VIEW public.clawbot_member_stats AS
SELECT m.user_id, m.poly_wallet_address, m.tier, m.platform_fee_pct, m.balance_usdc,
  COUNT(t.id) FILTER (WHERE t.status IN ('won','lost')) AS total_trades,
  COUNT(t.id) FILTER (WHERE t.status = 'won') AS wins,
  COUNT(t.id) FILTER (WHERE t.status = 'lost') AS losses,
  COALESCE(SUM(t.pnl_usdc) FILTER (WHERE t.status='won'), 0) AS gross_winnings,
  COALESCE(SUM(f.fee_usdc), 0) AS total_fees_paid,
  COALESCE(SUM(t.pnl_usdc) FILTER (WHERE t.status='won'), 0) - COALESCE(SUM(f.fee_usdc), 0) AS net_winnings,
  ROUND(100.0 * COUNT(t.id) FILTER (WHERE t.status='won')::numeric
    / NULLIF(COUNT(t.id) FILTER (WHERE t.status IN ('won','lost')), 0), 1) AS win_rate_pct
FROM public.clawbot_members m
LEFT JOIN public.polymarket_trades t ON t.user_id = m.user_id
LEFT JOIN public.clawbot_fee_ledger f ON f.user_id = m.user_id
GROUP BY m.user_id, m.poly_wallet_address, m.tier, m.platform_fee_pct, m.balance_usdc;

CREATE OR REPLACE VIEW public.polymarket_pnl_by_day AS
SELECT DATE(resolved_at) AS day, is_paper,
  COUNT(*) AS trades_resolved,
  SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) AS wins,
  SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) AS losses,
  ROUND(SUM(pnl_usdc)::numeric, 4) AS total_pnl,
  ROUND(100.0 * SUM(CASE WHEN status='won' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0), 1) AS win_rate_pct
FROM public.polymarket_trades WHERE resolved_at IS NOT NULL
GROUP BY DATE(resolved_at), is_paper ORDER BY day DESC;

CREATE OR REPLACE VIEW public.affiliate_total_earnings AS
SELECT ap.user_id, ap.affiliate_code, ap.total_earnings AS subscription_earnings,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.source IN ('trading_l1','trading_l2')), 0) AS trading_earnings,
  ap.total_earnings + COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.source IN ('trading_l1','trading_l2')), 0) AS total_all_earnings,
  COUNT(ac.id) FILTER (WHERE ac.source = 'trading_l1') AS trading_l1_count,
  COUNT(ac.id) FILTER (WHERE ac.source = 'trading_l2') AS trading_l2_count
FROM public.affiliate_profiles ap
LEFT JOIN public.affiliate_commissions ac ON ac.affiliate_user_id = ap.user_id
GROUP BY ap.user_id, ap.affiliate_code, ap.total_earnings;

GRANT SELECT ON public.clawbot_member_stats TO authenticated, anon;
GRANT SELECT ON public.polymarket_pnl_by_day TO authenticated, anon;
GRANT SELECT ON public.affiliate_total_earnings TO authenticated;

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;