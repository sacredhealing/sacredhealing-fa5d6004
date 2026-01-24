-- Create ambient sounds table for background audio loops
CREATE TABLE public.ambient_sounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  audio_url TEXT,
  icon_name TEXT DEFAULT 'music',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambient_sounds ENABLE ROW LEVEL SECURITY;

-- Allow public read access (ambient sounds are public content)
CREATE POLICY "Ambient sounds are publicly readable"
ON public.ambient_sounds
FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage ambient sounds"
ON public.ambient_sounds
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_ambient_sounds_updated_at
BEFORE UPDATE ON public.ambient_sounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ambient sounds (without audio URLs - admin will upload)
INSERT INTO public.ambient_sounds (name, slug, description, icon_name, order_index)
VALUES 
  ('Temple Rain', 'temple-rain', 'Gentle rain on temple stones for deep relaxation', 'cloud-rain', 0),
  ('Crystal Bowls', 'crystal-bowls', 'Tibetan singing bowls for meditation', 'gem', 1),
  ('Deep Om', 'deep-om', 'Resonant Om chanting for spiritual connection', 'circle', 2);