ALTER TABLE public.affiliate_profiles
  ADD COLUMN IF NOT EXISTS link_label text;

COMMENT ON COLUMN public.affiliate_profiles.link_label IS
  'Optional custom display name the affiliate sets for their referral link (shown on the /affiliate/r/:code landing page instead of their account name).';