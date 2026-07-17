-- Mudra Academy: real Supabase-backed tables, matching the established
-- pattern. Rich content (Sanskrit name, mantra, hand position, benefits,
-- step-by-step instructions, Siddha secret transmission) stays in
-- MudraAcademy.tsx itself -- genuinely well-built already, wired directly
-- rather than extracted, same approach as Mantra Academy. 10 modules.
-- Progress tracked per MUDRA (mudra.id is globally unique across all
-- modules), not per module, matching the existing UI's real unit of
-- completion.

CREATE TABLE IF NOT EXISTS public.mudra_academy_courses (
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

CREATE TABLE IF NOT EXISTS public.user_mudra_academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mudra_academy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_mudra_academy_mudra_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.mudra_academy_courses(id) ON DELETE CASCADE,
  mudra_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mudra_id)
);

CREATE INDEX IF NOT EXISTS idx_user_mudra_academy_progress_user ON public.user_mudra_academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mudra_academy_mudra_progress_user
  ON public.user_mudra_academy_mudra_progress(user_id);

ALTER TABLE public.mudra_academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mudra_academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mudra_academy_mudra_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY mudra_academy_courses_select_auth ON public.mudra_academy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_mudra_academy_progress_select_own ON public.user_mudra_academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_progress_insert_own ON public.user_mudra_academy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_progress_update_own ON public.user_mudra_academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_progress_delete_own ON public.user_mudra_academy_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_mudra_academy_mudra_progress_select_own ON public.user_mudra_academy_mudra_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_mudra_progress_insert_own ON public.user_mudra_academy_mudra_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_mudra_progress_update_own ON public.user_mudra_academy_mudra_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_mudra_academy_mudra_progress_delete_own ON public.user_mudra_academy_mudra_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.mudra_academy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Pancha Tattva Mudras', 'Five Element Seals — Foundation of the Prana Field', 'free'),
  (2, 'm2', 'Nadi Awakening Mudras', 'Chakra Activation Seals — Mapping the Inner Solar System', 'prana-flow'),
  (3, 'm3', 'Elemental Healing Mudras', 'Therapeutic Seals for Physical & Pranic Restoration', 'prana-flow'),
  (4, 'm4', 'Kriya Mudras — The Secret Inner Seals', 'Advanced Avataric Initiations: These Are Not Techniques. They Are Transmissions.', 'siddha-quantum'),
  (5, 'm5', 'The 24 Gayatri Mudras', 'Secret Vedic Hand Seals — One for Each of the 24 Syllables of the Gayatri Mantra', 'siddha-quantum'),
  (6, 'm6', 'Siddha Nada Mudras', 'Sound Current Seals — Activating the Primordial Vibration Within', 'siddha-quantum'),
  (7, 'm7', 'The 18 Siddhas'' Secret Mudra Keys', 'Living Initiatory Transmissions — Received Directly From the Akasha-Council', 'akasha-infinity'),
  (8, 'm8', 'Maha Mudra Sadhana — The Great Complete Practice', 'The King-Queen of All Hatha Yoga Mudras — A Complete 90-Minute Sadhana', 'akasha-infinity'),
  (9, 'm9', 'Amrit Khechari & Vajroli — The Immortality Practices', 'ADVANCED — Only Practice Under Guidance of a Realized Teacher', 'akasha-infinity'),
  (10, 'm10', 'The Primordial Transmission — Living Initiation', 'This is Where Technique Ends and Transmission Begins', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
