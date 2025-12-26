-- Create affiliate payout accounts table (for Stripe Connect)
CREATE TABLE public.affiliate_payout_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_connect_account_id TEXT,
  account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'restricted')),
  country TEXT,
  currency TEXT DEFAULT 'eur',
  payout_method TEXT NOT NULL DEFAULT 'bank' CHECK (payout_method IN ('bank', 'crypto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create affiliate payouts table (withdrawal history)
CREATE TABLE public.affiliate_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_shc NUMERIC NOT NULL,
  amount_eur NUMERIC NOT NULL,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank', 'crypto')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id TEXT,
  tx_signature TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.affiliate_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_payout_accounts
CREATE POLICY "Users can view own payout account"
ON public.affiliate_payout_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout account"
ON public.affiliate_payout_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payout account"
ON public.affiliate_payout_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for affiliate_payouts
CREATE POLICY "Users can view own payouts"
ON public.affiliate_payouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payouts"
ON public.affiliate_payouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payouts"
ON public.affiliate_payouts FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on affiliate_payout_accounts
CREATE TRIGGER update_affiliate_payout_accounts_updated_at
BEFORE UPDATE ON public.affiliate_payout_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();