-- Create user playlists table
CREATE TABLE public.user_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist tracks junction table with order
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.user_playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Create user play history table
CREATE TABLE public.music_play_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  play_count INTEGER NOT NULL DEFAULT 1,
  last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_play_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_playlists
CREATE POLICY "Users can view own playlists" ON public.user_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create playlists" ON public.user_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.user_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.user_playlists FOR DELETE USING (auth.uid() = user_id);

-- Policies for playlist_tracks
CREATE POLICY "Users can view own playlist tracks" ON public.playlist_tracks FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can add to own playlists" ON public.playlist_tracks FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own playlist tracks" ON public.playlist_tracks FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can remove from own playlists" ON public.playlist_tracks FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid()));

-- Policies for music_play_history
CREATE POLICY "Users can view own play history" ON public.music_play_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert play history" ON public.music_play_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own play history" ON public.music_play_history FOR UPDATE USING (auth.uid() = user_id);

-- Add release_date to music_tracks if not exists
ALTER TABLE public.music_tracks ADD COLUMN IF NOT EXISTS release_date DATE DEFAULT CURRENT_DATE;

-- Trigger for updated_at
CREATE TRIGGER update_user_playlists_updated_at BEFORE UPDATE ON public.user_playlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();