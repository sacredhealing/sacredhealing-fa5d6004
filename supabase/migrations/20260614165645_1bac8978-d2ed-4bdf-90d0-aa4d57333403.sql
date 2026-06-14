-- Add columns first (safe if already exist)
ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS quantum_anchor jsonb DEFAULT NULL;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS activations jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Clean only YOUR account: remove activations where expiresAt is past
-- Keeps anything with no expiresAt OR expiresAt in the future
UPDATE public.user_active_transmissions
SET activations = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(activations) AS elem
  WHERE 
    -- Keep if no expiresAt (permanent)
    (elem->>'expiresAt') IS NULL
    OR
    -- Keep if expiresAt is in the future
    (elem->>'expiresAt')::timestamptz > now()
),
updated_at = now()
WHERE user_id = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';