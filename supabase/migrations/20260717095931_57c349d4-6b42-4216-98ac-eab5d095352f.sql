
CREATE TABLE IF NOT EXISTS public.shakti_cycle_courses (
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
GRANT SELECT ON public.shakti_cycle_courses TO authenticated;
GRANT ALL ON public.shakti_cycle_courses TO service_role;
ALTER TABLE public.shakti_cycle_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY shakti_cycle_courses_select_auth ON public.shakti_cycle_courses
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_shakti_cycle_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.shakti_cycle_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_shakti_cycle_progress TO authenticated;
GRANT ALL ON public.user_shakti_cycle_progress TO service_role;
ALTER TABLE public.user_shakti_cycle_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_shakti_cycle_progress_select_own ON public.user_shakti_cycle_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_progress_insert_own ON public.user_shakti_cycle_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_progress_update_own ON public.user_shakti_cycle_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_progress_delete_own ON public.user_shakti_cycle_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_shakti_cycle_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.shakti_cycle_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_shakti_cycle_section_progress TO authenticated;
GRANT ALL ON public.user_shakti_cycle_section_progress TO service_role;
ALTER TABLE public.user_shakti_cycle_section_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_shakti_cycle_section_progress_select_own ON public.user_shakti_cycle_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_section_progress_insert_own ON public.user_shakti_cycle_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_section_progress_update_own ON public.user_shakti_cycle_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_shakti_cycle_section_progress_delete_own ON public.user_shakti_cycle_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_shakti_cycle_progress_user ON public.user_shakti_cycle_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shakti_cycle_section_progress_user_module
  ON public.user_shakti_cycle_section_progress(user_id, module_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
DROP TRIGGER IF EXISTS update_user_shakti_cycle_section_progress_updated_at ON public.user_shakti_cycle_section_progress;
CREATE TRIGGER update_user_shakti_cycle_section_progress_updated_at
BEFORE UPDATE ON public.user_shakti_cycle_section_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.shakti_cycle_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'free-1', 'The Sacred Shakti Map', 'Understanding Your Cycle as a Consciousness Technology', 'free'),
  (2, 'free-2', 'Moon Medicine Basics', 'Aligning Your Cycle to Chandra''s Intelligence', 'free'),
  (3, 'free-3', 'Daily Shakti Rituals', '5-Minute Practices for Every Phase', 'free'),
  (4, 'free-4', 'Cycle Symptom Decoder', 'What Your Body Is Telling You Every Month', 'free'),
  (5, 'prana-1', 'Phase 1 Deep Protocol', 'Rtumati: Mastering Menstruation as Medicine', 'prana-flow'),
  (6, 'prana-2', 'Phase 2 Deep Protocol', 'Shuddha Kala: The Art of Pure Beginning', 'prana-flow'),
  (7, 'prana-3', 'Phase 3 Deep Protocol', 'Ritukala: Living at Full Power', 'prana-flow'),
  (8, 'prana-4', 'Phase 4 Deep Protocol', 'Rajah Kala: The Art of Sacred Completion', 'prana-flow'),
  (9, 'prana-5', 'Siddha Plant Medicine Encyclopedia', 'The Complete Sacred Feminine Apothecary', 'prana-flow'),
  (10, 'prana-6', 'Planetary Timing for Women', 'Jyotish & the Feminine Cosmic Calendar', 'prana-flow'),
  (11, 'prana-7', 'Sacred Mantras for Each Phase', 'Nada Shakti: Sound as Hormonal Medicine', 'prana-flow'),
  (12, 'prana-8', 'Shakti Pranayama Complete System', 'Breath as Hormonal Architect', 'prana-flow'),
  (13, 'prana-9', 'Emotional Alchemy Through the Cycle', 'The Feminine Shadow Integration System', 'prana-flow'),
  (14, 'akasha-1', 'The 7 Hidden Siddha Teachings', 'Never-Before-Shared Secrets of the Sacred Feminine', 'akasha-infinity'),
  (15, 'akasha-2', 'Pregnancy Preparation Protocol', '90-Day Shakti Preparation for Sacred Conception', 'akasha-infinity'),
  (16, 'akasha-3', 'Post-Partum Sacred Restoration', 'Siddha 42-Day Protocol for Complete Rebuilding', 'akasha-infinity'),
  (17, 'akasha-4', 'Scalar Wave Womb Healing', '2050 Quantum Technology for Uterine Restoration', 'akasha-infinity'),
  (18, 'akasha-5', 'The 28 Shakti Siddhis', 'Powers of the Fully Realized Feminine Being', 'akasha-infinity'),
  (19, 'akasha-6', 'Menopause as Mahashakti Awakening', 'The Greatest Initiation of a Woman''s Life', 'akasha-infinity'),
  (20, 'prana-10', 'Hormonal Nutrition Deep Dive', 'Food as Endocrine Architecture — The Complete Cycle-Synced System', 'prana-flow'),
  (21, 'prana-11', 'Thyroid & Adrenal Complete Protocol', 'Restoring the Hormonal Foundation Triangle', 'prana-flow'),
  (22, 'prana-12', 'Cycle Syncing with Work & Creativity', 'The Sovereign Shakti Business & Life Calendar', 'prana-flow'),
  (23, 'prana-13', 'Seed Cycling Complete Protocol', 'The Simplest Daily Hormone Balancer Known to Siddha Medicine', 'prana-flow'),
  (24, 'akasha-7', 'Fertility Consciousness', 'Inviting the Soul — Siddha Science of Conscious Conception', 'akasha-infinity'),
  (25, 'akasha-8', 'Epigenetic Reprogramming Through Siddha Practice', 'Rewriting Your Hormonal Genetic Expression', 'akasha-infinity'),
  (26, 'akasha-9', 'Past Life Patterns in Reproductive Health', 'Causal Body Healing for Persistent Reproductive Challenges', 'akasha-infinity'),
  (27, 'akasha-10', 'Sacred Womb Activation', 'Yoni Shakti — The Seat of All Creation', 'akasha-infinity'),
  (28, 'akasha-11', 'Kundalini Shakti Through the Menstrual Portal', 'Awakening the Serpent Fire Through the Feminine Gateway', 'akasha-infinity'),
  (29, 'akasha-12', 'The Bindu-Nada Secret', 'Sound Healing as Hormonal Architecture', 'akasha-infinity'),
  (30, 'akasha-13', 'Avataric Blueprint', 'Lalita Tripura Sundari''s Complete Feminine System', 'akasha-infinity'),
  (31, 'akasha-14', 'The 10 Avataric Women Masters', 'Their Teachings, Their Practices, Their Transmissions', 'akasha-infinity'),
  (32, 'akasha-15', 'Siddha Quantum Hormonal Intelligence', '2050 Technology for Endocrine Optimization', 'akasha-infinity'),
  (33, 'akasha-16', 'Ancestral Womb Healing', '7 Generations of Feminine Karma — Cleared', 'akasha-infinity'),
  (34, 'akasha-17', 'Sacred Feminine in the Quantum Age', '2050 Vision — Leading the New Earth as Realized Shakti', 'akasha-infinity'),
  (35, 'akasha-18', 'Living as a Fully Realized Shakti Being', 'The Complete Integration — Your Sovereign Life System', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
