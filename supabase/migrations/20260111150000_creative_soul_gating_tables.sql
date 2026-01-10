-- ============================================
-- Creative Soul Gating Tables
-- ============================================
-- Minimal tables for demo tracking and entitlement management
-- Audio processing happens in external worker, NOT in Edge Functions

-- Create creative_soul_usage table (tracks demo usage)
CREATE TABLE IF NOT EXISTS public.creative_soul_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_used BOOLEAN NOT NULL DEFAULT false,
  demo_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_creative_soul_usage_user ON public.creative_soul_usage(user_id);

-- Enable RLS
ALTER TABLE public.creative_soul_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.creative_soul_usage FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update usage (via Edge Function)
CREATE POLICY "Service can manage usage"
ON public.creative_soul_usage FOR ALL
WITH CHECK (true);

-- Create creative_soul_entitlements table (tracks paid access)
CREATE TABLE IF NOT EXISTS public.creative_soul_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT false,
  plan TEXT, -- e.g., 'one_time_149', 'subscription_monthly', 'per_track'
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  purchased_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_creative_soul_entitlements_user ON public.creative_soul_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_soul_entitlements_access ON public.creative_soul_entitlements(has_access) WHERE has_access = true;

-- Enable RLS
ALTER TABLE public.creative_soul_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements"
ON public.creative_soul_entitlements FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage entitlements (via Edge Function/Webhook)
CREATE POLICY "Service can manage entitlements"
ON public.creative_soul_entitlements FOR ALL
WITH CHECK (true);

-- Add updated_at trigger for creative_soul_usage
CREATE TRIGGER update_creative_soul_usage_updated_at
  BEFORE UPDATE ON public.creative_soul_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for creative_soul_entitlements
CREATE TRIGGER update_creative_soul_entitlements_updated_at
  BEFORE UPDATE ON public.creative_soul_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

