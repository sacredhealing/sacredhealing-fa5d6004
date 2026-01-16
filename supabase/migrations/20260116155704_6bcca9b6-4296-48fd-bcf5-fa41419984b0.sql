-- Create meditation style sounds mapping table
CREATE TABLE public.meditation_style_sounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast style lookups
CREATE INDEX idx_meditation_style_sounds_style ON public.meditation_style_sounds(style_id);
CREATE INDEX idx_meditation_style_sounds_active ON public.meditation_style_sounds(style_id, is_active);

-- Enable RLS
ALTER TABLE public.meditation_style_sounds ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see available sounds)
CREATE POLICY "Anyone can view active meditation sounds"
ON public.meditation_style_sounds
FOR SELECT
USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage meditation sounds"
ON public.meditation_style_sounds
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_meditation_style_sounds_updated_at
BEFORE UPDATE ON public.meditation_style_sounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing indian sitar samples from storage
INSERT INTO public.meditation_style_sounds (style_id, name, description, file_path) VALUES
  ('indian', 'Sitar Egyptian D 100bpm', 'Sitar FX in Egyptian D scale', 'indian/sitar/001_Sitar_-_100bpm_Egyptian_D_-_SITARFX_Zenhiser.wav'),
  ('indian', 'Sitar Egyptian D 100bpm II', 'Sitar FX variation', 'indian/sitar/002_Sitar_-_100bpm_Egyptian_D_-_SITARFX_Zenhiser.wav'),
  ('indian', 'Sitar Dorian D 120bpm', 'Sitar FX in Dorian D scale', 'indian/sitar/003_Sitar_-_120bpm_Dorian_D_-_SITARFX_Zenhiser.wav');

-- Add placeholder entries for other styles (to be filled with actual sounds later)
INSERT INTO public.meditation_style_sounds (style_id, name, description, file_path, is_active) VALUES
  ('shamanic', 'Shamanic Drums', 'Frame drums & rattles', 'shamanic/placeholder.mp3', false),
  ('mystic', 'Mystic Ambience', 'Ethereal soundscapes', 'mystic/placeholder.mp3', false),
  ('tibetan', 'Tibetan Bowls', 'Singing bowls & chants', 'tibetan/placeholder.mp3', false),
  ('sufi', 'Sufi Whirling', 'Sufi meditation music', 'sufi/placeholder.mp3', false),
  ('zen', 'Zen Garden', 'Wind chimes & water', 'zen/placeholder.mp3', false),
  ('nature', 'Nature Healing', 'Natural ambience', 'nature/placeholder.mp3', false),
  ('ocean', 'Ocean Waves', 'Deep waves & whale songs', 'ocean/placeholder.mp3', false),
  ('sound_bath', 'Crystal Bowls', 'Crystal bowl resonance', 'sound_bath/placeholder.mp3', false),
  ('chakra', 'Chakra Tones', 'Chakra activation sounds', 'chakra/placeholder.mp3', false),
  ('higher_consciousness', 'Cosmic Void', 'Space drones & stellar winds', 'higher_consciousness/placeholder.mp3', false),
  ('relaxing', 'Deep Relaxation', 'Calming ambience', 'relaxing/placeholder.mp3', false),
  ('forest', 'Ancient Forest', 'Birds & rustling leaves', 'forest/placeholder.mp3', false),
  ('breath_focus', 'Breath Focus', 'Breathing guidance', 'breath_focus/placeholder.mp3', false),
  ('kundalini', 'Kundalini Rising', 'Energy activation sounds', 'kundalini/placeholder.mp3', false);