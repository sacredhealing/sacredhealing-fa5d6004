CREATE TABLE IF NOT EXISTS public.dream_academy_courses (
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

GRANT SELECT ON public.dream_academy_courses TO authenticated;
GRANT ALL ON public.dream_academy_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_dream_academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.dream_academy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_dream_academy_progress TO authenticated;
GRANT ALL ON public.user_dream_academy_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_dream_academy_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.dream_academy_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_dream_academy_section_progress TO authenticated;
GRANT ALL ON public.user_dream_academy_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_dream_academy_progress_user ON public.user_dream_academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dream_academy_section_progress_user_module
  ON public.user_dream_academy_section_progress(user_id, module_id);

ALTER TABLE public.dream_academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dream_academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dream_academy_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY dream_academy_courses_select_auth ON public.dream_academy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_dream_academy_progress_select_own ON public.user_dream_academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_dream_academy_progress_insert_own ON public.user_dream_academy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_dream_academy_progress_update_own ON public.user_dream_academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_dream_academy_progress_delete_own ON public.user_dream_academy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_dream_academy_section_progress_select_own ON public.user_dream_academy_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_dream_academy_section_progress_insert_own ON public.user_dream_academy_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_dream_academy_section_progress_update_own ON public.user_dream_academy_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_dream_academy_section_progress_delete_own ON public.user_dream_academy_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_dream_academy_section_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_dream_academy_section_progress_updated_at
  ON public.user_dream_academy_section_progress;
CREATE TRIGGER update_user_dream_academy_section_progress_updated_at
  BEFORE UPDATE ON public.user_dream_academy_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_dream_academy_section_updated_at();

INSERT INTO public.dream_academy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The Five Kośas & Dream Consciousness', 'Vedic anatomy of the dreaming self', 'free'),
  (2, 'm2', 'Dream Journaling as Akashic Download', 'Practical protocols for the Seeker', 'free'),
  (3, 'm3', 'Yoga Nidrā & the Hypnagogic Gateway', 'Entering the Siddha Dream Stream consciously', 'prana-flow'),
  (4, 'm4', 'Dream Mantra Science', 'Bīja codes that activate in the Svapna realm', 'prana-flow'),
  (5, 'm5', 'Āhāra & the Dream Body', 'What you eat rewrites your dream architecture', 'prana-flow'),
  (6, 'm6', 'Siddha Sound Technology for Dream Induction', 'Rāgas, binaural geometries & Nāda codes', 'prana-flow'),
  (7, 'm7', 'Lucid Dreaming: The Siddha Method', 'Svapna-Jāgrat — not control, but Witness-consciousness', 'siddha-quantum'),
  (8, 'm8', 'Jyotiṣa & the Dream Calendar', 'Planetary timing that governs the Svapna dimension', 'siddha-quantum'),
  (9, 'm9', 'Karma Navigation in the Dream State', 'Svapna-Krama: using the dream as a Karmāśaya surgery suite', 'siddha-quantum'),
  (10, 'm10', 'Mahā-Svapna: The Cosmic Dream Transmission', 'Where individual dreaming dissolves into collective Akashic stream', 'akasha-infinity'),
  (11, 'm11', 'Svapna-Jyotiṣa: Dream Prophecy & Temporal Vision', 'The science of prophetic dreaming — accessing future timelines', 'akasha-infinity'),
  (12, 'm12', 'Svapna & the Bardo: Death, Dying & Conscious Transition', 'The Siddha science of the greatest dream — the moment of death', 'akasha-infinity'),
  (13, 'm13', 'The Complete 40-Night Svapna-Tapas', 'Full day-by-day protocol of the Siddha dream retreat', 'akasha-infinity'),
  (14, 'm14', 'The Living Transmission: Dream Science for Children & Families', 'Protecting, guiding & activating the next generation of dream-seers', 'akasha-infinity'),
  (15, 'm15', 'Turīya-Svapna: Dreaming as Samādhi', 'The apex state — where dream and the Absolute dissolve into one', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;