-- =============================================================================
-- RUN THIS WHEN YOU HAVE SQL ACCESS (Supabase Dashboard or Lovable SQL runner)
-- Your Supabase is connected via Lovable; the app works without this migration.
-- When you get access to run SQL (e.g. Supabase Dashboard → SQL Editor), run this once.
-- =============================================================================

-- ----- Mantras: category, planet_type, is_premium -----
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS planet_type text;
ALTER TABLE public.mantras ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- ----- Community: Andlig + Stargate, invite_link, polls, pins -----
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS invite_link text;

ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_type_check;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_type_check
  CHECK (type IN ('community', 'path', 'guide', 'andlig', 'stargate'));

CREATE TABLE IF NOT EXISTS public.stargate_community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id)
);
ALTER TABLE public.stargate_community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view if they are in the list"
  ON public.stargate_community_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage stargate community members"
  ON public.stargate_community_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_stargate_community_members_user ON public.stargate_community_members(user_id);

CREATE TABLE IF NOT EXISTS public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  order_index int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_polls_room ON public.community_polls(room_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_options_poll ON public.community_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_votes_poll ON public.community_poll_votes(poll_id);
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view polls in rooms they can access" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Admins can create and manage polls" ON public.community_polls FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view poll options" ON public.community_poll_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage poll options" ON public.community_poll_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view poll votes" ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own vote" ON public.community_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert Andlig Transformation and Stargate Community rooms (if not exist)
DO $$
DECLARE admin_user_id uuid;
BEGIN
  SELECT user_id INTO admin_user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_user_id IS NULL THEN SELECT user_id INTO admin_user_id FROM public.profiles LIMIT 1; END IF;
  IF admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE type = 'andlig') THEN
    INSERT INTO public.chat_rooms (name, type, path_slug, is_premium, intention, created_by, invite_link)
    VALUES ('Andlig Transformation', 'andlig', NULL, true, 'Open to all active subscribers. Connect and grow together.', admin_user_id, 'https://t.me/sacredhealing_community');
  END IF;
  IF admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE type = 'stargate') THEN
    INSERT INTO public.chat_rooms (name, type, path_slug, is_premium, intention, created_by, invite_link)
    VALUES ('Stargate Community', 'stargate', NULL, true, 'Private space for Stargate members and invited souls.', admin_user_id, NULL);
  END IF;
END $$;
