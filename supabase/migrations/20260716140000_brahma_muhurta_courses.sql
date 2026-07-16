-- Brahma Muhurta: real Supabase-backed tables, matching the established
-- pattern. Metadata here, rich content (body, inner teaching, data points,
-- practice steps, mantras, secret teachings) in
-- src/data/brahmaMuhurtaModuleContent.ts.

CREATE TABLE IF NOT EXISTS public.brahma_muhurta_courses (
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

CREATE TABLE IF NOT EXISTS public.user_brahma_muhurta_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.brahma_muhurta_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_brahma_muhurta_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.brahma_muhurta_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_brahma_muhurta_progress_user ON public.user_brahma_muhurta_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brahma_muhurta_section_progress_user_module
  ON public.user_brahma_muhurta_section_progress(user_id, module_id);

ALTER TABLE public.brahma_muhurta_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brahma_muhurta_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brahma_muhurta_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY brahma_muhurta_courses_select_auth ON public.brahma_muhurta_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_brahma_muhurta_progress_select_own ON public.user_brahma_muhurta_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_progress_insert_own ON public.user_brahma_muhurta_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_progress_update_own ON public.user_brahma_muhurta_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_progress_delete_own ON public.user_brahma_muhurta_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_brahma_muhurta_section_progress_select_own ON public.user_brahma_muhurta_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_section_progress_insert_own ON public.user_brahma_muhurta_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_section_progress_update_own ON public.user_brahma_muhurta_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_brahma_muhurta_section_progress_delete_own ON public.user_brahma_muhurta_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.brahma_muhurta_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'What Is Brahma Muhurta?', 'The Hour of the Creator — Definition, Origin & Cosmic Context', 'free'),
  (2, 'm2', 'What Happens to Your Brain & Body', 'Neuroscience, Hormones & the Biology of the Sacred Hour', 'free'),
  (3, 'm3', 'The Vayu Code — Prana at Dawn', 'Why Pre-Dawn Air Is Categorically Different — Siddha Atmospheric Science', 'free'),
  (4, 'm4', 'The Cosmic Architecture of Time', 'Muhurtas, Yamas, the Vedic Time-Grid & the 30 Devas of the Day-Cycle', 'prana-flow'),
  (5, 'm5', 'Nadi Activation at Dawn', 'Ida, Pingala, Sushumna & the Brahma Muhurta Nadi Switch', 'prana-flow'),
  (6, 'm6', 'Agni at Dawn — Siddha Fire Science', 'Jatharagni, Urdhva Agni, Kayakalpa Preparation & the 13 Sacred Fires', 'prana-flow'),
  (7, 'm7', 'The Quantum Field of Brahma Muhurta', 'Schumann Resonance, Scalar Waves, Zero-Point Field & Nada-Brahma Currents', 'siddha-quantum'),
  (8, 'm8', 'Epigenetic Rewiring at the Brahma Hour', 'CLOCK Genes, BDNF, Telomeres & How Sadhana Edits the Genome', 'siddha-quantum'),
  (9, 'm9', 'The Moon-Amrita Connection', 'Chandra Mandala, Soma Secretion, Khechari Mudra & the Nectar of Immortality', 'siddha-quantum'),
  (10, 'm10', 'The Secret Mantras of Brahma Muhurta', 'Nava-Brahma Seed Transmission — Three Mantras Never Before Published', 'akasha-infinity'),
  (11, 'm11', 'The Complete Siddha Sadhana Krama', 'The 8-Step Sacred Sequence — Full Brahma Muhurta Practice Architecture', 'akasha-infinity'),
  (12, 'm12', 'The Kala Vortex — The Deepest Siddha Secret', 'Time-Portal Science, Karma Override & the Maha-Vakya Transmission', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
