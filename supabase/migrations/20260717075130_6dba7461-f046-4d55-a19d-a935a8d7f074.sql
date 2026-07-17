CREATE TABLE IF NOT EXISTS public.holy_science_courses (
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

CREATE TABLE IF NOT EXISTS public.user_holy_science_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.holy_science_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_holy_science_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.holy_science_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT ON public.holy_science_courses TO authenticated;
GRANT ALL ON public.holy_science_courses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_holy_science_progress TO authenticated;
GRANT ALL ON public.user_holy_science_progress TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_holy_science_section_progress TO authenticated;
GRANT ALL ON public.user_holy_science_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_holy_science_progress_user ON public.user_holy_science_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_holy_science_section_progress_user_module
  ON public.user_holy_science_section_progress(user_id, module_id);

ALTER TABLE public.holy_science_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_holy_science_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_holy_science_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY holy_science_courses_select_auth ON public.holy_science_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_holy_science_progress_select_own ON public.user_holy_science_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_holy_science_progress_insert_own ON public.user_holy_science_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_holy_science_progress_update_own ON public.user_holy_science_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_holy_science_progress_delete_own ON public.user_holy_science_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_holy_science_section_progress_select_own ON public.user_holy_science_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_holy_science_section_progress_insert_own ON public.user_holy_science_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_holy_science_section_progress_update_own ON public.user_holy_science_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_holy_science_section_progress_delete_own ON public.user_holy_science_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_holy_science_section_progress_updated_at ON public.user_holy_science_section_progress;
CREATE TRIGGER update_user_holy_science_section_progress_updated_at
  BEFORE UPDATE ON public.user_holy_science_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.holy_science_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Introduction to The Holy Science', 'Who Was Sri Yukteshwar & Why This Book Matters in 2026', 'free'),
  (2, 'm2', 'The Yuga Cycle — The Corrected Chronology', 'Sri Yukteshwar''s Mathematical Correction of Cosmic Time', 'free'),
  (3, 'm3', 'The Five Koshas — Bodies of Light', 'Vedic Anatomy from Physical to Causal Body', 'prana-flow'),
  (4, 'm4', 'Dharma & the Path to Samadhi', 'Sri Yukteshwar''s Four Commandments & Five States of Union', 'prana-flow'),
  (5, 'm5', 'Mathematical Astrology of the Yugas', 'Jyotish, Precession & Cosmic Timing Science', 'siddha-quantum'),
  (6, 'm6', 'Kriya Yoga as Quantum Technology', 'Spinal Physics, Prana Science & the Compression of Karma', 'siddha-quantum'),
  (7, 'm7', 'The Holy Science & the Bible — Unified Code', 'Sri Yukteshwar''s Cross-Tradition Cosmic Decryption', 'akasha-infinity'),
  (8, 'm8', 'The Seven Lokas & Multidimensional Existence', 'Navigating the Astral & Causal Universes', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
