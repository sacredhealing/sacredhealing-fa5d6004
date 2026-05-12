-- ============================================================
-- SQI STARGATE + COMMUNITY OVERHAUL MIGRATION
-- File: supabase/migrations/20250512000001_stargate_community_overhaul.sql
-- ============================================================

-- 1. STARGATE MEETINGS SCHEDULE
CREATE TABLE IF NOT EXISTS public.stargate_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_id uuid REFERENCES auth.users(id),
  daily_room_name text,          -- Daily.co room name
  daily_room_url text,           -- Daily.co room URL
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  recording_url text,            -- saved after meeting ends
  recording_saved boolean DEFAULT false,
  thumbnail_url text,
  tier_required text DEFAULT 'prana_flow' CHECK (tier_required IN ('free','prana_flow','siddha_quantum','akasha_infinity')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.stargate_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetings" ON public.stargate_meetings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage meetings" ON public.stargate_meetings
  FOR ALL USING (
    auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
    OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- 2. STARGATE RECORDINGS (linked to course content)
CREATE TABLE IF NOT EXISTS public.stargate_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.stargate_meetings(id) ON DELETE CASCADE,
  daily_recording_id text,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  duration_seconds int,
  thumbnail_url text,
  transcript_text text,
  course_module text,            -- which Stargate course section this belongs to
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT false,
  tier_required text DEFAULT 'prana_flow',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stargate_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view published recordings" ON public.stargate_recordings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      is_published = true
      OR auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
    )
  );

CREATE POLICY "Admins can manage recordings" ON public.stargate_recordings
  FOR ALL USING (
    auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid
  );

-- 3. COMMUNITY CHANNELS (ensure proper structure)
CREATE TABLE IF NOT EXISTS public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  icon text DEFAULT '✦',
  channel_type text DEFAULT 'text' CHECK (channel_type IN ('text','announcement','stargate','voice')),
  tier_required text DEFAULT 'free',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active channels" ON public.community_channels
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage channels" ON public.community_channels
  FOR ALL USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);

-- Insert default channels if not exist
INSERT INTO public.community_channels (name, display_name, description, icon, channel_type, tier_required, sort_order)
VALUES
  ('announcements',    'Announcements',       'Sacred transmissions from the Siddhas',         '📡', 'announcement', 'free',            1),
  ('stargate',         'Stargate Chamber',    'Live video transmissions & recordings',          '🌀', 'stargate',     'prana_flow',      2),
  ('quantum-healing',  'Quantum Healing',     'Share your healing experiences & breakthroughs','✦',  'text',         'prana_flow',      3),
  ('siddha-wisdom',    'Siddha Wisdom',       'Ancient teachings, mantras & Vedic codes',      '🔱', 'text',         'prana_flow',      4),
  ('akashic-field',    'Akashic Field',       'Deep transmissions - Siddha Quantum members',   '🌌', 'text',         'siddha_quantum',  5),
  ('prosperity-codes', 'Prosperity Codes',    'Wealth alchemy & abundance activations',        '⚡', 'text',         'siddha_quantum',  6),
  ('infinity-council', 'Infinity Council',    'Akasha-Infinity sovereign circle',              '♾️', 'text',         'akasha_infinity', 7)
ON CONFLICT (name) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description  = EXCLUDED.description,
      icon         = EXCLUDED.icon,
      tier_required = EXCLUDED.tier_required,
      sort_order   = EXCLUDED.sort_order;

-- 4. COMMUNITY MESSAGES (add missing columns if not present)
DO $$ BEGIN
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.community_channels(id);
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.community_messages(id);
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
  ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE public.community_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid REFERENCES public.community_channels(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    reply_to_id uuid REFERENCES public.community_messages(id),
    reactions jsonb DEFAULT '{}',
    edited_at timestamptz,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Members can read messages" ON public.community_messages FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "Members can insert messages" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own messages" ON public.community_messages FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Admins can delete any message" ON public.community_messages FOR DELETE USING (auth.uid() = 'bd0b21c9-577a-450b-bb1e-21c9d0423f17'::uuid);
END $$;

-- 5. MEETING RSVP / REMINDERS
CREATE TABLE IF NOT EXISTS public.meeting_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.stargate_meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

ALTER TABLE public.meeting_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own RSVPs" ON public.meeting_rsvps FOR ALL USING (auth.uid() = user_id);

-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stargate_meetings;
