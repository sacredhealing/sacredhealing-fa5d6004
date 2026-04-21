
-- Stargate community members (admin-managed list)
CREATE TABLE IF NOT EXISTS public.stargate_community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);
ALTER TABLE public.stargate_community_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stargate_community_members' AND policyname='Users can view if they are in the list') THEN
    CREATE POLICY "Users can view if they are in the list"
      ON public.stargate_community_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stargate_community_members' AND policyname='Admins can manage stargate community members') THEN
    CREATE POLICY "Admins can manage stargate community members"
      ON public.stargate_community_members FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_stargate_community_members_user ON public.stargate_community_members(user_id);

-- Call recordings table
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.community_live_sessions(id) ON DELETE SET NULL,
  room_name text NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('dm', 'stargate', 'channel', 'feed')),
  stargate_category text CHECK (stargate_category IN ('healing-chamber', 'bhagavad-gita', 'other')),
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel_id text,
  title text NOT NULL DEFAULT 'Call Recording',
  description text,
  video_url text,
  storage_path text,
  duration_seconds int,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_recordings_host ON public.call_recordings(host_user_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_partner ON public.call_recordings(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_type ON public.call_recordings(call_type);
CREATE INDEX IF NOT EXISTS idx_call_recordings_stargate_cat ON public.call_recordings(stargate_category);
CREATE INDEX IF NOT EXISTS idx_call_recordings_room ON public.call_recordings(room_name);

ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all call recordings"
  ON public.call_recordings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants can view own DM recordings"
  ON public.call_recordings FOR SELECT
  USING (
    call_type = 'dm'
    AND (host_user_id = auth.uid() OR partner_user_id = auth.uid())
  );

CREATE POLICY "Stargate members can view stargate recordings"
  ON public.call_recordings FOR SELECT
  USING (
    call_type = 'stargate'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.stargate_community_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.admin_granted_access
        WHERE user_id = auth.uid()
          AND is_active = true
          AND (
            (access_type = 'program' AND access_id = 'stargate')
            OR access_type = 'stargate'
          )
      )
    )
  );

DROP TRIGGER IF EXISTS trg_call_recordings_updated_at ON public.call_recordings;
CREATE TRIGGER trg_call_recordings_updated_at
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false,
  5368709120,
  ARRAY['video/mp4', 'video/webm', 'audio/mp4', 'audio/webm', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can read call recordings'
  ) THEN
    CREATE POLICY "Admins can read call recordings"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can write call recordings'
  ) THEN
    CREATE POLICY "Admins can write call recordings"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'call-recordings' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
