-- Create table for user SHC balances (in-app)
CREATE TABLE public.user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(18, 6) NOT NULL DEFAULT 0,
  total_earned DECIMAL(18, 6) NOT NULL DEFAULT 0,
  total_spent DECIMAL(18, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for connected wallets
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'phantom',
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_address)
);

-- Create table for SHC transactions
CREATE TABLE public.shc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'withdrawal', 'deposit')),
  amount DECIMAL(18, 6) NOT NULL,
  description TEXT NOT NULL,
  tx_signature TEXT,
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shc_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_balances
CREATE POLICY "Users can view their own balance"
ON public.user_balances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance"
ON public.user_balances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance"
ON public.user_balances FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for user_wallets
CREATE POLICY "Users can view their own wallets"
ON public.user_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can connect their own wallets"
ON public.user_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
ON public.user_wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
ON public.user_wallets FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for shc_transactions
CREATE POLICY "Users can view their own transactions"
ON public.shc_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();