CREATE TABLE IF NOT EXISTS public.ojas_rasayana_courses (
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

GRANT SELECT ON public.ojas_rasayana_courses TO authenticated;
GRANT ALL ON public.ojas_rasayana_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_ojas_rasayana_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ojas_rasayana_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ojas_rasayana_progress TO authenticated;
GRANT ALL ON public.user_ojas_rasayana_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_ojas_rasayana_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ojas_rasayana_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ojas_rasayana_section_progress TO authenticated;
GRANT ALL ON public.user_ojas_rasayana_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_ojas_rasayana_progress_user ON public.user_ojas_rasayana_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ojas_rasayana_section_progress_user_module
  ON public.user_ojas_rasayana_section_progress(user_id, module_id);

ALTER TABLE public.ojas_rasayana_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ojas_rasayana_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ojas_rasayana_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY ojas_rasayana_courses_select_auth ON public.ojas_rasayana_courses
  FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY user_ojas_rasayana_progress_select_own ON public.user_ojas_rasayana_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_progress_insert_own ON public.user_ojas_rasayana_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_progress_update_own ON public.user_ojas_rasayana_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_progress_delete_own ON public.user_ojas_rasayana_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_section_progress_select_own ON public.user_ojas_rasayana_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_section_progress_insert_own ON public.user_ojas_rasayana_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_section_progress_update_own ON public.user_ojas_rasayana_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_ojas_rasayana_section_progress_delete_own ON public.user_ojas_rasayana_section_progress
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

DROP TRIGGER IF EXISTS update_user_ojas_rasayana_section_progress_updated_at
  ON public.user_ojas_rasayana_section_progress;

CREATE TRIGGER update_user_ojas_rasayana_section_progress_updated_at
  BEFORE UPDATE ON public.user_ojas_rasayana_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ojas_rasayana_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm01', 'The Secret Essence: What Is Ojas?', 'Ojas is the eighth and final dhatu — the supreme distillate produced when all seven tissue layers are perfectly nourished and refined. The Siddhas cal', 'free'),
  (2, 'm02', 'The Seven Dhatu Refinement Cascade', 'Each dhatu takes approximately 5 days to transform. The complete cycle from food to Para Ojas takes 35 days. This module maps the sacred alchemy the S', 'free'),
  (3, 'm03', 'Signs of Abundant vs Depleted Ojas', 'The ancient texts give precise diagnostic markers. This module provides the complete Siddha and Ayurvedic framework for self-assessment — including th', 'free'),
  (4, 'm04', 'The Great Depleters — Bindu, Sexual Vital Force and the Siddha Secret', 'The Siddhas were explicit: unregulated creative-force emission is the single greatest cause of Ojas depletion. Thirumoolar dedicates entire cantos to ', 'prana-flow'),
  (5, 'm05', 'Emotional Poison and the Ojas Acid Bath', 'The Siddhas identified specific emotional states as Ojas-dissolving acids. Modern neuroscience confirms this — chronic stress directly breaks down wha', 'prana-flow'),
  (6, 'm06', 'Dietary Depletion — Tamasic Codes and the Microbiome Oracle', 'The Siddhas classified foods by their precise action on all seven Dhatus. This module gives the complete Siddha dietary depletion map — including mode', 'prana-flow'),
  (7, 'm07', 'Overexertion, Suppression and the Pranic Debt', 'The Siddhas identified 13 urges that must never be suppressed — creating Vega Dharana, a pranic short-circuit that burns Ojas. Simultaneously, excessi', 'prana-flow'),
  (8, 'm08', 'Rasayana — The Siddha Immortality Pharmacy', 'Rasayana is a complete technology for tissue regeneration at the quantum level. The Siddhas developed 108 Rasayana formulations of which only a fracti', 'siddha-quantum'),
  (9, 'm09', 'Mantra Technology for Ojas Cultivation', 'Specific mantras create specific cymatic patterns in the body that accelerate Dhatu refinement. This module gives the complete Siddha mantra technolog', 'siddha-quantum'),
  (10, 'm10', 'Pranayama — The Pranic Ojas Pump', 'Prana is the carrier wave for Ojas formation. Without adequate Pranic force, no amount of Rasayana fully converts into Para Ojas. The Siddhas develope', 'siddha-quantum'),
  (11, 'm11', 'Mudra Seals and Marma Points for Ojas Activation', 'The body contains specific energy intersections and hand-seal configurations that directly regulate Ojas flow. The Siddhas mapped 107+1 Marma points —', 'siddha-quantum'),
  (12, 'm12', 'Kaya Kalpa — The Siddha Body-Immortality Science', 'Kaya Kalpa means body transformation and is the advanced Siddha technology for complete cellular regeneration using maximized Ojas. When Para Ojas rea', 'akasha-infinity'),
  (13, 'm13', 'Amrita Nadi and the Ojas-Consciousness Interface', 'At peak Para Ojas, a dormant channel called the Amrita Nadi activates — running from the Hridaya directly to the crown, bypassing the Sushumna. When O', 'akasha-infinity'),
  (14, 'm14', 'Bhakti as the Supreme Ojas Generator', 'The most closely guarded secret of the Siddha tradition: Prema (unconditional love) is the single most powerful Ojas generator in existence. One hour ', 'akasha-infinity'),
  (15, 'm15', 'Jyotir Deha — Transmutation into the Light Body', 'The final secret teaching of the 18 Siddhas: when Para Ojas reaches its absolute maximum and is combined with perfected Pranayama, Mantra, Bhakti and ', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;