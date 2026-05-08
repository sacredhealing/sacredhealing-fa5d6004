-- Add pilgrimage home GPS columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_label TEXT;

-- Create virtual pilgrimage activations table
CREATE TABLE IF NOT EXISTS public.virtual_pilgrimage_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  home_lat NUMERIC NOT NULL,
  home_lng NUMERIC NOT NULL,
  home_label TEXT,
  carrier_hz NUMERIC NOT NULL,
  binaural_hz NUMERIC NOT NULL,
  bearing_deg NUMERIC NOT NULL,
  distance_km NUMERIC NOT NULL,
  schumann_lock_hz NUMERIC NOT NULL,
  strength NUMERIC DEFAULT 20,
  days_active INTEGER DEFAULT 0,
  pulse_count INTEGER DEFAULT 0,
  last_pulse_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  practice_log TEXT[] DEFAULT '{}',
  released_early BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.virtual_pilgrimage_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pilgrimage activations"
  ON public.virtual_pilgrimage_activations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vpa_user_active
  ON public.virtual_pilgrimage_activations(user_id, is_active);

CREATE OR REPLACE FUNCTION public.update_vpa_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vpa_timestamp ON public.virtual_pilgrimage_activations;
CREATE TRIGGER set_vpa_timestamp
  BEFORE UPDATE ON public.virtual_pilgrimage_activations
  FOR EACH ROW EXECUTE FUNCTION public.update_vpa_timestamp();