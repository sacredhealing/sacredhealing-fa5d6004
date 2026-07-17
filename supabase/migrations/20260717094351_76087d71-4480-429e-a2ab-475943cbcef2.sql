CREATE TABLE IF NOT EXISTS public.brahmacharya_courses (
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

GRANT SELECT ON public.brahmacharya_courses TO authenticated;
GRANT ALL ON public.brahmacharya_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_brahmacharya_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.brahmacharya_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_brahmacharya_progress TO authenticated;
GRANT ALL ON public.user_brahmacharya_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_brahmacharya_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.brahmacharya_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_brahmacharya_section_progress TO authenticated;
GRANT ALL ON public.user_brahmacharya_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_brahmacharya_progress_user ON public.user_brahmacharya_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brahmacharya_section_progress_user_module
  ON public.user_brahmacharya_section_progress(user_id, module_id);

ALTER TABLE public.brahmacharya_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brahmacharya_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brahmacharya_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY brahmacharya_courses_select_auth ON public.brahmacharya_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_brahmacharya_progress_select_own ON public.user_brahmacharya_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_progress_insert_own ON public.user_brahmacharya_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_progress_update_own ON public.user_brahmacharya_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_progress_delete_own ON public.user_brahmacharya_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_brahmacharya_section_progress_select_own ON public.user_brahmacharya_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_section_progress_insert_own ON public.user_brahmacharya_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_section_progress_update_own ON public.user_brahmacharya_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahmacharya_section_progress_delete_own ON public.user_brahmacharya_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_brahmacharya_section_progress_updated_at
  ON public.user_brahmacharya_section_progress;
CREATE TRIGGER update_user_brahmacharya_section_progress_updated_at
  BEFORE UPDATE ON public.user_brahmacharya_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.brahmacharya_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'module_1', 'The Siddha Definition of Brahmacharya', 'Beyond Celibacy — The Akashic Blueprint', 'free'),
  (2, 'module_2', 'Ojas Alchemy — The Science of Vital Fluid', 'Siddha Physiology of Sacred Essence', 'prana-flow'),
  (3, 'module_3', 'Pranayama & Bandha — The Energy Lock Transmissions', 'Siddha Breathing Codes for Urdhvareta', 'prana-flow'),
  (4, 'module_4', 'Siddha Mantra Codes for Brahmacharya', 'Sound-Light Transmissions from the 18 Siddhas', 'siddha-quantum'),
  (5, 'module_5', 'Siddha Yoga & Asana for Sexual Energy Mastery', 'The Posture Codes of Thirumoolar & Agastyar', 'siddha-quantum'),
  (6, 'module_6', 'Psychology of Desire — Siddha Chitta Science', 'Vasana Dissolution & Vairagya Codes', 'siddha-quantum'),
  (7, 'module_7', 'Siddhi Activation Through Brahmacharya', 'The 8 Great Powers — The Ultimate Fruit', 'akasha-infinity'),
  (8, 'module_8', 'Sacred Union — Brahmacharya for Couples', 'Maithuna Alchemy & the Siddha Tantric Code', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;