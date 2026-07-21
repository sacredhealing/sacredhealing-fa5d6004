ALTER TABLE public.affiliate_profiles
  ADD COLUMN IF NOT EXISTS vanity_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_profiles_vanity_slug_unique
  ON public.affiliate_profiles (lower(vanity_slug))
  WHERE vanity_slug IS NOT NULL;

COMMENT ON COLUMN public.affiliate_profiles.vanity_slug IS
  'URL-safe, unique, lowercase slug derived from link_label. When set, /affiliate/r/:slug resolves to this affiliate the same as /affiliate/r/:affiliate_code — affiliate_code remains the permanent internal identifier used for attribution and commissions; vanity_slug is purely an alternate lookup path.';