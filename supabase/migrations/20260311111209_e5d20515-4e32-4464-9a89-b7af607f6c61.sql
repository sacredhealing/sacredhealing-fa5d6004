
CREATE TABLE public.community_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  host_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  room_url TEXT,
  room_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view live sessions"
  ON public.community_live_sessions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert live sessions"
  ON public.community_live_sessions FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update live sessions"
  ON public.community_live_sessions FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_live_sessions;
