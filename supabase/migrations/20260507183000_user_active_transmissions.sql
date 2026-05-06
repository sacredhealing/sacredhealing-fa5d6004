-- Persist Quantum Apothecary active transmissions per user (replaces localStorage-only)

CREATE TABLE IF NOT EXISTS public.user_active_transmissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activations jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_active_transmissions_user_idx
  ON public.user_active_transmissions (user_id);

ALTER TABLE public.user_active_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their transmissions"
  ON public.user_active_transmissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
