CREATE TABLE IF NOT EXISTS public.mantra_academy_courses (
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

GRANT SELECT ON public.mantra_academy_courses TO authenticated;
GRANT ALL ON public.mantra_academy_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_mantra_academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mantra_academy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mantra_academy_progress TO authenticated;
GRANT ALL ON public.user_mantra_academy_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_mantra_academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mantra_academy_courses(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mantra_academy_lesson_progress TO authenticated;
GRANT ALL ON public.user_mantra_academy_lesson_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_mantra_academy_progress_user ON public.user_mantra_academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mantra_academy_lesson_progress_user ON public.user_mantra_academy_lesson_progress(user_id);

ALTER TABLE public.mantra_academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mantra_academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mantra_academy_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY mantra_academy_courses_select_auth ON public.mantra_academy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_mantra_academy_progress_select_own ON public.user_mantra_academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_progress_insert_own ON public.user_mantra_academy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_progress_update_own ON public.user_mantra_academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_progress_delete_own ON public.user_mantra_academy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_mantra_academy_lesson_progress_select_own ON public.user_mantra_academy_lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_lesson_progress_insert_own ON public.user_mantra_academy_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_lesson_progress_update_own ON public.user_mantra_academy_lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mantra_academy_lesson_progress_delete_own ON public.user_mantra_academy_lesson_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_mantra_academy_lesson_progress_updated_at ON public.user_mantra_academy_lesson_progress;
CREATE TRIGGER update_user_mantra_academy_lesson_progress_updated_at
  BEFORE UPDATE ON public.user_mantra_academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mantra_academy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'module-01', 'AUM — The Primordial Algorithm', 'Pranava Nada · First Transmission', 'free'),
  (2, 'module-02', 'What Is Japa? The Science of Repetition', 'Repetition Technology · Neural Entrainment · The Living Mala', 'free'),
  (3, 'module-03', 'Nada Yoga — The Path of Sound', 'Ahata & Anahata Nada · The 10 Inner Sounds · Dissolving the Mind', 'free'),
  (4, 'module-04', 'Bija Mantras — The Quantum Seeds', 'Elemental Frequency Codes · Compressed Transmission · Body Activation', 'free'),
  (5, 'module-05', 'Setting Up Your Sadhana Space', 'Scalar Field Creation · Environmental Preparation · The Living Altar', 'free'),
  (6, 'module-06', 'Gayatri — The Solar Transmission', 'The Most Powerful Mantra Ever Heard · 24 Syllables · The Living Sun', 'free'),
  (7, 'module-07', 'Chakra Mantra Activation System', '7-Center Nada Map · Full Spectrum Activation · The Living Body of Sound', 'prana-flow'),
  (8, 'module-08', 'Mantra Timing — The Cosmic Calendar', 'Muhurta Science · Nakshatra Power · Planetary Hours · Lunar Amplification', 'prana-flow'),
  (9, 'module-09', 'Pranayama-Mantra Integration', 'Breath-Sound Interface · Prana-Nada Fusion · The Living Technology', 'prana-flow'),
  (10, 'module-10', 'Deity Mantras — Working with Cosmic Intelligence', 'The Divine Pharmacopoeia · Avataric Blueprints · Precise Cosmic Interface', 'prana-flow'),
  (11, 'module-11', 'Healing Mantras — Sound as Medicine', 'Nada Chikitsa · The Divine Pharmacopoeia · Siddha Sound Healing', 'prana-flow'),
  (12, 'module-12', 'Kirtan & Bhajan — Devotional Nada Alchemy', 'Prema-Pulse Transmission · Group Field Technology · The Heart That Sings', 'prana-flow'),
  (13, 'module-13', 'The 18 Siddhas — Their Transmissions', 'Avataric Blueprint Codex · Lineage Frequency Map · Direct Meeting', 'siddha-quantum'),
  (14, 'module-14', 'Mahavatar Babaji — The Kriya Sound Codes', 'The Immortal Himalayan Siddha · Spinal Electricity · The Breath That Defeats Death', 'siddha-quantum'),
  (15, 'module-15', 'Tantric Mantra Science — The Hidden Grammar', 'Shakti Vidya · Sri Vidya · Yantra · Nyasa · The Complete Tantric Architecture', 'siddha-quantum'),
  (16, 'module-16', 'Kundalini Mantras — The Serpent Fire Codes', 'The Most Powerful Force in the Human System · Safe Ascent · The Siddha Protocol', 'siddha-quantum'),
  (17, 'module-17', 'Guru Mantra — Lineage Transmission', 'The Guru Principle · Shaktipat Science · The Living Chain · Sri Vishwananda', 'siddha-quantum'),
  (18, 'module-18', 'Sound Alchemy — Transmuting Karma Through Nada', 'The Three Karmas · Taraka Mantra · Ancestor Dissolution · Complete Karma Shodhana', 'siddha-quantum'),
  (19, 'module-19', 'Para · Pashyanti · Madhyama · Vaikhari', 'The Complete Four-Level Sound Theory · Operating at All Levels Simultaneously', 'akasha-infinity'),
  (20, 'module-20', 'Mantra Siddhi — The Perfection', 'The Signs · The Protocol · What It Produces · The Practitioner Who Has Arrived', 'akasha-infinity'),
  (21, 'module-21', 'The Secret Siddha Mantras', 'Why Secrets Exist · The Four Highest Transmissions · What Cannot Be Written', 'akasha-infinity'),
  (22, 'module-22', 'Nada Brahman — Sound as Ultimate Reality', 'The Universe IS Sound · The Physics and Metaphysics · The Final Teaching', 'akasha-infinity'),
  (23, 'module-23', 'Creating Living Mantras', 'Authentic Composition · Receiving New Transmissions · The Practitioner as Channel', 'akasha-infinity'),
  (24, 'module-24', 'The SQI 2050 Transmission Protocol', 'The Complete Integration · The Practitioner Who Has Arrived · What Happens Now', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;