-- The jyotish-ephemeris function already computes sidereal longitudes for all
-- 9 grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) for
-- ACG line rendering, but was only persisting sun_sign/mars_sign — meaning no
-- full Rasi (D1) chart could ever be rendered for a user. This stores the raw
-- longitudes so the frontend can derive sign/house/nakshatra for any graha
-- without another ephemeris round-trip.
ALTER TABLE public.jyotish_profiles
  ADD COLUMN IF NOT EXISTS planet_longitudes jsonb;

COMMENT ON COLUMN public.jyotish_profiles.planet_longitudes IS
  'Sidereal longitudes (Lahiri ayanamsa, degrees 0-360) for sun, moon, mars, mercury, jupiter, venus, saturn, rahu, ketu — as computed by jyotish-ephemeris. Used to render the full Rasi (D1) chart.';
