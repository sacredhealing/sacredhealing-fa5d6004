-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (admins can manage, users can view their own)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to community_posts for rich media
ALTER TABLE public.community_posts 
ADD COLUMN post_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN audio_url TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN pdf_url TEXT,
ADD COLUMN is_live_recording BOOLEAN DEFAULT false,
ADD COLUMN live_recording_title TEXT,
ADD COLUMN live_recording_description TEXT;

-- Drop existing insert policy and create admin-only insert policy
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;

CREATE POLICY "Admins can create posts"
ON public.community_posts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update delete and update policies to admin only
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;

CREATE POLICY "Admins can delete posts"
ON public.community_posts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
ON public.community_posts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for community uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-uploads', 'community-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community uploads
CREATE POLICY "Anyone can view community uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-uploads');

CREATE POLICY "Admins can upload to community"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update community uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete community uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-uploads' AND public.has_role(auth.uid(), 'admin'));