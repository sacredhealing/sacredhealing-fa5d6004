-- ═══════════════════════════════════════════════════════════════
-- SQI UNIFIED FIELD CONTEXT — Supabase Migration
-- Run in Supabase SQL Editor (project ssygukfdbtehvtndandn)
-- ═══════════════════════════════════════════════════════════════

-- 1. Nadi Scan Results (persists each user's scan)
CREATE TABLE IF NOT EXISTS nadi_scan_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_nadi TEXT,
  heart_rate INTEGER,
  hrv_rmssd INTEGER,
  hrv_sdnn INTEGER,
  hrv_lfhf NUMERIC(5,2),
  respiratory_rate INTEGER,
  vagal_tone TEXT,
  prana_coherence INTEGER,
  autonomic_balance TEXT,
  chakra_state TEXT,
  blockage_location TEXT,
  prescription JSONB,
  confidence NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE nadi_scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own nadi scans" ON nadi_scan_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own nadi scans" ON nadi_scan_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Ayurveda Profiles (add columns if table exists)
ALTER TABLE ayurveda_profiles
  ADD COLUMN IF NOT EXISTS vata_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pitta_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kapha_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dominant_dosha TEXT,
  ADD COLUMN IF NOT EXISTS imbalances JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS agni_strength TEXT DEFAULT 'Moderate',
  ADD COLUMN IF NOT EXISTS oja_level TEXT DEFAULT 'Moderate',
  ADD COLUMN IF NOT EXISTS recommended_herbs JSONB DEFAULT '[]';

-- If table doesn't exist yet:
CREATE TABLE IF NOT EXISTS ayurveda_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  prakriti TEXT,
  vata_percent INTEGER DEFAULT 0,
  pitta_percent INTEGER DEFAULT 0,
  kapha_percent INTEGER DEFAULT 0,
  dominant_dosha TEXT,
  imbalances JSONB DEFAULT '[]',
  agni_strength TEXT DEFAULT 'Moderate',
  oja_level TEXT DEFAULT 'Moderate',
  recommended_herbs JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ayurveda_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own ayurveda" ON ayurveda_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Photonic Sessions
CREATE TABLE IF NOT EXISTS photonic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  active_protocol TEXT,
  light_code_active BOOLEAN DEFAULT FALSE,
  frequency NUMERIC(8,2),
  cellular_target TEXT,
  session_duration INTEGER DEFAULT 0,
  photon_density TEXT DEFAULT 'Moderate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE photonic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own photonic" ON photonic_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Temple Home Sessions (add fields if table exists)
ALTER TABLE temple_home_sessions
  ADD COLUMN IF NOT EXISTS active_site TEXT,
  ADD COLUMN IF NOT EXISTS site_essence TEXT,
  ADD COLUMN IF NOT EXISTS intensity INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS crystal_grid_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anchored_since TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════
-- QUANTUM APOTHECARY WIRING — Add to QuantumApothecary.tsx
-- ═══════════════════════════════════════════════════════════════

/*
STEP 1 — Import the hook at top of QuantumApothecary.tsx:

import { useSQIFieldContext } from "@/hooks/useSQIFieldContext";
import NadiScanner from "@/components/NadiScanner";

STEP 2 — Inside the component:

const sqiField = useSQIFieldContext();

STEP 3 — Replace the existing jyotishContext string with:

const fullFieldContext = sqiField.compiledContext;

STEP 4 — Pass to streamChatWithSQI:

// Find where streamChatWithSQI is called and add fullFieldContext
// as the context parameter (replaces old jyotishContext)
streamChatWithSQI(message, conversationHistory, fullFieldContext);

STEP 5 — Add NadiScanner with live update callback:

<NadiScanner
  userName={profile?.full_name?.split(" ")[0] ?? "Seeker"}
  jyotishContext={{
    mahadasha: sqiField.jyotish?.mahadasha,
    nakshatra: sqiField.jyotish?.moonNakshatra,
  }}
  onScanComplete={(reading) => {
    sqiField.updateNadi({
      activatedNadi: reading.activatedNadi,
      heartRate: reading.rawVitals.heart_rate,
      hrvRmssd: reading.rawVitals.hrv_rmssd ?? 0,
      respiratoryRate: reading.rawVitals.respiratory_rate,
      vagalTone: reading.vagalTone,
      pranaCoherence: reading.activeNadis,
      autonomicBalance: reading.autonomicBalance,
      scannedAt: new Date().toISOString(),
    });
  }}
/>

STEP 6 — Show active fields indicator above chat:

{!sqiField.loading && (
  <div className="flex flex-wrap gap-2 mb-4 px-1">
    {sqiField.temple?.activeSite && (
      <span className="field-pill">
        ◈ {sqiField.temple.activeSite} · {sqiField.temple.intensity}%
      </span>
    )}
    {sqiField.ayurveda?.prakriti && (
      <span className="field-pill">
        ⊕ {sqiField.ayurveda.prakriti}
      </span>
    )}
    {sqiField.photonic?.lightCodeActive && (
      <span className="field-pill cyan">
        ≋ {sqiField.photonic.frequency}Hz Active
      </span>
    )}
    {sqiField.nadi?.activatedNadi && (
      <span className="field-pill">
        ~ {sqiField.nadi.activatedNadi} Nadi
      </span>
    )}
  </div>
)}

Add CSS for .field-pill:
.field-pill {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.8);
  background: rgba(212,175,55,0.06);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 30px;
  padding: 4px 10px;
}
.field-pill.cyan {
  color: rgba(34,211,238,0.8);
  background: rgba(34,211,238,0.06);
  border-color: rgba(34,211,238,0.2);
}
*/

-- ═══════════════════════════════════════════════════════════════
-- AYURVEDA PAGE — Save scan result to DB
-- Add this after Agastya Muni returns the Prakriti result
-- In wherever the scan result is handled:
-- ═══════════════════════════════════════════════════════════════

/*
After the Prakriti scan completes, save to ayurveda_profiles:

await supabase.from("ayurveda_profiles").upsert({
  user_id: user.id,
  prakriti: result.prakriti,          // e.g. "Vata-Pitta"
  vata_percent: result.vataPercent,
  pitta_percent: result.pittaPercent,
  kapha_percent: result.kaphaPercent,
  dominant_dosha: result.dominantDosha,
  imbalances: result.imbalances,
  agni_strength: result.agniStrength,
  oja_level: result.ojaLevel,
  recommended_herbs: result.herbs,
  updated_at: new Date().toISOString(),
}, { onConflict: "user_id" });
*/

-- ═══════════════════════════════════════════════════════════════
-- PHOTONIC PAGE — Save active session to DB
-- Add when user activates a light code protocol:
-- ═══════════════════════════════════════════════════════════════

/*
When user starts a photonic session:

await supabase.from("photonic_sessions").insert({
  user_id: user.id,
  active_protocol: selectedProtocol.name,   // e.g. "DNA Repair"
  light_code_active: true,
  frequency: selectedProtocol.hz,            // e.g. 528
  cellular_target: selectedProtocol.target,  // e.g. "Mitochondrial activation"
  session_duration: durationMinutes,
  photon_density: selectedProtocol.density,
  created_at: new Date().toISOString(),
});
*/

-- ═══════════════════════════════════════════════════════════════
-- TEMPLE HOME — Save active session to DB
-- Add when user anchors a sacred site:
-- ═══════════════════════════════════════════════════════════════

/*
When user presses "Anchor Temple":

await supabase.from("temple_home_sessions").upsert({
  user_id: user.id,
  active_site: selectedSite.name,
  site_essence: selectedSite.essence,
  intensity: intensityValue,
  crystal_grid_active: crystalGridComplete,
  anchored_since: new Date().toISOString(),
}, { onConflict: "user_id" });
*/
