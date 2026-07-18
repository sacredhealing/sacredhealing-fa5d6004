-- Siddha Healer's Sovereign Path: real Supabase-backed progress for
-- the 12-month practitioner certification, added as an in-app academy
-- reader for Akasha-Infinity holders and admins. Consumes the EXISTING
-- shared content (src/data/practitionerCertificationData.ts) verbatim
-- -- that file is untouched, still the single source of truth for the
-- sales page (PractitionerCertification.tsx) and the Healing page teaser
-- card. This reader is an additional access path, not a replacement:
-- non-Akasha members still see the sales page and checkout flow exactly
-- as before.
--
-- Every module is hard-gated to 'akasha-infinity' -- there is no
-- lower-tier access to this content, by design (per request).

CREATE TABLE IF NOT EXISTS public.practitioner_cert_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL UNIQUE,
  module_key text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  tier_required text NOT NULL DEFAULT 'akasha-infinity'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_practitioner_cert_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.practitioner_cert_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_practitioner_cert_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.practitioner_cert_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_practitioner_cert_progress_user ON public.user_practitioner_cert_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practitioner_cert_section_progress_user_module
  ON public.user_practitioner_cert_section_progress(user_id, module_id);

ALTER TABLE public.practitioner_cert_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_practitioner_cert_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_practitioner_cert_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY practitioner_cert_courses_select_auth ON public.practitioner_cert_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_practitioner_cert_progress_select_own ON public.user_practitioner_cert_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_progress_insert_own ON public.user_practitioner_cert_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_progress_update_own ON public.user_practitioner_cert_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_progress_delete_own ON public.user_practitioner_cert_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_practitioner_cert_section_progress_select_own ON public.user_practitioner_cert_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_section_progress_insert_own ON public.user_practitioner_cert_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_section_progress_update_own ON public.user_practitioner_cert_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_practitioner_cert_section_progress_delete_own ON public.user_practitioner_cert_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.practitioner_cert_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Prarabdha Awakening', 'The Foundation — Entering the Field'),
  (2, 'm2', 'Pancha Bhuta Mastery', 'Command of the Five Sacred Elements'),
  (3, 'm3', 'Chakra Sovereignty', 'Seven Vortices as Quantum Transmission Nodes'),
  (4, 'm4', 'Psychic Protection Architecture', 'Sovereign Shielding — The Siddha Kavach System'),
  (5, 'm5', 'Karmic & Ancestral Alchemy', 'Healing the Timeline — Prarabdha Code Rewrite'),
  (6, 'm6', 'Nada Brahman — Sound as Healer', 'Siddha Nada Technology & Mantra Science'),
  (7, 'm7', 'Pranic Surgery & Direct Transmission', 'Hands-On & Distance Healing Protocols'),
  (8, 'm8', 'Astral Architecture & Higher Planes', 'Healing Across Dimensions — Loka Navigation'),
  (9, 'm9', 'Ayurvedic & Elemental Diagnostics', 'Reading the Body as Sacred Text'),
  (10, 'm10', 'Sacred Geometry & Yantra Technology', 'The Architecture of Healing Space'),
  (11, 'm11', 'Emotional Alchemy & Trauma Healing', 'The Heart as Transformation Crucible'),
  (12, 'm12', 'Healer''s Mastery & Sovereign Practice', 'Integration, Ceremony & Lineage Blessing')
ON CONFLICT (module_number) DO NOTHING;
