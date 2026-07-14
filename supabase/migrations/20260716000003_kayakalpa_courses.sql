-- Kayakalpa Academy: real Supabase-backed tables, matching the Agastyar
-- pattern exactly. Content itself lives in src/data/kayakalpaModuleContent.ts
-- (same split as Agastyar: metadata in Supabase, rich teaching text in a
-- static TS file) -- this migration only creates the metadata + progress
-- tables and seeds the 12 modules' metadata.
--
-- Foreign keys point directly at auth.users(id), not profiles(id) --
-- see 20260716000001_fix_all_profiles_id_fkey_bugs.sql for why that matters.

CREATE TABLE IF NOT EXISTS public.kayakalpa_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_kayakalpa_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.kayakalpa_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_kayakalpa_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.kayakalpa_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_kayakalpa_progress_user ON public.user_kayakalpa_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kayakalpa_section_progress_user_module
  ON public.user_kayakalpa_section_progress(user_id, module_id);

ALTER TABLE public.kayakalpa_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kayakalpa_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kayakalpa_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kayakalpa_courses_select_auth ON public.kayakalpa_courses;
CREATE POLICY kayakalpa_courses_select_auth ON public.kayakalpa_courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS user_kayakalpa_progress_select_own ON public.user_kayakalpa_progress;
CREATE POLICY user_kayakalpa_progress_select_own ON public.user_kayakalpa_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_progress_insert_own ON public.user_kayakalpa_progress;
CREATE POLICY user_kayakalpa_progress_insert_own ON public.user_kayakalpa_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_progress_update_own ON public.user_kayakalpa_progress;
CREATE POLICY user_kayakalpa_progress_update_own ON public.user_kayakalpa_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_progress_delete_own ON public.user_kayakalpa_progress;
CREATE POLICY user_kayakalpa_progress_delete_own ON public.user_kayakalpa_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_kayakalpa_section_progress_select_own ON public.user_kayakalpa_section_progress;
CREATE POLICY user_kayakalpa_section_progress_select_own ON public.user_kayakalpa_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_section_progress_insert_own ON public.user_kayakalpa_section_progress;
CREATE POLICY user_kayakalpa_section_progress_insert_own ON public.user_kayakalpa_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_section_progress_update_own ON public.user_kayakalpa_section_progress;
CREATE POLICY user_kayakalpa_section_progress_update_own ON public.user_kayakalpa_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_kayakalpa_section_progress_delete_own ON public.user_kayakalpa_section_progress;
CREATE POLICY user_kayakalpa_section_progress_delete_own ON public.user_kayakalpa_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed the 12 real modules (metadata only -- rich content lives in
-- src/data/kayakalpaModuleContent.ts, matched by module_number).
INSERT INTO public.kayakalpa_courses (module_number, title, subtitle, tier_required) VALUES
  (1,  'Bogar''s Revelation — The Science of Immortality', 'Origin · Definition · The 18 Siddhas Compact', 'free'),
  (2,  'The Science of Kaya — Your Body as Living Temple', 'Pancha Bhuta · Tri-Dosha · Sapta Dhatu', 'free'),
  (3,  'Bogar''s Navapaashanam — The Stone of Immortality', 'Sacred Alchemy · Palani · The Living Idol', 'free'),
  (4,  'The 108 Kayakalpa Herbs — The Green Immortals', 'Bohar Karpam 300 · Complete Materia Medica · Preparation', 'prana-flow'),
  (5,  'Pranayama as Kayakalpa Technology', 'Kumbhaka · Kevala · The Breath of Immortality', 'prana-flow'),
  (6,  'Kayakalpa Diet — Eating for Immortality', 'Pathya · Seasonal Protocols · Sacred Fasting', 'prana-flow'),
  (7,  'Muppu — The Secret Alchemical Triple Salt', 'Bogar''s Greatest Secret · The Universal Catalyst', 'siddha-quantum'),
  (8,  'Kundalini & Kayakalpa — The Fire of Transformation', 'Shakti Rising · Bindu · Amrita · The Nectar Path', 'siddha-quantum'),
  (9,  'Varma & Marma — The Body''s Secret Control Points', 'Bogar''s Varma Vidya · 108 Vital Points · Activation Protocol', 'siddha-quantum'),
  (10, 'Kaya Siddhi — The Perfected Immortal Body', 'Eight Siddhis · Jyotir Deha · Deathlessness', 'akasha-infinity'),
  (11, 'Bogar''s Direct Transmission — Akashic Initiation', 'Five Master Mantras · Thirumoolar Protocol · Agastyar Formula', 'akasha-infinity'),
  (12, 'The 90-Day Kayakalpa Sadhana — Your Complete Protocol', 'Three Phases · Daily Schedule · Transformation Map', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
