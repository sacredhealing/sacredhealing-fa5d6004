-- Create Vastu Abundance Architect Course
-- This course is available for Premium (monthly/yearly), Lifetime, and Admin users

INSERT INTO public.courses (
  title,
  description,
  category,
  difficulty_level,
  duration_hours,
  is_free,
  is_premium_only,
  is_published,
  price_usd,
  price_shc,
  has_certificate,
  instructor_name,
  language,
  cover_image_url
) VALUES (
  'Vastu Abundance Architect',
  'Transform your living space into a sanctuary of abundance through ancient Vastu wisdom and modern spatial design. This comprehensive 10-module course guides you through aligning your physical environment with cosmic energies to attract prosperity, health, and harmony.',
  'spiritual',
  'intermediate',
  20,
  false,
  true,
  true,
  0,
  0,
  true,
  'Sacred Healing Academy',
  'en',
  null
) ON CONFLICT DO NOTHING;

-- Note: Access control is handled via:
-- 1. is_premium_only = true (requires premium membership)
-- 2. Admin users get full access via useMembership hook
-- 3. Premium (monthly/yearly), Lifetime, and Admin users can access
