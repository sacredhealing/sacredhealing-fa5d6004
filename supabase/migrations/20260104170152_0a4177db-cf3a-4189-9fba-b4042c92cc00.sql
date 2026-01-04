-- Create artists table
CREATE TABLE public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  signature_style TEXT,
  total_plays INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add artist_id to music_tracks
ALTER TABLE public.music_tracks 
ADD COLUMN artist_id UUID REFERENCES public.artists(id);

-- Enable RLS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Artists are publicly readable
CREATE POLICY "Artists are viewable by everyone" 
ON public.artists 
FOR SELECT 
USING (true);

-- Only admins can manage artists (via service role)
CREATE POLICY "Admins can manage artists" 
ON public.artists 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create track_ratings table for Phase 5
CREATE TABLE public.track_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

-- Enable RLS for track_ratings
ALTER TABLE public.track_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Track ratings are viewable by everyone" 
ON public.track_ratings 
FOR SELECT 
USING (true);

-- Users can manage their own ratings
CREATE POLICY "Users can create their own ratings" 
ON public.track_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.track_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.track_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create music_bundles table for Phase 6
CREATE TABLE public.music_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_tracks junction table
CREATE TABLE public.bundle_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.music_bundles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0
);

-- Create bundle_purchases table
CREATE TABLE public.bundle_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bundle_id UUID NOT NULL REFERENCES public.music_bundles(id),
  stripe_session_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bundle tables
ALTER TABLE public.music_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

-- Bundles are publicly readable
CREATE POLICY "Bundles are viewable by everyone" 
ON public.music_bundles 
FOR SELECT 
USING (true);

CREATE POLICY "Bundle tracks are viewable by everyone" 
ON public.bundle_tracks 
FOR SELECT 
USING (true);

-- Users can view their own purchases
CREATE POLICY "Users can view their own bundle purchases" 
ON public.bundle_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert purchases (via edge function)
CREATE POLICY "Service can create bundle purchases" 
ON public.bundle_purchases 
FOR INSERT 
WITH CHECK (true);