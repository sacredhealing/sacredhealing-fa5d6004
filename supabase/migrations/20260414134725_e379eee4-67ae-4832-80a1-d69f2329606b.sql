
CREATE TABLE public.jyotish_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  moon_nakshatra TEXT,
  moon_longitude NUMERIC(8,4),
  nakshatra_progress NUMERIC(6,4),
  ephemeris_data JSONB,
  dasha_data JSONB,
  ephemeris_confirmed BOOLEAN DEFAULT FALSE,
  birth_date TEXT,
  birth_time TEXT,
  birth_place TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jyotish_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jyotish profile"
  ON public.jyotish_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jyotish profile"
  ON public.jyotish_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jyotish profile"
  ON public.jyotish_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on jyotish_profiles"
  ON public.jyotish_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_jyotish_ephemeris ON public.jyotish_profiles(user_id, ephemeris_confirmed);

CREATE TRIGGER update_jyotish_profiles_updated_at
  BEFORE UPDATE ON public.jyotish_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
