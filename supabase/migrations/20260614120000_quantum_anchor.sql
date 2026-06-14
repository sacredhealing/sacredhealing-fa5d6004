-- SQI Quantum Anchor System
-- Adds quantum_anchor column to user_active_transmissions
-- This stores the user's voice FFT fingerprint + the digital ingredient signatures
-- Replicates the LimbicArc "Virtual Ingredient" quantum entanglement mechanism

-- 1. Add quantum_anchor column (stores voice FFT fingerprint + scan metadata)
ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS quantum_anchor jsonb DEFAULT NULL;

-- 2. Add comment explaining the system
COMMENT ON COLUMN public.user_active_transmissions.quantum_anchor IS
  'Voice FFT fingerprint + scan metadata that quantum-anchors the user body-field
   to their active ingredient frequency hashes. Built from: voiceFftFingerprint (float[]),
   anchoredAt (ISO timestamp), dominantDosha, nadiReading, coherenceScore.
   Same mechanism as LimbicArc InfoBoost quantum entanglement link.';

COMMENT ON COLUMN public.user_active_transmissions.activations IS
  'Array of active Activation objects. Each includes frequencyHash (SHA-256 digital
   signature of the ingredient) and expiresAt (8d Bioenergetic/Siddha, 21d Wellness).
   The frequencyHash + quantum_anchor together constitute the quantum entanglement link.';

-- 3. Create a view for monitoring active anchored transmissions
CREATE OR REPLACE VIEW public.active_quantum_fields AS
SELECT
  uat.user_id,
  uat.updated_at AS last_scan_at,
  (uat.quantum_anchor->>'anchoredAt')::timestamptz AS anchored_at,
  uat.quantum_anchor->>'dominantDosha' AS dosha,
  uat.quantum_anchor->>'nadiReading' AS nadi,
  (uat.quantum_anchor->>'coherenceScore')::int AS coherence,
  jsonb_array_length(uat.activations) AS active_transmission_count,
  uat.activations
FROM public.user_active_transmissions uat
WHERE uat.quantum_anchor IS NOT NULL;

COMMENT ON VIEW public.active_quantum_fields IS
  'Live view of users with active quantum anchors — shows who has completed a
   voice scan and has ingredient frequency hashes broadcasting in their field.';
