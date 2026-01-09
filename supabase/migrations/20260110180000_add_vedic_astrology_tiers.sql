-- ============================================
-- Add Vedic Astrology Tiers to Membership
-- ============================================
-- Integrates 3 tiers of Vedic astrology with existing membership levels

-- Create vedic_astrology_tiers table
CREATE TABLE IF NOT EXISTS public.vedic_astrology_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level TEXT NOT NULL UNIQUE CHECK (tier_level IN ('basic', 'premium', 'master')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  membership_required TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  workspace_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_vedic_astrology_access table to track user access
CREATE TABLE IF NOT EXISTS public.user_vedic_astrology_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_level TEXT NOT NULL REFERENCES public.vedic_astrology_tiers(tier_level) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_via_membership BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, tier_level)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vedic_astrology_tiers_level ON public.vedic_astrology_tiers(tier_level, is_active);
CREATE INDEX IF NOT EXISTS idx_user_vedic_access_user_id ON public.user_vedic_astrology_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vedic_access_tier ON public.user_vedic_astrology_access(tier_level);

-- Enable RLS
ALTER TABLE public.vedic_astrology_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vedic_astrology_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vedic_astrology_tiers
CREATE POLICY "Anyone can view active vedic astrology tiers"
ON public.vedic_astrology_tiers FOR SELECT
USING (is_active = true);

-- RLS Policies for user_vedic_astrology_access
CREATE POLICY "Users can view own vedic astrology access"
ON public.user_vedic_astrology_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can grant vedic astrology access"
ON public.user_vedic_astrology_access FOR INSERT
WITH CHECK (true);

-- Insert Vedic Astrology Tiers
INSERT INTO public.vedic_astrology_tiers (
  tier_level,
  name,
  description,
  membership_required,
  features,
  workspace_url,
  order_index
) VALUES
(
  'basic',
  'Vedic Astrology Basic',
  'Discover your birth chart fundamentals and planetary influences',
  ARRAY['free', 'premium-monthly', 'premium-annual', 'lifetime']::TEXT[],
  '[
    "Basic birth chart reading",
    "Planetary positions & signs",
    "Essential planetary influences",
    "Basic compatibility check",
    "Monthly transit updates"
  ]'::jsonb,
  'https://sacredhealing.lovable.app/app/vedic-basic',
  1
),
(
  'premium',
  'Vedic Astrology Premium',
  'Deep dive into your cosmic blueprint with detailed analysis',
  ARRAY['premium-monthly', 'premium-annual', 'lifetime']::TEXT[],
  '[
    "Everything in Basic",
    "Detailed birth chart analysis",
    "Dasha & Mahadasha periods",
    "Remedial suggestions (gemstones, mantras)",
    "Relationship compatibility analysis",
    "Career & life path guidance",
    "Monthly personalized forecasts",
    "Priority chart reading requests"
  ]'::jsonb,
  'https://sacredhealing.lovable.app/app/vedic-premium',
  2
),
(
  'master',
  'Vedic Astrology Master',
  'Complete cosmic wisdom with ongoing guidance and consultations',
  ARRAY['lifetime']::TEXT[],
  '[
    "Everything in Premium",
    "Advanced chart analysis (Nakshatras, Yogas)",
    "Yearly detailed forecast",
    "Muhurta (auspicious timing) guidance",
    "Personalized remedies & rituals",
    "Quarterly 1-on-1 consultation",
    "Lifetime updates & revisions",
    "Exclusive Vedic wisdom library",
    "Direct access to Vedic astrologer"
  ]'::jsonb,
  'https://sacredhealing.lovable.app/app/vedic-master',
  3
)
ON CONFLICT (tier_level) DO NOTHING;

-- Create trigger function to auto-grant Vedic astrology access based on membership
CREATE OR REPLACE FUNCTION grant_vedic_astrology_access()
RETURNS TRIGGER AS $$
DECLARE
  user_tier_slug TEXT;
  eligible_tiers TEXT[];
BEGIN
  -- Only process if membership is active
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Get user's current membership tier
  SELECT mt.slug INTO user_tier_slug
  FROM public.user_memberships um
  JOIN public.membership_tiers mt ON um.tier_id = mt.id
  WHERE um.user_id = NEW.user_id
    AND um.status = 'active'
  ORDER BY um.current_period_end DESC NULLS LAST, um.created_at DESC
  LIMIT 1;

  -- If no active membership found, check if user exists and grant free tier
  IF user_tier_slug IS NULL THEN
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
      user_tier_slug := 'free';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Grant access to all eligible Vedic astrology tiers based on membership
  INSERT INTO public.user_vedic_astrology_access (user_id, tier_level, granted_via_membership)
  SELECT NEW.user_id, vat.tier_level, true
  FROM public.vedic_astrology_tiers vat
  WHERE vat.is_active = true
    AND user_tier_slug = ANY(vat.membership_required)
  ON CONFLICT (user_id, tier_level) 
  DO UPDATE SET 
    granted_via_membership = true,
    granted_at = CASE 
      WHEN user_vedic_astrology_access.granted_at IS NULL THEN now()
      ELSE user_vedic_astrology_access.granted_at
    END,
    expires_at = CASE 
      WHEN NEW.current_period_end IS NOT NULL THEN NEW.current_period_end
      ELSE user_vedic_astrology_access.expires_at
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_memberships to auto-grant Vedic access
DROP TRIGGER IF EXISTS trigger_grant_vedic_access ON public.user_memberships;
CREATE TRIGGER trigger_grant_vedic_access
  AFTER INSERT OR UPDATE ON public.user_memberships
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION grant_vedic_astrology_access();

-- Backfill: Grant Vedic astrology access to existing active memberships
DO $$
DECLARE
  user_record RECORD;
  user_tier_slug TEXT;
BEGIN
  -- Grant access based on active memberships
  FOR user_record IN 
    SELECT DISTINCT um.user_id, mt.slug as tier_slug
    FROM public.user_memberships um
    JOIN public.membership_tiers mt ON um.tier_id = mt.id
    WHERE um.status = 'active'
  LOOP
    user_tier_slug := user_record.tier_slug;

    -- Grant access to eligible Vedic astrology tiers
    INSERT INTO public.user_vedic_astrology_access (user_id, tier_level, granted_via_membership)
    SELECT user_record.user_id, vat.tier_level, true
    FROM public.vedic_astrology_tiers vat
    WHERE vat.is_active = true
      AND user_tier_slug = ANY(vat.membership_required)
    ON CONFLICT (user_id, tier_level) DO NOTHING;
  END LOOP;

  -- Grant basic access to all existing users (free tier default)
  INSERT INTO public.user_vedic_astrology_access (user_id, tier_level, granted_via_membership)
  SELECT DISTINCT u.id, 'basic', true
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_vedic_astrology_access uva
    WHERE uva.user_id = u.id AND uva.tier_level = 'basic'
  )
  ON CONFLICT (user_id, tier_level) DO NOTHING;
END $$;

COMMENT ON TABLE public.vedic_astrology_tiers IS 'Vedic astrology access tiers mapped to membership levels';
COMMENT ON TABLE public.user_vedic_astrology_access IS 'Tracks user access to Vedic astrology features based on membership tier';

