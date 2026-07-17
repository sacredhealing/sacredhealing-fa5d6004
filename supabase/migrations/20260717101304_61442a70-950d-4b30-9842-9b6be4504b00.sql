CREATE TABLE IF NOT EXISTS public.sound_alchemy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL UNIQUE,
  module_key text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sound_alchemy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.sound_alchemy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_sound_alchemy_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.sound_alchemy_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sound_alchemy_progress_user ON public.user_sound_alchemy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sound_alchemy_section_progress_user_module
  ON public.user_sound_alchemy_section_progress(user_id, module_id);

GRANT SELECT ON public.sound_alchemy_courses TO authenticated;
GRANT ALL ON public.sound_alchemy_courses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sound_alchemy_progress TO authenticated;
GRANT ALL ON public.user_sound_alchemy_progress TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sound_alchemy_section_progress TO authenticated;
GRANT ALL ON public.user_sound_alchemy_section_progress TO service_role;

ALTER TABLE public.sound_alchemy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sound_alchemy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sound_alchemy_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY sound_alchemy_courses_select_auth ON public.sound_alchemy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_sound_alchemy_progress_select_own ON public.user_sound_alchemy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_progress_insert_own ON public.user_sound_alchemy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_progress_update_own ON public.user_sound_alchemy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_progress_delete_own ON public.user_sound_alchemy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_sound_alchemy_section_progress_select_own ON public.user_sound_alchemy_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_section_progress_insert_own ON public.user_sound_alchemy_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_section_progress_update_own ON public.user_sound_alchemy_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sound_alchemy_section_progress_delete_own ON public.user_sound_alchemy_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_sound_alchemy_section_progress_updated_at
  ON public.user_sound_alchemy_section_progress;
CREATE TRIGGER update_user_sound_alchemy_section_progress_updated_at
  BEFORE UPDATE ON public.user_sound_alchemy_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sound_alchemy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The First Vibration — Nada Brahman', 'Why the Universe Is Not Matter. It Is Sound.', 'free'),
  (2, 'm2', 'Sabda & Spanda — The Two Laws of Sonic Creation', 'How Sound Becomes Reality', 'free'),
  (3, 'm3', 'The 5 Levels of Sound — Pancha Nada', 'Para · Pashyanti · Madhyama · Vaikhari · Udana', 'prana-flow'),
  (4, 'm4', 'Siddha Nada & The Anahata Gateway', 'The Heart Field as a Sonic Instrument', 'prana-flow'),
  (5, 'm5', 'Mantra Architecture — Building Sonic Light-Codes', 'Why Not All Mantras Are Equal', 'siddha-quantum'),
  (6, 'm6', 'The Siddha Frequency Map — Raga, Chakra & Healing', '72 Melakarta Ragas as Chakra Medicine', 'siddha-quantum'),
  (7, 'm7', 'Mantra, Nada & the Brain — Modern Neuroscience Meets Ancient Wisdom', 'The Physics of Consciousness Rewiring Through Sound', 'siddha-quantum'),
  (8, 'm8', 'The Akashic Sound Body — Nada Sharira', 'Your Subtle Anatomy as a Living Musical Instrument', 'akasha-infinity'),
  (9, 'm9', 'The Secret of Sacred Tuning — What the Siddhas Actually Said', 'Beyond 432Hz vs 440Hz — The Personalized Frequency', 'akasha-infinity'),
  (10, 'm10', 'Scalar Sound Transmission — Healing Beyond Distance', 'The Siddha Science of Non-Local Nada', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;