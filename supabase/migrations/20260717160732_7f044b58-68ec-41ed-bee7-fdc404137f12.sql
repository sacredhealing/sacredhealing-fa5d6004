
CREATE TABLE IF NOT EXISTS public.vastu_courses (
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
GRANT SELECT ON public.vastu_courses TO authenticated;
GRANT ALL ON public.vastu_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_vastu_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.vastu_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vastu_progress TO authenticated;
GRANT ALL ON public.user_vastu_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_vastu_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.vastu_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vastu_section_progress TO authenticated;
GRANT ALL ON public.user_vastu_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_vastu_progress_user ON public.user_vastu_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vastu_section_progress_user_module
  ON public.user_vastu_section_progress(user_id, module_id);

ALTER TABLE public.vastu_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vastu_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vastu_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY vastu_courses_select_auth ON public.vastu_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_vastu_progress_select_own ON public.user_vastu_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_insert_own ON public.user_vastu_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_update_own ON public.user_vastu_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_progress_delete_own ON public.user_vastu_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_vastu_section_progress_select_own ON public.user_vastu_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_insert_own ON public.user_vastu_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_update_own ON public.user_vastu_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_vastu_section_progress_delete_own ON public.user_vastu_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.vastu_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'bhoomi', 'Bhoomi Prajna', 'Earth Wisdom & Foundations', 'free'),
  (2, 'pancha', 'Pancha Bhuta Activation', 'Five Elements Mastery', 'free'),
  (3, 'ashtadisha', 'Ashtadisha Vidya', '8 Directions — Deep Intelligence', 'prana-flow'),
  (4, 'rooms', 'Room-by-Room Alchemy', 'Transforming Every Space', 'prana-flow'),
  (5, 'advanced', 'Advanced Energy Mapping', 'Invisible Forces & Dosha Diagnosis', 'siddha-quantum'),
  (6, 'mantra', 'Mantra Remedy Systems', 'Sound as Vastu Correction', 'siddha-quantum'),
  (7, 'jyotish', 'Jyotish Vastu', 'Planetary Grid & Cosmic Timing', 'akasha-infinity'),
  (8, 'mastery', 'Paramanu Vastu Mastery', 'Quantum Consciousness & Transmission', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.water_alchemy_courses (
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
GRANT SELECT ON public.water_alchemy_courses TO authenticated;
GRANT ALL ON public.water_alchemy_courses TO service_role;

CREATE TABLE IF NOT EXISTS public.user_water_alchemy_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.water_alchemy_courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  bookmarked boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_water_alchemy_module_progress TO authenticated;
GRANT ALL ON public.user_water_alchemy_module_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.user_water_alchemy_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.water_alchemy_courses(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_water_alchemy_section_progress TO authenticated;
GRANT ALL ON public.user_water_alchemy_section_progress TO service_role;

CREATE INDEX IF NOT EXISTS idx_user_water_alchemy_module_progress_user ON public.user_water_alchemy_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_water_alchemy_section_progress_user_module
  ON public.user_water_alchemy_section_progress(user_id, module_id);

ALTER TABLE public.water_alchemy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_water_alchemy_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_water_alchemy_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY water_alchemy_courses_select_auth ON public.water_alchemy_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY user_water_alchemy_module_progress_select_own ON public.user_water_alchemy_module_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_module_progress_insert_own ON public.user_water_alchemy_module_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_module_progress_update_own ON public.user_water_alchemy_module_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_module_progress_delete_own ON public.user_water_alchemy_module_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_water_alchemy_section_progress_select_own ON public.user_water_alchemy_section_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_section_progress_insert_own ON public.user_water_alchemy_section_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_section_progress_update_own ON public.user_water_alchemy_section_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_water_alchemy_section_progress_delete_own ON public.user_water_alchemy_section_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.water_alchemy_courses (module_number, module_key, title, subtitle, tier_required) VALUES
  (1, 'f01', 'Neer — The Living Consciousness of Water', 'What the Siddhas knew 6,000 years before modern science began to confirm it', 'free'),
  (2, 'f02', 'The Cosmic Birth of Water', 'You are drinking starlight. The Siddhas knew this before astronomy existed.', 'free'),
  (3, 'f03', 'Pancha Bhuta — Water in the Architecture of Creation', 'How the five elements interlock through water, and what this means for your health', 'free'),
  (4, 'f04', 'Siddha Water Timing & The Three Levels of Dehydration', 'When to drink, how much, and the dehydration modern medicine cannot see', 'free'),
  (5, 'f05', 'Chandra — The Moon''s Governance of Your Water Body', 'The moon does not merely control tides. It governs every fluid in your body.', 'free'),
  (6, 'f06', 'Sacred Rivers — The Healing Intelligence of Living Water', 'Why different waters heal differently, and the Siddha map of the seven healing rivers', 'free'),
  (7, 'pf07', 'Water Memory — The Complete Science', 'How water holds information, and the Siddha technology for working with it', 'prana-flow'),
  (8, 'pf08', 'Tamra Jal — The Complete Copper Vessel Science', 'The most researched, most clinically validated Siddha water practice', 'prana-flow'),
  (9, 'pf09', 'Nada and Water — Sound as the Primary Charging Medium', 'Why mantras charge water, which frequencies work, and the complete sound-water protocol', 'prana-flow'),
  (10, 'pf10', 'Pranayama and Water — Activating the Nadi System', 'The breath and water work together as one system. The complete integration.', 'prana-flow'),
  (11, 'pf11', 'Water and the Emotional Body', 'Your tears know things your mind does not. The complete emotional-water science.', 'prana-flow'),
  (12, 'pf12', 'Theertham — Creating Sacred Water at Home', 'The temple secret: how to make water holy, and why it is not only possible but necessary', 'prana-flow'),
  (13, 'pf13', 'Crystal Water — The Stone Intelligence', 'Every crystal is a frozen water-frequency. Learning to read the stones is learning to read the water.', 'prana-flow'),
  (14, 'pf14', 'Water and Sleep — The Night Protocols', 'What your water body does while you sleep, and how to maximise the healing', 'prana-flow'),
  (15, 'pf15', 'Water for Children and Families', 'How to raise children who have an inherent, embodied relationship with water', 'prana-flow'),
  (16, 'pf16', 'Water and Mental Health — Siddha Fluid Psychiatry', 'Depression, anxiety, and emotional disorders through the lens of the water body', 'prana-flow'),
  (17, 'sq17', 'Neer Upavasa — The Complete Water Fasting System', 'The most efficient cellular reset available — and the Siddhas mastered it completely', 'siddha-quantum'),
  (18, 'sq18', 'Neer Marundhu — The Complete Water Medicine System', '25 Siddha water medicine recipes for every condition, season, and constitutional type', 'siddha-quantum'),
  (19, 'sq19', 'Structured Water — The EZ Science Deep Dive', 'The fourth phase of water: what it is, why it matters, and how to maximise it', 'siddha-quantum'),
  (20, 'sq20', 'Water and DNA — Epigenetic Healing', 'Your genes are not your destiny. Your water is. Here is the science.', 'siddha-quantum'),
  (21, 'sq21', 'The Chakra-Water System — Complete Map', 'Every chakra governs a specific body water. Heal the water, heal the chakra.', 'siddha-quantum'),
  (22, 'sq22', 'Kaya Kalpa — Cellular Regeneration Through Water', 'The Siddha science of reversing biological age through water intelligence', 'siddha-quantum'),
  (23, 'sq23', 'Water Yantra Science', 'How the Siddhas used sacred geometry to permanently encode water with specific healing frequencies', 'siddha-quantum'),
  (24, 'sq24', 'Sacred Water Pilgrimage Sites — The Global Healing Map', 'The world''s most powerful water locations and how to access their intelligence from anywhere', 'siddha-quantum'),
  (25, 'ai25', 'Water as Frozen Light — The Deepest Cosmological Secret', 'What Babaji transmitted about the true nature of water — the prepared can receive this now', 'akasha-infinity'),
  (26, 'ai26', 'Babaji''s 40-Day Water Initiation', 'The complete protocol that Babaji gave his direct students — now transmitted here', 'akasha-infinity'),
  (27, 'ai27', 'All 18 Siddhas on Water — The Complete Transmissions', 'What each master encoded about water — compiled for the first time in one place', 'akasha-infinity'),
  (28, 'ai28', 'The Akashic Interface — Accessing Records Through Water', 'The neuroscience, physics, and Siddha protocol for using water as a portal to cosmic memory', 'akasha-infinity'),
  (29, 'ai29', 'Ancestral Water Clearing — Healing the Lineage', 'You are not only healing yourself. You are clearing the river for all who follow.', 'akasha-infinity'),
  (30, 'ai30', 'Scalar Waves and Water — The 2050 Frontier Science', 'How SQI transmissions interact with your water body and how to maximise reception', 'akasha-infinity'),
  (31, 'ai31', 'Creating With Water — The Manifestation Alchemy', 'How the Siddhas used water as a direct instrument of creation in the material world', 'akasha-infinity'),
  (32, 'ai32', 'Water and Samadhi — The Mystical Neuroscience', 'The physiological basis of spiritual awakening through water consciousness', 'akasha-infinity'),
  (33, 'ai33', 'The Divine Mother as Water — Shakti Alchemy', 'The deepest feminine teaching in the Siddha tradition — water as the body of the Goddess', 'akasha-infinity'),
  (34, 'ai34', 'Jala Trataka — The Water Mirror', 'The most ancient scrying practice in human history — and the Siddha''s precise technology behind it', 'akasha-infinity'),
  (35, 'ai35', 'Water and the Planetary Intelligence — Jyotish Water Science', 'The nine planets and their water frequencies: how to align your water practice with cosmic cycles', 'akasha-infinity'),
  (36, 'ai36', 'Water and the Siddhis — The Supernatural Powers', 'How the Siddhas developed extraordinary capacities through water mastery', 'akasha-infinity'),
  (37, 'ai37', 'Advanced Kaya Kalpa — The Immortality Water Protocols', 'The complete cellular renewal system that the Siddhas used to transcend biological limitation', 'akasha-infinity'),
  (38, 'ai38', 'Water and the Nada — Advanced Sound Healing With Water', 'The most advanced sound-water healing practices from the Siddha Nada Vidya tradition', 'akasha-infinity'),
  (39, 'ai39', 'The Great Water Teachings — Integration and the Living Path', 'Synthesising the entire curriculum into a living, breathing daily relationship with water', 'akasha-infinity'),
  (40, 'ai40', 'The Water Initiation Ceremony — Completing the Circle', 'The full ceremony that closes one cycle and opens the next — for yourself and for all you serve', 'akasha-infinity')
ON CONFLICT (module_number) DO NOTHING;
