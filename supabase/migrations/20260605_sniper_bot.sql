-- ═══════════════════════════════════════════════════════════
-- SQI Sovereign Sniper — Supabase Migration
-- Project: fjdzhrdpioxdeyyfogep
-- ═══════════════════════════════════════════════════════════

-- 1. Members
CREATE TABLE IF NOT EXISTS sniper_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address TEXT,
  tier           TEXT DEFAULT 'free',
  balance        NUMERIC DEFAULT 0,
  total_earned   NUMERIC DEFAULT 0,
  referral_code  TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text,1,8)),
  referred_by    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 2. Snipe ledger
CREATE TABLE IF NOT EXISTS sniper_trades (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mint           TEXT NOT NULL,
  symbol         TEXT,
  action         TEXT,   -- SNIPE_ENTRY | TP1_EXIT | TP2_EXIT | SL_EXIT | TRAILING_EXIT | TIMEOUT_EXIT
  size_sol       NUMERIC,
  entry_price    NUMERIC,
  exit_price     NUMERIC,
  multiplier_x   NUMERIC,
  pnl_sol        NUMERIC DEFAULT 0,
  is_paper       BOOLEAN DEFAULT true,
  rug_score      INTEGER,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 3. Affiliate rates (mirrors delta_arb / sovereign_arb)
CREATE TABLE IF NOT EXISTS sniper_affiliate_rates (
  tier           TEXT PRIMARY KEY,
  l1_pct         NUMERIC,
  l2_pct         NUMERIC,
  you_keep_pct   NUMERIC
);

INSERT INTO sniper_affiliate_rates VALUES
  ('free',              10, 3, 37),
  ('prana-flow',         8, 2, 65),
  ('siddha-quantum',     5, 1, 84),
  ('akasha-infinity',    3, 1, 91)
ON CONFLICT (tier) DO NOTHING;

-- 4. Income streams card
INSERT INTO income_streams (
  title, description, link, tag, subtitle,
  is_active, is_new, type, badge, internal_slug, cta_label, sort_order
) VALUES (
  'Sovereign Sniper',
  'Pump.fun memecoin sniper. 7-layer rug filter. <300ms detection. Auto TP/SL moonbag. Start from 0.1 SOL.',
  '/income-streams/sniper-bot',
  'SOLANA', 'MEMECOIN SNIPER',
  true, true, 'Bot', 'NEW • SQI 2050',
  'sniper-bot', 'Open Sniper', 7
) ON CONFLICT (internal_slug) DO UPDATE SET link='/income-streams/sniper-bot', is_active=true;

-- 5. RLS
ALTER TABLE sniper_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sniper_trades        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sniper member" ON sniper_members       FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own sniper trades" ON sniper_trades        FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "read sniper rates" ON sniper_affiliate_rates FOR SELECT USING (true);
