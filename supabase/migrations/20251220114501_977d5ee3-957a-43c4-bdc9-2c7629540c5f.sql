-- Create curated playlists table for admin-managed playlists
CREATE TABLE public.curated_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'featured',
  content_type TEXT NOT NULL DEFAULT 'music', -- 'music' or 'meditation'
  mood TEXT, -- calm, energetic, focus, etc.
  theme TEXT, -- healing, spiritual, workout, etc.
  duration_range TEXT, -- short, medium, long
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for playlist items
CREATE TABLE public.curated_playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.curated_playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  meditation_id UUID REFERENCES public.meditations(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_content_type CHECK (
    (track_id IS NOT NULL AND meditation_id IS NULL) OR 
    (track_id IS NULL AND meditation_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.curated_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_playlist_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view active curated playlists (public browsing)
CREATE POLICY "Anyone can view active curated playlists" 
ON public.curated_playlists 
FOR SELECT 
USING (is_active = true);

-- Admins can manage curated playlists
CREATE POLICY "Admins can manage curated playlists" 
ON public.curated_playlists 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view playlist items
CREATE POLICY "Anyone can view curated playlist items" 
ON public.curated_playlist_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.curated_playlists 
    WHERE id = playlist_id AND is_active = true
  )
);

-- Admins can manage playlist items
CREATE POLICY "Admins can manage curated playlist items" 
ON public.curated_playlist_items 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for efficient querying
CREATE INDEX idx_curated_playlists_content_type ON public.curated_playlists(content_type);
CREATE INDEX idx_curated_playlists_category ON public.curated_playlists(category);
CREATE INDEX idx_curated_playlists_mood ON public.curated_playlists(mood);
CREATE INDEX idx_curated_playlist_items_playlist ON public.curated_playlist_items(playlist_id);
CREATE INDEX idx_curated_playlist_items_track ON public.curated_playlist_items(track_id);
CREATE INDEX idx_curated_playlist_items_meditation ON public.curated_playlist_items(meditation_id);

-- Create trigger for updated_at
CREATE TRIGGER update_curated_playlists_updated_at
BEFORE UPDATE ON public.curated_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();