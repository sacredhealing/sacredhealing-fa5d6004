-- ═══════════════════════════════════════════════════════════════
-- SHREEM BRZEE MLM SYSTEM — Full 5-Level Auto-Distribution
-- SQI 2050 Sovereign Wealth Engine
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Bot Members (per-user bot subscriptions) ────────────────
CREATE TABLE IF NOT EXISTS public.shreem_bot_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address      TEXT,
  tier                TEXT NOT NULL DEFAULT 'atma_seeds'
                      CHECK (tier IN ('atma_seeds','prana_flow','siddha_quantum','akasha_infinity','lifetime')),
  admin_cut_pct       INTEGER NOT NULL DEFAULT 70,
  is_active           BOOLEAN NOT NULL DEFAULT false,
  paper_mode          BOOLEAN NOT NULL DEFAULT true,
  sol_balance         NUMERIC(16,8) NOT NULL DEFAULT 0,
  total_earned_sol    NUMERIC(16,8) NOT NULL DEFAULT 0,
  total_paid_sol      NUMERIC(16,8) NOT NULL DEFAULT 0,
  affiliate_code_used TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.shreem_bot_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_bot_member" ON public.shreem_bot_members;
DROP POLICY IF EXISTS "service_write_bot_member" ON public.shreem_bot_members;
CREATE POLICY "users_own_bot_member"
  ON public.shreem_bot_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "service_write_bot_member"
  ON public.shreem_bot_members FOR ALL WITH CHECK (auth.role() = 'service_role');

-- ─── 2. MLM Upline Tree ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shreem_mlm_tree (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level1_user_id  UUID REFERENCES auth.users(id),
  level2_user_id  UUID REFERENCES auth.users(id),
  level3_user_id  UUID REFERENCES auth.users(id),
  level4_user_id  UUID REFERENCES auth.users(id),
  level5_user_id  UUID REFERENCES auth.users(id),
  level1_wallet   TEXT,
  level2_wallet   TEXT,
  level3_wallet   TEXT,
  level4_wallet   TEXT,
  level5_wallet   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.shreem_mlm_tree ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_tree" ON public.shreem_mlm_tree;
DROP POLICY IF EXISTS "service_write_tree" ON public.shreem_mlm_tree;
CREATE POLICY "users_read_own_tree"
  ON public.shreem_mlm_tree FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_write_tree"
  ON public.shreem_mlm_tree FOR ALL WITH CHECK (auth.role() = 'service_role');

-- ─── 3. Profit Distributions (every trade split) ─────────────────
CREATE TABLE IF NOT EXISTS public.shreem_profit_distributions (
  id            BIGSERIAL PRIMARY KEY,
  trade_id      BIGINT,
  user_id       UUID REFERENCES auth.users(id),
  gross_pnl_sol NUMERIC(16,8) NOT NULL DEFAULT 0,
  admin_cut_sol NUMERIC(16,8) NOT NULL DEFAULT 0,
  user_cut_sol  NUMERIC(16,8) NOT NULL DEFAULT 0,
  l1_sol        NUMERIC(16,8) NOT NULL DEFAULT 0,
  l2_sol        NUMERIC(16,8) NOT NULL DEFAULT 0,
  l3_sol        NUMERIC(16,8) NOT NULL DEFAULT 0,
  l4_sol        NUMERIC(16,8) NOT NULL DEFAULT 0,
  l5_sol        NUMERIC(16,8) NOT NULL DEFAULT 0,
  l1_wallet     TEXT,
  l2_wallet     TEXT,
  l3_wallet     TEXT,
  l4_wallet     TEXT,
  l5_wallet     TEXT,
  l1_tx_sig     TEXT,
  l2_tx_sig     TEXT,
  l3_tx_sig     TEXT,
  l4_tx_sig     TEXT,
  l5_tx_sig     TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','distributed','failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.shreem_profit_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_dist" ON public.shreem_profit_distributions;
DROP POLICY IF EXISTS "service_write_dist" ON public.shreem_profit_distributions;
CREATE POLICY "users_read_own_dist"
  ON public.shreem_profit_distributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_write_dist"
  ON public.shreem_profit_distributions FOR ALL WITH CHECK (auth.role() = 'service_role');
ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_profit_distributions;

-- ─── 4. MLM Earnings Ledger ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shreem_mlm_earnings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address TEXT,
  total_earned   NUMERIC(16,8) NOT NULL DEFAULT 0,
  total_paid     NUMERIC(16,8) NOT NULL DEFAULT 0,
  pending        NUMERIC(16,8) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.shreem_mlm_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_earnings" ON public.shreem_mlm_earnings;
DROP POLICY IF EXISTS "service_write_earnings" ON public.shreem_mlm_earnings;
CREATE POLICY "users_read_own_earnings"
  ON public.shreem_mlm_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_write_earnings"
  ON public.shreem_mlm_earnings FOR ALL WITH CHECK (auth.role() = 'service_role');
ALTER PUBLICATION supabase_realtime ADD TABLE public.shreem_mlm_earnings;

-- ─── 5. Resolve upline function ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.shreem_resolve_upline(
  p_user_id UUID, p_referrer_code TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_l1 UUID; v_l2 UUID; v_l3 UUID; v_l4 UUID; v_l5 UUID;
  v_l1w TEXT; v_l2w TEXT; v_l3w TEXT; v_l4w TEXT; v_l5w TEXT;
  v_referrer_id UUID;
BEGIN
  SELECT ap.user_id INTO v_referrer_id
  FROM affiliate_profiles ap WHERE ap.affiliate_code = p_referrer_code LIMIT 1;
  IF v_referrer_id IS NULL THEN RETURN; END IF;

  v_l1 := v_referrer_id;
  SELECT wallet_address INTO v_l1w FROM shreem_bot_members WHERE user_id = v_l1;

  SELECT level1_user_id INTO v_l2 FROM shreem_mlm_tree WHERE user_id = v_l1;
  IF v_l2 IS NOT NULL THEN SELECT wallet_address INTO v_l2w FROM shreem_bot_members WHERE user_id = v_l2; END IF;

  SELECT level1_user_id INTO v_l3 FROM shreem_mlm_tree WHERE user_id = v_l2;
  IF v_l3 IS NOT NULL THEN SELECT wallet_address INTO v_l3w FROM shreem_bot_members WHERE user_id = v_l3; END IF;

  SELECT level1_user_id INTO v_l4 FROM shreem_mlm_tree WHERE user_id = v_l3;
  IF v_l4 IS NOT NULL THEN SELECT wallet_address INTO v_l4w FROM shreem_bot_members WHERE user_id = v_l4; END IF;

  SELECT level1_user_id INTO v_l5 FROM shreem_mlm_tree WHERE user_id = v_l4;
  IF v_l5 IS NOT NULL THEN SELECT wallet_address INTO v_l5w FROM shreem_bot_members WHERE user_id = v_l5; END IF;

  INSERT INTO shreem_mlm_tree (
    user_id, level1_user_id, level2_user_id, level3_user_id, level4_user_id, level5_user_id,
    level1_wallet, level2_wallet, level3_wallet, level4_wallet, level5_wallet
  ) VALUES (
    p_user_id, v_l1, v_l2, v_l3, v_l4, v_l5, v_l1w, v_l2w, v_l3w, v_l4w, v_l5w
  ) ON CONFLICT (user_id) DO UPDATE SET
    level1_user_id = v_l1, level2_user_id = v_l2, level3_user_id = v_l3,
    level4_user_id = v_l4, level5_user_id = v_l5,
    level1_wallet = v_l1w, level2_wallet = v_l2w, level3_wallet = v_l3w,
    level4_wallet = v_l4w, level5_wallet = v_l5w;

  INSERT INTO shreem_mlm_earnings (user_id, wallet_address)
  SELECT u, w FROM (VALUES (v_l1,v_l1w),(v_l2,v_l2w),(v_l3,v_l3w),(v_l4,v_l4w),(v_l5,v_l5w)) t(u,w)
  WHERE u IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

SELECT 'Shreem MLM schema ready' AS status;
