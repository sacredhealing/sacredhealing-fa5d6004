-- Narasimha (Lion of Siddha Montrose): real Supabase-backed tables,
-- matching the established pattern. Metadata here, rich content (per-seal
-- description/practices/production-note/mantra/affirmation, per-advanced-
-- module secretMantra/technique, plus a 5-mantra Secret Codex folded into
-- the final module) in src/data/narasimhaModuleContent.ts. 13 modules.

CREATE TABLE IF NOT EXISTS public.narasimha_courses (
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

CREATE TABLE IF NOT EXISTS public.user_narasimha_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.narasimha_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_narasimha_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.narasimha_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_narasimha_progress_user ON public.user_narasimha_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_narasimha_section_progress_user_module
  ON public.user_narasimha_section_progress(user_id, module_id);

ALTER TABLE public.narasimha_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_narasimha_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_narasimha_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY narasimha_courses_select_auth ON public.narasimha_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_narasimha_progress_select_own ON public.user_narasimha_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_narasimha_progress_insert_own ON public.user_narasimha_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_narasimha_progress_update_own ON public.user_narasimha_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_narasimha_progress_delete_own ON public.user_narasimha_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_narasimha_section_progress_select_own ON public.user_narasimha_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_narasimha_section_progress_insert_own ON public.user_narasimha_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_narasimha_section_progress_update_own ON public.user_narasimha_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_narasimha_section_progress_delete_own ON public.user_narasimha_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.narasimha_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'seal1', 'Seal 1: Ugra Narasimha', 'उग्र नरसिंह', 'free'),
  (2, 'seal2', 'Seal 2: Krodha Narasimha', 'क्रोध नरसिंह', 'free'),
  (3, 'seal3', 'Seal 3: Malola Narasimha', 'मलोल नरसिंह', 'prana-flow'),
  (4, 'seal4', 'Seal 4: Jwala Narasimha', 'ज्वाल नरसिंह', 'prana-flow'),
  (5, 'seal5', 'Seal 5: Varaha Narasimha', 'वराह नरसिंह', 'prana-flow'),
  (6, 'seal6', 'Seal 6: Bhargava Narasimha', 'भार्गव नरसिंह', 'siddha-quantum'),
  (7, 'seal7', 'Seal 7: Karancha Narasimha', 'कराञ्च नरसिंह', 'siddha-quantum'),
  (8, 'seal8', 'Seal 8: Yoga Narasimha', 'योग नरसिंह', 'siddha-quantum'),
  (9, 'seal9', 'Seal 9: Lakshmi Narasimha', 'लक्ष्मी नरसिंह', 'akasha-infinity'),
  (10, 'advI', 'Advanced I: The Awakening', 'Nakha-Shakti Activation', 'akasha-infinity'),
  (11, 'advII', 'Advanced II: The Alchemy', 'Jwala-Blood Purification', 'akasha-infinity'),
  (12, 'advIII', 'Advanced III: The Union', 'Lion''s Roar meets Singer''s Heart', 'akasha-infinity'),
  (13, 'advIV', 'Advanced IV: The Silence', 'Siddha-Shoonya · The Void', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
