-- Alchemical Shiva: real Supabase-backed tables, matching the established
-- pattern. Metadata here, rich content (technique/techniqueDetail/mantra/
-- instruction per module, plus the 3-mantra Nath Vault bonus content) in
-- src/data/alchemicalShivaModuleContent.ts. 6 modules.

CREATE TABLE IF NOT EXISTS public.alchemical_shiva_courses (
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

CREATE TABLE IF NOT EXISTS public.user_alchemical_shiva_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.alchemical_shiva_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_alchemical_shiva_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.alchemical_shiva_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_alchemical_shiva_progress_user ON public.user_alchemical_shiva_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alchemical_shiva_section_progress_user_module
  ON public.user_alchemical_shiva_section_progress(user_id, module_id);

ALTER TABLE public.alchemical_shiva_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alchemical_shiva_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alchemical_shiva_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY alchemical_shiva_courses_select_auth ON public.alchemical_shiva_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_alchemical_shiva_progress_select_own ON public.user_alchemical_shiva_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_progress_insert_own ON public.user_alchemical_shiva_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_progress_update_own ON public.user_alchemical_shiva_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_progress_delete_own ON public.user_alchemical_shiva_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_alchemical_shiva_section_progress_select_own ON public.user_alchemical_shiva_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_section_progress_insert_own ON public.user_alchemical_shiva_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_section_progress_update_own ON public.user_alchemical_shiva_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_alchemical_shiva_section_progress_delete_own ON public.user_alchemical_shiva_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.alchemical_shiva_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The Bio-Geometry of the Lingam', 'Tuning the Human Antenna — Meru-Danda Alignment', 'free'),
  (2, 'm2', 'Gorakshanath''s Amrit Alchemy', 'The Inverted Well — Nectar of the Immortals', 'prana-flow'),
  (3, 'm3', 'Hidden Mantras & Sound Science', 'The Five-Element Dissolution — Panchakshara Alchemy', 'siddha-quantum'),
  (4, 'm4', 'Direct Access — The Siddha Way', 'Shivoham — I Am Shiva — Jyoti Trataka', 'siddha-quantum'),
  (5, 'm5', 'The Midnight Sadhana Protocol', 'Brahma Muhurta & Lunar Cycle Activation', 'siddha-quantum'),
  (6, 'm6', 'BONUS — Nath Vault: Secret Mantras', 'Three Lost Mantras of the 84 Mahasiddhas', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
