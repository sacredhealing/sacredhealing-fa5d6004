-- Nadi Leaf Oracle: real Supabase-backed tables, matching the established
-- pattern. Metadata here, rich lesson content (overview/quote/bodyText/
-- mantra/practices/secrets) in src/data/nadiLeafData.ts. 4 modules, 12
-- lessons. The biometric thumb-scan tool (ThumbBiometricScanner) is a
-- separate interactive feature, untouched -- this covers only the
-- 12-lesson curriculum's progress tracking.

CREATE TABLE IF NOT EXISTS public.nadi_leaf_courses (
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

CREATE TABLE IF NOT EXISTS public.user_nadi_leaf_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.nadi_leaf_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_nadi_leaf_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.nadi_leaf_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_nadi_leaf_progress_user ON public.user_nadi_leaf_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nadi_leaf_section_progress_user_module
  ON public.user_nadi_leaf_section_progress(user_id, module_id);

ALTER TABLE public.nadi_leaf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nadi_leaf_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nadi_leaf_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY nadi_leaf_courses_select_auth ON public.nadi_leaf_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_nadi_leaf_progress_select_own ON public.user_nadi_leaf_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_progress_insert_own ON public.user_nadi_leaf_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_progress_update_own ON public.user_nadi_leaf_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_progress_delete_own ON public.user_nadi_leaf_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_nadi_leaf_section_progress_select_own ON public.user_nadi_leaf_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_section_progress_insert_own ON public.user_nadi_leaf_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_section_progress_update_own ON public.user_nadi_leaf_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_nadi_leaf_section_progress_delete_own ON public.user_nadi_leaf_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.nadi_leaf_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Foundation — What Are the Nadi Leaves', 'Agastya Muni''s Living Library of Souls', 'free'),
  (2, 'm2', 'Science — Thumb Karma & the 16 Kandams', 'The Complete Nadi Reading Structure', 'prana-flow'),
  (3, 'm3', 'Advanced — Shanti Remedies & Inner Nadi', 'Karma Dissolution & the Living Signature', 'siddha-quantum'),
  (4, 'm4', 'Master — Siddha Records & Moksha Kandam', 'The Final Chapters of Liberation', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
