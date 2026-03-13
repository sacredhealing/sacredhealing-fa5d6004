-- Community notification system
-- Run in Supabase SQL Editor or via: supabase db push

-- Push token storage (for browser + mobile push)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_live BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_post BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_message BOOLEAN DEFAULT true;

-- In-app notification bell feed
CREATE TABLE IF NOT EXISTS community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel_id TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_notifications_user_id ON community_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_community_notifications_created_at ON community_notifications(created_at DESC);

ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON community_notifications;
CREATE POLICY "Users see own notifications" ON community_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE community_notifications;
