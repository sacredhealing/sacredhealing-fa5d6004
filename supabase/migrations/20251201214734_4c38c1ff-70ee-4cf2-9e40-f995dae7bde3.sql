-- Create music tracks table
CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Sacred Healing',
  description TEXT,
  genre TEXT NOT NULL DEFAULT 'meditation',
  duration_seconds INTEGER NOT NULL DEFAULT 180,
  preview_url TEXT NOT NULL,
  full_audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  price_usd DECIMAL(10, 2) NOT NULL DEFAULT 2.99,
  price_shc INTEGER NOT NULL DEFAULT 100,
  shc_reward INTEGER NOT NULL DEFAULT 10,
  play_count INTEGER NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view music tracks"
ON public.music_tracks FOR SELECT
USING (true);

-- Create purchases table
CREATE TABLE public.music_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('shc', 'stripe', 'paypal', 'crypto')),
  amount_paid DECIMAL(10, 2),
  shc_paid INTEGER,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.music_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their purchases"
ON public.music_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert purchases"
ON public.music_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Now add storage policy for full tracks (after table exists)
CREATE POLICY "Purchased users can download full music"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'music-full' AND
  EXISTS (
    SELECT 1 FROM public.music_purchases mp
    JOIN public.music_tracks mt ON mt.id = mp.track_id
    WHERE mp.user_id = auth.uid()
    AND mt.full_audio_url LIKE '%' || name
  )
);