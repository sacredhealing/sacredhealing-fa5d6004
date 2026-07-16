-- Supreme Siddha Meditation: real Supabase-backed tables, matching the
-- established pattern. Metadata here, rich content (lessons with
-- technique + transmission text, mantra/mudra/element/chakra per module)
-- in src/data/meditationModuleContent.ts.

CREATE TABLE IF NOT EXISTS public.meditation_course_modules (
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

CREATE TABLE IF NOT EXISTS public.user_meditation_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.meditation_course_modules(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_meditation_course_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.meditation_course_modules(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_meditation_course_progress_user ON public.user_meditation_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meditation_course_section_progress_user_module
  ON public.user_meditation_course_section_progress(user_id, module_id);

ALTER TABLE public.meditation_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meditation_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meditation_course_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY meditation_course_modules_select_auth ON public.meditation_course_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_meditation_course_progress_select_own ON public.user_meditation_course_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_meditation_course_progress_insert_own ON public.user_meditation_course_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_meditation_course_progress_update_own ON public.user_meditation_course_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_meditation_course_progress_delete_own ON public.user_meditation_course_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_meditation_course_section_progress_select_own ON public.user_meditation_course_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_meditation_course_section_progress_insert_own ON public.user_meditation_course_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_meditation_course_section_progress_update_own ON public.user_meditation_course_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_meditation_course_section_progress_delete_own ON public.user_meditation_course_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.meditation_course_modules (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Witnessing the Infinite Self', 'Foundation of Siddha Consciousness — Agastya Muni', 'free'),
  (2, 'm2', 'Nada — The Primordial Sound', 'Sound as Liberation Technology — Thirumoolar', 'free'),
  (3, 'm3', 'Prana — The Living Force', 'Mastery of the Five Winds — Nandhi Devar', 'free'),
  (4, 'm4', 'Kechari — The Tongue of Immortality', 'Thirumoolar''s 8 Pranayamas — Thirumoolar', 'prana-flow'),
  (5, 'm5', 'Kundalini Shakti Rising', 'The Serpent Fire Awakening — Gorakkar', 'prana-flow'),
  (6, 'm6', 'Yantra Dharana — Sacred Geometry Meditation', 'Gazing Into the Light-Code of Creation — Machamuni (Matsyendranath)', 'prana-flow'),
  (7, 'm7', 'Kaya Kalpa — The Immortality Protocol', 'Science of Body Transformation — Bhogar (Boganathar)', 'siddha-quantum'),
  (8, 'm8', 'Bhrigu Transmission Meditations', 'Past-Life Akashic Access & Destiny Clearing — Bhrigu Muni', 'siddha-quantum'),
  (9, 'm9', 'Siddha Sound Alchemy', 'Mantra as Quantum Frequency Technology — Siva Vakkiyar', 'siddha-quantum'),
  (10, 'm10', 'Trataka — Laser Focus of the Yogi', 'Third Eye Activation System — Konganar', 'siddha-quantum'),
  (11, 'm11', 'Mahavatar Babaji Direct Transmission', 'Kriya Yoga — The Supreme Science — Mahavatar Babaji', 'akasha-infinity'),
  (12, 'm12', 'Akashic Records — Direct Neural Access', 'Reading the Universal Memory Field — Agastya Muni + Bhrigu Muni', 'akasha-infinity'),
  (13, 'm13', 'DNA Light Activation', 'Activating the 12-Strand Template — Bhogar + Kalangi Nathar', 'akasha-infinity'),
  (14, 'm14', 'Unified Field Consciousness', 'Aham Brahmasmi — I Am the Absolute — All 18 Siddhas + Mahavatar Babaji', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
