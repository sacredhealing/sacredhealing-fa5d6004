-- Adds retrograde status per planet, computed by sampling the same fallback
-- ephemeris formula at birth date and birth date + 1 day and checking the
-- sign of daily motion (see computeRetrogradeFlags in jyotish-ephemeris).
-- Sun and Moon are never retrograde and are excluded; Rahu/Ketu are always
-- retrograde by definition of lunar node motion and are hardcoded true
-- rather than computed.

ALTER TABLE public.jyotish_profiles
  ADD COLUMN IF NOT EXISTS retrograde_flags JSONB;

COMMENT ON COLUMN public.jyotish_profiles.retrograde_flags IS
  'Per-planet retrograde status at birth: {mars, mercury, jupiter, venus, saturn, rahu, ketu} -> boolean. Rahu/Ketu always true. Sun/Moon excluded (never retrograde).';
