
CREATE TABLE IF NOT EXISTS public.yogananda_codex_chapters (
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

GRANT SELECT ON public.yogananda_codex_chapters TO authenticated;
GRANT ALL ON public.yogananda_codex_chapters TO service_role;

ALTER TABLE public.yogananda_codex_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY yogananda_codex_chapters_select_auth ON public.yogananda_codex_chapters
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_yogananda_codex_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.yogananda_codex_chapters(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_yogananda_codex_progress TO authenticated;
GRANT ALL ON public.user_yogananda_codex_progress TO service_role;

ALTER TABLE public.user_yogananda_codex_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_yogananda_codex_progress_select_own ON public.user_yogananda_codex_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_progress_insert_own ON public.user_yogananda_codex_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_progress_update_own ON public.user_yogananda_codex_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_progress_delete_own ON public.user_yogananda_codex_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_yogananda_codex_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.yogananda_codex_chapters(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_yogananda_codex_section_progress TO authenticated;
GRANT ALL ON public.user_yogananda_codex_section_progress TO service_role;

ALTER TABLE public.user_yogananda_codex_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_yogananda_codex_section_progress_select_own ON public.user_yogananda_codex_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_section_progress_insert_own ON public.user_yogananda_codex_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_section_progress_update_own ON public.user_yogananda_codex_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_yogananda_codex_section_progress_delete_own ON public.user_yogananda_codex_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_yogananda_codex_progress_user
  ON public.user_yogananda_codex_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_yogananda_codex_section_progress_user_module
  ON public.user_yogananda_codex_section_progress(user_id, module_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_yogananda_codex_section_progress_updated_at
  ON public.user_yogananda_codex_section_progress;
CREATE TRIGGER update_user_yogananda_codex_section_progress_updated_at
  BEFORE UPDATE ON public.user_yogananda_codex_section_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.yogananda_codex_chapters (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'ch1', 'My Parents and Early Life', 'Kashi Moni Ghosh', 'free'),
  (2, 'ch2', 'Mother''s Death and the Amulet', 'Lahiri Mahasaya', 'free'),
  (3, 'ch3', 'The Saint with Two Bodies', 'Swami Pranabananda', 'prana-flow'),
  (4, 'ch4', 'My Interrupted Flight Toward the Himalayas', 'Babaji indirect', 'free'),
  (5, 'ch5', 'The Tiger Swami', 'The Tiger Swami', 'prana-flow'),
  (6, 'ch6', 'The Levitating Saint — Nagendra Nath Bhaduri', 'Nagendra Nath Bhaduri', 'prana-flow'),
  (7, 'ch7', 'I Meet My Master — Sri Yukteswar', 'Sri Yukteswar Giri', 'free'),
  (8, 'ch8', 'Years in My Master''s Hermitage', 'Sri Yukteswar Giri', 'prana-flow'),
  (9, 'ch9', 'The Sleepless Saint — Ram Gopal Muzumdar', 'Ram Gopal Muzumdar', 'siddha-quantum'),
  (10, 'ch10', 'An Experience in Cosmic Consciousness', 'Yogananda', 'prana-flow'),
  (11, 'ch11', 'Outwitting the Stars — Vedic Astrology and Free Will', 'Sri Yukteswar Giri', 'prana-flow'),
  (12, 'ch12', 'The Science of Kriya Yoga', 'Lahiri Mahasaya and Babaji', 'prana-flow'),
  (13, 'ch13', 'The Sleepless Saint — Ram Gopal Muzumdar', 'Ram Gopal Muzumdar', 'siddha-quantum'),
  (14, 'ch14', 'Babaji — The Yogi-Christ of Modern India', 'Mahavatar Babaji', 'siddha-quantum'),
  (15, 'ch15', 'The Cauliflower Robbery', 'Sri Yukteswar Giri', 'prana-flow'),
  (16, 'ch16', 'Therese Neumann — The Catholic Stigmatist', 'Therese Neumann', 'siddha-quantum'),
  (17, 'ch17', 'Sasi and the Three Sapphires', 'Sri Yukteswar Giri', 'siddha-quantum'),
  (18, 'ch18', 'A Brother Disciple and Ranchi School', 'Sri Yukteswar and Yogananda', 'prana-flow'),
  (19, 'ch19', 'The Resurrection of Sri Yukteswar', 'Sri Yukteswar Giri', 'akasha-infinity'),
  (20, 'ch20', 'My Life in America — The Mission West', 'Yogananda', 'free'),
  (21, 'ch21', 'We Are Visited by a Himalayan Master', 'Mahavatar Babaji', 'siddha-quantum'),
  (22, 'ch22', 'The Law of Miracles', 'Sri Yukteswar Giri', 'prana-flow'),
  (23, 'ch23', 'The Swami Order and My Initiation', 'Sri Yukteswar Giri', 'prana-flow'),
  (24, 'ch24', 'Astrological Healing', 'Sri Yukteswar Giri', 'siddha-quantum'),
  (25, 'ch25', 'My Father and Sister Nalini', 'Bhagabati Ghosh and Nalini', 'free'),
  (26, 'ch26', 'Yogananda''s Vision of the Future', 'Yogananda', 'siddha-quantum'),
  (27, 'ch27', 'Mahatma Gandhi at Wardha', 'Mahatma Gandhi', 'prana-flow'),
  (28, 'ch28', 'The Christlike Life of Sri Yukteswar — Final Years', 'Sri Yukteswar Giri', 'prana-flow'),
  (29, 'ch29', 'Sri Yukteswar''s Mahasamadhi — The Lion Departs', 'Sri Yukteswar Giri', 'siddha-quantum'),
  (30, 'ch30', 'Babaji — The Yogi-Christ of Modern India', 'Mahavatar Babaji', 'siddha-quantum'),
  (31, 'ch31', 'The Science of Kriya Yoga — The Complete Teaching', 'Lahiri Mahasaya and Babaji', 'prana-flow'),
  (32, 'ch32', 'The Christlike Life of Lahiri Mahasaya', 'Lahiri Mahasaya', 'siddha-quantum'),
  (33, 'ch33', 'Therese Neumann — The Catholic Stigmatist', 'Therese Neumann', 'siddha-quantum'),
  (34, 'ch34', 'Luther Burbank — A Saint Amid the Roses', 'Luther Burbank', 'siddha-quantum'),
  (35, 'ch35', 'Cosmic Chants and the Sound of Creation', 'Yogananda and Music', 'prana-flow'),
  (36, 'ch36', 'Rabindranath Tagore — India''s Nobel Poet', 'Rabindranath Tagore', 'prana-flow'),
  (37, 'ch37', 'I Visit Ananda Moyi Ma', 'Ananda Moyi Ma', 'siddha-quantum'),
  (38, 'ch38', 'I Go to America — Farewell to India', 'Sri Yukteswar Giri', 'free'),
  (39, 'ch39', 'My First Years in America — Early Teachings', 'Yogananda', 'free'),
  (40, 'ch40', 'Peace and Harmony in the Modern World', 'Yogananda', 'free'),
  (41, 'ch41', 'Mahavatar Babaji — The Deathless Guru', 'Mahavatar Babaji', 'akasha-infinity'),
  (42, 'ch42', 'The Mission West — Yogananda''s Legacy', 'Yogananda', 'free'),
  (43, 'ch43', 'Kriya Yoga — The Purna Yoga', 'Babaji through Yogananda', 'siddha-quantum'),
  (44, 'ch44', 'The Resurrection Body — Subtle Matter and Astral Science', 'Sri Yukteswar Giri', 'siddha-quantum'),
  (45, 'ch45', 'My First Years in America — Early Teachings', 'Yogananda', 'free'),
  (46, 'ch46', 'The Resurrection of Sri Yukteswar', 'Sri Yukteswar Giri', 'akasha-infinity'),
  (47, 'ch47', 'The Mystery of Immortality — Babaji''s Secret', 'Mahavatar Babaji', 'akasha-infinity'),
  (48, 'ch48', 'Paramahansa Yogananda — The Making of a World Teacher', 'Yogananda', 'free'),
  (49, 'ch49', 'My Life in America — The East-West Bridge Complete', 'Yogananda', 'free')
ON CONFLICT (module_number) DO NOTHING;
