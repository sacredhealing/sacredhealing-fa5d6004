-- SQI 2050 — Temple scalar lock rows (Railway hourly pulse updates pulse_count / last_pulse_at)
-- Aligns with scalar-pulse-worker and optional legacy SiddhaActivation flows using this table.

CREATE TABLE IF NOT EXISTS public.temple_activations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id          text NOT NULL,
  place_name        text NOT NULL,
  place_location    text,
  place_frequency   numeric,
  is_active         boolean NOT NULL DEFAULT true,
  activated_at      timestamptz NOT NULL DEFAULT now(),
  deactivated_at    timestamptz,
  lock_code         text NOT NULL,
  last_pulse_at     timestamptz NOT NULL DEFAULT now(),
  pulse_count       bigint NOT NULL DEFAULT 1,
  scalar_intensity  numeric NOT NULL DEFAULT 100.0,
  siddha_field      jsonb DEFAULT '[]'::jsonb,
  activated_device  text,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS temple_activations_user_active_idx
  ON public.temple_activations (user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS temple_activations_active_idx
  ON public.temple_activations (is_active, last_pulse_at)
  WHERE is_active = true;

ALTER TABLE public.temple_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activation" ON public.temple_activations;
DROP POLICY IF EXISTS "Users can insert own activation" ON public.temple_activations;
DROP POLICY IF EXISTS "Users can update own activation" ON public.temple_activations;
DROP POLICY IF EXISTS "Service role can pulse all activations" ON public.temple_activations;

CREATE POLICY "Users can view own activation"
  ON public.temple_activations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activation"
  ON public.temple_activations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activation"
  ON public.temple_activations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can pulse all activations"
  ON public.temple_activations FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_temple_activation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS temple_activations_updated_at ON public.temple_activations;
CREATE TRIGGER temple_activations_updated_at
  BEFORE UPDATE ON public.temple_activations
  FOR EACH ROW EXECUTE FUNCTION public.update_temple_activation_timestamp();

COMMENT ON TABLE public.temple_activations IS
  'SQI 2050 — Temple scalar lock; Railway scalar-pulse-worker bumps pulse_count hourly.';
