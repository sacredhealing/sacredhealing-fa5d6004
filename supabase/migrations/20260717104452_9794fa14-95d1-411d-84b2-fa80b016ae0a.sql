CREATE TABLE IF NOT EXISTS public.mediumship_academy_courses (
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

GRANT SELECT ON public.mediumship_academy_courses TO authenticated;
GRANT ALL ON public.mediumship_academy_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_mediumship_academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mediumship_academy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mediumship_academy_progress TO authenticated;
GRANT ALL ON public.user_mediumship_academy_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_mediumship_academy_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mediumship_academy_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mediumship_academy_section_progress TO authenticated;
GRANT ALL ON public.user_mediumship_academy_section_progress TO service_role;

ALTER TABLE public.mediumship_academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mediumship_academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mediumship_academy_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY mediumship_academy_courses_select_auth ON public.mediumship_academy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_mediumship_academy_progress_select_own ON public.user_mediumship_academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_progress_insert_own ON public.user_mediumship_academy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_progress_update_own ON public.user_mediumship_academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_progress_delete_own ON public.user_mediumship_academy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_section_progress_select_own ON public.user_mediumship_academy_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_section_progress_insert_own ON public.user_mediumship_academy_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_section_progress_update_own ON public.user_mediumship_academy_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_mediumship_academy_section_progress_delete_own ON public.user_mediumship_academy_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_mediumship_academy_progress_user ON public.user_mediumship_academy_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_mediumship_academy_section_progress_user_module
  ON public.user_mediumship_academy_section_progress(user_id, module_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_mediumship_academy_section_progress_updated_at
  ON public.user_mediumship_academy_section_progress;

CREATE TRIGGER update_user_mediumship_academy_section_progress_updated_at
  BEFORE UPDATE ON public.user_mediumship_academy_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mediumship_academy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The Siddha Science of Mediumship', 'What the 18 Siddhas knew that no Western tradition touches', 'free'),
  (2, 'm2', 'Preparing the Vehicle — Purification Protocols', 'Why psychic development without purification creates dangerous distortions', 'free'),
  (3, 'm3', 'Third Eye Activation — The Complete Ajna Protocols', 'Siddha techniques for opening the seat of inter-loka vision', 'prana-flow'),
  (4, 'm4', 'Mantra Technology for Mediumship', 'The exact mantras the 18 Siddhas used to open inter-loka channels', 'prana-flow'),
  (5, 'm5', 'Speaking to the Dead — Advanced Inter-Loka Protocols', 'Siddha-validated techniques for direct soul communication', 'siddha-quantum'),
  (6, 'm6', 'Psychic Protection — The Complete Kavach Protocols', 'Why unprotected mediumship is dangerous and how the Siddhas sealed themselves', 'siddha-quantum'),
  (7, 'm7', 'The Akashic Records — Direct Access Technology', 'Reading the cosmic library — every soul, every lifetime, every potential future', 'akasha-infinity'),
  (8, 'm8', 'Siddhis & Sovereign Mediumship — The Integrated Life', 'The 8 classical Siddhis, healing across Lokas, and living as a Siddha medium', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;