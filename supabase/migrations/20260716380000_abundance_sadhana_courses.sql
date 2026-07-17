-- Abundance Sadhana: real Supabase-backed tables, matching the
-- established pattern. Metadata here, rich content (per-lesson content/
-- mantra/journal prompt) in src/data/abundanceSadhanaContent.ts. 8
-- modules, 32 lessons. Progress was pure localStorage before this --
-- genuinely lost on browser/device change. Migrated to real per-user
-- persistence.

CREATE TABLE IF NOT EXISTS public.abundance_sadhana_courses (
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

CREATE TABLE IF NOT EXISTS public.user_abundance_sadhana_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.abundance_sadhana_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_abundance_sadhana_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.abundance_sadhana_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_abundance_sadhana_progress_user ON public.user_abundance_sadhana_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_abundance_sadhana_section_progress_user_module
  ON public.user_abundance_sadhana_section_progress(user_id, module_id);

ALTER TABLE public.abundance_sadhana_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_abundance_sadhana_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_abundance_sadhana_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY abundance_sadhana_courses_select_auth ON public.abundance_sadhana_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_abundance_sadhana_progress_select_own ON public.user_abundance_sadhana_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_progress_insert_own ON public.user_abundance_sadhana_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_progress_update_own ON public.user_abundance_sadhana_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_progress_delete_own ON public.user_abundance_sadhana_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_abundance_sadhana_section_progress_select_own ON public.user_abundance_sadhana_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_section_progress_insert_own ON public.user_abundance_sadhana_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_section_progress_update_own ON public.user_abundance_sadhana_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_abundance_sadhana_section_progress_delete_own ON public.user_abundance_sadhana_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.abundance_sadhana_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'The Siddha Foundation', 'Awakening to Your Original Abundance Nature', 'free'),
  (2, 'm2', 'Ashta-Lakshmi Attunement', 'The 8 Frequencies of Divine Abundance', 'free'),
  (3, 'm3', 'Kubera''s Treasury Codes', 'The Cosmic Wealth Manager''s Secrets Revealed', 'free'),
  (4, 'm4', 'Pachamama & Earth Abundance', 'Manifesting Through the Living Earth', 'prana-flow'),
  (5, 'm5', 'Yantra & Sacred Geometry', 'Visual Technology That Rewires the Wealth-Field', 'prana-flow'),
  (6, 'm6', 'Nada Wealth Alchemy', 'Sound as the Most Powerful Manifesting Force', 'siddha-quantum'),
  (7, 'm7', 'The 18 Siddhas'' Hidden Secrets', 'Mouth-to-Ear Transmissions Released for This Era', 'siddha-quantum'),
  (8, 'm8', 'Akasha-Infinity Scalar Activation', 'The Final Transmission — Babaji Speaks', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
