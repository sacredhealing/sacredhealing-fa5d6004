ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS quantum_anchor jsonb DEFAULT NULL;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS activations jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

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