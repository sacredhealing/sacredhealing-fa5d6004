
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
GRANT SELECT ON public.hanuman_codex_sections TO anon, authenticated;
GRANT ALL ON public.hanuman_codex_sections TO service_role;
ALTER TABLE public.hanuman_codex_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published sections" ON public.hanuman_codex_sections
  FOR SELECT USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.user_hanuman_codex_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.hanuman_codex_sections(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_hanuman_codex_progress TO authenticated;
GRANT ALL ON public.user_hanuman_codex_progress TO service_role;
ALTER TABLE public.user_hanuman_codex_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own progress" ON public.user_hanuman_codex_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own progress" ON public.user_hanuman_codex_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own progress" ON public.user_hanuman_codex_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own progress" ON public.user_hanuman_codex_progress FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_hanuman_codex_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.hanuman_codex_sections(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_hanuman_codex_section_progress TO authenticated;
GRANT ALL ON public.user_hanuman_codex_section_progress TO service_role;
ALTER TABLE public.user_hanuman_codex_section_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own section progress" ON public.user_hanuman_codex_section_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own section progress" ON public.user_hanuman_codex_section_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own section progress" ON public.user_hanuman_codex_section_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own section progress" ON public.user_hanuman_codex_section_progress FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_hanuman_section_progress_updated_at
  BEFORE UPDATE ON public.user_hanuman_codex_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hanuman_codex_sections (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'chalisa', 'Hanuman Chalisa', 'The 40-Verse Master Key — Complete Line-by-Line Alchemy', 'free'),
  (2, 'ghata', 'Ghata Ramayana', 'The Secret Kundalini Ramayana — Body as Battlefield', 'free'),
  (3, 'sadhana', 'Hanuman Sadhana', 'Daily Practice, Vratas & the Warrior-Devotee Path', 'free'),
  (4, 'weapons', 'The 8 Divine Weapons', 'Myth, Inner Meaning & Physical Alchemy of Each Astra', 'free'),
  (5, 'training', 'Physical Training', 'Akhara Tradition, Ojas Alchemy & the Chiranjeevi Body', 'free'),
  (6, 'siddhis', 'Siddhis & Nidhis', 'The 8 Ashta-Siddhis and 9 Nidhis of Total Mastery', 'free'),
  (7, 'devotion', 'Deep Devotion', 'From Sundar Kanda to Prema Bhakti — The Path of the Heart', 'free')
ON CONFLICT (module_number) DO NOTHING;
