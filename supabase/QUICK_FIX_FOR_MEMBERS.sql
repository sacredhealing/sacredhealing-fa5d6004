-- QUICK FIX: Run this in Supabase SQL Editor to fix member visibility
-- This creates a function that admins can call to fetch members without RLS recursion

-- First, fix the RLS recursion issue (from the migration)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for rooms they belong to" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON public.chat_members;
DROP POLICY IF EXISTS "Admins can view all chat members" ON public.chat_members;

-- Recreate SELECT policies in correct order (admin first, then user policies)
-- Admin bypass: Admins can see ALL members (no recursion, checks user_roles directly)
CREATE POLICY "Admins can view all chat members"
ON public.chat_members
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own memberships (simple, no recursion)
CREATE POLICY "Users can view their own memberships"
ON public.chat_members
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view members of accessible rooms (checks chat_rooms, NOT chat_members - no recursion)
CREATE POLICY "Users can view room members for accessible rooms"
ON public.chat_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_members.room_id
    AND cr.is_active = true
    AND (cr.is_locked = false OR cr.is_locked IS NULL)
  )
);

-- Ensure admin INSERT/UPDATE/DELETE policy exists
DROP POLICY IF EXISTS "Admins can manage members" ON public.chat_members;
CREATE POLICY "Admins can manage members"
ON public.chat_members
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a helper function for admins to fetch members (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_room_members(_room_id uuid)
RETURNS TABLE (
  id uuid,
  room_id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;
  
  -- Return all members for the room (bypasses RLS)
  RETURN QUERY
  SELECT cm.id, cm.room_id, cm.user_id, cm.role, cm.joined_at
  FROM public.chat_members cm
  WHERE cm.room_id = _room_id
  ORDER BY cm.joined_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.get_room_members(uuid) TO authenticated;

-- =============================================================================
-- MULTIMEDIA SUPPORT: Add columns for voice notes, files, images, videos
-- =============================================================================
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'file', 'video')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'error'));

-- Create storage bucket for chat files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-storage',
  'chat-storage',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'audio/ogg', 'audio/webm', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload chat files'
  ) THEN
    CREATE POLICY "Users can upload chat files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view chat files'
  ) THEN
    CREATE POLICY "Users can view chat files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'chat-storage');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own chat files'
  ) THEN
    CREATE POLICY "Users can delete own chat files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'chat-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON public.chat_messages(status);
