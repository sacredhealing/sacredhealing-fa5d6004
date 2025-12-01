-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_affiliate_earnings NUMERIC DEFAULT 0;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- Update existing profiles with referral codes
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- Update handle_new_user to include referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, referral_code)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', public.generate_referral_code());
  
  INSERT INTO public.user_balances (user_id, balance, total_earned)
  VALUES (new.id, 50, 50);
  
  INSERT INTO public.shc_transactions (user_id, type, amount, description, status)
  VALUES (new.id, 'earned', 50, 'Welcome bonus', 'completed');
  
  RETURN new;
END;
$$;

-- Create affiliate_earnings table to track commissions
CREATE TABLE public.affiliate_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  purchase_type TEXT NOT NULL, -- 'signup', 'course', 'music', 'healing_audio', 'meditation'
  purchase_id UUID,
  purchase_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.30,
  commission_shc INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate earnings"
ON public.affiliate_earnings
FOR SELECT
USING (auth.uid() = affiliate_user_id);

-- Create referral_signups table to track who referred whom
CREATE TABLE public.referral_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  signup_bonus_shc INTEGER NOT NULL DEFAULT 100,
  referred_bonus_shc INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referral_signups
FOR SELECT
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can insert referral signups"
ON public.referral_signups
FOR INSERT
TO authenticated
WITH CHECK (true);