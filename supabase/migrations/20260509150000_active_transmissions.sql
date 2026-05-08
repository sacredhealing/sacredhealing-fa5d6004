-- Cross-device "Now Playing" resume (music + meditation/healing URLs + position)

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

ALTER TABLE public.active_transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own active transmission"
  ON public.active_transmissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
