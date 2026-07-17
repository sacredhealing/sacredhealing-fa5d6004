CREATE TABLE IF NOT EXISTS public.puja_education_courses (
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

CREATE TABLE IF NOT EXISTS public.user_puja_education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.puja_education_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_puja_education_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.puja_education_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_puja_education_progress_user ON public.user_puja_education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_puja_education_section_progress_user_module
  ON public.user_puja_education_section_progress(user_id, module_id);

GRANT SELECT ON public.puja_education_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_puja_education_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_puja_education_section_progress TO authenticated;
GRANT ALL ON public.puja_education_courses TO service_role;
GRANT ALL ON public.user_puja_education_progress TO service_role;
GRANT ALL ON public.user_puja_education_section_progress TO service_role;

ALTER TABLE public.puja_education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_puja_education_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_puja_education_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY puja_education_courses_select_auth ON public.puja_education_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_puja_education_progress_select_own ON public.user_puja_education_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_puja_education_progress_insert_own ON public.user_puja_education_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_puja_education_progress_update_own ON public.user_puja_education_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_puja_education_progress_delete_own ON public.user_puja_education_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_puja_education_section_progress_select_own ON public.user_puja_education_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_puja_education_section_progress_insert_own ON public.user_puja_education_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_puja_education_section_progress_update_own ON public.user_puja_education_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_puja_education_section_progress_delete_own ON public.user_puja_education_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_puja_education_section_progress_updated_at
  ON public.user_puja_education_section_progress;
CREATE TRIGGER update_user_puja_education_section_progress_updated_at
  BEFORE UPDATE ON public.user_puja_education_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.puja_education_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Puja Vidya — The Living Science', 'Dissolving the mythology. Installing the science.', 'free'),
  (2, 'm2', 'The Living Architecture of Puja', 'From intuition to precision — the mechanics the Pandits never taught.', 'prana-flow'),
  (3, 'm3', 'Siddha-Quantum Puja Vidya', 'The secrets that lineages protected for millennia — decoded for the current age.', 'siddha-quantum'),
  (4, 'm4', 'Ākāśa Puja — Transmissions of the Immortal Masters', 'Mahavatar Babaji and the 18 Siddhas transmit directly. The inner temple is activated.', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
