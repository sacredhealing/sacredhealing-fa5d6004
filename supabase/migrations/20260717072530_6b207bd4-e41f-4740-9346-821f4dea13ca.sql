CREATE TABLE IF NOT EXISTS public.breatharian_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL UNIQUE,
  module_key text NOT NULL UNIQUE,
  title text NOT NULL,
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.breatharian_courses TO authenticated;
GRANT ALL ON public.breatharian_courses TO service_role;
ALTER TABLE public.breatharian_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY breatharian_courses_select_auth ON public.breatharian_courses
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_breatharian_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.breatharian_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_breatharian_progress TO authenticated;
GRANT ALL ON public.user_breatharian_progress TO service_role;
ALTER TABLE public.user_breatharian_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_breatharian_progress_select_own ON public.user_breatharian_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_breatharian_progress_insert_own ON public.user_breatharian_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_breatharian_progress_update_own ON public.user_breatharian_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_breatharian_progress_delete_own ON public.user_breatharian_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_breatharian_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.breatharian_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_breatharian_section_progress TO authenticated;
GRANT ALL ON public.user_breatharian_section_progress TO service_role;
ALTER TABLE public.user_breatharian_section_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_breatharian_section_progress_select_own ON public.user_breatharian_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_breatharian_section_progress_insert_own ON public.user_breatharian_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_breatharian_section_progress_update_own ON public.user_breatharian_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_breatharian_section_progress_delete_own ON public.user_breatharian_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_breatharian_progress_user ON public.user_breatharian_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_breatharian_section_progress_user_module
  ON public.user_breatharian_section_progress(user_id, module_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_breatharian_section_progress_updated_at ON public.user_breatharian_section_progress;
CREATE TRIGGER update_user_breatharian_section_progress_updated_at
  BEFORE UPDATE ON public.user_breatharian_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.breatharian_courses (module_number, module_key, title, tier_required) VALUES
  (1, 'F1', 'What Is Breatharianism? — The Siddha Science of Pranic Living', 'free'),
  (2, 'F2', 'The Five Pranas — Vedic Anatomy of the Life-Force Body', 'free'),
  (3, 'F3', 'Pranayama Foundations — Siddha Breathing Science', 'free'),
  (4, 'F4', 'The Siddha Diet Bridge — Preparing the Body for Pranic Living', 'free'),
  (5, 'P1', 'Advanced Siddha Pranayama — The Eight Kumbhakas', 'prana-flow'),
  (6, 'P2', 'Surya Vigyan — Solar Nourishment Science', 'prana-flow'),
  (7, 'P3', 'The Bandhas — Pranic Locks of the Siddhas', 'prana-flow'),
  (8, 'P4', 'Liquid Light Fasting — The Siddha Intermediate Path', 'prana-flow'),
  (9, 'P5', 'Chakra Nourishment — Feeding the Energy Body', 'prana-flow'),
  (10, 'SQ1', 'Kaya Kalpa — The Siddha Science of Physical Immortality', 'siddha-quantum'),
  (11, 'SQ2', 'Nada Yoga — Living on Sound & Vibration', 'siddha-quantum'),
  (12, 'SQ3', 'Turiya & Pranotthana — The Superconscious Pranic State', 'siddha-quantum'),
  (13, 'SQ4', 'Agni — The Inner Fire as Digestive & Cosmic Intelligence', 'siddha-quantum'),
  (14, 'SQ5', 'Shambhavi Mahamudra & Advanced Pranic Seals', 'siddha-quantum'),
  (15, 'SQ6', 'Living Water, Living Air — Pranic Elementalism', 'siddha-quantum'),
  (16, 'AI1', 'Babaji''s Living Transmission — The Complete Breatharian Path', 'akasha-infinity'),
  (17, 'AI2', 'The 18 Siddhas — Breatharian Transmissions', 'akasha-infinity'),
  (18, 'AI3', 'Scalar Wave Breatharianism — Quantum Field Prana Science', 'akasha-infinity'),
  (19, 'AI4', 'Advanced Khechari Mudra — The Supreme Breatharian Secret', 'akasha-infinity'),
  (20, 'AI5', 'The Soma Protocol — Nectar Body Activation', 'akasha-infinity'),
  (21, 'AI6', 'Bhakti Prana — Love as the Ultimate Nourishment', 'akasha-infinity'),
  (22, 'AI7', 'The Breatharian Integration — Living the Full Pranic Life', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;