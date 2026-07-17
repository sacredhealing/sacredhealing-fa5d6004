-- Vastu Shastra Curriculum: rebuilt to match the standard academy
-- pattern (CourseSyllabus overview + ModuleReaderShell reader), same as
-- the other academies. Supersedes the earlier minimal single-table
-- lesson-progress migration (20260716410000) -- that table can be left
-- in place unused, or dropped, at your discretion; it's no longer
-- referenced by the app.
--
-- Metadata here, content (per-lesson sections/practice/mantra/secret)
-- in src/data/vastuModuleContent.ts. 8 modules, 19 lessons.

CREATE TABLE IF NOT EXISTS public.vastu_courses (
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

CREATE TABLE IF NOT EXISTS public.user_vastu_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.vastu_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_vastu_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.vastu_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_vastu_progress_user ON public.user_vastu_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vastu_section_progress_user_module
  ON public.user_vastu_section_progress(user_id, module_id);

ALTER TABLE public.vastu_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vastu_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vastu_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY vastu_courses_select_auth ON public.vastu_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_vastu_progress_select_own ON public.user_vastu_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_insert_own ON public.user_vastu_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_update_own ON public.user_vastu_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_delete_own ON public.user_vastu_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_vastu_section_progress_select_own ON public.user_vastu_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_insert_own ON public.user_vastu_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_update_own ON public.user_vastu_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_delete_own ON public.user_vastu_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.vastu_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'bhoomi', 'Bhoomi Prajna', 'Earth Wisdom & Foundations', 'free'),
  (2, 'pancha', 'Pancha Bhuta Activation', 'Five Elements Mastery', 'free'),
  (3, 'ashtadisha', 'Ashtadisha Vidya', '8 Directions — Deep Intelligence', 'prana-flow'),
  (4, 'rooms', 'Room-by-Room Alchemy', 'Transforming Every Space', 'prana-flow'),
  (5, 'advanced', 'Advanced Energy Mapping', 'Invisible Forces & Dosha Diagnosis', 'siddha-quantum'),
  (6, 'mantra', 'Mantra Remedy Systems', 'Sound as Vastu Correction', 'siddha-quantum'),
  (7, 'jyotish', 'Jyotish Vastu', 'Planetary Grid & Cosmic Timing', 'akasha-infinity'),
  (8, 'mastery', 'Paramanu Vastu Mastery', 'Quantum Consciousness & Transmission', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
