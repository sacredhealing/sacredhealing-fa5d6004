-- CLAWBOT 2-Tier Affiliate System for Trading Profits
-- Connects to existing affiliate_profiles and affiliate_commissions tables

-- Add referred_by to profiles if not exists
-- Stores the affiliate_code of whoever referred this user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by text REFERENCES affiliate_profiles(affiliate_code) ON DELETE SET NULL;

-- Add trading commission type to affiliate_commissions
-- source: 'subscription' (existing) | 'trading_l1' | 'trading_l2'
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS clawbot_trade_id uuid REFERENCES clawbot_fee_ledger(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1;

-- Trading commission rates by tier
-- Level 1 = direct referrer, Level 2 = referrer's referrer
CREATE TABLE IF NOT EXISTS clawbot_affiliate_rates (
  tier            text PRIMARY KEY,
  l1_pct          numeric NOT NULL,  -- % of gross win to Level 1 referrer
  l2_pct          numeric NOT NULL,  -- % of gross win to Level 2 referrer
  platform_pct    numeric NOT NULL   -- % to platform (you)
);

INSERT INTO clawbot_affiliate_rates (tier, l1_pct, l2_pct, platform_pct) VALUES
  ('free',            10, 3, 50),
  ('prana_flow',       8, 2, 25),
  ('siddha_quantum',   5, 1, 10),
  ('akasha_infinity',  3, 1,  5)
ON CONFLICT (tier) DO UPDATE SET
  l1_pct = EXCLUDED.l1_pct,
  l2_pct = EXCLUDED.l2_pct,
  platform_pct = EXCLUDED.platform_pct;

-- View: full affiliate earnings including trading commissions
CREATE OR REPLACE VIEW affiliate_total_earnings AS
SELECT
  ap.user_id,
  ap.affiliate_code,
  ap.total_earnings                                          AS subscription_earnings,
  COALESCE(SUM(ac.commission_amount) FILTER (
    WHERE ac.source IN ('trading_l1','trading_l2')
  ), 0)                                                      AS trading_earnings,
  ap.total_earnings + COALESCE(SUM(ac.commission_amount) FILTER (
    WHERE ac.source IN ('trading_l1','trading_l2')
  ), 0)                                                      AS total_all_earnings,
  COUNT(ac.id) FILTER (WHERE ac.source = 'trading_l1')      AS trading_l1_count,
  COUNT(ac.id) FILTER (WHERE ac.source = 'trading_l2')      AS trading_l2_count
FROM affiliate_profiles ap
LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = ap.user_id
GROUP BY ap.user_id, ap.affiliate_code, ap.total_earnings;

-- RLS
ALTER TABLE clawbot_affiliate_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads rates" ON clawbot_affiliate_rates FOR SELECT TO authenticated, anon USING (true);

GRANT SELECT ON clawbot_affiliate_rates TO authenticated, anon;
GRANT SELECT ON affiliate_total_earnings TO authenticated;
GRANT ALL ON affiliate_commissions TO service_role;
