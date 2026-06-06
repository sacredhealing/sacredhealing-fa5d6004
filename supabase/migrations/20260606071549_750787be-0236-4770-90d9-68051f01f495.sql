
CREATE TABLE IF NOT EXISTS public.user_active_transmissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activations jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_active_transmissions_user_idx ON public.user_active_transmissions (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_transmissions TO authenticated;
GRANT ALL ON public.user_active_transmissions TO service_role;
ALTER TABLE public.user_active_transmissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their transmissions" ON public.user_active_transmissions;
CREATE POLICY "Users own their transmissions" ON public.user_active_transmissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_quantum_sync (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  library_unlocked boolean NOT NULL DEFAULT false,
  last_scan_at bigint,
  scan_snapshot jsonb,
  top33_matches jsonb,
  top33_matches_ts bigint,
  palm_scan jsonb,
  daily_remedies jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quantum_sync TO authenticated;
GRANT ALL ON public.user_quantum_sync TO service_role;
ALTER TABLE public.user_quantum_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their quantum sync" ON public.user_quantum_sync;
CREATE POLICY "Users own their quantum sync" ON public.user_quantum_sync FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.active_transmissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  transmission_id text,
  transmission_title text,
  transmission_url text,
  transmission_type text NOT NULL DEFAULT 'audio',
  is_playing boolean NOT NULL DEFAULT false,
  playback_position double precision NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_transmissions TO authenticated;
GRANT ALL ON public.active_transmissions TO service_role;
ALTER TABLE public.active_transmissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own active transmission" ON public.active_transmissions;
CREATE POLICY "Users manage own active transmission" ON public.active_transmissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sqi_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sqi_sessions_user_idx ON public.sqi_sessions (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sqi_sessions TO authenticated;
GRANT ALL ON public.sqi_sessions TO service_role;
ALTER TABLE public.sqi_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their sessions" ON public.sqi_sessions;
CREATE POLICY "Users own their sessions" ON public.sqi_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.nadi_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dominant_dosha text,
  nadi_reading text,
  scan_payload jsonb,
  soul_signature text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nadi_baselines_user_idx ON public.nadi_baselines (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nadi_baselines TO authenticated;
GRANT ALL ON public.nadi_baselines TO service_role;
ALTER TABLE public.nadi_baselines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their nadi baselines" ON public.nadi_baselines;
CREATE POLICY "Users own their nadi baselines" ON public.nadi_baselines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
