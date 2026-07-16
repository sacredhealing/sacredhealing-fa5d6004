-- Adds the exact sidereal Ascendant degree (0-360°) alongside the existing
-- ascendant sign name. jyotish-ephemeris already computes this internally
-- (via VedAstro or the local Lahiri fallback) but previously discarded it
-- after deriving the sign — which meant no divisional chart (Navamsa D9,
-- Dasamsa D10, Saptamsa D7, Shashtiamsa D60) could compute its own Lagna,
-- only the planets' placements. Bhrigu Oracle needs this for a genuine
-- multidimensional reading rather than sign-only guesses.

ALTER TABLE public.jyotish_profiles
  ADD COLUMN IF NOT EXISTS ascendant_longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.jyotish_profiles.ascendant_longitude IS
  'Exact sidereal Ascendant (Lagna) longitude in degrees (0-360), Lahiri ayanamsha. Used to compute divisional-chart (varga) Lagnas — Navamsa, Dasamsa, Saptamsa, Shashtiamsa — not just the D1 sign.';
