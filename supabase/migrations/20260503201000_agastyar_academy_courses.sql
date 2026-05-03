-- ============================================================================
-- Agastyar Academy — Siddha-Ayurvedic curriculum catalog + user progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ayurveda_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL CHECK (module_number >= 1 AND module_number <= 108),
  phase integer NOT NULL CHECK (phase >= 1 AND phase <= 5),
  title text NOT NULL,
  description text,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  duration_minutes integer,
  content_type text,
  content_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_number)
);

CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ayurveda_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_ayurveda_courses_phase ON public.ayurveda_courses(phase);
CREATE INDEX IF NOT EXISTS idx_ayurveda_courses_tier ON public.ayurveda_courses(tier_required);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);

ALTER TABLE public.ayurveda_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ayurveda_courses_select_auth ON public.ayurveda_courses;
CREATE POLICY ayurveda_courses_select_auth ON public.ayurveda_courses
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_course_progress_select_own ON public.user_course_progress;
CREATE POLICY user_course_progress_select_own ON public.user_course_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_course_progress_insert_own ON public.user_course_progress;
CREATE POLICY user_course_progress_insert_own ON public.user_course_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_course_progress_update_own ON public.user_course_progress;
CREATE POLICY user_course_progress_update_own ON public.user_course_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_course_progress_delete_own ON public.user_course_progress;
CREATE POLICY user_course_progress_delete_own ON public.user_course_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Phase 1 seed (modules 1–12), free tier — ON CONFLICT preserves manual edits
INSERT INTO public.ayurveda_courses (module_number, phase, title, description, tier_required, duration_minutes, content_type)
VALUES
  (1, 1, 'The Origin Story: What Is Ayurveda & Siddha Medicine?', 'Ayurveda etymology; Charaka, Sushruta, Ashtanga Hridayam; 18 Siddhars and Agastyar lineage; UNESCO palm manuscripts; why SQI integrates both systems.', 'free', 45, 'video'),
  (2, 1, 'The Five Great Elements (Panchamahabhuta)', 'Akasha, Vayu, Tejas, Apas, Prithvi — how they compose matter and disease; elemental self-assessment; bioenergetic frequency hook.', 'free', 60, 'interactive'),
  (3, 1, 'The Three Doshas: Your Cosmic Blueprint', 'Vata, Pitta, Kapha; Prakriti vs Vikriti; seven Prakriti types; dosha quiz; profile integration for AI.', 'free', 120, 'interactive'),
  (4, 1, 'The Three Humors of Siddha: Mukkuttram', 'Vatham, Pitham, Kabam; ten Vatha types; Siddha nuance beyond Tridosha — exclusive Siddha layer.', 'free', 90, 'pdf'),
  (5, 1, 'The Seven Dhatus: Your Body''s Fabric', 'Rasa through Shukra/Artava; Ojas as eighth subtle dhatu; link to Nadi Scanner assessments.', 'free', 90, 'video'),
  (6, 1, 'Agni: The Sacred Digestive Fire', 'Jatharagni; four states and thirteen Agnis; Ama; daily practices; dashboard Agni score hook.', 'free', 60, 'video'),
  (7, 1, 'The Three Malas: Waste Intelligence', 'Purisha, Mutra, Sweda; Mala as diagnostic tool in Siddha.', 'free', 45, 'pdf'),
  (8, 1, 'Ayurvedic Daily Routine (Dinacharya)', 'Brahma Muhurta through Ratricharya; tongue, nasya, abhyanga; Temple Home tracker hook.', 'free', 120, 'video'),
  (9, 1, 'Seasonal Routine (Ritucharya)', 'Six ritus; foods and routines; seasonal notification hook.', 'free', 60, 'pdf'),
  (10, 1, 'The Ayurvedic Kitchen: Food as First Medicine', 'Shad rasa; Virya, Vipaka, Prabhava; foundational foods; personalized lists by dosha.', 'free', 120, 'video'),
  (11, 1, 'Introduction to Siddha Herbs (Padardha Guna)', 'Classification; 25 foundational herbs; taste-potency-effect; safety and sourcing; Agastya chat hook.', 'free', 90, 'pdf'),
  (12, 1, 'The Breath of Life: Pranayama Fundamentals', 'Five pranas; Nadi Shodhana, Bhastrika, Ujjayi, Bhramari; Siddha Kaya Kalpa preview; breathwork biometric hook.', 'free', 120, 'audio')
ON CONFLICT (module_number) DO NOTHING;
