-- SQI Sovereign Sniper — Full Migration
-- Run via: Supabase SQL Editor → paste → Run

-- 1. Members
CREATE TABLE IF NOT EXISTS sniper_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address  text,
  tier            text NOT NULL DEFAULT 'free',
  platform_fee_pct integer NOT NULL DEFAULT 63,
  balance         numeric(16,8) NOT NULL DEFAULT 0,
  total_earned    numeric(16,8) NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  paper_mode      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Trades ledger
CREATE TABLE IF NOT EXISTS sniper_trades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mint         text NOT NULL,
  symbol       text,
  launchpad    text NOT NULL DEFAULT 'pump_fun',
  action       text NOT NULL DEFAULT 'SNIPE_ENTRY',
  size_sol     numeric(12,8),
  entry_price  numeric(18,12),
  exit_price   numeric(18,12),
  multiplier_x numeric(10,4) DEFAULT 1,
  pnl_sol      numeric(16,8) DEFAULT 0,
  ai_score     integer,
  rug_score    integer,
  status       text NOT NULL DEFAULT 'open',
  mode         text NOT NULL DEFAULT 'PAPER',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Affiliate rates
CREATE TABLE IF NOT EXISTS sniper_affiliate_rates (
  tier        text PRIMARY KEY,
  l1_pct      numeric(5,2) NOT NULL,
  l2_pct      numeric(5,2) NOT NULL,
  fee_pct     integer NOT NULL,
  you_keep    integer NOT NULL
);

INSERT INTO sniper_affiliate_rates (tier, l1_pct, l2_pct, fee_pct, you_keep) VALUES
  ('free',             10.00, 3.00, 63, 37),
  ('prana_flow',        8.00, 2.00, 35, 65),
  ('siddha_quantum',    5.00, 1.00, 16, 84),
  ('akasha_infinity',   3.00, 1.00,  9, 91)
ON CONFLICT (tier) DO UPDATE SET
  l1_pct=EXCLUDED.l1_pct, l2_pct=EXCLUDED.l2_pct,
  fee_pct=EXCLUDED.fee_pct, you_keep=EXCLUDED.you_keep;

-- 4. Income streams card (exact columns from working delta-arb migration)
INSERT INTO income_streams (
  title, description, link, category, tags,
  is_active, is_visible, stream_type, badge, new_badge,
  internal_slug, button_label, sort_order
) VALUES (
  'Sovereign Sniper',
  'Pump.fun memecoin sniper. 7 launchpads. 12-signal Gemini AI filter. Jito MEV protection. Dev wallet monitor. Start from 0.1 SOL.',
  '/income-streams/sniper-bot',
  'AI',
  'MEMECOIN SNIPER · SOLANA',
  true, true,
  'Bot', 'NEW • SQI 2050', true,
  'sniper-bot',
  'Open Sniper',
  -3
)
ON CONFLICT (internal_slug) DO UPDATE SET
  link='/income-streams/sniper-bot',
  is_active=true,
  is_visible=true,
  title='Sovereign Sniper';

-- 5. RLS
ALTER TABLE sniper_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sniper_trades  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sniper_members' AND policyname='Users own sniper_members') THEN
    CREATE POLICY "Users own sniper_members" ON sniper_members FOR ALL USING (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sniper_trades' AND policyname='Users own sniper_trades') THEN
    CREATE POLICY "Users own sniper_trades" ON sniper_trades FOR ALL USING (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sniper_affiliate_rates' AND policyname='Read sniper rates') THEN
    CREATE POLICY "Read sniper rates" ON sniper_affiliate_rates FOR SELECT USING (true);
  END IF;
END $$;
