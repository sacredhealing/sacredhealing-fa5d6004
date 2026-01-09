-- ============================================
-- Add Birth Details to User Profiles
-- ============================================
-- Stores user birth information for Vedic astrology calculations

-- Add birth details columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS birth_place_coords POINT; -- For accurate timezone calculations

-- Create index for birth details queries
CREATE INDEX IF NOT EXISTS idx_profiles_birth_details 
  ON public.profiles(birth_date, birth_time) 
  WHERE birth_date IS NOT NULL AND birth_time IS NOT NULL;

COMMENT ON COLUMN public.profiles.birth_name IS 'Full name at birth for Vedic astrology calculations';
COMMENT ON COLUMN public.profiles.birth_date IS 'Date of birth (required for Vedic chart calculation)';
COMMENT ON COLUMN public.profiles.birth_time IS 'Time of birth (required for accurate chart calculation)';
COMMENT ON COLUMN public.profiles.birth_place IS 'Place of birth (city, country)';
COMMENT ON COLUMN public.profiles.birth_place_coords IS 'Geographic coordinates of birth place for accurate calculations';

