
-- Store active 24/7 transmissions per user so they survive cache clears
CREATE TABLE public.user_active_transmissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activation_id text NOT NULL,
  activation_data jsonb NOT NULL DEFAULT '{}',
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activation_id)
);

ALTER TABLE public.user_active_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transmissions"
  ON public.user_active_transmissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transmissions"
  ON public.user_active_transmissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transmissions"
  ON public.user_active_transmissions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
