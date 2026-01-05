-- Add new columns to chat_rooms for Sacred Circles
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('community', 'path', 'guide')) DEFAULT 'community',
ADD COLUMN IF NOT EXISTS path_slug text,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS intention text,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- Add is_pinned column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create chat_members table for membership tracking
CREATE TABLE IF NOT EXISTS public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- Enable RLS on chat_members
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Policies for chat_members
CREATE POLICY "Users can view their own memberships" 
ON public.chat_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view room members for rooms they belong to" 
ON public.chat_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_members cm 
  WHERE cm.room_id = chat_members.room_id 
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Users can join rooms" 
ON public.chat_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" 
ON public.chat_members 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_members_room_id ON public.chat_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON public.chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_path_slug ON public.chat_rooms(path_slug);

-- Get admin user ID
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT ur.user_id INTO admin_user_id 
  FROM public.user_roles ur 
  WHERE ur.role = 'admin' 
  LIMIT 1;
  
  -- If no admin found, use first user
  IF admin_user_id IS NULL THEN
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    LIMIT 1;
  END IF;
  
  -- Insert default Sacred Circle rooms
  INSERT INTO public.chat_rooms (name, type, path_slug, is_premium, intention, created_by)
  VALUES 
    ('Community Lounge', 'community', NULL, true, 'A sacred space for presence, reflection, and connection with fellow seekers.', admin_user_id),
    ('Inner Peace Circle', 'path', 'inner-peace', true, 'Gather in stillness. Share your journey to inner calm and serenity.', admin_user_id),
    ('Awaken Your Inner Sight', 'path', 'awaken-inner-sight', true, 'Explore intuition, visions, and the awakening of inner wisdom.', admin_user_id),
    ('Deep Healing Circle', 'path', 'deep-healing', true, 'A compassionate space for those on a healing journey.', admin_user_id),
    ('Sleep Sanctuary Circle', 'path', 'sleep-sanctuary', true, 'Rest, restore, and share practices for peaceful sleep.', admin_user_id),
    ('Focus Mastery Circle', 'path', 'focus-mastery', true, 'Sharpen your mind and share focus techniques with fellow practitioners.', admin_user_id),
    ('Guide Channel', 'guide', NULL, true, 'Teachings, reflections, and wisdom from your guides.', admin_user_id)
  ON CONFLICT DO NOTHING;
END $$;

-- Enable realtime for chat_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;