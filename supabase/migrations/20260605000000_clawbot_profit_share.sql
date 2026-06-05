-- CLAWBOT Profit Share System
-- When a member connects their Polymarket wallet, trades are copied to their wallet
-- On each WIN, platform fee is automatically deducted based on tier

CREATE TABLE IF NOT EXISTS clawbot_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  poly_wallet_address text NOT NULL,
  poly_api_key text,
  poly_api_secret text,
  poly_api_passphrase text,
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

-- Fee schedule by tier
-- free: 50%, prana_flow: 25%, siddha_quantum: 10%, akasha_infinity: 5%
CREATE OR REPLACE FUNCTION clawbot_fee_for_tier(tier_name text)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE tier_name
    WHEN 'free'            THEN 50.0
    WHEN 'prana_flow'      THEN 25.0
    WHEN 'siddha_quantum'  THEN 10.0
    WHEN 'akasha_infinity' THEN  5.0
    ELSE 50.0
  END;
$$;

-- Profit share ledger — every fee payment recorded
CREATE TABLE IF NOT EXISTS clawbot_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  trade_id uuid REFERENCES polymarket_trades(id),
  tier text NOT NULL,
  gross_pnl_usdc numeric NOT NULL,
  fee_pct numeric NOT NULL,
  fee_usdc numeric NOT NULL,
  net_pnl_usdc numeric NOT NULL,
  platform_wallet text NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  tx_hash text,
  paid_at timestamptz DEFAULT now()
);

-- Master wallet address for SQI platform (receives all fees)
CREATE TABLE IF NOT EXISTS clawbot_platform_config (
  id int PRIMARY KEY DEFAULT 1,
  platform_wallet text NOT NULL DEFAULT '',
  auto_transfer boolean NOT NULL DEFAULT false,
  min_transfer_usdc numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO clawbot_platform_config (id, platform_wallet, auto_transfer)
VALUES (1, '', false)
ON CONFLICT (id) DO NOTHING;

-- Stats view per member
CREATE OR REPLACE VIEW clawbot_member_stats AS
SELECT
  m.user_id,
  m.poly_wallet_address,
  m.tier,
  m.platform_fee_pct,
  m.balance_usdc,
  COUNT(t.id) FILTER (WHERE t.status IN ('won','lost')) AS total_trades,
  COUNT(t.id) FILTER (WHERE t.status = 'won') AS wins,
  COUNT(t.id) FILTER (WHERE t.status = 'lost') AS losses,
  COALESCE(SUM(t.pnl_usdc) FILTER (WHERE t.status = 'won'), 0) AS gross_winnings,
  COALESCE(SUM(f.fee_usdc), 0) AS total_fees_paid,
  COALESCE(SUM(t.pnl_usdc) FILTER (WHERE t.status = 'won'), 0)
    - COALESCE(SUM(f.fee_usdc), 0) AS net_winnings,
  ROUND(
    100.0 * COUNT(t.id) FILTER (WHERE t.status = 'won')::numeric
    / NULLIF(COUNT(t.id) FILTER (WHERE t.status IN ('won','lost')), 0), 1
  ) AS win_rate_pct
FROM clawbot_members m
LEFT JOIN polymarket_trades t ON t.user_id = m.user_id
LEFT JOIN clawbot_fee_ledger f ON f.user_id = m.user_id
GROUP BY m.user_id, m.poly_wallet_address, m.tier, m.platform_fee_pct, m.balance_usdc;

-- RLS
ALTER TABLE clawbot_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clawbot_fee_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE clawbot_platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own membership" ON clawbot_members
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users view own fees" ON clawbot_fee_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone reads platform config" ON clawbot_platform_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin updates platform config" ON clawbot_platform_config
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT ALL ON clawbot_members TO service_role, authenticated;
GRANT ALL ON clawbot_fee_ledger TO service_role, authenticated;
GRANT ALL ON clawbot_platform_config TO service_role, authenticated;
GRANT SELECT ON clawbot_member_stats TO authenticated;
