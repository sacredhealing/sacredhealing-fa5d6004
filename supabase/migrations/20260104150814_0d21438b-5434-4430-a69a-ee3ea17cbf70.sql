-- Update membership_tiers with new pricing structure and Stripe price IDs
ALTER TABLE public.membership_tiers ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.membership_tiers ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Clear existing tiers and insert new structure
DELETE FROM public.membership_tiers;

INSERT INTO public.membership_tiers (name, slug, description, price_eur, billing_interval, features, order_index, is_active, stripe_price_id, stripe_product_id) VALUES
('Free', 'free', 'Get started with basic spiritual practices', 0, NULL, '["Daily meditation nudges", "3 free meditations", "Community access", "Basic breathing exercises", "Daily quotes"]', 0, true, NULL, NULL),
('Premium Monthly', 'premium-monthly', 'Full access to your spiritual journey', 19.99, 'month', '["Unlimited meditations", "All spiritual paths", "Premium courses", "1:1 chat support", "Exclusive live sessions", "Ad-free experience", "Progress tracking"]', 1, true, 'price_1SlstvAPsnbrivP03oArv1O5', 'prod_TjLbPzCXMYBGOj'),
('Premium Annual', 'premium-annual', 'Best value - Save €119.88/year', 120, 'year', '["Everything in Monthly", "2 months free", "Early access to new content", "Annual healing report", "Priority support"]', 2, true, 'price_1Slsu8APsnbrivP086cSSiWd', 'prod_TjLb4I9DVWijtL'),
('Lifetime', 'lifetime', 'One-time payment, forever access', 449, NULL, '["Everything in Annual", "Lifetime access", "All future updates included", "VIP community badge", "Direct practitioner access", "Free coaching session"]', 3, true, 'price_1SlsuKAPsnbrivP0f5gHTBnR', 'prod_TjLb4aw139HcPU');

-- Create user_memberships table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tier_id UUID REFERENCES public.membership_tiers(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.user_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.user_memberships;

-- Create RLS policies
CREATE POLICY "Users can view their own membership" 
ON public.user_memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own membership" 
ON public.user_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
ON public.user_memberships 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON public.user_memberships(status);