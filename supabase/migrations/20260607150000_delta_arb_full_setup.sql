-- ═══════════════════════════════════════════════════════════════
-- Delta-Arb Bot: DB tables + affiliate commission rates
-- Mirrors CLAWBOT (clawbot_members, clawbot_fee_ledger) exactly
-- ═══════════════════════════════════════════════════════════════

-- Members table (wallet + tier + mode)
CREATE TABLE IF NOT EXISTS delta_arb_members (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  poly_wallet_address text,
  tier                text NOT NULL DEFAULT 'free',
  platform_fee_pct    integer NOT NULL DEFAULT 50,
  is_active           boolean NOT NULL DEFAULT true,
  paper_mode          boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE delta_arb_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their delta_arb_members row"
  ON delta_arb_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can see all delta_arb_members"
  ON delta_arb_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trades table
CREATE TABLE IF NOT EXISTS delta_arb_trades (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset            text NOT NULL,          -- BTC/ETH/SOL
  interval         text NOT NULL DEFAULT '15m',
  signal           text NOT NULL,          -- UP/DOWN
  delta            text,                   -- e.g. "+0.1821%"
  size_usd         numeric(12,4),
  entry_price      numeric(8,6),
  status           text NOT NULL DEFAULT 'open',  -- open/won/lost
  pnl_usdc         numeric(12,4),
  net_pnl_usdc     numeric(12,4),
  mode             text NOT NULL DEFAULT 'PAPER',
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE delta_arb_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their delta_arb_trades"
  ON delta_arb_trades FOR ALL USING (auth.uid() = user_id);

-- Fee ledger (mirrors clawbot_fee_ledger)
CREATE TABLE IF NOT EXISTS delta_arb_fee_ledger (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id         uuid REFERENCES delta_arb_trades(id),
  gross_pnl_usdc   numeric(12,4) NOT NULL,
  fee_pct          integer NOT NULL,
  fee_usdc         numeric(12,4) NOT NULL,
  net_pnl_usdc     numeric(12,4) NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE delta_arb_fee_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their delta_arb_fee_ledger"
  ON delta_arb_fee_ledger FOR ALL USING (auth.uid() = user_id);

-- Platform config (master wallet for fee collection)
CREATE TABLE IF NOT EXISTS delta_arb_platform_config (
  id               integer PRIMARY KEY DEFAULT 1,
  platform_wallet  text,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO delta_arb_platform_config (id, platform_wallet)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

-- ─── Affiliate commission rates per tier ────────────────────────
-- Mirrors clawbot_affiliate_rates used by server.mjs
CREATE TABLE IF NOT EXISTS delta_arb_affiliate_rates (
  tier     text PRIMARY KEY,
  l1_pct   numeric(5,2) NOT NULL,  -- % of gross win to L1 referrer
  l2_pct   numeric(5,2) NOT NULL   -- % of gross win to L2 referrer
);
INSERT INTO delta_arb_affiliate_rates (tier, l1_pct, l2_pct) VALUES
  ('free',             10.00, 3.00),
  ('prana_flow',        8.00, 2.00),
  ('siddha_quantum',    5.00, 1.00),
  ('akasha_infinity',   3.00, 1.00)
ON CONFLICT (tier) DO UPDATE SET l1_pct = EXCLUDED.l1_pct, l2_pct = EXCLUDED.l2_pct;

-- ─── Income streams card row ─────────────────────────────────────
INSERT INTO income_streams (
  title, description, link, category, tags,
  is_active, is_visible, stream_type, badge, new_badge,
  internal_slug, button_label, sort_order
)
VALUES (
  'Delta-Arb Bot',
  'Binance WebSocket → Polymarket 15m. Fires when BTC/ETH/SOL delta hits 0.15%+ while oracle lags. Same edge as $313→$438k bot.',
  '/income-streams/delta-arb-bot',
  'AI',
  'LATENCY EDGE + DELTA ARB',
  true, true,
  'Bot', 'NEW • SQI 2050', true,
  'delta-arb-bot',
  'Open Terminal',
  -2
)
ON CONFLICT (internal_slug) DO UPDATE SET
  link = '/income-streams/delta-arb-bot',
  is_active = true,
  is_visible = true;
