ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS quantum_anchor jsonb DEFAULT NULL;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS activations jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.user_active_transmissions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();