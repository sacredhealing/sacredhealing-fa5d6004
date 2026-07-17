-- Ramayana Codex: real Supabase-backed tables, matching the established
-- pattern. Metadata here, rich content (intro + secrets[] per Kanda, each
-- secret with teaching/siddhaRevelation/activation/mantra) in
-- src/data/ramayanaCodexContent.ts. 7 Kandas, 33 secrets.

CREATE TABLE IF NOT EXISTS public.ramayana_codex_kandas (
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

CREATE TABLE IF NOT EXISTS public.user_ramayana_codex_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ramayana_codex_kandas(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_ramayana_codex_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.ramayana_codex_kandas(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ramayana_codex_progress_user ON public.user_ramayana_codex_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ramayana_codex_section_progress_user_module
  ON public.user_ramayana_codex_section_progress(user_id, module_id);

ALTER TABLE public.ramayana_codex_kandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ramayana_codex_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ramayana_codex_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY ramayana_codex_kandas_select_auth ON public.ramayana_codex_kandas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_ramayana_codex_progress_select_own ON public.user_ramayana_codex_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_progress_insert_own ON public.user_ramayana_codex_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_progress_update_own ON public.user_ramayana_codex_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_progress_delete_own ON public.user_ramayana_codex_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_ramayana_codex_section_progress_select_own ON public.user_ramayana_codex_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_section_progress_insert_own ON public.user_ramayana_codex_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_section_progress_update_own ON public.user_ramayana_codex_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_ramayana_codex_section_progress_delete_own ON public.user_ramayana_codex_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.ramayana_codex_kandas (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'k1', 'Bāla Kāṇḍa', 'बाल काण्ड — Mūlādhāra (Earth)', 'free'),
  (2, 'k2', 'Ayodhyā Kāṇḍa', 'अयोध्या काण्ड — Svādhiṣṭhāna (Water)', 'free'),
  (3, 'k3', 'Āraṇya Kāṇḍa', 'अरण्य काण्ड — Maṇipūra (Fire)', 'prana-flow'),
  (4, 'k4', 'Kiṣkindhā Kāṇḍa', 'किष्किन्धा काण्ड — Anāhata (Air)', 'prana-flow'),
  (5, 'k5', 'Sundara Kāṇḍa', 'सुन्दर काण्ड — Viśuddha (Space/Ether)', 'siddha-quantum'),
  (6, 'k6', 'Yuddha Kāṇḍa', 'युद्ध काण्ड — Ājñā (Light)', 'siddha-quantum'),
  (7, 'k7', 'Uttara Kāṇḍa', 'उत्तर काण्ड — Sahasrāra (Pure Consciousness)', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
