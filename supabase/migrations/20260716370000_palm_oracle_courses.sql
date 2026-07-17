-- Palm Oracle: real Supabase-backed tables, matching the established
-- pattern. Metadata here, rich lesson content (overview/quote/bodyText/
-- mantra/practices) in src/data/palmOracleData.ts. 4 modules, 29 lessons.
-- The AI vision palm-scan feature (palm-oracle-reading edge function) and
-- reading archive tab are separate features, untouched -- this covers
-- only the 29-lesson curriculum's progress tracking.

CREATE TABLE IF NOT EXISTS public.palm_oracle_courses (
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

CREATE TABLE IF NOT EXISTS public.user_palm_oracle_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.palm_oracle_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_palm_oracle_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.palm_oracle_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_palm_oracle_progress_user ON public.user_palm_oracle_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_palm_oracle_section_progress_user_module
  ON public.user_palm_oracle_section_progress(user_id, module_id);

ALTER TABLE public.palm_oracle_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_palm_oracle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_palm_oracle_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY palm_oracle_courses_select_auth ON public.palm_oracle_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_palm_oracle_progress_select_own ON public.user_palm_oracle_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_progress_insert_own ON public.user_palm_oracle_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_progress_update_own ON public.user_palm_oracle_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_progress_delete_own ON public.user_palm_oracle_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_palm_oracle_section_progress_select_own ON public.user_palm_oracle_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_section_progress_insert_own ON public.user_palm_oracle_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_section_progress_update_own ON public.user_palm_oracle_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_palm_oracle_section_progress_delete_own ON public.user_palm_oracle_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.palm_oracle_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The Foundation of Siddha Palmistry', 'Hasta Samudrika Shastra — Origins & First Principles', 'free'),
  (2, 'm2', 'The Five Sacred Rekhas', 'Major Lines — The Dharmic Blueprint', 'prana-flow'),
  (3, 'm3', 'The Navagraha Temple of the Hand', 'Mounts, Minor Lines & Sacred Marks', 'siddha-quantum'),
  (4, 'm4', 'Siddha Palm Oracle: Master Practitioner', 'Read. Heal. Transmit. Certify.', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
