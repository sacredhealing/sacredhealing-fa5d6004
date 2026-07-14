-- Siddha Fasting Academy: real Supabase-backed tables, recovered content.
-- Same pattern as Agastyar/Kayakalpa/Siddha Medicine -- metadata here,
-- rich teaching content in src/data/siddhaFastingModuleContent.ts
-- (23 modules, 98 lessons, extracted from the original page file).
--
-- module_key (e.g. "01", "12") is the lookup key into
-- SIDDHA_FASTING_CURRICULUM -- module_number is just a sequential 1-23
-- ordering for the courses table itself.

CREATE TABLE IF NOT EXISTS public.siddha_fasting_courses (
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

CREATE TABLE IF NOT EXISTS public.user_siddha_fasting_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.siddha_fasting_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_siddha_fasting_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.siddha_fasting_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_siddha_fasting_progress_user ON public.user_siddha_fasting_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_siddha_fasting_section_progress_user_module
  ON public.user_siddha_fasting_section_progress(user_id, module_id);

ALTER TABLE public.siddha_fasting_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_siddha_fasting_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_siddha_fasting_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS siddha_fasting_courses_select_auth ON public.siddha_fasting_courses;
CREATE POLICY siddha_fasting_courses_select_auth ON public.siddha_fasting_courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS user_siddha_fasting_progress_select_own ON public.user_siddha_fasting_progress;
CREATE POLICY user_siddha_fasting_progress_select_own ON public.user_siddha_fasting_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_progress_insert_own ON public.user_siddha_fasting_progress;
CREATE POLICY user_siddha_fasting_progress_insert_own ON public.user_siddha_fasting_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_progress_update_own ON public.user_siddha_fasting_progress;
CREATE POLICY user_siddha_fasting_progress_update_own ON public.user_siddha_fasting_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_progress_delete_own ON public.user_siddha_fasting_progress;
CREATE POLICY user_siddha_fasting_progress_delete_own ON public.user_siddha_fasting_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_siddha_fasting_section_progress_select_own ON public.user_siddha_fasting_section_progress;
CREATE POLICY user_siddha_fasting_section_progress_select_own ON public.user_siddha_fasting_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_section_progress_insert_own ON public.user_siddha_fasting_section_progress;
CREATE POLICY user_siddha_fasting_section_progress_insert_own ON public.user_siddha_fasting_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_section_progress_update_own ON public.user_siddha_fasting_section_progress;
CREATE POLICY user_siddha_fasting_section_progress_update_own ON public.user_siddha_fasting_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_siddha_fasting_section_progress_delete_own ON public.user_siddha_fasting_section_progress;
CREATE POLICY user_siddha_fasting_section_progress_delete_own ON public.user_siddha_fasting_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed the 23 real modules extracted from the original page file.
INSERT INTO public.siddha_fasting_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, '01', 'Upavasa — The Sacred Science of Siddha Fasting', 'Before the first meal is skipped, the understanding must be complete. This module dismantles every misconception about fasting and replaces it with the Siddha''s own direct revelation — that fasting is not absence but presence, not loss but gain, not suffering but the highest form of sadhana.', 'free'),
  (2, '02', 'The Science Behind Fasting — Quantum Biology Meets Vedic Wisdom', 'The Nobel Prize was awarded for autophagy in 2016. The Siddhas described it in 200 BCE. This module bridges both worlds, giving you the scientific understanding that deepens conviction, dispels fear, and allows you to read your body''s signals accurately during fasting.', 'free'),
  (3, '03', 'Ekadashi — The Cosmic Fasting Code of the Lunar Calendar', 'Ekadashi is the most widely practiced fasting tradition in the Vedic world — and the least understood. This module reveals the actual astronomical, physiological and spiritual mechanics behind why the 11th lunar day is the most powerful day in the month for fasting, consciousness expansion, and spiritual progression.', 'free'),
  (4, '04', 'The Sattvic Foundation — Preparing Your Body for Sacred Fasting', 'Fasting without preparation is like planting seeds in unprepared soil. This module gives you the complete pre-fast preparation system — dietary, herbal, psychological and energetic — so that when you fast, the results are profound rather than merely uncomfortable.', 'free'),
  (5, '05', 'Intermittent Fasting — The Siddha 16:8 and Beyond', 'Thirumoolar practiced time-restricted eating long before the term was coined in a laboratory. This module reveals the exact protocols the Siddhas used, now validated by cutting-edge circadian biology research, and shows you how to implement them as a living spiritual practice rather than a dieting strategy.', 'prana-flow'),
  (6, '06', 'Pradosham, Amavasya & Pournami — Fasting to the Cosmic Rhythm', 'The Vedic calendar is a fasting calendar. Every major sacred time marker has an associated fasting practice, and each activates a different dimension of the practitioner''s inner universe. This module maps the complete sacred fasting calendar and shows you how to work with these cosmic rhythms as a living practice.', 'prana-flow'),
  (7, '07', 'The 3-Day Water Fast — Gateway to the Siddha State', 'The 3-day water fast is the most significant threshold in the Siddha fasting path. It crosses you into biological territory that intermittent fasting cannot reach — complete glycogen depletion, deep ketosis, stem cell activation, immune regeneration. This module is the complete guide, hour by hour, for crossing that threshold safely and powerfully.', 'prana-flow'),
  (8, '08', 'Fasting & Pranayama — The Twin Pillars of Nadi Purification', 'Pranayama and fasting are the two most powerful tools in the Siddha purification system, and their combination is exponentially more powerful than either alone. This module teaches you exactly which pranayama practices to use at each stage of fasting for maximum safety, depth and transformation.', 'prana-flow'),
  (9, '09', 'Herbal Fasting Allies — The Siddha Pharmacopoeia of Upavasa', 'The Siddhas were the world''s first pharmacologists. They mapped the medicinal properties of thousands of plants and developed precise formulations for supporting specific physiological and spiritual processes — including the process of extended fasting. These herbs are not supplements; they are intelligent allies that amplify and protect every phase of your fasting practice.', 'prana-flow'),
  (10, '10', 'Fasting for Mental & Emotional Alchemy', 'Fasting reveals what is hidden. Every unprocessed emotion, every suppressed memory, every unconscious pattern that has been buried beneath the noise of regular eating and the busyness of ordinary life will surface during fasting. This module teaches you to receive these revelations as gifts rather than obstacles — and to use the fasting state for genuine psychological and karmic purification.', 'prana-flow'),
  (11, '11', 'Kaya Kalpa Fasting — The Siddha Art of Radical Cellular Rejuvenation', 'Kaya Kalpa is the most closely guarded secret in the Siddha tradition. Never before compiled in accessible form, this module reveals the complete Kaya Kalpa fasting science — the protocol that has allowed Siddha masters to maintain extraordinary physical sovereignty for centuries.', 'siddha-quantum'),
  (12, '12', 'The 7-Day Extended Fast — Siddha Tapas of the Highest Order', 'The 7-day water fast is the most significant biological transformation available through fasting alone. Stem cells activated. Immune system fully regenerated. Epigenome significantly rewritten. Consciousness permanently elevated. This module is the complete guide for safely entering, navigating and integrating this profound threshold.', 'siddha-quantum'),
  (13, '13', 'Dry Fasting — The Most Powerful & Controversial Siddha Tapas', 'Dry fasting — abstaining from both food and water — is the most extreme and most rapidly transformative fasting modality known. It is also the most dangerous if practiced without understanding. This module provides the complete science, history, contraindications and precise protocols for those who are called to this advanced practice.', 'siddha-quantum'),
  (14, '14', 'Dosha-Based Fasting Protocols — Personalized Siddha Intelligence', 'One fasting protocol does not fit all constitutions. The Siddha tradition''s sophisticated constitutional medicine — equivalent to and integrated with Ayurvedic Prakriti assessment — provides the framework for fasting protocols precisely calibrated to your unique physiological and energetic constitution. This module gives you that personalization.', 'siddha-quantum'),
  (15, '15', 'Chakra Fasting — Quantum Field Purification by Energy Center', 'Each chakra governs a specific dimension of experience and is associated with specific foods, eating patterns and psychological dynamics. This module reveals the Siddha science of targeted chakra purification through fasting — seven chakras, seven protocols, one complete system of energetic liberation.', 'siddha-quantum'),
  (16, '16', 'Samadhi Fasting — Upavasa as Gateway to Non-Dual States', 'The ultimate purpose of Siddha fasting is not health, not longevity, not even the extraordinary siddhis that extended fasting can produce. The ultimate purpose is Samadhi — the direct experience of reality as it is, without the filter of the conditioned mind. This module reveals the precise mechanisms by which fasting opens the door to the highest states of consciousness.', 'siddha-quantum'),
  (17, '17', 'Fasting & Cancer: What Oncologists & Siddhas Agree On', 'The convergence of cutting-edge oncology research and Siddha medical wisdom on the role of fasting in cancer prevention and treatment is one of the most important stories in modern health science. This module presents both traditions with full integrity — and with honest acknowledgment of what fasting can and cannot do.', 'siddha-quantum'),
  (18, '18', 'The 40-Day Fast — Siddha Tapas of Mahavatar Babaji', 'The 40-day fast is the threshold that separates fasting practice from fasting mastery. Every major spiritual tradition has a 40-day marker — Moses, Jesus, Mohammed, the Siddhas. This module reveals why 40 days is the specific biological and spiritual threshold, and how to prepare for, navigate and integrate this extraordinary undertaking.', 'akasha-infinity'),
  (19, '19', 'Breatharianism — Living on Prana Alone', 'The most radical claim of the Siddha tradition: that the human body can be sustained entirely without food or water, nourished directly from the pranic field. This module examines the documented cases, the physiology, the Siddha protocols, and the ethical framework around teaching this most advanced of all paths.', 'akasha-infinity'),
  (20, '20', 'The Akashic Fasting Oracle — Jyotish & Nadi Guidance for Your Practice', 'The Siddhas embedded fasting guidance in the stars and in the ancient Nadi leaves. This module reveals how to use Jyotish (Vedic astrology) and Nadi Jyotish to identify the fasting protocols that are specifically indicated for your individual soul''s journey — and how to read the cosmic timing for when to fast and what to release.', 'akasha-infinity'),
  (21, '21', 'Quantum Physics of Fasting — The SQI 2050 Science', 'The frontier of fasting science in 2050 has moved far beyond caloric restriction research. This module presents the cutting-edge understanding of fasting as a quantum biological phenomenon — biophoton enhancement, morphogenetic field restructuring, scalar wave interactions, and zero-point field nourishment.', 'akasha-infinity'),
  (22, '22', 'Fasting & Death — The Siddha Science of Conscious Departure', 'The most taboo topic in fasting education is the one the Siddhas considered the most important: the relationship between fasting mastery and the art of dying consciously. This module approaches this sacred teaching with full reverence and complete intellectual honesty.', 'akasha-infinity'),
  (23, '23', 'The SQI Sacred Fasting Retreat — Design, Teaching & Transmission', 'For those called to share this wisdom with others — this final module of the Academy teaches you how to design, hold and transmit a genuinely transformative Siddha fasting retreat, whether online or in person, and how to build it as a dharmic and financially sustainable offering to the world.', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
