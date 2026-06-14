-- SQI Quantum Anchor System — fixed for actual ssyg schema
-- Actual columns: id, user_id, activation_id (text), activation_data (jsonb), activated_at (timestamptz)

-- 1. Add quantum_anchor column
ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS quantum_anchor jsonb DEFAULT NULL;

-- 2. Add activations jsonb column (the app writes the full array here)
ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS activations jsonb DEFAULT '[]'::jsonb;

-- 3. Add updated_at column
ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. Active quantum fields view (uses actual + new columns)
CREATE OR REPLACE VIEW public.active_quantum_fields AS
SELECT
  uat.user_id,
  uat.updated_at AS last_scan_at,
  (uat.quantum_anchor->>'anchoredAt')::timestamptz AS anchored_at,
  uat.quantum_anchor->>'dominantDosha' AS dosha,
  uat.quantum_anchor->>'nadiReading' AS nadi,
  (uat.quantum_anchor->>'coherenceScore')::int AS coherence,
  jsonb_array_length(COALESCE(uat.activations, '[]'::jsonb)) AS active_transmission_count
FROM public.user_active_transmissions uat
WHERE uat.quantum_anchor IS NOT NULL;

COMMENT ON VIEW public.active_quantum_fields IS
  'Users with active quantum anchors — voice scan completed, ingredient frequency hashes broadcasting.';
