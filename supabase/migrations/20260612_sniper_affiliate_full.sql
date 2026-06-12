-- ═══════════════════════════════════════════════════════════════════
-- SQI Sovereign Sniper — Full Affiliate + Dashboard Integration
-- Mirrors CLAWBOT pattern exactly
-- Project: fjdzhrdpioxdeyyfogep
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. sniper_members (wallet + tier + mode) ───────────────────
CREATE TABLE IF NOT EXISTS sniper_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address   text,
  tier             text NOT NULL DEFAULT 'free',
  platform_fee_pct integer NOT NULL DEFAULT 63,
  balance          numeric(16,8) NOT NULL DEFAULT 0,
  total_earned     numeric(16,8) NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  paper_mode       boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sniper_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own sniper_members" ON sniper_members;
CREATE POLICY "Users own sniper_members"
  ON sniper_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins read sniper_members"
  ON sniper_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. sniper_trades (live ledger) ────────────────────────────
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
ALTER TABLE sniper_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read sniper_trades" ON sniper_trades;
DROP POLICY IF EXISTS "Service role writes sniper_trades" ON sniper_trades;
DROP POLICY IF EXISTS "Service role updates sniper_trades" ON sniper_trades;
DROP POLICY IF EXISTS "Users own their sniper_trades" ON sniper_trades;
-- Any authenticated user can read all trades (shared bot dashboard)
CREATE POLICY "Auth read sniper_trades"
  ON sniper_trades FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service insert sniper_trades"
  ON sniper_trades FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service update sniper_trades"
  ON sniper_trades FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─── 3. sniper_fee_ledger ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sniper_fee_ledger (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id     uuid REFERENCES sniper_trades(id) ON DELETE SET NULL,
  gross_pnl_sol numeric(16,8) NOT NULL,
  fee_pct      integer NOT NULL,
  fee_sol      numeric(16,8) NOT NULL,
  net_pnl_sol  numeric(16,8) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sniper_fee_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sniper_fee_ledger"
  ON sniper_fee_ledger FOR ALL USING (auth.uid() = user_id);

-- ─── 4. sniper_affiliate_rates (mirrors clawbot_affiliate_rates) ─
CREATE TABLE IF NOT EXISTS sniper_affiliate_rates (
  tier         text PRIMARY KEY,
  l1_pct       numeric NOT NULL,
  l2_pct       numeric NOT NULL,
  platform_pct numeric NOT NULL
);
INSERT INTO sniper_affiliate_rates (tier, l1_pct, l2_pct, platform_pct) VALUES
  ('free',             10, 3, 63),
  ('prana_flow',        8, 2, 35),
  ('siddha_quantum',    5, 1, 16),
  ('akasha_infinity',   3, 1,  9)
ON CONFLICT (tier) DO UPDATE SET
  l1_pct = EXCLUDED.l1_pct,
  l2_pct = EXCLUDED.l2_pct,
  platform_pct = EXCLUDED.platform_pct;
ALTER TABLE sniper_affiliate_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read sniper rates" ON sniper_affiliate_rates;
CREATE POLICY "Read sniper rates"
  ON sniper_affiliate_rates FOR SELECT TO authenticated, anon USING (true);
GRANT SELECT ON sniper_affiliate_rates TO authenticated, anon;

-- ─── 5. Extend affiliate_commissions for sniper trades ───────────
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS sniper_trade_id uuid REFERENCES sniper_fee_ledger(id) ON DELETE SET NULL;

-- ─── 6. Sniper commission function (mirrors clawbot pattern) ─────
CREATE OR REPLACE FUNCTION record_sniper_commission(
  p_trade_id   uuid,
  p_trader_id  uuid,
  p_gross_sol  numeric,
  p_fee_pct    integer
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_fee_sol      numeric;
  v_net_sol      numeric;
  v_fee_id       uuid;
  v_referred_by  text;
  v_l1_user_id   uuid;
  v_l1_code      text;
  v_l2_user_id   uuid;
  v_l1_pct       numeric;
  v_l2_pct       numeric;
  v_trader_tier  text;
BEGIN
  v_fee_sol := p_gross_sol * p_fee_pct / 100.0;
  v_net_sol  := p_gross_sol - v_fee_sol;

  -- Write fee ledger
  INSERT INTO sniper_fee_ledger (user_id, trade_id, gross_pnl_sol, fee_pct, fee_sol, net_pnl_sol)
  VALUES (p_trader_id, p_trade_id, p_gross_sol, p_fee_pct, v_fee_sol, v_net_sol)
  RETURNING id INTO v_fee_id;

  -- Get tier and referrer
  SELECT tier INTO v_trader_tier FROM sniper_members WHERE user_id = p_trader_id;
  SELECT referred_by INTO v_referred_by FROM profiles WHERE id = p_trader_id;
  IF v_referred_by IS NULL THEN RETURN; END IF;

  -- Get L1 affiliate rates
  SELECT l1_pct, l2_pct INTO v_l1_pct, v_l2_pct
  FROM sniper_affiliate_rates WHERE tier = COALESCE(v_trader_tier, 'free');

  -- L1 commission
  SELECT user_id INTO v_l1_user_id FROM affiliate_profiles WHERE affiliate_code = v_referred_by;
  IF v_l1_user_id IS NOT NULL AND v_l1_pct > 0 THEN
    INSERT INTO affiliate_commissions (
      affiliate_user_id, referred_user_id, gross_amount, commission_amount,
      currency, status, source, level, sniper_trade_id
    ) VALUES (
      v_l1_user_id, p_trader_id, p_gross_sol, p_gross_sol * v_l1_pct / 100.0,
      'SOL', 'pending', 'sniper_l1', 1, v_fee_id
    );
    UPDATE affiliate_profiles
    SET total_earnings = total_earnings + (p_gross_sol * v_l1_pct / 100.0),
        pending_balance = pending_balance + (p_gross_sol * v_l1_pct / 100.0)
    WHERE user_id = v_l1_user_id;
  END IF;

  -- L2 commission
  IF v_l2_pct > 0 THEN
    SELECT referred_by INTO v_l1_code FROM profiles WHERE id = v_l1_user_id;
    IF v_l1_code IS NOT NULL THEN
      SELECT user_id INTO v_l2_user_id FROM affiliate_profiles WHERE affiliate_code = v_l1_code;
      IF v_l2_user_id IS NOT NULL THEN
        INSERT INTO affiliate_commissions (
          affiliate_user_id, referred_user_id, gross_amount, commission_amount,
          currency, status, source, level, sniper_trade_id
        ) VALUES (
          v_l2_user_id, p_trader_id, p_gross_sol, p_gross_sol * v_l2_pct / 100.0,
          'SOL', 'pending', 'sniper_l2', 2, v_fee_id
        );
        UPDATE affiliate_profiles
        SET total_earnings = total_earnings + (p_gross_sol * v_l2_pct / 100.0),
            pending_balance = pending_balance + (p_gross_sol * v_l2_pct / 100.0)
        WHERE user_id = v_l2_user_id;
      END IF;
    END IF;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION record_sniper_commission TO service_role;

-- ─── 7. Update affiliate_total_earnings view to include sniper ───
CREATE OR REPLACE VIEW affiliate_total_earnings AS
SELECT
  ap.user_id,
  ap.affiliate_code,
  ap.total_earnings                                             AS subscription_earnings,
  COALESCE(SUM(ac.commission_amount) FILTER (
    WHERE ac.source IN ('trading_l1','trading_l2')
  ), 0)                                                         AS clawbot_earnings,
  COALESCE(SUM(ac.commission_amount) FILTER (
    WHERE ac.source IN ('sniper_l1','sniper_l2')
  ), 0)                                                         AS sniper_earnings,
  ap.total_earnings
    + COALESCE(SUM(ac.commission_amount) FILTER (
        WHERE ac.source IN ('trading_l1','trading_l2','sniper_l1','sniper_l2')
      ), 0)                                                     AS total_all_earnings,
  COUNT(ac.id) FILTER (WHERE ac.source = 'sniper_l1')          AS sniper_l1_count,
  COUNT(ac.id) FILTER (WHERE ac.source = 'sniper_l2')          AS sniper_l2_count
FROM affiliate_profiles ap
LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = ap.user_id
GROUP BY ap.user_id, ap.affiliate_code, ap.total_earnings;
GRANT SELECT ON affiliate_total_earnings TO authenticated;

-- ─── 8. income_streams card (exact columns from working migration) ─
INSERT INTO income_streams (
  title, description, link, category, tags,
  is_active, is_visible, stream_type, badge, new_badge,
  internal_slug, button_label, sort_order
) VALUES (
  'Sovereign Sniper',
  'Pump.fun memecoin sniper. 7 launchpads. 12-signal Gemini AI filter. Jito MEV. Dev wallet monitor. Start from 0.1 SOL.',
  '/income-streams/sniper-bot',
  'AI',
  'MEMECOIN SNIPER · SOLANA',
  true, true, 'Bot', 'NEW • SQI 2050', true,
  'sniper-bot', 'Open Sniper', -3
)
ON CONFLICT (internal_slug) DO UPDATE SET
  link        = '/income-streams/sniper-bot',
  is_active   = true,
  is_visible  = true,
  title       = 'Sovereign Sniper';
