-- SQI 2050 Sovereign Transmission Network — Affiliate System

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  stripe_connect_id TEXT,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_out DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(6,4) NOT NULL DEFAULT 0.3000,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  bank_details JSONB,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','completed','failed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_aff ON public.affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_session ON public.affiliate_commissions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_user ON public.affiliate_payout_requests(affiliate_user_id);

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_profiles_select_own" ON public.affiliate_profiles;
DROP POLICY IF EXISTS "affiliate_profiles_update_own" ON public.affiliate_profiles;
DROP POLICY IF EXISTS "affiliate_profiles_public_code_check" ON public.affiliate_profiles;
DROP POLICY IF EXISTS "affiliate_profiles_admin_all" ON public.affiliate_profiles;

CREATE POLICY "affiliate_profiles_select_own" ON public.affiliate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "affiliate_profiles_update_own" ON public.affiliate_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "affiliate_profiles_public_code_check" ON public.affiliate_profiles FOR SELECT USING (true);
CREATE POLICY "affiliate_profiles_admin_all" ON public.affiliate_profiles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "affiliate_commissions_select_own" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "affiliate_commissions_admin_all" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_select_own" ON public.affiliate_commissions FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "affiliate_commissions_admin_all" ON public.affiliate_commissions FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "affiliate_payouts_insert_own" ON public.affiliate_payout_requests;
DROP POLICY IF EXISTS "affiliate_payouts_select_own" ON public.affiliate_payout_requests;
DROP POLICY IF EXISTS "affiliate_payouts_admin_all" ON public.affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_insert_own" ON public.affiliate_payout_requests FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);
CREATE POLICY "affiliate_payouts_select_own" ON public.affiliate_payout_requests FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "affiliate_payouts_admin_all" ON public.affiliate_payout_requests FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.generate_sqi_affiliate_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_code TEXT; is_taken BOOLEAN;
BEGIN
  LOOP
    new_code := 'SQI' || upper(substring(replace(gen_random_uuid()::text,'-',''),1,4))
                      || upper(substring(replace(gen_random_uuid()::text,'-',''),1,4));
    SELECT EXISTS(SELECT 1 FROM public.affiliate_profiles WHERE affiliate_code = new_code) INTO is_taken;
    EXIT WHEN NOT is_taken;
  END LOOP;
  RETURN new_code;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_affiliate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
  VALUES (NEW.id, public.generate_sqi_affiliate_code())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;
CREATE TRIGGER on_auth_user_created_affiliate
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_affiliate();

DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
    VALUES (u.id, public.generate_sqi_affiliate_code())
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END; $$;

DROP TRIGGER IF EXISTS trg_affiliate_profiles_updated_at ON public.affiliate_profiles;
DROP TRIGGER IF EXISTS trg_affiliate_commissions_updated_at ON public.affiliate_commissions;
DROP TRIGGER IF EXISTS trg_affiliate_payouts_updated_at ON public.affiliate_payout_requests;

CREATE TRIGGER trg_affiliate_profiles_updated_at BEFORE UPDATE ON public.affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_affiliate_payouts_updated_at BEFORE UPDATE ON public.affiliate_payout_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin overview view (joins profiles via user_id; profiles has no email column)
CREATE OR REPLACE VIEW public.admin_affiliate_overview AS
SELECT
  ap.affiliate_code,
  p.full_name,
  ap.total_earnings,
  ap.pending_balance,
  ap.paid_out,
  ap.currency,
  COUNT(ac.id) AS total_conversions,
  COALESCE(SUM(ac.gross_amount),0) AS total_gross_revenue,
  ap.created_at
FROM public.affiliate_profiles ap
LEFT JOIN public.profiles p ON p.user_id = ap.user_id
LEFT JOIN public.affiliate_commissions ac ON ac.affiliate_user_id = ap.user_id
GROUP BY ap.id, p.full_name
ORDER BY ap.total_earnings DESC;