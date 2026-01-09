-- ============================================
-- Update Membership Tiers with Vedic Astrology Features
-- ============================================
-- Adds Vedic astrology access to membership tier features

-- Update Free tier
UPDATE public.membership_tiers
SET features = '["Daily meditation nudges", "3 free meditations", "Community access", "Basic breathing exercises", "Daily quotes", "Vedic Astrology Basic Access"]'::jsonb
WHERE slug = 'free';

-- Update Premium Monthly tier
UPDATE public.membership_tiers
SET features = '["Unlimited meditations", "All spiritual paths", "Premium courses", "1:1 chat support", "Exclusive live sessions", "Ad-free experience", "Progress tracking", "Vedic Astrology Premium Access"]'::jsonb
WHERE slug = 'premium-monthly';

-- Update Premium Annual tier
UPDATE public.membership_tiers
SET features = '["Everything in Monthly", "2 months free", "Early access to new content", "Annual healing report", "Priority support", "Vedic Astrology Premium Access"]'::jsonb
WHERE slug = 'premium-annual';

-- Update Lifetime tier
UPDATE public.membership_tiers
SET features = '["Everything in Annual", "Lifetime access", "All future updates included", "VIP community badge", "Direct practitioner access", "Free coaching session", "Vedic Astrology Master Access"]'::jsonb
WHERE slug = 'lifetime';

