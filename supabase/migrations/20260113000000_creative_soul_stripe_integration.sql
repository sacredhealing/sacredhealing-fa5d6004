-- Profiles (role-based: admin/user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Entitlements for Creative Soul tool access
CREATE TABLE IF NOT EXISTS public.creative_soul_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT false,
  plan TEXT, -- 'lifetime' | 'monthly' | 'single'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT, -- 'active'|'canceled'|'past_due'|'unpaid'|'incomplete' etc
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coins wallet
CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track coin awards so we never double-credit
CREATE TABLE IF NOT EXISTS public.coin_awards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'creative_soul_purchase'
  stripe_object_id TEXT NOT NULL, -- session_id or subscription_id
  coins INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, stripe_object_id)
);

-- Affiliate attribution (store first ref)
CREATE TABLE IF NOT EXISTS public.affiliate_attribution (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: tool-level affiliate events (all tools)
CREATE TABLE IF NOT EXISTS public.affiliate_events (
  id BIGSERIAL PRIMARY KEY,
  ref_code TEXT,
  user_id UUID,
  tool_slug TEXT, -- e.g. 'creative-soul'
  event_type TEXT, -- 'visit'|'checkout'|'purchase'
  stripe_object_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for creative_soul_entitlements
ALTER TABLE public.creative_soul_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlements"
  ON public.creative_soul_entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entitlements"
  ON public.creative_soul_entitlements FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for user_wallet
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON public.user_wallet FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallet"
  ON public.user_wallet FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for coin_awards (read-only for users)
ALTER TABLE public.coin_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coin awards"
  ON public.coin_awards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage coin awards"
  ON public.coin_awards FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for affiliate_attribution
ALTER TABLE public.affiliate_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attribution"
  ON public.affiliate_attribution FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage attribution"
  ON public.affiliate_attribution FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for affiliate_events (read-only for users)
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate events"
  ON public.affiliate_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage affiliate events"
  ON public.affiliate_events FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creative_soul_entitlements_user_id ON public.creative_soul_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_soul_entitlements_stripe_customer ON public.creative_soul_entitlements(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_coin_awards_user_source ON public.coin_awards(user_id, source);
CREATE INDEX IF NOT EXISTS idx_coin_awards_stripe_object ON public.coin_awards(source, stripe_object_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_ref ON public.affiliate_events(ref_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_events_user ON public.affiliate_events(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_soul_entitlements_updated_at
  BEFORE UPDATE ON public.creative_soul_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallet_updated_at
  BEFORE UPDATE ON public.user_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verification query (optional - remove in production)
DO $$
BEGIN
  RAISE NOTICE 'Creative Soul Stripe Integration tables created successfully';
END $$;

