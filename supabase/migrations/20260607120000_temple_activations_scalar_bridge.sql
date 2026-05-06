-- SQI 2050 — Scalar bridge columns (home GPS + computed vector)

ALTER TABLE public.temple_activations
  ADD COLUMN IF NOT EXISTS home_lat numeric,
  ADD COLUMN IF NOT EXISTS home_lng numeric,
  ADD COLUMN IF NOT EXISTS home_label text,
  ADD COLUMN IF NOT EXISTS scalar_vector jsonb;

COMMENT ON COLUMN public.temple_activations.scalar_vector IS
  'GPS-derived scalar bridge: carrierHz, binauralBeatHz, schumannHarmonic, bearingDeg, distanceKm, phaseAngle.';
COMMENT ON COLUMN public.temple_activations.home_lat IS 'User home latitude — physical anchor of scalar bridge.';
COMMENT ON COLUMN public.temple_activations.home_lng IS 'User home longitude — physical anchor of scalar bridge.';
