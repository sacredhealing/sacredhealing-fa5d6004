-- Yagna Fire Academy: real Supabase-backed tables, matching the
-- established pattern. Metadata here, rich content (per-lesson body/
-- objectives, per-module practice protocol, outcomes) in
-- src/data/yagnaModuleContent.ts. 9 modules. There was no persistence
-- at all before this (not even localStorage) -- module/lesson expand
-- state reset on every page refresh.

CREATE TABLE IF NOT EXISTS public.yagna_courses (
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

CREATE TABLE IF NOT EXISTS public.user_yagna_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.yagna_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_yagna_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.yagna_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_yagna_progress_user ON public.user_yagna_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_yagna_section_progress_user_module
  ON public.user_yagna_section_progress(user_id, module_id);

ALTER TABLE public.yagna_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_yagna_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_yagna_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY yagna_courses_select_auth ON public.yagna_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_yagna_progress_select_own ON public.user_yagna_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_yagna_progress_insert_own ON public.user_yagna_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yagna_progress_update_own ON public.user_yagna_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yagna_progress_delete_own ON public.user_yagna_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_yagna_section_progress_select_own ON public.user_yagna_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_yagna_section_progress_insert_own ON public.user_yagna_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yagna_section_progress_update_own ON public.user_yagna_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yagna_section_progress_delete_own ON public.user_yagna_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.yagna_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'm1', 'Yagna — The Supreme Cosmic Technology', 'What Yagna is, why it exists, and what it does to your body and home on the first lighting.', 'free'),
  (2, 'm2', 'Pancha Agni — The Five Sacred Fires', 'Five cosmic fires, five chakras, five Vayus — activating all simultaneously through structured Yagna.', 'prana-flow'),
  (3, 'm3', 'Mantra Mechanics — Cymatics in the Fire', 'Why Sanskrit syllables are not prayers but physics — operating at four simultaneous levels when spoken into flame.', 'prana-flow'),
  (4, 'm4', 'Gayatri — Vishwamitra''s Fire Code', 'The 24 syllables decoded as an algorithm: vertebrae, biofield frequencies, Nakshatras — crystallized from 12,000 years of Tapas.', 'siddha-quantum'),
  (5, 'm5', 'The Seven Atmospheric Layers & Pitru Healing', 'Bhur, Bhuva, Svar as ignition keys unlocking seven lokas — and the Pitru Tarpana mechanism for healing 7 generations.', 'siddha-quantum'),
  (6, 'm6', 'Agastya''s Bhu-Shuddhi — Earth Purification', 'The Siddha science of using Yagna to heal land, water, and the local field — torsion physics and the Sulba Sutra Kunda codes.', 'siddha-quantum'),
  (7, 'm7', 'Navagraha Suddhi — Planetary Fire Codes', 'Each of the 9 cosmic intelligences has a specific combustion chemistry. 9 fires in sequence over 9 hours recalibrate everyone within 2km.', 'akasha-infinity'),
  (8, 'm8', 'Mrityunjaya Yagna — The Immortality Protocol', '108,000 Maha Mrityunjaya Japa + continuous fire + 7 simultaneous Rishi transmissions. The world''s oldest complete fire-medicine compendium decoded.', 'akasha-infinity'),
  (9, 'm9', 'The Inner Yagna — Consciousness as the Ultimate Fire', 'The Chandogya Upanishad''s final secret: the external Yagna was always training you for the internal one.', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
