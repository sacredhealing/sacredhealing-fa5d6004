CREATE TABLE IF NOT EXISTS public.active_transmissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  transmission_id TEXT,
  transmission_title TEXT,
  transmission_url TEXT,
  transmission_type TEXT DEFAULT 'audio',
  is_playing BOOLEAN DEFAULT false,
  playback_position NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transmission" ON public.active_transmissions
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_transmission_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transmission_timestamp
  BEFORE UPDATE ON public.active_transmissions
  FOR EACH ROW EXECUTE FUNCTION public.update_transmission_timestamp();