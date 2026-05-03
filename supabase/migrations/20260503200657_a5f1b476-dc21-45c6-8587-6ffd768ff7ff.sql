-- ============================================================================
-- Sovereign Jyotish Vidya — curriculum catalog + progress + oracle query logs
-- (consolidates 20260503220000_jyotish_vidya.sql + 20260503231500_jyotish_oracle_queries.sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jyotish_modules (
  id integer PRIMARY KEY CHECK (id >= 1 AND id <= 32),
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (tier_required IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity')),
  title text NOT NULL,
  subtitle text NOT NULL,
  description text,
  content_url text,
  pdf_url text,
  audio_url text,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_questions jsonb,
  duration_minutes integer,
  sort_order integer NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jyotish_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES public.jyotish_modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  quiz_score integer,
  notes text,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.jyotish_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id integer REFERENCES public.jyotish_modules(id) ON DELETE SET NULL,
  query text NOT NULL,
  response text,
  chart_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jyotish_oracle_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id integer CHECK (module_id IS NULL OR (module_id >= 1 AND module_id <= 32)),
  query text NOT NULL,
  response text,
  chart_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jyotish_modules_tier ON public.jyotish_modules(tier_required);
CREATE INDEX IF NOT EXISTS idx_jyotish_progress_user ON public.jyotish_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_jyotish_queries_user ON public.jyotish_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_jyotish_oracle_queries_user ON public.jyotish_oracle_queries(user_id);

ALTER TABLE public.jyotish_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jyotish_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jyotish_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jyotish_oracle_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jyotish_modules_select_anon_preview ON public.jyotish_modules;
CREATE POLICY jyotish_modules_select_anon_preview ON public.jyotish_modules
  FOR SELECT TO anon USING (is_published);

DROP POLICY IF EXISTS jyotish_modules_select_authenticated ON public.jyotish_modules;
CREATE POLICY jyotish_modules_select_authenticated ON public.jyotish_modules
  FOR SELECT TO authenticated USING (is_published);

DROP POLICY IF EXISTS jyotish_progress_select_own ON public.jyotish_progress;
CREATE POLICY jyotish_progress_select_own ON public.jyotish_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_progress_insert_own ON public.jyotish_progress;
CREATE POLICY jyotish_progress_insert_own ON public.jyotish_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_progress_update_own ON public.jyotish_progress;
CREATE POLICY jyotish_progress_update_own ON public.jyotish_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_progress_delete_own ON public.jyotish_progress;
CREATE POLICY jyotish_progress_delete_own ON public.jyotish_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_queries_select_own ON public.jyotish_queries;
CREATE POLICY jyotish_queries_select_own ON public.jyotish_queries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_queries_insert_own ON public.jyotish_queries;
CREATE POLICY jyotish_queries_insert_own ON public.jyotish_queries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_oracle_queries_select_own ON public.jyotish_oracle_queries;
CREATE POLICY jyotish_oracle_queries_select_own ON public.jyotish_oracle_queries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jyotish_oracle_queries_insert_own ON public.jyotish_oracle_queries;
CREATE POLICY jyotish_oracle_queries_insert_own ON public.jyotish_oracle_queries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO public.jyotish_modules (id, tier_required, title, subtitle, sort_order, duration_minutes)
VALUES
  (1, 'free', 'The Eye of the Veda', 'Origin, purpose & sacred context of Jyotish', 1, 15),
  (2, 'free', 'Cosmic Architecture: The 9 Grahas', 'The divine actors in your life story', 2, 27),
  (3, 'free', 'The 12 Rashis (Zodiac Signs)', 'Fields of karmic expression in the sky', 3, 30),
  (4, 'free', 'The 12 Bhāvas (Houses)', 'The map of your life''s karma', 4, 20),
  (5, 'free', '27 Nakshatra Awakening', 'Lunar mansions — your soul''s original frequency', 5, 25),
  (6, 'free', 'Reading Your Own Chart: First Light', 'From theory to the living chart', 6, 20),
  (7, 'prana-flow', 'Planetary Dignity: Strength & Weakness', 'Shadbala and the six pillars of Graha power', 7, NULL),
  (8, 'prana-flow', 'Bhāva Analysis Mastery', 'Precision house reading with every tool', 8, NULL),
  (9, 'prana-flow', 'Aspects & Yogas: Core Combinations', 'The grammar of chart synthesis', 9, NULL),
  (10, 'prana-flow', 'Vimshottari Dasha: The Master Clock', '120-year planetary timing system', 10, NULL),
  (11, 'prana-flow', 'Transit Science (Gochar)', 'Current planetary weather & your karmic window', 11, NULL),
  (12, 'prana-flow', '27 Nakshatras: Complete System', 'Full Nakshatra predictive science', 12, NULL),
  (13, 'prana-flow', 'Pañcāṅga: Sacred Calendar Science', 'The five limbs of living in cosmic rhythm', 13, NULL),
  (14, 'prana-flow', 'Navamsha (D9): The Soul Chart', 'The inner blueprint — reading the 9th divisional', 14, NULL),
  (15, 'siddha-quantum', 'All 16 Divisional Charts (Varga)', 'The 16 lenses of karmic life areas', 15, NULL),
  (16, 'siddha-quantum', 'Ashtakavarga System', 'The 8-source strength grid for transits', 16, NULL),
  (17, 'siddha-quantum', 'Special Dasha Systems', 'Three master clocks beyond Vimshottari', 17, NULL),
  (18, 'siddha-quantum', 'Jaimini Jyotish System', 'The second eye — soul-level Vedic astrology', 18, NULL),
  (19, 'siddha-quantum', 'Prashna Jyotish (Horary)', 'Answering any question without a birth chart', 19, NULL),
  (20, 'siddha-quantum', 'Muhurta: Electional Mastery', 'Choosing the perfect moment for every action', 20, NULL),
  (21, 'siddha-quantum', 'Medical Jyotish', 'Body, disease & healing through the Vedic chart', 21, NULL),
  (22, 'siddha-quantum', 'Relationships & Compatibility', 'Full Vedic synastry science', 22, NULL),
  (23, 'akasha-infinity', 'Bhrigu Nandi Nadi System (BNN)', '5000-year-old predictive palm-leaf science', 23, NULL),
  (24, 'akasha-infinity', 'Nadi Secrets: The 18 Siddhar Transmissions', 'Secret science of the Tamil Siddhars'' palm-leaf oracle', 24, NULL),
  (25, 'akasha-infinity', 'Bhrigu Samhitā Technique', 'The original 500,000-horoscope database of Maharishi Bhrigu', 25, NULL),
  (26, 'akasha-infinity', 'Kālachakra Dasha: Quantum Timing', 'The most secret advanced dasha system — time as spiral', 26, NULL),
  (27, 'akasha-infinity', 'Mundane Jyotish', 'Nations, leaders, collective karma & civilizational cycles', 27, NULL),
  (28, 'akasha-infinity', 'Svara Śāstra: Breath Astrology', 'The most secret Siddha oracle — the breath itself as the answer', 28, NULL),
  (29, 'akasha-infinity', 'Jyotish & Mantra Vidya', 'Planetary seed mantras — the sonic alchemy of Graha pacification', 29, NULL),
  (30, 'akasha-infinity', 'Siddha Parihāram: Advanced Remedial Science', 'Remedies from the Tamil Siddhar tradition — beyond mainstream Jyotish', 30, NULL),
  (31, 'akasha-infinity', 'Spirituality, Moksha & The Chart of Liberation', 'Reading the soul''s journey toward liberation', 31, NULL),
  (32, 'akasha-infinity', 'Chart Reading at Siddha Level', 'Full integration — reading charts as Bhrigu would', 32, NULL)
ON CONFLICT (id) DO NOTHING;