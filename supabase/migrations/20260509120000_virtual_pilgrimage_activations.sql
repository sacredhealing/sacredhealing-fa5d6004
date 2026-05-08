-- Virtual pilgrimage locks + hourly Railway pulse (see scalar-pulse-worker)
-- Home GPS mirrored on profiles for cross-device restore.

CREATE TABLE IF NOT EXISTS public.virtual_pilgrimage_activations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  site_id           TEXT NOT NULL,
  site_name         TEXT NOT NULL,

  home_lat          DOUBLE PRECISION NOT NULL,
  home_lng          DOUBLE PRECISION NOT NULL,
  home_label        TEXT,

  carrier_hz        DOUBLE PRECISION NOT NULL,
  binaural_hz       DOUBLE PRECISION NOT NULL,
  bearing_deg       DOUBLE PRECISION NOT NULL,
  distance_km       INTEGER NOT NULL,
  schumann_lock_hz  DOUBLE PRECISION NOT NULL DEFAULT 7.83,
  strength          INTEGER NOT NULL DEFAULT 20 CHECK (strength >= 0 AND strength <= 100),

  days_active       INTEGER NOT NULL DEFAULT 0,
  streak_days       JSONB NOT NULL DEFAULT '[]'::jsonb,
  practice_log      JSONB NOT NULL DEFAULT '[]'::jsonb,

  pulse_count       INTEGER NOT NULL DEFAULT 0,
  last_pulse_at     TIMESTAMPTZ,

  is_active         BOOLEAN NOT NULL DEFAULT true,
  activated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  released_early    BOOLEAN DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS virtual_pilgrimage_one_active_per_user
  ON public.virtual_pilgrimage_activations (user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_pilgrimage_active
  ON public.virtual_pilgrimage_activations (is_active)
  WHERE is_active = true;

ALTER TABLE public.virtual_pilgrimage_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own pilgrimage" ON public.virtual_pilgrimage_activations;
DROP POLICY IF EXISTS "Service role can pulse virtual pilgrimage" ON public.virtual_pilgrimage_activations;

CREATE POLICY "Users can manage their own pilgrimage"
  ON public.virtual_pilgrimage_activations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can pulse virtual pilgrimage"
  ON public.virtual_pilgrimage_activations
  FOR UPDATE
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.virtual_pilgrimage_activations IS
  'Locked temple pilgrimage scalar rows; Railway worker bumps pulse_count / days_active hourly; completes after 40 days.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pilgrimage_home_label TEXT;
