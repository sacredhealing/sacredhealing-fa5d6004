-- Create is_admin_v3 helper if missing
CREATE OR REPLACE FUNCTION public.is_admin_v3()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- ============================================================================
-- Migration 1: Agastyar Academy base tables
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

DROP POLICY IF EXISTS user_course_progress_select_own ON public.user_course_progress;
CREATE POLICY user_course_progress_select_own ON public.user_course_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_course_progress_insert_own ON public.user_course_progress;
CREATE POLICY user_course_progress_insert_own ON public.user_course_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_course_progress_update_own ON public.user_course_progress;
CREATE POLICY user_course_progress_update_own ON public.user_course_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_course_progress_delete_own ON public.user_course_progress;
CREATE POLICY user_course_progress_delete_own ON public.user_course_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Phase 1 seed (1-12)
INSERT INTO public.ayurveda_courses (module_number, phase, title, description, tier_required, duration_minutes, content_type) VALUES
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

-- ============================================================================
-- Migration 2: pdf_url, audio_url
-- ============================================================================
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS audio_url text;

-- ============================================================================
-- Migration 3: extended downloads
-- ============================================================================
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.ayurveda_courses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.user_course_progress ADD COLUMN IF NOT EXISTS bookmarked boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_course_progress ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.dosha_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vata_score integer NOT NULL DEFAULT 0,
  pitta_score integer NOT NULL DEFAULT 0,
  kapha_score integer NOT NULL DEFAULT 0,
  prakriti text,
  vikriti text,
  raw_answers jsonb NOT NULL DEFAULT '{}',
  assessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dosha_assessments_user ON public.dosha_assessments(user_id);
ALTER TABLE public.dosha_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dosha_assessments_own_all ON public.dosha_assessments;
CREATE POLICY dosha_assessments_own_all ON public.dosha_assessments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ayurveda_courses_select_auth ON public.ayurveda_courses;
DROP POLICY IF EXISTS ayurveda_courses_select_published ON public.ayurveda_courses;
DROP POLICY IF EXISTS ayurveda_courses_admin_manage ON public.ayurveda_courses;

CREATE POLICY ayurveda_courses_select_published ON public.ayurveda_courses
  FOR SELECT USING (is_published = true);
CREATE POLICY ayurveda_courses_admin_manage ON public.ayurveda_courses
  FOR ALL TO authenticated
  USING (public.is_admin_v3()) WITH CHECK (public.is_admin_v3());

-- Catalog seed (1-36)
INSERT INTO public.ayurveda_courses (module_number, phase, title, subtitle, description, tier_required, duration_minutes, content_type, tags) VALUES
(1,  1, 'The Origin Story', 'What Is Ayurveda & Siddha Medicine?', 'Discover the cosmic origins of the world''s oldest healing systems through Agastyar''s direct transmission.', 'free', 45, 'video', ARRAY['foundations','history','siddha']),
(2,  1, 'Panchamahabhuta', 'The Five Great Elements', 'Learn how Ether, Air, Fire, Water, and Earth are the building blocks of all matter, all health, and all disease.', 'free', 60, 'interactive', ARRAY['foundations','elements','cosmology']),
(3,  1, 'The Three Doshas', 'Your Cosmic Blueprint', 'Discover Vata, Pitta, and Kapha — and receive your personalized Prakriti (birth constitution) assessment.', 'free', 120, 'interactive', ARRAY['doshas','assessment','foundations']),
(4,  1, 'Mukkuttram', 'The Three Humors of Siddha', 'The deeper Siddha layer beyond Tridosha — the 10 types of Vatham, 5 types of Pitham, 5 types of Kabam.', 'free', 90, 'video', ARRAY['siddha','mukkuttram','exclusive']),
(5,  1, 'The Seven Dhatus', 'Your Body''s Sacred Fabric', 'From plasma to reproductive essence — understand the 7 tissues that build your physical form and the Ojas that transcends it.', 'free', 90, 'video', ARRAY['dhatus','anatomy','ojas']),
(6,  1, 'Agni: The Sacred Fire', 'Your Digestive Intelligence', 'The 13 types of Agni, the 4 states of digestive fire, and the Siddha secret of Ama (toxic accumulation).', 'free', 60, 'video', ARRAY['agni','digestion','foundations']),
(7,  1, 'The Three Malas', 'Waste as Diagnostic Wisdom', 'Learn to read your body''s elimination intelligence — the ancient art of Mala diagnosis.', 'free', 45, 'pdf', ARRAY['diagnosis','malas','foundations']),
(8,  1, 'Dinacharya', 'The Sacred Daily Routine', 'From Brahma Muhurta awakening to evening wind-down — the complete Ayurvedic daily protocol for optimal health.', 'free', 120, 'video', ARRAY['dinacharya','lifestyle','practice']),
(9,  1, 'Ritucharya', 'Living With Earth''s Breath', 'The 6 seasons of Ayurveda and how to align your diet, herbs, and lifestyle with Nature''s cycles.', 'free', 60, 'pdf', ARRAY['seasons','ritucharya','lifestyle']),
(10, 1, 'The Ayurvedic Kitchen', 'Food as First Medicine', 'The 6 Tastes, Virya, Vipaka, Prabhava — and 10 foundational foods that transform health at the cellular level.', 'free', 120, 'video', ARRAY['food','nutrition','rasas']),
(11, 1, 'Siddha Herbs: Foundation', 'Padardha Guna — Plant Intelligence', 'The 25 foundational herbs of the Siddha-Ayurvedic tradition. Classification by Taste-Potency-Effect.', 'free', 90, 'video', ARRAY['herbs','siddha','botany']),
(12, 1, 'Pranayama Fundamentals', 'The Breath of Life', 'The 5 Pranas, Nadi Shodhana, Bhastrika, Ujjayi, Bhramari — and a preview of Siddha Kaya Kalpa breathing.', 'free', 120, 'audio', ARRAY['pranayama','breath','practice']),
(13, 2, 'Nadi Vigyan', 'The Pulse as Cosmic Language', 'Master the 3 classical Nadi positions and the 9-pulse Siddha Nadi Shastra system for diagnosing all imbalances.', 'prana-flow', 180, 'video', ARRAY['nadi','diagnosis','siddha']),
(14, 2, 'Siddha Diagnostic Arts', 'Tongue, Urine & Eye Reading', 'Neermani Nool urine analysis, tongue mapping, and eye diagnosis — the Siddha diagnostic system with no Western parallel.', 'prana-flow', 120, 'video', ARRAY['diagnosis','siddha','exclusive']),
(15, 2, 'Kriya Kala', 'The 6-Stage Disease Model', 'Learn to detect disease before symptoms appear. The most powerful preventive medicine framework ever devised.', 'prana-flow', 120, 'video', ARRAY['pathology','prevention','diagnosis']),
(16, 2, 'Panchakarma', 'The Five Great Purifications', 'Vamana, Virechana, Basti, Nasya, Raktamokshana — the complete science of cellular renewal and dosha elimination.', 'prana-flow', 240, 'video', ARRAY['panchakarma','purification','clinical']),
(17, 2, 'Marma Science', '108 Vital Points', 'Sushruta''s complete map of the 108 Marma points — the intersections of life force in the physical body.', 'prana-flow', 240, 'video', ARRAY['marma','bodywork','anatomy']),
(18, 2, 'Varma Therapy', 'The Siddha Energy Point Science', 'The rarest Siddha teaching — Varma points, Thokkanam, and the 9 sacred touches. Taught only in Tamil Nadu gurukulas.', 'prana-flow', 240, 'video', ARRAY['varma','siddha','exclusive']),
(19, 2, 'Siddha Alchemy & Muppu', 'The Crown Secret', 'Muppu — the universal solvent of the Siddhars. Kaya Kalpa, Navapashanam, and the science of bodily immortality.', 'prana-flow', 180, 'video', ARRAY['alchemy','muppu','rasayana','exclusive']),
(20, 2, 'Dravya Guna', 'Advanced Herbology', 'The 50 classical herbs of Charaka Samhita, the 10 Dashemani groups, and traditional preparation methods.', 'prana-flow', 240, 'video', ARRAY['herbs','herbology','clinical']),
(21, 2, 'Rasayana Science', 'The Art of Rejuvenation', 'Classical and Siddha Rasayanas, Ojas building, and the 4-stage Kaya Kalpa cellular rebirth protocol.', 'prana-flow', 180, 'video', ARRAY['rasayana','antiaging','ojas']),
(22, 2, 'Manas Shastra', 'Ayurvedic Psychology', 'The 3 Gunas, 16 psychological types, and Sattvavajaya therapy — the oldest psycho-spiritual healing system.', 'prana-flow', 180, 'video', ARRAY['psychology','gunas','mental-health']),
(23, 2, 'Mantra Medicine', 'Sound as Cellular Reprogramming', 'Beeja Mantras, Nada Yoga, Agastyar''s healing transmissions, and the physics of sacred sound.', 'prana-flow', 180, 'audio', ARRAY['mantra','sound','healing']),
(24, 2, 'Jyotish-Ayurveda', 'Planets as Doshas', 'How the 9 Grahas affect your constitution, Nakshatra healing protocols, and Mahadasha health vulnerability maps.', 'prana-flow', 120, 'video', ARRAY['jyotish','astrology','doshas']),
(25, 3, 'Ashtavidha Pariksha', 'The 8-Fold Clinical Examination', 'Master the complete Siddha-Ayurvedic diagnostic system: pulse, urine, stool, tongue, sound, touch, eyes, and form.', 'siddha-quantum', 240, 'video', ARRAY['clinical','diagnosis','practice']),
(26, 3, 'Chikitsa Sutras', 'Disease Management Protocols', 'Treatment protocols for 40 common conditions — from IBS to PCOS, anxiety to autoimmune disorders.', 'siddha-quantum', 360, 'video', ARRAY['clinical','treatment','protocols']),
(27, 3, 'Siddha Disease Classification', '4448 Conditions', 'The most comprehensive disease classification in human history — and the 96 Tattvams that underlie all pathology.', 'siddha-quantum', 240, 'pdf', ARRAY['pathology','siddha','classification']),
(28, 3, 'Classical Formulations', 'Bhaishajya Kalpana', '50 classical compound formulas — Triphala, Chyawanprash, Mahanarayan Taila, Siddha Parpams and more.', 'siddha-quantum', 360, 'video', ARRAY['formulations','pharmacy','clinical']),
(29, 3, 'Panchakarma Practitioner', 'Full Clinical Training', 'Complete protocols for all 5 Karmas including Shirodhara, Basti krama, Nasya types, and home practice setup.', 'siddha-quantum', 480, 'video', ARRAY['panchakarma','clinical','practitioner']),
(30, 3, 'Siddha Yoga & Kundalini', 'The Alchemical Path', 'The 18 Siddhar postures, Kaya Kalpa yoga, Vaasi pranayama, and the 6 Adharas (Siddha chakra system).', 'siddha-quantum', 300, 'video', ARRAY['yoga','kundalini','siddha']),
(31, 3, 'Nutrition Mastery', 'Ahara Vidhi', 'The 8 rules of eating, Viruddha Ahara (food incompatibilities), therapeutic cooking, and Ayurvedic fasting protocols.', 'siddha-quantum', 240, 'video', ARRAY['nutrition','food','clinical']),
(32, 3, 'Stri Roga & Shakti Alchemy', 'Women''s Sacred Medicine', 'PCOS, endometriosis, Garbhini Paricharya (pregnancy care), Sutika (postpartum) — the complete feminine health system.', 'siddha-quantum', 240, 'video', ARRAY['womens-health','shakti','clinical']),
(33, 3, 'Advanced Sound Alchemy', 'Mantra Transmission Medicine', 'The 51 Beeja Mantras, Dhanvantari initiation, Agastyar''s secret healing mantras, and charging matter with sound.', 'siddha-quantum', 240, 'audio', ARRAY['mantra','sound','advanced']),
(34, 3, 'Roopashastra', 'Ayurvedic Skin & Beauty', 'The 7 skin layers, dosha skin typing, classical Lepa formulas, Keshya hair protocols, and Rasayana for radiance.', 'siddha-quantum', 180, 'video', ARRAY['beauty','skin','formulations']),
(35, 3, 'Integrative Medicine', 'Ayurveda Meets Modern Science', 'Microbiome as Agni, epigenetics as Prakriti, peer-reviewed research, and working alongside MDs.', 'siddha-quantum', 180, 'pdf', ARRAY['research','integrative','science']),
(36, 3, 'The Healing Practice', 'Building Your Sovereign Business', 'The Vaidya''s oath, practice setup, documentation, pricing, and the Siddha-Naval-Elon model of wealth through service.', 'siddha-quantum', 120, 'video', ARRAY['business','practice','wealth'])
ON CONFLICT (module_number) DO NOTHING;

-- Phase 4 + 5 modules (37-108)
INSERT INTO public.ayurveda_courses (module_number, phase, title, subtitle, description, tier_required, duration_minutes, content_type, tags)
SELECT 
  36 + n,
  CASE WHEN 36 + n <= 84 THEN 4 ELSE 5 END,
  CASE
    WHEN 36 + n BETWEEN 37 AND 48 THEN 'Nadi Shastra Mastery ' || (36 + n - 36)
    WHEN 36 + n BETWEEN 49 AND 60 THEN 'Varma Mastery: The Adangal ' || (36 + n - 48)
    WHEN 36 + n BETWEEN 61 AND 72 THEN 'Rasayana Mastery ' || (36 + n - 60)
    WHEN 36 + n BETWEEN 73 AND 84 THEN 'The 18 Siddhars'' Sciences ' || (36 + n - 72)
    WHEN 36 + n BETWEEN 85 AND 96 THEN 'Siddha Cosmology & Quantum ' || (36 + n - 84)
    ELSE 'Master Integration ' || (36 + n - 96)
  END,
  'Akasha Infinity Transmission',
  'Advanced Siddha transmission — available exclusively to Akasha Infinity initiates.',
  'akasha-infinity',
  180,
  'live',
  ARRAY['advanced','siddha','transmission','akasha']
FROM generate_series(1, 72) AS n
ON CONFLICT (module_number) DO NOTHING;