-- shreem_bot_members: per-user tier config and SOL balance
CREATE TABLE IF NOT EXISTS public.shreem_bot_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'atma_seeds',
  admin_cut_pct NUMERIC NOT NULL DEFAULT 70,
  wallet_address TEXT,
  sol_balance NUMERIC NOT NULL DEFAULT 0,
  total_earned_sol NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_bot_members TO authenticated;
GRANT ALL ON public.shreem_bot_members TO service_role;
ALTER TABLE public.shreem_bot_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own bot member" ON public.shreem_bot_members;
CREATE POLICY "Users view own bot member" ON public.shreem_bot_members
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage bot members" ON public.shreem_bot_members;
CREATE POLICY "Admins manage bot members" ON public.shreem_bot_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- shreem_mlm_tree: 5-level upline per user
CREATE TABLE IF NOT EXISTS public.shreem_mlm_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  level1_user_id UUID, level1_wallet TEXT,
  level2_user_id UUID, level2_wallet TEXT,
  level3_user_id UUID, level3_wallet TEXT,
  level4_user_id UUID, level4_wallet TEXT,
  level5_user_id UUID, level5_wallet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_mlm_tree TO authenticated;
GRANT ALL ON public.shreem_mlm_tree TO service_role;
ALTER TABLE public.shreem_mlm_tree ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own mlm tree" ON public.shreem_mlm_tree;
CREATE POLICY "Users view own mlm tree" ON public.shreem_mlm_tree
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage mlm tree" ON public.shreem_mlm_tree;
CREATE POLICY "Admins manage mlm tree" ON public.shreem_mlm_tree
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- shreem_profit_distributions: per-trade payout ledger
CREATE TABLE IF NOT EXISTS public.shreem_profit_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id BIGINT,
  user_id UUID NOT NULL,
  gross_pnl_sol NUMERIC NOT NULL,
  admin_cut_sol NUMERIC NOT NULL DEFAULT 0,
  user_cut_sol NUMERIC NOT NULL DEFAULT 0,
  l1_sol NUMERIC DEFAULT 0, l2_sol NUMERIC DEFAULT 0,
  l3_sol NUMERIC DEFAULT 0, l4_sol NUMERIC DEFAULT 0,
  l5_sol NUMERIC DEFAULT 0,
  l1_wallet TEXT, l2_wallet TEXT, l3_wallet TEXT, l4_wallet TEXT, l5_wallet TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_profit_distributions TO authenticated;
GRANT ALL ON public.shreem_profit_distributions TO service_role;
ALTER TABLE public.shreem_profit_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own distributions" ON public.shreem_profit_distributions;
CREATE POLICY "Users view own distributions" ON public.shreem_profit_distributions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage distributions" ON public.shreem_profit_distributions;
CREATE POLICY "Admins manage distributions" ON public.shreem_profit_distributions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- shreem_mlm_earnings: cumulative per-user MLM earnings
CREATE TABLE IF NOT EXISTS public.shreem_mlm_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  pending NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shreem_mlm_earnings TO authenticated;
GRANT ALL ON public.shreem_mlm_earnings TO service_role;
ALTER TABLE public.shreem_mlm_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own mlm earnings" ON public.shreem_mlm_earnings;
CREATE POLICY "Users view own mlm earnings" ON public.shreem_mlm_earnings
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage mlm earnings" ON public.shreem_mlm_earnings;
CREATE POLICY "Admins manage mlm earnings" ON public.shreem_mlm_earnings
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Increment helpers used by shreem-mlm-distributor
CREATE OR REPLACE FUNCTION public.increment_bot_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shreem_bot_members
  SET sol_balance = sol_balance + p_amount,
      total_earned_sol = total_earned_sol + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_mlm_earnings(p_user_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shreem_mlm_earnings
  SET total_earned = total_earned + p_amount,
      pending = pending + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
$$;