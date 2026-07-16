-- Kriya Yoga Mastery: real Supabase-backed tables, matching the
-- established pattern (Agastyar/Kayakalpa/Siddha Medicine/Siddha Fasting).
-- Metadata here, rich teaching content in src/data/kriyaYogaModuleContent.ts.
-- module_key (e.g. "m1") is the lookup key into KRIYA_MODULES.

CREATE TABLE IF NOT EXISTS public.kriya_yoga_courses (
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

CREATE TABLE IF NOT EXISTS public.user_kriya_yoga_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.kriya_yoga_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_kriya_yoga_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.kriya_yoga_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_kriya_yoga_progress_user ON public.user_kriya_yoga_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kriya_yoga_section_progress_user_module
  ON public.user_kriya_yoga_section_progress(user_id, module_id);

ALTER TABLE public.kriya_yoga_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kriya_yoga_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kriya_yoga_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY kriya_yoga_courses_select_auth ON public.kriya_yoga_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_kriya_yoga_progress_select_own ON public.user_kriya_yoga_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_progress_insert_own ON public.user_kriya_yoga_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_progress_update_own ON public.user_kriya_yoga_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_progress_delete_own ON public.user_kriya_yoga_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_kriya_yoga_section_progress_select_own ON public.user_kriya_yoga_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_section_progress_insert_own ON public.user_kriya_yoga_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_section_progress_update_own ON public.user_kriya_yoga_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_kriya_yoga_section_progress_delete_own ON public.user_kriya_yoga_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.kriya_yoga_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Akashic Origins', 'Before Time — The Cosmic Source of Kriya', 'free'),
  (2, 'm2', 'Mahavatar Babaji', 'The Immortal Presence — Guardian of Kriya Through the Ages', 'free'),
  (3, 'm3', 'The Sacred Lineages', 'Lahiri · Yukteswar · Yogananda · and the Hidden Masters', 'prana-flow'),
  (4, 'm4', 'The 18 Kriyas of Babaji', 'Complete Technical Transmissions — From the Akashic Record', 'prana-flow'),
  (5, 'm5', 'Sacred Mudras & Bandhas', 'The Secret Seals of Kriya — Gateways to Immortality', 'siddha-quantum'),
  (6, 'm6', 'Sacred Mantras & Nada', 'The Vibratory Codes of Kriya — Sound as Consciousness Technology', 'siddha-quantum'),
  (7, 'm7', 'Atma Kriya Yoga', 'Vishwananda''s Revelation — Babaji''s Gift for This Age', 'siddha-quantum'),
  (8, 'm8', 'The Siddha Kriya System', 'Tamil Siddha Secrets — The Ancient Root of All Kriya', 'siddha-quantum'),
  (9, 'm9', 'Initiations & Sacred Transmissions', 'The Hidden Gates — What Initiation Actually Does to the Nervous System', 'akasha-infinity'),
  (10, 'm10', 'Advanced Cosmic Kriyas', 'Beyond the Physical — Astral, Causal, and Turiya Kriyas', 'akasha-infinity'),
  (11, 'm11', 'Living Kriya', 'Your Daily Sadhana Map — From Dawn Practice to Deep Night', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
