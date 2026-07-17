-- Sacred Geometry Education: real Supabase-backed tables, matching the
-- established pattern. Metadata here, rich content (title/duration/content
-- per lesson) in src/data/sacredGeometryModuleContent.ts. 10 modules,
-- 38 lessons.

CREATE TABLE IF NOT EXISTS public.sacred_geometry_courses (
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

CREATE TABLE IF NOT EXISTS public.user_sacred_geometry_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.sacred_geometry_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_sacred_geometry_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.sacred_geometry_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sacred_geometry_progress_user ON public.user_sacred_geometry_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sacred_geometry_section_progress_user_module
  ON public.user_sacred_geometry_section_progress(user_id, module_id);

ALTER TABLE public.sacred_geometry_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sacred_geometry_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sacred_geometry_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY sacred_geometry_courses_select_auth ON public.sacred_geometry_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_sacred_geometry_progress_select_own ON public.user_sacred_geometry_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_progress_insert_own ON public.user_sacred_geometry_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_progress_update_own ON public.user_sacred_geometry_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_progress_delete_own ON public.user_sacred_geometry_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_sacred_geometry_section_progress_select_own ON public.user_sacred_geometry_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_section_progress_insert_own ON public.user_sacred_geometry_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_section_progress_update_own ON public.user_sacred_geometry_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_sacred_geometry_section_progress_delete_own ON public.user_sacred_geometry_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.sacred_geometry_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'language-of-creation', 'The Language of Creation', 'Sacred Geometry Foundations', 'free'),
  (2, 'flower-of-life', 'The Flower of Life', 'The Universal Matrix of Creation', 'free'),
  (3, 'torus-field', 'The Torus Field', 'The Engine of All Living Systems', 'prana-flow'),
  (4, 'sacred-geometry-cosmos', 'Cosmic Sacred Geometry', 'Fibonacci, the Universe, and Your Light Body', 'prana-flow'),
  (5, 'sri-yantra-complete', 'Sri Yantra — The Complete Secret Revelation', 'The Supreme Consciousness Intelligence Machine', 'siddha-quantum'),
  (6, 'planetary-grids', 'Planetary Grid Activation & Ley Lines', 'Healing the Earth''s Sacred Nervous System', 'siddha-quantum'),
  (7, 'country-city-home-chakras', 'Chakras in Countries, Cities & Homes', 'Micro-Sacred Geography of Your World', 'siddha-quantum'),
  (8, 'pyramids-temples', 'Pyramids & Temple Construction Secrets', 'Scalar Wave Architecture of the Ancients', 'siddha-quantum'),
  (9, 'telekinesis-siddhis', 'Telekinesis & the Geometric Siddhis', 'The Physics of Paranormal Ability', 'akasha-infinity'),
  (10, 'healing-planet', 'Healing the Planet — Siddha Earth Service', 'The Complete Grid Activation Protocols', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
