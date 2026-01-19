-- Create vedic_astrology_tiers table
CREATE TABLE public.vedic_astrology_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level TEXT NOT NULL CHECK (tier_level IN ('basic', 'premium', 'master')),
  name TEXT NOT NULL,
  description TEXT,
  membership_required TEXT[] NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '[]',
  workspace_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_vedic_astrology_access table
CREATE TABLE public.user_vedic_astrology_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier_level TEXT NOT NULL CHECK (tier_level IN ('basic', 'premium', 'master')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_via_membership BOOLEAN DEFAULT false,
  UNIQUE(user_id, tier_level)
);

-- Add birth details columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT;

-- Enable RLS
ALTER TABLE public.vedic_astrology_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vedic_astrology_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vedic_astrology_tiers (public read)
CREATE POLICY "Anyone can view vedic astrology tiers"
ON public.vedic_astrology_tiers
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage vedic astrology tiers"
ON public.vedic_astrology_tiers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_vedic_astrology_access
CREATE POLICY "Users can view their own vedic access"
ON public.user_vedic_astrology_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage vedic access"
ON public.user_vedic_astrology_access
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert default tier data
INSERT INTO public.vedic_astrology_tiers (tier_level, name, description, membership_required, features, order_index) VALUES
('basic', 'Basic Vedic Reading', 'Daily planetary influences and basic guidance based on Vedic astrology principles.', 
 ARRAY['free', 'premium-monthly', 'premium-annual', 'lifetime'],
 '["Daily Nakshatra reading", "Planetary day ruler", "Basic do''s and don''ts", "Vedic wisdom quotes"]'::jsonb,
 1),
('premium', 'Premium Vedic Compass', 'Personalized guidance across career, relationships, health and finances based on your birth chart.',
 ARRAY['premium-monthly', 'premium-annual', 'lifetime'],
 '["Personalized daily guidance", "Career insights", "Relationship harmony", "Health recommendations", "Financial timing"]'::jsonb,
 2),
('master', 'Master Vedic Blueprint', 'Deep soul-level readings revealing karma patterns, life purpose, and optimal timing for major decisions.',
 ARRAY['lifetime'],
 '["Soul purpose analysis", "Karma pattern insights", "Strength & challenge mapping", "Timing peak predictions", "Detailed birth chart analysis"]'::jsonb,
 3);

-- Create indexes for performance
CREATE INDEX idx_user_vedic_access_user_id ON public.user_vedic_astrology_access(user_id);
CREATE INDEX idx_vedic_tiers_active ON public.vedic_astrology_tiers(is_active) WHERE is_active = true;