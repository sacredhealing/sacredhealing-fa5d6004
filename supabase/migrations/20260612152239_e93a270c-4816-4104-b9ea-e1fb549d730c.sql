
-- ============ 1. sniper_members ============
CREATE TABLE IF NOT EXISTS public.sniper_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_address text,
  tier text NOT NULL DEFAULT 'free',
  platform_fee_pct integer NOT NULL DEFAULT 63,
  balance numeric(16,8) NOT NULL DEFAULT 0,
  total_earned numeric(16,8) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  paper_mode boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sniper_members TO authenticated;
GRANT ALL ON public.sniper_members TO service_role;
ALTER TABLE public.sniper_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sniper_members" ON public.sniper_members;
CREATE POLICY "Users manage own sniper_members" ON public.sniper_members
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full sniper_members" ON public.sniper_members;
CREATE POLICY "Service role full sniper_members" ON public.sniper_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 2. sniper_trades ============
CREATE TABLE IF NOT EXISTS public.sniper_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mint text NOT NULL,
  symbol text,
  launchpad text NOT NULL DEFAULT 'pump_fun',
  action text NOT NULL DEFAULT 'SNIPE_ENTRY',
  size_sol numeric(12,8),
  entry_price numeric(18,12),
  exit_price numeric(18,12),
  multiplier_x numeric(10,4) DEFAULT 1,
  pnl_sol numeric(16,8) DEFAULT 0,
  ai_score integer,
  rug_score integer,
  status text NOT NULL DEFAULT 'open',
  mode text NOT NULL DEFAULT 'PAPER',
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT ON public.sniper_trades TO authenticated;
GRANT ALL ON public.sniper_trades TO service_role;
ALTER TABLE public.sniper_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read sniper_trades" ON public.sniper_trades;
CREATE POLICY "Authenticated read sniper_trades" ON public.sniper_trades
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role write sniper_trades" ON public.sniper_trades;
CREATE POLICY "Service role write sniper_trades" ON public.sniper_trades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 3. sniper_fee_ledger ============
CREATE TABLE IF NOT EXISTS public.sniper_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id uuid REFERENCES public.sniper_trades(id) ON DELETE SET NULL,
  tier text NOT NULL,
  gross_sol numeric(16,8) NOT NULL DEFAULT 0,
  fee_sol numeric(16,8) NOT NULL DEFAULT 0,
  net_sol numeric(16,8) NOT NULL DEFAULT 0,
  fee_pct integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sniper_fee_ledger TO authenticated;
GRANT ALL ON public.sniper_fee_ledger TO service_role;
ALTER TABLE public.sniper_fee_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own sniper_fee_ledger" ON public.sniper_fee_ledger;
CREATE POLICY "Users read own sniper_fee_ledger" ON public.sniper_fee_ledger
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full sniper_fee_ledger" ON public.sniper_fee_ledger;
CREATE POLICY "Service role full sniper_fee_ledger" ON public.sniper_fee_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 4. sniper_affiliate_rates ============
CREATE TABLE IF NOT EXISTS public.sniper_affiliate_rates (
  tier text PRIMARY KEY,
  l1_pct numeric(5,2) NOT NULL,
  l2_pct numeric(5,2) NOT NULL,
  fee_pct integer NOT NULL,
  you_keep integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sniper_affiliate_rates TO anon, authenticated;
GRANT ALL ON public.sniper_affiliate_rates TO service_role;
ALTER TABLE public.sniper_affiliate_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sniper_affiliate_rates" ON public.sniper_affiliate_rates;
CREATE POLICY "Public read sniper_affiliate_rates" ON public.sniper_affiliate_rates
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role write sniper_affiliate_rates" ON public.sniper_affiliate_rates;
CREATE POLICY "Service role write sniper_affiliate_rates" ON public.sniper_affiliate_rates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.sniper_affiliate_rates (tier, l1_pct, l2_pct, fee_pct, you_keep) VALUES
  ('free', 10.00, 3.00, 63, 37),
  ('prana_flow', 8.00, 2.00, 35, 65),
  ('siddha_quantum', 5.00, 1.00, 16, 84),
  ('akasha_infinity', 3.00, 1.00, 9, 91)
ON CONFLICT (tier) DO UPDATE SET
  l1_pct=EXCLUDED.l1_pct, l2_pct=EXCLUDED.l2_pct,
  fee_pct=EXCLUDED.fee_pct, you_keep=EXCLUDED.you_keep, updated_at=now();

-- ============ 5. record_sniper_commission() ============
CREATE OR REPLACE FUNCTION public.record_sniper_commission(
  _user_id uuid,
  _trade_id uuid,
  _fee_sol numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l1_user uuid;
  l2_user uuid;
  l1_rate numeric;
  l2_rate numeric;
  trader_tier text;
BEGIN
  SELECT tier INTO trader_tier FROM public.sniper_members WHERE user_id = _user_id;
  IF trader_tier IS NULL THEN trader_tier := 'free'; END IF;

  SELECT l1_pct, l2_pct INTO l1_rate, l2_rate
  FROM public.sniper_affiliate_rates WHERE tier = trader_tier;

  SELECT referred_by INTO l1_user FROM public.profiles WHERE user_id = _user_id;
  IF l1_user IS NOT NULL AND l1_rate > 0 THEN
    INSERT INTO public.affiliate_commissions
      (affiliate_user_id, referred_user_id, gross_amount, commission_amount,
       commission_rate, currency, status, source, level)
    VALUES (l1_user, _user_id, _fee_sol, _fee_sol * l1_rate / 100,
            l1_rate / 100, 'SOL', 'pending', 'sniper', 1);

    SELECT referred_by INTO l2_user FROM public.profiles WHERE user_id = l1_user;
    IF l2_user IS NOT NULL AND l2_rate > 0 THEN
      INSERT INTO public.affiliate_commissions
        (affiliate_user_id, referred_user_id, gross_amount, commission_amount,
         commission_rate, currency, status, source, level)
      VALUES (l2_user, _user_id, _fee_sol, _fee_sol * l2_rate / 100,
              l2_rate / 100, 'SOL', 'pending', 'sniper', 2);
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.record_sniper_commission(uuid, uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_sniper_commission(uuid, uuid, numeric) TO service_role;

-- ============ 6. affiliate_total_earnings view ============
DROP VIEW IF EXISTS public.affiliate_total_earnings;
CREATE VIEW public.affiliate_total_earnings AS
SELECT
  ac.affiliate_user_id AS user_id,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.source='clawbot'), 0) AS clawbot_earnings,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.source='sniper'), 0) AS sniper_earnings,
  COALESCE(COUNT(DISTINCT ac.referred_user_id) FILTER (WHERE ac.source='sniper' AND ac.level=1), 0) AS sniper_l1_referrals,
  COALESCE(COUNT(DISTINCT ac.referred_user_id) FILTER (WHERE ac.source='sniper' AND ac.level=2), 0) AS sniper_l2_referrals,
  COALESCE(SUM(ac.commission_amount), 0) AS total_earnings
FROM public.affiliate_commissions ac
GROUP BY ac.affiliate_user_id;
GRANT SELECT ON public.affiliate_total_earnings TO authenticated, service_role;

-- ============ 7. income_streams card ============
INSERT INTO public.income_streams
  (title, description, link, internal_slug, is_active, order_index,
   icon_name, badge_text, color_from, color_to, category)
VALUES
  ('Sovereign Sniper',
   'Pump.fun memecoin sniper. 7 launchpads. 12-signal Gemini AI filter. Jito MEV. Dev wallet monitor. Start from 0.1 SOL.',
   '/income-streams/sniper-bot',
   'sniper-bot',
   true, -3,
   'Crosshair', 'NEW', 'amber-500', 'orange-600', 'trading')
ON CONFLICT DO NOTHING;
