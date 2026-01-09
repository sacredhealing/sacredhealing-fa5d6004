-- ============================================
-- Gamification & Community Features
-- Steps 3-8: Badges, Streaks, Certificates, Challenges, Live Events, Community Structure
-- ============================================

-- ============================================
-- STEP 3C: Certificates Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('path_completion', 'course_completion', 'challenge_completion', 'special')),
  related_id UUID, -- path_id, course_id, challenge_id, etc.
  title TEXT NOT NULL,
  description TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT, -- URL to generated PDF certificate
  is_shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, certificate_type, related_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates"
ON public.certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates"
ON public.certificates FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STEP 4: Challenges & Group Journeys
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'practice' CHECK (challenge_type IN ('practice', 'meditation', 'healing', 'community')),
  duration_days INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  shc_reward INTEGER DEFAULT 0,
  completion_reward INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meditation_id UUID REFERENCES public.meditations(id),
  task_description TEXT,
  shc_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_days_challenge ON public.challenge_days(challenge_id);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_days ENABLE ROW LEVEL SECURITY;

-- Challenges: Anyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
ON public.challenges FOR SELECT
USING (is_active = true OR auth.uid() = created_by);

-- Challenge participants: Users can view participants of challenges they're in
CREATE POLICY "Users can view challenge participants"
ON public.challenge_participants FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_participants.challenge_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.challenge_participants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Challenge days: Anyone can view
CREATE POLICY "Anyone can view challenge days"
ON public.challenge_days FOR SELECT
USING (true);

-- Admins can manage all
CREATE POLICY "Admins can manage challenges"
ON public.challenges FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STEP 5: Live Events
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'healing_circle' CHECK (event_type IN ('healing_circle', 'meditation', 'workshop', 'qna', 'special')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  zoom_link TEXT,
  external_link TEXT,
  cover_image_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
  rsvp_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_events_scheduled ON public.live_events(scheduled_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_live_events_active ON public.live_events(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_live_event_rsvps_user ON public.live_event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_live_event_rsvps_event ON public.live_event_rsvps(event_id);

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_event_rsvps ENABLE ROW LEVEL SECURITY;

-- Live events: Anyone can view active events
CREATE POLICY "Anyone can view active live events"
ON public.live_events FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

-- RSVPs: Users can manage their own
CREATE POLICY "Users can view own RSVPs"
ON public.live_event_rsvps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can RSVP to events"
ON public.live_event_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP"
ON public.live_event_rsvps FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage live events"
ON public.live_events FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STEP 6: Community Channels Structure
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'group' CHECK (channel_type IN ('announcement', 'support', 'group', 'premium_circle')),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_channels_active ON public.community_channels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_community_channels_type ON public.community_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON public.channel_members(channel_id);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Channels: Users can view active channels they have access to
CREATE POLICY "Users can view accessible channels"
ON public.community_channels FOR SELECT
USING (
  is_active = true AND (
    is_premium = false OR
    EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id = community_channels.id
      AND cm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_memberships um
      JOIN public.membership_tiers mt ON um.tier_id = mt.id
      WHERE um.user_id = auth.uid()
      AND um.status = 'active'
      AND mt.slug IN ('premium', 'stargate')
    )
  )
);

-- Channel members: Users can view members of channels they're in
CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_members.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join channels"
ON public.channel_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage channels"
ON public.community_channels FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default channels
INSERT INTO public.community_channels (name, description, channel_type, is_premium, order_index) VALUES
('Announcements', 'Important updates from the team', 'announcement', false, 1),
('Chat with Guides', 'Free support and guidance', 'support', false, 2),
('General Community', 'Connect with fellow practitioners', 'group', false, 3),
('Premium Circle', 'Exclusive space for premium members', 'premium_circle', true, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3A: Enhanced Streak Tracking
-- ============================================
-- Add function to update streak on session completion
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
  last_completion_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get last completion date from any completion table
  SELECT GREATEST(
    COALESCE((SELECT MAX(completed_at::DATE) FROM public.meditation_completions WHERE user_id = NEW.user_id), '1970-01-01'::DATE),
    COALESCE((SELECT MAX(completed_at::DATE) FROM public.mantra_completions WHERE user_id = NEW.user_id), '1970-01-01'::DATE),
    COALESCE((SELECT MAX(completed_at::DATE) FROM public.music_completions WHERE user_id = NEW.user_id), '1970-01-01'::DATE)
  ) INTO last_completion_date;

  -- Update streak logic
  IF last_completion_date = current_date THEN
    -- Already completed today, don't increment
    RETURN NEW;
  ELSIF last_completion_date = current_date - INTERVAL '1 day' THEN
    -- Completed yesterday, increment streak
    UPDATE public.profiles
    SET streak_days = COALESCE(streak_days, 0) + 1,
        last_activity_date = current_date
    WHERE user_id = NEW.user_id;
  ELSIF last_completion_date < current_date - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    UPDATE public.profiles
    SET streak_days = 1,
        last_activity_date = current_date
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for streak updates (if tables exist)
-- Note: These will be created conditionally to avoid errors if tables don't exist yet

-- ============================================
-- STEP 3B: Additional Badges
-- ============================================
-- Add more achievement badges
INSERT INTO public.achievements (slug, name, description, icon_name, category, requirement_type, requirement_value, shc_reward, badge_color, order_index) VALUES
('first_session', 'First Step', 'Complete your first practice session', 'Sparkles', 'sessions', 'total_sessions', 1, 10, 'bronze', 1),
('inner_peace_complete', 'Inner Peace Guide', 'Complete Inner Peace path', 'Heart', 'special', 'path_completion', 1, 100, 'gold', 11),
('challenge_7_day', '7-Day Warrior', 'Complete a 7-day challenge', 'Trophy', 'special', 'challenge_completion', 1, 150, 'silver', 12),
('live_event_attend', 'Circle Member', 'Attend your first live event', 'Radio', 'community', 'live_events_attended', 1, 50, 'bronze', 13)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_events_updated_at
  BEFORE UPDATE ON public.live_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_channels_updated_at
  BEFORE UPDATE ON public.community_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

