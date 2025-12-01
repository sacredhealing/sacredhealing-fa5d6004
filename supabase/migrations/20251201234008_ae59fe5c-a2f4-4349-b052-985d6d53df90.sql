-- Create table for YouTube channel configuration
CREATE TABLE public.youtube_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id text NOT NULL UNIQUE,
  channel_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

-- Anyone can view active channels
CREATE POLICY "Anyone can view active channels" 
ON public.youtube_channels FOR SELECT 
USING (is_active = true);

-- Authenticated users can manage channels (admin)
CREATE POLICY "Authenticated users can manage channels" 
ON public.youtube_channels FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create table for video watch completions and rewards
CREATE TABLE public.video_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_title text,
  shc_earned integer NOT NULL DEFAULT 3,
  watched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view own video completions" 
ON public.video_completions FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own video completions" 
ON public.video_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);