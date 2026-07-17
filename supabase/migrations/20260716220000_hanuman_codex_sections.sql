-- Hanuman Codex: real Supabase-backed tables, matching the established
-- pattern -- with one structural difference from every other academy.
-- Content here is tier-gated PER ITEM (each verse, weapon, siddhi has
-- its own tier field), not per whole module. So all 7 module rows below
-- are seeded as 'free' at the module level -- everyone can open any
-- section -- and the actual gating happens per-card inside the reader,
-- checked against each item's own tier in
-- src/data/hanumanCodexContent.ts.

CREATE TABLE IF NOT EXISTS public.hanuman_codex_sections (
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

CREATE TABLE IF NOT EXISTS public.user_hanuman_codex_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.hanuman_codex_sections(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_hanuman_codex_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.hanuman_codex_sections(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_hanuman_codex_progress_user ON public.user_hanuman_codex_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hanuman_codex_section_progress_user_module
  ON public.user_hanuman_codex_section_progress(user_id, module_id);

ALTER TABLE public.hanuman_codex_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hanuman_codex_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hanuman_codex_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY hanuman_codex_sections_select_auth ON public.hanuman_codex_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_hanuman_codex_progress_select_own ON public.user_hanuman_codex_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_progress_insert_own ON public.user_hanuman_codex_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_progress_update_own ON public.user_hanuman_codex_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_progress_delete_own ON public.user_hanuman_codex_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_hanuman_codex_section_progress_select_own ON public.user_hanuman_codex_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_section_progress_insert_own ON public.user_hanuman_codex_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_section_progress_update_own ON public.user_hanuman_codex_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_hanuman_codex_section_progress_delete_own ON public.user_hanuman_codex_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.hanuman_codex_sections (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'chalisa', 'The Hanuman Chalisa', '43 Verses — Devanagari, Meaning & Esoteric Transmission', 'free'),
  (2, 'ghata', 'Ghata — Sacred Movement', '8 Physical Practices Embodying Hanuman''s Shakti', 'free'),
  (3, 'sadhana', 'The Sadhana Curriculum', 'From Muladhara to Sahasrara — Your Complete Practice Path', 'free'),
  (4, 'weapons', 'The 8 Divine Weapons', 'Myth, Inner Meaning & Physical Alchemy of Each Astra', 'free'),
  (5, 'training', 'Physical Training', 'Akhara Tradition, Ojas Alchemy & the Chiranjeevi Body', 'free'),
  (6, 'siddhis', 'Siddhis & Nidhis', 'The 8 Ashta-Siddhis and 9 Nidhis of Total Mastery', 'free'),
  (7, 'devotion', 'Deep Devotion', 'From Sundar Kanda to Prema Bhakti — The Path of the Heart', 'free')
ON CONFLICT (module_number) DO NOTHING;
