-- Fix Adam (admin) birth data: correct DOB to 1983-07-15, Uddevalla Sweden, 14:42
UPDATE profiles
SET
  birth_date  = '1983-07-15',
  birth_time  = '14:42',
  birth_place = 'Uddevalla, Sweden',
  birth_name  = COALESCE(NULLIF(birth_name, ''), 'Adam Gil Lazaro')
WHERE user_id = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';

-- Also clear cached ephemeris so it recalculates fresh
UPDATE jyotish_profiles
SET
  moon_nakshatra      = NULL,
  dasha_data          = NULL,
  ephemeris_confirmed = FALSE,
  ephemeris_data      = NULL
WHERE user_id = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
