-- Create music_albums table
CREATE TABLE public.music_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Sacred Healing',
  description TEXT,
  cover_image_url TEXT,
  price_usd NUMERIC NOT NULL DEFAULT 9.99,
  release_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create album_tracks junction table to link albums and tracks
CREATE TABLE public.album_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.music_albums(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(album_id, track_id)
);

-- Create album_purchases table
CREATE TABLE public.album_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  album_id UUID NOT NULL REFERENCES public.music_albums(id) ON DELETE CASCADE,
  amount_paid NUMERIC,
  payment_method TEXT NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_albums (public read, authenticated write)
CREATE POLICY "Anyone can view albums" ON public.music_albums FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert albums" ON public.music_albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update albums" ON public.music_albums FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete albums" ON public.music_albums FOR DELETE USING (true);

-- RLS policies for album_tracks
CREATE POLICY "Anyone can view album tracks" ON public.album_tracks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage album tracks" ON public.album_tracks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for album_purchases
CREATE POLICY "Users can view their album purchases" ON public.album_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert album purchases" ON public.album_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);