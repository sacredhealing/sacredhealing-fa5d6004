-- Thirumoolar's Pranayama Codex: real Supabase-backed tables, matching
-- the established pattern. Metadata here, rich content (lessons,
-- techniques, quiz, transmission) in src/data/pranayamaModuleContent.ts.

CREATE TABLE IF NOT EXISTS public.pranayama_courses (
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

CREATE TABLE IF NOT EXISTS public.user_pranayama_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.pranayama_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_pranayama_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.pranayama_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_pranayama_progress_user ON public.user_pranayama_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pranayama_section_progress_user_module
  ON public.user_pranayama_section_progress(user_id, module_id);

ALTER TABLE public.pranayama_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pranayama_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pranayama_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY pranayama_courses_select_auth ON public.pranayama_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_pranayama_progress_select_own ON public.user_pranayama_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_pranayama_progress_insert_own ON public.user_pranayama_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_pranayama_progress_update_own ON public.user_pranayama_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_pranayama_progress_delete_own ON public.user_pranayama_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_pranayama_section_progress_select_own ON public.user_pranayama_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_pranayama_section_progress_insert_own ON public.user_pranayama_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_pranayama_section_progress_update_own ON public.user_pranayama_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_pranayama_section_progress_delete_own ON public.user_pranayama_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.pranayama_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Prana — The Living Intelligence', 'THIRUMANTIRAM VERSES 700–720', 'free'),
  (2, 'm2', 'The Five Sacred Fires — Pancha Agni', 'THIRUMANTIRAM VERSES 740–770', 'free'),
  (3, 'm3', 'Kumbhaka — The Doorway to the Uncreated', 'THIRUMANTIRAM VERSES 800–870', 'prana-flow'),
  (4, 'm4', 'Nath Siddha Transmissions — Matsyendra Protocol', 'MATSYENDRANATH · GORAKSHANATH · 84 MAHASIDDHAS', 'prana-flow'),
  (5, 'm5', 'Kevala Kumbhaka — Spontaneous Breathlessness', 'THIRUMANTIRAM VERSES 900–960 · SAMADHI TECHNOLOGY', 'siddha-quantum'),
  (6, 'm6', 'The 18 Siddhas — Individual Pranayama Transmissions', 'AGASTYA · BOGAR · KONGANAR · PAMBATTI · PATTINATHAR & ALL 18', 'siddha-quantum'),
  (7, 'm7', 'Shiva-Nishvasa — God''s Own Breath', 'THIRUMANTIRAM VERSES 1000–1100 · COSMIC BREATH SCIENCE', 'akasha-infinity'),
  (8, 'm8', 'Babaji''s Kriya Pranayama — The Immortal Sequence', 'MAHAVATAR BABAJI · COMPLETE UNABBREVIATED TRANSMISSION', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
