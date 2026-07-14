-- Siddha Medicine Academy: real Supabase-backed tables, recovered content.
-- Mirrors the Agastyar/Kayakalpa pattern -- metadata here, rich teaching
-- content in src/data/siddhaMedicineModuleContent.ts (recovered from git
-- history, commit a48bd6a1). See that file's header for the quality note
-- on the Akasha-Infinity tier content.
--
-- module_key (e.g. "f1", "p3", "a11") is the lookup key into
-- SIDDHA_MEDICINE_CURRICULUM in the data file -- module_number is just a
-- sequential 1-32 ordering for the courses table itself.

CREATE TABLE IF NOT EXISTS public.siddha_medicine_courses (
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

CREATE TABLE IF NOT EXISTS public.user_siddha_medicine_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.siddha_medicine_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_siddha_medicine_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.siddha_medicine_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_siddha_medicine_progress_user ON public.user_siddha_medicine_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_siddha_medicine_section_progress_user_module
  ON public.user_siddha_medicine_section_progress(user_id, module_id);

ALTER TABLE public.siddha_medicine_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_siddha_medicine_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_siddha_medicine_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS siddha_medicine_courses_select_auth ON public.siddha_medicine_courses;
CREATE POLICY siddha_medicine_courses_select_auth ON public.siddha_medicine_courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS user_siddha_medicine_progress_select_own ON public.user_siddha_medicine_progress;
CREATE POLICY user_siddha_medicine_progress_select_own ON public.user_siddha_medicine_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_progress_insert_own ON public.user_siddha_medicine_progress;
CREATE POLICY user_siddha_medicine_progress_insert_own ON public.user_siddha_medicine_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_progress_update_own ON public.user_siddha_medicine_progress;
CREATE POLICY user_siddha_medicine_progress_update_own ON public.user_siddha_medicine_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_progress_delete_own ON public.user_siddha_medicine_progress;
CREATE POLICY user_siddha_medicine_progress_delete_own ON public.user_siddha_medicine_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_siddha_medicine_section_progress_select_own ON public.user_siddha_medicine_section_progress;
CREATE POLICY user_siddha_medicine_section_progress_select_own ON public.user_siddha_medicine_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_section_progress_insert_own ON public.user_siddha_medicine_section_progress;
CREATE POLICY user_siddha_medicine_section_progress_insert_own ON public.user_siddha_medicine_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_section_progress_update_own ON public.user_siddha_medicine_section_progress;
CREATE POLICY user_siddha_medicine_section_progress_update_own ON public.user_siddha_medicine_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_medicine_section_progress_delete_own ON public.user_siddha_medicine_section_progress;
CREATE POLICY user_siddha_medicine_section_progress_delete_own ON public.user_siddha_medicine_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed the 32 real modules recovered from git history.
INSERT INTO public.siddha_medicine_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'f1', 'Origins of Siddha — The Living Science of Tamil Masters', 'Akashic transmission from Agathiyar himself', 'free'),
  (2, 'f2', 'Pancha Bhutas in Daily Life — Elemental Medicine', 'Living the elements as Siddha healing practice', 'free'),
  (3, 'f3', 'First 10 Sacred Herbs — Consciousness-Activated Plants', 'The complete beginner Siddha pharmacopoeia', 'free'),
  (4, 'f4', 'Siddha Lifestyle (Pathyam) — Daily Codes for Immortality', 'The daily protocol taught by the 18 Siddhas', 'free'),
  (5, 'p1', 'Complete Siddha Herbal Pharmacopoeia — 64 Sacred Plants', 'The full Gunapadam plant transmission', 'prana-flow'),
  (6, 'p2', 'Varma Shastra — The 108 Vital Points of Power', 'Foundation transmission of Siddha''s secret healing system', 'prana-flow'),
  (7, 'p3', 'Ettavidha Pariksha — 8 Methods of Siddha Diagnosis', 'Reading the body as a Siddha physician', 'prana-flow'),
  (8, 'p4', 'Advanced Siddha Dietary Medicine', 'Food as alchemical medicine — the complete system', 'prana-flow'),
  (9, 'p5', 'Thirumoolar''s Thirumantiram — Healing Through the 3000 Verses', 'Direct transmission from the immortal Siddha', 'prana-flow'),
  (10, 'p6', 'Siddha Yoga — The Original Posture Science', 'Before Hatha Yoga — the Siddha body cultivation system', 'prana-flow'),
  (11, 'p7', 'Mantra Medicine — Sound as Healing Technology', 'The vibrational pharmacopoeia of the Siddhas', 'prana-flow'),
  (12, 'q1', 'Kayakalpa — The Science of Physical Immortality', 'The crown jewel of Siddha medicine — complete transmission', 'siddha-quantum'),
  (13, 'q2', 'Muppu — The Three Sacred Salts of Alchemy', 'The most secret preparation in Siddha tradition', 'siddha-quantum'),
  (14, 'q3', 'Advanced Varma — 12 Lethal & 96 Healing Points', 'Secret Varma knowledge transmitted from Agathiyar', 'siddha-quantum'),
  (15, 'q4', 'Rasa Vaitham — Siddha Mercury Alchemy', 'The purification and therapeutic use of metals and minerals', 'siddha-quantum'),
  (16, 'q5', 'The 18 Siddhas — Individual Transmissions & Specialties', 'Deep darshan of each master''s unique gift', 'siddha-quantum'),
  (17, 'q6', 'Gnana Marga — Siddha''s Path of Pure Wisdom', 'The cognitive-liberation medicine of the Siddhas', 'siddha-quantum'),
  (18, 'q7', 'Siddha Tantra & Shakti Medicine', 'Divine feminine healing science of the Tamil tradition', 'siddha-quantum'),
  (19, 'q8', 'Siddha Psychiatry — Healing the Mind-Soul Interface', 'Mano Roga — the ancient Siddha approach to mental medicine', 'siddha-quantum'),
  (20, 'q9', 'Siddha Astrology-Medicine Integration (Jyotisha-Vaidya)', 'Planetary medicine and cosmic timing in healing', 'siddha-quantum'),
  (21, 'a1', 'Complete Kayakalpa Mastery — The Full 3-Year System', 'The unabridged immortality transmission', 'akasha-infinity'),
  (22, 'a2', 'Siddha Deekshai — The Initiation Science', 'Receiving, holding, and transmitting Siddha shakti', 'akasha-infinity'),
  (23, 'a3', 'Complete 18 Siddhas System — Every Master, Every Gift', 'Living Darshan transmission of all 18 Pathinen Siddhargal', 'akasha-infinity'),
  (24, 'a4', 'Nadi Jyotish & Siddha Astro-Medicine', 'The complete Nadi leaf system and cosmic medicine', 'akasha-infinity'),
  (25, 'a5', 'Complete Muppu — All Preparations & Secrets', 'The complete three-salt system in its entirety', 'akasha-infinity'),
  (26, 'a6', 'Siddha Sound Medicine — Nada Brahman Complete System', 'The full vibrational healing pharmacopoeia', 'akasha-infinity'),
  (27, 'a7', 'Advanced Varma — The 18 Marma & 108 Varma Master Map', 'Complete Varma transmission including all lethal points', 'akasha-infinity'),
  (28, 'a8', 'Living Plant Medicine — Siddha Plant Consciousness System', 'Communicating with and receiving medicine from plants', 'akasha-infinity'),
  (29, 'a9', 'Complete Rasa Vaitham — Full Metal Alchemy', 'The full metal transmutation science', 'akasha-infinity'),
  (30, 'a10', 'Siddha Healer Certification — Becoming a Living Instrument', 'The path to authentic Siddha practice', 'akasha-infinity'),
  (31, 'a11', 'Agathiyar''s Complete Medical Texts — Original Translations', 'Direct access to the source texts with commentary', 'akasha-infinity'),
  (32, 'a12', 'Siddha 2050 — The Future of Consciousness Medicine', 'Integrating ancient Siddha with quantum biology and SQI technology', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
