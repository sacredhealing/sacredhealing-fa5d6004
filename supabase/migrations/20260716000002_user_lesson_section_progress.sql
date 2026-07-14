-- Per-section completion + notes within a single module's lesson.
--
-- user_course_progress tracks completion at the MODULE level (one of the
-- 108 Agastyar modules). This is a finer grain: each module's reading is
-- broken into sections (Agastyar Speaks, What Is Ayurveda?, Knowledge
-- Check, etc. -- shown as the accordion cards). This table lets a person
-- mark and write notes on each section independently, instead of one
-- "Mark Complete" / one notes box for the whole module.
--
-- user_id references auth.users(id) directly (not profiles(id) -- see
-- 20260716000001_fix_all_profiles_id_fkey_bugs.sql for why that matters).

CREATE TABLE IF NOT EXISTS public.user_lesson_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ayurveda_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_section_progress_user_module
  ON public.user_lesson_section_progress(user_id, module_id);

ALTER TABLE public.user_lesson_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_lesson_section_progress_select_own ON public.user_lesson_section_progress;
CREATE POLICY user_lesson_section_progress_select_own ON public.user_lesson_section_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_lesson_section_progress_insert_own ON public.user_lesson_section_progress;
CREATE POLICY user_lesson_section_progress_insert_own ON public.user_lesson_section_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_lesson_section_progress_update_own ON public.user_lesson_section_progress;
CREATE POLICY user_lesson_section_progress_update_own ON public.user_lesson_section_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_lesson_section_progress_delete_own ON public.user_lesson_section_progress;
CREATE POLICY user_lesson_section_progress_delete_own ON public.user_lesson_section_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
