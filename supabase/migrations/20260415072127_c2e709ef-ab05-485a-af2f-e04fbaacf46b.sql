CREATE TABLE IF NOT EXISTS nadi_scan_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activated_nadi TEXT, heart_rate INTEGER, hrv_rmssd INTEGER,
  hrv_sdnn INTEGER, hrv_lfhf NUMERIC(5,2), respiratory_rate INTEGER,
  vagal_tone TEXT, prana_coherence INTEGER, autonomic_balance TEXT,
  chakra_state TEXT, blockage_location TEXT, prescription JSONB,
  confidence NUMERIC(4,2), created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nadi_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own nadi scans" ON nadi_scan_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own nadi scans" ON nadi_scan_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE ayurveda_profiles
  ADD COLUMN IF NOT EXISTS vata_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pitta_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kapha_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dominant_dosha TEXT,
  ADD COLUMN IF NOT EXISTS prakriti TEXT,
  ADD COLUMN IF NOT EXISTS agni_strength TEXT DEFAULT 'Moderate',
  ADD COLUMN IF NOT EXISTS oja_level TEXT DEFAULT 'Moderate',
  ADD COLUMN IF NOT EXISTS imbalances JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended_herbs JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS photonic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  active_protocol TEXT, light_code_active BOOLEAN DEFAULT FALSE,
  frequency NUMERIC(8,2), cellular_target TEXT,
  session_duration INTEGER DEFAULT 0, photon_density TEXT DEFAULT 'Moderate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE photonic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own photonic sessions" ON photonic_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS temple_home_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  active_site TEXT, site_essence TEXT, intensity INTEGER DEFAULT 50,
  crystal_grid_active BOOLEAN DEFAULT FALSE, anchored_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE temple_home_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own temple sessions" ON temple_home_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);